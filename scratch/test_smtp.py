import socket
import smtplib
import ssl
import sys

def diagnose_smtp(host="smtp-relay.brevo.com", port=587, timeout=10):
    print(f"=== Starting SMTP Diagnosis for {host}:{port} ===")
    
    # 1. DNS Resolution
    print("\n1. Verifying DNS resolution...")
    try:
        ips = socket.getaddrinfo(host, port)
        resolved_ips = list(set([ip[4][0] for ip in ips]))
        print(f"SUCCESS: Resolved {host} to {resolved_ips}")
    except Exception as e:
        print(f"FAILED: DNS resolution failed: {e}")
        return

    # 2. TCP Connectivity
    print("\n2. Verifying TCP connectivity (opening socket)...")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        sock.connect((resolved_ips[0], port))
        print(f"SUCCESS: Connected TCP socket to {resolved_ips[0]}:{port}")
    except socket.timeout:
        print(f"FAILED: Connection to {host}:{port} timed out (Render outbound port block is highly likely).")
        sock.close()
        return
    except Exception as e:
        print(f"FAILED: TCP connection failed: {e}")
        sock.close()
        return

    # 3. Reading SMTP Banner
    print("\n3. Reading SMTP banner...")
    try:
        banner = sock.recv(1024).decode('utf-8', errors='ignore')
        print(f"Banner: {banner.strip()}")
    except Exception as e:
        print(f"FAILED: Reading SMTP banner failed: {e}")
        sock.close()
        return
    sock.close()

    # 4. smtplib Connection & STARTTLS Handshake
    print("\n4. Verifying smtplib connection & STARTTLS...")
    try:
        server = smtplib.SMTP(host, port, timeout=timeout)
        server.set_debuglevel(1)
        
        ehlo_resp = server.ehlo()
        print(f"EHLO Response: {ehlo_resp}")
        
        if server.has_extn('starttls'):
            print("STARTTLS extension is supported. Starting TLS...")
            context = ssl.create_default_context()
            tls_resp = server.starttls(context=context)
            print(f"STARTTLS Response: {tls_resp}")
            ehlo_resp_secure = server.ehlo()
            print(f"Post-STARTTLS EHLO Response: {ehlo_resp_secure}")
        else:
            print("STARTTLS extension not supported by the server.")
            
        server.quit()
        print("SUCCESS: Connection and STARTTLS Handshake succeeded!")
    except Exception as e:
        print(f"FAILED: smtplib / STARTTLS flow failed: {e}")

if __name__ == "__main__":
    host = sys.argv[1] if len(sys.argv) > 1 else "smtp-relay.brevo.com"
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 587
    diagnose_smtp(host, port)
