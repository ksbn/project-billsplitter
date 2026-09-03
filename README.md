# AllSplits — Bill Splitter App

A full-stack bill splitting app. No login required.

## Stack
- **Backend**: Python · FastAPI · PostgreSQL · SQLAlchemy
- **Frontend**: React · Vite · Plain CSS

---

## Quick Start (Docker)

```bash
docker-compose up --build
```
---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt


### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Running Tests

### Backend (uses SQLite — no Postgres needed)

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

### Frontend

```bash
cd frontend
npm install
npm test
```

---

## Pages

| URL | Description |
|-----|-------------|
| `/` | Create a new group |
| `/manage/:ownerToken` | Owner dashboard — add items, members, view totals |
| `/join/:joinToken` | Member page — tap what you ordered |
| `/summary/:ownerToken` | Final bill breakdown with tip |
| `/donate` | Donate to Feeding America or No Kid Hungry |

---

## File Structure

```
billsplitter/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py          # FastAPI app + CORS
│       ├── database.py      # SQLAlchemy engine + session
│       ├── models.py        # ORM models
│       ├── schemas.py       # Pydantic schemas
│       └── api/
│           ├── groups.py    # Group CRUD + summary
│           ├── members.py   # Member management
│           ├── menu_items.py
│           └── selections.py
│   └── tests/
│       └── test_api.py      # 25+ pytest tests
└── frontend/
    ├── Dockerfile
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── utils/api.js     # All fetch calls
        ├── pages/
        │   ├── Home.jsx
        │   ├── Manage.jsx
        │   ├── Join.jsx
        │   ├── Summary.jsx
        │   └── Donate.jsx
        └── test/
            ├── setup.js
            └── pages.test.jsx  # 20+ component tests
```
