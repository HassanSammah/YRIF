# YRIF MVP v1 – Developer Requirements & Technology Specification
**Project:** Youth Research & Innovation Foundation (YRIF) Platform  
**Version:** MVP v1  
**Owner (Dev):** Hassan A. Samma (Full-stack)  
**UI/Branding:** Edson (Public Website Module / UI assets)  
**QA/Analysis:** Joleen  
**Date:** 24/02/2026  

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
- Industry & Community Partners  

### 4.2 Internal Users
- System Administrators  
- YRIF Staff  
- Program Managers  
- Content Managers  

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
- Online user registration  
- Role-based authentication and authorization  
- User profile creation and management  
- Profile fields: institution, skills, research interests  
- Admin approval of user accounts  
- Secure login and logout  

### Roles (MVP)
- Youth/Student, Researcher, Mentor, Research Assistant, Industry/Community Partner  
- Admin/Staff/Program Manager/Content Manager  

### Auth & Identity (Technology)
- **BRIQ Auth** (via docs.briq.tz) for email/password and platform auth flows  
- **Google OAuth** (social login)  
- Admin approval workflow required after signup (configurable per role)

---

## 5.3 Research & Innovation Portal (IN SCOPE)
### Requirements
- Research proposal and paper submission (PDF / Word)  
- Optional dataset uploads  
- Research categorization: Natural Sciences, Social Sciences, Arts  
- Research status tracking: submitted, under review, approved, rejected  
- Peer review workflow (mentor/reviewer comments)  
- Public research repository  
- Search and filtering of published research  
- Download and view statistics  

### Notes
- Approved research is publicly visible; drafts and rejected are private to submitter + admin.
- Track basic analytics: views/downloads per research item.

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

---

## 5.5 Mentorship & Partner Network (IN SCOPE)
### Requirements
- Mentor and partner registration  
- Mentor profiles with expertise areas  
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
  - Registration approval  
  - Research submission status  
  - Event and competition updates  
- Contact forms  
- In-app real-time messaging  
- Chatbot  
- SMS notifications  
- FAQs and documentation pages  

### Messaging (Technology)
- **Supabase Realtime** for in-app chat (presence + realtime events)

### SMS + Notifications (Technology)
- **BRIQ (Briq.tz)** for SMS delivery (notifications & alerts)

### Chatbot (Technology)
- **Sarufi AI** for chatbot/FAQ support (MVP: guided FAQ + escalation to admin)

---

## 6. NON-FUNCTIONAL REQUIREMENTS (MVP) (IN SCOPE)

### 6.1 Performance
- Support at least 2,000–5,000 concurrent users  
- Scalable to 10,000+ users  
- Page load time under 3 seconds on good networks  

### 6.2 Security
- Secure authentication and authorization  
- Role-based access control  
- Password encryption  
- User data encryption at rest and in transit  
- Secure file upload and storage  
- HTTPS enabled  

### 6.3 Usability & Accessibility
- Mobile-first and responsive design  
- Optimized for smartphones (common in Tanzania)  
- Simple and intuitive user interface  
- Minimal data usage and lightweight pages  

### 6.4 Reliability & Availability
- Daily automated backups  
- High availability (target 90% uptime)  
- Disaster recovery readiness  

### 6.5 Maintainability & Scalability
- Modular system architecture  
- Open-source technologies  
- Easy content updates by non-technical staff  
- Ready for future feature expansion (AI, LMS, payments)  

### 6.6 Localization
- Primary language: English  
- Architecture prepared for future Swahili support  

---

## 7. TECHNOLOGY STACK (CONFIRMED)

### 7.1 Frontend
- React + TypeScript  
- UI integration with Edson designs  
- API consumption (REST)  
- Supabase Realtime client for chat

### 7.2 Backend
- Django + Django REST Framework (DRF)  
- OpenAPI schema + Swagger UI (drf-spectacular recommended)

### 7.3 Database
- PostgreSQL (primary)

### 7.4 Caching / Background / Real-time support
- Redis (caching; optional queue; supports realtime patterns)

### 7.5 Realtime Chat
- Supabase Realtime (channels, presence, realtime messages)

### 7.6 Authentication
- BRIQ Auth (docs.briq.tz)  
- Google OAuth  
- Admin approval workflow on top of auth

### 7.7 SMS
- Briq.tz SMS integration for notifications

### 7.8 Chatbot
- Sarufi AI integration for FAQ and guided support

### 7.9 Containers & Local Dev
- Docker + Docker Compose for local infra (Postgres, Redis, optional monitoring)

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
1) Accounts + RBAC + Admin approval  
2) Research submissions + repository + review workflow  
3) Events/competitions + registration + certificate generation  
4) Mentorship matching + feedback forms  
5) Admin reporting + exports  
6) Messaging (Supabase Realtime) + Notifications (email + Briq SMS) + Sarufi chatbot  
7) Hardening: security/performance/backups/monitoring

---
