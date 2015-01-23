// We made Native2JS module dependent on jQuery - this is rather arbitrary
// based on require js convention we can:
// - use $ as jQuery namespace
// - second argument function is executed when jQuery library is loaded
define(['jquery'], function($) {

    var fileSize = Native2JS.getFileSize("image");
    console.log("File size: " + fileSize);



    // get file slice
    var bytes = Native2JS.getFileContentAsByteArray("image",0,fileSize);
    var blob = new Blob([new Uint8Array(bytes)],{type: 'image/png'});
    var url = URL.createObjectURL(blob);
    console.log(url);

});
