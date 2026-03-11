import json
import sys
from typing import Any

from nepse_scraper import NepseScraper


def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else "today"
    client = NepseScraper(verify_ssl=False)

    if mode == "securities":
      data: list[dict[str, Any]] = client.get_all_securities()
      print(json.dumps(data))
      return

    if mode == "today":
      data: list[dict[str, Any]] = client.get_today_price()
      print(json.dumps(data))
      return

    if mode == "ticker":
      if len(sys.argv) < 3:
        raise SystemExit("Usage: python scripts/nepse_market.py ticker <SYMBOL>")
      data = client.get_ticker_info(sys.argv[2].upper())
      print(json.dumps(data))
      return

    raise SystemExit("Invalid mode")


if __name__ == "__main__":
    main()
