# RTK — practical usage guide (60–90% token savings in Claude Code)

RTK compresses **command output** before it becomes tokens. It does not change
Claude's reasoning or the code it writes — it shrinks the noisy output of the
dev loop (git, tests, builds, logs, file reads).

## How the savings happen

- **Automatic (hook):** when a command runs in the terminal, the RTK PreToolUse
  hook rewrites `cmd` -> `rtk cmd`, which runs identically but returns compressed
  output (no ANSI, no progress bars, no boilerplate).
- **Manual (custom filters):** commands the hook does not cover — `apt`,
  `journalctl`, `docker compose up|pull|start` — must be prefixed with `rtk`.
  See `.rtk/filters.toml`; the repo `CLAUDE.md` tells the agent to do it.

## Where 60–90% is real (and where it isn't)

Savings are **per verbose operation**, not a discount on the whole session.

High savings: git diff/log/status, test failures, builds (tsc/cargo/docker),
logs, apt install, docker compose up, big ls/cat/grep/find.
Little/no savings: Claude's reasoning, code it writes, chat answers, small files.

## Already automatic (nothing to do)

    cat -> rtk read     ls -> rtk ls      head/tail -> rtk read --max/--tail
    grep -> rtk grep    find -> rtk find  rg -> rtk rg
    git diff/log/status/show -> rtk git   cargo/docker/curl -> rtk

## The one practical gotcha

Claude's native Read / Grep / Glob tools BYPASS the hook — they read raw,
uncompressed. RTK only compresses what runs through the terminal (Bash).
For large files and wide searches, prefer `rtk read` / `rtk grep` / `rtk find`
(ask for it explicitly: "use rtk read for that big log").

## Five habits for maximum savings

1. Let Claude work through the terminal (more commands run = more compression).
2. Ask for `rtk read` / `rtk grep` on large files and logs.
3. Run `rtk trust` once per machine in the repo (enables .rtk/filters.toml).
4. Don't add commands to exclude_commands without a reason.
5. Keep RTK updated — new versions ship more built-in filters.

## Measure it

    rtk gain            # total tokens saved, ranked by command
    rtk cc-economics    # spend (ccusage) vs RTK savings
    rtk discover        # scans history, flags where you missed rtk (most useful)

## Health check (run occasionally per machine)

    rtk --version
    rtk init -g --show   # hook [ok] in settings.json
    rtk verify           # hook integrity + filter tests
    rtk trust --list     # project filters trusted

New noisy command? `rtk discover` flags it -> add a filter to .rtk/filters.toml,
run `rtk verify`, commit. Filters strip only proven noise (progress/housekeeping)
and always keep errors, warnings and summaries.
