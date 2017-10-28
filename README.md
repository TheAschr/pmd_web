# Requirements:
- Transmission server
- IPtorrents account and resulting cookie
- ssl certification and key

# Optional:
- Twilio account and phone-number
- make
  
# Setup:
## Transmission:
1. Download and install transmission (Daemon not required)
2. Start Transmission
3. Go to "Edit"->"Preferences"->"Network" and set "Port for incoming connections" to whatever port you wish
4. Click "Use UPnP or NAT-PMP port forwarding for my router"
5. Forward port from step 3 on router. Check by clicking "Test Port"
6. Go to "Remote" tab and enable remote access and use authentication
7. Enter same authentication credentials as in node config file (config/config.json)
## IPtorrents cookie:
1. Go to login page on chrome
2. Hit f12 and go to "Network" tab
3. Login as normal
4. Go click "iptorrents.com"
5. Expand "Request Headers" and copy "cookie" value
6. Set "IPTCookie" in config.json value to copied cookie
## SSL cert and key:
1. Two popular methods are openssl and letsencrypt
2. Set "key_file" and "cert_file" to their respective file locations
## Twilio:
1. Create Twilio account and set "account_sid" and "auth_token"
2. "server_phone" is the phone number purchased through twilio that clients will receive texts from. It should be entered in this format: "+12223334444"
## Make:
1. Download and install "make". If on windows it is available in GNU utils.
    
# Other notes/Issues:
  - If running on linux you may have to install bcrypt and sqlite3 packages from npm (npm install bcrypt,sqlite3) as the compiled version is different from windows implementation
  - If you run the scraper and no media is scraped after a significant ammount of time, it usually means you have an incorrect "IPTCookie" value in config.json
  
