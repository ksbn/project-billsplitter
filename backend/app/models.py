from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tip_percentage = Column(Float, default=0.0)
    is_closed = Column(Boolean, default=False)
    owner_token = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    menu_items = relationship("MenuItem", back_populates="group", cascade="all, delete-orphan")
    members = relationship("Member", back_populates="group", cascade="all, delete-orphan")


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)

    group = relationship("Group", back_populates="menu_items")
    selections = relationship("Selection", back_populates="menu_item", cascade="all, delete-orphan")


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    name = Column(String, nullable=False)
    revolut_link = Column(String, nullable=True)
    join_token = Column(String, unique=True, nullable=False, index=True)

    group = relationship("Group", back_populates="members")
    selections = relationship("Selection", back_populates="member", cascade="all, delete-orphan")


class Selection(Base):
    __tablename__ = "selections"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    quantity = Column(Integer, default=1)

    member = relationship("Member", back_populates="selections")
    menu_item = relationship("MenuItem", back_populates="selections")
