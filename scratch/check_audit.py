import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'backend', 'database.sqlite')
conn = sqlite3.connect(db_path)
print("Audit logs table info:")
cursor = conn.execute('PRAGMA table_info(audit_logs)')
for row in cursor:
    print(row)
conn.close()
