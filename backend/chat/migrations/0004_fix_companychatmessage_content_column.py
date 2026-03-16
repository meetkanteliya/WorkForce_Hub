from django.db import migrations


def add_content_column_if_missing(apps, schema_editor):
    """
    Some dev DBs ended up with `chat_companychatmessage` missing the `content`
    column even though migrations are marked as applied.

    This migration is defensive: it inspects the SQLite table schema and adds
    the column only when it is missing.
    """
    if schema_editor.connection.vendor != "sqlite":
        # The reported issue is for sqlite dev DBs; on other DBs we expect
        # migrations to have been applied correctly.
        return

    table_name = "chat_companychatmessage"

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(f"PRAGMA table_info({table_name});")
        existing_cols = {row[1] for row in cursor.fetchall()}  # row[1] is column name

        if "content" in existing_cols:
            return

        # SQLite supports adding a column via ALTER TABLE.
        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN content TEXT NOT NULL DEFAULT ''")


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0003_companychatmessage_deleted_at_and_more"),
    ]

    operations = [
        migrations.RunPython(add_content_column_if_missing, migrations.RunPython.noop),
    ]

