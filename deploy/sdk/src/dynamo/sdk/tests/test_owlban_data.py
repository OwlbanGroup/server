import os
import sys

# Adjust PYTHONPATH to include root project directory for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../..")))

import unittest

from dynamo.sdk.lib.owlban_data import OwlbanData


class TestOwlbanData(unittest.TestCase):
    def setUp(self):
        self.owlban_data = OwlbanData()

    def test_revenue_data_loaded(self):
        revenue = self.owlban_data.get_revenue_data()
        self.assertIsInstance(revenue, dict)
        self.assertIn("owlban_group_revenue", revenue)

    def test_banking_data_loaded(self):
        banking = self.owlban_data.get_banking_data()
        self.assertIsInstance(banking, dict)
        self.assertTrue(banking)  # Ensure banking data is not empty
        self.assertIn("routing_numbers", banking)
        self.assertIn("account_numbers", banking)


if __name__ == "__main__":
    unittest.main()
