#!/usr/bin/env python
"""ask_agy.py -- reliable one-shot bridge to the Antigravity (agy) CLI agent.

agy renders its --print response through a TUI that only emits text to a real
pseudo-console. Plain pipes get nothing; winpty is flaky because it can't always
read console dimensions. This wrapper uses Windows ConPTY (via pywinpty) with an
explicit terminal size, so capture is reliable regardless of how it's launched.

Usage:
    py ask_agy.py "your message"
    py ask_agy.py -c "follow-up that continues the previous conversation"

Returns the agent's clean text response on stdout.
"""
import sys
import re
from winpty import PtyProcess

AGY = r"C:\Users\Nabiullah\AppData\Local\agy\bin\agy.exe"

_OSC = re.compile(r"\x1B\][^\x07\x1B]*(?:\x07|\x1B\\)")
_CSI = re.compile(r"\x1B\[[0-9;?]*[ -/]*[@-~]")
_ESC = re.compile(r"\x1B[@-Z\\-_]")


def strip_ansi(s: str) -> str:
    s = _OSC.sub("", s)
    s = _CSI.sub("", s)
    s = _ESC.sub("", s)
    return s


def ask(prompt: str, cont: bool = False, timeout: int = 180) -> str:
    argv = [AGY, "--dangerously-skip-permissions"]
    if cont:
        argv.append("--continue")
    argv += ["--print", prompt]

    # rows, cols -- explicit non-zero size avoids the winpty cols/rows assertion
    proc = PtyProcess.spawn(argv, dimensions=(50, 160))

    chunks = []
    while True:
        try:
            data = proc.read()
        except EOFError:
            break
        if data:
            chunks.append(data)
        elif not proc.isalive():
            break

    raw = "".join(chunks)
    clean = strip_ansi(raw).replace("\r\n", "\n").replace("\r", "\n")
    lines = [ln.rstrip() for ln in clean.split("\n")]
    lines = [ln for ln in lines if ln.strip() and "Assertion failed" not in ln]
    return "\n".join(lines)


def main() -> int:
    # Windows default stdout is cp1252; agent replies contain Unicode (arrows,
    # em-dashes, etc). Force UTF-8 so printing never crashes.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    args = sys.argv[1:]
    cont = False
    if args and args[0] == "-c":
        cont = True
        args = args[1:]
    if not args:
        print('usage: py ask_agy.py [-c] "message"', file=sys.stderr)
        return 2
    print(ask(" ".join(args), cont=cont))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
