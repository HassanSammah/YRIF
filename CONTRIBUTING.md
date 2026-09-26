# Contributing to YRIF

## Branch Strategy

```
feature/* ──► staging ──► main (production)
hotfix/*  ──────────────► main  (+ back-merge to staging)
```

| Branch | Purpose | Auto-deploy |
|--------|---------|-------------|
| `main` | Production – always deployable, tagged releases | Yes → production |
| `staging` | Pre-prod demo – integration & QA testing | Yes → staging env |
| `feature/*` | All new work – never commit directly to staging/main | No |
| `hotfix/*` | Urgent production fixes | No (manual PR) |

## Workflow

### Starting a feature
```bash
git checkout staging
git pull
git checkout -b feature/your-feature-name
```

### Opening a PR
- Target branch: `staging`
- CI must pass before merge
- At least one reviewer approval required
- Delete branch after merge

### Promoting staging → production
1. Open a PR from `staging` → `main`
2. QA/demo sign-off required
3. CI must pass
4. Squash or merge (your preference)
5. CD pipeline auto-deploys to production

### Hotfix
```bash
git checkout main
git pull
git checkout -b hotfix/issue-description
# fix, test, commit
# open PR → main
# after merge, also open PR → staging to keep them in sync
```

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<short-description>` | `feature/research-submission` |
| Bug fix | `fix/<short-description>` | `fix/auth-token-expiry` |
| Hotfix | `hotfix/<short-description>` | `hotfix/cert-generation-crash` |
| Chore | `chore/<short-description>` | `chore/update-dependencies` |

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add research submission PDF upload
fix: correct auth token refresh logic
chore: bump Django to 5.1
docs: update API endpoint references
```

## Required GitHub Secrets

Set these under **Settings → Secrets and variables → Actions**:

### Staging environment (`staging`)
| Secret | Description |
|--------|-------------|
| `STAGING_SUPABASE_URL` | Supabase project URL |
| `STAGING_SUPABASE_ANON_KEY` | Supabase anon key |
| `STAGING_API_BASE_URL` | Backend API URL |
| `STAGING_DEPLOY_HOOK` | Deploy trigger URL/command |

### Production environment (`production`)
| Secret | Description |
|--------|-------------|
| `PROD_SSH_HOST` | VPS IP or hostname |
| `PROD_SSH_KEY` | Deploy SSH private key (ed25519) |
| `PROD_SECRET_KEY` | Django SECRET_KEY |
| `PROD_DB_NAME` / `PROD_DB_USER` / `PROD_DB_PASSWORD` | Database credentials |
| `PROD_API_BASE_URL` | Frontend API base (`""` for same-origin `/api/`) |
| `PROD_ALLOWED_HOSTS` | Comma-separated hosts |
| `PROD_CORS_ALLOWED_ORIGINS` | Comma-separated HTTPS origins |
| `PROD_BRIQ_API_KEY` / `PROD_BRIQ_APP_KEY` / `PROD_BRIQ_WEBHOOK_SECRET` / `PROD_BRIQ_SMS_SENDER` | Briq SMS/OTP |
| `PROD_BREVO_API_KEY` | Brevo transactional email |
| `PROD_ANTHROPIC_API_KEY` | YRIF Chat |
| `PROD_GOOGLE_CLIENT_ID` | Google OAuth |
| `PROD_SUPABASE_URL` / `PROD_SUPABASE_ANON_KEY` | Supabase realtime |

## Branch Protection (configured on GitHub)

- **`main`** – Require PR, require CI to pass, require 1 approval, no force-push, no direct commits
- **`staging`** – Require PR from feature branches, require CI to pass
