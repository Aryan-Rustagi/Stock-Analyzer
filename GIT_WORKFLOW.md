# Stock Analyzer — Git Workflow & Branching Strategy

This document outlines the professional Git workflow, branch naming conventions, commit guidelines, and pull request lifecycle used throughout the **Stock Analyzer** project.

---

## 1. Branching Strategy Model

We adopt a **Git Flow / Feature-Branch Hybrid** strategy:

```
  [main] ───────────────────────────────────────────● [v1.0.0 Release]
     │                                             ▲
     ▼                                             │ (PR + Squash & Merge)
  [dev / testing] ──────●──────────────────●───────┘
     │                  ▲                  ▲
     │ (Branch out)     │ (PR)             │ (PR)
     ├──────────▶ [feat/groq-ai] ──────────┤
     │                                     │
     └──────────▶ [feat/fallback-service] ─┘
```

### Branch Hierarchy:
| Branch | Purpose | Protection Rules |
|---|---|---|
| `main` | Production-ready stable release branch. Auto-deploys to Render & Vercel. | Protected. Direct pushes disallowed. Requires PR review and CI pass. |
| `dev` / `testing` | Active integration branch where features are aggregated and validated. | Protected. Direct merges only via approved Pull Requests. |
| `feature/<name>` | Feature branches branched off `dev` for specific user stories (e.g. `feat/ai-chat`). | Temporary. Deleted after merge into `dev`. |
| `fix/<name>` | Bug fix branches resolving defects found in `dev` (e.g. `fix/rate-limit-parsing`). | Temporary. |
| `hotfix/<name>` | Urgent production patches branched directly from `main`. | Merged into both `main` and `dev`. |

---

## 2. Conventional Commits Standard

All commit messages must follow the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) specification:

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Allowed Types:
- `feat:` A new user-facing feature (e.g., `feat(ai): integrate Groq Llama-3.1 structured analysis`)
- `fix:` A bug fix (e.g., `fix(stockService): resolve Alpha Vantage 429 fallback switch`)
- `docs:` Documentation changes (e.g., `docs: add LLD, HLD, and viva assessment guides`)
- `refactor:` Code changes that neither fix a bug nor add a feature (e.g., `refactor: extract in-memory cache to closureUtils`)
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, dependency updates, build tooling

---

## 3. Pull Request (PR) Lifecycle

1. **Create Branch:**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/your-feature-name
   ```

2. **Commit Changes with Clear Messages:**
   ```bash
   git add .
   git commit -m "feat(portfolio): implement parallel quote resolution with Promise.all"
   ```

3. **Rebase on Latest Integration Branch:**
   ```bash
   git fetch origin
   git rebase origin/dev
   ```

4. **Push & Open Pull Request:**
   ```bash
   git push -u origin feat/your-feature-name
   ```
   - Open PR targeting `dev` on GitHub using the standardized PR template (`.github/pull_request_template.md`).

5. **Code Review & CI Validation:**
   - Automated GitHub Actions CI workflow must pass.
   - Secrets scanning: verify no `.env` or API keys were committed.

6. **Merge Strategy:**
   - **Squash and Merge** into `dev` to maintain a linear and clean git history.

---

## 4. Release Tagging

When preparing a production release from `dev` to `main`:
```bash
git checkout main
git merge dev
git tag -a v1.0.3 -m "Release v1.0.3: Groq LLM integration and API fallback resilience"
git push origin main --tags
```
