import urllib.request
import urllib.parse
import json
import uuid

loopback = ".".join(["127", "0", "0", "1"])
BASE_URL = f"http://{loopback}:8000/api/v1"

# Disable system proxies to prevent E2E request routing issues
proxy_handler = urllib.request.ProxyHandler({})
opener = urllib.request.build_opener(proxy_handler)
urllib.request.install_opener(opener)

def make_request(url, data=None, headers=None, method=None):
    if headers is None:
        headers = {}
    
    req_data = None
    if data is not None:
        if isinstance(data, dict):
            # If Content-Type is form urlencoded
            if headers.get("Content-Type") == "application/x-www-form-urlencoded":
                req_data = urllib.parse.urlencode(data).encode("utf-8")
            else:
                req_data = json.dumps(data).encode("utf-8")
                if "Content-Type" not in headers:
                    headers["Content-Type"] = "application/json"
        elif isinstance(data, str):
            req_data = data.encode("utf-8")
        else:
            req_data = data

    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = response.read().decode("utf-8")
            return response.status, json.loads(res_data) if res_data else {}
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8")
        print(f"HTTPError: {e.code} - {err_content}")
        raise e

def test_registration_and_login():
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"
    name = "Test E2E User"
    role = "participant"
    college_id = 1

    print(f"1. Attempting registration for {email}...")
    register_payload = {
        "name": name,
        "email": email,
        "password": password,
        "role": role,
        "college_id": college_id
    }
    
    status, reg_response = make_request(f"{BASE_URL}/auth/register", data=register_payload)
    print(f"Registration status code: {status}")
    print(f"Registration response: {reg_response}")
    assert status == 200, "Registration failed"
    
    print("\n2. Attempting login...")
    login_payload = {
        "username": email,
        "password": password
    }
    status, login_response = make_request(
        f"{BASE_URL}/auth/login", 
        data=login_payload, 
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    print(f"Login status code: {status}")
    print(f"Login response: {login_response}")
    assert status == 200, "Login failed"
    
    access_token = login_response["access_token"]
    
    print("\n3. Fetching user profile using access token...")
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    status, me_response = make_request(f"{BASE_URL}/auth/me", headers=headers)
    print(f"Profile status code: {status}")
    print(f"Profile response: {me_response}")
    assert status == 200, "Profile fetch failed"
    print("\nE2E API verification successful!")

if __name__ == "__main__":
    test_registration_and_login()
