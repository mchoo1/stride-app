# How we work together on Stride

> One rule above all: **the code repo lives on each person's machine in a normal
> folder, NOT inside OneDrive. GitHub is our shared meeting point.**
> OneDrive corrupts Git and can't merge code — keep it for docs/images only.

---

## One-time setup (each person, once)

Clone a fresh copy from GitHub into a normal folder (e.g. Desktop or Documents —
**not** OneDrive):

```powershell
git clone https://github.com/mchoo1/stride-app.git "C:\Users\<you>\Desktop\stride-app"
cd "C:\Users\<you>\Desktop\stride-app\app"
npm install
```

Set your name once (so commits show who did what):
```powershell
git config user.name  "Your Name"
git config user.email "you@example.com"
```

> **Ming Hao:** your old OneDrive copy's Git is corrupted — don't use it. Clone
> fresh as above, point Cowork at the new Desktop folder, and copy your
> `app/.env.local` (secrets) into the new `app/` folder so the app still runs.

---

## The daily rhythm (3 steps)

Every time you sit down to work:

**1. Get the latest first**
```powershell
git pull
```
This pulls in whatever the other person pushed and merges it into your copy.

**2. Do your work, then save it**
```powershell
git add -A
git commit -m "short description of what you changed"
```

**3. Send it to GitHub**
```powershell
git push
```

If `git push` is rejected with "fetch first" / "non-fast-forward," it just means
the other person pushed while you were working. Fix:
```powershell
git pull      # Git merges their work into yours
git push      # now it goes through
```

---

## What happens when you both edit the same file

- **Different parts of the file** (e.g. you add hawker dishes at the bottom,
  Ming Hao edits a chain in the middle) → Git merges both automatically. Nothing lost.
- **The exact same lines** → Git pauses and marks a "conflict" in the file like:
  ```
  <<<<<<< your version
  ...your line...
  =======
  ...their line...
  >>>>>>> their version
  ```
  Just edit the file to keep the correct version, delete the `<<<`/`===`/`>>>`
  markers, then `git add -A && git commit && git push`. Nothing is ever lost
  silently — a human always chooses.

**Tip to avoid conflicts:** `git pull` before you start, and `git push` as soon
as you finish a chunk. Small, frequent pushes rarely collide.

---

## Golden rules

1. **Never put the repo inside OneDrive / Dropbox / Google Drive.** That's what
   corrupted it last time.
2. **Pull before you start, push when you finish.**
3. **Commit in small chunks** with clear messages.
4. OneDrive is fine for the `planning/` docs, slides, and images — just not the
   live code repo.

---

## Where things are now

- GitHub (`github.com/mchoo1/stride-app`) is the single source of truth — current
  and healthy.
- Dean's working copy: `C:\Users\user\Desktop\stride-app` (clean).
- The old OneDrive `Fitness App` folder: **retired as a repo** (its Git is
  corrupted). Keep it only as a backup of non-code files if you want.
