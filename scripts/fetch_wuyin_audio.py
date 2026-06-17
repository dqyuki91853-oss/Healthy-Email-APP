#!/usr/bin/env python3
"""Download curated OpenLo-Fi (CC0) tracks into public/audio/wuyin/open-lofi/.

Strategies (in order):
  1. Partial HTTP Range extraction (~50–80 MB for 15 tracks, not 528 MB zip)
  2. Local zip: --from-zip ~/Downloads/openlofi.zip
  3. Full zip with curl resume + optional mirror URLs
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from pathlib import Path
from urllib.request import urlopen

DEFAULT_RELEASE = (
    "https://github.com/btahir/open-lofi/releases/download/v1.0.0/openlofi.zip"
)
MIRROR_URLS = [
    DEFAULT_RELEASE,
    f"https://ghfast.top/{DEFAULT_RELEASE}",
    f"https://mirror.ghproxy.com/{DEFAULT_RELEASE}",
]

CURATED_FILES = [
    "teacup-morning-fog.mp3",
    "dust-on-the-morning-keys.mp3",
    "mist-over-green-fields.mp3",
    "bells-before-sunrise.mp3",
    "stacks-of-quiet-books.mp3",
    "sidewalk-puddles.mp3",
    "bloom-between-showers.mp3",
    "spring-garden-loops.mp3",
    "petals-in-the-breeze.mp3",
    "fireplace-loop.mp3",
    "golden-afternoon-groove.mp3",
    "amber-windowpane.mp3",
    "underwater-dreamscape.mp3",
    "satellite-lullaby.mp3",
    "tide-pools-at-twilight.mp3",
]

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "audio" / "wuyin" / "open-lofi"


def extract_from_zip(zip_path: Path, needed: set[str]) -> int:
    extracted = 0
    with zipfile.ZipFile(zip_path) as zf:
        for info in zf.infolist():
            name = Path(info.filename).name
            if name not in needed:
                continue
            target = OUT_DIR / name
            if target.exists() and target.stat().st_size > 0:
                print(f"  skip (exists): {name}")
                extracted += 1
                continue
            print(f"  extract: {name}")
            target.write_bytes(zf.read(info.filename))
            extracted += 1
    return extracted


def extract_remote_partial(url: str, needed: set[str]) -> int:
    try:
        from remotezip import RemoteZip
    except ImportError as err:
        raise RuntimeError(
            "partial download needs: pip3 install remotezip\n"
            "  or use: python3 scripts/fetch_wuyin_audio.py --from-zip ~/Downloads/openlofi.zip"
        ) from err

    extracted = 0
    print(f"Partial fetch from {url} …")
    with RemoteZip(url) as zf:
        names_in_zip = {Path(i.filename).name for i in zf.infolist()}
        missing = needed - names_in_zip
        if missing:
            raise RuntimeError(f"tracks not in zip: {sorted(missing)}")

        for info in zf.infolist():
            name = Path(info.filename).name
            if name not in needed:
                continue
            target = OUT_DIR / name
            if target.exists() and target.stat().st_size > 0:
                print(f"  skip (exists): {name}")
                extracted += 1
                continue
            print(f"  download: {name}")
            target.write_bytes(zf.read(info))
            extracted += 1
    return extracted


def download_full_with_curl(url: str, dest: Path) -> None:
    if not shutil.which("curl"):
        raise RuntimeError("curl not found — install Xcode CLI tools or use --from-zip")

    print(f"Full download (resume OK): {url}")
    subprocess.run(
        ["curl", "-L", "--fail", "--retry", "5", "--retry-delay", "3", "-C", "-", "-o", str(dest), url],
        check=True,
    )
    with zipfile.ZipFile(dest) as zf:
        bad = zf.testzip()
        if bad:
            raise zipfile.BadZipFile(f"corrupt entry: {bad}")


def download_full_python(url: str, dest: Path) -> None:
    print(f"Full download: {url}")
    with urlopen(url, timeout=600) as resp:
        total = int(resp.headers.get("Content-Length", 0))
        done = 0
        chunk = 1024 * 256
        with dest.open("wb") as out:
            while True:
                block = resp.read(chunk)
                if not block:
                    break
                out.write(block)
                done += len(block)
                if total:
                    print(f"\r  {done // (1024 * 1024)} / {total // (1024 * 1024)} MB", end="", flush=True)
    print()
    if total and done < total:
        raise OSError(f"incomplete: {done}/{total} bytes")
    with zipfile.ZipFile(dest) as zf:
        zf.testzip()


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch curated OpenLo-Fi tracks (CC0)")
    parser.add_argument(
        "--from-zip",
        type=Path,
        help="extract from a local openlofi.zip (browser download)",
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="download entire 528MB zip instead of partial Range fetch",
    )
    parser.add_argument("--url", help="override release zip URL")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    needed = set(CURATED_FILES)
    existing = {p.name for p in OUT_DIR.glob("*.mp3")}
    if needed <= existing:
        print(f"All {len(needed)} tracks already in {OUT_DIR}")
        return 0

    still_needed = needed - existing

    if args.from_zip:
        if not args.from_zip.is_file():
            print(f"File not found: {args.from_zip}", file=sys.stderr)
            return 1
        print(f"Extracting from {args.from_zip}")
        count = extract_from_zip(args.from_zip, still_needed)
    elif args.full:
        urls = [args.url] if args.url else MIRROR_URLS
        count = 0
        last_err: Exception | None = None
        with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
            zip_path = Path(tmp.name)
        try:
            for url in urls:
                try:
                    if shutil.which("curl"):
                        download_full_with_curl(url, zip_path)
                    else:
                        download_full_python(url, zip_path)
                    count = extract_from_zip(zip_path, still_needed)
                    break
                except Exception as err:
                    last_err = err
                    zip_path.unlink(missing_ok=True)
                    print(f"  mirror failed: {err}", file=sys.stderr)
                    time.sleep(2)
            else:
                raise RuntimeError("all mirrors failed") from last_err
        finally:
            zip_path.unlink(missing_ok=True)
    else:
        urls = [args.url] if args.url else MIRROR_URLS
        count = 0
        last_err: Exception | None = None
        for url in urls:
            try:
                count = extract_remote_partial(url, still_needed)
                break
            except Exception as err:
                last_err = err
                print(f"  partial failed ({url}): {err}", file=sys.stderr)
                time.sleep(2)
        else:
            print("\nPartial download failed. Options:", file=sys.stderr)
            print("  pip3 install remotezip && python3 scripts/fetch_wuyin_audio.py", file=sys.stderr)
            print("  Browser: download openlofi.zip → --from-zip ~/Downloads/openlofi.zip", file=sys.stderr)
            print("  python3 scripts/fetch_wuyin_audio.py --full", file=sys.stderr)
            return 1

    have = {p.name for p in OUT_DIR.glob("*.mp3")}
    missing = needed - have
    if missing:
        print(f"Still missing {len(missing)}: {sorted(missing)}", file=sys.stderr)
        return 1

    print(f"Done — {count} new track(s), {len(have)} total in {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
