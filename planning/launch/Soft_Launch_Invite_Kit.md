# Stride — Soft Launch Invite Kit

> For DEAN_NEXT.md item #4 (soft-launch group). Send only after UAT Round 2 passes.
> This is a small, personal beta ask to 10–20 real contacts — not the public
> App/Play Store launch (that's `Stride_Launch_Kit.docx`, Section 3, for later).

---

## Who to invite

10–20 people who will actually use it and tell you the truth. Good mix:
a few who eat hawker/kopitiam daily, a few already tracking calories elsewhere
(MyFitnessPal, Noom), a few who'll break things by accident. Avoid inviting
only people who'll be nice about it — you want friction, not compliments.

---

## Option A — WhatsApp / Telegram message (recommended for SG)

Most of your 10–20 will respond faster here than email. Keep it short,
personal, one-to-one — not a broadcast blast.

```
Hey [Name] 👋

Remember I mentioned I've been building a food/fitness tracker for SG?
It's ready for a small group to try before we open it up properly —
you're one of maybe 15 people I'm asking.

It's a calorie + macro tracker built around actual SG food (hawker,
kopitiam, FairPrice, chain restaurants) instead of the usual US-only
databases. Free, takes 2 min to set up.

Link: https://stride-app-rosy.vercel.app

No pressure to use it every day — even just poking around for 10 minutes
and telling me what confused you or broke would help a lot. I'll follow
up in a few days to ask what you think.

Thanks 🙏
```

---

## Option B — Email version

Use if WhatsApp isn't natural for the contact (e.g. a professional
connection, a nutritionist/PT contact from the launch kit's Week 2 outreach).

**Subject:** Quick favour — trying out something I built before it goes public

```
Hi [Name],

I've been building Stride, a calorie and macro tracker made specifically
for Singapore food — hawker centres, kopitiam, chain restaurants, FairPrice
ready meals — instead of the generic US databases most calorie apps use.

It's live, but before we open it up publicly I want a small group of real
users to break it and tell me what's confusing, missing, or just doesn't
work. You're one of about 15 people I'm asking directly.

Would you be up for trying it for a few days? No commitment beyond that —
even 10 minutes of poking around and honest feedback is genuinely useful.

Link: https://stride-app-rosy.vercel.app

If you hit any bugs or have thoughts, just reply to this email — I read
every one.

Thanks for helping out,
[Your name]
```

---

## What to ask for (send 3–4 days after they install)

Keep the feedback ask short — a wall of questions kills response rates.

```
Hey [Name] — how's Stride been so far? Three quick things if you have
a sec:

1. Did anything feel confusing or broken?
2. Is there a food you searched for that wasn't there?
3. Would you actually keep using this, or was it a one-time poke-around?

No wrong answers — the blunter the better.
```

Log anything they flag straight into `testing/UAT_Tracker.xlsx` alongside
the UAT Round 2 defects, so it's all in one place.

---

## Simple tracking sheet

Copy this into a note or spreadsheet — nothing fancy needed for 15 people.

| Name | Contact method | Sent date | Installed? | Feedback received? | Notes |
|------|---------------|-----------|------------|---------------------|-------|
|      |               |           |            |                     |       |

---

## Sequencing (ties back to DEAN_NEXT.md)

1. UAT Round 2 passes (register ×5, onboarding, recommendations, add-meal — all clean; nearby-places confirmed working on Foursquare).
2. Send Option A/B to your 10–20.
3. Wait 3–4 days, send the feedback ask.
4. Fold defects into `testing/UAT_Tracker.xlsx`.
5. Once feedback is in and top issues are fixed, move to the full public launch using `Stride_Launch_Kit.docx`.
