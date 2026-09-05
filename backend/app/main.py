import os
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import groups, members, menu_items, selections

Base.metadata.create_all(bind=engine)

app = FastAPI(title="BillSplitter API", version="1.0.0")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

FRONTEND_URL = os.getenv("https://vercel.com/ksbns-projects/project-billsplitter/wbQkk4a7cms5ee5jM8chRghyPqfN")
if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL.rstrip("/"))

allow_all = os.getenv("ENVIRONMENT") != "production"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(groups.router, prefix="/api/groups", tags=["groups"])
app.include_router(members.router, prefix="/api/members", tags=["members"])
app.include_router(menu_items.router, prefix="/api/menu-items", tags=["menu-items"])
app.include_router(selections.router, prefix="/api/selections", tags=["selections"])


@app.get("/")
def read_root():
    return {"message": "Welcome to BillSplitter API", "docs": "/docs"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)
