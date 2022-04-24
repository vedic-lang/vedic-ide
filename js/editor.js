// Retrieve Elements
const consoleLogList = document.getElementById('console-logs');
const executeCodeBtn = document.getElementById('btn-run');
const resetCodeBtn = document.getElementById('btn-clear');

// Setup Ace
let codeEditor = ace.edit("editor");
let session = codeEditor.session
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
        consoleMessages.forEach(log => {
            const newLogItem = document.createElement('li');
            const newLogText = document.createElement('pre');

            newLogText.className = log.class;
            newLogText.textContent = `> ${log.message}`;

            newLogItem.appendChild(newLogText);

            consoleLogList.appendChild(newLogItem);
        })
    },
    init() {
        // Configure Ace Options
        codeEditor.setOptions({
            wrap: true,   // wrap text to view
            indentedSoftWrap: false,
            behavioursEnabled: false, // disable autopairing of brackets and tags        
        });

        // Set Default Code
        codeEditor.setValue(defaultCode);
    },
    add(text) {
        session.insert(session.selection.getCursor(), " " + text + " "); // Insert the text at the current cursor position
    }
}

// Events
executeCodeBtn.addEventListener('click', () => {
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
});

resetCodeBtn.addEventListener('click', () => {
    // Clear ace editor
    codeEditor.setValue(defaultCode);

    // Clear console messages
    editorLib.clearConsoleScreen();
})

editorLib.init();

//add keyword button dnymically
let Keyword = ["मान","वद्","यदि","अथ","सत्य","असत्य","सूत्र","फल","चक्रम्","पर्यन्तम्","विराम्","निर्देश","यद","यदभावे","अवहन्"];
let KeywordArea = document.getElementsByClassName('hint-area')[0];
Keyword.forEach(keyword => {
    let newBtn = document.createElement('button');
    newBtn.textContent = keyword;
    newBtn.addEventListener('click', () => {
        editorLib.add(keyword);
    });
    KeywordArea.appendChild(newBtn);
});