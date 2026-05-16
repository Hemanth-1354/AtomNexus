import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'backend', 'database.sqlite')
conn = sqlite3.connect(db_path)
print("Check-ins table info:")
cursor = conn.execute('PRAGMA table_info(check_ins)')
for row in cursor:
    print(row)
conn.close()
