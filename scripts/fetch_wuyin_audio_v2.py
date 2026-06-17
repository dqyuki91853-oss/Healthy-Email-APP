#!/usr/bin/env python3
"""Download OpenLo-Fi CC0 tracks with size verification and retry."""

from __future__ import annotations

import sys
import tempfile
import zipfile
from pathlib import Path
from urllib.request import urlopen, Request

RELEASE_URL = "https://github.com/btahir/open-lofi/releases/latest/download/openlofi.zip"

CURATED_FILES = [
    "teacup-morning-fog.mp3", "dust-on-the-morning-keys.mp3",
    "mist-over-green-fields.mp3", "bells-before-sunrise.mp3",
    "stacks-of-quiet-books.mp3", "sidewalk-puddles.mp3",
    "bloom-between-showers.mp3", "spring-garden-loops.mp3",
    "petals-in-the-breeze.mp3", "fireplace-loop.mp3",
    "golden-afternoon-groove.mp3", "amber-windowpane.mp3",
    "underwater-dreamscape.mp3", "satellite-lullaby.mp3",
    "tide-pools-at-twilight.mp3",
]

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "audio" / "wuyin" / "open-lofi"

MAX_RETRIES = 3


def download_zip(path: Path) -> int:
    """Download zip, returns actual bytes written. Retries on incomplete download."""
    for attempt in range(1, MAX_RETRIES + 1):
        print(f"Download attempt {attempt}/{MAX_RETRIES}: {RELEASE_URL}")
        req = Request(RELEASE_URL, headers={"User-Agent": "subhealth-monitor/1.0"})
        with urlopen(req, timeout=600) as resp:
            expected = int(resp.headers.get("Content-Length", 0))
            print(f"  Expected size: {expected // (1024*1024)} MB")
            done = 0
            with path.open("wb") as out:
                while True:
                    chunk = resp.read(1024 * 256)
                    if not chunk:
                        break
                    out.write(chunk)
                    done += len(chunk)
                    if expected:
                        pct = done * 100 // expected
                        print(f"\r  {done // (1024*1024)} / {expected // (1024*1024)} MB ({pct}%)", end="", flush=True)
                    else:
                        print(f"\r  {done // (1024*1024)} MB", end="", flush=True)

        actual = path.stat().st_size
        print(f"\n  Downloaded: {actual // (1024*1024)} MB")
        if expected > 0 and actual < expected * 0.95:
            print(f"  Incomplete! Expected {expected // (1024*1024)} MB. Retrying...")
            path.unlink(missing_ok=True)
            if attempt < MAX_RETRIES:
                import time
                time.sleep(5)
            continue
        print("  Download complete")
        return actual
    return 0


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    needed = set(CURATED_FILES)
    existing = {p.name for p in OUT_DIR.glob("*.mp3")}
    if needed <= existing:
        print(f"All {len(needed)} tracks already present in {OUT_DIR}")
        return 0

    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
        zip_path = Path(tmp.name)

    try:
        size = download_zip(zip_path)
        if size == 0:
            print("ERROR: Download failed after all retries", file=sys.stderr)
            return 1

        # Verify zip integrity
        try:
            with zipfile.ZipFile(zip_path) as zf:
                bad = zf.testzip()
                if bad:
                    print(f"ERROR: Corrupted zip (bad file: {bad})", file=sys.stderr)
                    return 1
                print("Zip integrity check: OK")
        except zipfile.BadZipFile:
            print("ERROR: File is not a valid zip", file=sys.stderr)
            return 1

        extracted = 0
        with zipfile.ZipFile(zip_path) as zf:
            for info in zf.infolist():
                name = Path(info.filename).name
                if name not in needed:
                    continue
                target = OUT_DIR / name
                target.write_bytes(zf.read(info.filename))
                size_mb = target.stat().st_size / (1024 * 1024)
                print(f"  extract: {name} ({size_mb:.1f} MB)")
                extracted += 1
    finally:
        zip_path.unlink(missing_ok=True)

    if extracted < len(CURATED_FILES):
        missing = needed - {p.name for p in OUT_DIR.glob("*.mp3")}
        print(f"Warning: missing {len(missing)} files: {sorted(missing)}", file=sys.stderr)
        return 1

    print(f"Done — {extracted} tracks in {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
