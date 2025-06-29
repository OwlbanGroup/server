import json
import os
from typing import Dict, Any


class OwlbanData:
    def __init__(self, base_path: str = None):
        self.base_path = (
            base_path
            or os.path.abspath(
                os.path.join(os.path.dirname(__file__), "../../../..")
            )
        )
        self.revenue_data = self._load_json("data/owlban_group_revenue.json")
        self.banking_data = self._load_json("data/owlban_group_banking.json")

    def _load_json(self, relative_path: str) -> Dict[str, Any]:
        path = os.path.join(self.base_path, relative_path)
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
        except json.JSONDecodeError:
            return {}

    def get_revenue_data(self) -> Dict[str, Any]:
        return self.revenue_data

    def get_banking_data(self) -> Dict[str, Any]:
        return self.banking_data


# Example usage:
# owlban_data = OwlbanData()
# revenue = owlban_data.get_revenue_data()
# banking = owlban_data.get_banking_data()
