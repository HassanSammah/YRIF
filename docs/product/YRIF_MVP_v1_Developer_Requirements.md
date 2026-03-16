# YRIF MVP v1 – Developer Requirements & Technology Specification
**Project:** Youth Research & Innovation Foundation (YRIF) Platform
**Version:** MVP v1
**Owner (Dev):** Hassan A. Samma (Full-stack)
**UI/Branding:** Edson (Public Website Module / UI assets)
**QA/Analysis:** Joleen
**Date:** 24/02/2026
**Last Updated:** 16/03/2026

---

## 1. INTRODUCTION
The Youth Research & Innovation Foundation (YRIF) platform MVP is a national digital platform designed to empower Tanzanian youth to participate in research, innovation, and knowledge generation aligned with national development priorities.

The MVP focuses on delivering core, high-impact functionalities that establish YRIF as a credible national institution, while allowing future expansion into advanced learning systems, AI tools, and deeper industry collaboration.

---

## 2. MVP OBJECTIVES
The MVP platform aims to:
a) Establish a functional national digital presence for YRIF
b) Enable youth membership registration and management
c) Support research submission, review, and publication
d) Facilitate research competitions, events, and engagement programs
e) Enable mentorship and basic industry linkage
f) Provide administrative tools for monitoring and reporting
g) Ensure the platform is secure, mobile-friendly, and scalable

---

## 3. MVP PLATFORM COMPOSITION (WHAT THE PLATFORM WILL INCLUDE)
The YRIF MVP platform will be composed of the following core modules:
1. Public Information Website
2. User & Membership Management System
3. Research & Innovation Portal
4. Events, Competitions & Engagement System
5. Mentorship & Partner Network (Basic)
6. Learning Resources Hub (Light Version)
7. Administration, Monitoring & Reporting Dashboard
8. Communication & Notification System

---

## 4. MVP USER CATEGORIES

### 4.1 External Users
- Youth / Students (Universities & Secondary Schools)
- Young Researchers
- Mentors
- Research Assistants
- Industry Partners
- Community Partners

### 4.2 Internal Users
- System Administrators
- YRIF Staff
- Program Managers
- Content Managers
- Judges *(assigned to Mentors or Staff for competition evaluation)*

---

## 5. FUNCTIONAL REQUIREMENTS (MVP)

### 5.1 Public Website Module (OUT OF SCOPE FOR THIS DEV PHASE)
**Status:** Being built by Edson (UI/UX + branding + public pages).
**Dev note:** Public site should link into the platform auth/registration and public research pages.

Includes (FYI):
- Display YRIF vision, mission, and objectives
- Publish programs, activities, and announcements
- Display partners and stakeholders
- Provide contact and inquiry forms
- Provide membership registration access

---

## 5.2 User & Membership Management (IN SCOPE)

### Requirements
- Online user registration (email/password and Google OAuth)
- Role-based authentication and authorization (RBAC)
- User profile creation and management
- Role-specific extended profiles (see below)
- Admin approval workflow: new accounts are `PENDING_APPROVAL` until reviewed
- Admin can approve, reject, or suspend accounts
- Email and SMS notification to user on status change
- Admin receives in-platform notification on new registration
- Secure login and logout (JWT with token blacklist)
- Phone number verification via Briq OTP

### User Account Status
Every user account has a `status` field:
- `PENDING_APPROVAL` — registered, awaiting admin review (default)
- `ACTIVE` — approved, full platform access
- `SUSPENDED` — temporarily blocked by admin, cannot log in
- `REJECTED` — declined by admin, cannot log in
- `PENDING_EMAIL` — registered but email not yet verified (pre-approval state)

### Roles (MVP)
| Role | Type | Notes |
|---|---|---|
| `youth` | External | Default role for youth/students |
| `researcher` | External | Young researchers |
| `mentor` | External | Requires extended MentorProfile |
| `research_assistant` | External | Requires ResearchAssistantProfile |
| `industry_partner` | External | Requires PartnerProfile |
| `admin` | Internal | Full platform access, auto-approved |
| `staff` | Internal | YRIF Staff, auto-approved |
| `program_manager` | Internal | Auto-approved |
| `content_manager` | Internal | Auto-approved |
| `judge` | Internal/Assigned | Assigned from Mentor or Staff for competitions |

### Base User Profile Fields
`institution`, `education_level`, `region`, `bio`, `skills`, `research_interests`, `achievements`, `phone`, `phone_verified`, `avatar`

### Role-Specific Extended Profiles
- **MentorProfile:** `expertise_areas`, `availability`, `is_verified`
- **PartnerProfile:** `org_name`, `partner_type` (industry/community), `sector`, `contact_person`, `is_verified`
- **ResearchAssistantProfile:** `skills`, `availability`, `portfolio`

### Auth Provider Account
Track OAuth connections per user (`AuthProviderAccount`):
- `provider`: `google` | `briq`
- `provider_uid`: unique ID from provider
- `provider_email`: email from provider
- `provider_data`: full token payload (JSON)

### Auth & Identity (Technology)
- **Briq Auth OTP** (via `https://karibu.briq.tz`) — phone number verification via SMS OTP
  - App Key: configured in `BRIQ_APP_KEY` env var
  - Account API Key: `BRIQ_API_KEY` env var (X-API-Key header)
- **Google OAuth** (social login) — frontend renders a custom Google-branded button via `useGoogleLogin` hook (implicit `access_token` flow); backend verifies by calling Google's `/oauth2/v3/userinfo` API; legacy `credential` (ID token) path retained for backwards compatibility
- **JWT** via `djangorestframework-simplejwt` — 30-min access / 7-day refresh, rotate + blacklist on refresh; logout blacklists refresh token
- **Admin approval workflow** — all external roles require admin approval; internal roles are auto-approved

### Admin Actions
- `PATCH /api/v1/auth/users/<pk>/status/` — set status to `active`, `rejected`, or `suspended`
- `PATCH /api/v1/auth/users/<pk>/role/` — reassign user role

### Notification Triggers (5.2 scope)
- User registered → email to admin team
- Account approved → email + optional SMS to user
- Account rejected → email to user with reason
- Account suspended → email to user

---

## 5.3 Research & Innovation Portal (IN SCOPE)
### Requirements
- Research proposal and paper submission (PDF / Word)
- Optional dataset uploads
- Research categorization: Natural Sciences, Social Sciences, Arts, Technology
- Research status tracking: Draft → Submitted → Under Review → Approved/Rejected → Published
- Peer review workflow (mentor/reviewer comments + recommendation)
- Public research repository
- Search and filtering of published research
- Download and view statistics

### Notes
- Only `PUBLISHED` research is publicly visible; drafts and rejected are private to submitter + admin.
- Track basic analytics: views/downloads per research item.
- `Technology` added as a 4th research category.

---

## 5.4 Events, Competitions & Engagement System (IN SCOPE)
### Requirements
- Creation and management of events and competitions
- Event calendar
- Online registration for events
- Research submission linked to competitions
- Manual evaluation and scoring by judges
- Publishing competition winners
- Certificate generation and download (PDF)

### Notes
- Judges scoring is manual but structured (score + comments).
- Certificates must be generated from templates (name, event, date, position).
- Competition is a subtype of `Event` (`event_type = competition`).

---

## 5.5 Mentorship & Partner Network (IN SCOPE)
### Requirements
- Mentor and partner registration with extended profiles
- Mentor profiles with expertise areas and availability
- Youth request for mentorship
- Admin-assisted mentor–mentee matching
- Structured feedback forms for mentors
- Research assistant linking through profiles

### Notes
- Matching can be admin-assisted (no automation required for MVP).
- Mentors should be searchable by expertise.

---

## 5.6 Learning & Resources Hub (Light Version) (IN SCOPE)
### Requirements
- Resource center with guides, templates, and datasets
- Webinar and seminar listings
- Access to recorded sessions (links)
- Downloadable learning materials

**Excluded from MVP:** Full LMS features such as quizzes, grading, progress tracking.

---

## 5.7 Administration, Monitoring & Reporting (IN SCOPE)
### Requirements
- Admin dashboard
- User management and approvals
- Research submission management
- Event and competition management
- Content management (news, announcements, blogs)
- Basic analytics and reports:
  - Number of members
  - Research submissions
  - Approved publications
  - Event participation
- Export reports (CSV / PDF)

### Notes
- Content management is CRUD (simple CMS tables).
- Exports must be accessible via admin UI.

---

## 5.8 Communication & Notifications (IN SCOPE)
### Requirements
- Automated email notifications for:
  - Registration approval/rejection
  - Research submission status changes
  - Event and competition updates
  - Mentorship match notifications
- Contact forms
- In-app real-time messaging
- Chatbot
- SMS notifications (critical alerts only)
- FAQs and documentation pages

### Email (Technology)
- **Brevo** transactional email API via `brevo-python v4` SDK
- Current verified sender: `hassansammah64@gmail.com`; target sender: `noreply@yriftz.org` (pending DNS — CNAME `brevo2._domainkey` → `b2.yriftz-org.dkim.brevo.com`)
- Contact email: `info@yriftz.org`
- Triggers: registration (admin notify), account approved/rejected/suspended, research status changes, mentorship match notifications, contact form auto-replies, news/announcement blasts

### Messaging (Technology)
- **Supabase Realtime** for in-app chat (presence + realtime events)
- Backend: `Conversation` + `Message` models; 16 REST endpoints at `/api/v1/communications/`
- Frontend: 3-second polling chat in `Messages.tsx`; floating `ChatWidget.tsx` (visible on all pages)

### SMS (Technology)
- **BRIQ (Briq.tz)** for SMS delivery — `X-API-Key` header + `app_key` field in request body
- Inbound webhook: `POST /api/v1/communications/briq/webhook/`

### Chatbot (Technology)
- **Sarufi AI** via Sarufi Python SDK — bot name "YRIF Chat"; lazy singleton initialization
- Configured via `SARUFI_API_KEY` + `SARUFI_BOT_ID` env vars; escalation to admin on failure

---

## 6. NON-FUNCTIONAL REQUIREMENTS (MVP) (IN SCOPE)

### 6.1 Performance
- Support at least 2,000–5,000 concurrent users
- Scalable to 10,000+ users
- Page load time under 3 seconds on good networks
- **Implemented:** API throttling middleware (anonymous: 60 req/min; authenticated: 300 req/min); `X-Response-Time` response header; react-query `staleTime` caching on all dashboard and list queries

### 6.2 Security
- Secure authentication and authorization
- Role-based access control (RBAC) enforced on every protected endpoint
- Password encryption (Django bcrypt/argon2)
- User data encryption at rest and in transit
- Secure file upload and storage
- HTTPS enabled
- JWT refresh token blacklist (logout invalidates tokens)
- **Implemented:** Argon2 password hasher (`argon2-cffi`); `SecurityHeadersMiddleware` — sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and CSP (production only); JWT blacklist on logout and refresh rotation

### 6.3 Usability & Accessibility
- Mobile-first and responsive design
- Optimized for smartphones (common in Tanzania)
- Simple and intuitive user interface
- Minimal data usage and lightweight pages
- **Implemented:** Custom `custom_exception_handler` in `apps/core/exceptions.py` (consistent error shapes); skeleton loaders (`SkeletonStat`, `SkeletonCard`) in `src/components/common/Skeleton.tsx`; `ErrorBoundary` component at `src/components/common/ErrorBoundary.tsx`

### 6.4 Reliability & Availability
- Daily automated backups
- High availability (target 90% uptime)
- Disaster recovery readiness
- **Implemented:** `/health/` endpoint — checks DB connectivity + Redis cache; returns `200 OK` (healthy) or `503 Service Unavailable`

### 6.5 Maintainability & Scalability
- Modular system architecture
- Open-source technologies
- Easy content updates by non-technical staff
- Ready for future feature expansion (AI, LMS, payments)

### 6.6 Localization
- Primary language: English
- Architecture prepared for future Swahili support
- **Implemented:** `TIME_ZONE = Africa/Dar_es_Salaam` on backend; `date-fns` for all frontend date formatting

---

## 7. TECHNOLOGY STACK (CONFIRMED)

### 7.1 Frontend
- React + TypeScript (Vite)
- Tailwind CSS
- `@react-oauth/google` — Google Sign-In (`useGoogleLogin` hook, custom button)
- `zustand` — client state management
- `react-query` — server state (caching/sync)
- `react-hook-form` — form handling
- `date-fns` — date formatting
- `lucide-react` — icon library
- Supabase Realtime client for chat

### 7.2 Backend
- Django 4.2 + Django REST Framework (DRF)
- OpenAPI schema + Swagger UI (`drf-spectacular`)
- `djangorestframework-simplejwt` — JWT auth + token blacklist
- `google-auth` — server-side Google ID token verification (legacy path)
- `requests` — HTTP client for Google `/oauth2/v3/userinfo` access token verification
- `argon2-cffi` — Argon2 password hasher
- `brevo-python v4` — Brevo transactional email SDK

### 7.3 Database
- PostgreSQL (primary)

### 7.4 Caching / Background / Real-time support
- Redis (caching; optional queue; supports realtime patterns)

### 7.5 Realtime Chat
- Supabase Realtime (channels, presence, realtime messages)

### 7.6 Authentication
- Briq OTP API (`https://karibu.briq.tz`) for phone verification
- Google OAuth — frontend: custom button via `useGoogleLogin` hook (implicit `access_token` flow); backend: verifies via Google's `/oauth2/v3/userinfo` API; legacy ID token (`credential`) path also supported
- JWT with blacklist (`djangorestframework-simplejwt`) — 30-min access / 7-day refresh, rotate + blacklist on refresh
- Admin approval workflow on top of auth; internal roles (admin, staff, program_manager, content_manager) are auto-approved

### 7.7 SMS
- Briq.tz SMS integration for notifications (`https://karibu.briq.tz`) — `X-API-Key` header + `app_key` in request body

### 7.8 Chatbot
- Sarufi AI integration for FAQ and guided support — Sarufi Python SDK (`sarufi`), lazy singleton initialization; configured via `SARUFI_API_KEY` + `SARUFI_BOT_ID` env vars

### 7.9 Email
- **Brevo** transactional email API (`brevo-python v4`); triggered for all key user lifecycle and content events; contact form auto-replies

### 7.9 Containers & Local Dev
- Docker + Docker Compose for local infra (Postgres, Redis)

### 7.10 CI/CD & Ops
- GitHub Actions (CI: lint/test/build; CD: staging/prod deploy)
- Sentry (error tracking)
- Uptime Kuma (uptime monitoring)
- Prometheus + Grafana (metrics)

---

## 8. SCOPE SUMMARY (IMPORTANT)
**Edson scope:** Module 1 (Public Information Website UI/UX + pages).
**Hassan scope (this document):** Modules 2 to 8 (Sections 5.2–5.8) + ALL Non-functional requirements (Section 6).

---

## 9. IMPLEMENTATION PRIORITY (MVP ORDER)
1. ✅ Accounts + RBAC + Admin approval (Module 5.2)
2. ✅ Research submissions + repository + review workflow (Module 5.3)
3. ✅ Events/competitions + registration + certificate generation (Module 5.4)
4. ✅ Mentorship matching + feedback forms (Module 5.5)
5. ✅ Admin reporting + exports (Module 5.7)
6. ✅ Messaging (Supabase Realtime) + Notifications (Brevo email + Briq SMS) + Sarufi chatbot (Module 5.8)
7. ⬜ Learning Resources Hub (Module 5.6) — pending
8. ⬜ Hardening: automated backups, HTTPS, Sentry, uptime monitoring, Prometheus/Grafana (Section 6 full) — pending

---

## 10. API CONVENTIONS

- Base URL: `/api/v1/`
- Auth routes: `/api/v1/auth/`
- All protected endpoints require `Authorization: Bearer <access_token>`
- Pagination: 20 per page (max 100), standard `count/next/previous/results` format
- Error format: `{ "detail": "..." }` or `{ "field": ["error"] }`
- File uploads: `multipart/form-data`

---

## 11. IMPLEMENTATION NOTES (KEY DECISIONS)

| Decision | Detail |
|----------|--------|
| Google OAuth button | Switched from `GoogleLogin` component to custom-styled button via `useGoogleLogin` hook so button text can be branded ("Your Google Account"); backend accepts both `access_token` and legacy `credential` (ID token) |
| BRIQ button text | "Your Phone Number" — custom `Link` component with BRIQ logo |
| Email provider | Brevo (`brevo-python v4`) replaces SMTP; current verified sender `hassansammah64@gmail.com`; `noreply@yriftz.org` blocked pending CNAME `brevo2._domainkey` DNS record on `yriftz.org` |
| Frontend layout | `AppLayout` (Sidebar + TopBar) wraps all protected routes via React Router `Outlet` pattern in `RequireAuth` guard |
| Route guards | `RequireAuth` — checks `isAuthenticated` + `user.status`; `RequireAdmin` — checks `isAdmin` (admin \| staff \| program_manager) |
| Dashboard | Role-gated: stats, quick actions, and work-queue sections vary by role (see Part 2 of implementation) |
| `is_approved` | Backwards-compatible `@property` on `User` model — returns `status == ACTIVE`; route guards use `user.status` directly |
| CI/CD | GitHub Actions: `ci.yml` (lint + test, triggers on main + staging); `cd-staging.yml` + `cd-production.yml` (auto-deploy) |
| Branch strategy | `feature/*` / `fix/*` / `hotfix/*` → PR to `staging` → PR to `main` (production) |
