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

## Contents

**Part 1 – Run on your PC**
- [1.1 Quick start](#11-quick-start)
- [1.2 Restore the existing database into Docker](#12-restore-the-existing-database-into-docker)

**Part 2 – Deploy to AWS (one EC2 server)**
- [How it fits together](#how-it-fits-together) · [What you need](#what-you-need) · [All steps at a glance](#all-steps-at-a-glance)
- [Step 0](#step-0--install-the-aws-cli-and-sign-in) AWS CLI · [1](#step-1--check-the-database-and-take-a-backup) Backup · [2](#step-2--create-the-key-pair-pem) Key pair · [3](#step-3--create-the-security-groups) Security groups · [4](#step-4--create-the-backup-bucket-and-the-servers-iam-role) S3 + IAM · [5](#step-5--launch-the-ec2-server) EC2 · [6](#step-6--connect-to-the-server-with-the-pem-key) SSH · [7](#step-7--install-docker-on-the-server) Docker · [8](#step-8--copy-the-code-and-the-backup-to-the-server) Copy · [9](#step-9--create-env-on-the-server) `.env` · [10](#step-10--restore-the-database) Restore · [11](#step-11--build-and-start-the-app) Start · [12](#step-12--set-up-automatic-backups) Backups · [13](#step-13--request-the-https-certificate) Certificate · [14](#step-14--create-the-load-balancer) Load balancer · [15](#step-15--point-your-domain-at-the-load-balancer) DNS · [16](#step-16--test) Test · [17](#step-17--save-the-ids-and-tidy-up) Tidy up

**Part 3 – Run it**
- [Go-live day](#go-live-day) · [Daily operations](#daily-operations) · [Updating the app](#updating-the-app) · [Restoring a newer backup](#restoring-a-newer-backup) · [If the server is lost](#if-the-server-is-lost)
- [No domain yet?](#no-domain-yet) · [Troubleshooting](#troubleshooting) · [Delete everything](#delete-everything) · [Appendix: moving to RDS later](#appendix--moving-the-database-to-rds-later)

---

# Part 1 – Run on your PC

## 1.1 Quick start

Needs Docker Desktop.

```powershell
cd d:\Personal\Karber-deply-AWS-Docker
cp .env.example .env                               # then fill in real values
docker compose up -d --build                       # app only, using an external database
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

> Run the `docker` commands in **PowerShell**. Git Bash changes paths like `/var/opt/...` before Docker sees them, and the commands fail.

1. **Back up** on `projectdev` (in SSMS):

   ```sql
   BACKUP DATABASE Karbar_DB TO DISK = 'C:\Temp\Karbar_DB.bak' WITH COPY_ONLY, COMPRESSION, INIT, STATS = 10;
   ```

   Copy `Karbar_DB.bak` from `C:\Temp` on that machine to `db\backups\` in this repo.

2. **Start SQL Server.** First set a strong `SQL_SA_PASSWORD` in `.env`: 8+ characters, with upper case, lower case, a digit and a symbol.

   ```powershell
   docker compose --profile local-db up -d sqlserver
   docker compose logs -f sqlserver     # wait for "SQL Server is now ready for client connections", then Ctrl+C
   ```

3. **Find the file names inside the backup.** Note the two `LogicalName` values (data and log):

   ```powershell
   docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "<SQL_SA_PASSWORD>" -C `
     -Q "RESTORE FILELISTONLY FROM DISK='/var/opt/mssql/backup/Karbar_DB.bak'"
   ```

4. **Restore.** Replace `Karbar_DB` / `Karbar_DB_log` with the names from step 3:

   ```powershell
   docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "<SQL_SA_PASSWORD>" -C `
     -Q "RESTORE DATABASE Karbar_DB FROM DISK='/var/opt/mssql/backup/Karbar_DB.bak' WITH MOVE 'Karbar_DB' TO '/var/opt/mssql/data/Karbar_DB.mdf', MOVE 'Karbar_DB_log' TO '/var/opt/mssql/data/Karbar_DB_log.ldf', REPLACE, STATS = 10"
   ```

5. **Recreate the app login.** Logins aren't stored in the backup. The second command links the restored `testuser` user to the new login:

   ```powershell
   docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "<SQL_SA_PASSWORD>" -C `
     -Q "CREATE LOGIN testuser WITH PASSWORD='<APP_DB_PASSWORD>', CHECK_POLICY=OFF; USE Karbar_DB; ALTER USER testuser WITH LOGIN = testuser;"
   ```

6. **Point the API at it.** In `.env`:

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

- An **AWS account** and an IAM user that can create EC2, S3, IAM, ACM, Route 53 and load balancer resources, plus an **access key** for that user, for the AWS CLI.
- A **domain name** you can add DNS records to. Without one, see [No domain yet?](#no-domain-yet).
- On your PC: PowerShell, `ssh` / `scp` / `tar` (built into Windows 10/11), SSMS, and access to `projectdev`.

Every AWS step below shows **two ways** to do it. Pick one per step:
- **CLI**: copy the PowerShell commands. They're quickest and easy to repeat.
- **Console**: click through the AWS web console instead.

> **Run all CLI commands in one PowerShell window, in order**, from `d:\Personal\Karber-deply-AWS-Docker`. Later commands reuse `$variables` from earlier ones. If you close the window, [reload them](#step-17--save-the-ids-and-tidy-up).
>
> PowerShell tip: arguments containing commas must be in **quotes**, e.g. `"Type=forward,TargetGroupArn=$TG_WEB"`. Otherwise PowerShell splits them and the command fails.

## All steps at a glance

| #  | Step | Where | Time |
|----|------|-------|------|
| 0  | Install the AWS CLI and sign in | Your PC | 5 min |
| 1  | Check the database and take a backup | SSMS on `projectdev` | 10 min |
| 2  | Create the key pair (`karbar-key.pem`) | Your PC | 1 min |
| 3  | Create the security groups | Your PC | 2 min |
| 4  | Create the backup bucket and the server's IAM role | Your PC | 2 min |
| 5  | Launch the EC2 server | Your PC | 3 min |
| 6  | Connect to the server with the `.pem` key | Your PC → server | 1 min |
| 7  | Install Docker | Server | 3 min |
| 8  | Copy the code and the backup | Your PC → server | 5 min |
| 9  | Create `.env` | Server | 5 min |
| 10 | Restore the database | Server | 5–15 min |
| 11 | Build and start the app | Server | 10 min |
| 12 | Set up automatic backups | Server + your PC | 10 min |
| 13 | Request the HTTPS certificate | Your PC + DNS | 5–30 min |
| 14 | Create the load balancer | Your PC | 5 min |
| 15 | Point your domain at the load balancer | Your PC / DNS | 5 min |
| 16 | Test | Browser | 10 min |
| 17 | Save the IDs and tidy up | Your PC + server | 5 min |

---

## Step 0 – Install the AWS CLI and sign in

```powershell
winget install -e --id Amazon.AWSCLI     # then close and reopen PowerShell
aws --version

aws configure
#   AWS Access Key ID:     <IAM → Users → your user → Security credentials → Create access key>
#   AWS Secret Access Key: <...>
#   Default region name:   ap-southeast-1
#   Default output format: json

aws sts get-caller-identity              # shows your account ID = signed in correctly
```

Set the values that every later step uses. **Change `$DOMAIN`**, and also `$REGION` if you use a different region:

```powershell
cd d:\Personal\Karber-deply-AWS-Docker
$REGION = "ap-southeast-1"
$env:AWS_DEFAULT_REGION = $REGION
$DOMAIN = "karbar.example.com"
$BUCKET = "karbar-db-backups-$(Get-Random)"       # S3 names must be globally unique
$MYIP   = (Invoke-RestMethod https://checkip.amazonaws.com).Trim()

# Writes a file without a BOM (the AWS CLI can't read Windows PowerShell's default UTF-8 BOM)
function Save-File($name, $text) { [IO.File]::WriteAllText((Join-Path $PWD $name), $text) }
```

> **Create everything in the same region.** In the console, check the region selector at the top right on every page.

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

**CLI:**

```powershell
$key = aws ec2 create-key-pair --key-name karbar-key --key-type rsa --key-format pem `
         --query KeyMaterial --output text
Save-File "karbar-key.pem" (($key -join "`n") + "`n")
```

**Console:** **EC2 → Key pairs → Create key pair** → name `karbar-key`, type **RSA**, format **.pem** → **Create**. The file downloads. Move it to `d:\Personal\Karber-deply-AWS-Docker\`.

**Either way**, lock the file down so only you can read it. Otherwise `ssh` refuses to use it:

```powershell
icacls .\karbar-key.pem /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

> ⚠️ AWS gives you the private key **only once**. Store a copy in a password manager. Without it you can't log in to the server. `*.pem` is in `.gitignore`. **Never** commit it or send it in chat or email.

To use an SSH key you already have instead: `aws ec2 import-key-pair --key-name karbar-key --public-key-material fileb://$HOME/.ssh/id_rsa.pub`

## Step 3 – Create the security groups

Security groups are firewalls:

| Name         | Allows in                                                                           |
|--------------|-------------------------------------------------------------------------------------|
| `karbar-alb` | Ports 80 and 443 from anywhere: the public website                                 |
| `karbar-ec2` | Port 22 from **your IP only** (SSH), and ports 80 and 8080 **from the load balancer only** |

**CLI:**

```powershell
# Default network
$VPC = aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query "Vpcs[0].VpcId" --output text
$SUBNETS = (aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC" "Name=default-for-az,Values=true" `
             --query "Subnets[].SubnetId" --output text) -split "\s+"
$VPC; $SUBNETS      # one vpc-… and at least two subnet-…

$SG_ALB = aws ec2 create-security-group --group-name karbar-alb --description "Karbar load balancer" `
            --vpc-id $VPC --query GroupId --output text
aws ec2 authorize-security-group-ingress --group-id $SG_ALB --protocol tcp --port 80  --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ALB --protocol tcp --port 443 --cidr 0.0.0.0/0

$SG_EC2 = aws ec2 create-security-group --group-name karbar-ec2 --description "Karbar app server" `
            --vpc-id $VPC --query GroupId --output text
aws ec2 authorize-security-group-ingress --group-id $SG_EC2 --protocol tcp --port 22   --cidr "$MYIP/32"
aws ec2 authorize-security-group-ingress --group-id $SG_EC2 --protocol tcp --port 80   --source-group $SG_ALB
aws ec2 authorize-security-group-ingress --group-id $SG_EC2 --protocol tcp --port 8080 --source-group $SG_ALB
```

If `$VPC` is `None`, the account has no default VPC. Run `aws ec2 create-default-vpc`, then run the block again.

**Console:** **EC2 → Security Groups → Create security group**, twice, in the default VPC, with the inbound rules from the table. For the 80 and 8080 rules on `karbar-ec2`, set **Source** to the `karbar-alb` group. For SSH, choose **My IP**.

## Step 4 – Create the backup bucket and the server's IAM role

The server uploads its nightly database backups to S3. The IAM role gives it permission to do that, without storing AWS keys on the server.

**CLI:**

```powershell
# Private bucket, backups deleted after 30 days
aws s3 mb "s3://$BUCKET"
aws s3api put-public-access-block --bucket $BUCKET `
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
Save-File "lifecycle.json" @"
{ "Rules": [ { "ID": "expire-daily", "Status": "Enabled", "Filter": { "Prefix": "daily/" }, "Expiration": { "Days": 30 } } ] }
"@
aws s3api put-bucket-lifecycle-configuration --bucket $BUCKET --lifecycle-configuration file://lifecycle.json

# Role for the server: may read/write this bucket only
Save-File "trust.json" @"
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Principal": { "Service": "ec2.amazonaws.com" }, "Action": "sts:AssumeRole" } ] }
"@
Save-File "s3-policy.json" @"
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow",
  "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
  "Resource": ["arn:aws:s3:::$BUCKET", "arn:aws:s3:::$BUCKET/*"] } ] }
"@
aws iam create-role --role-name karbar-ec2-role --assume-role-policy-document file://trust.json
aws iam put-role-policy --role-name karbar-ec2-role --policy-name karbar-s3-backup --policy-document file://s3-policy.json
aws iam create-instance-profile --instance-profile-name karbar-ec2-role
aws iam add-role-to-instance-profile --instance-profile-name karbar-ec2-role --role-name karbar-ec2-role
Start-Sleep 15        # IAM needs a few seconds before EC2 can use the new role

"Bucket name: $BUCKET"     # you need this in Step 12
```

**Console:**
1. **S3 → Create bucket** → `karbar-db-backups-<random>`, **Block all public access** on. Then **Management → Create lifecycle rule** → prefix `daily/` → expire current versions after 30 days.
2. **IAM → Roles → Create role** → AWS service → **EC2** → skip the policy list → name `karbar-ec2-role` → **Create**.
3. Open the role → **Add permissions → Create inline policy → JSON**, paste the contents of `s3-policy.json` above with your bucket name, and name it `karbar-s3-backup`.

## Step 5 – Launch the EC2 server

| Setting        | Value |
|----------------|-------|
| Image          | Ubuntu Server 24.04 LTS, x86 |
| Type           | **t3.large** (2 vCPU, 8 GB). SQL Server, the API and the Angular build share it. |
| Disk           | 50 GB gp3, encrypted, tagged `Backup=karbar` for daily snapshots |
| Network        | default VPC, security group `karbar-ec2`, public IP |
| IAM role       | `karbar-ec2-role` |
| Public IP      | an **Elastic IP**, so the address never changes |

**CLI:**

```powershell
# Latest Ubuntu 24.04 image in this region (published by Canonical)
$AMI = aws ssm get-parameters --names /aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id `
         --query "Parameters[0].Value" --output text

$INSTANCE = aws ec2 run-instances `
  --image-id $AMI --instance-type t3.large --key-name karbar-key `
  --security-group-ids $SG_EC2 --subnet-id $SUBNETS[0] --associate-public-ip-address `
  --iam-instance-profile Name=karbar-ec2-role `
  --block-device-mappings "DeviceName=/dev/sda1,Ebs={VolumeSize=50,VolumeType=gp3,Encrypted=true}" `
  --metadata-options "HttpTokens=required" `
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=karbar-app}]" "ResourceType=volume,Tags=[{Key=Name,Value=karbar-app},{Key=Backup,Value=karbar}]" `
  --query "Instances[0].InstanceId" --output text
aws ec2 wait instance-running --instance-ids $INSTANCE

# Elastic IP
$ALLOC = aws ec2 allocate-address --domain vpc --query AllocationId --output text
aws ec2 associate-address --instance-id $INSTANCE --allocation-id $ALLOC
$IP = aws ec2 describe-addresses --allocation-ids $ALLOC --query "Addresses[0].PublicIp" --output text
"Instance: $INSTANCE   Server IP: $IP"
```

**Console:**
1. **EC2 → Launch instance** → name `karbar-app` → **Ubuntu Server 24.04 LTS** → `t3.large` → key pair `karbar-key` → **Network settings: Edit** → select existing security group `karbar-ec2` → storage **50 GiB gp3** → **Advanced details → IAM instance profile** `karbar-ec2-role` → **Launch**.
2. **Elastic IPs → Allocate Elastic IP address → Actions → Associate** → instance `karbar-app`.
3. **Volumes** → the new volume → **Tags** → add `Backup` = `karbar`.

## Step 6 – Connect to the server with the `.pem` key

Wait about a minute after the server starts, then from PowerShell, in the folder with `karbar-key.pem`:

```powershell
ssh -i .\karbar-key.pem ubuntu@$IP          # or ubuntu@<the Elastic IP>
```

The first time, type `yes` to accept the server's fingerprint. Your prompt changes to `ubuntu@ip-…:~$`. You're now on the server.

| Problem | Fix |
|---|---|
| `UNPROTECTED PRIVATE KEY FILE` / `bad permissions` | Run the `icacls` command from Step 2. |
| `Connection timed out` | Your IP changed, or you're on a different network. Run `$MYIP = (Invoke-RestMethod https://checkip.amazonaws.com).Trim()`, then `aws ec2 authorize-security-group-ingress --group-id $SG_EC2 --protocol tcp --port 22 --cidr "$MYIP/32"`. |
| `Permission denied (publickey)` | Use user `ubuntu` (not `root` or `ec2-user`), and the `karbar-key.pem` from Step 2. |

To exit the server, type `exit`. The rest of this guide marks each block with where it runs: **On the server** or **On your PC**.

## Step 7 – Install Docker on the server

**On the server:**

```bash
sudo apt-get update && sudo apt-get -y upgrade
curl -fsSL https://get.docker.com | sudo sh     # Docker Engine + Compose + Buildx
sudo usermod -aG docker ubuntu                  # use docker without sudo
sudo timedatectl set-timezone Asia/Dhaka        # logs and backup times in local time
sudo snap install aws-cli --classic             # for uploading backups to S3
exit                                            # log out so the docker group applies
```

Connect again (Step 6), then check:

```bash
docker --version && docker compose version
aws s3 ls        # no error = the IAM role from Step 4 works
```

## Step 8 – Copy the code and the backup to the server

**Code – option 1, Git (recommended).** Push this repo to GitHub or GitLab first. **On the server:**

```bash
git clone <your-repo-url> ~/karbar
```

For a private repo, use a personal access token as the password, or add a deploy key.

**Code – option 2, copy from your PC.** **On your PC:**

```powershell
tar --exclude=node_modules --exclude=bin --exclude=obj --exclude=.angular --exclude=dist --exclude=*.bak `
    -czf karbar.tgz KARBAR_Web_App_API KARBAR_Web_App_Frontend db docker-compose.yml .env.example
scp -i .\karbar-key.pem karbar.tgz ubuntu@${IP}:~
ssh -i .\karbar-key.pem ubuntu@$IP "mkdir -p ~/karbar && tar -xzf ~/karbar.tgz -C ~/karbar && rm ~/karbar.tgz"
```

**Backup file.** **On your PC:**

```powershell
ssh -i .\karbar-key.pem ubuntu@$IP "mkdir -p ~/karbar/db/backups"
scp -i .\karbar-key.pem .\db\backups\Karbar_DB.bak ubuntu@${IP}:~/karbar/db/backups/
```

## Step 9 – Create `.env` on the server

**On the server:**

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

**On the server.** Start SQL Server:

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

**On the server:**

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

The API creates its `ApiLogs` table on first start. All containers restart automatically after a reboot. To prove it, run `sudo reboot`, reconnect after a minute, and run `docker compose ps`.

## Step 12 – Set up automatic backups

The database lives only on this server's disk. **Don't skip this step.**

**12.1 – Nightly database backup to S3.** **On the server:**

```bash
nano ~/karbar/backup-db.sh
```

Paste this in, and set `BUCKET` to the bucket name from Step 4:

```bash
#!/bin/bash
set -euo pipefail
cd /home/ubuntu/karbar
BUCKET=karbar-db-backups-XXXXXXXX
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
aws s3 ls s3://karbar-db-backups-XXXXXXXX/daily/

(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/karbar/backup-db.sh >> /home/ubuntu/karbar/backup.log 2>&1") | crontab -
crontab -l
```

**12.2 – Daily snapshot of the whole disk.** This also covers uploaded images and the server setup. **On your PC:**

```powershell
aws dlm create-default-role --resource-type snapshot
$DLM_ROLE = aws iam get-role --role-name AWSDataLifecycleManagerDefaultRole --query Role.Arn --output text
Save-File "dlm.json" @"
{ "PolicyType": "EBS_SNAPSHOT_MANAGEMENT", "ResourceTypes": ["VOLUME"],
  "TargetTags": [ { "Key": "Backup", "Value": "karbar" } ],
  "Schedules": [ { "Name": "Daily", "CopyTags": true,
                   "CreateRule": { "Interval": 24, "IntervalUnit": "HOURS", "Times": ["21:00"] },
                   "RetainRule": { "Count": 7 } } ] }
"@
aws dlm create-lifecycle-policy --description "Karbar daily snapshots" --state ENABLED `
  --execution-role-arn $DLM_ROLE --policy-details file://dlm.json
```

`21:00` is UTC, which is 3 AM in Dhaka. Snapshots are kept for 7 days.

**Console:** **EC2 → Lifecycle Manager → Create lifecycle policy** → EBS snapshot policy → target tag `Backup = karbar` → every 24 hours at 21:00 UTC → keep 7.

## Step 13 – Request the HTTPS certificate

The certificate from **AWS Certificate Manager (ACM)** is free and renews itself. It must be in the **same region** as the load balancer.

**CLI – request it, and print the DNS record that proves you own the domain:**

```powershell
$CERT = aws acm request-certificate --domain-name $DOMAIN --validation-method DNS `
          --query CertificateArn --output text
Start-Sleep 15
$rr = (aws acm describe-certificate --certificate-arn $CERT `
        --query "Certificate.DomainValidationOptions[0].ResourceRecord.[Name,Value]" --output text) -split "\s+"
"Add this DNS record:  CNAME  $($rr[0])  ->  $($rr[1])"
```

**Add that record to your DNS.** If your domain is in **Route 53**:

```powershell
$ZONE_NAME = ($DOMAIN -split '\.', 2)[1]          # karbar.example.com → example.com
$ZONE = ((aws route53 list-hosted-zones-by-name --dns-name $ZONE_NAME --query "HostedZones[0].Id" --output text) -split '/')[-1]
Save-File "acm-dns.json" @"
{ "Changes": [ { "Action": "UPSERT", "ResourceRecordSet": {
    "Name": "$($rr[0])", "Type": "CNAME", "TTL": 300, "ResourceRecords": [ { "Value": "$($rr[1])" } ] } } ] }
"@
aws route53 change-resource-record-sets --hosted-zone-id $ZONE --change-batch file://acm-dns.json
```

With **another DNS provider**, add the CNAME printed above in its control panel.

**Wait until it's issued.** Usually a few minutes; the command gives up after about 40:

```powershell
aws acm wait certificate-validated --certificate-arn $CERT
"Certificate issued"
```

**Console:** **Certificate Manager → Request → Public certificate** → domain `karbar.example.com` → **DNS validation** → open the certificate → **Create records in Route 53**, or copy the CNAME to your DNS provider → wait for **Issued**.

## Step 14 – Create the load balancer

This creates two **target groups** (the `web` and `api` containers on the server), the **load balancer**, its **listeners** (HTTPS 443, and HTTP 80 redirecting to HTTPS), and one **rule** that sends `/api/*` and `/Images/*` to the API.

**CLI:**

```powershell
# Target groups + register the server
$TG_WEB = aws elbv2 create-target-group --name karbar-web-tg --protocol HTTP --port 80 --vpc-id $VPC `
            --target-type instance --health-check-path /health `
            --query "TargetGroups[0].TargetGroupArn" --output text
$TG_API = aws elbv2 create-target-group --name karbar-api-tg --protocol HTTP --port 8080 --vpc-id $VPC `
            --target-type instance --health-check-path /swagger/v1/swagger.json `
            --query "TargetGroups[0].TargetGroupArn" --output text
aws elbv2 register-targets --target-group-arn $TG_WEB --targets "Id=$INSTANCE,Port=80"
aws elbv2 register-targets --target-group-arn $TG_API --targets "Id=$INSTANCE,Port=8080"

# Load balancer
$ALB = aws elbv2 create-load-balancer --name karbar-alb --type application --scheme internet-facing `
         --subnets $SUBNETS --security-groups $SG_ALB `
         --query "LoadBalancers[0].LoadBalancerArn" --output text
aws elbv2 wait load-balancer-available --load-balancer-arns $ALB

# HTTPS 443 → Angular app by default
$HTTPS = aws elbv2 create-listener --load-balancer-arn $ALB --protocol HTTPS --port 443 `
           --certificates "CertificateArn=$CERT" --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 `
           --default-actions "Type=forward,TargetGroupArn=$TG_WEB" `
           --query "Listeners[0].ListenerArn" --output text

# HTTP 80 → redirect to HTTPS
aws elbv2 create-listener --load-balancer-arn $ALB --protocol HTTP --port 80 `
  --default-actions "Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}"

# /api/* and /Images/* → API
Save-File "api-rule.json" @"
[ { "Field": "path-pattern", "PathPatternConfig": { "Values": ["/api/*", "/Images/*"] } } ]
"@
aws elbv2 create-rule --listener-arn $HTTPS --priority 1 --conditions file://api-rule.json `
  --actions "Type=forward,TargetGroupArn=$TG_API"

# Allow long reports/exports (default 60 s)
aws elbv2 modify-load-balancer-attributes --load-balancer-arn $ALB --attributes "Key=idle_timeout.timeout_seconds,Value=300"
```

Check that both targets say **healthy**. It takes 1–2 minutes:

```powershell
aws elbv2 describe-target-health --target-group-arn $TG_WEB --query "TargetHealthDescriptions[].TargetHealth.State" --output text
aws elbv2 describe-target-health --target-group-arn $TG_API --query "TargetHealthDescriptions[].TargetHealth.State" --output text
```

**Console:**
1. **EC2 → Target groups → Create**, twice. Type **Instances**:
   - `karbar-web-tg`: HTTP 80, health check `/health`
   - `karbar-api-tg`: HTTP 8080, health check `/swagger/v1/swagger.json`

   On **Register targets**, tick `karbar-app` → **Include as pending below** → **Create**.
2. **Load balancers → Create → Application Load Balancer** → `karbar-alb`, **Internet-facing**, at least two Availability Zones, security group `karbar-alb` only. Listeners: **HTTPS 443** → `karbar-web-tg` with the certificate from Step 13. **HTTP 80** → `karbar-web-tg`, which you change in item 4.
3. **Listener HTTPS:443 → Manage rules → Add rule** → condition **Path** `/api/*` and `/Images/*` → forward to `karbar-api-tg`, priority 1.
4. **Listener HTTP:80 → Edit** → **Redirect to URL** → HTTPS, port 443, 301.
5. **Attributes → Idle timeout** → 300.

## Step 15 – Point your domain at the load balancer

**CLI:**

```powershell
$albInfo = (aws elbv2 describe-load-balancers --load-balancer-arns $ALB `
              --query "LoadBalancers[0].[DNSName,CanonicalHostedZoneId]" --output text) -split "\s+"
"Load balancer DNS name: $($albInfo[0])"
```

If your domain is in **Route 53** (uses `$ZONE` from Step 13):

```powershell
Save-File "site-dns.json" @"
{ "Changes": [ { "Action": "UPSERT", "ResourceRecordSet": {
    "Name": "$DOMAIN", "Type": "A",
    "AliasTarget": { "HostedZoneId": "$($albInfo[1])", "DNSName": "dualstack.$($albInfo[0])", "EvaluateTargetHealth": true } } } ] }
"@
aws route53 change-resource-record-sets --hosted-zone-id $ZONE --change-batch file://site-dns.json
```

With **another DNS provider**, add a **CNAME** record from `karbar` to the load balancer DNS name printed above.

**Console (Route 53):** **Hosted zones → your domain → Create record** → name `karbar` → type **A** → **Alias** on → Application Load Balancer → region → `karbar-alb`.

DNS changes usually work within a few minutes. Some networks take up to an hour.

## Step 16 – Test

- [ ] `https://karbar.example.com` shows the login page with a valid padlock.
- [ ] `http://karbar.example.com` redirects to `https://`.
- [ ] Login works. In the browser dev tools **Network** tab, API calls go to `https://karbar.example.com/api/...` and return 200.
- [ ] Screens with item or user images show them, and image URLs start with `https://karbar.example.com/Images/...`.
- [ ] Uploading an image works, and the image is still there after `docker compose --profile local-db restart api` (on the server).
- [ ] The data matches `projectdev`: open a few records and compare.
- [ ] The next morning: `tail ~/karbar/backup.log` on the server shows `OK`, and `aws s3 ls "s3://$BUCKET/daily/"` lists the file.

## Step 17 – Save the IDs and tidy up

**On your PC.** Save every resource ID so you can run CLI commands later, then delete the helper files:

```powershell
@"
REGION=$REGION
DOMAIN=$DOMAIN
BUCKET=$BUCKET
VPC=$VPC
SUBNETS=$($SUBNETS -join ' ')
SG_ALB=$SG_ALB
SG_EC2=$SG_EC2
INSTANCE=$INSTANCE
ALLOC=$ALLOC
IP=$IP
CERT=$CERT
TG_WEB=$TG_WEB
TG_API=$TG_API
ALB=$ALB
HTTPS=$HTTPS
ZONE=$ZONE
"@ | Set-Content -Encoding ascii karbar-aws-ids.txt

Remove-Item lifecycle.json, trust.json, s3-policy.json, dlm.json, acm-dns.json, api-rule.json, site-dns.json -ErrorAction SilentlyContinue
```

In any new PowerShell window, **reload them** with:

```powershell
cd d:\Personal\Karber-deply-AWS-Docker
Get-Content karbar-aws-ids.txt | ForEach-Object { $k, $v = $_ -split '=', 2; Set-Variable $k $v }
$SUBNETS = $SUBNETS -split ' '; $env:AWS_DEFAULT_REGION = $REGION
function Save-File($name, $text) { [IO.File]::WriteAllText((Join-Path $PWD $name), $text) }
```

**Tidy up:**
- On the server, delete the setup backup: `sudo rm ~/karbar/db/backups/Karbar_DB.bak`. On your PC, delete `karbar.tgz`.
- Remove real secrets (database password, JWT key, the unused `SapSettings` block) from `appsettings.json` in the repo. On AWS they come from `.env`.
- Store `karbar-key.pem`, the server's `.env` and `karbar-aws-ids.txt` in a password manager.

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

**On the server**, in `~/karbar`:

| Task | Command |
|---|---|
| Status | `docker compose ps` |
| API logs (live) | `docker compose logs -f api` |
| Restart the API | `docker compose --profile local-db restart api` |
| Stop everything | `docker compose --profile local-db stop` |
| Start everything | `docker compose --profile local-db up -d` |
| Disk space | `df -h /` and `docker system df` |
| Last backups | `tail ~/karbar/backup.log` |
| Run a SQL query | `sql -d Karbar_DB -Q "SELECT TOP 5 * FROM ApiLogs ORDER BY Id DESC"` |
| OS updates | `sudo apt-get update && sudo apt-get -y upgrade` (then `sudo reboot` if asked) |

**On your PC:**

| Task | Command |
|---|---|
| Log in to the server | `ssh -i .\karbar-key.pem ubuntu@$IP` |
| Stop / start the server | `aws ec2 stop-instances --instance-ids $INSTANCE` / `aws ec2 start-instances --instance-ids $INSTANCE` |
| List database backups | `aws s3 ls "s3://$BUCKET/daily/"` |
| Download a backup | `aws s3 cp "s3://$BUCKET/daily/<file>.bak" .\db\backups\` |
| Allow SSH from a new IP | `aws ec2 authorize-security-group-ingress --group-id $SG_EC2 --protocol tcp --port 22 --cidr "$((Invoke-RestMethod https://checkip.amazonaws.com).Trim())/32"` |

**Open the server's database in SSMS on your PC.** Start an SSH tunnel and keep the window open:

```powershell
ssh -i .\karbar-key.pem -N -L 14330:127.0.0.1:1433 ubuntu@$IP
```

In SSMS, connect to server `localhost,14330` with SQL Server Authentication (`sa` or `testuser`). Under **Options**, tick **Trust server certificate**.

## Updating the app

**On the server:**

```bash
cd ~/karbar
git pull                                             # or copy a new code archive as in Step 8
docker compose --profile local-db up -d --build      # rebuilds and restarts only what changed
docker image prune -f                                # free disk space from old images
```

The database and uploaded images live in Docker volumes and aren't affected.

## Restoring a newer backup

Use this for go-live, or to recover from a nightly backup.

**1. Get the backup onto the server, into the home folder:**

```powershell
# On your PC – a fresh backup from projectdev:
scp -i .\karbar-key.pem .\db\backups\Karbar_DB.bak ubuntu@${IP}:~
```

```bash
# Or on the server – a nightly backup from S3:
aws s3 ls s3://karbar-db-backups-XXXXXXXX/daily/
aws s3 cp s3://karbar-db-backups-XXXXXXXX/daily/<file>.bak ~/Karbar_DB.bak
```

**2. Restore it. On the server:**

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

**Fastest: restore the latest disk snapshot.** In the console, go to **EC2 → Snapshots** → the latest `karbar-app` snapshot → **Create volume**, or **Create image** and launch from it. Then attach the Elastic IP, and register the new instance in both target groups (Step 14). Everything is back as of the snapshot. If you need newer data, restore that night's database backup on top.

**From scratch:**
1. Steps 5–9: new server, Docker, code, and `.env` from your password-manager copy.
2. Get the latest backup from S3 and restore it ([Restoring a newer backup](#restoring-a-newer-backup), then Step 10.3).
3. Steps 11–12.1: start the app and set up the backup cron again.
4. Register the new instance in both target groups, and remove the old one:

   ```powershell
   aws elbv2 register-targets   --target-group-arn $TG_WEB --targets "Id=<new-instance-id>,Port=80"
   aws elbv2 register-targets   --target-group-arn $TG_API --targets "Id=<new-instance-id>,Port=8080"
   aws elbv2 deregister-targets --target-group-arn $TG_WEB --targets "Id=$INSTANCE,Port=80"
   aws elbv2 deregister-targets --target-group-arn $TG_API --targets "Id=$INSTANCE,Port=8080"
   ```

## No domain yet?

You can test with the load balancer's own address, over plain HTTP:

1. Skip Steps 13 and 15.
2. In Step 14, don't create the HTTPS listener or the redirect. Create the **HTTP 80** listener forwarding to `karbar-web-tg`, and add the `/api/*`, `/Images/*` rule to **that** listener:

   ```powershell
   $HTTP = aws elbv2 create-listener --load-balancer-arn $ALB --protocol HTTP --port 80 `
             --default-actions "Type=forward,TargetGroupArn=$TG_WEB" --query "Listeners[0].ListenerArn" --output text
   aws elbv2 create-rule --listener-arn $HTTP --priority 1 --conditions file://api-rule.json --actions "Type=forward,TargetGroupArn=$TG_API"
   aws elbv2 describe-load-balancers --load-balancer-arns $ALB --query "LoadBalancers[0].DNSName" --output text
   ```

3. On the server, set `API_BASE_URL=http://<load balancer DNS name>/api/` in `.env`, then run `docker compose --profile local-db up -d --build web`.

Use this for testing only. Logins and data travel unencrypted.

## Troubleshooting

| Problem | Fix |
|---|---|
| **Local:** `sqlserver` stops right after starting | `SQL_SA_PASSWORD` is too weak. Check `docker compose logs sqlserver`. |
| **Local:** `docker exec` path errors in Git Bash | Use PowerShell, or put `MSYS_NO_PATHCONV=1` in front of the command. |
| AWS CLI: *Unable to parse parameter* / *Invalid JSON* | An argument with commas wasn't in quotes, or a JSON file was saved with a BOM. Use `Save-File` from Step 0. |
| AWS CLI: `"@` error | The closing `"@` must be at the very start of its line. |
| SSH: *UNPROTECTED PRIVATE KEY FILE* | Run the `icacls` command from Step 2. |
| SSH: *Connection timed out* | Your IP changed. Allow the new one ([Daily operations](#daily-operations)). |
| `sqlserver` keeps restarting on the server | `docker compose logs sqlserver`. Usually the password is too weak, or the disk is full (`df -h`). |
| API log: *network-related or instance-specific error* | SQL Server isn't running. You probably left out `--profile local-db`. |
| API log: *Login failed for user 'testuser'* | Run Step 10.3 again. The password must match `DB_CONNECTION` in `.env`. |
| RESTORE: *Operating system error 2* / *access denied* | The `.bak` isn't in `~/karbar/db/backups`, or isn't owned by user 10001. Run `sudo chown 10001:0 db/backups/*.bak`. |
| RESTORE: *backed up on a server running version …* | The backup is from a newer SQL Server. Use the `2025-latest` image (Step 1). |
| RESTORE: *exceeds the license limit of 10240 MB* | The database is over 10 GB, which Express can't hold. See Step 1. |
| RESTORE: *exclusive access could not be obtained* | Stop the API, and set `SINGLE_USER` first ([Restoring a newer backup](#restoring-a-newer-backup)). |
| Build killed / *exit code 137* | Out of memory. Lower `MSSQL_MEMORY_LIMIT_MB`, or stop SQL Server while building. |
| Certificate stays *Pending validation* | The ACM CNAME record is missing or mistyped (Step 13). Check it with `nslookup -type=CNAME <record name>`. |
| Target **unhealthy** / site shows **502/503** | On the server, run `docker compose ps` and the `curl` checks from Step 11. `karbar-ec2` must allow 80 and 8080 **from `karbar-alb`**. |
| Site loads but API calls go to the wrong URL | `API_BASE_URL` was wrong when `web` was built. Fix `.env`, run `docker compose --profile local-db up -d --build web`, then press Ctrl+F5 in the browser. |
| API calls return HTML instead of JSON | The `/api/*` rule is missing, or it's on the wrong listener (it must be on HTTPS 443). |
| Images are `http://` or blocked | The API must see `X-Forwarded-Proto`. It's turned on in the API Dockerfile (`ASPNETCORE_FORWARDEDHEADERS_ENABLED=true`). Rebuild `api`. |
| Backup script: *Unable to locate credentials* | The IAM role isn't attached to the server. Run `aws ec2 associate-iam-instance-profile --instance-id $INSTANCE --iam-instance-profile Name=karbar-ec2-role`. |
| SSMS tunnel won't connect | Keep the SSH window open, and use `localhost,14330` (comma). `SQL_PORT` must be `127.0.0.1:1433`. |

## Delete everything

This **permanently deletes** the server, its data and all backups. Download any backups you want to keep first. **On your PC**, with the IDs loaded (Step 17):

```powershell
aws elbv2 delete-load-balancer --load-balancer-arn $ALB
aws elbv2 wait load-balancers-deleted --load-balancer-arns $ALB
aws elbv2 delete-target-group --target-group-arn $TG_WEB
aws elbv2 delete-target-group --target-group-arn $TG_API
aws ec2 terminate-instances --instance-ids $INSTANCE
aws ec2 wait instance-terminated --instance-ids $INSTANCE
aws ec2 release-address --allocation-id $ALLOC
aws ec2 delete-security-group --group-id $SG_EC2
aws ec2 delete-security-group --group-id $SG_ALB
aws acm delete-certificate --certificate-arn $CERT
aws s3 rb "s3://$BUCKET" --force
aws iam remove-role-from-instance-profile --instance-profile-name karbar-ec2-role --role-name karbar-ec2-role
aws iam delete-instance-profile --instance-profile-name karbar-ec2-role
aws iam delete-role-policy --role-name karbar-ec2-role --policy-name karbar-s3-backup
aws iam delete-role --role-name karbar-ec2-role
aws ec2 delete-key-pair --key-name karbar-key
```

Also delete these: the snapshot policy (`aws dlm get-lifecycle-policies`, then `aws dlm delete-lifecycle-policy --policy-id <id>`), old snapshots (**EC2 → Snapshots**), and the DNS records from Steps 13 and 15.

## Appendix – Moving the database to RDS later

If the database grows past 10 GB, or you want AWS to handle database backups and patching, you can move it to **Amazon RDS for SQL Server** without changing the app:

1. Create an RDS SQL Server instance with no public access, and a security group that allows port 1433 only from `karbar-ec2`. Attach an **option group** with `SQLSERVER_BACKUP_RESTORE`, and an IAM role that can read the backup bucket.
2. On the server, run `~/karbar/backup-db.sh` to get a fresh backup into S3.
3. Connect to RDS from SSMS, through an SSH tunnel to `<RDS endpoint>:1433`. Then restore and relink the login:

   ```sql
   EXEC msdb.dbo.rds_restore_database @restore_db_name='Karbar_DB',
        @s3_arn_to_restore_from='arn:aws:s3:::<bucket>/daily/<file>.bak';
   EXEC msdb.dbo.rds_task_status @db_name='Karbar_DB';     -- repeat until SUCCESS
   CREATE LOGIN testuser WITH PASSWORD='<APP_DB_PASSWORD>';
   USE Karbar_DB; ALTER USER testuser WITH LOGIN = testuser;
   ```

4. In `.env`, set `DB_CONNECTION` to `Server=<RDS endpoint>,1433;...`. From then on, run `docker compose up -d` **without** `--profile local-db`, and run `docker compose stop sqlserver`.
5. Remove the backup cron job (`crontab -e`). RDS automated backups replace it.
