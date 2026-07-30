import sqlite3
import tempfile
import unittest
from pathlib import Path

from server import DealRepository, build_deal_url, parse_price, resolve_static_request


class PriceParsingTests(unittest.TestCase):
    def test_parses_current_and_previous_price(self):
        self.assertEqual(
            parse_price("486 instead of 2051"),
            {"price": "486 kr", "previous_price": "2 051 kr"},
        )

    def test_preserves_unrecognized_price_text(self):
        self.assertEqual(
            parse_price("Kontrollera priset på Amazon"),
            {"price": "Kontrollera priset på Amazon", "previous_price": None},
        )

    def test_rejects_pathologically_long_price_text(self):
        self.assertEqual(
            parse_price("9" * 5000),
            {"price": "Se aktuellt pris", "previous_price": None},
        )


class DealUrlTests(unittest.TestCase):
    def test_adds_affiliate_tag_to_amazon_se_url(self):
        self.assertEqual(
            build_deal_url("https://www.amazon.se/dp/B012345678", "testtag-21"),
            "https://www.amazon.se/dp/B012345678?tag=testtag-21",
        )

    def test_replaces_existing_tag(self):
        self.assertEqual(
            build_deal_url("https://www.amazon.se/dp/B012345678?tag=old-21&x=1", "new-21"),
            "https://www.amazon.se/dp/B012345678?x=1&tag=new-21",
        )

    def test_rejects_non_amazon_or_non_https_urls(self):
        self.assertIsNone(build_deal_url("https://example.com/product", "tag-21"))
        self.assertIsNone(build_deal_url("http://www.amazon.se/dp/B012345678", "tag-21"))


class DealRepositoryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tmp.name) / "deals.db"
        con = sqlite3.connect(self.db_path)
        con.execute(
            "CREATE TABLE adealsweden "
            "(id INTEGER PRIMARY KEY, name TEXT, price TEXT, url TEXT, posted BOOLEAN)"
        )
        con.executemany(
            "INSERT INTO adealsweden(id,name,price,url,posted) VALUES(?,?,?,?,?)",
            [
                (1, "Older product", "100", "https://www.amazon.se/dp/OLD", 1),
                (2, "Wrong host", "200", "https://example.com/item", 1),
                (3, "Newest product", "486 instead of 2051", "https://www.amazon.se/dp/NEW", 1),
                (4, "", "300", "https://www.amazon.se/dp/EMPTY", 1),
            ],
        )
        con.commit()
        con.close()

    def tearDown(self):
        self.tmp.cleanup()

    def test_returns_newest_valid_rows_with_public_fields_only(self):
        repo = DealRepository(str(self.db_path), "testtag-21")
        self.assertEqual(
            repo.list_deals(50),
            [
                {
                    "id": 3,
                    "title": "Newest product",
                    "price": "486 kr",
                    "previous_price": "2 051 kr",
                    "url": "https://www.amazon.se/dp/NEW?tag=testtag-21",
                },
                {
                    "id": 1,
                    "title": "Older product",
                    "price": "100 kr",
                    "previous_price": None,
                    "url": "https://www.amazon.se/dp/OLD?tag=testtag-21",
                },
            ],
        )

    def test_includes_bare_amazon_se_urls(self):
        with sqlite3.connect(self.db_path) as con:
            con.execute(
                "INSERT INTO adealsweden(id,name,price,url,posted) VALUES(?,?,?,?,?)",
                (5, "Bare domain", "250", "https://amazon.se/dp/BARE", 1),
            )

        repo = DealRepository(str(self.db_path), "testtag-21")
        self.assertEqual(repo.list_deals(1)[0]["url"], "https://amazon.se/dp/BARE?tag=testtag-21")

    def test_skips_malformed_sqlite_value_types_and_keeps_scanning(self):
        with sqlite3.connect(self.db_path) as con:
            con.executemany(
                "INSERT INTO adealsweden(id,name,price,url,posted) VALUES(?,?,?,?,?)",
                [
                    (5, sqlite3.Binary(b"Bad name"), "250", "https://www.amazon.se/dp/BADNAME", 1),
                    (6, "Bad price", sqlite3.Binary(b"250"), "https://www.amazon.se/dp/BADPRICE", 1),
                    (7, "Bad URL", "250", sqlite3.Binary(b"https://www.amazon.se/dp/BADURL"), 1),
                    (8, "Unposted", "250", "https://www.amazon.se/dp/UNPOSTED", 0),
                ],
            )

        repo = DealRepository(str(self.db_path), "testtag-21")
        deals = repo.list_deals(3)
        self.assertEqual([deal["id"] for deal in deals], [3, 1])

    def test_candidate_scan_has_an_absolute_ceiling(self):
        with sqlite3.connect(self.db_path) as con:
            con.executemany(
                "INSERT INTO adealsweden(id,name,price,url,posted) VALUES(?,?,?,?,?)",
                [
                    (
                        1000 + offset,
                        sqlite3.Binary(b"Malformed title"),
                        "100",
                        f"https://www.amazon.se/dp/BAD{offset}",
                        1,
                    )
                    for offset in range(501)
                ],
            )

        repo = DealRepository(str(self.db_path), "testtag-21")
        self.assertEqual(repo.list_deals(1), [])

    def test_clamps_limit_to_fifty(self):
        repo = DealRepository(str(self.db_path), "testtag-21")
        self.assertLessEqual(len(repo.list_deals(500)), 50)

    def test_database_connection_is_read_only(self):
        repo = DealRepository(str(self.db_path), "testtag-21")
        with repo._connect() as con:
            with self.assertRaises(sqlite3.OperationalError):
                con.execute("DELETE FROM adealsweden")


class StaticRoutingTests(unittest.TestCase):
    def test_unknown_extensionless_route_falls_back_to_index(self):
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, "index.html").write_text("index")
            self.assertEqual(resolve_static_request("/guider/example", directory), "/")

    def test_existing_asset_keeps_its_path(self):
        with tempfile.TemporaryDirectory() as directory:
            asset = Path(directory, "static", "app.js")
            asset.parent.mkdir()
            asset.write_text("javascript")
            self.assertEqual(resolve_static_request("/static/app.js", directory), "/static/app.js")


if __name__ == "__main__":
    unittest.main()
