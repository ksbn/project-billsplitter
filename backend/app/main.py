from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import groups, members, menu_items, selections

Base.metadata.create_all(bind=engine)

app = FastAPI(title="BillSplitter API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(groups.router, prefix="/api/groups", tags=["groups"])
app.include_router(members.router, prefix="/api/members", tags=["members"])
app.include_router(menu_items.router, prefix="/api/menu-items", tags=["menu-items"])
app.include_router(selections.router, prefix="/api/selections", tags=["selections"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
