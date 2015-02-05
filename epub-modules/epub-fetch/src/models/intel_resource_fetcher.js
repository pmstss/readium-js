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

define(['require', 'module', 'jquery', 'URIjs', './discover_content_type', './intel_native_interface', './typed_arrays_util'], function (require, module, $, URI, ContentTypeDiscovery, IntelNativeInterface, TypedArraysUtil) {

    var IntelResourceFetcher = function(parentFetcher, baseUrl) {

        console.log("Initializing IntelResourceFetcher");
        console.log("baseUrl = " + baseUrl);

        if (baseUrl.charAt(baseUrl.length - 1) !== '/') {
            baseUrl += '/';
        }

        // INTERNAL FUNCTIONS


        var TEXT = 'text';
        var TYPEDARRAY = 'typedArray';
        var DATA64URI = 'data64uri';


        function fetchFileContents(pathRelativeToPackageRoot, type, readCallback, onerror) {


            if (typeof pathRelativeToPackageRoot === 'undefined') {
                throw 'Fetched file relative path is undefined!';
            }

            var fetchCallback = function(base64data){
                if(base64data === null){
                    readCallback(null);
                    return;
                }
                var byteArray = TypedArraysUtil.base64DecToArr(base64data);
                if (type === TEXT) {
                    readCallback(TypedArraysUtil.UTF8ArrToStr(byteArray));
                } else if (type === DATA64URI) {
                    readCallback(base64data);
                } else if (type === TYPEDARRAY) {
                    readCallback(byteArray);
                }
            };
            IntelNativeInterface.fetchFileByteArray(baseUrl + pathRelativeToPackageRoot, fetchCallback, onerror)
        }

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
            fetchFileContents(pathRelativeToPackageRoot, DATA64URI, function (contentBase64) {
                var type = ContentTypeDiscovery.identifyContentTypeFromFileName(pathRelativeToPackageRoot);
                fetchCallback("data:" + type + ";base64," + contentBase64);
            }, onerror);
        };

        this.fetchFileContentsBlob = function(pathRelativeToPackageRoot, fetchCallback, onerror) {
            console.log("IntelResourceFetcher::fetchFileContentsBlob " + pathRelativeToPackageRoot);
            fetchFileContents(pathRelativeToPackageRoot, TYPEDARRAY, function (contentsArray) {
                var blob = new Blob([contentsArray], {
                    type: ContentTypeDiscovery.identifyContentTypeFromFileName(pathRelativeToPackageRoot)
                });
                fetchCallback(blob);
            }, onerror);
        };
    };
    return IntelResourceFetcher;
});
