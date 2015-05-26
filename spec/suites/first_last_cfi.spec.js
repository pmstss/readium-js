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

        window.removeEventListener('message');
        window.addEventListener('message', function (e) {
            if (e.data === 'testReaderReady') {
                var testReader = $("#testReader")[0].contentWindow.testReader;
                reader = testReader.reader;
                readium = testReader.readium;
                waitForFinalPagination = testReader.waitForFinalPagination;
                done();
            }
        });
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

        describe("Chapter 1 ('id-id2611884', 2)", function () {
            beforeAll(function (done) {
                reader.openSpineItemPage('id-id2611884', 2);
                waitForFinalPagination(done);
            });

            it("has proper first visible CFI", function () {
                expect(reader.getFirstVisibleCfi().contentCFI).toBe("/4/2[I_book_d1e1]/2,/1:0,/1:1");
                // ... year are ever made available ...
                //              ^
            });
            it("has proper last visible CFI", function () {
                expect(reader.getLastVisibleCfi().contentCFI).toBe("/4/2[introduction]/18/16,/1:321,/1:322");
                // ... not cure this famine.
                //                         ^
            });
        });

    });

});