# Generated migration for:
# 1. Adding PENDING_EMAIL_VERIFICATION to UserStatus choices (no DB change — value fits in max_length=20)
# 2. Changing User.status default from "pending_approval" to "pending_email"
# 3. Changing Profile.education_level: max_length 100→50, adding choices

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        # Update User.status default to PENDING_EMAIL_VERIFICATION
        migrations.AlterField(
            model_name="user",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending_email", "Pending Email Verification"),
                    ("pending_approval", "Pending Approval"),
                    ("active", "Active"),
                    ("suspended", "Suspended"),
                    ("rejected", "Rejected"),
                ],
                db_index=True,
                default="pending_email",
                max_length=20,
            ),
        ),
        # Update Profile.education_level: shrink max_length and add choices
        migrations.AlterField(
            model_name="profile",
            name="education_level",
            field=models.CharField(
                blank=True,
                choices=[
                    ("secondary_form1", "Secondary \u2013 Form 1"),
                    ("secondary_form2", "Secondary \u2013 Form 2"),
                    ("secondary_form3", "Secondary \u2013 Form 3"),
                    ("secondary_form4", "Secondary \u2013 Form 4"),
                    ("secondary_form5", "Secondary \u2013 Form 5"),
                    ("secondary_form6", "Secondary \u2013 Form 6"),
                    ("uni_certificate", "University \u2013 Certificate"),
                    ("uni_diploma", "University \u2013 Diploma"),
                    ("uni_bachelor", "University \u2013 Bachelor's Degree"),
                    ("uni_master", "University \u2013 Master's Degree"),
                    ("uni_phd", "University \u2013 PhD"),
                    ("uni_postdoc", "University \u2013 Postdoctoral"),
                    ("other", "Other"),
                ],
                default="",
                max_length=50,
            ),
        ),
    ]
