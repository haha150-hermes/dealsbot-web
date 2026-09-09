import unittest
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "frontend" / "build"
ARTICLE_SLUG = "sa-valjer-du-en-bra-powerbank"
ARTICLE_TITLE = "Så väljer du en bra powerbank utan att köpa fel"


class StaticContentTests(unittest.TestCase):
    def test_articles_have_editorial_metadata_and_substantive_body(self):
        articles = json.loads((ROOT / "frontend" / "src" / "articles.json").read_text())
        self.assertEqual(len(articles), 10)
        self.assertEqual(len({article["slug"] for article in articles}), len(articles))
        for article in articles:
            self.assertEqual(article["author"], "Dealsbot-redaktionen")
            self.assertEqual(article["reviewedDate"], article["date"])
            body_words = len(
                " ".join(text for section in article["sections"] for text in section[1]).split()
            )
            self.assertGreaterEqual(body_words, 200, article["slug"])

    def test_build_contains_crawlable_homepage_and_policy_pages(self):
        homepage = (BUILD / "index.html").read_text()
        self.assertIn("<h1>Färre impulsköp.", homepage)
        self.assertIn("/guider/", homepage)
        self.assertIn("/om-oss", homepage)
        self.assertNotIn('<div id="root"></div>', homepage)
        for page in ("om-oss", "kontakt", "integritet", "deals"):
            html = (BUILD / page / "index.html").read_text()
            self.assertIn("<h1>", html)
            self.assertIn("/integritet", html)

    def test_build_contains_crawlable_guide_index(self):
        guide_index = BUILD / "guider" / "index.html"
        self.assertTrue(guide_index.is_file(), "production build must prerender /guider/")
        html = guide_index.read_text()
        self.assertIn("<h1>Guider</h1>", html)
        self.assertIn(ARTICLE_TITLE, html)
        self.assertIn("https://symeri.se/guider/", html)
        self.assertNotIn('<div id="root"></div>', html)

    def test_build_contains_crawlable_article_page(self):
        article = BUILD / "guider" / ARTICLE_SLUG / "index.html"
        self.assertTrue(article.is_file(), "production build must prerender each guide URL")
        html = article.read_text()
        self.assertIn(f"<title>{ARTICLE_TITLE} | Dealsbot</title>", html)
        self.assertIn(f"<h1>{ARTICLE_TITLE}</h1>", html)
        self.assertIn(
            f'<link rel="canonical" href="https://symeri.se/guider/{ARTICLE_SLUG}/">',
            html,
        )
        self.assertIn('type="application/ld+json"', html)
        self.assertIn("Börja med användningen", html)
        self.assertNotIn('<div id="root"></div>', html)

    def test_build_contains_sitemap_with_guide_urls(self):
        sitemap = BUILD / "sitemap.xml"
        self.assertTrue(sitemap.is_file(), "production build must include sitemap.xml")
        content = sitemap.read_text()
        self.assertIn("https://symeri.se/guider/", content)
        self.assertIn(
            f"https://symeri.se/guider/{ARTICLE_SLUG}/",
            content,
        )

    def test_container_build_copies_the_prerender_script(self):
        dockerfile = (ROOT / "Dockerfile").read_text()
        self.assertIn("COPY frontend/scripts ./scripts", dockerfile)
        self.assertIn("node scripts/prerender-guides.js", (ROOT / "frontend" / "package.json").read_text())


if __name__ == "__main__":
    unittest.main()
