"""
Remove the ChatMessageReaction and CompanyChatMessageReaction models
that were added in migration 0008. Uses RunSQL to avoid SQLite issues
with index references during field removal.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0008_chatmessagereaction_companychatmessagereaction'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                "DROP TABLE IF EXISTS chat_companychatmessagereaction;",
                "DROP TABLE IF EXISTS chat_chatmessagereaction;",
            ],
            reverse_sql=[],  # No reverse — the forward migration 0008 handles creation
        ),
    ]
