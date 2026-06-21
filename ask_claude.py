#!/usr/bin/env python
"""ask_claude.py -- endpoint so OTHER agents can message Claude Code (this CLI).

This is the mirror of ask_agy.py:
  - ask_agy.py    : Claude  -> Antigravity (Gemini)
  - ask_claude.py : any agent -> Claude Code

It spawns a headless `claude -p` (print mode) and returns Claude's text reply.
The prompt is passed via STDIN so there are no shell-quoting problems with
quotes, &, |, newlines, etc. Each call is a fresh Claude session unless -c is used.

Usage (from any other agent / CLI):
    py ask_claude.py "your message"
    py ask_claude.py -c "follow-up that continues the previous Claude conversation"
    py ask_claude.py --act "edit X in the project"   # let Claude make file edits

Flags:
    -c / --continue   Continue Claude's most recent conversation (keeps memory).
    --act             Allow Claude to apply file edits (--permission-mode acceptEdits).
                      Without it, Claude answers/reads only and will not change files;
                      tool calls that need approval are skipped (safe, never hangs).

Returns Claude's reply on stdout. Each turn typically takes ~10-60s.
"""
import sys
import subprocess

# `claude` on Windows is a .cmd shim, so invoke through cmd /c.
BASE = ["cmd", "/c", "claude", "-p", "--output-format", "text"]


def ask(prompt: str, cont: bool = False, act: bool = False, timeout: int = 600) -> str:
    cmd = list(BASE)
    if cont:
        cmd.append("--continue")
    if act:
        cmd += ["--permission-mode", "acceptEdits"]
    try:
        res = subprocess.run(
            cmd,
            input=prompt,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return "[ask_claude] timed out waiting for Claude Code."
    out = (res.stdout or "").strip()
    if not out:
        out = (res.stderr or "").strip() or f"[ask_claude] no output (rc={res.returncode})"
    return out


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    args = sys.argv[1:]
    cont = act = False
    while args and args[0] in ("-c", "--continue", "--act"):
        if args[0] == "--act":
            act = True
        else:
            cont = True
        args = args[1:]

    if not args:
        print('usage: py ask_claude.py [-c] [--act] "message"', file=sys.stderr)
        return 2

    print(ask(" ".join(args), cont=cont, act=act))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
