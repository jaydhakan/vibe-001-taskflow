"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.tasks import router
from app.utils.response import err

app = FastAPI(title="TaskFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError) -> JSONResponse:
    """Return 400 for title field errors, 422 for all other schema validation failures."""
    for error in exc.errors():
        if "title" in error.get("loc", []):
            return JSONResponse(
                status_code=400,
                content=err(error.get("msg", "Title is invalid")),
            )
    first = exc.errors()[0]
    return JSONResponse(
        status_code=422,
        content=err(first.get("msg", "Validation error")),
    )


app.include_router(router)
