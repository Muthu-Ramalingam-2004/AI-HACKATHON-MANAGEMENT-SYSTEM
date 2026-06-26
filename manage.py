import os
import sys
import time
import json
import subprocess
import urllib.request

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
LOGS_DIR = os.path.join(ROOT_DIR, "logs")
STATE_FILE = os.path.join(LOGS_DIR, "daemon.state")
DAEMON_LOG = os.path.join(LOGS_DIR, "daemon.log")
BACKEND_LOG = os.path.join(LOGS_DIR, "backend.log")
FRONTEND_LOG = os.path.join(LOGS_DIR, "frontend.log")

PYTHON_EXE = os.path.join(ROOT_DIR, "venv", "Scripts", "python.exe")
PYTHONW_EXE = os.path.join(ROOT_DIR, "venv", "Scripts", "pythonw.exe")

CREATE_NO_WINDOW = 0x08000000

def log(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] {msg}"
    try:
        print(formatted)
    except Exception:
        pass
    try:
        os.makedirs(LOGS_DIR, exist_ok=True)
        with open(DAEMON_LOG, "a", encoding="utf-8") as f:
            f.write(formatted + "\n")
    except Exception:
        pass

def check_port_listening(port):
    try:
        output = subprocess.check_output(
            f'netstat -aon | findstr LISTENING | findstr :{port}',
            shell=True,
            text=True
        )
        return len(output.strip()) > 0
    except Exception:
        return False

def kill_processes_on_ports():
    ports = [8000, 5173]
    for port in ports:
        try:
            output = subprocess.check_output(
                f'netstat -aon | findstr LISTENING | findstr :{port}',
                shell=True,
                text=True
            )
            pids = set()
            for line in output.strip().split('\n'):
                parts = line.split()
                if len(parts) >= 5:
                    pid = parts[-1]
                    try:
                        pids.add(int(pid))
                    except ValueError:
                        pass
            for pid in pids:
                log(f"Cleaning up zombie process PID {pid} on port {port}...")
                subprocess.run(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except subprocess.CalledProcessError:
            pass  # findstr exit code 1 when no matches, completely normal
        except Exception as e:
            log(f"Error checking/killing processes on port {port}: {e}")

def get_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_state(state):
    try:
        os.makedirs(LOGS_DIR, exist_ok=True)
        with open(STATE_FILE, "w") as f:
            json.dump(state, f, indent=4)
    except Exception as e:
        log(f"Error saving state: {e}")

def delete_state():
    if os.path.exists(STATE_FILE):
        try:
            os.remove(STATE_FILE)
        except Exception:
            pass

def check_backend_health():
    # Disable proxies to prevent issues on systems with active developer/corporate proxies
    proxy_handler = urllib.request.ProxyHandler({})
    opener = urllib.request.build_opener(proxy_handler)
    urllib.request.install_opener(opener)
    
    loopback = ".".join(["127", "0", "0", "1"])
    url = f"http://{loopback}:8000/api/v1/health"
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                res_body = json.loads(response.read().decode("utf-8"))
                if res_body.get("status") == "healthy":
                    return True
    except Exception:
        pass
    return False

def terminate_process_tree(pid):
    if not pid:
        return
    try:
        # Use taskkill to kill the process and all its children
        subprocess.run(f"taskkill /F /T /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
        log(f"Error terminating PID {pid}: {e}")

def run_daemon():
    # Ensure logs directory exists
    os.makedirs(LOGS_DIR, exist_ok=True)
    
    # Check if daemon is already running
    state = get_state()
    if state:
        daemon_pid = state.get("daemon_pid")
        if daemon_pid:
            # Check if that PID is actually running
            try:
                out = subprocess.check_output(f'tasklist /FI "PID eq {daemon_pid}"', shell=True, text=True)
                if str(daemon_pid) in out:
                    log("Daemon is already running.")
                    return
            except Exception:
                pass
    
    # Save daemon PID
    current_pid = os.getpid()
    state = {"daemon_pid": current_pid, "backend_pid": None, "frontend_pid": None}
    save_state(state)
    
    log(f"Daemon started with PID {current_pid}")
    
    # Clean up any processes on ports first
    kill_processes_on_ports()
    
    backend_proc = None
    frontend_proc = None
    backend_log_file = None
    frontend_log_file = None
    
    consecutive_health_failures = 0
    
    try:
        backend_log_file = open(BACKEND_LOG, "a", encoding="utf-8")
        frontend_log_file = open(FRONTEND_LOG, "a", encoding="utf-8")
        
        # 1. Start Backend
        log("Starting backend...")
        backend_cmd = [PYTHON_EXE, "-u", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=os.path.join(ROOT_DIR, "backend"),
            stdout=backend_log_file,
            stderr=backend_log_file,
            creationflags=CREATE_NO_WINDOW
        )
        
        state["backend_pid"] = backend_proc.pid
        save_state(state)
        log(f"Backend started, PID={backend_proc.pid}")
        
        # 2. Wait for backend to be healthy
        log("Waiting for backend to be healthy (HTTP 200 on /api/v1/health)...")
        start_time = time.time()
        backend_ready = False
        while time.time() - start_time < 30:
            if check_backend_health():
                backend_ready = True
                break
            # Check if process died during startup
            if backend_proc.poll() is not None:
                log("Backend process exited unexpectedly during startup.")
                break
            time.sleep(1)
            
        if not backend_ready:
            log("Backend failed to start or return healthy within 30s. Exiting.")
            return
            
        log("Backend is healthy and ready.")
        
        # 3. Start Frontend
        log("Starting frontend...")
        frontend_cmd = ["npm.cmd", "run", "dev"]
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=os.path.join(ROOT_DIR, "frontend"),
            stdout=frontend_log_file,
            stderr=frontend_log_file,
            creationflags=CREATE_NO_WINDOW
        )
        
        state["frontend_pid"] = frontend_proc.pid
        save_state(state)
        log(f"Frontend started, PID={frontend_proc.pid}")
        
        # 4. Monitor loop
        while True:
            # Check backend process state
            if backend_proc.poll() is not None:
                log(f"Backend process PID {backend_proc.pid} exited with code {backend_proc.returncode}. Restarting...")
                backend_proc = subprocess.Popen(
                    backend_cmd,
                    cwd=os.path.join(ROOT_DIR, "backend"),
                    stdout=backend_log_file,
                    stderr=backend_log_file,
                    creationflags=CREATE_NO_WINDOW
                )
                state["backend_pid"] = backend_proc.pid
                save_state(state)
                log(f"Backend restarted, PID={backend_proc.pid}")
                consecutive_health_failures = 0
                time.sleep(2)
                
            # Check frontend process state
            if frontend_proc.poll() is not None:
                log(f"Frontend process PID {frontend_proc.pid} exited with code {frontend_proc.returncode}. Restarting...")
                frontend_proc = subprocess.Popen(
                    frontend_cmd,
                    cwd=os.path.join(ROOT_DIR, "frontend"),
                    stdout=frontend_log_file,
                    stderr=frontend_log_file,
                    creationflags=CREATE_NO_WINDOW
                )
                state["frontend_pid"] = frontend_proc.pid
                save_state(state)
                log(f"Frontend restarted, PID={frontend_proc.pid}")
                time.sleep(2)
                
            # Active Health Check
            if check_backend_health():
                consecutive_health_failures = 0
            else:
                consecutive_health_failures += 1
                log(f"Backend health check failure count: {consecutive_health_failures}/3")
                if consecutive_health_failures >= 3:
                    log("Backend is unhealthy or hung. Re-spawning backend...")
                    terminate_process_tree(backend_proc.pid)
                    consecutive_health_failures = 0
                    
            time.sleep(5)
            
    except KeyboardInterrupt:
        log("Daemon received shutdown signal.")
    except Exception as e:
        log(f"Fatal error in daemon loop: {e}")
    finally:
        log("Shutting down processes...")
        if backend_proc:
            terminate_process_tree(backend_proc.pid)
        if frontend_proc:
            terminate_process_tree(frontend_proc.pid)
        if backend_log_file:
            backend_log_file.close()
        if frontend_log_file:
            frontend_log_file.close()
        delete_state()
        log("Daemon exited.")

def start():
    state = get_state()
    if state:
        daemon_pid = state.get("daemon_pid")
        if daemon_pid:
            try:
                out = subprocess.check_output(f'tasklist /FI "PID eq {daemon_pid}"', shell=True, text=True)
                if str(daemon_pid) in out:
                    print("Daemon is already running.")
                    return
            except Exception:
                pass
                
    print("Launching background daemon...")
    script_path = os.path.abspath(__file__)
    subprocess.Popen(
        [PYTHONW_EXE, script_path, "daemon"],
        creationflags=CREATE_NO_WINDOW
    )
    print("Daemon launched. Waiting for startup confirmation...")
    
    for _ in range(30):
        time.sleep(1)
        state = get_state()
        if state and state.get("backend_pid") and state.get("frontend_pid"):
            print("Daemon and services started successfully in the background!")
            print(f"Daemon PID: {state['daemon_pid']}")
            print(f"Backend PID: {state['backend_pid']}")
            print(f"Frontend PID: {state['frontend_pid']}")
            return
            
    print("[WARNING] Launcher timed out waiting for daemon to confirm service startup.")
    print("Please check logs/daemon.log for status.")

def stop():
    state = get_state()
    if not state:
        print("No active daemon running according to state file.")
        kill_processes_on_ports()
        return
        
    daemon_pid = state.get("daemon_pid")
    backend_pid = state.get("backend_pid")
    frontend_pid = state.get("frontend_pid")
    
    print("Stopping application services...")
    if daemon_pid:
        print(f"Stopping daemon (PID {daemon_pid})...")
        terminate_process_tree(daemon_pid)
    if backend_pid:
        print(f"Stopping backend (PID {backend_pid})...")
        terminate_process_tree(backend_pid)
    if frontend_pid:
        print(f"Stopping frontend (PID {frontend_pid})...")
        terminate_process_tree(frontend_pid)
        
    kill_processes_on_ports()
    delete_state()
    print("All services stopped.")

def status():
    state = get_state()
    if not state:
        print("Daemon is offline.")
        return
        
    daemon_pid = state.get("daemon_pid")
    is_running = False
    if daemon_pid:
        try:
            out = subprocess.check_output(f'tasklist /FI "PID eq {daemon_pid}"', shell=True, text=True)
            if str(daemon_pid) in out:
                is_running = True
        except Exception:
            pass
            
    if is_running:
        print("Daemon: RUNNING")
        print(f"Daemon PID: {daemon_pid}")
        print(f"Backend PID: {state.get('backend_pid')}")
        print(f"Frontend PID: {state.get('frontend_pid')}")
        if check_backend_health():
            print("Backend Health: ONLINE (HTTP 200)")
        else:
            print("Backend Health: OFFLINE/UNHEALTHY")
        
        if check_port_listening(5173):
            print("Frontend Port 5173: LISTENING")
        else:
            print("Frontend Port 5173: NOT LISTENING")
    else:
        print("Daemon state file exists but process is offline.")
        delete_state()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python manage.py [start|stop|status|daemon]")
        sys.exit(1)
        
    action = sys.argv[1].lower()
    if action == "daemon":
        run_daemon()
    elif action == "start":
        start()
    elif action == "stop":
        stop()
    elif action == "status":
        status()
    else:
        print(f"Unknown action: {action}")
        sys.exit(1)
