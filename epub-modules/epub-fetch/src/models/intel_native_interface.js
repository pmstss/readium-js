define(function() {

    return {
        fetchFileByteArray: function(file, onload, onerror) {
            var fileLength = Native2JS.getFileSize(file);
            if(!fileLength){
                onerror(new Error('File ' + file + ' not found.'));
                return;
            }
            var byteArray = Native2JS.getFileContentAsByteArray(file, 0, fileLength);
            if (Uint8ClampedArray) {
                byteArray = new Uint8ClampedArray(byteArray);
            } else {
                byteArray = new Uint8Array(byteArray);
            }
            onload(byteArray);
        }
    };

});