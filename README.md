# SmartSpace - Property & Maintenance Management Platform

SmartSpace is an integrated full-stack and Agentic AI application. It streamlines property maintenance by connecting tenants, property managers, and technicians through a cross-platform system, utilizing AI to triage issues, check leases, and generate cost estimates.

## 👥 Team Components
1. Property & Lease Management
2. Maintenance Request Management
3. Inventory & Supplier Management
4. Technician Scheduling & Quotations

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | ASP.NET Core 8 Web API (C#) + PostgreSQL (via EF Core) |
| **Web Frontend** | React 18 + Vite + Tailwind CSS |
| **Mobile App** | Flutter (Dart) |
| **AI Service** | Python FastAPI + LangChain + LangGraph |

## 📁 Repository Structure

```
SmartSpace/
├── backend/
│   └── SmartSpace.API/          # ASP.NET Core 8 Web API
│       ├── Controllers/
│       ├── Models/
│       ├── DTOs/
│       ├── Services/
│       └── Data/
│           └── (PropertyManagement | MaintenanceTickets | Inventory | Scheduling)
├── frontend-web/                # React + Vite web application
│   └── src/
│       ├── components/
│       ├── pages/
│       └── store/
├── mobile-app/
│   └── smartspace_mobile/       # Flutter mobile application
│       └── lib/
│           └── (screens | widgets | models | providers | services)
├── ai-service/                  # Python FastAPI AI agent service
│   ├── main.py
│   └── requirements.txt
└── .github/
    └── workflows/
        └── main.yml             # CI/CD pipeline
```

## 🚀 Getting Started

### Prerequisites
- .NET 8 SDK
- Node.js 18+ and npm
- Flutter SDK
- Python 3.11+
- PostgreSQL 15+

### Running Each Service

**Backend (ASP.NET Core):**
```bash
cd backend/SmartSpace.API
dotnet run
# API available at https://localhost:5001
```

**Web Frontend (React + Vite):**
```bash
cd frontend-web
npm install
npm run dev
# App available at http://localhost:5173
```

**Mobile App (Flutter):**
```bash
cd mobile-app/smartspace_mobile
flutter pub get
flutter run
```

**AI Service (FastAPI):**
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

## 🌿 Git Workflow Rules

1. **Never commit directly to `main`.**
2. Create a branch for your component (e.g., `feature/inventory-api`).
3. Commit regularly with descriptive messages.
4. Open a Pull Request (PR) and get it reviewed by a teammate before merging.

### Branch Naming Convention

| Component | Branch Name Pattern |
|---|---|
| Property & Lease Management | `feature/property-*` |
| Maintenance Request Management | `feature/maintenance-*` |
| Inventory & Supplier Management | `feature/inventory-*` |
| Technician Scheduling & Quotations | `feature/scheduling-*` |

## 🤝 Contributing

1. Fork or clone the repository
2. Create your feature branch: `git checkout -b feature/your-component`
3. Make your changes and commit: `git commit -m "feat: add property listing endpoint"`
4. Push to the branch: `git push origin feature/your-component`
5. Open a Pull Request against `main`

---

*SmartSpace — SE3090 Software Engineering Frameworks, SLIIT*
