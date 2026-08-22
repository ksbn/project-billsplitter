import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter()


def _gen_token() -> str:
    return secrets.token_urlsafe(16)


@router.post("/", response_model=schemas.MemberOut, status_code=201)
def add_member(owner_token: str, payload: schemas.MemberCreate, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.owner_token == owner_token).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if bool(group.is_closed):
        raise HTTPException(status_code=400, detail="Group is closed")

    member = models.Member(
        group_id=group.id,
        name=payload.name,
        revolut_link=payload.revolut_link,
        join_token=_gen_token(),
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.get("/join/{join_token}", response_model=schemas.MemberOut)
def get_member_by_token(join_token: str, db: Session = Depends(get_db)):
    member = db.query(models.Member).filter(models.Member.join_token == join_token).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


@router.get("/{member_id}/selections", response_model=list[schemas.SelectionOut])
def get_member_selections(member_id: int, db: Session = Depends(get_db)):
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member.selections
