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

define([], function () {

    'use strict';

    var isIE = window.navigator.userAgent.indexOf('Trident') > 0 || window.navigator.userAgent.indexOf('Edge') > 0;

    var SHORT_TAGS = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta',
        'param', 'source', 'track', 'wbr'];

    return function () {
        var self = this;

        this.parseXml = function (xmlString) {
            return self.parseMarkup(xmlString, 'text/xml');
        };

        this.parseMarkup = function (markupString, contentType) {
            if (isIE && contentType === 'application/xhtml+xml') {
                // IE incorrectly handles escaped HTML entities on XHTML parsing:
                // https://connect.microsoft.com/IE/feedbackdetail/view/781628
                contentType = 'text/html';

                // replacing self closed tags with full ones, because otherwise IE treat them as unclosed:
                // e.g. <a/> could be expanded till latest parent child. But short-only tags like 'br' should not be
                // replaced with full ones - otherwise will be doubled
                markupString = markupString.replace(/<\s*([a-zA-Z:]+)([^>\/]*)\/>/g, function (m, p1, p2) {
                    if (SHORT_TAGS.indexOf(p1.toLowerCase()) === -1) {
                        return '<' + p1 + p2 + '></' + p1 + '>';
                    } else {
                        return m;
                    }
                });
            }

            var parser = new window.DOMParser();
            return parser.parseFromString(markupString, contentType);
        };
    };
});
