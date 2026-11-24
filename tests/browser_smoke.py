from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import expect, sync_playwright


def check_missing_delimiters(page):
    run = page.get_by_role("button", name="Run", exact=True)
    for filename, before, after, delimiter, output in [
        ("semicolon.ved", '\tमान नाम = "दुर्गम"', '  # नाम\r\nवद(नाम);', ";", "दुर्गम"),
        ("parenthesis.ved", 'वद(("दुर्गम")', ";", ")", "दुर्गम"),
    ]:
        source = "# test\r\n" + before + after

        def open_source(text):
            page.locator("#file-picker").set_input_files({
                "name": filename, "mimeType": "text/plain", "buffer": text.encode()
            })
            expect(page.get_by_text("Run a program to see its output.")).to_be_visible()

        open_source(source)
        run.click()
        error = page.locator(".log--error")
        expect(error).to_have_count(1)
        expect(page.locator("#runtime-status")).to_have_text("Failed")
        expect(error).to_contain_text(f'File "{filename}", line 2, column {len(before) + 1}')
        line = (before + after).splitlines()[0]
        hint = f"^ insert '{delimiter}' here"
        expect(error).to_contain_text(line)
        expect(error).to_contain_text(hint)

        # Measure the caret against the actual glyph boundary, including tabs and conjuncts.
        offset = error.evaluate("""(log, {line, before}) => {
            const text = log.firstChild;
            const start = text.data.indexOf("\\n    " + line + "\\n") + 5;
            const range = new Range();
            range.setStart(text, start + before.length);
            range.collapse(true);
            const expectedX = range.getBoundingClientRect().left;
            range.setStart(log.lastChild, 0);
            range.setEnd(log.lastChild, 1);
            return range.getBoundingClientRect().left - expectedX;
        }""", {"line": line, "before": before})
        assert abs(offset) <= 1, (filename, offset)

        open_source("# test\r\n" + before + delimiter + after)
        run.click()
        expect(page.locator("#console-logs .log")).to_have_text(["> " + output])


def check_import_keyword(page):
    run = page.get_by_role("button", name="Run", exact=True)
    for spelling, expected in [
        ("आवाहन", "सञ्चिकाः आवाहनं कर्तुं असमर्थः"),
        ("अवहन", "^ insert ';' here"),
    ]:
        source = f'{spelling} "./library.ved";'
        page.locator("#file-picker").set_input_files({
            "name": "import.ved", "mimeType": "text/plain", "buffer": source.encode()
        })
        expect(page.get_by_role("textbox", name="Vedic code editor")).to_have_text(source)
        expect(page.locator("#editor .tok-keyword")).to_have_text(
            ["आवाहन"] if spelling == "आवाहन" else []
        )
        run.click()
        expect(page.locator(".log--error")).to_contain_text(expected)


def check_cursor_edits(page):
    phrase = "दुर्गम दुर्गम दुर्गम Durgam"
    source = f'# first line\nवद("{phrase}");'
    page.locator("#file-picker").set_input_files({
        "name": "cursor.ved", "mimeType": "text/plain", "buffer": source.encode()
    })
    expect(page.locator("#filename")).to_have_text("cursor.ved")

    # Click the actual rendered glyph boundary inside the second word. Computing
    # coordinates through the editor would repeat the same bug as its hit testing.
    token = page.locator("#editor").get_by_text(f'"{phrase}"', exact=True)
    x, y = token.evaluate("""(span, prefix) => {
        const range = new Range();
        range.setStart(span.firstChild, prefix.length);
        range.collapse(true);
        const box = range.getBoundingClientRect();
        return [box.x, box.y + box.height / 2];
    }""", '"दुर्गम दुर्ग')
    page.mouse.click(x, y)
    page.keyboard.insert_text("X")
    expect(page.locator("#editor")).to_contain_text("दुर्गम दुर्गXम दुर्गम Durgam")

    page.keyboard.press("Backspace")  # X
    page.keyboard.press("Backspace")  # र्ग
    expect(page.locator("#editor")).to_contain_text("दुर्गम दुम दुर्गम Durgam")
    page.keyboard.press("ArrowLeft")
    page.keyboard.press("Shift+ArrowRight")  # select दु
    page.keyboard.insert_text("कि")
    expect(page.locator("#editor")).to_contain_text("दुर्गम किम दुर्गम Durgam")
    page.keyboard.press("ArrowLeft")
    page.keyboard.press("Delete")  # कि
    page.keyboard.press("Control+Enter")
    expect(page.locator("#console-logs .log")).to_have_text(["> दुर्गम म दुर्गम Durgam"])

    page.keyboard.press("Home")
    page.keyboard.press("Backspace")
    expect(page.locator("#editor")).to_contain_text('# first lineवद("दुर्गम म दुर्गम Durgam");')


def check_transliteration(page):
    page.locator("#file-picker").set_input_files({
        "name": "typing.ved", "mimeType": "text/plain", "buffer": b""
    })
    expect(page.locator("#filename")).to_have_text("typing.ved")
    field = page.get_by_role("textbox", name="Vedic code editor")
    field.press_sequentially("AvAhana")
    field.press("Space")
    expect(field.locator(".tok-keyword")).to_have_text("आवाहन")
    field.press_sequentially("kavi")
    field.press("Space")
    expect(field).to_contain_text("कवि")
    toggle = page.get_by_role("checkbox", name="Transliteration")
    toggle.uncheck()
    field.press_sequentially("kavi")
    field.press("Enter")
    expect(field).to_contain_text("कवि kavi")
    field.press_sequentially("vad")
    field.press("Control+Space")
    expect(page.get_by_role("listbox")).to_be_visible()
    field.press("Escape")
    toggle.check()


def check_examples(base_url, browser_name):
    with sync_playwright() as playwright:
        browser = getattr(playwright, browser_name).launch()
        print(f"Testing {browser_name} {browser.version}", flush=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        examples = page.get_by_role("combobox", name="Example")
        run = page.get_by_role("button", name="Run", exact=True)
        output = page.locator("#console-logs .log")

        page.goto(base_url)
        expect(examples).to_have_value("hello-world.ved")
        run.click()
        expect(output).to_have_text(["> नमस्ते विश्व!"])

        page.goto(base_url + "?lesson=first&example=yadiath.ved#editor")
        expect(examples).to_have_value("yadiath.ved")
        expect(page.get_by_text("Run a program to see its output.")).to_be_visible()
        expect(output).to_have_count(0)
        run.click()
        expect(output).to_have_text(["> वयं सम वयस्काः न एव"])

        examples.select_option("sutra.ved")
        expect(output).to_have_text(["> ३३"])
        link = urlsplit(page.url)
        assert parse_qs(link.query) == {"lesson": ["first"], "example": ["sutra.ved"]}
        assert link.fragment == "editor"

        expect(page.locator("#filename")).to_have_text("sutra.ved")
        page.get_by_role("button", name="Find in file").click()
        expect(page.get_by_role("textbox", name="Find", exact=True)).to_be_visible()
        page.keyboard.press("Escape")
        page.get_by_role("tab", name="Reference").click()
        expect(page.get_by_role("heading", name="Quick reference")).to_be_visible()
        page.keyboard.press("ArrowLeft")
        expect(page.get_by_role("tab", name="Console")).to_be_focused()
        page.locator(".history summary").click()
        expect(page.locator("#runs li")).to_have_count(2)
        expect(page.locator("#runs li").first).to_contain_text("sutra.ved · Finished")
        page.locator(".history summary").click()

        source = '# CRLF\r\nवद("परीक्षा");'
        page.locator("#file-picker").set_input_files({
            "name": "test.ved", "mimeType": "text/plain", "buffer": source.encode()
        })
        expect(page.locator("#filename")).to_have_text("test.ved")
        assert "example" not in parse_qs(urlsplit(page.url).query)
        page.keyboard.press("Control+Enter")
        expect(output).to_have_text(["> परीक्षा"])
        with page.expect_download() as download:
            page.get_by_role("button", name="Download file").click()
        assert download.value.suggested_filename == "test.ved"
        assert download.value.path().read_bytes() == source.encode()

        page.locator("#file-picker").set_input_files({
            "name": "error.ved", "mimeType": "text/plain", "buffer": 'मान अ = ;'.encode()
        })
        expect(page.locator("#filename")).to_have_text("error.ved")
        run.click()
        expect(page.locator("#runtime-status")).to_have_text("Failed")
        expect(page.locator(".log--error").first).not_to_contain_text("undefined: undefined")

        check_missing_delimiters(page)
        check_import_keyword(page)
        check_cursor_edits(page)
        check_transliteration(page)

        page.get_by_role("button", name="Dark theme").click()
        page.goto(base_url + "?example=sutra.ved")
        expect(page.get_by_role("button", name="Dark theme")).to_have_attribute("aria-pressed", "true")
        page.set_viewport_size({"width": 320, "height": 740})
        page.reload()
        editor_box = page.locator("#editor").bounding_box()
        output_box = page.locator("#output").bounding_box()
        assert editor_box["y"] + editor_box["height"] <= output_box["y"]
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        expect(examples).to_have_value("sutra.ved")
        run.click()
        expect(output).to_have_text(["> ३३"])
        page.get_by_role("button", name="Clear output").click()
        expect(output).to_have_count(0)

        page.goto(base_url + "?example=unknown.ved")
        expect(examples).to_have_value("hello-world.ved")
        run.click()
        expect(output).to_have_text(["> नमस्ते विश्व!"])
        assert not errors, errors
        browser.close()


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    handler = partial(SimpleHTTPRequestHandler, directory=root)
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        server_thread = Thread(target=server.serve_forever)
        server_thread.start()
        try:
            for browser_name in ("chromium", "firefox"):
                check_examples(f"http://127.0.0.1:{server.server_port}/", browser_name)
        finally:
            server.shutdown()
            server_thread.join()
