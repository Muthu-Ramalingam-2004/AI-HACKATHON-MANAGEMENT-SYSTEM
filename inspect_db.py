import sqlite3

def inspect_db(db_path, f):
    f.write(f"=== Inspecting database: {db_path} ===\n")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # List tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        f.write(f"Tables: {tables}\n")
        
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            f.write(f"  Table '{table}' row count: {count}\n")
            
        # Get hackathons
        if "hackathons" in tables:
            cursor.execute("SELECT id, title, status, start_date, end_date FROM hackathons")
            f.write("Hackathons:\n")
            for row in cursor.fetchall():
                f.write(f"  ID: {row[0]}, Title: '{row[1]}', Status: '{row[2]}', Dates: {row[3]} to {row[4]}\n")
                
        # Get teams
        if "teams" in tables:
            cursor.execute("SELECT id, team_name, hackathon_id, leader_id FROM teams")
            f.write("Teams:\n")
            for row in cursor.fetchall():
                f.write(f"  ID: {row[0]}, Name: '{row[1]}', Hackathon ID: {row[2]}, Leader ID: {row[3]}\n")
                
        # Get team members
        if "team_members" in tables:
            cursor.execute("SELECT id, team_id, user_id FROM team_members")
            f.write("Team Members:\n")
            for row in cursor.fetchall():
                f.write(f"  ID: {row[0]}, Team ID: {row[1]}, User ID: {row[2]}\n")
                
        # Get users
        if "users" in tables:
            cursor.execute("SELECT id, name, email, role FROM users")
            f.write("Users:\n")
            for row in cursor.fetchall():
                f.write(f"  ID: {row[0]}, Name: '{row[1]}', Email: '{row[2]}', Role: '{row[3]}'\n")

        # Get submissions
        if "submissions" in tables:
            cursor.execute("SELECT id, team_id, project_title, github_url FROM submissions")
            f.write("Submissions:\n")
            for row in cursor.fetchall():
                f.write(f"  ID: {row[0]}, Team ID: {row[1]}, Title: '{row[2]}', GitHub: '{row[3]}'\n")

        conn.close()
    except Exception as e:
        f.write(f"Error: {e}\n")
    f.write("\n")

with open("db_info.txt", "w", encoding="utf-8") as f:
    inspect_db("hackathon_db.db", f)
    inspect_db("backend/hackathon_db.db", f)

print("Done inspecting database")
