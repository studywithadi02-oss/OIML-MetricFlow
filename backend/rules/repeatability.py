from typing import Dict, List


def get_required_readings(accuracy_class: str) -> int:
    """
    Number of repeatability weighings required for verification.

    Class I and II  -> 6 weighings
    Class III and IIII -> 3 weighings
    """

    accuracy_class = accuracy_class.upper().strip()

    if accuracy_class in ("CLASS I", "CLASS II"):
        return 6

    if accuracy_class in ("CLASS III", "CLASS IIII"):
        return 3

    raise ValueError(f"Invalid Accuracy Class: {accuracy_class}")


def get_mpe_multiplier(
    load_in_e: float,
    accuracy_class: str
) -> float:
    """
    Returns the MPE multiplier in units of e.

    This follows the same initial-verification MPE table
    already implemented for the weighing test.
    """

    accuracy_class = accuracy_class.upper().strip()

    if load_in_e < 0:
        raise ValueError("Load cannot be negative.")

    if accuracy_class == "CLASS I":
        if load_in_e <= 50000:
            return 0.5
        elif load_in_e <= 200000:
            return 1.0
        return 1.5

    if accuracy_class == "CLASS II":
        if load_in_e <= 5000:
            return 0.5
        elif load_in_e <= 20000:
            return 1.0
        return 1.5

    if accuracy_class == "CLASS III":
        if load_in_e <= 500:
            return 0.5
        elif load_in_e <= 2000:
            return 1.0
        return 1.5

    if accuracy_class == "CLASS IIII":
        if load_in_e <= 50:
            return 0.5
        elif load_in_e <= 200:
            return 1.0
        return 1.5

    raise ValueError(f"Invalid Accuracy Class: {accuracy_class}")


def evaluate_repeatability_test(
    test_load: float,
    readings: List[float],
    scale_e: float,
    accuracy_class: str
) -> Dict:
    """
    Evaluate repeatability of repeated weighings at the same load.

    Individual weighing error:
        indicated - test_load

    Repeatability difference:
        maximum reading - minimum reading

    PASS requires:
    1. Every individual error is within the applicable MPE.
    2. The maximum difference between repeated readings is within the MPE.
    """

    if scale_e <= 0:
        raise ValueError("Scale interval (e) must be greater than zero.")

    if test_load < 0:
        raise ValueError("Test load cannot be negative.")

    required_readings = get_required_readings(accuracy_class)

    if len(readings) != required_readings:
        raise ValueError(
            f"{accuracy_class} requires exactly "
            f"{required_readings} readings."
        )

    load_in_e = test_load / scale_e

    mpe_multiplier = get_mpe_multiplier(
        load_in_e=load_in_e,
        accuracy_class=accuracy_class
    )

    allowed_mpe = mpe_multiplier * scale_e

    max_reading = max(readings)
    min_reading = min(readings)

    repeatability_difference = max_reading - min_reading

    details = []

    all_individual_pass = True

    for index, reading in enumerate(readings):

        error = reading - test_load

        is_pass = abs(error) <= (allowed_mpe + 1e-9)

        if not is_pass:
            all_individual_pass = False

        details.append(
            {
                "reading_number": index + 1,
                "indicated": reading,
                "error": round(error, 6),
                "status": "PASS" if is_pass else "FAIL"
            }
        )

    repeatability_pass = (
        repeatability_difference
        <= (allowed_mpe + 1e-9)
    )

    overall_pass = (
        all_individual_pass
        and repeatability_pass
    )

    return {
        "test_load": test_load,
        "accuracy_class": accuracy_class,
        "required_readings": required_readings,
        "actual_readings": len(readings),
        "mpe_multiplier": mpe_multiplier,
        "allowed_mpe": round(allowed_mpe, 6),
        "minimum_reading": round(min_reading, 6),
        "maximum_reading": round(max_reading, 6),
        "repeatability_difference": round(
            repeatability_difference,
            6
        ),
        "repeatability_status": (
            "PASS"
            if repeatability_pass
            else "FAIL"
        ),
        "individual_status": (
            "PASS"
            if all_individual_pass
            else "FAIL"
        ),
        "overall_status": (
            "PASS"
            if overall_pass
            else "FAIL"
        ),
        "details": details,
    }