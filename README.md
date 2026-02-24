<p align="center">
  <img src="frontend/src/assets/logos/logo-dark-full-horizontal.svg" alt="YRIF Logo" width="360" />
</p>

<h1 align="center">Youth Research & Innovation Foundation</h1>
<p align="center">
  A national digital platform empowering Tanzanian youth to participate in research, innovation, and knowledge generation aligned with national development priorities.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-MVP%20v1-blue" />
  <img src="https://img.shields.io/badge/backend-Django%204.2-darkgreen" />
  <img src="https://img.shields.io/badge/frontend-React%2018%20%2B%20TypeScript-61dafb" />
  <img src="https://img.shields.io/badge/domain-yriftz.org-teal" />
</p>

---

## Overview

YRIF is a full-stack web platform that connects Tanzanian youth researchers, mentors, educators, and industry partners. It provides a unified space for submitting and reviewing research, joining competitions, accessing learning resources, and engaging with a national network of innovators.

---

## Features

| Module | Description |
|--------|-------------|
| **Research Portal** | Submit, review, and publish research papers with a peer-review workflow |
| **Events & Competitions** | Create events, register participants, score entries, and issue certificates |
| **Mentorship Network** | Browse mentors, request matches, track relationships and feedback |
| **Learning Resources** | Access guides, templates, datasets, and recorded webinars |
| **Real-time Messaging** | In-app chat powered by Supabase Realtime |
| **Admin Dashboard** | User approvals, content management, analytics, and export reports |
| **Notifications** | Email (SMTP), SMS (Briq.tz), and in-app notification channels |
| **Chatbot Support** | FAQ and chat assistance via Sarufi AI |

---

## Tech Stack

### Backend
- **Framework:** Django 4.2 + Django REST Framework
- **Database:** PostgreSQL 16
- **Cache / Queue:** Redis 7 + Celery
- **Auth:** JWT (`djangorestframework-simplejwt`), BRIQ Auth, Google OAuth
- **API Docs:** OpenAPI 3.0 via `drf-spectacular` → `/api/docs/`
- **PDF Generation:** ReportLab (certificates)
- **Integrations:** Supabase, Briq.tz (SMS), Sarufi AI

### Frontend
- **Framework:** React 18 + TypeScript (Vite)
- **Styling:** Tailwind CSS 3 — fonts: **Outfit** (headings) + **Inter** (body)
- **Icons:** Lucide React
- **Routing:** React Router DOM 6
- **State:** Zustand + React Query
- **Forms:** React Hook Form
- **Real-time:** Supabase JS Client

### Infrastructure
- Docker Compose (5 services: PostgreSQL, Redis, Django, React, media volume)
- Nginx (frontend production)
- Gunicorn + WhiteNoise (backend production)

---

## Project Structure

```
YRIF/
├── docker-compose.yml
├── backend/
│   ├── manage.py
│   ├── config/                  # Django settings (base / dev / prod)
│   ├── apps/
│   │   ├── accounts/            # Users, roles, profiles
│   │   ├── research/            # Submissions & reviews
│   │   ├── events/              # Events, competitions, certificates
│   │   ├── mentorship/          # Matching, requests, feedback
│   │   ├── resources/           # Guides, datasets, webinars
│   │   ├── communications/      # Notifications, FAQs, contact
│   │   └── administration/      # Announcements, news, reports
│   ├── requirements/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── assets/logos/        # SVG logo variants (dark/white × icon/horizontal/vertical)
│   │   ├── pages/               # Route-level page components
│   │   ├── components/          # Shared UI components
│   │   ├── api/                 # Axios API client utilities
│   │   ├── store/               # Zustand state slices
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript type definitions
│   │   └── routes.tsx           # Route definitions & guards
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── Dockerfile
└── docs/
    └── product/                 # MVP requirements & specifications
```

---

## API Routes

| Prefix | Description |
|--------|-------------|
| `/api/v1/auth/` | Registration, login, JWT refresh |
| `/api/v1/research/` | Research submissions & peer review |
| `/api/v1/events/` | Events, competitions, registrations |
| `/api/v1/mentorship/` | Mentor profiles & matching |
| `/api/v1/resources/` | Learning resources & webinars |
| `/api/v1/communications/` | Notifications, FAQs, contact forms |
| `/api/v1/admin/` | Admin management & reporting |
| `/api/schema/` | OpenAPI schema |
| `/api/docs/` | Swagger UI |

---

## User Roles

`youth` · `researcher` · `mentor` · `research_assistant` · `industry_partner` · `program_manager` · `content_manager` · `staff` · `admin`

New accounts go through an **admin approval workflow** before gaining full access.

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Create `/backend/.env` and `/frontend/.env` from their respective `.env.example` files

### Run (development)

```bash
docker-compose up
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/api/docs/ |

---

## Brand Assets

Logo variants are in `frontend/src/assets/logos/`:

| File | Use case |
|------|----------|
| `logo-dark.svg` | Icon only — light backgrounds |
| `logo-dark-full-horizontal.svg` | Full name, horizontal — light backgrounds |
| `logo-dark-full-vertical.svg` | Full name, vertical — light backgrounds |
| `logo-white.svg` | Icon only — dark backgrounds |
| `logo-white-full-horizontal.svg` | Full name, horizontal — dark backgrounds |
| `logo-white-full-vertical.svg` | Full name, vertical — dark backgrounds |

---

## Team

| Role | Person |
|------|--------|
| Full-stack Development | Hassan A. Samma |
| Public Website / UI | Edson |
| QA & Analysis | Joleen |

---

## License

© 2026 Youth Research & Innovation Foundation (YRIF). All rights reserved.
