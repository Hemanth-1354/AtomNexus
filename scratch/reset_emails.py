import sys
import os
sys.path.append(os.getcwd())
from database import SessionLocal
import models

db = SessionLocal()

# Delete existing goals to avoid FK issues if needed, or just update users
# Actually, I'll just find users by role and update them
admin = db.query(models.User).filter(models.User.role == "Admin").first()
if admin: admin.email = "temporarymailhk@gmail.com"

manager = db.query(models.User).filter(models.User.role == "Manager").first()
if manager: manager.email = "gunturkaaram279@gmail.com"

# The seeding script added many employees. I'll just fix 'Emp One'
emp1 = db.query(models.User).filter(models.User.name == "Emp One").first()
if emp1: emp1.email = "vikramnani69@gmail.com"

# For other seeded employees, I'll give them unique dummy emails back
other_emps = db.query(models.User).filter(models.User.role == "Employee", models.User.name != "Emp One").all()
for i, emp in enumerate(other_emps):
    emp.email = f"emp{i}@atomquest.com"

db.commit()
print("Emails successfully reset to original values.")
db.close()
