//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//
//  Redistribution and use in source and binary forms, with or without modification,
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice,
//  this list of conditions and the following disclaimer in the documentation and/or
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be
//  used to endorse or promote products derived from this software without specific
//  prior written permission.

// jshint quotmark:false
// jshint latedef:nofunc
// jscs:disable validateQuoteMarks
// jscs:disable requireCamelCaseOrUpperCaseIdentifiers

define(['jquery', 'URIjs', 'readium_shared_js/globals', 'readium_shared_js/helpers', 'readium_shared_js/views/iframe_loader', 'underscore',
'./discover_content_type'],
function ($, URI, Globals, Helpers, IFrameLoader, _, ContentTypeDiscovery) {

    'use strict';

    var debugMode = Globals.DEBUG_MODE;

    var ZipIframeLoader = function (getCurrentResourceFetcher, contentDocumentTextPreprocessor) {

        var isIE = window.navigator.userAgent.indexOf("Trident") > 0 || window.navigator.userAgent.indexOf("Edge") > 0;

        var basicIframeLoader = new IFrameLoader();

        var self = this;

        var _contentDocumentTextPreprocessor = contentDocumentTextPreprocessor;

        this.addIFrameWindowEventListener = basicIframeLoader.addIFrameWindowEventListener.bind(basicIframeLoader);

        this.removeIFrameWindowEventListener = basicIframeLoader.removeIFrameWindowEventListener.bind(basicIframeLoader);

        this.addIFrameDocumentEventListener = basicIframeLoader.addIFrameDocumentEventListener.bind(basicIframeLoader);

        this.removeIFrameDocumentEventListener = basicIframeLoader.removeIFrameDocumentEventListener.bind(basicIframeLoader);

        this.updateIframeEvents = function (iframe) {
            basicIframeLoader.updateIframeEvents(iframe);
        };

        this.loadIframe = function (iframe, src, callback, caller, attachedData) {
            if (!iframe.baseURI) {
                if (isIE && iframe.ownerDocument.defaultView.frameElement) {
                    iframe.baseURI = iframe.ownerDocument.defaultView.frameElement.getAttribute("data-loadUri");
                    if (debugMode) {
                        console.log("EPUB doc iframe src (BEFORE): %o", src);
                    }
                    src = new URI(src).absoluteTo(iframe.baseURI).search('').hash('').toString();
                } else if (typeof location !== 'undefined') {
                    iframe.baseURI = location.href + "";
                }

                console.error("!iframe.baseURI => " + iframe.baseURI);
            }

            iframe.setAttribute("data-src", src);
            iframe.setAttribute("data-baseUri", iframe.baseURI);
            var loadedDocumentUri = new URI(src).absoluteTo(iframe.baseURI).search('').hash('').toString();
            iframe.setAttribute("data-loadUri", loadedDocumentUri);

            if (debugMode) {
                console.log("EPUB doc iframe src: %o", src);
                console.log("EPUB doc iframe base URI: %o", iframe.baseURI);
                console.log("EPUB doc iframe LOAD URI: %o", loadedDocumentUri);
            }

            var shouldConstructDomProgrammatically = getCurrentResourceFetcher().shouldConstructDomProgrammatically();
            if (shouldConstructDomProgrammatically) {
                getCurrentResourceFetcher().fetchContentDocument(attachedData, loadedDocumentUri,
                    function (resolvedContentDocumentDom) {
                        self._loadIframeWithDocument(iframe,
                            attachedData,
                            resolvedContentDocumentDom.documentElement.outerHTML,
                            function () {
                                callback.call(caller, true, attachedData);
                            });
                    }, function () {
                        callback.call(caller, false, attachedData);
                    }
                );
            } else {
                fetchContentDocument(loadedDocumentUri, function (contentDocumentHtml) {
                    if (!contentDocumentHtml) {
                        //failed to load content document
                        callback.call(caller, false, attachedData);
                    } else {
                        self._loadIframeWithDocument(iframe, attachedData, contentDocumentHtml, function () {
                            callback.call(caller, true, attachedData);
                        });
                    }
                });
            }
        };

        this._loadIframeWithDocument = function (iframe, attachedData, contentDocumentData, callback) {
            var documentDataUri;
            if (!isIE) {
                var contentType = 'text/html';
                if (attachedData.spineItem.media_type && attachedData.spineItem.media_type.length) {
                    contentType = attachedData.spineItem.media_type;
                }

                documentDataUri = window.URL.createObjectURL(Helpers.createBlob([contentDocumentData], contentType));
            } else {
                // Internet Explorer doesn't handle loading documents from Blobs correctly.
                // TODO: Currently using the document.write() approach only for IE, as it breaks CSS selectors
                // with namespaces for some reason (e.g. the childrens-media-query sample EPUB)
                iframe.contentWindow.document.open();

                // Currently not handled automatically by winstore-jscompat,
                // so we're doing it manually. See:
                // https://github.com/MSOpenTech/winstore-jscompat/
                if (window.MSApp && window.MSApp.execUnsafeLocalFunction) {
                    window.MSApp.execUnsafeLocalFunction(function () {
                        iframe.contentWindow.document.write(contentDocumentData);
                    });
                } else {
                    iframe.contentWindow.document.write(contentDocumentData);
                }
            }

            iframe.onload = function () {
                self._onIframeLoad(iframe, callback, attachedData);
                if (!isIE) {
                    window.URL.revokeObjectURL(documentDataUri);
                }
            };

            if (!isIE) {
                iframe.setAttribute("src", documentDataUri);
            } else {
                iframe.contentWindow.document.close();
            }
        };

        this._onIframeLoad = function (iframe, callbackOrig, attachedData) {
            if (iframe.contentWindow.frames) {
                for (var i = 0; i < iframe.contentWindow.frames.length; i++) {
                    var child_iframe = iframe.contentWindow.frames[i];

                    var childSrc = undefined;

                    try {
                        childSrc = child_iframe.frameElement.getAttribute("data-src");
                    } catch (err) {
                        // HTTP(S) cross-origin access?
                        console.warn(err);
                        continue;
                    }

                    if (!childSrc) {
                        if (child_iframe.frameElement.localName === "iframe") {
                            console.error("IFRAME data-src missing?!");
                        }
                        continue;
                    }

                    var contentDocumentPathRelativeToPackage = attachedData.spineItem.href;
                    var publicationFetcher = getCurrentResourceFetcher();
                    var contentDocumentPathRelativeToBase = publicationFetcher.convertPathRelativeToPackageToRelativeToBase(
                        contentDocumentPathRelativeToPackage);
                    var refAttrOrigVal_RelativeToBase = (new URI(childSrc)).absoluteTo(contentDocumentPathRelativeToBase).toString();
                    var packageFullPath = publicationFetcher.getPackageFullPathRelativeToBase();
                    var refAttrOrigVal_RelativeToPackage = (new URI("/" + refAttrOrigVal_RelativeToBase)).relativeTo("/" +
                        packageFullPath).toString();
                    var mimeType = ContentTypeDiscovery.identifyContentTypeFromFileName(refAttrOrigVal_RelativeToPackage);

                    var childIframeLoader = new ZipIframeLoader(getCurrentResourceFetcher, contentDocumentTextPreprocessor);
                    childIframeLoader.loadIframe(child_iframe.frameElement, childSrc,
                        console.log.bind(console, "CHILD IFRAME LOADED."), self, {
                            spineItem: {
                                media_type: mimeType,
                                href: refAttrOrigVal_RelativeToPackage
                            }
                        });
                }
            }

            self.updateIframeEvents(iframe);

            var callback = basicIframeLoader._onIframeLoad.bind(basicIframeLoader, iframe, callbackOrig);
            var mathJax = iframe.contentWindow.MathJax;
            if (mathJax) {
                console.log("MathJax VERSION: " + mathJax.cdnVersion + " // " + mathJax.fileversion + " // " + mathJax.version);

                var useFontCache = true; // default in MathJax

                // Firefox fails to render SVG otherwise
                if (mathJax.Hub.Browser.isFirefox) {
                    useFontCache = false;
                }

                // Chrome 49+ fails to render SVG otherwise
                // https://github.com/readium/readium-js/issues/138
                if (mathJax.Hub.Browser.isChrome) {
                    useFontCache = false;
                }

                // Edge fails to render SVG otherwise
                // https://github.com/readium/readium-js-viewer/issues/394#issuecomment-185382196
                if (window.navigator.userAgent.indexOf("Edge") > 0) {
                    useFontCache = false;
                }

                mathJax.Hub.Config({
                    showMathMenu: false,
                    messageStyle: "none",
                    showProcessingMessages: true,
                    SVG: {
                        useFontCache: useFontCache
                    }
                });

                // If MathJax is being used, delay the callback until it has completed rendering
                var mathJaxCallback = _.once(callback);

                try {
                    mathJax.Hub.Queue(mathJaxCallback);
                } catch (err) {
                    console.error("MathJax fail!");
                    callback();
                }
            } else {
                callback();
            }
        };

        function fetchHtmlAsText(path, callback) {
            $.ajax({
                url: path,
                dataType: 'html',
                async: true,
                success: function (result) {

                    callback(result);
                },
                error: function (xhr, status, errorThrown) {
                    console.error('Error when AJAX fetching %o - status: %o, error: %o', path, status, errorThrown);
                    callback();
                }
            });
        }

        function fetchContentDocument(src, callback) {
            fetchHtmlAsText(src, function (contentDocumentHtml) {
                if (!contentDocumentHtml) {
                    callback();
                    return;
                }

                if (_contentDocumentTextPreprocessor) {
                    contentDocumentHtml = _contentDocumentTextPreprocessor(src, contentDocumentHtml);
                }

                callback(contentDocumentHtml);
            });
        }
    };

    return ZipIframeLoader;
});