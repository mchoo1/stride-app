"""
Stride Content Generator
Reads sgFoodDb.ts and generates weekly social media content:
- Reddit post (text)
- Instagram/TikTok caption + hashtags
- HTML infographic card (saved as weekly-insight.html)

Usage: python content_generator.py --week [1-52] --type [reddit|social|seo]
"""

import argparse
import json
import re
import os
from datetime import datetime, date

SGFOODDB_PATH = os.path.join(os.path.dirname(__file__), "../../app/src/lib/sgFoodDb.ts")
OUTPUT_DIR = os.path.dirname(__file__)
LOG_PATH = os.path.join(OUTPUT_DIR, "reddit-log.md")


def get_last_post_type():
    """Read log to determine which post rotation to use next."""
    if not os.path.exists(LOG_PATH):
        return 0
    with open(LOG_PATH) as f:
        content = f.read()
    # Count posts to determine rotation
    count = content.count("## 20")
    return count % 5


POST_ROTATIONS = [
    {
        "type": "protein_dollar_ranking",
        "subreddit": "singapore",
        "flair": "Food",
        "title_template": "Ranked every major SG hawker dish by protein per dollar — some results surprised me",
    },
    {
        "type": "high_protein_under_6",
        "subreddit": "SGFitness",
        "flair": None,
        "title_template": "Singapore's best high-protein meals under $6 (with actual macros)",
    },
    {
        "type": "fast_food_comparison",
        "subreddit": "singapore",
        "flair": "Food",
        "title_template": "I compared protein/$ across every major SG fast food chain — here's the winner",
    },
    {
        "type": "hawker_macro_guide",
        "subreddit": "loseit",
        "flair": None,
        "title_template": "A calorie guide to eating at Singapore hawker centres (common dishes + macros)",
    },
    {
        "type": "budget_fitness_meals",
        "subreddit": "EatCheapAndHealthy",
        "flair": None,
        "title_template": "Best budget high-protein meals in Singapore hawker centres ($3–$6)",
    },
]


def parse_macro_snippet(db_text):
    """Extract a sample of restaurant and macro data from sgFoodDb.ts for use in posts."""
    items = []

    # Pull restaurant names
    names = re.findall(r"name:\s*['\"]([^'\"]+)['\"]", db_text[:8000])
    # Pull prices
    prices = re.findall(r"price:\s*([\d.]+)", db_text[:8000])
    # Pull proteins
    proteins = re.findall(r"protein:\s*(\d+)", db_text[:8000])
    # Pull calories
    calories = re.findall(r"calories:\s*(\d+)", db_text[:8000])

    for i in range(min(len(names), len(prices), len(proteins), len(calories), 30)):
        try:
            price = float(prices[i])
            protein = int(proteins[i])
            cal = int(calories[i])
            ppd = round(protein / price, 1) if price > 0 else 0
            items.append({
                "name": names[i],
                "price": price,
                "protein": protein,
                "calories": cal,
                "ppd": ppd,
            })
        except Exception:
            continue

    # Sort by PPD descending
    items.sort(key=lambda x: x["ppd"], reverse=True)
    return items


def generate_reddit_body(post_type, items):
    top10 = items[:10]

    if post_type == "protein_dollar_ranking":
        rows = "\n".join([
            f"| {i+1} | {it['name']} | ${it['price']:.2f} | {it['protein']}g | {it['ppd']}g/$ |"
            for i, it in enumerate(top10)
        ])
        return f"""Been tracking my macros in Singapore for a while and got obsessed with finding which hawker and fast food dishes give the most protein for your dollar.

I built a spreadsheet (now an app called [Stride](https://stride-app-rosy.vercel.app)) with macros for 30+ SG restaurants and hawker centres. Here's what I found:

## Top 10 by Protein per Dollar

| # | Dish | Price | Protein | Protein/$ |
|---|------|-------|---------|-----------|
{rows}

**Key takeaways:**
- Hawker chicken rice consistently beats fast food on protein/$
- KFC original recipe is surprisingly good value
- Salad places rank low despite the healthy image — expensive for the protein you get

I track all this in Stride (free app, SG food database built in) — happy to share the full data if anyone wants it.

What's your go-to high-protein SG meal?"""

    elif post_type == "high_protein_under_6":
        affordable = [it for it in items if it["price"] <= 6.00][:10]
        rows = "\n".join([
            f"| {it['name']} | ${it['price']:.2f} | {it['protein']}g | {it['calories']} kcal |"
            for it in affordable
        ])
        return f"""Trying to hit protein goals without spending a lot in Singapore. Here's what I found tracking macros across hawker centres and fast food chains:

## High-protein meals under $6

| Dish | Price | Protein | Calories |
|------|-------|---------|----------|
{rows}

Been using [Stride](https://stride-app-rosy.vercel.app) to track — it has macros for most SG hawker dishes built in so you don't have to look everything up manually.

Hawker food genuinely wins for protein value. The key is avoiding the fried options and going for steamed/grilled where possible.

Anyone else eating hawker for gains? What are your go-to orders?"""

    elif post_type == "fast_food_comparison":
        fast_food_keywords = ["mcd", "kfc", "burger", "subway", "nando", "mcchicken", "zinger"]
        ff_items = [it for it in items if any(kw in it["name"].lower() for kw in fast_food_keywords)][:8]
        rows = "\n".join([
            f"| {it['name']} | ${it['price']:.2f} | {it['protein']}g | {it['ppd']}g/$ |"
            for it in ff_items
        ]) if ff_items else "| KFC Original | $5.00 | 25g | 5.0g/$ |\n| McDonald's Grilled | $6.50 | 26g | 4.0g/$ |\n| Subway Chicken Teriyaki | $6.90 | 24g | 3.5g/$ |"
        return f"""Been comparing protein-per-dollar across the main SG fast food chains. Surprising which ones actually win.

## Fast food protein value comparison (SG prices)

| Item | Price | Protein | Protein/$ |
|------|-------|---------|-----------|
{rows}

The winner? **KFC original recipe** consistently beats the others on straight protein/$. McDonald's grilled options are close. Subway is overrated for protein value at SG prices.

For context: a $5 chicken rice from a hawker beats all of these (35g protein, ~5.0g/dollar+).

Using [Stride](https://stride-app-rosy.vercel.app) to track — it has SG-specific macros for most of these built in.

What's everyone's fast food order when trying to stay on macros?"""

    else:
        # Default: hawker macro guide
        top_hawker = [it for it in items if it["price"] <= 7][:12]
        rows = "\n".join([
            f"| {it['name']} | ${it['price']:.2f} | {it['calories']} kcal | {it['protein']}g |"
            for it in top_hawker
        ])
        return f"""Compiled a calorie and macro guide for common Singapore hawker dishes. Sharing for anyone trying to track while eating local food.

## Common hawker dishes — calories and macros

| Dish | Price | Calories | Protein |
|------|-------|----------|---------|
{rows}

**Notes:**
- All figures are HPB estimates for standard Singapore portions
- Fried dishes (char kway teow, hokkien mee) are significantly higher fat
- Soup-based dishes are generally the lowest calorie option
- Adding extra rice = ~180 kcal extra per bowl

I built [Stride](https://stride-app-rosy.vercel.app) specifically for this — free app with SG hawker macros built in so you can log without googling everything.

Hope this helps someone! Happy to answer questions about specific dishes."""


def generate_social_caption(items, week_num):
    top5 = items[:5]
    lines = "\n".join([f"#{i+1} {it['name']} — {it['protein']}g protein, ${it['price']:.2f}" for i, it in enumerate(top5)])
    hashtags = "#SingaporeFitness #SGFood #HawkerFood #MacroTracking #HighProtein #SingaporeFoodGuide #Fitness #StrideApp #SGFitness #CleanEating #ProteinGoals #FoodSingapore #FitnessGoals #MealPrep #CalorieTracker"
    caption = f"""🇸🇬 Top {len(top5)} high-protein SG meals ranked by protein per dollar 💪

{lines}

Hawker food wins every time for protein value. Track your macros at SG hawker centres & restaurants with Stride — the free app built for Singapore food 🍜

Link in bio → stride-app-rosy.vercel.app

{hashtags}"""
    return caption


def generate_html_infographic(items, output_path):
    top8 = items[:8]
    max_ppd = max(it["ppd"] for it in top8) if top8 else 1

    rows_html = ""
    for i, it in enumerate(top8):
        bar_pct = int((it["ppd"] / max_ppd) * 100)
        color = "#16a34a" if it["ppd"] >= 5 else "#d97706" if it["ppd"] >= 3 else "#dc2626"
        rows_html += f"""
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:13px;font-weight:600;color:#111;">{i+1}. {it['name']}</span>
            <span style="font-size:13px;color:#555;">${it['price']:.2f} · {it['protein']}g protein</span>
          </div>
          <div style="background:#f3f4f6;border-radius:4px;height:8px;">
            <div style="background:{color};width:{bar_pct}%;height:8px;border-radius:4px;"></div>
          </div>
          <div style="font-size:11px;color:{color};font-weight:700;margin-top:2px;">{it['ppd']}g protein per $1</div>
        </div>"""

    today = date.today().strftime("%d %b %Y")
    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Stride Weekly Insight</title></head>
<body style="font-family:system-ui,sans-serif;margin:0;padding:0;background:#fff;">
<div style="max-width:600px;margin:0 auto;padding:32px 28px;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
    <div style="background:#6366f1;color:#fff;font-weight:700;font-size:14px;padding:6px 14px;border-radius:8px;">STRIDE</div>
    <span style="font-size:12px;color:#888;">Weekly Insight · {today}</span>
  </div>
  <h1 style="font-size:22px;font-weight:800;color:#111;margin:0 0 4px;">Best protein per dollar in Singapore 🇸🇬</h1>
  <p style="font-size:13px;color:#888;margin:0 0 24px;">Ranked by grams of protein per $1 SGD</p>
  {rows_html}
  <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#aaa;text-align:center;">
    Data from Stride · Free SG macro tracker · stride-app-rosy.vercel.app
  </div>
</div>
</body>
</html>"""

    with open(output_path, "w") as f:
        f.write(html)
    print(f"Infographic saved: {output_path}")
    return output_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--type", choices=["reddit", "social", "all"], default="all")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    # Read sgFoodDb
    try:
        with open(SGFOODDB_PATH, encoding="utf-8") as f:
            db_text = f.read(40000)
    except FileNotFoundError:
        print(f"ERROR: Could not read sgFoodDb.ts at {SGFOODDB_PATH}")
        sys.exit(1)

    items = parse_macro_snippet(db_text)
    if not items:
        print("WARNING: Could not parse items from sgFoodDb.ts — using fallback data")
        items = [
            {"name": "Chicken Rice (Steamed)", "price": 5.0, "protein": 35, "calories": 607, "ppd": 7.0},
            {"name": "KFC Original Chicken", "price": 5.0, "protein": 25, "calories": 290, "ppd": 5.0},
            {"name": "Nando's 1/4 Chicken", "price": 12.9, "protein": 38, "calories": 310, "ppd": 2.9},
        ]

    rotation_idx = get_last_post_type()
    rotation = POST_ROTATIONS[rotation_idx]

    week_str = datetime.now().strftime("%Y-W%W")
    output_prefix = os.path.join(OUTPUT_DIR, f"content-{week_str}")

    if args.type in ("reddit", "all"):
        title = rotation["title_template"]
        body = generate_reddit_body(rotation["type"], items)
        reddit_file = f"{output_prefix}-reddit.md"
        with open(reddit_file, "w") as f:
            f.write(f"# Reddit Post Draft\n\n**Subreddit:** r/{rotation['subreddit']}\n**Title:** {title}\n\n---\n\n{body}")
        print(f"Reddit draft: {reddit_file}")
        if not args.dry_run:
            # Call reddit_poster.py
            import subprocess
            body_escaped = body.replace('"', '\\"').replace('\n', '\\n')
            result = subprocess.run(
                ["python", os.path.join(OUTPUT_DIR, "reddit_poster.py"),
                 "--title", title, "--body", body, "--subreddit", rotation["subreddit"]],
                capture_output=True, text=True
            )
            print(result.stdout or result.stderr)

    if args.type in ("social", "all"):
        caption = generate_social_caption(items, week_str)
        social_file = f"{output_prefix}-social.md"
        with open(social_file, "w") as f:
            f.write(f"# Social Media Content\n\n## Caption (Instagram + TikTok)\n\n{caption}\n")
        print(f"Social draft: {social_file}")

        infographic_path = f"{output_prefix}-infographic.html"
        generate_html_infographic(items, infographic_path)
        print(f"Infographic: {infographic_path}")
