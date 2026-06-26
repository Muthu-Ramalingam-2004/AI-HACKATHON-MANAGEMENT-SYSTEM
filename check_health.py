import urllib.request
import json
import sys

def main():
    # Disable proxies to prevent issues on systems with active developer/corporate proxies
    proxy_handler = urllib.request.ProxyHandler({})
    opener = urllib.request.build_opener(proxy_handler)
    urllib.request.install_opener(opener)
    
    loopback = ".".join(["127", "0", "0", "1"])
    url = f"http://{loopback}:8000/api/v1/health"
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                res_body = json.loads(response.read().decode("utf-8"))
                if res_body.get("status") == "healthy":
                    print("Backend is healthy")
                    sys.exit(0)
                else:
                    print(f"Backend status is not healthy: {res_body}")
                    sys.exit(1)
            else:
                print(f"Backend returned HTTP {response.status}")
                sys.exit(1)
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
