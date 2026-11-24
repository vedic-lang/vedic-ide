const outputTab = document.getElementById("console-tab");
const referenceTab = document.getElementById("reference-tab");
const emptyConsole = document.getElementById("empty-console");
const runtimeStatus = document.getElementById("runtime-status");
const filename = document.getElementById("filename");
const filePicker = document.getElementById("file-picker");
const runs = document.getElementById("runs");
let runCount = 0;

function setStatus(label, state) {
    runtimeStatus.textContent = label;
    runtimeStatus.dataset.state = state;
}

async function showRuntimeStatus() {
    const revision = latestRun;
    const error = await window.vedicReady;
    if (revision === latestRun) {
        setStatus(error ? "Runtime unavailable" : "Ready", error ? "error" : "ready");
    }
}
showRuntimeStatus();

function selectPanel(activeTab) {
    for (const tab of [outputTab, referenceTab]) {
        const selected = tab === activeTab;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
    }
    document.getElementById("btn-clear").hidden = activeTab !== outputTab;
}

for (const tab of [outputTab, referenceTab]) {
    tab.addEventListener("click", () => selectPanel(tab));
    tab.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "Home") next = outputTab;
        else if (event.key === "End") next = referenceTab;
        else if (["ArrowLeft", "ArrowRight"].includes(event.key)) next = tab === outputTab ? referenceTab : outputTab;
        else return;
        event.preventDefault();
        selectPanel(next);
        next.focus();
    });
}

function recordRun(file, elapsed, failed) {
    const result = failed ? "Failed" : "Finished";
    setStatus(result, failed ? "error" : "ready");
    const line = document.createElement("li");
    const time = document.createElement("time");
    const now = new Date();
    time.dateTime = now.toISOString();
    time.textContent = now.toLocaleTimeString();
    const description = document.createElement("span");
    description.className = "run-description";
    description.textContent = file + " · " + result + " · " + Math.round(elapsed) + " ms";
    line.append(time, description);
    runs.prepend(line);
    if (runs.children.length > 20) runs.lastElementChild.remove();
    document.getElementById("no-runs").hidden = true;
    document.getElementById("run-count").textContent = ++runCount;
}

const themeButton = document.getElementById("theme");
function applyTheme(dark) {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    themeButton.setAttribute("aria-pressed", String(dark));
}
try {
    applyTheme(localStorage.getItem("vedic-ide-theme") === "dark");
} catch {
    applyTheme(false);
}
themeButton.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme !== "dark");
    try {
        localStorage.setItem("vedic-ide-theme", document.documentElement.dataset.theme);
    } catch {
        // The theme still works for this page when storage is disabled.
    }
});

document.getElementById("find").addEventListener("click", () => {
    editor.focus();
    editor.execCommand("find");
});

document.getElementById("open-file").addEventListener("click", () => filePicker.click());
filePicker.addEventListener("change", async () => {
    const file = filePicker.files[0];
    if (!file) return;
    filePicker.value = "";
    const revision = ++latestRun;
    try {
        const source = await file.text();
        if (revision !== latestRun) return;
        editor.setValue(source, -1);
        filename.textContent = file.name;
        examplesElm.selectedIndex = -1;
        updateExampleURL(null);
        resetOutput();
        editor.focus();
    } catch {
        setStatus("Could not open file", "error");
    }
});

document.getElementById("download").addEventListener("click", () => {
    const file = new Blob([editor.getValue()], {type: "text/plain;charset=utf-8"});
    const link = document.createElement("a");
    const url = URL.createObjectURL(file);
    link.href = url;
    link.download = filename.textContent;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.isComposing) {
        event.preventDefault();
        event.stopPropagation();
        if (!executeCodeBtn.disabled) runCode();
    }
}, true);

session.selection.on("changeCursor", () => {
    const cursor = editor.getCursorPosition();
    document.getElementById("position").textContent = `Ln ${cursor.row + 1}, Col ${cursor.column + 1}`;
});
new ResizeObserver(() => editor.resize()).observe(editor.container);
