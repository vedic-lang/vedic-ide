// GitHub Pages serves this repository directly. Ship the locked browser bundle and its licenses.
import {build} from "esbuild";
import {readFile, writeFile} from "node:fs/promises";

const result = await build({
    entryPoints: ["js/source-editor.js"],
    outfile: "vendor/vedic-editor.min.js",
    bundle: true,
    minify: true,
    format: "iife",
    globalName: "VedicEditor",
    metafile: true,
});
const dependencies = new Set();
for (const input of Object.keys(result.metafile.inputs)) {
    const match = input.match(/^node_modules\/((?:@[^/]+\/)?[^/]+)\//);
    if (match) dependencies.add(match[1]);
}
const notices = [];
for (const name of [...dependencies].sort()) {
    const license = await readFile(`node_modules/${name}/LICENSE`, "utf8");
    notices.push(name + "\n" + license.trim());
}
await writeFile("vendor/vedic-editor.LICENSE.txt", notices.join("\n\n") + "\n");
