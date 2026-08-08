import requests
from datetime import datetime, timezone


def discover_hacker_news(limit=15):
    """
    Pull top Hacker News stories and normalize them
    into Clara's internal candidate format.
    """

    try:
        ids_response = requests.get(
            "https://hacker-news.firebaseio.com/v0/topstories.json",
            timeout=10,
        )
        ids_response.raise_for_status()

        story_ids = ids_response.json()[:limit]

        stories = []

        for story_id in story_ids:
            response = requests.get(
                f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json",
                timeout=10,
            )

            if not response.ok:
                continue

            item = response.json()

            if not item:
                continue

            if item.get("type") != "story":
                continue

            title = item.get("title")

            if not title:
                continue

            stories.append(
                {
                    "external_id": f"hn_{story_id}",
                    "title": title,
                    "summary": title,
                    "url": item.get(
                        "url",
                        f"https://news.ycombinator.com/item?id={story_id}",
                    ),
                    "source": "Hacker News",
                    "source_type": "community",
                    "published_at": datetime.fromtimestamp(
                        item.get("time", 0),
                        tz=timezone.utc,
                    ).isoformat(),
                    "engagement": item.get("score", 0),
                }
            )

        return stories

    except Exception as exc:
        print(f"[Discovery] Hacker News failed: {exc}")
        return []


def discover_all():
    """
    Main discovery entry point.
    More sources can be added later.
    """

    stories = []

    stories.extend(discover_hacker_news())

    return stories