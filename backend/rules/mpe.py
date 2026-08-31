def get_mpe(load_in_e: float, accuracy_class: str) -> float:
    """
    Returns the maximum permissible error in units of scale interval 'e'.
    """

    accuracy_class = accuracy_class.upper()

    if accuracy_class == "CLASS I":
        if load_in_e <= 50000:
            return 0.5
        elif load_in_e <= 200000:
            return 1.0
        else:
            return 1.5

    elif accuracy_class == "CLASS II":
        if load_in_e <= 5000:
            return 0.5
        elif load_in_e <= 20000:
            return 1.0
        else:
            return 1.5

    elif accuracy_class == "CLASS III":
        if load_in_e <= 500:
            return 0.5
        elif load_in_e <= 2000:
            return 1.0
        else:
            return 1.5

    elif accuracy_class == "CLASS IIII":
        if load_in_e <= 50:
            return 0.5
        elif load_in_e <= 200:
            return 1.0
        else:
            return 1.5

    else:
        raise ValueError(f"Invalid accuracy class: {accuracy_class}")