# Karbar – Docker Setup

This repo runs the Karbar app in Docker:

| Service     | Source                     | Port  | Notes                                              |
|-------------|----------------------------|-------|----------------------------------------------------|
| `api`       | `KARBAR_Web_App_API`       | 8080  | ASP.NET Core (.NET 9)                              |
| `web`       | `KARBAR_Web_App_Frontend`  | 80    | Angular app served by nginx                        |
| `sqlserver` | `mssql/server:2022-latest` | 1433  | Optional. Starts only with `--profile local-db`    |

## Quick start

```powershell
cp .env.example .env                               # fill in real values
docker compose up -d --build                       # uses an external database
docker compose --profile local-db up -d --build    # also starts SQL Server in Docker
```

- Web: http://localhost
- API / Swagger: http://localhost:8080/swagger

All passwords and keys come from `.env`. `.env` is git-ignored, so never commit it.

---

## Move the existing database into the Docker SQL Server

These steps copy `Karbar_DB` from the current server (`projectdev`) into the `sqlserver` container. The method is backup → copy the file → restore.

> Run the `docker` commands in **PowerShell**. Git Bash changes paths like `/var/opt/...` before Docker sees them, and the commands fail. If you must use Git Bash, put `MSYS_NO_PATHCONV=1` in front of each command.

### Before you start

- **Check the SQL Server version.** A backup only restores onto the same or a newer version. Run `SELECT @@VERSION` on `projectdev`. If it's SQL Server 2025, change the image in `docker-compose.yml` to `mcr.microsoft.com/mssql/server:2025-latest`.
- **Set a strong `SQL_SA_PASSWORD` in `.env`.** It needs at least 8 characters, with upper case, lower case, a digit and a symbol. If it's too weak, the container stops right after starting.

### Step 1 – Back up the database on `projectdev`

In SSMS, connected to `projectdev`:

```sql
BACKUP DATABASE Karbar_DB
TO DISK = 'C:\Temp\Karbar_DB.bak'
WITH COPY_ONLY, COMPRESSION, INIT, STATS = 10;
```

- `COPY_ONLY` means this backup doesn't interfere with the server's scheduled backups.
- `C:\Temp` is a folder **on the `projectdev` machine**. The SQL Server service account must be able to write to it.

You can also do this from the SSMS menus: right-click the database → **Tasks → Back Up…** → tick **Copy-only backup**.

### Step 2 – Copy the backup into the project

Copy `Karbar_DB.bak` to:

```
db/backups/Karbar_DB.bak
```

Inside the container, this folder is `/var/opt/mssql/backup`. `*.bak` files are git-ignored.

### Step 3 – Start the SQL Server container

```powershell
docker compose --profile local-db up -d sqlserver
docker compose logs -f sqlserver      # wait for "SQL Server is now ready for client connections"
```

### Step 4 – Find the file names inside the backup

```powershell
docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "<SQL_SA_PASSWORD>" -C `
  -Q "RESTORE FILELISTONLY FROM DISK='/var/opt/mssql/backup/Karbar_DB.bak'"
```

Note the values in the `LogicalName` column. There's usually one data file (`Type = D`) and one log file (`Type = L`), for example `Karbar_DB` and `Karbar_DB_log`.

### Step 5 – Restore the database

Replace the two logical names with the ones from Step 4:

```powershell
docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "<SQL_SA_PASSWORD>" -C `
  -Q "RESTORE DATABASE Karbar_DB FROM DISK='/var/opt/mssql/backup/Karbar_DB.bak' WITH MOVE 'Karbar_DB' TO '/var/opt/mssql/data/Karbar_DB.mdf', MOVE 'Karbar_DB_log' TO '/var/opt/mssql/data/Karbar_DB_log.ldf', REPLACE, STATS = 10"
```

The `MOVE` options are needed because the backup still points to Windows paths (`C:\...`) that don't exist in the Linux container.

### Step 6 – Create the app login

```powershell
docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "<SQL_SA_PASSWORD>" -C `
  -Q "CREATE LOGIN testuser WITH PASSWORD='<APP_DB_PASSWORD>', CHECK_POLICY=OFF; USE Karbar_DB; ALTER USER testuser WITH LOGIN = testuser;"
```

What this does:

- **`CREATE LOGIN testuser`**: logins belong to the server, not the database, so they aren't in the backup.
- **`ALTER USER testuser WITH LOGIN = testuser`**: the restored database still contains the `testuser` user, but it isn't linked to any login on the new server. This links it again, and the user keeps its existing permissions.

### Step 7 – Point the API at the container

In `.env`, use `sqlserver` as the server name. That's the service name inside Docker Compose. `localhost` won't work here:

```env
DB_CONNECTION=Server=sqlserver,1433;Database=Karbar_DB;User=testuser;Password=<APP_DB_PASSWORD>;TrustServerCertificate=True;Trusted_Connection=False;MultipleActiveResultSets=true;```

Start the full stack:

```powershell
docker compose --profile local-db up -d --build
```

### Step 8 – Check that it worked

```powershell
# Is the database there, and does it have tables?
docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U testuser -P "<APP_DB_PASSWORD>" -C `
  -d Karbar_DB -Q "SELECT COUNT(*) AS TableCount FROM sys.tables"

# Did the API connect?
docker compose logs api
```

To browse the data from SSMS on your PC, connect to **`localhost,1433`** with SQL Server Authentication.

---

## Refreshing the data later

To replace the Docker copy with a newer backup, repeat Steps 1, 2 and 5. Because of `REPLACE`, the restore overwrites the existing database. Stop the API first so it isn't holding connections open:

```powershell
docker compose stop api
# ...Step 5...
docker compose start api
```

The login link from Step 6 is stored in the database, so a restore can break it. If the API fails to log in after a restore, run `ALTER USER testuser WITH LOGIN = testuser` again.

## Where the data is stored

| Data            | Docker volume       | Kept after `docker compose down`? |
|-----------------|---------------------|-----------------------------------|
| SQL Server data | `karbar_sql-data`   | Yes                               |
| Uploaded images | `karbar_api-images` | Yes                               |

`docker compose down -v` **deletes these volumes and all the data in them.**

## Troubleshooting

| Problem | Fix |
|---|---|
| `sqlserver` container stops right after starting | `SQL_SA_PASSWORD` is too weak. Check `docker compose logs sqlserver`. |
| `The database was backed up on a server running version X... not compatible` | The backup is from a newer SQL Server than the image. Change the image tag (see [Before you start](#before-you-start)). |
| `Cannot open backup device ... Operating system error 2` | The file isn't in `db/backups/`, or the name/case in the command doesn't match. |
| `Logical file 'X' is not part of database` | Use the exact `LogicalName` values from Step 4. |
| API: `Login failed for user 'testuser'` | Run Step 6 again, or check the password in `.env`. |
| API: `A network-related or instance-specific error` | The connection string should say `Server=sqlserver,1433`, not `localhost` or `projectdev`. |
| `sqlcmd: no such file` | Older images use `/opt/mssql-tools/bin/sqlcmd` (without `18`, and without the `-C` flag). |

## AWS note

Running SQL Server in a container is fine for development and testing. In production, prefer **Amazon RDS for SQL Server**: upload the same `.bak` to S3 and restore it with `msdb.dbo.rds_restore_database`. Then set `DB_CONNECTION` to the RDS endpoint.
