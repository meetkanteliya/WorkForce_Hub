from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0003_alter_auditlog_action_type'),
        ('employees', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Attendance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(default=django.utils.timezone.now, db_index=True)),
                ('check_in', models.TimeField(null=True, blank=True)),
                ('check_out', models.TimeField(null=True, blank=True)),
                ('hours_worked', models.FloatField(default=0.0)),
                ('is_present', models.BooleanField(default=True, db_index=True)),
                ('note', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('employee', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='attendance_records',
                    to='employees.employee',
                )),
            ],
            options={
                'verbose_name': 'Attendance',
                'verbose_name_plural': 'Attendance Records',
                'ordering': ['-date', '-created_at'],
                'unique_together': {('employee', 'date')},
            },
        ),
    ]
