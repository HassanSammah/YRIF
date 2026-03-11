from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("communications", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Add is_read to Notification
        migrations.AddField(
            model_name="notification",
            name="is_read",
            field=models.BooleanField(default=False, db_index=True),
        ),
        # Conversation model
        migrations.CreateModel(
            name="Conversation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("conv_type", models.CharField(
                    choices=[("user_admin", "User ↔ Admin"), ("peer", "Peer")],
                    default="user_admin", max_length=20,
                )),
                ("subject", models.CharField(blank=True, max_length=300)),
                ("participants", models.ManyToManyField(
                    blank=True, related_name="conversations",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"ordering": ["-updated_at"]},
        ),
        # Message model
        migrations.CreateModel(
            name="Message",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("text", models.TextField()),
                ("is_read", models.BooleanField(default=False, db_index=True)),
                ("conversation", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="messages",
                    to="communications.conversation",
                )),
                ("sender", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="sent_messages",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"ordering": ["created_at"]},
        ),
    ]
