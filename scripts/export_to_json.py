#!/usr/bin/env python3
"""Stream-parse Apple Health export.xml → public/data/watch-data.json"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from health_parse import parse_daily_series, to_web_row  # noqa: E402

URIC = Path.home() / "Projects" / "uric-acid-monitor"
sys.path.insert(0, str(URIC))

try:
    from src.health_import.health_export import parse_profile_from_export  # noqa: E402
except ImportError:
    parse_profile_from_export = None  # type: ignore

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


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/export_to_json.py <path-to-export.xml> [max_days]", file=sys.stderr)
        sys.exit(1)

    xml_path = Path(sys.argv[1])
    max_days = int(sys.argv[2]) if len(sys.argv) > 2 else 365

    if not xml_path.exists():
        print(f"File not found: {xml_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Parsing {xml_path} (last {max_days} days)…", flush=True)
    rows = parse_daily_series(xml_path, days=max_days)
    profile = parse_profile_from_export(xml_path) if parse_profile_from_export else {}

    web_rows = [to_web_row(r) for r in rows]
    meta = {
        "importedAt": datetime.now(timezone.utc).isoformat(),
        "source": str(xml_path),
        "recordCount": len(web_rows),
        "metricIndex": METRIC_INDEX,
        "dateRange": (
            {"start": web_rows[0]["date"], "end": web_rows[-1]["date"]}
            if web_rows
            else {"start": "", "end": ""}
        ),
        "profile": profile,
        "rows": web_rows,
    }

    out_dir = ROOT / "public" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "watch-data.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False)

    print(f"Wrote {len(web_rows)} days → {out_path}")
    if web_rows:
        print(f"Date range: {meta['dateRange']['start']} → {meta['dateRange']['end']}")
    if profile:
        print(f"Profile: {profile}")


if __name__ == "__main__":
    main()
