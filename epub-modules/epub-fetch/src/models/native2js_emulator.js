// We made Native2JS module dependent on jQuery - this is rather arbitrary
// based on require js convention we can:
// - use $ as jQuery namespace
// - second argument function is executed when jQuery library is loaded
define(['jquery'], function($) {

    // create ad-hoc module Native2JS that hosts these 2 functions 
    // GetFileContenAsByteArray(file, offset, size)
    // GetFileSize(file)
    (function() {
        var Native2JS = {

            // this is base of URL
            base: "",

            // retrieves "slice" of file and returns it in the callback function as Uint8Array
            GetFileContentAsByteArray: function(file, offset, size, callback) {
                var xhr, rangeHeader;
                
                // form rangeHeader ""bytes=33-133" based on offset, size
                rangeHeader = "bytes=" + offset.toString() + "-" + (offset+size).toString();

                // Note that we are using XMLHttpRequest rather than jQuery,
                // as we want to specify ArrayBuffer as a response
                // Note that responseType = 'arraybuffer'does not work with "sync" XHR
                // so we have to use callback
                xhr = new XMLHttpRequest();
                
                xhr.open('GET', this.base + file, true);
                xhr.responseType = 'arraybuffer';
                xhr.setRequestHeader("Range", rangeHeader);
                xhr.onload = function() {
                    var arraybuffer, bytearray;
                    if (this.status == 200 || this.status == 206) {
                        // get response (not responseText as in normal XHR)
                        arraybuffer = this.response;

                        // convert ArrayBuffer to Uint8Array
                        bytearray = new Uint8Array(arraybuffer);
                        console.log('Length: ' + bytearray.length);
                        
                        // invoke callback, passing back bytearray 
                        callback(bytearray);
                    }
                };
                xhr.send();
            },

            // returns file size via HEAD request. Note that we are using XMLHttpRequest
            // rather than jQuery shorthand, as we want to specify "sync" XHR here
            GetFileSize: function (file) {

                // using sync XHR request
                var xhr = new XMLHttpRequest(), contentLength;
                xhr.open('HEAD', this.base + file, false);
                xhr.send();

                if (xhr.status == 200) {
                    contentLength = xhr.getResponseHeader('Content-Length');
                    return contentLength;
                }
            }
        };
        window.Native2JS = Native2JS;
    }) ();

    //
    // Testing
    //

    // set base
    Native2JS.base = "http://localhost:8080/";

    // test  Native2JS.GetFileSize
    console.log("File size: " + Native2JS.GetFileSize("range-test.txt"));

    // test  Native2JS.GetFileContentAsByteArray

    // callback function
    function handleFileSlice(bytearray) {
        alert("bytearray size: " + bytearray.length);
    }

    // get file slice
    Native2JS.GetFileContentAsByteArray("range-test.txt", 33, 100, handleFileSlice);

});
