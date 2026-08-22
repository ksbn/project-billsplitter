from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter()


@router.post("/", response_model=schemas.SelectionOut, status_code=201)
def upsert_selection(
    join_token: str,
    payload: schemas.SelectionCreate,
    db: Session = Depends(get_db),
):
    member = db.query(models.Member).filter(models.Member.join_token == join_token).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.group.is_closed:
        raise HTTPException(status_code=400, detail="Group is closed")

    # Validate the menu item belongs to the same group
    menu_item = db.query(models.MenuItem).filter(
        models.MenuItem.id == payload.menu_item_id,
        models.MenuItem.group_id == member.group_id,
    ).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found in this group")

    existing = db.query(models.Selection).filter(
        models.Selection.member_id == member.id,
        models.Selection.menu_item_id == payload.menu_item_id,
    ).first()

    if existing:
        if payload.quantity == 0:
            db.delete(existing)
            db.commit()
            return schemas.SelectionOut(
                id=existing.id,
                member_id=member.id,
                menu_item_id=payload.menu_item_id,
                quantity=0,
            )
        existing.quantity = payload.quantity
        db.commit()
        db.refresh(existing)
        return existing
    else:
        if payload.quantity == 0:
            raise HTTPException(status_code=400, detail="Nothing to remove")
        sel = models.Selection(
            member_id=member.id,
            menu_item_id=payload.menu_item_id,
            quantity=payload.quantity,
        )
        db.add(sel)
        db.commit()
        db.refresh(sel)
        return sel


@router.get("/member/{join_token}", response_model=list[schemas.SelectionOut])
def get_my_selections(join_token: str, db: Session = Depends(get_db)):
    member = db.query(models.Member).filter(models.Member.join_token == join_token).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member.selections
