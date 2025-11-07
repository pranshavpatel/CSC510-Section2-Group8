[![CI/CD Pipeline](https://github.com/pranshavpatel/CSC510-Section2-Group8/actions/workflows/ci.yml/badge.svg)](https://github.com/pranshavpatel/CSC510-Section2-Group8/Project/.github/workflows/ci.yml)
[![codecov](https://codecov.io/github/pranshavpatel/CSC510-Section2-Group8/graph/badge.svg)](https://codecov.io/github/pranshavpatel/CSC510-Section2-Group8)
[![Issues](https://img.shields.io/github/issues/pranshavpatel/CSC510-Section2-Group8)](https://github.com/pranshavpatel/CSC510-Section2-Group8/issues)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<!-- Frontend Code Quality Tool Badges -->
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Type Checker: TypeScript](https://img.shields.io/badge/type_checker-typescript-blue)](https://www.typescriptlang.org/)
[![Testing: Jest](https://img.shields.io/badge/testing-jest-red)](https://jestjs.io/)

<!-- Backend Code Quality Tool Badges -->
[![Linting: Flake8](https://img.shields.io/badge/linting-flake8-yellowgreen)](https://flake8.pycqa.org/)
[![Testing: Pytest](https://img.shields.io/badge/testing-pytest-blue)](https://pytest.org/)
[![Python Version](https://img.shields.io/badge/python-3.11+-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/framework-fastapi-009688)](https://fastapi.tiangolo.com/)

# VibeDish🎵🍽️ — Eat Smart. Save Food. Feel Good.

## Overview
**VibeDish** is a full-stack, AI-powered meal recommendation and ordering platform that connects **user moods from Spotify** to curated food suggestions from local restaurants. It also reduces food waste by connecting customers with surplus restaurant meals at discounted prices. This project demonstrates how rapidly teams can build intelligent applications using **FastAPI**, **Supabase**, **Next.js**, and **AI-driven recommender systems**.

---

## Intended Users
- **General users** looking for personalized meal or surplus deals.  
- **Restaurant partners** managing real-time surplus inventory.  
- **Developers & students** exploring AI-assisted full-stack development and testing workflows.

---

## 🎯 About the Project
VibeDish is an innovative food delivery platform that combines mood-based recommendations with sustainability. By analyzing your Spotify listening history, we recommend surplus restaurant meals that match your current mood, helping reduce food waste while delivering food that resonates with your vibe.

**Key Objectives:**
- Reduce food waste by connecting users with surplus restaurant meals  
- Provide personalized meal recommendations based on mood analysis  
- Create a sustainable and community-driven food delivery ecosystem  
- Offer discounted prices on surplus meals  

---

## 🛠 Tech Stack
### Backend
- **Framework:** FastAPI (Python 3.10+)  
- **Database:** Supabase PostgreSQL  
- **ORM:** SQLAlchemy 2.0 with Alembic migrations  
- **Authentication:** Supabase Auth + JWT  
- **AI Module:** Groq API for music to mood analysis  
- **Music Integration:** Spotify API  

### Frontend
- **Framework:** Next.js (TypeScript + Tailwind)  
- **UI Components:** shadcn/ui  
- **Maps:** Mapbox GL  
- **Authentication:** Supabase Auth  

### Services
- **Realtime:** Supabase Realtime  
- **Deployment:** Vercel · Render  
- **Testing:** Pytest · Jest  

---

## Quick Start
```bash
# clone repository
git clone https://github.com/pranshavpatel/CSC510-Section2-Group8.git
cd Project

# create virtual environment
python -m venv venv
source venv/bin/activate

# install backend dependencies
pip install -r requirements.txt

# configure environment
Write and file .env file

# start backend
uvicorn app.main:app --reload

# start frontend
cd client
npm install
npm run dev
```
Backend → http://localhost:8000

Frontend → http://localhost:3000  

---

## ✨ Features
- Supabase-based Authentication with local JWT fallback  
- Mood-to-Food LLM Recommender based on current playing music  
- Spotify Integration for Mood Analysis   
- Real-time Cart & Order System with surplus pricing  
- Restaurant & Meal Catalog  
- Restaurant Owner Dashboard  
- Surplus Meal Browsing  
- Shopping Cart with Multi-Item Support  
- Order Management & Tracking  
- Sustainability Metrics Tracking  
- Discord Support Channel for users and developers  
- 100+ tests covering nominal & off-nominal cases  

---

## 🧪 Testing and Code Coverage
```bash
pytest tests/ -v
pytest tests/ --cov=Mood2FoodRecSys --cov=app/routers --cov-report=html --cov-report=term
pytest tests/test_performance.py -v -s
pytest tests/test_security.py -v -s
cd client && npm test
```
Coverage: Backend 84%, Frontend 86.25%, Total 559 tests.

---

## 🗺️ Project Roadmap
| Timeline | Milestone |
|-----------|------------|
| 1 month | Async Spotify API via httpx + Refined LLM workflow |
| 2 months | Restaurant analytics dashboard + stock prediction |
| 4 months | PWA mobile release + Conversational ordering agent |

**Future Enhancements**
- Carbon footprint tracking per order  
- Dietary preference learning  
- Social recommendations based on friend activity  
- Sustainability leaderboard and rewards  

---

## 📚 Documentation
- **User Guide:** Step-by-step usage & troubleshooting  
- **Developer Guide:** Schema, routes, integration patterns  
- **API Docs:** [Swagger UI](http://localhost:8000/docs) | [ReDoc](http://localhost:8000/redoc)  

---

## 🚀 Deployment
### Frontend (Vercel)
```bash
cd client
vercel --prod
```

### Backend (Render)
- Deploys from main branch automatically  
- Configure env variables in Render dashboard  

---

## 🤝 Contributing
We welcome pull requests!  
Refer to `CONTRIBUTING.md` for coding standards, PR workflow, and governance model.

---

## 👥 Team
**Course:** CSC 510: Software Engineering  
**Institution:** NC State University  

**Team Members:**
- Pranshav Patel - ppatel49@ncsu.edu  
- Namit Patel - npatel44@ncsu.edu  
- Janam Patel - jpatel46@ncsu.edu  
- Vivek Vanera - vvanera@ncsu.edu  

---

## 📞 Support & Community
Join our Discord for help, feedback, and collaboration:  
[https://discord.gg/u73Dqj5dsV](https://discord.gg/u73Dqj5dsV)

If you encounter any issues:
1. Check documentation  
2. Open an [issue](https://github.com/pranshavpatel/CSC510-Section2-Group8/issues)  
3. Contact the team  

---

## 🧾 Funding Statement
Developed as a passion project and academic requirement.  
If funded, future goals include:
- AWS Fargate + Supabase Pro deployment  
- Multi-platform AI recommendation expansion  
- Paid open-source fellowships for contributors  

---

## 📄 License
Licensed under the MIT License — see `LICENSE` for details.

---

## 📜 Citation
```bibtex
@software{VibeDish_2025,
  author  = {Patel, Pranshav; Patel, Namit; Vanera, Vivek and Patel, Janam},
  title   = {VibeDish: AI-Assisted Food Recommendation System},
  year    = {2025},
  url     = {https://github.com/pranshavpatel/CSC510-Section2-Group8}
}
```

---

*Reducing food waste, one mood at a time.* 🎵🍽️🌱
  year    = {2025},
  url     = {https://github.com/pranshavpatel/CSC510-Section2-Group8}
}
