import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PUBLISHER_ID = "pub-1526341836163709"
CLIENT_ID = "ca-pub-1526341836163709"


class AdSenseAssetTests(unittest.TestCase):
    def test_ads_txt_contains_the_account_publisher_line(self):
        ads_txt = (ROOT / "frontend" / "public" / "ads.txt").read_text()
        self.assertEqual(
            ads_txt,
            f"google.com, {PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n",
        )

    def test_index_loads_google_auto_ads_for_the_same_publisher(self):
        index = (ROOT / "frontend" / "public" / "index.html").read_text()
        self.assertIn(
            f"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={CLIENT_ID}",
            index,
        )


if __name__ == "__main__":
    unittest.main()