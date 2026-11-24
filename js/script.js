const runButton = document.getElementById("btn-run");

runButton.disabled = true;
window.vedicReady = wasm_bindgen().then(
    () => null,
    (error) => error
).finally(() => {
    runButton.disabled = false;
});
