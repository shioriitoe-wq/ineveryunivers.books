import os
import re
import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).parent / "database.db"


class Row(dict):
    """Dictionary-like row that also supports SQLite-style numeric indexes."""

    def __init__(self, columns, values):
        super().__init__(zip(columns, values))
        self._values = tuple(values)

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        return super().__getitem__(key)


class PostgresCursor:
    def __init__(self, cursor):
        self._cursor = cursor
        self.lastrowid = None

    @staticmethod
    def _convert_placeholders(sql):
        # The existing API uses SQLite's ? placeholders. PostgreSQL/psycopg2
        # uses %s, so keep the route files unchanged and translate here.
        return sql.replace("?", "%s")

    def execute(self, sql, params=None):
        sql = self._convert_placeholders(sql)
        self.lastrowid = None
        if params is None:
            self._cursor.execute(sql)
        else:
            self._cursor.execute(sql, params)

        if sql.lstrip().upper().startswith("INSERT") and "RETURNING" not in sql.upper():
            try:
                self._cursor.execute("SELECT LASTVAL()")
                self.lastrowid = self._cursor.fetchone()[0]
            except Exception:
                self.lastrowid = None
        return self

    def executemany(self, sql, seq_of_params):
        self._cursor.executemany(self._convert_placeholders(sql), seq_of_params)
        return self

    def fetchone(self):
        row = self._cursor.fetchone()
        if row is None:
            return None
        columns = [d[0] for d in self._cursor.description]
        return Row(columns, row)

    def fetchall(self):
        rows = self._cursor.fetchall()
        if not rows:
            return []
        columns = [d[0] for d in self._cursor.description]
        return [Row(columns, row) for row in rows]

    @property
    def description(self):
        return self._cursor.description

    def __getattr__(self, name):
        return getattr(self._cursor, name)


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


def get_connection():
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        import psycopg2

        connection = psycopg2.connect(database_url)
        return PostgresConnection(connection)

    # Local development keeps using the existing SQLite database.
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection
