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

define(['require', 'module', 'jquery', 'URIjs', './discover_content_type'], function (require, module, $, URI, ContentTypeDiscovery) {

    var IntelResourceFetcher = function(parentFetcher, baseUrl) {

        console.log("Initializing IntelResourceFetcher");

        // INTERNAL FUNCTIONS


        var TEXT = 'text';
        var ARRAYBUFFER = 'arraybuffer';

        // TODO: replace with the bridge implementation.
        function resolveURI(pathRelativeToPackageRoot) {
            return "http://localhost:8080/epub_content/epub_sample/" + pathRelativeToPackageRoot;
        }

        function fetchFileContents(pathRelativeToPackageRoot, type, readCallback, onerror) {
            var fileUrl = resolveURI(pathRelativeToPackageRoot);

            if (typeof pathRelativeToPackageRoot === 'undefined') {
                throw 'Fetched file relative path is undefined!';
            }

            var xhr = new XMLHttpRequest();
            xhr.open('GET', fileUrl, true);
            xhr.responseType = type;
            xhr.onerror = onerror;

            xhr.onload = function (loadEvent) {
                readCallback(xhr.response);
            };

            xhr.send();
        };

        // PUBLIC API

        this.getPackageUrl = function() {
            console.log("IntelResourceFetcher::getPackageUrl");
            return baseUrl;
        };

        this.fetchFileContentsText = function(pathRelativeToPackageRoot, fetchCallback, onerror) {
            console.log("IntelResourceFetcher::fetchFileContentsText " + pathRelativeToPackageRoot);
            fetchFileContents(pathRelativeToPackageRoot, TEXT, fetchCallback, onerror);
        };

        this.fetchFileContentsData64Uri = function(pathRelativeToPackageRoot, fetchCallback, onerror) {
            console.log("IntelResourceFetcher::fetchFileContentsData64Uri " + pathRelativeToPackageRoot);
            fetchFileContents(pathRelativeToPackageRoot, TEXT, fetchCallback, onerror);
        };

        this.fetchFileContentsBlob = function(pathRelativeToPackageRoot, fetchCallback, onerror) {
            console.log("IntelResourceFetcher::fetchFileContentsBlob " + pathRelativeToPackageRoot);
                        fetchFileContents(pathRelativeToPackageRoot, ARRAYBUFFER, function (contentsArrayBuffer) {
                var blob = new Blob([contentsArrayBuffer], {
                    type: ContentTypeDiscovery.identifyContentTypeFromFileName(pathRelativeToPackageRoot)
                });
                fetchCallback(blob);
            }, onerror);
        };
    };
    return IntelResourceFetcher;
});
