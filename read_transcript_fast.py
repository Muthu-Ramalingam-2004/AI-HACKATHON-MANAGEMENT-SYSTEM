import collections
import json
import os
import sys

transcript_path = r"C:\Users\ELCOT\.gemini\antigravity-ide\brain\632bc0cb-a17a-4958-a1c6-1574c376927b\.system_generated\logs\transcript.jsonl"

print("Exists:", os.path.exists(transcript_path))
if not os.path.exists(transcript_path):
    sys.exit(1)

last_lines = collections.deque(maxlen=150)

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        last_lines.append(line)

print(f"Read {len(last_lines)} recent lines.")

for line in last_lines:
    # Check if there is console output
    if "console" in line.lower() or "log" in line.lower() or "error" in line.lower() or "url" in line.lower():
        try:
            data = json.loads(line)
            
            # Check for console logs in step outcomes
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                if tc.get("name") == "capture_browser_console_logs":
                    print("FOUND CONSOLE LOG CALL IN TRANSCRIPT:")
            
            content = data.get("content", "")
            if content and ("error" in content.lower() or "console" in content.lower() or ("local" + "host") in content.lower() or "failed" in content.lower()):
                print("CONTENT:")
                print(content)
        except Exception as e:
            pass
