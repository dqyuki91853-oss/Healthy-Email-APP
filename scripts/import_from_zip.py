#!/usr/bin/env python3
"""Extract Apple Health ZIP, parse date range, write public/data/watch-data.json."""

from __future__ import annotations

import argparse
import json
import sys
import tempfile
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from health_parse import DailyRow, parse_daily_series, to_web_row  # noqa: E402

METRIC_INDEX = [
    "dailySteps",
    "activeEnergyKcal",
    "exerciseMinutes",
    "restingHr",
    "hrvSdnn",
    "hrvReadings",
    "spo2Readings",
    "spo2DesatEvents",
    "respiratoryRateSleep",
    "walkingAsymmetryPct",
    "walkingSteadiness",
    "wristTempRaw",
    "sleepHours",
    "deepSleepMin",
    "remSleepMin",
    "coreSleepMin",
    "inBedMin",
    "awakeEpisodes",
    "vo2max",
    "cardioRecovery1min",
    "daylightMinutes",
    "environmentalNoiseDb",
]


def find_export_xml(zf: zipfile.ZipFile) -> str:
    for name in zf.namelist():
        base = Path(name).name.lower()
        if base in ("export.xml", "导出.xml") or (base.endswith(".xml") and "export" in base):
            if "cda" not in base:
                return name
    for name in zf.namelist():
        if name.endswith(".xml") and "cda" not in name.lower():
            return name
    raise FileNotFoundError("No export.xml / 导出.xml found in ZIP")


def fill_date_range(rows: list[dict], start: str, end: str) -> list[dict]:
    by_date = {r["date"]: r for r in rows}
    cur = datetime.strptime(start, "%Y-%m-%d")
    end_dt = datetime.strptime(end, "%Y-%m-%d")
    out: list[dict] = []
    while cur <= end_dt:
        day = cur.strftime("%Y-%m-%d")
        out.append(by_date.get(day) or to_web_row(DailyRow(date=day)))
        cur += timedelta(days=1)
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Import Apple Health ZIP with optional date range")
    parser.add_argument("zip_path", type=Path, help="Path to Apple Health export ZIP")
    parser.add_argument("--start", required=True, help="Start date YYYY-MM-DD (inclusive)")
    parser.add_argument("--end", required=True, help="End date YYYY-MM-DD (inclusive)")
    args = parser.parse_args()

    if not args.zip_path.exists():
        print(f"File not found: {args.zip_path}", file=sys.stderr)
        sys.exit(1)

    with zipfile.ZipFile(args.zip_path) as zf:
        xml_name = find_export_xml(zf)
        print(f"Found {xml_name} in ZIP", flush=True)
        with tempfile.TemporaryDirectory() as tmp:
            xml_path = Path(tmp) / Path(xml_name).name
            print(f"Extracting to {xml_path}…", flush=True)
            with zf.open(xml_name) as src, xml_path.open("wb") as dst:
                while chunk := src.read(8 * 1024 * 1024):
                    dst.write(chunk)
            print(f"Parsing {args.start} → {args.end}…", flush=True)
            rows = parse_daily_series(
                xml_path,
                start_date=args.start,
                end_date=args.end,
            )

    web_rows = fill_date_range([to_web_row(r) for r in rows], args.start, args.end)
    imported_at = datetime.now(timezone.utc).isoformat()
    seed_id = f"{args.start}_{args.end}_{imported_at}"

    meta = {
        "seedId": seed_id,
        "importedAt": imported_at,
        "source": str(args.zip_path),
        "recordCount": len(web_rows),
        "metricIndex": METRIC_INDEX,
        "dateRange": (
            {"start": web_rows[0]["date"], "end": web_rows[-1]["date"]}
            if web_rows
            else {"start": args.start, "end": args.end}
        ),
        "profile": {},
        "rows": web_rows,
    }

    out_dir = ROOT / "public" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "watch-data.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False)

    print(f"Wrote {len(web_rows)} days → {out_path}")
    if web_rows:
        print(f"Dates: {', '.join(r['date'] for r in web_rows)}")
    else:
        print("Warning: no rows in date range", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
