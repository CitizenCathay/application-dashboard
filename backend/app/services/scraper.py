import logging

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


async def scrape_job_posting(url: str) -> str | None:
    """Fetch a job posting URL and extract the main text content.

    This is a basic scraper. Many job sites (Greenhouse, Lever, Workday)
    have predictable HTML structures you could target more precisely.
    For now we just grab all visible text.
    """
    try:
        async with httpx.AsyncClient(
            timeout=15.0,
            follow_redirects=True,
            headers={"User-Agent": "Application Dashboard/1.0"},
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Remove script/style elements
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        text = soup.get_text(separator="\n", strip=True)

        # Trim to a reasonable length for LLM context
        if len(text) > 8000:
            text = text[:8000]

        return text
    except Exception:
        logger.exception(f"Failed to scrape URL: {url}")
        return None
