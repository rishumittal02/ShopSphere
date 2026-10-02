import logging

from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError


logger = logging.getLogger(__name__)


def _get_cors_headers(request: Request) -> dict[str, str]:
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "*"
        headers["Access-Control-Allow-Headers"] = "*"
    return headers


async def integrity_exception_handler(
    request: Request,
    exc: IntegrityError
):
    logger.warning(
        "Database integrity error | %s %s: %s",
        request.method,
        request.url.path,
        str(exc)
    )

    return JSONResponse(
        status_code=400,
        content={
            "detail": "Cannot complete action because this item is referenced by existing database records (such as orders or carts)."
        },
        headers=_get_cors_headers(request)
    )


async def global_exception_handler(
    request: Request,
    exc: Exception
):
    logger.exception(
        "Unhandled exception | %s %s: %s",
        request.method,
        request.url.path,
        str(exc)
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error. Please try again later."
        },
        headers=_get_cors_headers(request)
    )