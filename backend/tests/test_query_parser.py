import sys
import types
import unittest

sys.path.insert(0, r"D:\Role\backend")

from search.query_parser import parse_intent


class TestQueryParser(unittest.TestCase):
    def setUp(self):
        self.original_config = sys.modules.get("config")
        fake_config = types.ModuleType("config")
        fake_config.settings = types.SimpleNamespace(cerebras_api_key=None)
        sys.modules["config"] = fake_config

    def tearDown(self):
        if self.original_config is not None:
            sys.modules["config"] = self.original_config
        elif "config" in sys.modules:
            del sys.modules["config"]

    def test_extracts_structured_intent(self):
        result = parse_intent(
            "Senior backend engineer at a startup in San Francisco paying 180k to 220k, no banking"
        )
        self.assertEqual(result["clean_query"], "Senior backend engineer")
        self.assertEqual(result["location"], "San Francisco")
        self.assertEqual(result["experience_level"], "senior")
        self.assertIn("startup", result["company_stages"])
        self.assertEqual(result["salary_min"], 180000)
        self.assertEqual(result["salary_max"], 220000)
        self.assertIn("banking", result["excludes"])

    def test_remote_and_role_type(self):
        result = parse_intent("Find me remote Python developer contract jobs")
        self.assertEqual(result["remote"], True)
        self.assertEqual(result["role_type"], "contract")
        self.assertIn("Python", result["skills"])


if __name__ == "__main__":
    unittest.main()
