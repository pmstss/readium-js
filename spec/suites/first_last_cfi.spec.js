describe("First/Last CFI generation", function () {
    var EPUBS = '../epubs/';

    //these get defined when the test reader gets set up
    var readium = {};
    var reader = {};
    var waitForFinalPagination = function(){};

    var setupTestReader = function (done) {
        $("#testReader").remove();
        $("body").append($("<iframe id='testReader' src='/base/spec/reader/reader.html'></iframe>")
            .css({
                width: '1024px',
                height: '768px',
                border: 0,
                position: 'absolute',
                left: 0,
                top: 0
            }));

        var onMessage = function (e) {
            if (e.data === 'testReaderReady') {
                var testReader = $("#testReader")[0].contentWindow.testReader;
                reader = testReader.reader;
                readium = testReader.readium;
                waitForFinalPagination = testReader.waitForFinalPagination;
                done();
            }
        };

        window.removeEventListener('message', onMessage);
        window.addEventListener('message', onMessage);
    };

    describe("was setup with a test reader", function () {

        beforeEach(setupTestReader);

        it("that works", function (done) {
            readium.openPackageDocument(EPUBS + 'accessible_epub_3', function () {
                waitForFinalPagination(function () {
                    expect(reader.getLoadedSpineItems()[0]).toBeDefined();
                    expect(reader.getLoadedSpineItems()[0].idref).toBe("id-id2442754");
                    done();
                });
            });
        });

        it("that loads with an initial page request", function (done) {
            readium.openPackageDocument(EPUBS + 'accessible_epub_3', function () {
                waitForFinalPagination(function () {
                    expect(reader.getLoadedSpineItems()[0]).toBeDefined();
                    expect(reader.getLoadedSpineItems()[0].idref).toBe("id-id2611884");
                    expect(reader.getPaginationInfo().openPages[0].spineItemPageIndex).toBe(2);
                    done();
                });
            }, {"spineItemPageIndex": 2, "idref": "id-id2611884"});
        });
    });

    describe("with 'accessible_epub_3'", function () {

        beforeAll(function (done) {
            setupTestReader(function () {
                readium.openPackageDocument(EPUBS + 'accessible_epub_3', function () {
                    waitForFinalPagination(function () {
                        done();
                    });
                });
            });
        });

        describe("<First spine item> ('id-id2442754', 0)", function () {
            it("has proper first visible CFI", function () {
                expect(reader.getFirstVisibleCfi().contentCFI).toBe("/4/2[I_book_d1e1]/2,/1:0,/1:1");
                // Accessible EPUB 3
                // ^
            });
            it("has proper last visible CFI", function () {
                expect(reader.getLastVisibleCfi().contentCFI).toBe("/4/2[I_book_d1e1]/20");
                // <hr></hr>
            });
        });

        describe("Chapter 1 ('id-id2611884', 0)", function () {
            beforeAll(function (done) {
                reader.openSpineItemPage('id-id2611884', 0);
                waitForFinalPagination(done);
            });

            it("has proper first visible CFI", function () {
                expect(reader.getFirstVisibleCfi().contentCFI).toBe("/4/2[introduction]/2,/1:0,/1:1");
                // Chapter 1. Introduction
                // ^
            });
            it("has proper last visible CFI", function () {
                expect(reader.getLastVisibleCfi().contentCFI).toBe("/4/2[introduction]/18/8,/1:255,/1:256");
                // ... upward with more ebooks being produced ...
                //                    ^
            });
        });

        describe("Chapter 1 ('id-id2611884', 2)", function () {
            beforeAll(function (done) {
                reader.openSpineItemPage('id-id2611884', 2);
                waitForFinalPagination(done);
            });

            it("has proper first visible CFI", function () {
                expect(reader.getFirstVisibleCfi().contentCFI).toBe("/4/2[introduction]/18/8,/1:257,/1:258");
                // ... upward with more ebooks being produced ...
                //                      ^
            });
            it("has proper last visible CFI", function () {
                expect(reader.getLastVisibleCfi().contentCFI).toBe("/4/2[introduction]/18/16,/1:321,/1:322");
                // ... not cure this famine.
                //                         ^
            });
        });

    });

    describe("with 'handcrafted'", function () {

        beforeAll(function (done) {
            setupTestReader(function () {
                readium.openPackageDocument(EPUBS + 'handcrafted', function () {
                    waitForFinalPagination(function () {
                        done();
                    });
                });
            });
        });

        describe("<First spine item> ('test1-wacky-tables', 0)", function () {
            it("has proper first visible CFI", function () {
                expect(reader.getFirstVisibleCfi().contentCFI).toBe("/4/2/2,/1:0,/1:1");
                // Lorem ipsum dolor sit amet
                // ^
            });
            it("has proper last visible CFI", function () {
                expect(reader.getLastVisibleCfi().contentCFI).toBe("/4/2/4/2/8[the-table]/4/18/6,/1:7,/1:8");
                // $621,000
                //        ^
            });
        });

        describe("Wacky table ('test1-wacky-tables', 2)", function () {
            beforeAll(function (done) {
                reader.openSpineItemPage('test1-wacky-tables', 2);
                waitForFinalPagination(done);
            });

            it("has proper first visible CFI", function () {
                expect(reader.getFirstVisibleCfi().contentCFI).toBe("/4/2/4/2/8[the-table]/4/18/8/2");
                // <input type="text"></input>
            });
            it("has proper last visible CFI", function () {
                expect(reader.getLastVisibleCfi().contentCFI).toBe("/4/2/4/2/10,/1:450,/1:451");
                // .. anim id est laborum.
                //                       ^
            });
        });

        describe("Long text node, start ('test2-long-text-node', 0)", function () {
            beforeAll(function (done) {
                reader.openSpineItemPage('test2-long-text-node', 0);
                waitForFinalPagination(done);
            });

            it("has proper first visible CFI", function () {
                expect(reader.getFirstVisibleCfi().contentCFI).toBe("/4/2/2,/1:0,/1:1");
                // Very long text node
                // ^
            });
            it("has proper last visible CFI", function () {
                expect(reader.getLastVisibleCfi().contentCFI).toBe("/4/2/4[long-text],/1:3710,/1:3711");
                // ... where his old limber legs was taking ...
                //                 ^
            });
        });

        describe("Long text node, middle ('test2-long-text-node', 2)", function () {
            beforeAll(function (done) {
                reader.openSpineItemPage('test2-long-text-node', 2);
                waitForFinalPagination(done);
            });

            it("has proper first visible CFI", function () {
                expect(reader.getFirstVisibleCfi().contentCFI).toBe("/4/2/4[long-text],/1:3712,/1:3713");
                // ... where his old limber legs was taking ...
                //                   ^
            });
            it("has proper last visible CFI", function () {
                expect(reader.getLastVisibleCfi().contentCFI).toBe("/4/2/4[long-text],/1:7647,/1:7648");
                // ... and then cussed them all over again ...
                //                   ^
            });
        });

        describe("Long text node, end ('test2-long-text-node', 4)", function () {
            beforeAll(function (done) {
                reader.openSpineItemPage('test2-long-text-node', 4);
                waitForFinalPagination(done);
            });

            it("has proper first visible CFI", function () {
                expect(reader.getFirstVisibleCfi().contentCFI).toBe("/4/2/4[long-text],/1:7649,/1:7650");
                // ... and then cussed them all over again ...
                //                     ^
            });
            it("has proper last visible CFI", function () {
                expect(reader.getLastVisibleCfi().contentCFI).toBe("/4/2/6[end],/1:6,/1:7");
                // THE END
                //       ^
            });
        });
    });
});