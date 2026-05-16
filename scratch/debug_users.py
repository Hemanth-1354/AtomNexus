import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'backend', 'database.sqlite')
print(f"Checking database at: {db_path}")

if not os.path.exists(db_path):
    print("Database file does not exist!")
else:
    conn = sqlite3.connect(db_path)
    try:
        cursor = conn.execute('SELECT id, name, email, role FROM users')
        print("Users in database:")
        for row in cursor:
            print(row)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
