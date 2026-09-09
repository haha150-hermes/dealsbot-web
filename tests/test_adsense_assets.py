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

    def test_nginx_config_has_no_unsupported_http_handshake_directive(self):
        nginx_config = (ROOT / "nginx.conf").read_text()
        self.assertNotIn("ssl_handshake_timeout", nginx_config)

    def test_nginx_redirects_http_to_https_for_ads_txt_crawlers(self):
        nginx_config = (ROOT / "nginx.conf").read_text()
        self.assertIn("listen 80;", nginx_config)
        self.assertIn("return 301 https://$host$request_uri;", nginx_config)

    def test_nginx_does_not_expose_internal_tls_port_in_directory_redirects(self):
        nginx_config = (ROOT / "nginx.conf").read_text()
        self.assertIn("port_in_redirect off;", nginx_config)

    def test_compose_publishes_http_redirect_port(self):
        compose = (ROOT / "compose.yml").read_text()
        self.assertIn('      - "80:80"', compose)


if __name__ == "__main__":
    unittest.main()