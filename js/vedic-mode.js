// Match whole identifiers before looking up keywords so names with a shared prefix keep their color.
ace.define("ace/mode/vedic", function (require, exports) {
    const TextMode = require("ace/mode/text").Mode;
    const TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

    class VedicHighlightRules extends TextHighlightRules {
        constructor() {
            super();
            const identifier = this.createKeywordMapper({
                keyword: "मान|यदि|अथ|सत्य|असत्य|न|सूत्र|फल|विधि|सन्धि|मित्र|मम|चक्र|पर्यन्त|विराम|अग्रिम|निर्देश|अवहन",
                "support.function": "वद|पठन|समय|कुल|प्रकार|निर्गम|त्रुटि|लभ्यते|शब्द|अंक",
            }, "identifier");
            this.$rules = {
                start: [
                    {token: "comment", regex: "#.*$"},
                    {token: "string", regex: '"', next: "doubleQuoted"},
                    {token: "string", regex: "'", next: "singleQuoted"},
                    {token: "constant.numeric", regex: "[०-९0-9]+(?:[.][०-९0-9]+)?"},
                    {token: identifier, regex: "[A-Za-z_\u0900-\u0965\u0970-\u097f][A-Za-z_0-9\u0900-\u097f]*"},
                ],
                doubleQuoted: [{token: "string", regex: '"', next: "start"}, {defaultToken: "string"}],
                singleQuoted: [{token: "string", regex: "'", next: "start"}, {defaultToken: "string"}],
            };
            this.normalizeRules();
        }
    }

    class Mode extends TextMode {
        constructor() {
            super();
            this.HighlightRules = VedicHighlightRules;
        }
    }
    exports.Mode = Mode;
});
