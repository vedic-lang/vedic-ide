// Retrieve Elements
const consoleLogList = document.getElementById("console-logs");
const executeCodeBtn = document.getElementById("btn-run");
const resetCodeBtn = document.getElementById("btn-clear");
const examplesElm = document.getElementById('examples-select');

// Setup Ace
let codeEditor = ace.edit("editor");
let session = codeEditor.session;
let defaultCode = `वद् "हेलो विश्व!";`;
let consoleMessages = [];

let editorLib = {
    clearConsoleScreen() {
        consoleMessages.length = 0;

        // Remove all elements in the log list
        while (consoleLogList.firstChild) {
            consoleLogList.removeChild(consoleLogList.firstChild);
        }
    },
    printToConsole() {
        consoleMessages.forEach((log)=>{
            const newLogItem = document.createElement("li");
            const newLogText = document.createElement("pre");

            newLogText.className = log.class;
            newLogText.textContent = `> ${log.message}`;

            newLogItem.appendChild(newLogText);

            consoleLogList.appendChild(newLogItem);
        }
        );
    },
    init() {
        // Configure Ace Options
        codeEditor.setOptions({
            wrap: true,
            // wrap text to view
            indentedSoftWrap: false,
            behavioursEnabled: false,
            // disable autopairing of brackets and tags
        });

        // Set Default Code
        codeEditor.setValue(defaultCode);
    },
    add(text) {
        session.insert(session.selection.getCursor(), " " + text + " ");
        // Insert the text at the current cursor position
    },
};

// Events
executeCodeBtn.addEventListener("click", ()=>{
    // Get input from the code editor
    const userCode = codeEditor.getValue();

    // Run the user code
    try {
        vedic(userCode);
    } catch (err) {
        console.error(err);
    }

    // Print to the console
    editorLib.printToConsole();
}
);

resetCodeBtn.addEventListener("click", ()=>{
    // Clear ace editor
    // codeEditor.setValue(defaultCode);

    // Clear console messages
    editorLib.clearConsoleScreen();
}
);

editorLib.init();

//add keyword button dnymically
let Keyword = ["मान", "वद्", "यदि", "अथ", "सत्य", "असत्य", "सूत्र", "फल", "चक्रम्", "पर्यन्तम्", "विराम्", "निर्देश", "यद", "यदभावे", "अवहन्", ];
let KeywordArea = document.getElementsByClassName("hint-area")[0];
Keyword.forEach((keyword)=>{
    let newBtn = document.createElement("button");
    newBtn.textContent = keyword;
    newBtn.addEventListener("click", ()=>{
        editorLib.add(keyword);
    }
    );
    KeywordArea.appendChild(newBtn);
}
);

// examples
const examples = new Map([["hello-world.ved", `वद् "हेलो विश्व!";`], ["operators.ved", "वद् २+१; # ३\nवद् २-१; # १\nवद् २*१; # २\nवद् २/१; # २\nवद् २%१; # ०\nवद् २>१; # सत्य\nवद् २<१; # असत्य\nवद् २==१; # असत्य\nवद् २!=१; # सत्य\nवद् २>=१; # सत्य\nवद् २>=१; # सत्य\nवद् २<=१; # असत्य\nवद् २&&१; # सत्य\nवद् २||१; # सत्य"], ["suchi.ved", "# Creating an सूचि\nमान क = [[\"आम\",१ ],[\"संतरा\",२],[\"सेब\",३]];\nवद् क;\n\n# Adding elements to a सूचि\nमान सप्तर्षि = []; # रिक्त सूचि - Empty list\n\nमान सप्तर्षि[]= \"Kashyapa\";\nमान सप्तर्षि[]= \"Atri\";\nमान सप्तर्षि[]= \"Vasistha\";\nमान सप्तर्षि[]= \"Vishwamitra\";\nमान सप्तर्षि[]= \"Bharadvaja\";\nमान सप्तर्षि[]= \"Gautama\";\nमान सप्तर्षि[]= \"Jamadagni\";\n\nवद् सप्तर्षि;\nवद् कुल(सप्तर्षि);"], ["sutra.ved", "सूत्र योग(अ,ब){\n    फल अ+ब;\n}\n\nवद् योग(११,२२); # it will print ३३ "], ["viram.ved", "# This will print only till ५, it will break after अ = ५\nचक्रम्(मान अ = ०; अ < १०; मान  अ = अ+ १)\n{\n  यदि (अ > ५){\n    विराम्;\n }\n  वद्  \"अ = \" + अ;\n}"], ["yadiath.ved", "मान आयु = ३२;\nयदि (आयु == २५) {\n  वद् \"वयं सम वयस्काः एव\"; # We're the same age\n}\nअथ यदि (आयु > २५) {\n  वद् \"वयं सम वयस्काः न एव\"; # We're not the same age\n}\nअथ {\n  वद् \"मम अपेक्षया कनिष्ठः वा\"; # Younger to me\n}"], ["nirdesa.ved", "मान अ = ३;\n\nनिर्देश (अ) {\n    यद १:\n        वद् 'निर्देश १ अनुष्ठित'; # case 1 executed\n    यद २:\n        वद् 'निर्देश २ अनुष्ठित'; \n    यद ३:\n        वद् 'निर्देश ३ अनुष्ठित'; \n    यदभावे:\n        वद् 'यदभावे औत्सर्गिक निर्देश अनुष्ठित'; # In the absence of incident default case executed\n}"], ["chakram.ved", "चक्रम्(मान अ = ०; अ < १०; मान  अ = अ+ १)\n{\n  # चक्रम् takes in 3 parameters initial value, and condition, and a step size\n  वद्  \"अ = \" + अ;\n} \n# This will print ० to ९"], ["simpleinterest", "सूत्र मिश्रधन(म,द,स){\n    फल म+(म*द*स/१००);\n   }\nमान मूलधन = १०००;\nमान दर = ८;\nमान समय = ५; \n\nवद् \"मिश्रधन = \n\"+मिश्रधन(मूलधन,दर,समय);"]]);
for (let name of examples.keys()) {
    const elm = document.createElement("option");
    elm.innerText = name;
    examplesElm.appendChild(elm);
}
examplesElm.addEventListener("change", (evt)=>{
    if (evt.target.value) {
        codeEditor.setValue(examples.get(evt.target.value), -1);
        editorLib.clearConsoleScreen();
        executeCodeBtn.click();
    }
}
);
