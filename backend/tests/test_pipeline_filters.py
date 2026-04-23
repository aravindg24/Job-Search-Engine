import sys
import unittest

sys.path.insert(0, r"D:\Role\backend")

from search.pipeline import (
    _salary_bounds_match,
    _metadata_matches_stage,
    _metadata_matches_role_type,
    _matches_excludes,
)


class TestPipelineFilters(unittest.TestCase):
    def test_salary_bounds_overlap(self):
        payload = {"salary_min": 150000, "salary_max": 210000}
        self.assertTrue(_salary_bounds_match(payload, 180000, 220000))
        self.assertFalse(_salary_bounds_match(payload, 220001, None))

    def test_stage_match(self):
        payload = {"company_stage": "series a startup"}
        self.assertTrue(_metadata_matches_stage(payload, ["startup"]))
        self.assertFalse(_metadata_matches_stage(payload, ["enterprise"]))

    def test_role_type_match(self):
        payload = {"role_type": "full-time"}
        self.assertTrue(_metadata_matches_role_type(payload, "full-time"))
        self.assertFalse(_metadata_matches_role_type(payload, "contract"))

    def test_exclude_match(self):
        payload = {
            "title": "Backend Engineer",
            "description": "Build APIs for fintech payments",
            "requirements": ["Python", "Postgres"],
            "tags": ["backend"],
        }
        self.assertFalse(_matches_excludes(payload, ["fintech"]))
        self.assertTrue(_matches_excludes(payload, ["gaming"]))


if __name__ == "__main__":
    unittest.main()
