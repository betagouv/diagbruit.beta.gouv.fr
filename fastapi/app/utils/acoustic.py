
_EPS = 1e-9


def correction_from_angle(angle_vue: float) -> int:
    """
    Barème (dB) :
      >135  ->  0
      110–135 -> -1
      90–110  -> -2
      60–90   -> -3
      30–60   -> -4
      15–30   -> -5
      0–15    -> -6
      =0      -> -9
    """
    a = angle_vue
    if a <= _EPS:
        return -9
    if a > 135.0:
        return 0
    if 110.0 - _EPS <= a <= 135.0 + _EPS:
        return -1
    if 90.0 - _EPS <= a < 110.0:
        return -2
    if 60.0 - _EPS <= a < 90.0:
        return -3
    if 30.0 - _EPS <= a < 60.0:
        return -4
    if 15.0 - _EPS <= a < 30.0:
        return -5
    return -6