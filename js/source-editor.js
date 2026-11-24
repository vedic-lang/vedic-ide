import {acceptCompletion, autocompletion, completeFromList, completionKeymap} from "@codemirror/autocomplete";
import {defaultKeymap, history, historyKeymap, indentWithTab} from "@codemirror/commands";
import {StreamLanguage, indentUnit, syntaxHighlighting} from "@codemirror/language";
import {openSearchPanel, search, searchKeymap} from "@codemirror/search";
import {EditorState} from "@codemirror/state";
import {Decoration, EditorView, ViewPlugin, highlightActiveLine, keymap, lineNumbers} from "@codemirror/view";
import {classHighlighter} from "@lezer/highlight";

const keywords = new Set("मान यदि अथ सत्य असत्य न सूत्र फल विधि सन्धि मित्र मम चक्र पर्यन्त विराम अग्रिम निर्देश आवाहन".split(" "));
const builtins = new Set("वद पठन समय कुल प्रकार निर्गम त्रुटि लभ्यते शब्द अंक".split(" "));
const language = StreamLanguage.define({
    startState: () => ({quote: null}),
    token(stream, state) {
        if (!state.quote) {
            if (stream.eatSpace()) return null;
            if (stream.eat("#")) {
                stream.skipToEnd();
                return "comment";
            }
            if (stream.match(/^[०-९0-9]+(?:\.[०-९0-9]+)?/)) return "number";
            if (stream.match(/^[A-Za-z_\u0900-\u0965\u0970-\u097f][A-Za-z_0-9\u0900-\u097f]*/)) {
                if (keywords.has(stream.current())) return "keyword";
                if (builtins.has(stream.current())) return "atom";
                return null;
            }
            state.quote = stream.eat(/["']/) || null;
            if (!state.quote) {
                stream.next();
                return null;
            }
        }
        if (stream.skipTo(state.quote)) {
            stream.next();
            state.quote = null;
        } else {
            stream.skipToEnd();
        }
        return "string";
    },
});

const completions = completeFromList(Object.entries({
    maana: "मान", vad: "वद", yadi: "यदि", atha: "अथ", satya: "सत्य", asatya: "असत्य",
    sUtra: "सूत्र", phala: "फल", chakram: "चक्रम्", paryantam: "पर्यन्तम्", virAm: "विराम्",
    nirdesha: "निर्देश", yada: "यद", yadabhAve: "यदभावे", AvAhana: "आवाहन",
}).map(([label, detail]) => ({label, detail})));

const segmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("sa", {granularity: "grapheme"}) : null;
const clusterMark = Decoration.mark({});

// Keep cursor motion, selection and deletion at the edges of a visible akshara.
function clusterRanges(view) {
    const ranges = [];
    for (const {from, to} of view.visibleRanges) {
        for (const {segment, index} of segmenter.segment(view.state.sliceDoc(from, to))) {
            if (segment.length > 1 && /\p{Script=Devanagari}/u.test(segment)) {
                ranges.push(clusterMark.range(from + index, from + index + segment.length));
            }
        }
    }
    return Decoration.set(ranges);
}

const devanagariClusters = ViewPlugin.fromClass(class {
    constructor(view) { this.ranges = clusterRanges(view); }
    update(update) {
        if (update.docChanged || update.viewportChanged) this.ranges = clusterRanges(update.view);
    }
}, {provide: plugin => EditorView.atomicRanges.of(view => view.plugin(plugin).ranges)});

export function createEditor(parent, transliteration) {
    const position = document.getElementById("position");
    const updatePosition = EditorView.updateListener.of(({state, selectionSet, docChanged}) => {
        if (selectionSet || docChanged) {
            const head = state.selection.main.head;
            const line = state.doc.lineAt(head);
            position.textContent = `Ln ${line.number}, Col ${head - line.from + 1}`;
        }
    });

    function transliterate(view, event) {
        if (!transliteration.checked || view.composing || event.isComposing ||
            event.ctrlKey || event.metaKey || event.altKey || !view.state.selection.main.empty) return;
        const head = view.state.selection.main.head;
        const before = view.state.sliceDoc(view.state.doc.lineAt(head).from, head);
        const word = before.match(/\S+$/)?.[0];
        if (word && /[a-z]/i.test(word)) {
            const insert = Sanscript.t(word, "itrans", "devanagari");
            if (insert !== word) view.dispatch({changes: {from: head - word.length, to: head, insert}});
        }
    }

    const extensions = [
        lineNumbers(), highlightActiveLine(), history(), language, syntaxHighlighting(classHighlighter),
        EditorView.lineWrapping, EditorState.tabSize.of(4), indentUnit.of("    "), updatePosition,
        EditorView.contentAttributes.of({"aria-label": "Vedic code editor", lang: "sa", spellcheck: "false"}),
        segmenter ? devanagariClusters : [], search({top: true}), autocompletion({override: [completions]}),
        EditorView.domEventHandlers({keydown(event, view) {
            if (event.key === " " || event.key === "Enter") transliterate(view, event);
            return false;
        }}),
        keymap.of([
            ...completionKeymap, {key: "Tab", run: acceptCompletion},
            ...searchKeymap, ...historyKeymap, indentWithTab, ...defaultKeymap,
        ]),
    ];
    const view = new EditorView({parent, extensions});
    let lineBreak = "\n";
    return {
        getValue: () => view.state.doc.sliceString(0, view.state.doc.length, lineBreak),
        setValue(doc) {
            lineBreak = doc.match(/\r\n?|\n/)?.[0] || "\n";
            view.setState(EditorState.create({doc, extensions}));
            position.textContent = "Ln 1, Col 1";
        },
        focus: () => view.focus(),
        find: () => openSearchPanel(view),
    };
}
