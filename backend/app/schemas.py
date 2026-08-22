from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── MenuItem ──────────────────────────────────────────────
class MenuItemCreate(BaseModel):
    name: str
    price: float = Field(gt=0)


class MenuItemOut(BaseModel):
    id: int
    name: str
    price: float

    class Config:
        from_attributes = True


# ── Member ────────────────────────────────────────────────
class MemberCreate(BaseModel):
    name: str
    revolut_link: Optional[str] = None


class MemberOut(BaseModel):
    id: int
    name: str
    join_token: str
    revolut_link: Optional[str] = None

    class Config:
        from_attributes = True


# ── Selection ─────────────────────────────────────────────
class SelectionCreate(BaseModel):
    menu_item_id: int
    quantity: int = Field(default=1, ge=0)


class SelectionOut(BaseModel):
    id: int
    member_id: int
    menu_item_id: int
    quantity: int

    class Config:
        from_attributes = True


# ── Group ─────────────────────────────────────────────────
class GroupCreate(BaseModel):
    name: str
    tip_percentage: float = Field(default=0.0, ge=0, le=100)


class GroupOut(BaseModel):
    id: int
    name: str
    tip_percentage: float
    is_closed: bool
    owner_token: str
    created_at: datetime
    menu_items: List[MenuItemOut] = []
    members: List[MemberOut] = []

    class Config:
        from_attributes = True


class GroupPublic(BaseModel):
    """Stripped-down view for members (no owner token exposed)."""
    id: int
    name: str
    tip_percentage: float
    is_closed: bool
    menu_items: List[MenuItemOut] = []

    class Config:
        from_attributes = True


# ── Summary / bill breakdown ──────────────────────────────
class MemberBill(BaseModel):
    member_id: int
    member_name: str
    subtotal: float
    tip_amount: float
    total: float
    items: List[dict]


class SummaryOut(BaseModel):
    group_name: str
    tip_percentage: float
    grand_total: float
    members: List[MemberBill]

