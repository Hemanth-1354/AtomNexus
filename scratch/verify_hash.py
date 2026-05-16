import sqlite3
import os
import bcrypt

db_path = os.path.join(os.getcwd(), 'backend', 'database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.execute('SELECT email, password FROM users')
for email, hashed in cursor:
    print(f"Email: {email}")
    print(f"Hashed: {hashed}")
    # Try to verify
    try:
        is_correct = bcrypt.checkpw("password123".encode('utf-8'), hashed.encode('utf-8'))
        print(f"Verify 'password123': {is_correct}")
    except Exception as e:
        print(f"Error verifying: {e}")
conn.close()
