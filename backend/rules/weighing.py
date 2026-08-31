from .mpe import get_mpe


def evaluate_weighing_test(
    scale_e: float,
    accuracy_class: str,
    test_points: list
):
    results = []
    overall_pass = True

    for point in test_points:
        load = point["load"]
        indicated = point["indicated"]

        # Actual error
        error = indicated - load

        # Convert load into number of scale intervals
        load_in_e = load / scale_e

        # MPE in units of e
        mpe_in_e = get_mpe(load_in_e, accuracy_class)

        # MPE in actual weight units
        allowed_mpe = mpe_in_e * scale_e

        # PASS / FAIL
        passed = abs(error) <= allowed_mpe

        if not passed:
            overall_pass = False

        results.append({
            "load": load,
            "indicated": indicated,
            "error": round(error, 6),
            "allowed_mpe": round(allowed_mpe, 6),
            "status": "PASS" if passed else "FAIL"
        })

    return {
        "overall_status": "PASS" if overall_pass else "FAIL",
        "details": results
    }