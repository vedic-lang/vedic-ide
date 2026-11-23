const { vedic } = wasm_bindgen;
const executeCodeBtn = document.getElementById("btn-run");

executeCodeBtn.disabled = true;
window.vedicReady = wasm_bindgen().then(
    () => null,
    (error) => error
).finally(() => {
    executeCodeBtn.disabled = false;
});
