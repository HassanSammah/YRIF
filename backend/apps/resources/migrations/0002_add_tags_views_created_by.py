from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('resources', '0001_initial'),
    ]

    operations = [
        # ── Resource additions ────────────────────────────────────────────────
        migrations.AddField(
            model_name='resource',
            name='tags',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='resource',
            name='views_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='resource',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='resources_created',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Add webinar to resource_type choices (choices changes don't need DB ops,
        # but AlterField keeps the migration history consistent)
        migrations.AlterField(
            model_name='resource',
            name='resource_type',
            field=models.CharField(
                choices=[
                    ('guide', 'Guide'),
                    ('template', 'Template'),
                    ('dataset', 'Dataset'),
                    ('webinar', 'Webinar'),
                    ('recording', 'Recorded Session'),
                    ('other', 'Other'),
                ],
                db_index=True,
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='resource',
            name='is_published',
            field=models.BooleanField(db_index=True, default=True),
        ),
        # ── Webinar additions ─────────────────────────────────────────────────
        migrations.AddField(
            model_name='webinar',
            name='tags',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='webinar',
            name='views_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='webinar',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='webinars_created',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name='webinar',
            name='is_published',
            field=models.BooleanField(db_index=True, default=True),
        ),
    ]
