from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from passlib.context import CryptContext
import jwt
import os
import datetime
import bcrypt
import io
import csv

from database import engine, SessionLocal, Base
import models

# Ensure all models are imported before calling create_all
from models import User, Goal, CheckIn, AuditLog

Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TODO: WARNING: Change this secret key in production!
SECRET_KEY = os.environ.get("JWT_SECRET", "hackathon123")
ALGORITHM = "HS256"

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_current_quarter() -> str:
    """Returns the active check-in quarter based on BRD schedule."""
    month = datetime.datetime.now().month
    # BRD: Q1 (July), Q2 (Oct), Q3 (Jan), Q4 (Mar/Apr), Phase 1 (May)
    if month == 7: return 'Q1'
    if month == 10: return 'Q2'
    if month == 1: return 'Q3'
    if month in [3, 4]: return 'Q4'
    return 'GoalSetting' # Default for Phase 1 or closed periods

def is_checkin_window_open(quarter: str) -> bool:
    # current_q = get_current_quarter()
    # During 'GoalSetting' phase (May), check-ins are closed in real business rules.
    # For hackathon/demo purposes, we allow all check-ins.
    return True

def compute_progress_score(target: str, actual: str, uom_type: str) -> float:
    try:
        uom = uom_type.lower()
        
        # BRD: Timeline - Completion date vs. Deadline
        if 'timeline' in uom or 'date' in uom:
            try:
                t_date = datetime.datetime.strptime(target, "%Y-%m-%d")
                a_date = datetime.datetime.strptime(actual, "%Y-%m-%d")
                return 100.0 if a_date <= t_date else 0.0
            except:
                return 100.0 if actual <= target else 0.0
                
        # BRD: Zero - If 0 -> 100%, else 0%
        if 'zero' in uom:
            try:
                a_val = float(actual)
                return 100.0 if a_val == 0 else 0.0
            except:
                return 0.0

        t_val = float(target)
        a_val = float(actual)
        
        # BRD: Max (Numeric / %) - Lower is better
        if 'max' in uom or 'lower' in uom:
            return min(100.0, (t_val / a_val) * 100.0) if a_val != 0 else 0.0
        
        # BRD: Min (Numeric / %) - Higher is better
        else:
            return min(100.0, (a_val / t_val) * 100.0) if t_val != 0 else 0.0
            
    except (ValueError, TypeError):
        return 0.0

def send_email_notification(to_email: str, subject: str, body: str):
    # Mocking email delivery for hackathon
    print(f"--- EMAIL TO: {to_email} ---")
    print(f"SUBJECT: {subject}")
    print(f"BODY: {body}")
    print("----------------------------")

def send_teams_notification(manager_name: str, employee_name: str, goal_count: int):
    # Mocking Teams Adaptive Card
    print(f"--- TEAMS NOTIFICATION TO: {manager_name} ---")
    print(f"CARD: {employee_name} has submitted {goal_count} goals for your approval.")
    print(f"ACTION: [Review Goals](http://localhost:5173/goals)")
    print("------------------------------------------")

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

class SharedGoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    thrust_area: str
    uom_type: str
    target: str
    weightage: int
    employee_ids: List[int]

class EmployeeGoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thrust_area: Optional[str] = None
    uom_type: Optional[str] = None
    target: Optional[str] = None
    weightage: Optional[int] = None
    status: Optional[str] = None

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
    
    existing_goals = db.query(models.Goal).filter(models.Goal.user_id == current_user.id).all()
    existing_count = len(existing_goals)
    existing_weightage = sum([g.weightage for g in existing_goals])
    
    new_count = len(req.goals)
    new_weightage = sum([g.weightage for g in req.goals])

    if existing_count + new_count > 8:
        raise HTTPException(status_code=400, detail=f"Maximum 8 goals allowed. You have {existing_count} existing and are adding {new_count}.")
    
    if existing_weightage + new_weightage != 100:
        raise HTTPException(status_code=400, detail=f"Total weightage must equal 100%. Current total: {existing_weightage + new_weightage}%")
    
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
    
    send_email_notification("manager@atomquest.com", "New Goals Submitted", f"{current_user.name} submitted {len(req.goals)} new goals for approval.")
    send_teams_notification("Manager One", current_user.name, len(req.goals))
    return {"message": "Goals submitted successfully"}

@app.put("/api/goals/{id}")
def update_goal(id: int, req: GoalUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ['Manager', 'Admin']:
        raise HTTPException(status_code=403, detail="Not authorized to edit goals directly")
    
    goal = db.query(models.Goal).filter(models.Goal.id == id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # BRD: On approval, goals are locked — no further edits without Admin intervention
    if goal.is_locked and current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail="This goal is locked and can only be edited by an Admin.")
    
    def log_audit(action, old_val, new_val):
        if goal.is_locked:
            audit = models.AuditLog(
                goal_id=goal.id, user_id=current_user.id,
                action=action, old_value=str(old_val), new_value=str(new_val)
            )
            db.add(audit)

    if req.status and req.status != goal.status:
        log_audit("Status Change", goal.status, req.status)
        goal.status = req.status
        if req.status == 'Approved':
            goal.is_locked = True
            user = db.query(models.User).filter(models.User.id == goal.user_id).first()
            if user:
                send_email_notification(user.email, "Goal Approved", f"Your goal '{goal.title}' has been approved.")
    if req.target is not None and req.target != goal.target:
        log_audit("Update Target", goal.target, req.target)
        goal.target = req.target
    if req.weightage is not None and req.weightage != goal.weightage:
        log_audit("Update Weightage", goal.weightage, req.weightage)
        goal.weightage = req.weightage
        
    db.commit()
    return {"success": True}

@app.get("/api/check-ins/{goal_id}")
def get_check_ins(goal_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_ins = db.query(models.CheckIn).filter(models.CheckIn.goal_id == goal_id).all()
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    
    result = []
    for ci in check_ins:
        ci_dict = {c.name: getattr(ci, c.name) for c in ci.__table__.columns}
        if ci.actual_achievement and goal:
            ci_dict['computed_score'] = compute_progress_score(goal.target, ci.actual_achievement, goal.uom_type)
        else:
            ci_dict['computed_score'] = 0.0
        result.append(ci_dict)
    return result

@app.post("/api/check-ins")
def save_check_in(req: CheckInReq, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not is_checkin_window_open(req.quarter):
        raise HTTPException(status_code=400, detail=f"Check-in window for {req.quarter} is currently closed.")
        
    goal = db.query(models.Goal).filter(models.Goal.id == req.goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

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
    
    # BRD: Achievement updates by the primary owner sync across all linked goal sheets
    if goal.parent_shared_goal_id and goal.id == goal.parent_shared_goal_id:
        linked_goals = db.query(models.Goal).filter(models.Goal.parent_shared_goal_id == goal.parent_shared_goal_id).all()
        for lg in linked_goals:
            if lg.id == goal.id: continue
            linked_ci = db.query(models.CheckIn).filter(models.CheckIn.goal_id == lg.id, models.CheckIn.quarter == req.quarter).first()
            if linked_ci:
                if req.actual_achievement is not None: linked_ci.actual_achievement = req.actual_achievement
                if req.progress_status is not None: linked_ci.progress_status = req.progress_status
            else:
                linked_ci = models.CheckIn(
                    goal_id=lg.id, quarter=req.quarter,
                    actual_achievement=req.actual_achievement,
                    progress_status=req.progress_status
                )
                db.add(linked_ci)
        db.commit()

    return {"success": True, "id": ci.id}

@app.post("/api/goals/shared")
def create_shared_goal(req: SharedGoalCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ['Admin', 'Manager']:
        raise HTTPException(status_code=403, detail="Only Admins and Managers can create shared goals")
    
    first_goal = None
    for idx, emp_id in enumerate(req.employee_ids):
        new_goal = models.Goal(
            user_id=emp_id,
            title=req.title,
            description=req.description,
            thrust_area=req.thrust_area,
            uom_type=req.uom_type,
            target=req.target,
            weightage=req.weightage,
            is_shared=True,
            status='Pending_Approval'
        )
        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)
        
        if idx == 0:
            first_goal = new_goal
            new_goal.parent_shared_goal_id = new_goal.id
        else:
            new_goal.parent_shared_goal_id = first_goal.id
        db.commit()
        
    return {"message": "Shared goals distributed successfully"}

@app.put("/api/employee/goals/{id}")
def employee_update_goal(id: int, req: EmployeeGoalUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'Employee':
        raise HTTPException(status_code=403, detail="Only employees can use this endpoint")
    
    goal = db.query(models.Goal).filter(models.Goal.id == id, models.Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if goal.status not in ['Draft', 'Returned']:
        raise HTTPException(status_code=400, detail="Can only edit Draft or Returned goals")
    
    if goal.is_shared:
        if req.title or req.description or req.target or req.thrust_area or req.uom_type:
            raise HTTPException(status_code=400, detail="Cannot edit core fields of a shared goal")
        if req.weightage is not None:
            goal.weightage = req.weightage
        if req.status:
            goal.status = req.status
    else:
        if req.title: goal.title = req.title
        if req.description: goal.description = req.description
        if req.thrust_area: goal.thrust_area = req.thrust_area
        if req.uom_type: goal.uom_type = req.uom_type
        if req.target: goal.target = req.target
        if req.weightage is not None: goal.weightage = req.weightage
        if req.status: goal.status = req.status
        
    db.commit()
    return {"success": True}

@app.get("/api/reports/achievement")
def export_achievement_report(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ['Admin', 'Manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    goals = db.query(models.Goal).all()
    if current_user.role == 'Manager':
        employees = db.query(models.User).filter(models.User.manager_id == current_user.id).all()
        emp_ids = [e.id for e in employees]
        goals = db.query(models.Goal).filter(models.Goal.user_id.in_(emp_ids)).all()
        
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Goal ID", "Employee ID", "Title", "Thrust Area", "UOM Type", "Target", "Weightage", "Status", "Latest Achievement", "Progress Score"])
    
    for g in goals:
        latest_check_in = db.query(models.CheckIn).filter(models.CheckIn.goal_id == g.id).order_by(models.CheckIn.id.desc()).first()
        actual = latest_check_in.actual_achievement if latest_check_in else ""
        score = compute_progress_score(g.target, actual, g.uom_type) if actual else 0.0
        writer.writerow([g.id, g.user_id, g.title, g.thrust_area, g.uom_type, g.target, g.weightage, g.status, actual, score])
        
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=achievement_report.csv"})

@app.get("/api/reports/completion")
def get_completion_dashboard(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ['Admin', 'Manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users_query = db.query(models.User).filter(models.User.role == 'Employee')
    if current_user.role == 'Manager':
        users_query = users_query.filter(models.User.manager_id == current_user.id)
    
    employees = users_query.all()
    stats = []
    
    for emp in employees:
        goals = db.query(models.Goal).filter(models.Goal.user_id == emp.id).all()
        total_goals = len(goals)
        if total_goals == 0:
            stats.append({"employee_id": emp.id, "employee_name": emp.name, "status": "No Goals Set"})
            continue
            
        locked_goals = sum(1 for g in goals if g.is_locked)
        if locked_goals < total_goals:
            stats.append({"employee_id": emp.id, "employee_name": emp.name, "status": "Goals Not Approved"})
            continue
            
        current_q = get_current_quarter()
        check_ins = db.query(models.CheckIn).join(models.Goal).filter(models.Goal.user_id == emp.id, models.CheckIn.quarter == current_q).all()
        
        if len(check_ins) < total_goals:
            stats.append({"employee_id": emp.id, "employee_name": emp.name, "status": "Check-in Pending"})
        else:
            stats.append({"employee_id": emp.id, "employee_name": emp.name, "status": "Check-in Completed"})
            
    summary = {
        "total_employees": len(stats),
        "no_goals": sum(1 for s in stats if s['status'] == 'No Goals Set'),
        "goals_not_approved": sum(1 for s in stats if s['status'] == 'Goals Not Approved'),
        "checkin_pending": sum(1 for s in stats if s['status'] == 'Check-in Pending'),
        "checkin_completed": sum(1 for s in stats if s['status'] == 'Check-in Completed'),
        "details": stats
    }
    return summary

@app.get("/api/users")
def get_users(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail="Only Admins can view all users")
    return db.query(models.User).all()

@app.get("/api/audit-logs")
def get_audit_logs(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail="Only Admins can view audit logs")
    return db.query(models.AuditLog).all()

@app.get("/api/analytics/summary")
def get_analytics_summary(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ['Admin', 'Manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Manager Effectiveness
    managers = db.query(models.User).filter(models.User.role == 'Manager').all()
    manager_stats = []
    for m in managers:
        employees = db.query(models.User).filter(models.User.manager_id == m.id).all()
        emp_ids = [e.id for e in employees]
        total_goals = db.query(models.Goal).filter(models.Goal.user_id.in_(emp_ids)).count()
        approved_goals = db.query(models.Goal).filter(models.Goal.user_id.in_(emp_ids), models.Goal.status == 'Approved').count()
        
        completion_rate = (approved_goals / total_goals * 100) if total_goals > 0 else 0
        manager_stats.append({"name": m.name, "completion": round(completion_rate, 1)})

    # Thrust Area Distribution
    all_goals = db.query(models.Goal).all()
    thrust_dist = {}
    for g in all_goals:
        thrust_dist[g.thrust_area] = thrust_dist.get(g.thrust_area, 0) + 1

    # Departmental Stats
    departments = db.query(models.User.department).distinct().all()
    dept_stats = []
    for (dept,) in departments:
        if not dept: continue
        dept_users = db.query(models.User).filter(models.User.department == dept, models.User.role == 'Employee').all()
        if not dept_users: continue
        
        emp_ids = [u.id for u in dept_users]
        total_dept_goals = db.query(models.Goal).filter(models.Goal.user_id.in_(emp_ids)).count()
        if total_dept_goals == 0:
            rate = 0
        else:
            # Simple completion rate: Approved goals vs total goals
            approved_dept_goals = db.query(models.Goal).filter(models.Goal.user_id.in_(emp_ids), models.Goal.status == 'Approved').count()
            rate = round((approved_dept_goals / total_dept_goals) * 100)
        
        dept_stats.append({"dept": dept, "rate": rate})

    return {
        "total_goals": len(all_goals),
        "thrust_area_distribution": thrust_dist,
        "manager_effectiveness": manager_stats,
        "departmental_stats": dept_stats
    }

@app.get("/api/admin/escalations")
def get_escalations(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail="Only Admins can view escalations")
    
    employees = db.query(models.User).filter(models.User.role == 'Employee').all()
    escalations = []
    
    # Rule 1: Employees with zero goals submitted
    for emp in employees:
        goal_count = db.query(models.Goal).filter(models.Goal.user_id == emp.id).count()
        if goal_count == 0:
            escalations.append({"user_id": emp.id, "name": emp.name, "issue": "Zero Goals Submitted", "severity": "High"})
            
    # Rule 2: Managers with Pending Approvals (Rule: Flag if goal is still 'Pending' after submission)
    pending_goals = db.query(models.Goal).filter(models.Goal.status == 'Pending_Approval').all()
    for g in pending_goals:
        user = db.query(models.User).filter(models.User.id == g.user_id).first()
        manager_name = "Unknown Manager"
        if user and user.manager_id:
            manager = db.query(models.User).filter(models.User.id == user.manager_id).first()
            if manager: manager_name = manager.name
            
        escalations.append({
            "goal_id": g.id, 
            "user_id": g.user_id, 
            "employee_name": user.name if user else "Unknown",
            "manager_name": manager_name,
            "issue": f"Approval Delayed", 
            "severity": "Medium"
        })
        
    return {"escalations": escalations}

@app.post("/api/admin/escalate/{user_id}")
def trigger_manual_escalation(user_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail="Only Admins can trigger manual escalations")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Mocking the escalation event
    print(f"!!! MANUAL ESCALATION TRIGGERED FOR {user.name} by {current_user.name} !!!")
    return {"message": f"Escalation notification sent for {user.name}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
