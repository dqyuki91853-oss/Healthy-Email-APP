#!/usr/bin/env python3
"""Generate a simple 1024x1024 PNG for `npx tauri icon`."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts" / "app-icon.png"


def write_png(path: Path, size: int, rgba: tuple[int, int, int, int]) -> None:
    w = h = size
    r, g, b, a = rgba
    raw = b""
    for _ in range(h):
        raw += b"\x00"
        raw += bytes([r, g, b, a]) * w

    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def main() -> None:
    # App teal from DESIGN_OVERHAUL
    write_png(OUT, 1024, (99, 173, 150, 255))
    print(OUT)


if __name__ == "__main__":
    main()
