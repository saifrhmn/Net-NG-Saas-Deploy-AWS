# Karbar – Docker & AWS Deployment

This repo holds the Karbar web app and everything needed to run it in Docker, on your PC or on AWS:

| Service     | Source folder              | Port | What it is                                              |
|-------------|----------------------------|------|---------------------------------------------------------|
| `web`       | `KARBAR_Web_App_Frontend`  | 80   | Angular 18 app, served by nginx                         |
| `api`       | `KARBAR_Web_App_API`       | 8080 | ASP.NET Core (.NET 9) API                               |
| `sqlserver` | `mssql/server:2022-latest` | 1433 | SQL Server. Starts only with `--profile local-db`       |

| File | Purpose |
|---|---|
| `KARBAR_Web_App_API/Dockerfile` | Builds the API image |
| `KARBAR_Web_App_Frontend/Dockerfile`, `nginx.conf` | Builds the Angular app and serves it with nginx |
| `docker-compose.yml` | Runs all three services together |
| `.env.example` | Template for `.env`, which holds all passwords and settings. `.env` is never committed. |
| `db/backups/` | Put `.bak` files here to restore them into the `sqlserver` container |

**How this guide works:**
- AWS resources (server, firewall, load balancer, certificate…) are created in the **AWS web console**: https://console.aws.amazon.com. No AWS CLI is needed on your PC.
- All commands run in an **Ubuntu terminal**. Each block is marked with where it runs:
  - 💻 **PC terminal**: Ubuntu on your PC. On Windows, that's **WSL Ubuntu** (`wsl --install -d Ubuntu`). There, `d:\` is `/mnt/d/`.
  - ☁️ **Server terminal**: the AWS server, after you log in with `ssh karbar` (Step 6).

## Contents

**Part 1 – Run on your PC**
- [1.1 Quick start](#11-quick-start) · [1.2 Restore the existing database into Docker](#12-restore-the-existing-database-into-docker)

**Part 2 – Deploy to AWS (one EC2 server)**
- [How it fits together](#how-it-fits-together) · [What you need](#what-you-need) · [All steps at a glance](#all-steps-at-a-glance)
- [Step 1](#step-1--check-the-database-and-take-a-backup) Backup · [2](#step-2--create-the-key-pair-pem) Key pair · [3](#step-3--create-the-security-groups) Security groups · [4](#step-4--create-the-backup-bucket-and-the-servers-iam-role) S3 + IAM · [5](#step-5--launch-the-ec2-server) EC2 · [6](#step-6--connect-to-the-server-with-the-pem-key) SSH · [7](#step-7--install-docker-on-the-server) Docker · [8](#step-8--copy-the-code-and-the-backup-to-the-server) Copy · [9](#step-9--create-env-on-the-server) `.env` · [10](#step-10--restore-the-database) Restore · [11](#step-11--build-and-start-the-app) Start · [12](#step-12--set-up-automatic-backups) Backups · [13](#step-13--request-the-https-certificate) Certificate · [14](#step-14--create-the-load-balancer) Load balancer · [15](#step-15--point-your-domain-at-the-load-balancer) DNS · [16](#step-16--test) Test · [17](#step-17--tidy-up) Tidy up

**Part 3 – Run it**
- [Go-live day](#go-live-day) · [Daily operations](#daily-operations) · [Updating the app](#updating-the-app) · [Restoring a newer backup](#restoring-a-newer-backup) · [If the server is lost](#if-the-server-is-lost)
- [No domain yet?](#no-domain-yet) · [Troubleshooting](#troubleshooting) · [Delete everything](#delete-everything) · [Appendix: moving to RDS later](#appendix--moving-the-database-to-rds-later)

---

# Part 1 – Run on your PC

## 1.1 Quick start

Needs Docker: Docker Desktop with WSL integration turned on, or Docker Engine on Ubuntu.

💻 **PC terminal:**

```bash
cd /mnt/d/Personal/Karber-deply-AWS-Docker     # on plain Ubuntu: the folder where you cloned the repo
cp .env.example .env                           # then fill in real values: nano .env
docker compose up -d --build                   # app only, using an external database
docker compose --profile local-db up -d --build    # app + SQL Server in Docker
```

- Web: http://localhost
- API / Swagger: http://localhost:8080/swagger

Where `DB_CONNECTION` in `.env` points depends on where the database is:

| Database | `Server=` part of `DB_CONNECTION` |
|---|---|
| The `sqlserver` container | `Server=sqlserver,1433` (the container's name, **not** `localhost`) |
| Another server, e.g. `projectdev` | `Server=projectdev` |

If you run the API from Visual Studio instead of Docker, `.env` isn't used. Put the connection string in `KARBAR_Web_App_API/Karbar.Api/appsettings.Development.json`, with `Server=localhost,1433`.

## 1.2 Restore the existing database into Docker

These steps copy `Karbar_DB` from `projectdev` into the local `sqlserver` container.

1. **Back up** on `projectdev` (in SSMS):

   ```sql
   BACKUP DATABASE Karbar_DB TO DISK = 'C:\Temp\Karbar_DB.bak' WITH COPY_ONLY, COMPRESSION, INIT, STATS = 10;
   ```

   Copy `Karbar_DB.bak` from `C:\Temp` on that machine to `db/backups/` in this repo.

2. **Start SQL Server.** First set a strong `SQL_SA_PASSWORD` in `.env`: 8+ characters, with upper case, lower case, a digit and a symbol. 💻 **PC terminal:**

   ```bash
   docker compose --profile local-db up -d sqlserver
   docker compose logs -f sqlserver     # wait for "SQL Server is now ready for client connections", then Ctrl+C
   ```

3. **Add a short `sql` command**, then restore:

   ```bash
   sql() { docker compose exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa \
             -P "$(grep '^SQL_SA_PASSWORD=' .env | cut -d= -f2-)" -C "$@"; }

   # Note the two LogicalName values (data + log)
   sql -Q "RESTORE FILELISTONLY FROM DISK='/var/opt/mssql/backup/Karbar_DB.bak'" -W

   # Replace Karbar_DB / Karbar_DB_log with those names if different
   sql -Q "RESTORE DATABASE Karbar_DB FROM DISK='/var/opt/mssql/backup/Karbar_DB.bak'
           WITH MOVE 'Karbar_DB' TO '/var/opt/mssql/data/Karbar_DB.mdf',
                MOVE 'Karbar_DB_log' TO '/var/opt/mssql/data/Karbar_DB_log.ldf', REPLACE, STATS = 10"
   ```

4. **Recreate the app login.** Logins aren't stored in the backup. The second command links the restored `testuser` user to the new login:

   ```bash
   sql -Q "CREATE LOGIN testuser WITH PASSWORD='<APP_DB_PASSWORD>', CHECK_POLICY=OFF;"
   sql -d Karbar_DB -Q "ALTER USER testuser WITH LOGIN = testuser;"
   ```

5. **Point the API at it.** In `.env`:

   ```env
   DB_CONNECTION=Server=sqlserver,1433;Database=Karbar_DB;User=testuser;Password=<APP_DB_PASSWORD>;TrustServerCertificate=True;Trusted_Connection=False;MultipleActiveResultSets=true;
   ```

   Then run `docker compose --profile local-db up -d --build`. To browse the data in SSMS, connect to `localhost,1433`.

The database lives in the `karbar_sql-data` Docker volume. `docker compose down` keeps it, but **`docker compose down -v` deletes it.**

---

# Part 2 – Deploy to AWS

## How it fits together

Everything runs on **one EC2 server** with Docker Compose: the Angular site, the .NET API **and SQL Server Express**. The existing database moves over as a `.bak` file copied straight to the server.

```
                 Internet
                    │
          https://karbar.example.com
                    │
     ┌──────────────▼───────────────┐
     │ Application Load Balancer    │  HTTPS (free ACM certificate)
     │  /api/*, /Images/*  → :8080  │  HTTP → redirected to HTTPS
     │  everything else    → :80    │
     └──────────────┬───────────────┘
                    │
     ┌──────────────▼────────────────────────┐
     │ EC2  t3.large, Ubuntu 24.04, Docker   │
     │                                       │
     │   web        nginx + Angular    :80   │
     │   api        .NET 9             :8080 │──► volume: uploaded images
     │   sqlserver  SQL Server Express :1433 │──► volume: database files
     │              (not reachable from outside)
     └──────────────┬────────────────────────┘
                    │ nightly 2 AM
             ┌──────▼───────┐   + daily snapshot of the whole disk
             │ S3 bucket    │
             └──────────────┘
```

- The site and the API share **one domain**, so the browser calls `https://karbar.example.com/api/...`. You don't need CORS changes or a second certificate.
- Only the load balancer can reach the server, on ports 80 and 8080. SSH (port 22) is open only to your own IP, and **SQL Server is never reachable from outside**.
- The app doesn't connect to any outside system (no SAP or similar). It only needs its database.

## What you need

- An **AWS account**, and a login to the AWS console with permission for EC2, S3, IAM, Certificate Manager and Route 53.
- A **domain name** you can add DNS records to. Without one, see [No domain yet?](#no-domain-yet).
- An **Ubuntu terminal** on your PC (Ubuntu, or WSL Ubuntu on Windows) with `ssh`, `scp` and `rsync`: `sudo apt-get install -y openssh-client rsync`.
- SSMS, and access to `projectdev` for the backup.

> **Pick one AWS region and use it everywhere** (e.g. *Asia Pacific (Singapore) ap-southeast-1*). Check the region selector at the top right of every console page. Resources in another region won't appear.
>
> Replace `karbar.example.com` with your real domain everywhere in this guide.

## All steps at a glance

| #  | Step | Where | Time |
|----|------|-------|------|
| 1  | Check the database and take a backup | SSMS on `projectdev` | 10 min |
| 2  | Create the key pair (`karbar-key.pem`) | AWS console + 💻 | 2 min |
| 3  | Create the security groups | AWS console | 5 min |
| 4  | Create the backup bucket and the server's IAM role | AWS console | 5 min |
| 5  | Launch the EC2 server | AWS console | 5 min |
| 6  | Connect to the server with the `.pem` key | 💻 | 2 min |
| 7  | Install Docker | ☁️ | 3 min |
| 8  | Copy the code and the backup | 💻 / ☁️ | 5 min |
| 9  | Create `.env` | ☁️ | 5 min |
| 10 | Restore the database | ☁️ | 5–15 min |
| 11 | Build and start the app | ☁️ | 10 min |
| 12 | Set up automatic backups | ☁️ + AWS console | 10 min |
| 13 | Request the HTTPS certificate | AWS console + DNS | 5–30 min |
| 14 | Create the load balancer | AWS console | 10 min |
| 15 | Point your domain at the load balancer | DNS | 5 min |
| 16 | Test | Browser | 10 min |
| 17 | Tidy up | 💻 / ☁️ | 5 min |

---

## Step 1 – Check the database and take a backup

In SSMS, connected to `projectdev`, check two things first:

```sql
SELECT @@VERSION;                 -- must be SQL Server 2022 or older
USE Karbar_DB; EXEC sp_spaceused; -- database_size must be under 10 GB
```

| Result | What to do |
|---|---|
| Version 2022 or older | Fine, no change needed. |
| Version **2025** | In `docker-compose.yml`, change the image to `mcr.microsoft.com/mssql/server:2025-latest`. |
| Size under 10 GB | Fine. The free **Express** edition is enough. |
| Size **over 10 GB** | Express can't hold it. You need a paid SQL Server licence (`MSSQL_PID=Standard`/`Web`), or RDS ([appendix](#appendix--moving-the-database-to-rds-later)). |

Take the backup:

```sql
BACKUP DATABASE Karbar_DB
TO DISK = 'C:\Temp\Karbar_DB.bak'
WITH COPY_ONLY, COMPRESSION, INIT, STATS = 10;
```

- `COPY_ONLY` means this backup doesn't interfere with the server's scheduled backups.
- If you get an error about `COMPRESSION`, `projectdev` is Express edition. Remove `COMPRESSION,` and run it again.
- Copy `Karbar_DB.bak` from `C:\Temp` on `projectdev` to `d:\Personal\Karber-deply-AWS-Docker\db\backups\` on your PC.

> This first backup is for setting up and testing. On the real switch-over day you take a fresh one. See [Go-live day](#go-live-day).

## Step 2 – Create the key pair (`.pem`)

The key pair is how you log in to the server. AWS keeps the public half. You download the private half as `karbar-key.pem`.

**AWS console:** **EC2 → Network & Security → Key Pairs → Create key pair**
- Name: `karbar-key`
- Key pair type: **RSA**
- Private key file format: **.pem**
- **Create key pair**. The file `karbar-key.pem` downloads, usually to `Downloads`.

💻 **PC terminal.** Move the key into `~/.ssh` and lock it down. `ssh` refuses keys that other users can read:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh

# WSL on Windows (Downloads is on the C: drive):
cp /mnt/c/Users/<your-windows-user>/Downloads/karbar-key.pem ~/.ssh/
# Plain Ubuntu:
# mv ~/Downloads/karbar-key.pem ~/.ssh/

chmod 400 ~/.ssh/karbar-key.pem
ls -l ~/.ssh/karbar-key.pem          # should show -r--------
```

> ⚠️ **Keep the key in `~/.ssh`, not under `/mnt/c` or `/mnt/d`.** On Windows drives `chmod` has no effect, and `ssh` reports *UNPROTECTED PRIVATE KEY FILE*.
>
> ⚠️ AWS gives you the private key **only once**. Store a copy in a password manager. Without it you can't log in to the server. Never commit it (`*.pem` is in `.gitignore`), and never send it in chat or email.

## Step 3 – Create the security groups

Security groups are firewalls. You need two:

**AWS console:** **EC2 → Network & Security → Security Groups → Create security group**

**First group, `karbar-alb`** (for the load balancer):

| Field | Value |
|---|---|
| Name / Description | `karbar-alb` / `Karbar load balancer` |
| VPC | the default VPC |
| Inbound rule 1 | Type **HTTP**, Source **Anywhere-IPv4** (`0.0.0.0/0`) |
| Inbound rule 2 | Type **HTTPS**, Source **Anywhere-IPv4** (`0.0.0.0/0`) |

**Second group, `karbar-ec2`** (for the server):

| Field | Value |
|---|---|
| Name / Description | `karbar-ec2` / `Karbar app server` |
| VPC | the default VPC |
| Inbound rule 1 | Type **SSH**, Source **My IP** |
| Inbound rule 2 | Type **HTTP** (80), Source **Custom** → pick the `karbar-alb` security group |
| Inbound rule 3 | Type **Custom TCP**, port **8080**, Source **Custom** → pick the `karbar-alb` security group |

Leave the outbound rules as they are (all traffic allowed). Port 1433 (SQL Server) is **not** opened anywhere.

## Step 4 – Create the backup bucket and the server's IAM role

The server uploads its nightly database backups to S3. The IAM role gives it permission to do that, without storing AWS keys on the server.

**4.1 – Bucket.** **AWS console → S3 → Create bucket**
- Name: `karbar-db-backups-<something-unique>`, e.g. `karbar-db-backups-2026x7`. Write it down.
- Region: your region
- **Block all public access**: ✅ on (the default)
- **Create bucket**

Then open the bucket → **Management → Create lifecycle rule**:
- Name `expire-daily`, scope **Limit to prefix** `daily/`
- ✅ *Expire current versions of objects* after **30** days → **Create rule**

**4.2 – IAM role.** **AWS console → IAM → Roles → Create role**
- Trusted entity: **AWS service** → Use case **EC2** → **Next**
- Skip the permissions list → **Next**
- Role name: `karbar-ec2-role` → **Create role**

Open `karbar-ec2-role` → **Add permissions → Create inline policy → JSON**, and paste this, with **your bucket name** in both places:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::karbar-db-backups-2026x7",
      "arn:aws:s3:::karbar-db-backups-2026x7/*"
    ]
  }]
}
```

**Next** → policy name `karbar-s3-backup` → **Create policy**.

## Step 5 – Launch the EC2 server

**5.1 – Launch.** **AWS console → EC2 → Instances → Launch instances**

| Field | Value |
|---|---|
| Name | `karbar-app` |
| Application and OS Images | **Ubuntu** → **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type**, 64-bit (x86) |
| Instance type | **t3.large** (2 vCPU, 8 GB). SQL Server, the API and the Angular build share it. |
| Key pair | `karbar-key` |
| Network settings → **Edit** | VPC: default · Auto-assign public IP: **Enable** · Firewall: **Select existing security group** → `karbar-ec2` |
| Configure storage | **50** GiB, **gp3** (under *Advanced*, set *Encrypted* = Yes) |
| Advanced details → IAM instance profile | `karbar-ec2-role` |

Click **Launch instance**, then **View all instances**. Wait until **Instance state** is *Running* and **Status check** is *2/2 checks passed*.

**5.2 – Fixed public IP.** **EC2 → Network & Security → Elastic IPs → Allocate Elastic IP address → Allocate.** Then **Actions → Associate Elastic IP address** → Instance `karbar-app` → **Associate**. Write the IP down. This is your server's address from now on, and it doesn't change when the server restarts.

**5.3 – Tag the disk for daily snapshots.** **EC2 → Elastic Block Store → Volumes** → the 50 GiB volume attached to `karbar-app` → **Tags → Manage tags → Add tag** → Key `Backup`, Value `karbar` → **Save**.

## Step 6 – Connect to the server with the `.pem` key

💻 **PC terminal.** Add a shortcut, so that from now on you can type just `ssh karbar`. Replace `13.250.xx.xx` with your Elastic IP:

```bash
cat >> ~/.ssh/config <<'EOF'

Host karbar
    HostName 13.250.xx.xx
    User ubuntu
    IdentityFile ~/.ssh/karbar-key.pem
    ServerAliveInterval 60
EOF
chmod 600 ~/.ssh/config
```

Connect:

```bash
ssh karbar
```

The first time, type `yes` to accept the server's fingerprint. Your prompt changes to `ubuntu@ip-172-…:~$`. You're now on the server ☁️. To go back to your PC, type `exit`.

Without the shortcut, the full command is `ssh -i ~/.ssh/karbar-key.pem ubuntu@13.250.xx.xx`.

| Problem | Fix |
|---|---|
| `UNPROTECTED PRIVATE KEY FILE` / `bad permissions` | Run `chmod 400 ~/.ssh/karbar-key.pem`, and keep the key in `~/.ssh`, not on `/mnt/c` or `/mnt/d` (Step 2). |
| `Connection timed out` | Your internet IP changed. In the console: **Security Groups → `karbar-ec2` → Edit inbound rules** → SSH rule → Source **My IP** → Save. |
| `Permission denied (publickey)` | Use user `ubuntu` (not `root` or `ec2-user`), and the `karbar-key.pem` from Step 2. |

## Step 7 – Install Docker on the server

☁️ **Server terminal** (`ssh karbar`):

```bash
sudo apt-get update && sudo apt-get -y upgrade
curl -fsSL https://get.docker.com | sudo sh     # Docker Engine + Compose + Buildx
sudo usermod -aG docker ubuntu                  # use docker without sudo
sudo timedatectl set-timezone Asia/Dhaka        # logs and backup times in local time
sudo snap install aws-cli --classic             # used only by the backup script (Step 12)
exit                                            # log out so the docker group applies
```

💻 Run `ssh karbar` again, then ☁️ check:

```bash
docker --version && docker compose version
aws s3 ls        # lists your bucket = the IAM role from Step 4 works
```

## Step 8 – Copy the code and the backup to the server

**Code – option 1, Git (recommended).** Push this repo to GitHub or GitLab first. ☁️ **Server terminal:**

```bash
git clone <your-repo-url> ~/karbar
```

For a private repo, use a personal access token as the password, or add a deploy key.

**Code – option 2, copy from your PC with `rsync`.** It only copies what changed, so you can use the same command for later updates. 💻 **PC terminal:**

```bash
cd /mnt/d/Personal/Karber-deply-AWS-Docker
rsync -avz --delete \
  --exclude node_modules --exclude bin --exclude obj --exclude .angular --exclude dist \
  --exclude .git --exclude .env --exclude '*.bak' --exclude '*.pem' \
  ./ karbar:~/karbar/
```

**Backup file.** 💻 **PC terminal:**

```bash
ssh karbar "mkdir -p ~/karbar/db/backups"
scp db/backups/Karbar_DB.bak karbar:~/karbar/db/backups/
```

## Step 9 – Create `.env` on the server

☁️ **Server terminal:**

```bash
cd ~/karbar
cp .env.example .env
openssl rand -base64 48        # copy the output: this is your JWT_KEY
nano .env                      # set the values below, then Ctrl+O, Enter, Ctrl+X to save
chmod 600 .env                 # only you can read it
```

```env
ASPNETCORE_ENVIRONMENT=Production
API_PORT=8080
WEB_PORT=80

# The browser calls the API through the load balancer, on the same domain
API_BASE_URL=https://karbar.example.com/api/

# "sqlserver" = the database container's name inside Docker Compose
DB_CONNECTION=Server=sqlserver,1433;Database=Karbar_DB;User=testuser;Password=<APP_DB_PASSWORD>;TrustServerCertificate=True;Trusted_Connection=False;MultipleActiveResultSets=true;
JWT_KEY=<output of openssl rand -base64 48>

# SQL Server container
SQL_SA_PASSWORD=<strong sa password>
MSSQL_PID=Express
MSSQL_MEMORY_LIMIT_MB=3072
SQL_PORT=127.0.0.1:1433
```

| Setting | Why |
|---|---|
| `API_BASE_URL` | **Built into** the Angular app when it's built. Must be your real domain plus `/api/`. If you change it, rebuild `web` ([Updating the app](#updating-the-app)). |
| `<APP_DB_PASSWORD>` | A **new**, strong password for the app's database login. Don't reuse the one from `appsettings.json`. Avoid `;` and `'` in it. |
| `JWT_KEY` | Signs login tokens. Changing it later logs every user out once. |
| `SQL_SA_PASSWORD` | SQL Server's admin password: 8+ characters, with upper case, lower case, a digit and a symbol. If it's too weak, SQL Server won't start. |
| `MSSQL_PID=Express` | Free and licensed for production, up to 10 GB per database. `Developer` is **not** licensed for production. |
| `MSSQL_MEMORY_LIMIT_MB=3072` | Stops SQL Server taking the RAM the API and the build need. |
| `SQL_PORT=127.0.0.1:1433` | SQL Server is reachable only from the server itself, or through an [SSH tunnel](#daily-operations). |

> Keep a copy of this `.env` in a password manager. It's not in Git, and you need it to rebuild the server.

## Step 10 – Restore the database

☁️ **Server terminal.** Start SQL Server:

```bash
cd ~/karbar
sudo chown -R 10001:0 db/backups                   # SQL Server runs as user 10001 in the container
docker compose --profile local-db up -d sqlserver
docker compose logs -f sqlserver                   # wait for "SQL Server is now ready for client connections", then Ctrl+C
```

Add a short `sql` command. You'll use it from now on:

```bash
cat >> ~/.bashrc <<'EOF'
sql() {
  (cd ~/karbar && docker compose exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "$(grep '^SQL_SA_PASSWORD=' .env | cut -d= -f2-)" -C "$@")
}
EOF
source ~/.bashrc
```

**10.1 – Find the file names inside the backup.** Note the two `LogicalName` values (`D` = data, `L` = log):

```bash
sql -Q "RESTORE FILELISTONLY FROM DISK='/var/opt/mssql/backup/Karbar_DB.bak'" -W
```

**10.2 – Restore.** Replace `Karbar_DB` / `Karbar_DB_log` if your names are different:

```bash
sql -Q "RESTORE DATABASE Karbar_DB FROM DISK='/var/opt/mssql/backup/Karbar_DB.bak'
        WITH MOVE 'Karbar_DB'     TO '/var/opt/mssql/data/Karbar_DB.mdf',
             MOVE 'Karbar_DB_log' TO '/var/opt/mssql/data/Karbar_DB_log.ldf',
             REPLACE, STATS = 10"
```

**10.3 – Create the app login.** Use the same `<APP_DB_PASSWORD>` as in `.env`:

```bash
sql -Q "CREATE LOGIN testuser WITH PASSWORD='<APP_DB_PASSWORD>';"
sql -d Karbar_DB -Q "ALTER USER testuser WITH LOGIN = testuser;"
```

If the second command says the user doesn't exist, run this instead:

```bash
sql -d Karbar_DB -Q "CREATE USER testuser FOR LOGIN testuser; ALTER ROLE db_owner ADD MEMBER testuser;"
```

**10.4 – Check.** It should show the same table count as on `projectdev`:

```bash
sql -d Karbar_DB -Q "SELECT COUNT(*) AS Tables FROM sys.tables" -W
```

## Step 11 – Build and start the app

☁️ **Server terminal:**

```bash
cd ~/karbar
docker compose --profile local-db up -d --build    # first build: about 5–10 minutes
docker compose ps                                  # sqlserver, api and web should all be "Up"
```

> **On this server, always include `--profile local-db`** in `docker compose up` commands. Without it, SQL Server isn't started.

Check that it works:

```bash
curl -s http://localhost/health                                                          # → ok
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/swagger/v1/swagger.json   # → 200
docker compose logs api --tail 50                                                        # no SQL / login errors
```

The API creates its `ApiLogs` table on first start. All containers restart automatically after a reboot. To prove it, run `sudo reboot`, wait a minute, run `ssh karbar`, then `docker compose -f ~/karbar/docker-compose.yml ps`.

## Step 12 – Set up automatic backups

The database lives only on this server's disk. **Don't skip this step.**

**12.1 – Nightly database backup to S3.** ☁️ **Server terminal:**

```bash
nano ~/karbar/backup-db.sh
```

Paste this in, and set `BUCKET` to your bucket name from Step 4:

```bash
#!/bin/bash
set -euo pipefail
cd /home/ubuntu/karbar
BUCKET=karbar-db-backups-2026x7
FILE=Karbar_DB_$(date +%F_%H%M).bak
PASS=$(grep '^SQL_SA_PASSWORD=' .env | cut -d= -f2-)

docker compose exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$PASS" -C -b \
  -Q "BACKUP DATABASE Karbar_DB TO DISK='/var/opt/mssql/backup/$FILE' WITH INIT, CHECKSUM"

sudo aws s3 cp "db/backups/$FILE" "s3://$BUCKET/daily/$FILE"
sudo find db/backups -name 'Karbar_DB_*.bak' -mtime +3 -delete     # keep 3 days on the server too
echo "$(date) OK $FILE"
```

Test it, then schedule it for 2 AM every night:

```bash
chmod +x ~/karbar/backup-db.sh
~/karbar/backup-db.sh                       # should end with "OK Karbar_DB_....bak"

(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/karbar/backup-db.sh >> /home/ubuntu/karbar/backup.log 2>&1") | crontab -
crontab -l
```

In the console, **S3 → your bucket → `daily/`** should now show the file.

**12.2 – Daily snapshot of the whole disk.** This also covers uploaded images and the server setup. **AWS console → EC2 → Elastic Block Store → Lifecycle Manager → Create lifecycle policy:**
- **EBS snapshot policy** → Next
- Target resource types: **Volume** · Target resource tags: `Backup` = `karbar`
- IAM role: **Default role**
- Schedule: every **24 hours**, starting at **21:00 UTC** (3 AM in Dhaka, one hour after the database backup)
- Retention: **Count 7**
- **Create policy**

## Step 13 – Request the HTTPS certificate

The certificate from **AWS Certificate Manager (ACM)** is free and renews itself. It must be in the **same region** as the load balancer.

**AWS console → Certificate Manager → Request certificate**
1. **Request a public certificate** → Next.
2. Fully qualified domain name: `karbar.example.com`.
3. Validation method: **DNS validation** → **Request**.
4. Open the new certificate. Under **Domains** it shows a **CNAME name** and a **CNAME value**. Add that record to your DNS:
   - **Domain in Route 53:** click **Create records in Route 53 → Create records**.
   - **Other DNS provider:** add a CNAME record with that name and value in its control panel. Some providers want only the part before your domain in the name field.
5. Wait until the status is **Issued**. Usually a few minutes; sometimes up to 30.

💻 Optional check from the PC terminal: `dig +short CNAME <the CNAME name>` should print the CNAME value.

## Step 14 – Create the load balancer

**14.1 – Target groups.** These are the `web` and `api` containers on the server. **AWS console → EC2 → Load Balancing → Target Groups → Create target group**, twice:

| Field | First: web | Second: api |
|---|---|---|
| Target type | **Instances** | **Instances** |
| Name | `karbar-web-tg` | `karbar-api-tg` |
| Protocol : Port | HTTP : **80** | HTTP : **8080** |
| VPC | default | default |
| Health check path | `/health` | `/swagger/v1/swagger.json` |

**Next** → tick `karbar-app` → check that the port is right (80 or 8080) → **Include as pending below** → **Create target group**.

**14.2 – Load balancer.** **EC2 → Load Balancing → Load Balancers → Create load balancer → Application Load Balancer → Create**

| Field | Value |
|---|---|
| Name | `karbar-alb` |
| Scheme | **Internet-facing**, IPv4 |
| Network mapping | default VPC, tick **at least two** Availability Zones (including the one `karbar-app` is in) |
| Security groups | **only** `karbar-alb` (remove `default`) |
| Listener 1 | **HTTP : 80** → forward to `karbar-web-tg` (changed to a redirect in 14.4) |
| **Add listener** | **HTTPS : 443** → forward to `karbar-web-tg` |
| Secure listener settings | Certificate source **From ACM** → `karbar.example.com` (from Step 13) |

**Create load balancer.** Wait until its state is **Active** (2–3 minutes).

**14.3 – Send `/api/*` and `/Images/*` to the API.** Open `karbar-alb` → **Listeners and rules** → **HTTPS:443** → **Manage rules → Add rule**:
- Name: `api`
- **Add condition → Path** → `/api/*` → **Add OR condition value** → `/Images/*` → Confirm
- Action: **Forward to** `karbar-api-tg`
- Priority: `1` → **Create**

**14.4 – Redirect HTTP to HTTPS.** **Listeners and rules** → **HTTP:80** → **Actions → Edit listener** → default action **Redirect to URL** → **URI parts** → Protocol **HTTPS**, Port **443**, Status code **301** → **Save changes**.

**14.5 – Longer timeout for big reports.** `karbar-alb` → **Attributes → Edit** → **Connection idle timeout** `300` seconds → **Save changes**.

**14.6 – Check.** **Target Groups** → `karbar-web-tg` and `karbar-api-tg` → **Targets** tab. Both should be **healthy** after 1–2 minutes. If not, see [Troubleshooting](#troubleshooting).

## Step 15 – Point your domain at the load balancer

Copy the load balancer's **DNS name** from `karbar-alb` → **Details**. It looks like `karbar-alb-123456.ap-southeast-1.elb.amazonaws.com`.

- **Route 53:** **Hosted zones** → your domain → **Create record** → name `karbar` → type **A** → turn **Alias** on → *Alias to Application and Classic Load Balancer* → your region → `karbar-alb` → **Create records**.
- **Other DNS provider:** add a **CNAME** record from `karbar` to the load balancer DNS name.

💻 Check from the PC terminal. It should print one or more IP addresses:

```bash
dig +short karbar.example.com
```

DNS changes usually work within a few minutes. Some networks take up to an hour.

## Step 16 – Test

- [ ] `https://karbar.example.com` shows the login page with a valid padlock.
- [ ] `http://karbar.example.com` redirects to `https://`.
- [ ] Login works. In the browser dev tools **Network** tab, API calls go to `https://karbar.example.com/api/...` and return 200.
- [ ] Screens with item or user images show them, and image URLs start with `https://karbar.example.com/Images/...`.
- [ ] Uploading an image works, and the image is still there after `docker compose --profile local-db restart api` (☁️ in `~/karbar`).
- [ ] The data matches `projectdev`: open a few records and compare.
- [ ] The next morning: `tail ~/karbar/backup.log` (☁️) shows `OK`, and S3 shows the new file in `daily/`.
- [ ] The day after: **EC2 → Snapshots** shows a snapshot of the `karbar-app` volume.

## Step 17 – Tidy up

- ☁️ Delete the setup backup: `sudo rm ~/karbar/db/backups/Karbar_DB.bak`.
- Remove real secrets (database password, JWT key, the unused `SapSettings` block) from `appsettings.json` in the repo. On AWS they come from `.env`.
- Store `karbar-key.pem`, the server's `.env`, the Elastic IP and the bucket name in a password manager.

---

# Part 3 – Run it

## Go-live day

To switch users from `projectdev` to AWS without losing data:

1. Tell users the app will be unavailable for a short time, and stop the old app (or make it read-only).
2. Take a **fresh** backup on `projectdev` ([Step 1](#step-1--check-the-database-and-take-a-backup)).
3. Restore it on the server over the test data ([Restoring a newer backup](#restoring-a-newer-backup)).
4. Run the checks in [Step 16](#step-16--test).
5. If users used a different address before, point it at the load balancer ([Step 15](#step-15--point-your-domain-at-the-load-balancer)).

## Daily operations

☁️ **Server terminal** (`ssh karbar`, then `cd ~/karbar`):

| Task | Command |
|---|---|
| Status | `docker compose ps` |
| API logs (live) | `docker compose logs -f api` |
| Restart the API | `docker compose --profile local-db restart api` |
| Stop everything | `docker compose --profile local-db stop` |
| Start everything | `docker compose --profile local-db up -d` |
| Disk space | `df -h /` and `docker system df` |
| Last backups | `tail ~/karbar/backup.log` |
| List backups in S3 | `aws s3 ls s3://karbar-db-backups-2026x7/daily/` |
| Run a SQL query | `sql -d Karbar_DB -Q "SELECT TOP 5 * FROM ApiLogs ORDER BY Id DESC"` |
| OS updates | `sudo apt-get update && sudo apt-get -y upgrade` (then `sudo reboot` if asked) |

💻 **PC terminal:**

| Task | Command |
|---|---|
| Log in to the server | `ssh karbar` |
| Copy a file to the server | `scp <file> karbar:~` |
| Copy a file from the server | `scp karbar:~/karbar/backup.log .` |

**AWS console:**

| Task | Where |
|---|---|
| Stop / start / reboot the server | **EC2 → Instances** → `karbar-app` → **Instance state** (the Elastic IP stays the same) |
| SSH stopped working (new home/office IP) | **Security Groups → `karbar-ec2` → Edit inbound rules** → SSH → **My IP** |
| Download a database backup | **S3** → bucket → `daily/` → file → **Download** |

**Open the server's database in SSMS.** 💻 Start an SSH tunnel and keep the terminal open:

```bash
ssh -N -L 14330:127.0.0.1:1433 karbar
```

In SSMS on the same PC, connect to server `localhost,14330` with SQL Server Authentication (`sa` or `testuser`). Under **Options**, tick **Trust server certificate**.

## Updating the app

**If you use Git.** ☁️ **Server terminal:**

```bash
cd ~/karbar
git pull
docker compose --profile local-db up -d --build      # rebuilds and restarts only what changed
docker image prune -f                                # free disk space from old images
```

**If you copy with `rsync`.** Run the 💻 `rsync` command from [Step 8](#step-8--copy-the-code-and-the-backup-to-the-server) again, then the two `docker` commands above on ☁️.

The database and uploaded images live in Docker volumes and aren't affected.

## Restoring a newer backup

Use this for go-live, or to recover from a nightly backup.

**1. Get the backup onto the server, into the home folder:**

```bash
# 💻 PC terminal – a fresh backup from projectdev:
scp db/backups/Karbar_DB.bak karbar:~
```

```bash
# ☁️ Server terminal – or a nightly backup from S3:
aws s3 ls s3://karbar-db-backups-2026x7/daily/
aws s3 cp s3://karbar-db-backups-2026x7/daily/<file>.bak ~/Karbar_DB.bak
```

**2. Restore it.** ☁️ **Server terminal:**

```bash
cd ~/karbar
sudo mv ~/Karbar_DB.bak db/backups/Karbar_DB.bak
sudo chown 10001:0 db/backups/Karbar_DB.bak

docker compose stop api
sql -Q "ALTER DATABASE Karbar_DB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;"
sql -Q "RESTORE DATABASE Karbar_DB FROM DISK='/var/opt/mssql/backup/Karbar_DB.bak'
        WITH MOVE 'Karbar_DB'     TO '/var/opt/mssql/data/Karbar_DB.mdf',
             MOVE 'Karbar_DB_log' TO '/var/opt/mssql/data/Karbar_DB_log.ldf',
             REPLACE, STATS = 10"
sql -Q "ALTER DATABASE Karbar_DB SET MULTI_USER;"
sql -d Karbar_DB -Q "ALTER USER testuser WITH LOGIN = testuser;"
docker compose --profile local-db up -d api
```

## If the server is lost

**Fastest: launch from the latest disk snapshot.** AWS console:
1. **EC2 → Snapshots** → the latest `karbar-app` snapshot → **Actions → Create image from snapshot** → architecture x86_64, root device `/dev/sda1` → **Create image**.
2. **AMIs** → the new image → **Launch instance from AMI**, with the same settings as [Step 5](#step-5--launch-the-ec2-server): `t3.large`, `karbar-key`, `karbar-ec2`, `karbar-ec2-role`.
3. **Elastic IPs** → your IP → **Associate** with the new instance. `ssh karbar` keeps working.
4. **Target Groups** → `karbar-web-tg` and `karbar-api-tg` → **Targets → Register targets** → the new instance (ports 80 / 8080). Then deregister the old one.

Everything is back as of the snapshot. If you need newer data, restore that night's database backup on top ([Restoring a newer backup](#restoring-a-newer-backup)).

**From scratch:** Steps 5–12 (use your saved `.env`, and restore the latest backup from S3 in Step 10). Then do item 4 above.

## No domain yet?

You can test with the load balancer's own address, over plain HTTP:

1. Skip Steps 13 and 15.
2. In Step 14.2, create only the **HTTP : 80** listener (forward to `karbar-web-tg`). Add the `/api/*` + `/Images/*` rule from 14.3 to **that** listener, and skip 14.4.
3. ☁️ In `.env`, set `API_BASE_URL=http://<load balancer DNS name>/api/`, then run `docker compose --profile local-db up -d --build web`.

Use this for testing only. Logins and data travel unencrypted. Once you have a domain, do Steps 13–15 and change `API_BASE_URL` back.

## Troubleshooting

| Problem | Fix |
|---|---|
| **Local:** `sqlserver` stops right after starting | `SQL_SA_PASSWORD` is too weak. Check `docker compose logs sqlserver`. |
| **WSL:** `docker: command not found` | Docker Desktop → **Settings → Resources → WSL integration** → turn on your Ubuntu distro. |
| SSH: *UNPROTECTED PRIVATE KEY FILE* | `chmod 400 ~/.ssh/karbar-key.pem`, and keep the key in `~/.ssh`, not on `/mnt/c` or `/mnt/d`. |
| SSH: *Connection timed out* | Your IP changed. Update the SSH rule in `karbar-ec2` to **My IP**. |
| `aws s3 ls` on the server: *Unable to locate credentials* | The IAM role isn't attached. **EC2 → `karbar-app` → Actions → Security → Modify IAM role** → `karbar-ec2-role`. |
| `sqlserver` keeps restarting on the server | `docker compose logs sqlserver`. Usually the password is too weak, or the disk is full (`df -h`). |
| API log: *network-related or instance-specific error* | SQL Server isn't running. You probably left out `--profile local-db`. |
| API log: *Login failed for user 'testuser'* | Run Step 10.3 again. The password must match `DB_CONNECTION` in `.env`. |
| RESTORE: *Operating system error 2* / *access denied* | The `.bak` isn't in `~/karbar/db/backups`, or isn't owned by user 10001. Run `sudo chown 10001:0 ~/karbar/db/backups/*.bak`. |
| RESTORE: *backed up on a server running version …* | The backup is from a newer SQL Server. Use the `2025-latest` image (Step 1). |
| RESTORE: *exceeds the license limit of 10240 MB* | The database is over 10 GB, which Express can't hold. See Step 1. |
| RESTORE: *exclusive access could not be obtained* | Stop the API, and set `SINGLE_USER` first ([Restoring a newer backup](#restoring-a-newer-backup)). |
| Build killed / *exit code 137* | Out of memory. Lower `MSSQL_MEMORY_LIMIT_MB`, or stop SQL Server while building. |
| Certificate stays *Pending validation* | The CNAME record is missing or mistyped (Step 13). Check with `dig +short CNAME <name>`. |
| Target **unhealthy** / site shows **502/503** | ☁️ Run `docker compose ps` and the `curl` checks from Step 11. `karbar-ec2` must allow 80 and 8080 **from `karbar-alb`** (Step 3). |
| Site loads but API calls go to the wrong URL | `API_BASE_URL` was wrong when `web` was built. Fix `.env`, run `docker compose --profile local-db up -d --build web`, then press Ctrl+F5 in the browser. |
| API calls return HTML instead of JSON | The `/api/*` rule is missing, or it's on the wrong listener (it must be on HTTPS:443, Step 14.3). |
| Images are `http://` or blocked | The API must see `X-Forwarded-Proto`. It's turned on in the API Dockerfile (`ASPNETCORE_FORWARDEDHEADERS_ENABLED=true`). Rebuild `api`. |
| SSMS tunnel won't connect | Keep the tunnel terminal open, and use `localhost,14330` (comma). `SQL_PORT` must be `127.0.0.1:1433`. |

## Delete everything

This **permanently deletes** the server, its data and all backups. Download any backups you want to keep first. **AWS console**, in this order:

1. **EC2 → Load Balancers** → `karbar-alb` → **Actions → Delete**.
2. **Target Groups** → `karbar-web-tg`, `karbar-api-tg` → **Actions → Delete**.
3. **Instances** → `karbar-app` → **Instance state → Terminate**.
4. **Elastic IPs** → your IP → **Actions → Release**. An unattached Elastic IP still costs money.
5. **Lifecycle Manager** → the snapshot policy → **Delete**. Then **Snapshots** → delete the `karbar-app` snapshots.
6. **Security Groups** → `karbar-ec2`, then `karbar-alb` → **Delete**.
7. **Key Pairs** → `karbar-key` → **Delete**.
8. **Certificate Manager** → the certificate → **Delete**.
9. **S3** → the bucket → **Empty**, then **Delete**.
10. **IAM → Roles** → `karbar-ec2-role` → **Delete**.
11. Remove the DNS records from Steps 13 and 15.

## Appendix – Moving the database to RDS later

If the database grows past 10 GB, or you want AWS to handle database backups and patching, you can move it to **Amazon RDS for SQL Server** without changing the app:

1. **RDS → Create database** → SQL Server, no public access, with a security group that allows port 1433 only from `karbar-ec2`. Attach an **option group** with `SQLSERVER_BACKUP_RESTORE`, and an IAM role that can read the backup bucket.
2. ☁️ Run `~/karbar/backup-db.sh` to get a fresh backup into S3.
3. 💻 Open a tunnel with `ssh -N -L 14330:<RDS endpoint>:1433 karbar`, connect SSMS to `localhost,14330`, then restore and relink the login:

   ```sql
   EXEC msdb.dbo.rds_restore_database @restore_db_name='Karbar_DB',
        @s3_arn_to_restore_from='arn:aws:s3:::<bucket>/daily/<file>.bak';
   EXEC msdb.dbo.rds_task_status @db_name='Karbar_DB';     -- repeat until SUCCESS
   CREATE LOGIN testuser WITH PASSWORD='<APP_DB_PASSWORD>';
   USE Karbar_DB; ALTER USER testuser WITH LOGIN = testuser;
   ```

4. ☁️ In `.env`, set `DB_CONNECTION` to `Server=<RDS endpoint>,1433;...`. From then on, run `docker compose up -d` **without** `--profile local-db`, and run `docker compose stop sqlserver`.
5. ☁️ Remove the backup cron job (`crontab -e`). RDS automated backups replace it.
