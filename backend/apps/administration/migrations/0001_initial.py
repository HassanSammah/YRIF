from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Announcement',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('title', models.CharField(max_length=300)),
                ('content', models.TextField()),
                ('is_published', models.BooleanField(db_index=True, default=False)),
                ('published_at', models.DateTimeField(blank=True, null=True)),
                ('author', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='announcements',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['-created_at'], 'abstract': False},
        ),
        migrations.CreateModel(
            name='NewsPost',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('title', models.CharField(max_length=300)),
                ('slug', models.SlugField(unique=True)),
                ('body', models.TextField()),
                ('cover_image', models.ImageField(blank=True, null=True, upload_to='news/')),
                ('is_published', models.BooleanField(db_index=True, default=False)),
                ('published_at', models.DateTimeField(blank=True, null=True)),
                ('author', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='news_posts',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['-published_at'], 'abstract': False},
        ),
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('action', models.CharField(db_index=True, max_length=100)),
                ('target_type', models.CharField(blank=True, max_length=50)),
                ('target_id', models.UUIDField(blank=True, null=True)),
                ('target_repr', models.CharField(blank=True, max_length=300)),
                ('details', models.JSONField(blank=True, default=dict)),
                ('actor', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='audit_actions',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['-created_at'], 'verbose_name': 'Audit Log', 'abstract': False},
        ),
        migrations.CreateModel(
            name='ReportExport',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('report_type', models.CharField(
                    choices=[('members', 'Members'), ('research', 'Research'), ('events', 'Events'), ('mentorship', 'Mentorship')],
                    max_length=50,
                )),
                ('filters', models.JSONField(blank=True, default=dict)),
                ('row_count', models.PositiveIntegerField(default=0)),
                ('generated_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='report_exports',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['-created_at'], 'abstract': False},
        ),
    ]
