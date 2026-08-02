"""
Stride Reddit Poster
Usage: python reddit_poster.py --title "..." --body "..." --subreddit "singapore"
Called by the Stride Reddit scheduled task after generating post content.
"""

import argparse
import json
import os
import sys
from datetime import datetime

CREDENTIALS_PATH = os.path.join(os.path.dirname(__file__), "credentials.json")
LOG_PATH = os.path.join(os.path.dirname(__file__), "reddit-log.md")


def load_credentials():
    with open(CREDENTIALS_PATH) as f:
        creds = json.load(f)
    r = creds.get("reddit", {})
    if "PASTE" in r.get("client_id", "PASTE"):
        print("ERROR: Reddit credentials not filled in. See planning/social/SETUP.md")
        sys.exit(1)
    return r


def post_to_reddit(title, body, subreddit, flair=None):
    try:
        import praw
    except ImportError:
        print("Installing praw...")
        os.system("pip install praw --break-system-packages -q")
        import praw

    creds = load_credentials()

    reddit = praw.Reddit(
        client_id=creds["client_id"],
        client_secret=creds["client_secret"],
        username=creds["username"],
        password=creds["password"],
        user_agent=creds["user_agent"],
    )

    sub = reddit.subreddit(subreddit)
    submission = sub.submit(title, selftext=body)
    url = f"https://reddit.com{submission.permalink}"
    print(f"Posted: {url}")

    # Log the post
    log_entry = f"\n## {datetime.now().strftime('%Y-%m-%d')}\n- Subreddit: r/{subreddit}\n- Title: {title}\n- URL: {url}\n"
    with open(LOG_PATH, "a") as f:
        f.write(log_entry)

    return url


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--title", required=True)
    parser.add_argument("--body", required=True)
    parser.add_argument("--subreddit", default="singapore")
    parser.add_argument("--flair", default=None)
    parser.add_argument("--dry-run", action="store_true", help="Print post without submitting")
    args = parser.parse_args()

    if args.dry_run:
        print(f"[DRY RUN] r/{args.subreddit}\nTitle: {args.title}\n\n{args.body}")
    else:
        post_to_reddit(args.title, args.body, args.subreddit, args.flair)
