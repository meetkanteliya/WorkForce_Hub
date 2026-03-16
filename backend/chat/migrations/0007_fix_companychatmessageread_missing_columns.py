from django.db import migrations


def ensure_read_receipt_columns(apps, schema_editor):
    if schema_editor.connection.vendor != "sqlite":
        return

    table_name = "chat_companychatmessageread"
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(f"PRAGMA table_info({table_name});")
        existing = {row[1] for row in cursor.fetchall()}

        if "user_id" not in existing:
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN user_id BIGINT NULL")
            existing.add("user_id")

        if "read_at" not in existing:
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN read_at DATETIME NULL")
            cursor.execute(f"UPDATE {table_name} SET read_at = CURRENT_TIMESTAMP WHERE read_at IS NULL")
            existing.add("read_at")


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0006_fix_companychatmessage_created_at_column"),
    ]

    operations = [
        migrations.RunPython(ensure_read_receipt_columns, migrations.RunPython.noop),
    ]

