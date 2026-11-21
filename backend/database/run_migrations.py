"""Run ordered, repeat-safe PostgreSQL schema migrations."""
from pathlib import Path

MIGRATIONS_DIR = Path(__file__).resolve().parents[1] / "migrations"


def run_migrations(connection):
    """Apply unrecorded migrations; idempotent files establish legacy baselines."""
    raw = connection._connection
    cursor = raw.cursor()
    try:
        cursor.execute(
            "CREATE TABLE IF NOT EXISTS public.schema_migrations ("
            "version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"
            ")"
        )
        raw.commit()
        for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
            cursor.execute(
                "SELECT 1 FROM public.schema_migrations WHERE version = %s",
                (path.name,),
            )
            if cursor.fetchone():
                continue
            sql = path.read_text(encoding="utf-8-sig")
            try:
                cursor.execute(sql)
                cursor.execute(
                    "INSERT INTO public.schema_migrations (version) VALUES (%s)",
                    (path.name,),
                )
                raw.commit()
                print(f"Databázová migrace provedena: {path.name}")
            except Exception:
                raw.rollback()
                raise
    finally:
        cursor.close()
