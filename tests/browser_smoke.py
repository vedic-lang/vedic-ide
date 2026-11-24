from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import expect, sync_playwright


def check_examples(base_url):
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
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
        expect(page.locator(".ace_search_field").first).to_be_visible()
        page.keyboard.press("Escape")
        page.get_by_role("tab", name="Reference").click()
        expect(page.get_by_role("heading", name="Quick reference")).to_be_visible()
        page.keyboard.press("ArrowLeft")
        expect(page.get_by_role("tab", name="Console")).to_be_focused()
        page.locator(".history summary").click()
        expect(page.locator("#runs li")).to_have_count(2)
        expect(page.locator("#runs li").first).to_contain_text("sutra.ved · Finished")
        page.locator(".history summary").click()

        source = 'वद("परीक्षा");'
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
        assert download.value.path().read_text() == source

        page.locator("#file-picker").set_input_files({
            "name": "error.ved", "mimeType": "text/plain", "buffer": 'मान अ = ;'.encode()
        })
        expect(page.locator("#filename")).to_have_text("error.ved")
        run.click()
        expect(page.locator("#runtime-status")).to_have_text("Failed")
        expect(page.locator(".log--error").first).not_to_contain_text("undefined: undefined")

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
            check_examples(f"http://127.0.0.1:{server.server_port}/")
        finally:
            server.shutdown()
            server_thread.join()
