#!/usr/bin/env python3
"""Stream-parse Apple Health export.xml → daily rows with full metric index (null if missing)."""

from __future__ import annotations

import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from statistics import mean

WATCH_TYPE_MAP = {
    "HKQuantityTypeIdentifierStepCount": "daily_steps",
    "HKQuantityTypeIdentifierActiveEnergyBurned": "active_energy_kcal",
    "HKQuantityTypeIdentifierAppleExerciseTime": "exercise_minutes",
    "HKQuantityTypeIdentifierRestingHeartRate": "resting_hr",
    "HKQuantityTypeIdentifierHeartRateVariabilitySDNN": "hrv_sdnn",
    "HKQuantityTypeIdentifierVO2Max": "vo2max",
    "HKQuantityTypeIdentifierOxygenSaturation": "spo2",
    "HKQuantityTypeIdentifierWalkingAsymmetryPercentage": "walking_asymmetry_pct",
    "HKQuantityTypeIdentifierAppleSleepingWristTemperature": "wrist_temp_raw",
    "HKQuantityTypeIdentifierRespiratoryRate": "respiratory_rate_sleep",
    "HKQuantityTypeIdentifierHeartRateRecoveryOneMinute": "cardio_recovery_1min",
    "HKQuantityTypeIdentifierTimeInDaylight": "daylight_minutes",
    "HKQuantityTypeIdentifierEnvironmentalSoundPressureLevel": "environmental_noise_db",
}

WALKING_STEADINESS_TYPE = "HKCategoryTypeIdentifierAppleWalkingSteadiness"
WALKING_STEADINESS_MAP = {
    "HKCategoryValueAppleWalkingSteadinessOK": "normal",
    "HKCategoryValueAppleWalkingSteadinessLow": "low",
    "HKCategoryValueAppleWalkingSteadinessVeryLow": "very_low",
}

SLEEP_TYPE = "HKCategoryTypeIdentifierSleepAnalysis"
SLEEP_ASLEEP = {
    "HKCategoryValueSleepAnalysisAsleepCore",
    "HKCategoryValueSleepAnalysisAsleepDeep",
    "HKCategoryValueSleepAnalysisAsleepREM",
    "HKCategoryValueSleepAnalysisAsleepUnspecified",
}
SLEEP_DEEP = "HKCategoryValueSleepAnalysisAsleepDeep"
SLEEP_REM = "HKCategoryValueSleepAnalysisAsleepREM"
SLEEP_CORE = "HKCategoryValueSleepAnalysisAsleepCore"
SLEEP_IN_BED = "HKCategoryValueSleepAnalysisInBed"
SLEEP_AWAKE = "HKCategoryValueSleepAnalysisAwake"
SPO2_DESAT = 90.0


@dataclass
class DailyRow:
    date: str
    daily_steps: float | None = None
    active_energy_kcal: float | None = None
    exercise_minutes: float | None = None
    resting_hr: float | None = None
    hrv_sdnn: float | None = None
    hrv_readings: list[float] = field(default_factory=list)
    spo2_readings: list[float] = field(default_factory=list)
    spo2_desat_events: int | None = None
    respiratory_rate_sleep: float | None = None
    walking_asymmetry_pct: float | None = None
    walking_steadiness: str | None = None
    wrist_temp_raw: float | None = None
    sleep_hours: float | None = None
    deep_sleep_min: float | None = None
    rem_sleep_min: float | None = None
    core_sleep_min: float | None = None
    in_bed_min: float | None = None
    awake_episodes: int | None = None
    vo2max: float | None = None
    cardio_recovery_1min: float | None = None
    daylight_minutes: float | None = None
    environmental_noise_db: float | None = None


def _parse_dt(s: str) -> datetime | None:
    try:
        return datetime.strptime(s[:19], "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None


def _normalize(key: str, val: float) -> float:
    if key == "spo2" and val <= 1.5:
        return val * 100
    if key == "walking_asymmetry_pct" and val <= 1:
        return val * 100
    return val


def _clean_rhr(v: float) -> float | None:
    if v < 30 or v > 120:
        return None
    return v


def _ensure(days: dict[str, DailyRow], key: str) -> DailyRow:
    if key not in days:
        days[key] = DailyRow(date=key)
    return days[key]


def _add_cumulative(row: DailyRow, attr: str, v: float) -> None:
    cur = getattr(row, attr)
    setattr(row, attr, v if cur is None else cur + v)


def _add_sleep_min(row: DailyRow, attr: str, mins: float) -> None:
    if attr == "sleep_hours":
        cur = row.sleep_hours
        row.sleep_hours = mins / 60 if cur is None else cur + mins / 60
    else:
        cur = getattr(row, attr)
        setattr(row, attr, mins if cur is None else cur + mins)


def _inc(row: DailyRow, attr: str) -> None:
    cur = getattr(row, attr)
    setattr(row, attr, 1 if cur is None else cur + 1)


def parse_daily_series(
    xml_path: str | Path,
    days: int = 365,
    *,
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[DailyRow]:
    path = Path(xml_path)
    if start_date:
        cutoff = datetime.strptime(start_date, "%Y-%m-%d") - timedelta(days=1)
        range_buffer_start = cutoff.strftime("%Y-%m-%d")
    else:
        cutoff = datetime.now() - timedelta(days=days)
        range_buffer_start = None
    daily: dict[str, DailyRow] = {}

    for _, elem in ET.iterparse(path, events=("end",)):
        if elem.tag != "Record":
            elem.clear()
            continue

        rtype = elem.get("type", "")
        start = elem.get("startDate", "")
        if start_date or end_date:
            day_str = start[:10] if len(start) >= 10 else ""
            if end_date and day_str > end_date:
                elem.clear()
                continue
            if range_buffer_start and day_str and day_str < range_buffer_start:
                elem.clear()
                continue
        dt = _parse_dt(start)
        if dt is None or (not start_date and dt < cutoff):
            elem.clear()
            continue
        if start_date and dt < cutoff:
            elem.clear()
            continue

        day = _ensure(daily, dt.strftime("%Y-%m-%d"))
        val_raw = elem.get("value")
        end = elem.get("endDate", start)
        dt_end = _parse_dt(end) or dt

        if rtype == WALKING_STEADINESS_TYPE and val_raw:
            level = WALKING_STEADINESS_MAP.get(val_raw)
            if level:
                day.walking_steadiness = level
            elem.clear()
            continue

        if rtype == SLEEP_TYPE and val_raw:
            mins = max(0.0, (dt_end - dt).total_seconds() / 60)
            if mins > 0:
                if val_raw == SLEEP_IN_BED:
                    _add_sleep_min(day, "in_bed_min", mins)
                elif val_raw == SLEEP_AWAKE:
                    _inc(day, "awake_episodes")
                elif val_raw in SLEEP_ASLEEP:
                    _add_sleep_min(day, "sleep_hours", mins)
                    if val_raw == SLEEP_DEEP:
                        _add_sleep_min(day, "deep_sleep_min", mins)
                    elif val_raw == SLEEP_REM:
                        _add_sleep_min(day, "rem_sleep_min", mins)
                    elif val_raw == SLEEP_CORE:
                        _add_sleep_min(day, "core_sleep_min", mins)
            elem.clear()
            continue

        if rtype in WATCH_TYPE_MAP:
            key = WATCH_TYPE_MAP[rtype]
            if not val_raw:
                elem.clear()
                continue
            v = _normalize(key, float(val_raw))

            if key == "daily_steps":
                _add_cumulative(day, "daily_steps", v)
            elif key == "active_energy_kcal":
                _add_cumulative(day, "active_energy_kcal", v)
            elif key == "exercise_minutes":
                _add_cumulative(day, "exercise_minutes", v)
            elif key == "daylight_minutes":
                _add_cumulative(day, "daylight_minutes", v)
            elif key == "resting_hr":
                day.resting_hr = _clean_rhr(v)
            elif key == "hrv_sdnn":
                day.hrv_readings.append(v)
                day.hrv_sdnn = mean(day.hrv_readings)
            elif key == "spo2":
                day.spo2_readings.append(v)
                if v < SPO2_DESAT:
                    _inc(day, "spo2_desat_events")
            elif key == "respiratory_rate_sleep":
                hour = dt.hour
                if hour >= 22 or hour < 8:
                    day.respiratory_rate_sleep = v
            elif key == "walking_asymmetry_pct":
                day.walking_asymmetry_pct = v
            elif key == "wrist_temp_raw":
                day.wrist_temp_raw = v
            elif key == "vo2max":
                day.vo2max = v
            elif key == "cardio_recovery_1min":
                day.cardio_recovery_1min = v
            elif key == "environmental_noise_db":
                day.environmental_noise_db = v

        elem.clear()

    rows = sorted(daily.values(), key=lambda r: r.date)
    if start_date:
        rows = [r for r in rows if r.date >= start_date]
    if end_date:
        rows = [r for r in rows if r.date <= end_date]
    for row in rows:
        if not row.spo2_readings:
            row.spo2_desat_events = None
        if not row.hrv_readings:
            row.hrv_sdnn = None
        if row.sleep_hours is not None:
            row.sleep_hours = round(row.sleep_hours, 2)
    return rows


def to_web_row(row: DailyRow) -> dict:
    def rnd(v: float | None, n: int = 1) -> float | None:
        return round(v, n) if v is not None else None

    return {
        "date": row.date,
        "dailySteps": rnd(row.daily_steps, 1),
        "activeEnergyKcal": rnd(row.active_energy_kcal, 1),
        "exerciseMinutes": rnd(row.exercise_minutes, 1),
        "restingHr": rnd(row.resting_hr, 1),
        "hrvSdnn": rnd(row.hrv_sdnn, 2),
        "hrvReadings": [round(x, 2) for x in row.hrv_readings],
        "spo2Readings": [round(x, 2) for x in row.spo2_readings],
        "spo2DesatEvents": row.spo2_desat_events,
        "respiratoryRateSleep": rnd(row.respiratory_rate_sleep, 2),
        "walkingAsymmetryPct": rnd(row.walking_asymmetry_pct, 2),
        "walkingSteadiness": row.walking_steadiness,
        "wristTempRaw": rnd(row.wrist_temp_raw, 3),
        "sleepHours": rnd(row.sleep_hours, 2),
        "deepSleepMin": rnd(row.deep_sleep_min, 1),
        "remSleepMin": rnd(row.rem_sleep_min, 1),
        "coreSleepMin": rnd(row.core_sleep_min, 1),
        "inBedMin": rnd(row.in_bed_min, 1),
        "awakeEpisodes": row.awake_episodes,
        "vo2max": rnd(row.vo2max, 2),
        "cardioRecovery1min": rnd(row.cardio_recovery_1min, 1),
        "daylightMinutes": rnd(row.daylight_minutes, 1),
        "environmentalNoiseDb": rnd(row.environmental_noise_db, 1),
    }
