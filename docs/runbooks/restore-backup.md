# Runbook: restore a production backup

Backups are made every night by `.github/workflows/backup.yml` and kept for 30 days
as encrypted artifacts on GitHub. Each one holds three files from `supabase db dump`:
`roles.sql`, `schema.sql`, `data.sql`.

**Always restore into your local database first** and check it. Only restore into a
hosted project (staging or production) on purpose, after reading the whole runbook.

## 1. Download

GitHub → **Actions → Backup production database** → open a run → **Artifacts** →
download `vibecheck-prod-<date>`. Unzip it: you get `<name>.tar.gz.gpg` and
`<name>.tar.gz.gpg.sha256`.

## 2. Check and decrypt

Use Git Bash (comes with Git for Windows) or WSL:

```bash
sha256sum -c vibecheck-prod-*.tar.gz.gpg.sha256      # must print: OK
gpg --decrypt --output backup.tar.gz vibecheck-prod-*.tar.gz.gpg   # asks for BACKUP_PASSPHRASE
mkdir backup && tar -xzf backup.tar.gz -C backup
```

The passphrase is the `BACKUP_PASSPHRASE` saved in your password manager.
Without it the backup cannot be opened. That's the point, so don't lose it.

## 3. Restore into the local database (routine check)

The local database gets its tables from our migrations; the backup only adds the rows.
This works as long as production is on the same migrations as your local `main`.

```bash
pnpm db:start                              # local Supabase must be running
pnpm exec supabase db reset --no-seed      # tables from migrations, no seed rows

psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  --single-transaction --variable ON_ERROR_STOP=1 \
  --command 'SET session_replication_role = replica' \
  --file backup/data.sql
```

`session_replication_role = replica` turns off triggers and foreign-key checks
while the data loads, so rows can arrive in any order.

No `psql` on Windows? Use the one inside the local database container instead:

```bash
docker exec -i supabase_db_vibecheck-homes psql -U postgres -d postgres \
  --single-transaction --variable ON_ERROR_STOP=1 \
  --command 'SET session_replication_role = replica' --file - < backup/data.sql
```

## 3b. Disaster recovery: production is lost

Create a **new** Supabase project (Mumbai, new strong password) and restore all three
files in order: roles, schema, data. This is Supabase's documented restore order.

```bash
psql "<new project's direct connection string from Project Settings → Database>" \
  --single-transaction --variable ON_ERROR_STOP=1 \
  --file backup/roles.sql \
  --file backup/schema.sql \
  --command 'SET session_replication_role = replica' \
  --file backup/data.sql
```

Then update the `production` and `production-backup` environment secrets
(`SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`) and the app's Supabase keys to the
new project, and run **Release to production** again.

## 4. Check

Open Studio (http://127.0.0.1:54323) and spot-check row counts in the main tables.

## 5. Delete the decrypted files

```bash
rm -rf backup backup.tar.gz
```

Never commit them, email them, or upload them anywhere.
