import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter()


def _gen_token(n: int = 24) -> str:
    return secrets.token_urlsafe(n)


@router.post("/", response_model=schemas.GroupOut, status_code=201)
def create_group(payload: schemas.GroupCreate, db: Session = Depends(get_db)):
    group = models.Group(
        name=payload.name,
        tip_percentage=payload.tip_percentage,
        owner_token=_gen_token(),
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.get("/owner/{owner_token}", response_model=schemas.GroupOut)
def get_group_by_owner(owner_token: str, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.owner_token == owner_token).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.get("/join/{join_token}", response_model=schemas.GroupPublic)
def get_group_by_member_token(join_token: str, db: Session = Depends(get_db)):
    member = db.query(models.Member).filter(models.Member.join_token == join_token).first()
    if not member:
        raise HTTPException(status_code=404, detail="Invalid join token")
    return member.group


@router.patch("/owner/{owner_token}/tip", response_model=schemas.GroupOut)
def update_tip(owner_token: str, tip_percentage: float, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.owner_token == owner_token).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if not (0 <= tip_percentage <= 100):
        raise HTTPException(status_code=422, detail="Tip must be 0–100")
    group.tip_percentage = tip_percentage
    db.commit()
    db.refresh(group)
    return group


@router.patch("/owner/{owner_token}/close", response_model=schemas.GroupOut)
def close_group(owner_token: str, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.owner_token == owner_token).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    group.is_closed = True
    db.commit()
    db.refresh(group)
    return group


@router.get("/owner/{owner_token}/summary", response_model=schemas.SummaryOut)
def get_summary(owner_token: str, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.owner_token == owner_token).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    tip_rate = group.tip_percentage / 100
    member_bills = []

    for member in group.members:
        items_detail = []
        subtotal = 0.0
        for sel in member.selections:
            if sel.quantity > 0:
                line = sel.menu_item.price * sel.quantity
                subtotal += line
                items_detail.append({
                    "name": sel.menu_item.name,
                    "unit_price": sel.menu_item.price,
                    "quantity": sel.quantity,
                    "line_total": line,
                })
        tip_amount = round(subtotal * tip_rate, 2)
        member_bills.append(schemas.MemberBill(
            member_id=member.id,
            member_name=member.name,
            subtotal=round(subtotal, 2),
            tip_amount=tip_amount,
            total=round(subtotal + tip_amount, 2),
            items=items_detail,
        ))

    grand_total = sum(b.total for b in member_bills)
    return schemas.SummaryOut(
        group_name=group.name,
        tip_percentage=group.tip_percentage,
        grand_total=round(grand_total, 2),
        members=member_bills,
    )
