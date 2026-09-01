from typing import Dict, List


def evaluate_tare_zero_test(
    scale_e: float,
    zero_errors: List[float],
    tare_errors: List[float],
) -> Dict:
    """
    Evaluate zero-setting and tare-setting accuracy.

    This MVP expects the inspector to enter the measured error
    obtained during the physical test.

    For electronic instruments / instruments with analogue indication,
    OIML R 76-1 specifies an accuracy better than +/- 0.25 e for:
      - zero-setting accuracy
      - tare-setting accuracy

    The actual physical test procedure is performed on the instrument;
    this function evaluates the measured observations.
    """

    if scale_e <= 0:
        raise ValueError(
            "Scale interval (e) must be greater than zero."
        )

    if not zero_errors and not tare_errors:
        raise ValueError(
            "At least one zero-setting or tare error is required."
        )

    allowed_tolerance = 0.25 * scale_e

    zero_details = []

    for index, error in enumerate(zero_errors):
        is_pass = abs(error) <= (
            allowed_tolerance + 1e-9
        )

        zero_details.append(
            {
                "test_type": "ZERO_SETTING",
                "test_number": index + 1,
                "measured_error": round(error, 6),
                "allowed_tolerance": round(
                    allowed_tolerance,
                    6
                ),
                "status": (
                    "PASS"
                    if is_pass
                    else "FAIL"
                ),
            }
        )

    tare_details = []

    for index, error in enumerate(tare_errors):
        is_pass = abs(error) <= (
            allowed_tolerance + 1e-9
        )

        tare_details.append(
            {
                "test_type": "TARE_SETTING",
                "test_number": index + 1,
                "measured_error": round(error, 6),
                "allowed_tolerance": round(
                    allowed_tolerance,
                    6
                ),
                "status": (
                    "PASS"
                    if is_pass
                    else "FAIL"
                ),
            }
        )

    details = zero_details + tare_details

    overall_pass = all(
        item["status"] == "PASS"
        for item in details
    )

    zero_pass = all(
        item["status"] == "PASS"
        for item in zero_details
    ) if zero_details else True

    tare_pass = all(
        item["status"] == "PASS"
        for item in tare_details
    ) if tare_details else True

    return {
        "scale_e": scale_e,
        "allowed_tolerance": round(
            allowed_tolerance,
            6
        ),
        "zero_setting_status": (
            "PASS"
            if zero_pass
            else "FAIL"
        ),
        "tare_setting_status": (
            "PASS"
            if tare_pass
            else "FAIL"
        ),
        "overall_status": (
            "PASS"
            if overall_pass
            else "FAIL"
        ),
        "zero_tests": len(zero_errors),
        "tare_tests": len(tare_errors),
        "details": details,
    }