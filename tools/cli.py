import os
import sys
import subprocess
import argparse


def clear():
    print("Clearing screen...")
    clear_command = "cls" if os.name == "nt" else "clear"
    output = subprocess.run([clear_command])
    return output.returncode


def format_code():
    print("Formatting code...")
    output = subprocess.run(["bash", "tools/formatter.sh"])
    return output.returncode


def validate_return_code(returncode):
    if returncode != 0:
        print("\nFailed")
        sys.exit(1)


def start_server(port):
    print("Starting web server...")
    output = subprocess.run(
        [sys.executable, "-m", "http.server", "--bind", "localhost", str(port)]
    )
    return output.returncode


def run():
    # get arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("-c", "--clear", action="store_true", help="clear screen")
    parser.add_argument("-f", "--format", action="store_true", help="format code")
    parser.add_argument(
        "--serve",
        help="Start Web Server for Wasm",
        type=int,
        metavar="PORT",
    )
    parser.add_argument("--varbose", action="store_true", help="varbose mode")
    args = parser.parse_args()

    if args.varbose:
        print(args)
        ENV_VARBOSE = True

    if args.format:
        validate_return_code(format_code())

    if args.clear:
        validate_return_code(clear())

    if args.serve:
        validate_return_code(start_server(args.serve))

    if not any(vars(args).values()):
        validate_return_code(parser.print_help())


if __name__ == "__main__":
    run()
