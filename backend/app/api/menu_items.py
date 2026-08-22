from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter()


@router.post("/", response_model=schemas.MenuItemOut, status_code=201)
def add_menu_item(owner_token: str, payload: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.owner_token == owner_token).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.is_closed:
        raise HTTPException(status_code=400, detail="Group is closed")

    item = models.MenuItem(group_id=group.id, name=payload.name, price=payload.price)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_menu_item(item_id: int, owner_token: str, db: Session = Depends(get_db)):
    item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.group.owner_token != owner_token:
        raise HTTPException(status_code=403, detail="Forbidden")
    db.delete(item)
    db.commit()
