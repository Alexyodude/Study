"""Refresh MCU catalog prices and stock from the JLCPCB parts API (same stock as LCSC).

usage: python -X utf8 tools/jlc_prices.py            (updates content/mcu-products/catalog.json in place)
then:  node build.js

Rules:
- Search by part number. Accept exact part-number matches only (ignoring case, punctuation and a trailing TR
  reel suffix), so a family-level name never borrows a sibling part's price.
- Only in-stock rows give a price. Out-of-stock JLC listings carry placeholder prices ($0.0007, $0.0205).
- A part that is out of stock, or no longer listed under its exact number, keeps its old price but loses the
  "verified" mark (downgraded to "listed", with the date noted), and its stock is set to 0 / cleared.
- A bad API response counts as a failed lookup and changes nothing; the run exits non-zero if any failed.
- price = the JLC tier price at QTY pieces. The card shows the stock, so a part with less stock than QTY is visible.
"""
import datetime
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

API = "https://jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList"
CATALOG = Path(__file__).resolve().parent.parent / "content" / "mcu-products" / "catalog.json"
QTY = 100
LIB = {"base": "Basic", "expand": "Extended"}


class LookupFailed(Exception):
    pass


def norm(s):
    return re.sub(r"[^A-Z0-9]", "", str(s or "").upper())


def search(keyword):
    body = json.dumps({"keyword": keyword, "currentPage": 1, "pageSize": 50, "searchSource": "search"}).encode()
    req = urllib.request.Request(API, data=body, headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.load(r)
            time.sleep(0.6)
            break
        except Exception as e:  # network hiccup: back off and retry
            if attempt == 2:
                raise LookupFailed(f"{keyword}: {e}")
            time.sleep(3)
    page = (data.get("data") or {}).get("componentPageInfo") if isinstance(data, dict) else None
    # No results come back as {"total": 0, "list": null}; anything else without a list is a bad response.
    ok = isinstance(page, dict) and (isinstance(page.get("list"), list) or (page.get("list") is None and page.get("total") == 0))
    if data.get("code") != 200 or not ok:
        raise LookupFailed(f"{keyword}: unexpected response {str(data)[:200]}")
    return page.get("list") or []


def tier_price(prices, qty):
    for p in prices or []:
        start, end = p.get("startNumber"), p.get("endNumber")
        if start is None or p.get("productPrice") is None:
            continue
        if start <= qty and (end in (None, -1) or qty <= end):
            return p["productPrice"]
    return None


def unverify(m, reason):
    if m.get("priceConf") == "verified" and m.get("price") is not None:
        m["priceConf"] = "listed"
        m["priceSource"] = f"{m.get('priceSource') or ''} [{reason}]".strip()


def main():
    today = datetime.date.today().isoformat()
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    hits = oos = gone = 0
    failed = []
    for m in catalog["mcus"]:
        try:
            rows = search(m["part"])
        except LookupFailed as e:
            failed.append(str(e))
            continue
        key = norm(m["part"])
        exact = [r for r in rows if norm(r.get("componentModelEn")) in (key, key + "TR")]
        in_stock = [r for r in exact if (r.get("stockCount") or 0) > 0 and tier_price(r.get("componentPrices"), QTY) is not None]
        if not in_stock:
            if exact:  # listed, out of stock: keep the code, not the placeholder price
                r = next((r for r in exact if r.get("componentCode") == m.get("lcsc")), exact[0])
                m["lcsc"], m["jlcStock"] = r["componentCode"], 0
                m["jlcLibrary"] = LIB.get(r.get("componentLibraryType"), r.get("componentLibraryType"))
                unverify(m, f"out of stock at JLCPCB on {today}")
                oos += 1
            elif m.get("lcsc"):  # was listed before, not found under this exact number now
                m["lcsc"] = m["jlcStock"] = m["jlcLibrary"] = None
                unverify(m, f"not listed at JLCPCB on {today}")
                gone += 1
            continue
        # Prefer the listing we already track, then the one with most stock.
        r = max(in_stock, key=lambda r: (r.get("componentCode") == m.get("lcsc"), r["stockCount"]))
        p1 = tier_price(r["componentPrices"], 1)
        m["price"] = round(tier_price(r["componentPrices"], QTY), 4)
        m["priceQty"] = QTY
        m["priceConf"] = "verified"
        m["priceSource"] = (f"JLCPCB/LCSC {r['componentCode']} ({r['componentModelEn']}, {r.get('componentSpecificationEn') or '?'}) "
                            f"@{QTY} pcs, read from the JLC parts API on {today}" + (f"; 1 pc ${p1}" if p1 is not None else ""))
        m["lcsc"], m["jlcStock"] = r["componentCode"], r["stockCount"]
        m["jlcLibrary"] = LIB.get(r.get("componentLibraryType"), r.get("componentLibraryType"))
        hits += 1
    tmp = CATALOG.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    tmp.replace(CATALOG)
    print(f"verified {hits}/{len(catalog['mcus'])}, out of stock {oos}, no longer listed {gone}, lookups failed {len(failed)}")
    for f in failed:
        print("  !", f)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
