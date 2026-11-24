// Retrieve Elements
const consoleLogList = document.getElementById("console-logs");
const executeCodeBtn = document.getElementById("btn-run");
const resetCodeBtn = document.getElementById("btn-clear");
const examplesElm = document.getElementById("examples-select");
const toggleBtn = document.getElementById("btn-toggle");

// Setup Ace
let editor = ace.edit("editor");
let session = editor.session;
let consoleMessages = [];
let latestRun = 0;

let editorLib = {
    clearConsoleScreen() {
        consoleMessages.length = 0;

        // Remove all elements in the log list
        while (consoleLogList.firstChild) {
            consoleLogList.removeChild(consoleLogList.firstChild);
        }
    },
    printToConsole() {
        consoleMessages.forEach((log) => {
            const newLogItem = document.createElement("li");
            const newLogText = document.createElement("pre");

            newLogText.className = log.class;
            newLogText.textContent = `> ${log.message}`;

            newLogItem.appendChild(newLogText);

            consoleLogList.appendChild(newLogItem);
        });
    },
    init() {
        // Configure Ace Options
        editor.setOptions({
            wrap: true,
            // wrap text to view
            showPrintMargin: false,
            indentedSoftWrap: false,
            behavioursEnabled: false,
            enableBasicAutocompletion: [
                {
                    getCompletions: function (
                        editor,
                        session,
                        pos,
                        prefix,
                        callback
                    ) {
                        var kwList = [
                            ["maana", "मान"],
                            ["vad", "वद"],
                            ["yadi", "यदि"],
                            ["atha", "अथ"],
                            ["satya", "सत्य"],
                            ["asatya", "असत्य"],
                            ["sUtra", "सूत्र"],
                            ["phala", "फल"],
                            ["chakram", "चक्रम्"],
                            ["paryantam", "पर्यन्तम्"],
                            ["virAm", "विराम्"],
                            ["nirdesha", "निर्देश"],
                            ["yada", "यद"],
                            ["yadabhAve", "यदभावे"],
                            ["avahan", "अवहन्"],
                        ];
                        callback(
                            null,
                            kwList.map(function (kw) {
                                return {
                                    value: kw[0],
                                    meta: kw[1],
                                };
                            })
                        );
                    },
                },
            ],
            // to make popup appear automatically, without explicit _ctrl+space_
            enableLiveAutocompletion: true,
            // disable autopairing of brackets and tags
        });
    },
    add(text) {
        session.insert(session.selection.getCursor(), " " + text + " ");
        // Insert the text at the current cursor position
    },
};

// Events
async function runCode() {
    const run = ++latestRun;
    // Get input from the code editor
    const userCode = editor.getValue();

    // Start with a clean output panel.
    editorLib.clearConsoleScreen();

    // Run the user code
    try {
        const wasmError = await window.vedicReady;
        if (run !== latestRun) return;
        if (wasmError) {
            const message = window.location.protocol === "file:"
                ? "The IDE cannot load WebAssembly from a file URL. In this folder, run `python -m http.server 8000`, then open http://localhost:8000."
                : `Unable to load the Vedic WebAssembly module: ${wasmError.message || wasmError}`;
            throw new Error(message);
        }
        vedic(userCode);
    } catch (err) {
        console.error(err);
    }

    // Print to the console
    editorLib.printToConsole();
}

executeCodeBtn.addEventListener("click", runCode);

resetCodeBtn.addEventListener("click", () => {
    latestRun++;
    editorLib.clearConsoleScreen();
});

editorLib.init();

/*/add keyword button dnymically
let Keyword = ["मान", "वद", "यदि", "अथ", "सत्य", "असत्य", "सूत्र", "फल", "चक्रम्", "पर्यन्तम्", "विराम्", "निर्देश", "यद", "यदभावे", "अवहन्"];
let KeywordArea = document.getElementsByClassName("hint-area")[0];
Keyword.forEach((keyword) => {
  let newBtn = document.createElement("button");
  newBtn.textContent = keyword;
  newBtn.addEventListener("click", () => {
    editorLib.add(keyword);
  });
  KeywordArea.appendChild(newBtn);
});
*/

// examples
const examples = new Map([
    ["hello-world.ved", 'वद("नमस्ते विश्व!");'],
    [
        "operators.ved",
        "वद(२+१); # expect: ३\nवद(२-१); # expect: १\nवद(२*१); # expect: २\nवद(२/१); # expect: २\nवद(२%१); # expect: ०\nवद(२>१); # expect: सत्य\nवद(२<१); # expect: असत्य\nवद(२==१); # expect: असत्य\nवद(२!=१); # expect: सत्य\nवद(२>=१); # expect: सत्य\nवद(२>=१); # expect: सत्य\nवद(२<=१); # expect: असत्य\nवद(२&&१); # expect: सत्य\nवद(२||१); # expect: सत्य",
    ],
    [
        "suchi.ved",
        '# Creating an सूचि \nमान क = [["आम",१ ],["संतरा",२],["सेब",३]];\nवद(क); # expect: [[आम, १], [संतरा, २], [सेब, ३]]\n\n# Adding elements to a सूचि\nमान सप्तर्षि = []; # रिक्त सूचि - Empty list\n\nसप्तर्षि.आगम("Kashyapa");\nसप्तर्षि.आगम("Atri");\nसप्तर्षि.आगम("Vasistha");\nसप्तर्षि.आगम("Vishwamitra");\nसप्तर्षि.आगम("Bharadvaja");\nसप्तर्षि.आगम("Gautama");\nसप्तर्षि.आगम("Jamadagni");\n\nवद(सप्तर्षि);\n# expect: [Kashyapa, Atri, Vasistha, Vishwamitra, Bharadvaja, Gautama, Jamadagni]\n\nवद("लंबाई =",कुल(सप्तर्षि)); # expect: लंबाई = ७',
    ],
    [
        "sutra.ved",
        "सूत्र योग(अ,ब){\n    फल अ+ब;\n}\n\nवद(योग(११,२२)); # it will print ३३ \n\n# expect: ३३",
    ],
    [
        "yadiath.ved",
        'मान आयु = ३२;\nयदि (आयु == २५) {\n  वद("वयं सम वयस्काः एव"); # We\'re the same age\n}\nअथ यदि (आयु > २५) {\n  वद("वयं सम वयस्काः न एव"); # We\'re not the same age\n}\nअथ {\n  वद("मम अपेक्षया कनिष्ठः वा"); # Younger to me\n}\n\n# expect: वयं सम वयस्काः न एव',
    ],
    [
        "chakram.ved",
        'चक्र(मान अ = ०; अ < १०; अ = अ+ १)\n{\n  # चक्रम् takes in 3 parameters initial value, and condition, and a step size\n  वद("अ =",अ);\n} \n\n# expect: अ = ०\n# expect: अ = १\n# expect: अ = २\n# expect: अ = ३\n# expect: अ = ४\n# expect: अ = ५\n# expect: अ = ६\n# expect: अ = ७\n# expect: अ = ८\n# expect: अ = ९\n',
    ],
    [
        "viram.ved",
        'चक्र(मान अ = ०; अ < १०; अ = अ+ १){\n    यदि (अ >= ५){\n        विराम;  # viram is like continue\n    }\n    वद("अ =>",अ);    \n} \n\n# expect: अ => ०\n# expect: अ => १\n# expect: अ => २\n# expect: अ => ३\n# expect: अ => ४',
    ],
    [
        "agrim.ved",
        'चक्र(मान अ = ०; अ < ५; अ = अ+ १){\n    यदि (अ == २){\n        अग्रिम; # Agrim is like skip\n    }\n    वद("अ =>",अ);\n} \n\n# expect: अ => ०\n# expect: अ => १\n# expect: अ => ३\n# expect: अ => ४',
    ],
    [
        "paryantam.ved",
        "# This will print ० to ५\nमान अ = ०;\nपर्यन्त( अ <= ५)\n{\n  वद(अ);\n  अ = अ+ १;\n} \n# expect: ०\n# expect: १\n# expect: २\n# expect: ३\n# expect: ४\n# expect: ५",
    ],
    [
        "simpleinterest",
        'सूत्र मिश्रधन(म,द,स){\n    फल म+(म*द*स/१००);\n}\n\nमान मूलधन = १०००;\nमान दर = ८;\nमान समय = ५; \n\nवद("मिश्रधन =",मिश्रधन(मूलधन,दर,समय));\n\n# expect: मिश्रधन = १४००',
    ],
]);
for (const name of examples.keys()) {
    examplesElm.add(new Option(name, name));
}

function loadExample(name) {
    examplesElm.value = name;
    editor.setValue(examples.get(name), -1);
    editor.clearSelection();
}

const requestedExample = new URLSearchParams(window.location.search).get("example");
loadExample(examples.has(requestedExample) ? requestedExample : "hello-world.ved");

examplesElm.addEventListener("change", () => {
    const name = examplesElm.value;
    loadExample(name);
    if (location.protocol === "http:" || location.protocol === "https:") {
        const url = new URL(window.location.href);
        url.searchParams.set("example", name);
        history.replaceState(history.state, "", url);
    }
    runCode();
});
editor.container.addEventListener("keydown", (key) => {
    if (toggleBtn.checked) {
        if (key.code == "Space" || key.code == "Enter") {
            let pos = session.selection.getCursor();
            let text = session.doc.$lines[pos.row]
                .slice(0, pos.column)
                .split(" ")
                .pop();
            let sanskrit = Sanscript.t(text, "itrans", "devanagari");
            editor.session.replace(
                {
                    start: {
                        row: pos.row,
                        column: pos.column - text.length,
                    },
                    end: pos,
                },
                sanskrit
            );
        }
    }
});
