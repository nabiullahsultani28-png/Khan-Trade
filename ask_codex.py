#!/usr/bin/env python
"""ask_codex.py -- endpoint so OTHER agents can message Codex CLI.

This mirrors the local agent bridges:
  - ask_agy.py    : agent -> Antigravity / Gemini
  - ask_claude.py : agent -> Claude Code
  - ask_codex.py  : agent -> Codex CLI

It runs `codex exec` non-interactively and returns only Codex's final text
reply. The prompt is passed through STDIN, so quotes, &, |, and newlines are
safe. Each call starts a fresh Codex session unless -c / --continue is used.

Usage:
    py ask_codex.py "your message"
    py ask_codex.py -c "follow-up that continues the previous Codex session"
    py ask_codex.py --act "edit X in the project"

Flags:
    -c / --continue   Resume the most recent Codex session (`codex exec resume --last`).
    --act             Let Codex edit/run commands by using danger-full-access and
                      bypassing approval prompts. Use only for trusted local agent work.

Returns Codex's final answer on stdout. Each turn typically takes ~10-90s.
"""
import os
import sys
import tempfile
import subprocess


CODEX = r"C:\Users\Nabiullah\AppData\Roaming\npm\codex.cmd"
WORKDIR = r"C:\Users\Nabiullah\Desktop\Build\trade\site"


def _base_cmd(cont: bool, act: bool, output_path: str) -> list[str]:
    sandbox = "danger-full-access" if act else "read-only"

    if cont:
        # `codex exec resume` does not accept -C/--sandbox; it resumes the
        # latest session for cwd, and cwd is set in subprocess.run below.
        cmd = [
            CODEX,
            "exec",
            "resume",
            "--last",
            "-o",
            output_path,
            "-",
        ]
    else:
        cmd = [
            CODEX,
            "exec",
            "-C",
            WORKDIR,
            "--sandbox",
            sandbox,
            "-o",
            output_path,
            "-",
        ]

    if act:
        insert_at = 4 if cont else 3
        cmd[insert_at:insert_at] = ["--dangerously-bypass-approvals-and-sandbox"]

    return cmd


def ask(prompt: str, cont: bool = False, act: bool = False, timeout: int = 900) -> str:
    fd, out_path = tempfile.mkstemp(prefix="ask_codex_", suffix=".txt")
    os.close(fd)

    cmd = _base_cmd(cont=cont, act=act, output_path=out_path)
    try:
        res = subprocess.run(
            cmd,
            input=prompt,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
            cwd=WORKDIR,
        )
    except subprocess.TimeoutExpired:
        try:
            os.remove(out_path)
        except OSError:
            pass
        return "[ask_codex] timed out waiting for Codex CLI."

    try:
        with open(out_path, "r", encoding="utf-8", errors="replace") as f:
            out = f.read().strip()
    except OSError:
        out = ""
    finally:
        try:
            os.remove(out_path)
        except OSError:
            pass

    if not out:
        out = (res.stdout or "").strip()
    if not out:
        out = (res.stderr or "").strip() or f"[ask_codex] no output (rc={res.returncode})"

    return out


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    args = sys.argv[1:]
    cont = False
    act = False
    while args and args[0] in ("-c", "--continue", "--act"):
        if args[0] == "--act":
            act = True
        else:
            cont = True
        args = args[1:]

    if not args:
        print('usage: py ask_codex.py [-c] [--act] "message"', file=sys.stderr)
        return 2

    print(ask(" ".join(args), cont=cont, act=act))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
