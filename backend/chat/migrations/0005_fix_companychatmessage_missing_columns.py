from django.db import migrations


def _sqlite_add_column(cursor, table, col_name, col_def_sql):
    cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def_sql}")


def ensure_companychatmessage_columns(apps, schema_editor):
    """
    Defensive schema repair for some dev SQLite DBs where the CompanyChatMessage
    table was created without newer columns (attachment + soft-delete fields).

    This keeps the app running without forcing a DB reset.
    """
    if schema_editor.connection.vendor != "sqlite":
        return

    table_name = "chat_companychatmessage"

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(f"PRAGMA table_info({table_name});")
        existing = {row[1] for row in cursor.fetchall()}

        # content was handled in 0004, but keep it defensive.
        if "content" not in existing:
            _sqlite_add_column(cursor, table_name, "content", "TEXT NOT NULL DEFAULT ''")
            existing.add("content")

        if "attachment" not in existing:
            # FileField stores path string.
            _sqlite_add_column(cursor, table_name, "attachment", "TEXT NULL")
            existing.add("attachment")

        if "attachment_name" not in existing:
            _sqlite_add_column(cursor, table_name, "attachment_name", "VARCHAR(255) NOT NULL DEFAULT ''")
            existing.add("attachment_name")

        if "attachment_mime" not in existing:
            _sqlite_add_column(cursor, table_name, "attachment_mime", "VARCHAR(255) NOT NULL DEFAULT ''")
            existing.add("attachment_mime")

        if "deleted_at" not in existing:
            _sqlite_add_column(cursor, table_name, "deleted_at", "DATETIME NULL")
            existing.add("deleted_at")

        if "deleted_by_id" not in existing:
            # FK to accounts_user; SQLite won't enforce without table rebuild.
            _sqlite_add_column(cursor, table_name, "deleted_by_id", "BIGINT NULL")
            existing.add("deleted_by_id")

        if "deleted_reason" not in existing:
            _sqlite_add_column(cursor, table_name, "deleted_reason", "VARCHAR(255) NOT NULL DEFAULT ''")
            existing.add("deleted_reason")


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0004_fix_companychatmessage_content_column"),
    ]

    operations = [
        migrations.RunPython(ensure_companychatmessage_columns, migrations.RunPython.noop),
    ]

