import urllib.request
import urllib.parse
import json
import uuid

BASE_URL = "http://127.0.0.1:8000/api/v1"

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
        with urllib.request.urlopen(req, timeout=15) as response:
            res_data = response.read()
            # If it's a PDF stream, do not attempt to load as JSON
            if response.info().get_content_type() == "application/pdf":
                return response.status, res_data
            decoded = res_data.decode("utf-8")
            return response.status, json.loads(decoded) if decoded else {}
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8")
        print(f"HTTPError: {e.code} - {err_content}")
        raise e

def test_certificate_system():
    # 1. Log in student@hackathon.com (seeded participant)
    print("1. Logging in as student@hackathon.com...")
    login_payload = {
        "username": "student@hackathon.com",
        "password": "student123"
    }
    status, login_response = make_request(
        f"{BASE_URL}/auth/login", 
        data=login_payload, 
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    print(f"Login status code: {status}")
    assert status == 200, "Login failed"
    
    access_token = login_response["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Fetch my certificates (which triggers auto-generation if none exist)
    print("\n2. Fetching user certificates (triggering sample generation)...")
    status, certs = make_request(f"{BASE_URL}/certificates/my-certificates", headers=headers)
    print(f"Fetch certificates status code: {status}")
    print(f"Number of certificates fetched: {len(certs)}")
    assert status == 200, "Fetch certificates failed"
    assert len(certs) >= 2, "Sample certificates were not generated"
    
    # Print certificate details to check event name and fields
    for c in certs:
        print(f"  - ID: {c['id']}, Type: {c['certificate_type']}, Number: {c['certificate_number']}, Hackathon: '{c['hackathon_title']}', Recipient: '{c['user']['name']}'")
        assert "hackathon_title" in c, "hackathon_title missing from CertificateResponse"
        assert c["hackathon_title"] is not None, "hackathon_title was not populated"
    
    # 3. Test PDF download for the first certificate
    first_cert_id = certs[0]["id"]
    print(f"\n3. Attempting to download certificate ID: {first_cert_id}...")
    status, pdf_data = make_request(f"{BASE_URL}/certificates/{first_cert_id}/download", headers=headers)
    print(f"Download status code: {status}")
    print(f"PDF bytes received: {len(pdf_data)}")
    assert status == 200, "Download failed"
    assert pdf_data.startswith(b"%PDF"), "Response is not a valid PDF file"
    print("PDF header validation passed!")
    
    # 4. Test auto-generation on project submission
    # Register a new unique participant to avoid interference
    new_email = f"cert_tester_{uuid.uuid4().hex[:6]}@example.com"
    print(f"\n4. Registering a new participant user ({new_email}) for submission test...")
    register_payload = {
        "name": "Cert Tester User",
        "email": new_email,
        "password": "password123",
        "role": "participant",
        "college_id": 1
    }
    status, reg_response = make_request(f"{BASE_URL}/auth/register", data=register_payload)
    assert status == 200
    new_user_id = reg_response["id"]
    
    # Login the new user
    status, new_login = make_request(
        f"{BASE_URL}/auth/login",
        data={"username": new_email, "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    new_token = new_login["access_token"]
    new_headers = {"Authorization": f"Bearer {new_token}"}
    
    # Create a team
    print("Creating a test team for new user...")
    status, team = make_request(
        f"{BASE_URL}/teams/",
        data={"team_name": f"Test Team {uuid.uuid4().hex[:4]}", "hackathon_id": 1},
        headers=new_headers
    )
    print(f"Team created: ID {team['id']}, Name: {team['team_name']}")
    
    # Verify no certificates exist yet for the new user
    # Note: hitting /my-certificates will auto-generate samples, so we query the db directly
    # or verify that before submission certificates are empty.
    # To check that, let's verify certificates for the new user profile by querying user certificates
    # directly using user endpoint
    status, pre_certs = make_request(f"{BASE_URL}/certificates/user/{new_user_id}", headers=new_headers)
    print(f"Certs count before submission: {len(pre_certs)}")
    assert len(pre_certs) == 0
    
    # Perform submission (manually mock endpoint or write form-data POST)
    # Since we are using standard library, we need to build a simple multipart form-data body
    print("Submitting project PPT slide deck...")
    boundary = "----WebKitFormBoundaryE2ETest"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="team_id"\r\n\r\n'
        f"{team['id']}\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="project_title"\r\n\r\n'
        f"Neural Cert Solver\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="ppt_file"; filename="presentation.pdf"\r\n'
        f"Content-Type: application/pdf\r\n\r\n"
        f"%PDF-1.4 mock content\r\n"
        f"--{boundary}--\r\n"
    )
    status, sub = make_request(
        f"{BASE_URL}/submissions/",
        data=body,
        headers={
            "Authorization": f"Bearer {new_token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}"
        }
    )
    print(f"Submission status: {status}")
    assert status == 200, "Project submission failed"
    
    # Now check if certificate was automatically created!
    print("Verifying if participation certificate was auto-generated...")
    status, post_certs = make_request(f"{BASE_URL}/certificates/user/{new_user_id}", headers=new_headers)
    print(f"Certs count after submission: {len(post_certs)}")
    assert len(post_certs) == 1, "Participation certificate was not auto-generated upon project submission"
    print(f"Auto-generated Cert ID: {post_certs[0]['id']}, Type: {post_certs[0]['certificate_type']}, Event: {post_certs[0]['hackathon_title']}")
    assert post_certs[0]['certificate_type'] == "participation"
    
    print("\nAll Certificate E2E tests passed successfully!")

if __name__ == "__main__":
    test_certificate_system()
