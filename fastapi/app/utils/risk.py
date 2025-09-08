def get_risk_from_score(score: int) -> int:
    if score > 8:
        return 3
    if score > 6:
        return 2
    if score > 3:
        return 1
    return 0
