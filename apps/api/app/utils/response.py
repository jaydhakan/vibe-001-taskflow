"""Standardised response envelope helpers."""


def ok(data: object) -> dict:
    """Wrap a successful response in the standard envelope."""
    return {"success": True, "data": data}


def err(msg: str) -> dict:
    """Wrap an error response in the standard envelope."""
    return {"success": False, "error": {"message": msg}}
