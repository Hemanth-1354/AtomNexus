from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from passlib.context import CryptContext
import jwt
import os
import datetime
import bcrypt

import models
from database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "hackathon123"
ALGORITHM = "HS256"

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Seed database
def seed_db():
    db = SessionLocal()
    if not db.query(models.User).first():
        hashed_password = get_password_hash("password123")
        admin = models.User(name="Admin User", email="admin@atomquest.com", password=hashed_password, role="Admin", department="HR")
        db.add(admin)
        db.commit()

        manager = models.User(name="Manager One", email="manager1@atomquest.com", password=hashed_password, role="Manager", department="Engineering")
        db.add(manager)
        db.commit()

        emp1 = models.User(name="Emp One", email="emp1@atomquest.com", password=hashed_password, role="Employee", manager_id=manager.id, department="Engineering")
        emp2 = models.User(name="Emp Two", email="emp2@atomquest.com", password=hashed_password, role="Employee", manager_id=manager.id, department="Engineering")
        db.add_all([emp1, emp2])
        db.commit()
    db.close()

seed_db()

# Schemas
class LoginReq(BaseModel):
    email: str
    password: str

class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    thrust_area: str
    uom_type: str
    target: str
    weightage: int

class GoalsBulkCreate(BaseModel):
    goals: List[GoalCreate]

class GoalUpdate(BaseModel):
    status: Optional[str] = None
    target: Optional[str] = None
    weightage: Optional[int] = None

class CheckInReq(BaseModel):
    goal_id: int
    quarter: str
    actual_achievement: Optional[str] = None
    progress_status: Optional[str] = None
    check_in_comment: Optional[str] = None
    manager_comment: Optional[str] = None

# Auth middleware / Dependency
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=403, detail="Could not validate credentials")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.post("/api/auth/login")
def login(req: LoginReq, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not verify_password(req.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = jwt.encode(
        {"id": user.id, "role": user.role, "name": user.name, "manager_id": user.manager_id, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)}, 
        SECRET_KEY, 
        algorithm=ALGORITHM
    )
    return {"token": token, "user": {"id": user.id, "name": user.name, "role": user.role, "email": user.email}}

@app.get("/api/goals")
def get_goals(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == 'Employee':
        goals = db.query(models.Goal).filter(models.Goal.user_id == current_user.id).all()
        # Add employee_name for frontend compatibility, though not needed for Employee
        for g in goals:
            g.__dict__['employee_name'] = current_user.name
        return goals
    elif current_user.role == 'Manager':
        employees = db.query(models.User).filter(models.User.manager_id == current_user.id).all()
        emp_ids = [e.id for e in employees]
        emp_map = {e.id: e.name for e in employees}
        goals = db.query(models.Goal).filter(models.Goal.user_id.in_(emp_ids)).all()
        result = []
        for g in goals:
            g_dict = {c.name: getattr(g, c.name) for c in g.__table__.columns}
            g_dict['employee_name'] = emp_map.get(g.user_id, '')
            result.append(g_dict)
        return result
    else:
        goals = db.query(models.Goal).all()
        users = db.query(models.User).all()
        emp_map = {u.id: u.name for u in users}
        result = []
        for g in goals:
            g_dict = {c.name: getattr(g, c.name) for c in g.__table__.columns}
            g_dict['employee_name'] = emp_map.get(g.user_id, '')
            result.append(g_dict)
        return result

@app.post("/api/goals")
def create_goals(req: GoalsBulkCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'Employee':
        raise HTTPException(status_code=403, detail="Only employees can create goals")
    
    if len(req.goals) > 8:
        raise HTTPException(status_code=400, detail="Maximum 8 goals allowed")
    
    total_weightage = sum([g.weightage for g in req.goals])
    if total_weightage != 100:
        raise HTTPException(status_code=400, detail="Total weightage must equal 100%")
    
    for g in req.goals:
        if g.weightage < 10:
            raise HTTPException(status_code=400, detail="Minimum 10% weightage per goal required")
    
    for g in req.goals:
        new_goal = models.Goal(
            user_id=current_user.id,
            title=g.title,
            description=g.description,
            thrust_area=g.thrust_area,
            uom_type=g.uom_type,
            target=g.target,
            weightage=g.weightage,
            status='Pending_Approval'
        )
        db.add(new_goal)
    db.commit()
    return {"message": "Goals submitted successfully"}

@app.put("/api/goals/{id}")
def update_goal(id: int, req: GoalUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ['Manager', 'Admin']:
        raise HTTPException(status_code=403, detail="Not authorized to edit goals directly")
    
    goal = db.query(models.Goal).filter(models.Goal.id == id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if req.status:
        goal.status = req.status
        if req.status == 'Approved':
            goal.is_locked = True
    if req.target is not None:
        goal.target = req.target
    if req.weightage is not None:
        goal.weightage = req.weightage
        
    db.commit()
    return {"success": True}

@app.get("/api/check-ins/{goal_id}")
def get_check_ins(goal_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_ins = db.query(models.CheckIn).filter(models.CheckIn.goal_id == goal_id).all()
    return check_ins

@app.post("/api/check-ins")
def save_check_in(req: CheckInReq, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ci = db.query(models.CheckIn).filter(models.CheckIn.goal_id == req.goal_id, models.CheckIn.quarter == req.quarter).first()
    
    if ci:
        if req.actual_achievement is not None: ci.actual_achievement = req.actual_achievement
        if req.progress_status is not None: ci.progress_status = req.progress_status
        if req.check_in_comment is not None: ci.check_in_comment = req.check_in_comment
        if req.manager_comment is not None: ci.manager_comment = req.manager_comment
    else:
        ci = models.CheckIn(
            goal_id=req.goal_id,
            quarter=req.quarter,
            actual_achievement=req.actual_achievement,
            progress_status=req.progress_status,
            check_in_comment=req.check_in_comment,
            manager_comment=req.manager_comment
        )
        db.add(ci)
    
    db.commit()
    db.refresh(ci)
    return {"success": True, "id": ci.id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
