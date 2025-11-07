[![CI/CD Pipeline](https://github.com/pranshavpatel/CSC510-Section2-Group8/actions/workflows/ci.yml/badge.svg)](https://github.com/pranshavpatel/CSC510-Section2-Group8/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/pranshavpatel/CSC510-Section2-Group8/graph/badge.svg)](https://codecov.io/github/pranshavpatel/CSC510-Section2-Group8)
[![Issues](https://img.shields.io/github/issues/pranshavpatel/CSC510-Section2-Group8)](https://github.com/pranshavpatel/CSC510-Section2-Group8/issues)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<!-- Frontend Code Quality Tool Badges -->
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Type Checker: TypeScript](https://img.shields.io/badge/type_checker-typescript-blue)](https://www.typescriptlang.org/)
[![Linting: ESLint](https://img.shields.io/badge/linting-eslint-4b32c3)](https://eslint.org/)
[![Testing: Jest](https://img.shields.io/badge/testing-jest-red)](https://jestjs.io/)

<!-- Backend Code Quality Tool Badges -->
[![Code Style: Black](https://img.shields.io/badge/code_style-black-000000.svg)](https://github.com/psf/black)
[![Linting: Flake8](https://img.shields.io/badge/linting-flake8-yellowgreen)](https://flake8.pycqa.org/)
[![Testing: Pytest](https://img.shields.io/badge/testing-pytest-blue)](https://pytest.org/)
[![Python Version](https://img.shields.io/badge/python-3.10+-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/framework-fastapi-009688)](https://fastapi.tiangolo.com/)

# VibeDish 🎵🍽️

A mood-based sustainable food delivery platform that connects your Spotify listening habits with surplus restaurant meals, reducing food waste while matching your vibe.

## [➡️ Quick Start: Installation & Setup](./START_APP.md)

## [➡️ Testing Guide](./TEST_COMMANDS.md)

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Contributing](#contributing)
- [Team](#team)

## 🎯 About the Project

VibeDish is an innovative food delivery platform that combines mood-based recommendations with sustainability. By analyzing your Spotify listening history, we recommend surplus restaurant meals that match your current mood, helping reduce food waste while delivering food that resonates with your vibe.

**Key Objectives:**
- Reduce food waste by connecting users with surplus restaurant meals
- Provide personalized meal recommendations based on mood analysis
- Create a sustainable and community-driven food delivery ecosystem
- Offer discounted prices on surplus meals

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 16.0.0 (App Router)
- **Language:** TypeScript + React 19
- **UI Components:** shadcn/ui + Tailwind CSS
- **Maps:** Mapbox GL
- **Authentication:** Supabase Auth

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database:** Supabase PostgreSQL
- **ORM:** SQLAlchemy 2.0 with Alembic migrations
- **Authentication:** Supabase Auth + JWT
- **AI/ML:** Groq API for mood analysis
- **Music Integration:** Spotify API

### Database & Services
- **Database:** Supabase PostgreSQL with asyncpg
- **Real-time:** Supabase Realtime
- **Authentication:** Supabase Auth
- **AI:** Groq LLM for mood-to-food recommendations

## 📦 Dependencies

### Frontend Dependencies

#### Production Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.0.0 | React framework with App Router |
| react | 19.1.0 | UI library |
| react-dom | 19.1.0 | React DOM rendering |
| @radix-ui/* | latest | Headless UI components |
| tailwindcss | latest | Utility-first CSS framework |
| mapbox-gl | 3.15.0 | Interactive maps |
| lucide-react | latest | Icon library |

#### Development Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5 | TypeScript language |
| @types/node | ^20 | Node.js type definitions |
| @types/react | ^19 | React type definitions |
| eslint | latest | JavaScript/TypeScript linter |
| prettier | latest | Code formatter |
| jest | 29.7.0 | Testing framework |
| @testing-library/react | 16.3.0 | React testing utilities |

### Backend Dependencies

#### Core Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.120.4 | Web framework with async support |
| uvicorn | 0.38.0 | ASGI server |
| sqlalchemy | 2.0.25 | ORM and database toolkit |
| alembic | 1.17.1 | Database migration tool |
| asyncpg | 0.30.0 | Async PostgreSQL driver |
| pydantic | 2.12.3 | Data validation |
| python-jose | 3.3.0 | JWT handling |
| httpx | 0.28.1 | Async HTTP client |
| spotipy | 2.24.0 | Spotify API client |
| groq | 0.13.0 | Groq AI API client |
| numpy | 1.26.4 | Numerical computing |

#### Testing Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| pytest | 8.4.2 | Testing framework |
| pytest-cov | 7.0.0 | Coverage reporting |
| pytest-asyncio | 0.24.0 | Async test support |
| pytest-mock | 3.14.0 | Mocking utilities |
| psutil | 5.9.8 | Performance monitoring |
| memory-profiler | 0.61.0 | Memory profiling |

## ✨ Features

### Implemented Features
- [x] User Authentication (Sign up, Login, Logout, Profile Management)
- [x] Spotify Integration for Mood Analysis
- [x] AI-Powered Mood-to-Food Recommendations
- [x] Restaurant Discovery with Map View
- [x] Surplus Meal Browsing
- [x] Shopping Cart with Multi-Item Support
- [x] Order Management System
- [x] Order Status Tracking with Timeline
- [x] User Profile (View, Update, Delete Account)
- [x] Address Management
- [x] Restaurant Staff Dashboard
- [x] Real-time Order Updates
- [x] Sustainability Metrics Tracking

### Test Coverage
- **Backend Tests:** 190 tests passed
  - Router Tests: 77 tests (core + edge cases)
  - Recommendation System: 20+ tests
  - Spotify Integration: 10+ tests
  - Performance Tests: 5+ tests
  - Security Tests: 8+ tests
  - Integration Tests: 10+ tests
  - Owner Meals Tests: Additional tests
- **Frontend Tests:** 369 tests passed (14 test suites, 3 failed)
- **Total:** 559 comprehensive tests
- **Coverage:** 84% backend (968 statements), 86.25% frontend

## 🗺️ Project Roadmap

### Current Milestones (Delivered)

**Mood-Based Recommendation System**
- Spotify integration for listening history analysis
- AI-powered mood detection using Groq LLM
- Mood-to-food mapping algorithm
- Comprehensive testing with 20+ test cases

**Sustainable Food Delivery**
- Surplus meal marketplace
- Dynamic pricing for surplus items
- Restaurant inventory management

**Complete User Experience**
- Seamless authentication flow
- Interactive map-based restaurant discovery
- Full order lifecycle management
- User profile and preferences

**Quality Assurance**
- 130+ automated tests
- Performance testing suite
- Security vulnerability scanning
- Integration testing

### Proposed Features (Future Development)

**Enhanced Sustainability**
- Carbon footprint tracking per order
- "Green Delivery" bundling for nearby customers
- Sustainability leaderboard and rewards

**Advanced Recommendations**
- Multi-factor recommendation engine (weather, time, location)
- Dietary preference learning
- Social recommendations based on friend activity

**Community Features**
- User reviews and ratings
- Restaurant loyalty programs
- Referral system

## 📚 API Documentation

The FastAPI backend automatically generates interactive API documentation:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key API Endpoints

#### Authentication
```
POST /auth/signup          # User registration
POST /auth/login           # User login
POST /auth/logout          # User logout
POST /auth/refresh         # Refresh access token
DELETE /auth/me            # Delete account
```

#### User Profile
```
GET  /me                   # Get current user profile
PATCH /me                  # Update user profile
```

#### Addresses
```
GET  /addresses            # List user addresses
POST /addresses            # Create address
PATCH /addresses/{id}      # Update address
DELETE /addresses/{id}     # Delete address
```

#### Cart
```
GET  /cart                 # Get user cart
POST /cart/items           # Add item to cart
PATCH /cart/items/{id}     # Update cart item
DELETE /cart/items/{id}    # Remove cart item
DELETE /cart               # Clear cart
POST /cart/checkout        # Checkout cart
```

#### Orders
```
GET  /orders/mine          # List user orders
GET  /orders/{id}          # Get order details
GET  /orders/{id}/status   # Get order status timeline
PATCH /orders/{id}/cancel  # Cancel order
```

#### Catalog
```
GET  /catalog/restaurants           # List restaurants
GET  /catalog/restaurants/{id}/meals # List meals for restaurant
GET  /meals                         # List surplus meals
```

#### Recommendations
```
POST /recsys/get_recommendations    # Get mood-based recommendations
GET  /spotify/status                # Check Spotify connection
GET  /spotify/login                 # Initiate Spotify OAuth
```

## 📁 Project Structure

```
Project/
├── app/                    # FastAPI Backend
│   ├── routers/           # API route handlers
│   │   ├── address.py     # Address management
│   │   ├── auth_routes.py # Authentication
│   │   ├── cart.py        # Shopping cart
│   │   ├── catalog.py     # Restaurant/meal catalog
│   │   ├── me.py          # User profile
│   │   ├── meals.py       # Meal listings
│   │   └── orders.py      # Order management
│   ├── models.py          # SQLAlchemy ORM models
│   ├── db.py              # Database connection
│   ├── auth.py            # Authentication utilities
│   ├── config.py          # Configuration settings
│   └── main.py            # FastAPI application entry
│
├── client/                # Next.js Frontend
│   ├── app/               # App Router pages
│   │   ├── browse/        # Restaurant browsing
│   │   ├── cart/          # Shopping cart
│   │   ├── orders/        # Order history
│   │   ├── profile/       # User profile
│   │   ├── recommendations/ # Mood recommendations
│   │   ├── login/         # Login page
│   │   └── signup/        # Signup page
│   ├── components/        # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── header.tsx     # Navigation header
│   │   └── footer.tsx     # Footer
│   ├── context/           # React context
│   │   └── auth-context.tsx # Authentication context
│   ├── lib/               # Utilities
│   │   └── api.ts         # API client functions
│   └── __tests__/         # Frontend tests (14 files)
│
├── tests/                 # Backend tests (10 files)
│   ├── test_routers.py    # Core router tests (33)
│   ├── test_routers_edge_cases.py # Edge case tests (44)
│   ├── test_recsys.py     # Recommendation system tests
│   ├── test_recsys_functions.py # RecSys function tests
│   ├── test_recsys_prompts.py # Prompt engineering tests
│   ├── test_spotify_auth.py # Spotify integration tests
│   ├── test_performance.py # Performance tests
│   ├── test_security.py   # Security tests
│   ├── test_integration.py # Integration tests
│   └── test_owner_meals.py # Owner meal management tests
│
├── alembic/               # Database migrations
│   └── versions/          # Migration files
│
├── Mood2FoodRecSys/       # Recommendation system
│   ├── Spotify_Auth.py    # Spotify integration
│   ├── RecSys.py          # Recommendation engine
│   ├── RecSysFunctions.py # Helper functions
│   └── RecSys_Prompts.py  # AI prompt templates
│
├── .github/workflows/     # CI/CD pipelines
│   └── ci.yml             # Main CI/CD workflow
│
├── migrate.py             # Migration helper script
├── requirements.txt       # Python dependencies
├── alembic.ini            # Alembic configuration
└── README.md              # This file
```

## 🧪 Testing

### Run All Tests

```bash
# All backend tests
pytest tests/ -v

# Backend tests with coverage
pytest tests/ --cov=Mood2FoodRecSys --cov=app/routers --cov-report=html --cov-report=term

# Performance tests only
pytest tests/test_performance.py -v -s

# Security tests only
pytest tests/test_security.py -v -s

# Router tests only
pytest tests/test_routers.py tests/test_routers_edge_cases.py -v

# Frontend tests
cd client && npm test
```

### Test Coverage Breakdown

**Backend Tests (190 passed):**
- **Overall Coverage:** 84% (968 statements, 151 missed)
- **Router Tests (77 tests):**
  - Address Router: 95% coverage (61 statements, 3 missed)
  - Auth Routes: 59% coverage (167 statements, 68 missed)
  - Cart Router: 90% coverage (137 statements, 14 missed)
  - Catalog Router: 94% coverage (33 statements, 2 missed)
  - Orders Router: 89% coverage (155 statements, 17 missed)
  - Meals Router: 87% coverage (15 statements, 2 missed)
  - Me Router: 100% coverage (21 statements, 0 missed)
  - Debug Auth: 100% coverage (6 statements, 0 missed)
  - S3 Router: 54% coverage (37 statements, 17 missed)

- **Recommendation System Tests (20+ tests):**
  - RecSys.py: 100% coverage (34 statements, 0 missed)
  - RecSysFunctions.py: 91% coverage (178 statements, 16 missed)
  - RecSys_Prompts.py: 100% coverage (15 statements, 0 missed)

- **Spotify Integration Tests (10+ tests):**
  - Spotify_Auth.py: 89% coverage (109 statements, 12 missed)

- **Additional Tests:**
  - Performance Tests: 5+ tests
  - Security Tests: 8+ tests
  - Integration Tests: 10+ tests
  - Owner Meals Tests: Additional coverage

**Frontend Tests (369 passed, 14 test suites):**
- **Overall Coverage:** 86.25% statements, 76.81% branches, 89.83% functions, 88.01% lines
- **Browse Page:** 83.5% statements, 76.61% branches, 88.37% functions, 84.4% lines
- **Map Page:** 100% coverage
- **Map View Component:** 92.85% statements, 66.66% branches, 91.66% functions, 100% lines
- Profile page tests
- Logout functionality tests
- Component tests
- API integration tests

### Automated Testing Script

```bash
# Run comprehensive test suite
bash run_tests.sh
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd client
vercel --prod
```

### Backend (Render)
- Automatically deploys from `main` branch
- Environment variables configured in Render dashboard

### Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

**Backend (.env):**
```
DATABASE_URL=postgresql+asyncpg://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
GROQ_API_KEY=...
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript/Python best practices
- Write meaningful commit messages (conventional commits)
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

### Code Quality

- **Backend:** Black, Flake8, Pytest
- **Frontend:** Prettier, ESLint, Jest
- **CI/CD:** Automated testing on all PRs

## 📄 Documentation

- [Installation Guide](./START_APP.md)
- [Testing Guide](./TEST_COMMANDS.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [ORM Setup](./ORM_SETUP.md)
- [Quick Start](./QUICK_START.md)
- [API Documentation](http://localhost:8000/docs)

## 👥 Team

**Course:** CSC 510: Software Engineering  
**Institution:** NC State University

**Team Members:**
- Pranshav Patel - ppatel49@ncsu.edu
- Namit Patel - npatel44@ncsu.edu
- Janam Patel - jpatel46@ncsu.edu
- Vivek Vanera - vvanera@ncsu.edu

## 📞 Support

If you encounter any issues or have questions:

1. Check the [documentation](./START_APP.md)
2. Open an [issue](https://github.com/pranshavpatel/CSC510-Section2-Group8/issues)
3. Contact the development team

## 🙏 Acknowledgments

- NC State University CSC 510 Course Staff
- Supabase for database and authentication
- Spotify for music API
- Groq for AI capabilities

---

*Reducing food waste, one mood at a time* 🎵🍽️🌱
