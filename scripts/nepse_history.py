import json
import sys
from datetime import date, timedelta
from typing import Any

from nepse_scraper import NepseScraper


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python scripts/nepse_history.py <SYMBOL> [days]")

    symbol = sys.argv[1].upper()
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 365
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    client = NepseScraper(verify_ssl=False)
    payload: dict[str, Any] = client.get_ticker_price_history(
        symbol, start_date.isoformat(), end_date.isoformat()
    )
    content = payload.get("content", [])

    mapped = [
        {
            "date": item.get("businessDate"),
            "close": item.get("closePrice") or item.get("lastTradedPrice") or 0,
            "volume": item.get("totalTradedQuantity") or 0,
            "open": item.get("openPrice") or 0,
            "high": item.get("highPrice") or 0,
            "low": item.get("lowPrice") or 0,
            "previousClose": item.get("previousDayClosePrice") or 0,
        }
        for item in content
    ]

    mapped.sort(key=lambda item: item["date"])
    print(json.dumps(mapped))


if __name__ == "__main__":
    main()
