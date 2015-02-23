define(function() {

    var pendingCallbacks = {};

    if (window.Native2JS) {
        Native2JS.notifyRead = function(readId, base64data){
            console.log("IntelNativeInterface::notifyRead", readId);
            pendingCallbacks[readId](base64data);
            delete pendingCallbacks[readId];
        };
    }

    return {
        fetchFileByteArray: function(file, onload, onerror) {
            var fileLength = Native2JS.getFileSize(file);
            if(!fileLength){
                onerror(new Error('File ' + file + ' not found.'));
                return;
            }
            var readId = Native2JS.getFileContentAsByteArray(file, 0, fileLength);
            if (readId) {
                pendingCallbacks[readId] = onload;
            } else {
                onerror(new Error('File ' + file + ' could not be read.'))
            }
        }
    };

});