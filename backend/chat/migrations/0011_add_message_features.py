# Generated migration for chat improvements

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('chat', '0010_companychatmessagereaction'),
    ]

    operations = [
        migrations.AddField(
            model_name='companychatmessage',
            name='attachment_size',
            field=models.PositiveIntegerField(blank=True, help_text='File size in bytes', null=True),
        ),
        migrations.AddField(
            model_name='companychatmessage',
            name='updated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='companychatmessage',
            name='edited_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='companychatmessage',
            name='is_pinned',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='companychatmessage',
            name='pinned_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='company_pinned_messages', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='companychatmessage',
            name='pinned_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='companychatmessage',
            name='reply_to',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='replies', to='chat.companychatmessage'),
        ),
        migrations.AddIndex(
            model_name='companychatmessage',
            index=models.Index(fields=['is_pinned', '-created_at'], name='chat_compan_is_pinn_idx'),
        ),
    ]
