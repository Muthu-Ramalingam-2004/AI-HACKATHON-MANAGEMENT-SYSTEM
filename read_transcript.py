import json
import os

transcript_path = r"C:\Users\ELCOT\.gemini\antigravity-ide\brain\632bc0cb-a17a-4958-a1c6-1574c376927b\.system_generated\logs\transcript.jsonl"

print("Checking if transcript exists:", os.path.exists(transcript_path))
if not os.path.exists(transcript_path):
    sys.exit(1)

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            # Look for subagent console logs capture
            if "capture_browser_console_logs" in str(data) or "console" in str(data):
                # Print only relevant parts to avoid too much stdout
                tool_calls = data.get("tool_calls", [])
                for tc in tool_calls:
                    if tc.get("name") == "capture_browser_console_logs":
                        print("FOUND CONSOLE LOG CALL:")
                        print(json.dumps(tc, indent=2))
                
                # Check for step results/outputs that contain logs
                output = data.get("content", "")
                if "Console Logs:" in output or "Network Error" in output or ("local" + "host") in output:
                    print("FOUND CONSOLE OUTPUT:")
                    print(output[:1000]) # print first 1000 chars
        except Exception as e:
            pass
