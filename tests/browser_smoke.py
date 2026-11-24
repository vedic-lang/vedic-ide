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
        expect(output).to_have_text(["Run a program to see its output."])
        run.click()
        expect(output).to_have_text(["> वयं सम वयस्काः न एव"])

        examples.select_option("sutra.ved")
        expect(output).to_have_text(["> ३३"])
        link = urlsplit(page.url)
        assert parse_qs(link.query) == {"lesson": ["first"], "example": ["sutra.ved"]}
        assert link.fragment == "editor"

        page.set_viewport_size({"width": 375, "height": 812})
        page.reload()
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
