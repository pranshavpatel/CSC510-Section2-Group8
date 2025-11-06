# VibeDish🎵🍽️ — Eat Smart. Save Food. Feel Good.

## Overview
**VibeDish** is a full-stack, AI-powered meal recommendation and ordering platform that connects **user moods from Spotify** to curated food suggestions from local restaurants. Also, it reduces food waste by connecting customers with surplus restaurant meals at discounted prices. This project demonstrates how rapidly teams can build intelligent applications using **FastAPI**, **Supabase**, **Next.js**, and **AI-driven recommender systems**.

---

## Intended Users
- **General users** looking for personalized meal or surplus deals.  
- **Restaurant partners** managing real-time surplus inventory.  
- **Developers & students** exploring AI-assisted full-stack development and testing workflows.

---

## Tech Stack
**Backend:** FastAPI · SQLAlchemy · Supabase · PostgreSQL  
**Frontend:** Next.js (Typescript + Tailwind)  
**AI Module:** Spotify Mood-to-Food Recommender (LLM-based)  
**Testing:** Pytest · Jest   
**Deployment:** Vercel · Render

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

## Features
🔐 Supabase-based Authentication with local JWT fallback
🧠 Mood-to-Food LLM Recommender based on current playing music
🛒 Real-time Cart & Order System with surplus pricing
🍱 Restaurant & Meal Catalog
💬 Discord Support Channel for users and developers
🧪 100 + tests covering nominal & off-nominal cases

---

## Testing
```bash
#to run all tests of backend
pytest tests/ -v

# Run with coverage report
pytest tests/ --cov=Mood2FoodRecSys --cov-report=html --cov-report=term

# Run performance tests only
pytest tests/test_performance.py -v -s

# Run security tests only
pytest tests/test_security.py -v -s

#for frontend
cd client
npm test
```

---

## Documentation
Detailed Doc: /docs
User Guide: step-by-step usage(on support page of software), troubleshooting, and FAQs
Developer Guide: schema, routes, and integration patterns

---

## Release History
Version	Date	Key Features
1.0.0	Nov 2025	Initial public release

---

## Project Roadmap
Timeline	Milestone
1 month	Async Spotify API via httpx + Refined LLM workflow
2 month	Restaurant analytics dashboard + stock prediction
4 months	PWA mobile release + Conversational ordering agent

---

## Support & Community
Join our Discord for help, feedback, and collaboration: https://discord.gg/u73Dqj5dsV

---

## Funding Statement
This project was developed as an passion project and academic requirement.
If funded, future goals include:
- Cloud deployment on AWS Fargate + Supabase Pro tiers
- Advanced AI recommendations (Any music app + Yelp data)
- Paid open-source fellowships for contributors

---

## Contributing
We welcome pull requests!
Please see CONTRIBUTING.md for coding standards, PR workflow, and governance model.

---

## License
Licensed under the MIT License — see LICENSE for details.

---

## Citation
@software{VibeDish_2025,
  author  = {Patel, Pranshav; Patel, Namit; Vanera, Vivek and Patel, Janam},
  title   = {VibeDish: AI-Assisted Food Recommendation System},
  year    = {2025},
  url     = {https://github.com/pranshavpatel/CSC510-Section2-Group8}
}
