# Using your Supabase project as the database

The platform was built for Supabase from FASE 0 (RLS via `auth.uid()`, Postgres +
pgvector, Supabase Auth/MFA). This is the runbook to point it at your project.

## 1. Create / pick the project — EU region

For RGPD/LGPD residency (POS + tourist data), create the project in an **EU region**
(e.g. Frankfurt or Ireland). This is not reversible per project.

## 2. Enable pgvector

Dashboard → Database → Extensions → enable **`vector`** (or it's created by
migration `0005`, which runs `CREATE EXTENSION IF NOT EXISTS vector;`).

## 3. Connection strings

Dashboard → Database → Connection string:

- **Migrations / long jobs:** the **direct** connection (port `5432`).
- **App runtime on serverless (Vercel):** the **Transaction pooler** (port `6543`).
  `packages/db/src/client.ts` auto-detects `:6543` and sets `prepare: false`
  (required by pgbouncer transaction mode).

```bash
# .env
DATABASE_URL="postgresql://postgres.<ref>:<password>@<host>:6543/postgres"   # app (pooler)
# use the :5432 direct URL when running migrations:
DIRECT_URL="postgresql://postgres.<ref>:<password>@<host>:5432/postgres"
```

## 4. Run migrations — WITHOUT the local shim

> ⚠️ **Do NOT run `scripts/local-auth-shim.sql` on Supabase.** It does
> `CREATE OR REPLACE auth.uid()` — on Supabase that would overwrite the real
> authentication function. Supabase already provides `auth.uid()` and the
> `authenticated` role.

```bash
export DATABASE_URL="$DIRECT_URL"   # direct 5432 for DDL
bash scripts/migrate.sh             # applies 0000_base then 0001..0009 — NO LOCAL_AUTH_SHIM
```

`0000_base.sql` creates `public.organizations/users/establishments/...`. Note that
`public.users` is our **profile mirror** keyed to `auth.users.id` — it does not
replace Supabase Auth's `auth.users`.

## 5. Sync auth.users -> public.users (recommended)

So a profile row exists for every authenticated user, add a trigger (run once):

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email) VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 6. Env keys

```bash
SUPABASE_URL="https://<ref>.supabase.co"
SUPABASE_ANON_KEY="<anon key>"               # browser / app (MFA challenge UI)
SUPABASE_SERVICE_ROLE_KEY="<service role>"   # SERVER ONLY — never ship to the client
```

`packages/api/src/supabase.ts` builds the server client from the service role.

## 7. How RLS applies here (important)

- **Native on Supabase:** `auth.uid()` is the real JWT subject; the `authenticated`
  role is real. The RLS policies in `0001..0009` enforce tenant isolation exactly as
  validated locally (Barcelona ⊥ Lisboa).
- **Our server uses a privileged connection** (`DATABASE_URL` → `postgres`/service),
  which **bypasses RLS by design**. That is why the app also enforces tenancy in
  code (`assertEstablishmentAccess`) and reads the public surface only through the
  `public_*` views. RLS is the second line of defense for any direct/PostgREST access.
- If you want DB-enforced RLS on app reads too, query through PostgREST / the
  Supabase client with the user's JWT instead of the privileged Drizzle connection.

## 8. Security checklist (Supabase specifics)

- [ ] EU region selected.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only in server env (Vercel server / workers), never in the app bundle.
- [ ] Local shim NOT applied to the cloud DB.
- [ ] MFA (AAL2) enforced for staff/admin/owners (FASE 0 `staffProcedure`) — enable TOTP factors in Supabase Auth.
- [ ] Storage/Realtime/Auth all in the same EU project; backups + PITR enabled.
- [ ] Rotate any key that ever touched a client build.
