<h1 align="center">Welcome to Vedic IDE 👋</h1>
<p>
  <a href="https://vedic-lang.github.io" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/vedic-lang/vedic-ide/blob/main/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
  <a href="https://twitter.com/ptprashant09" target="_blank">
    <img alt="Twitter: ptprashant09" src="https://img.shields.io/twitter/follow/ptprashant09.svg?style=social" />
  </a>
</p>

> A browser IDE for writing and running Vedic programs with Sanskrit keywords and Devanagari syntax.

### 🏠 [Homepage](https://vedic-lang.github.io/vedic-ide)

### ✨ [Demo](https://vedic-lang.github.io/vedic-ide)

The IDE opens with Hello World. Press **Run** to see `नमस्ते विश्व!` in the console. To share a built-in program, choose it in **Example** and copy the address bar. The link opens the original example, including for someone visiting the IDE for the first time. [Open the functions example](https://vedic-lang.github.io/vedic-ide/?example=sutra.ved)

The editor and console sit side by side on desktop and stack on phones. Use **Ctrl+Enter** (or **⌘+Enter** on macOS) to run the current file. **Open local file** and **Download** work with UTF-8 source on your device. **Reference** lists common Vedic expressions, and **Run history** shows the last 20 runs in this session.

When the compiler expects a semicolon or closing parenthesis, the console shows the filename, the source line, and a caret where you can insert the punctuation.

### Run locally

From this repository's directory, start a local web server:

```bash
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). The browser IDE needs HTTP to load its WebAssembly file; opening `index.html` directly does not work.

### Test the first run

Run these commands from the repository root with a Python virtual environment active. The smoke test starts its own local server and runs the bundled WebAssembly interpreter in Chromium and Firefox. It also checks clicking, selecting, and deleting inside Devanagari words.

```bash
python -m pip install -r tests/requirements.txt
python -m playwright install --only-shell chromium firefox
python tests/browser_smoke.py
```

The static site includes the editor bundle. After changing [the editor source](js/source-editor.js) or its dependencies, run `npm ci` and `npm run build:editor`, then commit the updated files in `vendor/`. CI checks that the bundle matches the source.

## Author

👤 **Pt. Prashant Tripathi**

* Website: [ptprashanttripathi.github.io](https://ptprashanttripathi.github.io)
* Twitter: [@ptprashant09](https://twitter.com/ptprashant09)
* Github: [@ptprashanttripathi](https://github.com/ptprashanttripathi)
* LinkedIn: [@ptprashanttripathi](https://linkedin.com/in/ptprashanttripathi)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/vedic-lang/vedic-ide/issues). 

## Show your support

Give a ⭐️ if this project helped you!

<a href="https://www.patreon.com/ptprashanttripathi">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## 📝 License

Copyright © 2022 [Pt. Prashant Tripathi](https://github.com/ptprashanttripathi).<br />
This project is [MIT](https://github.com/vedic-lang/vedic-ide/blob/main/LICENSE) licensed.

***
_made with ❤️ in india_
