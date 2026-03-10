from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('mentorship', '0001_initial'),
    ]

    operations = [
        # Rename MentorshipRequest.research_area → topic
        migrations.RenameField(
            model_name='mentorshiprequest',
            old_name='research_area',
            new_name='topic',
        ),
        # Rename MentorshipRequest.mentor → preferred_mentor
        migrations.RenameField(
            model_name='mentorshiprequest',
            old_name='mentor',
            new_name='preferred_mentor',
        ),
        # Update related_name on mentee FK
        migrations.AlterField(
            model_name='mentorshiprequest',
            name='mentee',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='mentorship_requests_as_mentee',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Update preferred_mentor FK
        migrations.AlterField(
            model_name='mentorshiprequest',
            name='preferred_mentor',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='mentorship_requests_as_preferred',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Update status choices
        migrations.AlterField(
            model_name='mentorshiprequest',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('approved', 'Approved'),
                    ('matched', 'Matched'),
                    ('declined', 'Declined'),
                    ('closed', 'Closed'),
                ],
                db_index=True,
                default='pending',
                max_length=20,
            ),
        ),
        # Add db_index to MentorshipRequest.status (already handled above)
        # Create MentorshipMatch
        migrations.CreateModel(
            name='MentorshipMatch',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('status', models.CharField(
                    choices=[('active', 'Active'), ('completed', 'Completed'), ('cancelled', 'Cancelled')],
                    db_index=True,
                    default='active',
                    max_length=20,
                )),
                ('notes', models.TextField(blank=True)),
                ('matched_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='mentorship_matches_created',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('mentee', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='mentorship_matches_as_mentee',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('mentor', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='mentorship_matches_as_mentor',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('request', models.OneToOneField(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='match',
                    to='mentorship.mentorshiprequest',
                )),
            ],
            options={'abstract': False},
        ),
        # Remove old mentorship FK from MentorFeedback
        migrations.RemoveField(
            model_name='mentorfeedback',
            name='mentorship',
        ),
        # Add match FK to MentorFeedback
        migrations.AddField(
            model_name='mentorfeedback',
            name='match',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='feedback',
                to='mentorship.mentorshipmatch',
            ),
        ),
        # Rename comments → feedback_text
        migrations.RenameField(
            model_name='mentorfeedback',
            old_name='comments',
            new_name='feedback_text',
        ),
        # Make rating optional
        migrations.AlterField(
            model_name='mentorfeedback',
            name='rating',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
    ]
