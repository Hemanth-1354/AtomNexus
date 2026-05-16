import sqlite3
conn = sqlite3.connect('c:/Users/heman/Desktop/AtomQuest/backend/database.sqlite')
cursor = conn.execute('PRAGMA table_info(goals)')
for row in cursor:
    print(row)
conn.close()
