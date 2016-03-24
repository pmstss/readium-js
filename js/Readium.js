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

// jscs:disable validateQuoteMarks
// jshint quotmark:false

define(['URIjs', 'readium_shared_js/globals', 'text!version.json', 'jquery', 'underscore', 'readium_shared_js/views/reader_view',
'readium_js/epub-fetch/publication_fetcher', 'readium_js/epub-model/package_document_parser',
'readium_js/epub-fetch/iframe_zip_loader', 'readium_shared_js/views/iframe_loader'],
function (URI, Globals, versionText, $, _, ReaderView, PublicationFetcher, PackageParser, IframeZipLoader, IframeLoader) {

    'use strict';

    var debug = Globals.DEBUG_MODE;

    var Readium = function (readiumOptions, readerOptions) {

        var _options = {mathJaxUrl: readerOptions.mathJaxUrl};

        var _contentDocumentTextPreprocessor = function (src, contentDocumentHtml) {

            function escapeMarkupEntitiesInUrl(url) {
                return url
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&apos;");
            }

            function injectedScript() {

                navigator.epubReadingSystem = window.parent.navigator.epubReadingSystem;
            }

            var sourceParts = src.split("/");
            // ### tss: no clear why the next line was commented
            sourceParts.pop(); //remove source file name
            var baseHref = sourceParts.join("/") + "/";

            if (debug) {
                console.log("EPUB doc base href:");
                console.log(baseHref);
            }
            var base = "<base href=\"" + encodeURI(escapeMarkupEntitiesInUrl(baseHref)) + "\"/>";

            var scripts = "<script type=\"text/javascript\">(" + injectedScript.toString() + ")()<\/script>";

            if (_options && _options.mathJaxUrl && contentDocumentHtml.search(/<(\w+:|)(?=math)/) >= 0) {
                scripts += "<script type=\"text/javascript\" src=\"" + _options.mathJaxUrl + "\"> <\/script>";
            }

            contentDocumentHtml = contentDocumentHtml.replace(/(<head[\s\S]*?>)/, "$1" + base + scripts);

            contentDocumentHtml = contentDocumentHtml.replace(
                    /(<iframe[\s\S]+?)src[\s]*=[\s]*(["'])[\s]*(.*)[\s]*(["'])([\s\S]*?>)/g, '$1data-src=$2$3$4$5');

            contentDocumentHtml = contentDocumentHtml.replace(
                    /(<iframe[\s\S]+?)data-src[\s]*=[\s]*(["'])[\s]*(http[s]?:\/\/.*)[\s]*(["'])([\s\S]*?>)/g, '$1src=$2$3$4$5');

            // Empty title in Internet Explorer blows the XHTML parser (document.open/write/close instead of BlobURI)
            contentDocumentHtml = contentDocumentHtml.replace(/<title>[\s]*<\/title>/g, '<title>TITLE</title>');
            contentDocumentHtml = contentDocumentHtml.replace(/<title[\s]*\/>/g, '<title>TITLE</title>');

            return contentDocumentHtml;
        };

        var self = this;

        var _currentPublicationFetcher;
        this.getCurrentPublicationFetcher = function () {
            return _currentPublicationFetcher;
        };

        var jsLibRoot = readiumOptions.jsLibRoot;

        // ### tss: ability to set iframeLoader from outside
        if (!readerOptions.CustomIFrameLoader) {
            if (!readiumOptions.useSimpleLoader) {
                readerOptions.iframeLoader = new IframeZipLoader(function () {
                    return _currentPublicationFetcher;
                }, _contentDocumentTextPreprocessor);
            } else {
                readerOptions.iframeLoader = new IframeLoader();
            }
        } else {
            readerOptions.iframeLoader = new readerOptions.CustomIFrameLoader(function () {
                return _currentPublicationFetcher;
            }, _contentDocumentTextPreprocessor);
        }

        // Chrome extension and cross-browser cloud reader build configuration uses this scaling method across the board
        // (no browser sniffing for Chrome). See https://github.com/readium/readium-js-viewer/issues/313#issuecomment-101578284
        // true means: apply CSS scale transform to the root HTML element of spine item documents (fixed layout / pre-paginated)
        // and to any spine items in scroll view (both continuous and document modes).
        // Scroll view layout includes reflowable spine items, but the zoom level is 1x so there is no impact.
        readerOptions.needsFixedLayoutScalerWorkAround = true;

        this.reader = new ReaderView(readerOptions);
        ReadiumSDK.reader = this.reader;

        var openPackageDocument_ = function (ebookURL, callback, openPageRequest, contentType)  {
            if (_currentPublicationFetcher) {
                _currentPublicationFetcher.flushCache();
            }

            var cacheSizeEvictThreshold = null;
            if (readiumOptions.cacheSizeEvictThreshold) {
                cacheSizeEvictThreshold = readiumOptions.cacheSizeEvictThreshold;
            }

            // ### tss: ability to use custom ResourceFetcher
            _currentPublicationFetcher = new PublicationFetcher(ebookURL, jsLibRoot, window, cacheSizeEvictThreshold,
                    _contentDocumentTextPreprocessor, contentType, readerOptions.CustomResourceFetcher);

            _currentPublicationFetcher.initialize(function (resourceFetcher) {
                if (!resourceFetcher) {

                    callback(undefined);
                    return;
                }

                var _packageParser = new PackageParser(_currentPublicationFetcher);
                _packageParser.parse(function (packageDocument) {
                    if (!packageDocument) {
                        callback(undefined);
                        return;
                    }

                    var openBookOptions = readiumOptions.openBookOptions || {};
                    var openBookData = $.extend(packageDocument.getSharedJsPackageData(), openBookOptions);

                    if (openPageRequest) {
                        openBookData.openPageRequest = openPageRequest;
                    }
                    self.reader.openBook(openBookData);

                    var options = {
                        metadata: packageDocument.getMetadata()
                    };

                    callback(packageDocument, options);
                });
            });
        };

        this.openPackageDocument = function (ebookURL, callback, openPageRequest)  {
            if (!(ebookURL instanceof Blob) && !(ebookURL instanceof File)) {
                var origin = window.location.origin;
                if (!origin) {
                    origin = window.location.protocol + '//' + window.location.host;
                }
                var thisRootUrl = origin + window.location.pathname;

                if (debug) {
                    console.debug("BASE URL: " + thisRootUrl);
                    console.debug("RELATIVE URL: " + ebookURL);
                }

                try {
                    ebookURL = new URI(ebookURL).absoluteTo(thisRootUrl).toString();
                } catch (err) {
                    console.error(err);
                    console.log(ebookURL);
                }

                if (debug) {
                    console.debug("==>");
                    console.debug("ABSOLUTE URL: " + ebookURL);
                }

                // We don't use URI.is("absolute") here, as we really need HTTP(S) (excludes e.g. "data:" URLs)
                if (ebookURL.indexOf("http://") === 0 || ebookURL.indexOf("https://") === 0) {

                    var xhr = new XMLHttpRequest();
                    xhr.onreadystatechange = function () {

                        if (this.readyState !== 4) {
                            return;
                        }

                        var contentType;

                        var success = xhr.status >= 200 && xhr.status < 300 || xhr.status === 304;
                        if (success) {

                            var allResponseHeaders = '';
                            if (xhr.getAllResponseHeaders) {
                                allResponseHeaders = xhr.getAllResponseHeaders();
                                if (allResponseHeaders) {
                                    allResponseHeaders = allResponseHeaders.toLowerCase();
                                } else {
                                    allResponseHeaders = '';
                                }
                            }

                            if (allResponseHeaders.indexOf("content-type") >= 0) {
                                contentType = xhr.getResponseHeader("Content-Type") || xhr.getResponseHeader("content-type");
                                if (!contentType) {
                                    contentType = undefined;
                                }

                                if (debug) {
                                    console.debug("CONTENT-TYPE: " + ebookURL + " ==> " + contentType);
                                }
                            }

                            var responseURL = xhr.responseURL;
                            if (!responseURL) {
                                if (allResponseHeaders.indexOf("location") >= 0) {
                                    responseURL = xhr.getResponseHeader("Location") || xhr.getResponseHeader("location");
                                }
                            }

                            if (responseURL && responseURL !== ebookURL) {
                                if (debug) {
                                    console.debug("REDIRECT: " + ebookURL + " ==> " + responseURL);
                                }

                                ebookURL = responseURL;
                            }
                        }

                        openPackageDocument_(ebookURL, callback, openPageRequest, contentType);
                    };
                    xhr.open('HEAD', ebookURL, true);
                    //xhr.responseType = 'blob';
                    xhr.send(null);

                    return;
                }
            }

            openPackageDocument_(ebookURL, callback, openPageRequest);
        };

        this.closePackageDocument = function () {
            if (_currentPublicationFetcher) {
                _currentPublicationFetcher.flushCache();
            }
        };

        Globals.logEvent("READER_INITIALIZED", "EMIT", "Readium.js");
        ReadiumSDK.emit(ReadiumSDK.Events.READER_INITIALIZED, ReadiumSDK.reader);
    };

    Readium.version = JSON.parse(versionText);

    return Readium;
});
