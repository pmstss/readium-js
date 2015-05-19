describe("A suite", function() {
    beforeEach(function () {

        // Generate CFI AST to reference a paragraph in the Moby Dick test features
        this.CFI = "epubcfi(/6/14!/4/2/14/1:4)";
        this.CFIAST = EPUBcfi.Parser.parse(this.CFI);

        var domParser = new window.DOMParser();

        // Set up content document
        var contentDocXHTML = jasmine.getFixtures().read("moby_dick_doc.xhtml");
        this.contentDocument = domParser.parseFromString(contentDocXHTML, 'text/xml');
        this.$contentDocument = $(this.contentDocument);

    });
    it("contains spec with an expectation", function() {
        expect(this.contentDocument).toBeDefined();
        debugger
    });
});