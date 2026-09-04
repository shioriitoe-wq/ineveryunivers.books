import os
import re
import sqlite3
from pathlib import Path

from dotenv import load_dotenv


# =========================================================
# ENVIRONMENT
# =========================================================

_DATABASE_DIR = Path(__file__).resolve().parent
_PROJECT_DIR = _DATABASE_DIR.parent

load_dotenv(_DATABASE_DIR / ".env", override=False)
load_dotenv(_PROJECT_DIR / ".env", override=False)


DATABASE_PATH = Path(__file__).parent / "database.db"


# =========================================================
# ROW
# =========================================================

class Row(dict):
    """Dictionary-like row that also supports SQLite-style numeric indexes."""

    def __init__(self, columns, values):
        super().__init__(zip(columns, values))
        self._values = tuple(values)

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]

        return super().__getitem__(key)


# =========================================================
# POSTGRES CURSOR
# =========================================================

class PostgresCursor:

    def __init__(self, cursor):
        self._cursor = cursor
        self.lastrowid = None

    @staticmethod
    def _convert_placeholders(sql):
        """
        The existing API uses SQLite-style ? placeholders.
        PostgreSQL/psycopg2 uses %s.
        """
        return sql.replace("?", "%s")

    def execute(self, sql, params=None):

        original_sql = sql

        sql = self._convert_placeholders(sql)

        self.lastrowid = None

        try:

            if params is None:
                self._cursor.execute(sql)
            else:
                self._cursor.execute(sql, params)

        except Exception as error:

            print()
            print("=" * 80)
            print("❌ POSTGRESQL SQL CHYBA")
            print("=" * 80)

            print()
            print("TYP CHYBY:")
            print(type(error).__name__)

            print()
            print("CHYBA:")
            print(repr(error))

            # -------------------------------------------------
            # PostgreSQL DETAIL
            # -------------------------------------------------

            print()
            print("POSTGRESQL KÓD:")

            pgcode = getattr(error, "pgcode", None)

            print(
                pgcode
                if pgcode is not None
                else "N/A"
            )

            diag = getattr(error, "diag", None)

            if diag is not None:

                print()
                print("POSTGRESQL MESSAGE:")
                print(
                    getattr(
                        diag,
                        "message_primary",
                        None
                    )
                    or "N/A"
                )

                print()
                print("POSTGRESQL DETAIL:")
                print(
                    getattr(
                        diag,
                        "message_detail",
                        None
                    )
                    or "N/A"
                )

                print()
                print("POSTGRESQL HINT:")
                print(
                    getattr(
                        diag,
                        "message_hint",
                        None
                    )
                    or "N/A"
                )

                print()
                print("POSTGRESQL CONTEXT:")
                print(
                    getattr(
                        diag,
                        "context",
                        None
                    )
                    or "N/A"
                )

                print()
                print("POSTGRESQL COLUMN:")
                print(
                    getattr(
                        diag,
                        "column_name",
                        None
                    )
                    or "N/A"
                )

                print()
                print("POSTGRESQL TABLE:")
                print(
                    getattr(
                        diag,
                        "table_name",
                        None
                    )
                    or "N/A"
                )

                print()
                print("POSTGRESQL CONSTRAINT:")
                print(
                    getattr(
                        diag,
                        "constraint_name",
                        None
                    )
                    or "N/A"
                )

            print()
            print("SQL:")
            print(original_sql)

            print()
            print("PŘELOŽENÉ SQL:")
            print(sql)

            print()
            print("PARAMETRY:")
            print(repr(params))

            print("=" * 80)
            print()

            # -------------------------------------------------
            # DŮLEŽITÉ:
            # PostgreSQL transakce je po chybě aborted.
            # Rollback ji vrátí do normálního stavu.
            # -------------------------------------------------

            try:
                self._cursor.connection.rollback()
            except Exception:
                pass

            raise

        # -----------------------------------------------------
        # LASTROWID
        # -----------------------------------------------------

        if (
            sql.lstrip().upper().startswith("INSERT")
            and "RETURNING" not in sql.upper()
        ):
            # LASTVAL() is valid only when the INSERT used a PostgreSQL
            # sequence. Join tables such as character_volumes have no
            # sequence, so LASTVAL() raises an error. That error would
            # otherwise abort the whole transaction.
            #
            # Keep the existing lastrowid compatibility for tables that
            # do use sequences, but isolate the optional LASTVAL() lookup
            # inside a savepoint. If there is no sequence, the savepoint
            # is rolled back and the original INSERT remains valid.
            savepoint_name = "_lastrowid_lookup"

            try:
                self._cursor.execute(
                    f"SAVEPOINT {savepoint_name}"
                )

                self._cursor.execute(
                    "SELECT LASTVAL()"
                )

                row = self._cursor.fetchone()
                self.lastrowid = row[0] if row else None

                self._cursor.execute(
                    f"RELEASE SAVEPOINT {savepoint_name}"
                )

            except Exception:
                self.lastrowid = None

                try:
                    self._cursor.execute(
                        f"ROLLBACK TO SAVEPOINT {savepoint_name}"
                    )
                except Exception:
                    pass

                try:
                    self._cursor.execute(
                        f"RELEASE SAVEPOINT {savepoint_name}"
                    )
                except Exception:
                    pass

        return self

    def executemany(self, sql, seq_of_params):

        converted_sql = self._convert_placeholders(sql)

        try:

            self._cursor.executemany(
                converted_sql,
                seq_of_params
            )

        except Exception as error:

            print()
            print("=" * 80)
            print("❌ POSTGRESQL EXECUTEMANY CHYBA")
            print("=" * 80)

            print()
            print("TYP CHYBY:")
            print(type(error).__name__)

            print()
            print("CHYBA:")
            print(repr(error))

            print()
            print("POSTGRESQL KÓD:")

            pgcode = getattr(error, "pgcode", None)

            print(
                pgcode
                if pgcode is not None
                else "N/A"
            )

            diag = getattr(error, "diag", None)

            if diag is not None:

                print()
                print("POSTGRESQL MESSAGE:")
                print(
                    getattr(
                        diag,
                        "message_primary",
                        None
                    )
                    or "N/A"
                )

                print()
                print("POSTGRESQL DETAIL:")
                print(
                    getattr(
                        diag,
                        "message_detail",
                        None
                    )
                    or "N/A"
                )

                print()
                print("POSTGRESQL HINT:")
                print(
                    getattr(
                        diag,
                        "message_hint",
                        None
                    )
                    or "N/A"
                )

                print()
                print("POSTGRESQL CONSTRAINT:")
                print(
                    getattr(
                        diag,
                        "constraint_name",
                        None
                    )
                    or "N/A"
                )

            print()
            print("SQL:")
            print(sql)

            print()
            print("PARAMETRY:")
            print(repr(seq_of_params))

            print("=" * 80)
            print()

            try:
                self._cursor.connection.rollback()
            except Exception:
                pass

            raise

        return self

    def fetchone(self):

        row = self._cursor.fetchone()

        if row is None:
            return None

        columns = [
            description[0]
            for description in self._cursor.description
        ]

        return Row(columns, row)

    def fetchall(self):

        rows = self._cursor.fetchall()

        if not rows:
            return []

        columns = [
            description[0]
            for description in self._cursor.description
        ]

        return [
            Row(columns, row)
            for row in rows
        ]

    @property
    def description(self):
        return self._cursor.description

    def __getattr__(self, name):
        return getattr(self._cursor, name)


# =========================================================
# POSTGRES CONNECTION
# =========================================================

class PostgresConnection:

    def __init__(self, connection):
        self._connection = connection

    def cursor(self):

        from psycopg2 import extensions

        return PostgresCursor(
            self._connection.cursor(
                cursor_factory=extensions.cursor
            )
        )

    def commit(self):
        self._connection.commit()

    def rollback(self):
        self._connection.rollback()

    def close(self):
        self._connection.close()

    def __getattr__(self, name):
        return getattr(self._connection, name)


# =========================================================
# CONNECTION
# =========================================================

def get_connection():

    database_url = os.getenv("DATABASE_URL")

    if database_url:

        import psycopg2

        connection = psycopg2.connect(
            database_url
        )

        return PostgresConnection(
            connection
        )

    # -----------------------------------------------------
    # LOCAL SQLITE FALLBACK
    # -----------------------------------------------------

    DATABASE_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    connection.row_factory = sqlite3.Row

    return connection