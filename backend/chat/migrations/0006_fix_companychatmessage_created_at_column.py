from django.db import migrations


def add_created_at_if_missing(apps, schema_editor):
    if schema_editor.connection.vendor != "sqlite":
        return

    table_name = "chat_companychatmessage"
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(f"PRAGMA table_info({table_name});")
        existing = {row[1] for row in cursor.fetchall()}

        if "created_at" in existing:
            return

        # SQLite can't add a column with a non-constant default on some versions.
        # Add it as nullable, backfill existing rows, and rely on Django to
        # provide values for new rows (auto_now_add).
        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN created_at DATETIME NULL")
        cursor.execute(f"UPDATE {table_name} SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL")


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0005_fix_companychatmessage_missing_columns"),
    ]

    operations = [
        migrations.RunPython(add_created_at_if_missing, migrations.RunPython.noop),
    ]

