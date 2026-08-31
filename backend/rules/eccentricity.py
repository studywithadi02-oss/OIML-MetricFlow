from typing import Dict, List


def evaluate_eccentricity_test(
    test_load: float,
    readings: List[float],
    scale_e: float
) -> Dict:
    """
    Eccentricity evaluation based on the SIH solution guide.

    The first reading is treated as the center/reference value.
    The maximum absolute difference from the center value is compared
    against a tolerance of 1.0 × scale interval (e).
    """

    if len(readings) < 2:
        raise ValueError("At least 2 readings are required.")

    if scale_e <= 0:
        raise ValueError("Scale interval (e) must be greater than zero.")

    center_val = readings[0]

    differences = [
        abs(reading - center_val)
        for reading in readings[1:]
    ]

    max_diff = max(differences)

    # Per the supplied SIH solution guide:
    # eccentricity tolerance = 1.0 × e
    mpe_e = 1.0
    allowed_tolerance = mpe_e * scale_e

    is_pass = max_diff <= (allowed_tolerance + 1e-9)

    details = []

    for index, reading in enumerate(readings):
        if index == 0:
            error = 0.0
            status = "REFERENCE"
        else:
            error = reading - center_val
            status = (
                "PASS"
                if abs(error) <= (allowed_tolerance + 1e-9)
                else "FAIL"
            )

        details.append(
            {
                "position": index + 1,
                "indicated": reading,
                "error": round(error, 6),
                "status": status,
            }
        )

    return {
        "test_load": test_load,
        "max_difference": round(max_diff, 6),
        "allowed_tolerance": round(allowed_tolerance, 6),
        "status": "PASS" if is_pass else "FAIL",
        "details": details,
    }