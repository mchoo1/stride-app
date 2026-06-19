# Stride — Scheduled Run Audit Log

Each scheduled run appends exactly one line here, success OR failure, so you can
see at a glance what happened on every night while you were away.

**Format:** `YYYY-MM-DD HH:MM | <task id> | <STATUS> | <commit> | <note>`

**Status key:**
- `DONE` — task completed, verified, committed.
- `BLOCKED` — official data couldn't be found; task skipped, queue moved on.
- `FAILED` — a run error (type error, tool failure, repo not mounted). Repo left
  clean; the next run retries the same task.
- `RECOVERED` — the run cleaned up a previous run's partial work before proceeding.

If you see several `FAILED` lines in a row, something needs a human: check that
the machine is awake at 2am, the OneDrive folder is mounted, and `npm install`
has been run in `app/`.

---

<!-- runs are appended below, newest at the bottom -->
- (no runs yet)
