describe("A suite", function() {
    beforeEach(function () {

        // Generate CFI AST to reference a paragraph in the Moby Dick test features
        CFI = "epubcfi(/6/14!/4/2/14/1:4)";
        CFIAST = EPUBcfi.Parser.parse(CFI);

        var domParser = new window.DOMParser();

        // Set up content document
        var contentDocXHTML = jasmine.getFixtures().read("moby_dick_doc.xhtml");
        contentDocument = domParser.parseFromString(contentDocXHTML, 'text/xml');
        $contentDocument = $(contentDocument);

    });
    it("contains spec with an expectation", function() {
        expect(contentDocument).toBeDefined();
        debugger
    });
});