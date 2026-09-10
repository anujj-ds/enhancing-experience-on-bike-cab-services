The current RideEase build is a single-session academic prototype and does not yet
implement user accounts or persistent storage. The table below documents the
security mechanisms that are either partially in place (e.g., API key protection)
or recommended as part of the system's security design for a production version.

| Security Mechanism        | Component                                   | Purpose                                                                 | Threat Addressed                                      |
|---------------------------|----------------------------------------------|--------------------------------------------------------------------------|--------------------------------------------------------|
| Authentication             | User login module (Flask + session/JWT)      | Verify that a user is who they claim to be before allowing ride booking  | Unauthorized access, impersonation                     |
| Authorization               | Role-based access control (Rider vs Driver)  | Ensure riders and drivers can only access features meant for their role  | Privilege escalation, unauthorized feature access       |
| Data protection             | HTTPS/TLS + encrypted storage for user data  | Protect ride details, chat messages, and personal info in transit/rest   | Data interception (man-in-the-middle), data leaks       |
| Network security            | Firewall + HTTPS enforced on Flask server    | Restrict inbound/outbound traffic to trusted sources and ports           | Network sniffing, unauthorized server access            |
| Database security           | Parameterized queries + access-controlled DB | Prevent malicious manipulation of ride, user, and chat records           | SQL injection, unauthorized data modification            |
| Backup/recovery             | Scheduled DB backups + recovery plan         | Ensure ride history and user data can be restored after failure/attack   | Data loss, ransomware, accidental deletion               |
| Monitoring/logging          | Server + API access logs (Flask logging)     | Track requests to app.py, Gemini API calls, and OSRM routing calls       | Intrusion detection, abuse of API keys, anomaly tracking |
| Account/password protection | Hashed passwords (bcrypt) + .env key storage | Protect user credentials and the Gemini API key from exposure            | Credential theft, brute-force attacks, key leakage       |

**Note on current implementation status:**
- The Gemini API key is already stored securely in a `.env` file (not committed to
  version control) — this is a basic form of **account/password protection** already
  in place.
- Authentication, authorization, database security, backup/recovery, and monitoring
  are **not yet implemented** in the current demo (no login, no database) and are
  listed here as required mechanisms for the system's future production version.
- Network security (HTTPS) would need to be added when deploying beyond
  `127.0.0.1` (localhost).
