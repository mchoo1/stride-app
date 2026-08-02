# Stride Growth Scheduled Tasks — Review Before Activating

Review each task below, then tell Cowork "activate task [name]" to create it.

---

## Task 1: stride-reddit-weekly
**Schedule:** Every Tuesday 10am
**What it does:** Generates a data-driven Reddit post using real sgFoodDb macros, posts to r/singapore / r/SGFitness / r/loseit, logs the URL.
**Requires:** Reddit credentials filled in at `planning/social/credentials.json`

### Post rotation (cycles weekly):
1. Protein/$ ranking of all SG hawker dishes → r/singapore
2. High-protein meals under $6 → r/SGFitness
3. Fast food chain protein comparison → r/singapore
4. Hawker calorie guide for weight loss → r/loseit
5. Budget high-protein hawker meals → r/EatCheapAndHealthy

---

## Task 2: stride-social-content
**Schedule:** Every Monday 9am
**What it does:**
- Reads sgFoodDb for the week's most interesting macro stats
- Generates an HTML infographic card (best protein/$ ranked visually)
- Writes a ready-to-post caption + hashtag set for Instagram and TikTok
- Saves all files to `planning/social/content-[WEEK]-*.md` and `*.html`
- You open Chrome, navigate to Instagram/TikTok, and post the saved content

**Output files per week:**
- `content-YYYY-WXX-reddit.md` — Reddit draft
- `content-YYYY-WXX-social.md` — Instagram/TikTok caption + hashtags
- `content-YYYY-WXX-infographic.html` — Visual card to screenshot and post

---

## Task 3: stride-seo-pages
**Schedule:** Every Sunday 11pm (after DB updates land)
**What it does:**
- Reads the current `sgFoodDb.ts` restaurant list
- Generates one Next.js page per restaurant/hawker centre at `app/src/app/nutrition/[slug]/page.tsx`
- Each page: restaurant name, full menu table with macros, PPD ratings, diet badges
- Targets keywords like "McDonald's Singapore calories", "Maxwell Food Centre macros"
- Saves all pages to `planning/seo-pages/` for your review — does NOT push to git
- Also generates `planning/seo-pages/SUMMARY.md` listing all pages created

---

## Task 4: stride-weekly-insights
**Schedule:** Every Friday 8pm
**What it does:**
- Analyses the full sgFoodDb dataset for the week's most interesting stats
- Generates a shareable `planning/social/weekly-insight-[DATE].html` report with:
  - Top 10 protein/$ across all outlets
  - Best value meals by cuisine type
  - Surprising finds (lowest calorie, highest protein hidden gems)
  - "This week in SG food data" summary
- Report is ready to share as a link or screenshot on any platform

---

## Setup checklist before activating

- [ ] Create stride.singapore@gmail.com (see SETUP.md)
- [ ] Create Reddit account → u/StrideFitnessSG
- [ ] Get Reddit API credentials → fill in credentials.json
- [ ] Create Instagram account → @stride.sg
- [ ] Create TikTok account → @stridefitness.sg
- [ ] Tell Cowork "activate task stride-reddit-weekly" to start Task 1
- [ ] Tell Cowork "activate task stride-social-content" to start Task 2
- [ ] Tell Cowork "activate task stride-seo-pages" to start Task 3
- [ ] Tell Cowork "activate task stride-weekly-insights" to start Task 4
