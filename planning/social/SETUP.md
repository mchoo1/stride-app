# Stride Social Media Setup Guide

## Step 1 — Create the Stride email account

1. Go to https://accounts.google.com/signup
2. Use these details:
   - First name: `Stride`
   - Last name: `Fitness SG`
   - Username: `stride.fitness.sg` (→ stride.singapore@gmail.com)
   - Save the password in your password manager
3. Skip phone verification if possible, or use your mobile number

---

## Step 2 — Create the Reddit account

1. Go to https://www.reddit.com/register
2. Email: `stride.singapore@gmail.com`
3. Username: `u/StrideFitnessSG` (or `u/Stride_SG`)
4. After registration, go to your profile → set avatar and bio:
   - Bio: "Tracking macros the Singapore way 🇸🇬 | Free fitness & food tracking app for SG | stride-app-rosy.vercel.app"

### Get Reddit API credentials (takes 2 minutes)

1. Log in as StrideFitnessSG
2. Go to: https://www.reddit.com/prefs/apps
3. Click "Create another app" at the bottom
4. Fill in:
   - Name: `Stride Auto Poster`
   - Type: `script`
   - Description: `Stride fitness app content poster`
   - About URL: `https://stride-app-rosy.vercel.app`
   - Redirect URI: `http://localhost:8080`
5. Click "Create app"
6. Note down:
   - `client_id` — the short string under the app name
   - `client_secret` — the longer string next to "secret"

7. Fill in `C:\stride-app\planning\social\credentials.json` with these values

---

## Step 3 — Create Instagram account

1. Go to https://www.instagram.com/accounts/emailsignup/
2. Email: `stride.singapore@gmail.com`
3. Username: `stride.sg` or `stridefitness.sg`
4. Name: `Stride — SG Fitness Tracker`
5. Profile bio:
   ```
   🇸🇬 Track macros at hawker centres & restaurants
   🍜 Know exactly what you're eating
   📲 Free app → link below
   ```
6. Add link: `https://stride-app-rosy.vercel.app`
7. Switch to a Creator account (Settings → Account → Switch to Professional Account → Creator)

---

## Step 4 — Create TikTok account

1. Go to https://www.tiktok.com/signup
2. Use `stride.singapore@gmail.com`
3. Username: `@stridefitness.sg`
4. Bio: `🇸🇬 Macro tracking for SG hawker food | Free app in bio`

---

## Step 5 — Fill in credentials file

Edit `C:\stride-app\planning\social\credentials.json`:

```json
{
  "reddit": {
    "client_id": "PASTE_FROM_REDDIT_APP",
    "client_secret": "PASTE_FROM_REDDIT_APP",
    "username": "StrideFitnessSG",
    "password": "YOUR_REDDIT_PASSWORD",
    "user_agent": "StrideApp/1.0 by StrideFitnessSG"
  },
  "email": "stride.singapore@gmail.com"
}
```

Once filled in, the Reddit scheduled task will post automatically.

---

## Subreddits to target

| Subreddit | Members | Best post type |
|-----------|---------|----------------|
| r/singapore | 1M+ | Food macro guides, hawker rankings |
| r/SGFitness | 15k | Protein/$ rankings, meal prep |
| r/loseit | 3M+ | Low-cal SG food options |
| r/1500isplenty | 500k | Budget SG meals under calories |
| r/EatCheapAndHealthy | 1M+ | Value hawker options |
| r/fitmeals | 200k | High-protein SG dishes |
