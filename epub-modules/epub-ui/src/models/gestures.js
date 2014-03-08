define(['jquery','jquery_hammer','hammer'], function($,jqueryHammer,Hammer){

    var gesturesHandler = function(reader,viewport){

        var nextPage = function(){
            reader.openPageRight();
        };

        var prevPage = function(){
            reader.openPageLeft();
        };

        this.initialize= function(){

            reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function(iframe,s) {
                //set hammer's document root
                Hammer.DOCUMENT = iframe[0].contentDocument.documentElement;
                //hammer's internal touch events need to be redefined? (doesn't work without)
                Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_MOVE, Hammer.detection.detect);
                Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_END, Hammer.detection.detect);
                //delete Hammer.defaults.stop_browser_behavior.userSelect;
                //set up the hammer gesture events
                //swiping handlers
                var swipingOptions = {stop_browser_behavior:false, prevent_mouseevents: false};
                Hammer(Hammer.DOCUMENT,swipingOptions).on("swipeleft.Hammer", function() {
                    nextPage();
                });
                Hammer(Hammer.DOCUMENT,swipingOptions).on("swiperight.Hammer", function() {
                    prevPage();
                });

                //remove stupid ipad safari elastic scrolling
                //TODO: test this with reader ScrollView and FixedView
                $(Hammer.DOCUMENT).on(
                    'touchmove.Hammer',
                    function(e) {
                        //hack: check if we are not dealing with a scrollview
                        if(iframe.height()<=iframe.parent().height()){
                            e.preventDefault();
                        }
                    }
                );
            });

//            //remove stupid ipad safari elastic scrolling (improves UX for gestures)
//            //TODO: test this with reader ScrollView and FixedView
//            $(viewport).on(
//                'touchmove.Hammer',
//                function(e) {
//                    e.preventDefault();
//                }
//            );
//
//            //handlers on viewport
//            $(viewport).hammer().on("swipeleft.Hammer", function() {
//                nextPage();
//            });
//            $(viewport).hammer().on("swiperight.Hammer", function() {
//                prevPage();
//            });
        };

    };
    return gesturesHandler;
});