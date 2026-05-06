"""
Create the CompanyChatMessageReaction model for emoji reactions.
"""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0009_remove_reaction_models'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CompanyChatMessageReaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('emoji', models.CharField(max_length=16)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('message', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='reactions',
                    to='chat.companychatmessage',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='company_message_reactions',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'unique_together': {('message', 'user', 'emoji')},
                'indexes': [
                    models.Index(fields=['message'], name='chat_compan_message_react_idx'),
                ],
            },
        ),
    ]
