import json
import os
import sys

transcript_path = r"C:\Users\ELCOT\.gemini\antigravity-ide\brain\632bc0cb-a17a-4958-a1c6-1574c376927b\.system_generated\logs\transcript.jsonl"

print("Exists:", os.path.exists(transcript_path))
if not os.path.exists(transcript_path):
    sys.exit(1)

with open(transcript_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
# Check the last 150 lines
for line in lines[-150:]:
    if "console" in line.lower() or "log" in line.lower() or "error" in line.lower() or "url" in line.lower():
        try:
            data = json.loads(line)
            content = data.get("content", "")
            if content and ("error" in content.lower() or "console" in content.lower() or "localhost" in content.lower() or "failed" in content.lower()):
                print("CONTENT:")
                print(content)
        except Exception:
            pass
