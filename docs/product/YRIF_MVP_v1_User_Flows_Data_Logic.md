# YRIF MVP v1 — User Flows + Data Logic + Relationships
**Scope:** Modules 2–8 (5.2–5.8) + NFRs (Section 6)
**Public Website (Module 1):** Out of scope (handled by Edson), but links to platform registration, public research pages, and contact.
**Last Updated:** 03/03/2026

---

## 0) Actors (User Types) and Roles

### External Users
- **Youth / Student** (university / secondary)
- **Young Researcher** (can overlap with Youth/Student)
- **Mentor**
- **Research Assistant**
- **Industry Partner**
- **Community Partner**

### Internal Users
- **System Administrator** — full access
- **YRIF Staff** — operational access
- **Program Manager** — manages programs and mentorship
- **Content Manager** — manages announcements, blogs, resources
- **Judge** — assigned from Mentor or Staff for competition evaluation; not a separate user type, it is a role change

> **Role assignment:** Admin can reassign any user's role (e.g., promote a Mentor to Judge for a competition, then revert).

---

## 1) Core Data Entities (High-Level)

### 1.1 Identity & Access

**User**
- `id` (UUID), `email` (unique), `first_name`, `last_name`
- `role`: `youth | researcher | mentor | research_assistant | industry_partner | admin | staff | program_manager | content_manager | judge`
- `status`: `PENDING_APPROVAL | ACTIVE | SUSPENDED | REJECTED`
- `is_active` (Django auth field — False when SUSPENDED or REJECTED)
- `is_staff` (Django admin access)
- `created_at`, `updated_at`

> **Status rules:**
> - All new external user registrations → `PENDING_APPROVAL`
> - Internal roles (admin/staff/program_manager) → auto `ACTIVE` on creation
> - `ACTIVE` → can access platform, submit research, register events, request mentorship, send messages
> - `SUSPENDED` → cannot log in; account retained
> - `REJECTED` → cannot log in; account retained for audit

**AuthProviderAccount**
- `user_id`, `provider` (google | briq), `provider_uid`, `provider_email`, `provider_data` (JSON)
- One user can have multiple provider accounts (email + Google)
- Created/updated on every OAuth sign-in

**Role / Permission (RBAC)**
- Enforced at the API view level via DRF permission classes
- `IsAdmin`: admin | staff | program_manager
- `IsApproved` / `IsActive`: status == ACTIVE
- `IsMentor`: role == mentor
- `IsContentManager`: admin | staff | program_manager | content_manager

### 1.2 Profiles (per role)

**UserProfile** (base — all users)
- `user_id`, `bio`, `phone`, `institution`, `education_level`, `region`
- `skills` (text, comma-separated), `research_interests` (text)
- `achievements` (text), `avatar` (image)
- `phone_verified` (boolean, set via Briq OTP)

**MentorProfile** (role: mentor)
- `user_id`, `expertise_areas` (text/JSON), `availability` (text)
- `is_verified` (boolean, set by admin)

**PartnerProfile** (role: industry_partner)
- `user_id`, `org_name`, `partner_type` (industry | community)
- `sector`, `contact_person`, `is_verified`

**ResearchAssistantProfile** (role: research_assistant)
- `user_id`, `skills` (text), `availability` (text), `portfolio` (text/URL)

### 1.3 Research & Publications
- **ResearchCategory:** Natural Sciences | Social Sciences | Arts | Technology
- **ResearchSubmission**
  - `id`, `author_user_id`, `title`, `abstract`, `category`, `file_url`, `dataset_urls[]`, `keywords`
  - `status`: `DRAFT | SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED | PUBLISHED`
  - `views_count`, `downloads_count`, `published_at`
- **ReviewAssignment**
  - `submission_id`, `reviewer_user_id`, `assigned_by`, `state` (assigned | completed)
- **ReviewComment**
  - `submission_id`, `reviewer_user_id`, `comment`, `recommendation` (approve | reject | revise)

### 1.4 Events / Competitions
- **Event**
  - `id`, `type` (seminar | workshop | bonanza | competition), `title`, `date`, `location`
  - `description`, `registration_deadline`, `is_online`, `online_link`, `max_participants`, `is_published`
- **EventRegistration**
  - `event_id`, `user_id`, `status` (registered | attended | cancelled)
- **CompetitionSubmission**
  - `event_id` (competition), `submission_id` (research), `user_id`
- **JudgeScore**
  - `event_id`, `submission_id`, `judge_user_id`, `score`, `comments`
- **Winner**
  - `event_id`, `submission_id`, `rank`, `published_at`
- **Certificate**
  - `event_id`, `user_id`, `type` (participant | winner), `pdf_url`

### 1.5 Mentorship
- **MentorshipRequest**
  - `requester_user_id`, `mentor_user_id` (optional preference), `topic`, `message`
  - `status`: `PENDING | APPROVED | MATCHED | DECLINED | CLOSED`
- **MentorshipMatch**
  - `mentor_user_id`, `mentee_user_id`, `matched_by_admin`, `start_date`, `status`
- **MentorFeedback**
  - `match_id`, `mentor_user_id`, `feedback_text`, `rating` (optional)

### 1.6 Learning & Resources
- **ResourceItem**
  - `type` (guide | template | dataset | webinar | recording), `title`, `description`
  - `link_or_file_url`, `tags[]`, `views_count`, `downloads_count`

### 1.7 Communication & Support
- **ContactMessage** — `name`, `email`, `phone`, `subject`, `message`, `status`
- **Notification**
  - `user_id`, `channel` (email | sms | in_app), `type`, `payload`, `status` (pending | sent | failed)
  - Triggers: approval, status changes, registrations, mentorship match, competition results
- **Conversation** — `id`, `type` (user_user | user_admin | group), `participants[]`
- **InAppMessage** — `conversation_id`, `sender_user_id`, `message_text`, `created_at`
  - Realtime delivery via **Supabase Realtime**
- **ChatbotSession** — `user_id` (optional), `session_id`, `messages[]`
  - Powered by **Sarufi AI**

### 1.8 Reporting
- **AuditLog** — approvals, publishes, role changes, admin actions, `actor_user_id`, `action`, `target`, `timestamp`
- **ReportExport** — `type`, `filters`, `file_url`, `generated_by`, `generated_at`

---

## 2) Data Rules (Business Logic)

### 2.1 Account Approval
- New external user → `status = PENDING_APPROVAL`, `is_active = True` (can authenticate but gated in platform)
- Internal users (admin/staff/program_manager) created by admin → `status = ACTIVE`, `is_active = True`
- Admin actions:
  - **Approve** → `status = ACTIVE` → send approval email + optional SMS
  - **Reject** → `status = REJECTED`, `is_active = False` → send rejection email with reason
  - **Suspend** → `status = SUSPENDED`, `is_active = False` → send suspension email
- Only `ACTIVE` users can submit research, register events, request mentorship, and send messages.
- Admin notification: when a new user registers, notify all admin/staff via email.

### 2.2 Research Visibility
- Public: only `PUBLISHED` research.
- Author: all own research states.
- Admin/Staff: all research.
- Reviewer: only assigned submissions.

### 2.3 Review Workflow
- `SUBMITTED` → admin assigns reviewer(s) → `UNDER_REVIEW`
- Reviewer(s) add comments + recommendation
- Admin makes final decision → `APPROVED` or `REJECTED`
- `APPROVED` → admin publishes → `PUBLISHED` (triggers email to author)

### 2.4 Competition Link
- Competition is `Event(type=competition)`.
- `CompetitionSubmission` links `Event` + `ResearchSubmission`.
- Judge (role assigned from Mentor or Staff) scores submissions.
- Admin publishes winners; certificates are generated from PDF template.

### 2.5 Messaging Permissions
- Chat only for `ACTIVE` users.
- Allowed: youth↔mentor, youth↔admin/staff, mentor↔admin/staff.
- Realtime by Supabase; backend enforces access rules on conversation creation.

### 2.6 Notifications
| Trigger | Channel | Recipient |
|---|---|---|
| New user registers | Email | Admin team |
| Account approved | Email + SMS (optional) | User |
| Account rejected | Email | User |
| Account suspended | Email | User |
| Research status changed | Email | Author |
| Event registration confirmed | Email | User |
| Mentorship matched | Email | Mentor + Mentee |
| Competition results published | Email | Participants |

---

## 3) User Flows (All Users)

## 3.1 Public Visitor (Unregistered)
### Explore
1. Visit site → About / Programs / Events / Research
2. View published research
3. Click "Join YRIF" → registration page

### Contact
1. Submit contact form
2. Staff receives email notification

### Chatbot (optional)
1. Open chatbot → ask FAQ → Sarufi response → escalate to contact if needed

---

## 3.2 Youth / Student / Young Researcher

### Register & Approval
1. Fill registration form: name, email, role, password (or Google OAuth sign-up)
2. Optionally enter phone number
3. Account created with `status = PENDING_APPROVAL`
4. Admin team notified by email
5. Admin approves → `status = ACTIVE` → user receives approval email + optional SMS
6. User can now access the full platform

### Profile Completion
1. Log in → go to Profile
2. Fill: bio, institution, education_level, region, skills, research_interests, achievements
3. Upload avatar
4. Optionally verify phone: request OTP via Briq → enter code → phone marked verified

### Submit Research
1. Create draft: upload PDF/Word + optional datasets, fill title/abstract/category/keywords
2. Submit → `status = SUBMITTED`
3. Admin assigns reviewer → `status = UNDER_REVIEW`
4. Reviewer comments + recommendation
5. Admin decides: `APPROVED` or `REJECTED` (author notified by email)
6. If approved → admin publishes → `PUBLISHED` (publicly visible)

### Events / Competitions
1. Browse events → register for event
2. If competition: link a research submission
3. Judges score; admin publishes winners
4. Download certificate (PDF) from profile

### Mentorship
1. Browse mentor directory → request mentorship (with topic + message)
2. Admin matches → both parties notified by email
3. Messaging enabled between mentor and mentee

### Messaging
1. Open conversation → realtime chat via Supabase Realtime

---

## 3.3 Mentor

### Register & Approval
1. Register with role = `mentor`
2. `status = PENDING_APPROVAL` → admin approves
3. Complete MentorProfile: expertise_areas, availability

### Platform Actions
1. Accept mentorship matches from admin
2. Review assigned research → add comments + recommendation
3. Message mentees / admin
4. Submit mentorship feedback form after match closes

---

## 3.4 Research Assistant
1. Register with role = `research_assistant` → admin approval
2. Complete ResearchAssistantProfile: skills, availability, portfolio
3. Admin links to programs/projects
4. Collaborate via messaging and document uploads

---

## 3.5 Industry / Community Partner
1. Register with role = `industry_partner` → admin approval
2. Complete PartnerProfile: org_name, partner_type, sector, contact_person
3. Browse research and events
4. Send collaboration interest to admin via message or contact form

---

## 3.6 Admin / YRIF Staff / Program Manager / Content Manager

### User Management
1. View pending registrations → approve / reject / suspend
2. Assign or change user roles
3. View all users with filters (role, status, search)
4. Download user CSV report

### Research Management
1. View submitted research → assign reviewer(s)
2. View review recommendations → approve or reject
3. Publish approved research
4. Monitor views/downloads analytics

### Events & Competitions
1. Create event (type, dates, description, location)
2. Manage registrations
3. Assign judges for competitions
4. Publish winners and generate certificates

### Content Management
1. Create/edit/delete announcements, blogs, resource items

### Reporting
1. Admin dashboard: member counts, submissions, events, activity
2. Generate and export reports (CSV/PDF) with filters

### Support
1. Respond to contact messages
2. Manage chatbot FAQs
3. Send bulk email/SMS announcements

---

## 4) Relationship Map (Quick Reference)
```
User 1—1 UserProfile
User 1—(0,1) MentorProfile           [role = mentor]
User 1—(0,1) PartnerProfile          [role = industry_partner]
User 1—(0,1) ResearchAssistantProfile [role = research_assistant]
User 1—many AuthProviderAccount
User 1—many ResearchSubmission       [as author]
ResearchSubmission many—many User    [via ReviewAssignment, as reviewer]
ResearchSubmission 1—many ReviewComment
Event 1—many EventRegistration
Event(competition) 1—many CompetitionSubmission → ResearchSubmission
User(judge) 1—many JudgeScore
Event 1—many Winner                  [via CompetitionSubmission]
User 1—many Certificate
MentorshipRequest → MentorshipMatch  [mentor↔mentee]
Conversation many—many User
Conversation 1—many InAppMessage
```

---

## 5) Claude Guardrails
- Do not implement Public Website UI (Module 1); only backend endpoints + platform UI.
- Enforce RBAC + account status checks on all protected actions.
- Keep changes small per module; add tests for permissions and workflow transitions.
- No secrets in repo; use `.env.example`.
- Realtime chat via Supabase; backend stores references and enforces access policies.
- All admin-level actions must log to AuditLog.
- Email notifications must be non-blocking (use async/Celery in production; sync in dev).
- Phone OTP via Briq is optional at registration; phone_verified flag set after successful verify.
