from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String) # 'Employee', 'Manager', 'Admin'
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    department = Column(String)

    goals = relationship("Goal", back_populates="owner", foreign_keys="[Goal.user_id]")

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    description = Column(String)
    thrust_area = Column(String)
    uom_type = Column(String)
    target = Column(String)
    weightage = Column(Integer)
    is_shared = Column(Boolean, default=False)
    status = Column(String, default="Draft") # 'Draft', 'Pending_Approval', 'Approved', 'Returned'
    is_locked = Column(Boolean, default=False)

    owner = relationship("User", back_populates="goals", foreign_keys=[user_id])
    check_ins = relationship("CheckIn", back_populates="goal")

class CheckIn(Base):
    __tablename__ = "check_ins"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"))
    quarter = Column(String) # 'Q1', 'Q2', 'Q3', 'Q4'
    actual_achievement = Column(String, nullable=True)
    progress_status = Column(String, nullable=True) # 'Not Started', 'On Track', 'Completed'
    check_in_comment = Column(String, nullable=True)
    manager_comment = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    goal = relationship("Goal", back_populates="check_ins")
