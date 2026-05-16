import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'backend', 'database.sqlite')
conn = sqlite3.connect(db_path)
print("Users table info:")
cursor = conn.execute('PRAGMA table_info(users)')
for row in cursor:
    print(row)

print("\nGoals table info:")
cursor = conn.execute('PRAGMA table_info(goals)')
for row in cursor:
    print(row)
conn.close()
