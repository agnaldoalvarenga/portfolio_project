# ostentaculus-platform — agent notes

## RTK — token-saving command prefixes

This repo uses [RTK](https://github.com/rtk-ai/rtk) to compress noisy command
output before it reaches the model. Most commands (`git`, `make`, `tsc`,
`vitest`, `psql`, `systemctl status`, `docker compose logs`, …) are rewritten
automatically by the RTK PreToolUse hook — nothing to do.

A few commands used in this project are **not** auto-rewritten by the hook.
Prefix them with `rtk` manually to get the savings:

| Command | Use instead |
|---|---|
| `apt …` / `apt-get …` (VPS installs) | `rtk apt …` |
| `journalctl …` (VPS systemd logs) | `rtk journalctl …` |
| `docker compose up / pull / start` | `rtk docker compose up …` |

Custom filters for these live in `.rtk/filters.toml`. They strip only
proven-noise lines (progress/housekeeping) and always keep errors, warnings
and summaries.

One-time activation per machine (Mac and VPS), from the repo root:

    rtk trust

Verify with `rtk trust --list`. RTK itself is installed globally
(`rtk --version`); the Claude Code hook is configured via `rtk init -g`.
