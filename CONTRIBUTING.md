# Contributing to VibeDish

Welcome to VibeDish! 🎵🍽️ We're excited that you want to contribute to our mood-based sustainable food delivery platform. This guide will help you get started and ensure your contributions align with our project standards.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Architecture Guidelines](#architecture-guidelines)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Security Guidelines](#security-guidelines)
- [Performance Considerations](#performance-considerations)

## Getting Started

### Prerequisites

Before you start contributing, make sure you have:

- **Node.js** 18+ and **npm**
- **Python** 3.10+ and **pip**
- **Git** for version control
- **VS Code** (recommended) with relevant extensions
- A **Supabase** account for database access
- **Spotify Developer Account** (for testing mood-based recommendations)
- **Groq API Key** (for AI-powered recommendations)

### First-Time Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/pranshavpatel/CSC510-Section2-Group8.git
   cd CSC510-Section2-Group8/Project
   ```
3. **Set up the backend**:
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```
4. **Set up the frontend**:
   ```bash
   cd client
   npm install
   ```
5. **Configure environment variables**:
   - Create a `.env` file in the `Project/` directory
   - See the [README.md](../README.md) for required environment variables
   - Required variables include:
     - `DATABASE_URL` (PostgreSQL connection string)
     - `SUPABASE_URL` and `SUPABASE_ANON_KEY`
     - `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`
     - `GROQ_API_KEY`

## Development Setup

### Backend Development

**Project Structure:**
```
Project/
├── app/                    # FastAPI Backend
│   ├── main.py            # FastAPI app entry point
│   ├── routers/           # API route handlers
│   │   ├── auth_routes.py # Authentication endpoints
│   │   ├── address.py     # Address management
│   │   ├── cart.py        # Shopping cart
│   │   ├── catalog.py     # Restaurant/meal catalog
│   │   ├── meals.py       # Meal listings
│   │   ├── orders.py      # Order management
│   │   ├── me.py          # User profile
│   │   └── s3.py          # S3 file uploads
│   ├── owner_meals/       # Restaurant owner endpoints
│   ├── models.py          # SQLAlchemy ORM models
│   ├── db.py              # Database connection
│   ├── auth.py            # Authentication utilities
│   └── config.py          # Configuration settings
├── Mood2FoodRecSys/       # Recommendation system
│   ├── Spotify_Auth.py    # Spotify integration
│   ├── RecSys.py          # Recommendation engine
│   ├── RecSysFunctions.py # Helper functions
│   └── RecSys_Prompts.py  # AI prompt templates
├── database/              # Database utilities
├── alembic/               # Database migrations
└── tests/                 # Test suite (84% coverage)
```

**Running the Backend:**
```bash
cd Project
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Environment Variables Required:**
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
GROQ_API_KEY=your_groq_api_key
AWS_ACCESS_KEY_ID=your_aws_key  # Optional, for S3
AWS_SECRET_ACCESS_KEY=your_aws_secret  # Optional
```

### Frontend Development

**Project Structure:**
```
Project/client/
├── app/                   # Next.js 16 App Router
│   ├── browse/           # Restaurant browsing
│   ├── cart/             # Shopping cart
│   ├── orders/           # Order history
│   ├── profile/          # User profile
│   ├── recommendations/  # Mood recommendations
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   ├── owner/            # Restaurant owner dashboard
│   └── map/              # Map view
├── components/           # React components
│   ├── ui/               # shadcn/ui components
│   ├── header.tsx        # Navigation header
│   ├── footer.tsx        # Footer
│   └── map-view.tsx      # Map component
├── context/              # React context
│   └── auth-context.tsx  # Authentication context
├── lib/                  # Utilities
│   ├── api.ts            # API client functions
│   └── geocoding.ts      # Geocoding utilities
└── __tests__/            # Frontend tests
```

**Running the Frontend:**
```bash
cd Project/client
npm run dev  # Runs on http://localhost:3000
```

## Coding Standards

### Backend (Python/FastAPI)

#### Code Style
- **Follow PEP 8** with 88-character line limit
- **Use type hints** for all function parameters and return values
- **Use async/await** for database operations
- **Follow FastAPI conventions** for route definitions
- **Use Black** for code formatting
- **Use Flake8** for linting

#### Example Route Structure:
```python
from fastapi import APIRouter, HTTPException, Depends
from app.models import Meal, MealCreate
from app.auth import get_current_user
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db

router = APIRouter()

@router.post("/meals", response_model=dict)
async def create_meal(
    meal: MealCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new meal (Owner only)"""
    try:
        # Validate input using Pydantic model
        meal_data = meal.model_dump()
        
        # Database operation using SQLAlchemy
        db_meal = Meal(**meal_data)
        db.add(db_meal)
        await db.commit()
        await db.refresh(db_meal)
        
        return {
            "success": True,
            "message": "Meal created successfully",
            "data": db_meal
        }
            
    except HTTPException:
        raise  # Re-raise HTTPException with original status code
    except Exception as e:
        print(f"Error creating meal: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
```

#### Error Handling Standards:
```python
# ✅ GOOD: Preserve original HTTP status codes
try:
    # ... database operation
    result = await db.execute(select(Meal).where(Meal.id == meal_id))
    meal = result.scalar_one_or_none()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
except HTTPException:
    raise  # Re-raise with original status code
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

# ❌ BAD: Don't catch and re-raise as 500
try:
    # ... operation
except Exception as e:
    raise HTTPException(status_code=500, detail="Something went wrong")
```

#### Database Operations:
```python
# ✅ GOOD: Use SQLAlchemy async patterns
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def get_meal_by_id(meal_id: int, db: AsyncSession) -> Optional[Meal]:
    """Get meal by ID with error handling"""
    try:
        result = await db.execute(select(Meal).where(Meal.id == meal_id))
        return result.scalar_one_or_none()
    except Exception as e:
        print(f"Error fetching meal {meal_id}: {e}")
        return None

# ❌ BAD: Synchronous database operations
def get_meal_by_id(meal_id: int):
    return db.query(Meal).filter(Meal.id == meal_id).first()
```

### Frontend (TypeScript/React/Next.js)

#### Code Style
- **Use TypeScript** for all new components
- **Follow Next.js 16 App Router** conventions
- **Use shadcn/ui components** consistently
- **Use Tailwind CSS** for styling
- **Implement proper error handling**
- **Use Prettier** for code formatting
- **Use ESLint** for linting

#### Component Structure:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Meal {
    id: number;
    name: string;
    description: string;
    price: number;
    // ... other fields
}

export default function MealPage() {
    const params = useParams();
    const router = useRouter();
    const [meal, setMeal] = useState<Meal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const mealId = params.id as string;

    useEffect(() => {
        fetchMeal();
    }, [mealId]);

    const fetchMeal = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/meals/${mealId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
            }
            
            const data = await response.json();
            setMeal(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <Alert><AlertDescription>{error}</AlertDescription></Alert>;
    if (!meal) return <div>Meal not found</div>;

    return (
        <div>
            {/* Component JSX */}
        </div>
    );
}
```

#### Dynamic Routing Standards:
```
✅ GOOD: Use Next.js App Router conventions
app/orders/[id]/page.tsx           # Dynamic route
app/restaurants/[id]/meals/page.tsx # Nested route

❌ BAD: Don't use query parameters for routes
app/orders/page.tsx?id=123  # Wrong approach
```

## Architecture Guidelines

### Backend Architecture

#### Route Organization:
```python
# ✅ GOOD: Separate routers by domain
app/routers/
├── auth_routes.py       # /auth/signup, /auth/login
├── address.py           # /addresses/*
├── cart.py              # /cart/*
├── catalog.py           # /catalog/*
├── meals.py             # /meals/*
├── orders.py            # /orders/*
├── me.py                # /me/*
└── s3.py                # /s3/*

# Main app registration (in app/main.py):
app.include_router(auth_routes.router)
app.include_router(cart.router)
app.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
```

#### Model Design:
```python
# ✅ GOOD: Clear, validated SQLAlchemy models
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Meal(Base):
    __tablename__ = "meals"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    restaurant_id = Column(Integer, nullable=False)
    is_surplus = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Frontend Architecture

#### Component Hierarchy:
```
✅ GOOD: Organized component structure
components/
├── ui/                  # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   └── dialog.tsx
├── header.tsx           # Navigation header
├── footer.tsx           # Footer
└── map-view.tsx         # Map component

app/
├── browse/              # Restaurant browsing
├── cart/                # Shopping cart
├── orders/              # Order history
└── profile/             # User profile
```

#### State Management:
```typescript
// ✅ GOOD: Use React hooks for local state
const [meals, setMeals] = useState<Meal[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// For global state (auth), use React Context:
// - context/auth-context.tsx for authentication state
// - Consider SWR/TanStack Query for server state caching
```

## Testing Requirements

### Backend Testing (Required for all PRs)

**We maintain at least 84% test coverage** - your contributions must maintain this standard.

#### Writing Tests:
```python
# ✅ GOOD: Comprehensive test structure
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app

client = TestClient(app)

class TestMealRoutes:
    @pytest.mark.asyncio
    async def test_create_meal_success(self, mock_db_session, sample_meal_data):
        """Test successful meal creation"""
        # Setup mock
        mock_meal = Meal(**sample_meal_data, id=1)
        mock_db_session.add = AsyncMock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()
        
        # Make request
        response = client.post("/meals", json=sample_meal_data)
        
        # Assertions
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert "data" in data

    @pytest.mark.asyncio
    async def test_create_meal_database_error(self, mock_db_session, sample_meal_data):
        """Test meal creation with database error"""
        # Setup mock to raise exception
        mock_db_session.commit.side_effect = Exception("Database error")
        
        # Make request
        response = client.post("/meals", json=sample_meal_data)
        
        # Assertions
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    def test_create_meal_invalid_data(self, client):
        """Test meal creation with invalid data"""
        invalid_data = {"name": ""}  # Missing required fields
        
        response = client.post("/meals", json=invalid_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
```

#### Running Tests:
```bash
# Run all tests with coverage
cd Project
pytest tests/ --cov=app --cov=Mood2FoodRecSys --cov-report=term-missing --cov-report=html

# Run specific test file
pytest tests/test_routers.py -v

# Run tests matching pattern
pytest -k "meal" -v

# Run with coverage for specific module
pytest tests/test_routers.py --cov=app.routers.meals

# Run performance tests
pytest tests/test_performance.py -v -s

# Run security tests
pytest tests/test_security.py -v -s
```

#### Test Organization:
```python
# ✅ GOOD: Organized test classes
class TestMealRoutes:
    """Test CRUD operations"""
    def test_create_meal_success(self): pass
    def test_get_meal_success(self): pass
    def test_update_meal_success(self): pass
    def test_delete_meal_success(self): pass

class TestMealValidation:
    """Test input validation"""
    def test_invalid_price_format(self): pass
    def test_missing_required_fields(self): pass
    def test_negative_price(self): pass
```

### Frontend Testing (Recommended)

```typescript
// ✅ GOOD: Component testing with Jest/RTL
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MealCard from '@/components/MealCard';

describe('MealCard', () => {
    it('renders meal data correctly', async () => {
        const mockMeal = {
            id: 1,
            name: 'Test Meal',
            price: 12.99,
            description: 'A test meal'
        };

        render(<MealCard meal={mockMeal} />);
        
        expect(screen.getByText('Test Meal')).toBeInTheDocument();
        expect(screen.getByText('$12.99')).toBeInTheDocument();
    });

    it('handles add to cart action', async () => {
        const mockOnAddToCart = jest.fn();
        const mockMeal = { id: 1, name: 'Test Meal', price: 12.99 };
        
        render(<MealCard meal={mockMeal} onAddToCart={mockOnAddToCart} />);
        
        const addButton = screen.getByRole('button', { name: /add to cart/i });
        fireEvent.click(addButton);
        
        await waitFor(() => {
            expect(mockOnAddToCart).toHaveBeenCalledWith(mockMeal);
        });
    });
});
```

## Pull Request Process

### Before Submitting

1. **Run all tests** and ensure they pass:
   ```bash
   cd Project
   pytest tests/ --cov=app --cov=Mood2FoodRecSys --cov-report=term-missing
   cd client && npm test
   ```

2. **Check code formatting**:
   ```bash
   # Python (use black)
   cd Project
   black app/ --line-length 88
   flake8 app/
   
   # TypeScript (use prettier)
   cd Project/client
   npm run lint
   npx prettier --write .
   ```

3. **Verify no breaking changes** to existing APIs

4. **Update documentation** if needed

5. **Run database migrations** if schema changes were made:
   ```bash
   cd Project
   alembic upgrade head
   ```

### PR Template

When creating a pull request, include:

```markdown
## Description
Brief description of changes and why they're needed.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] Backend tests pass (84%+ coverage maintained)
- [ ] Frontend components tested (if applicable)
- [ ] Manual testing completed
- [ ] Performance tests pass (if applicable)
- [ ] Security tests pass (if applicable)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No breaking changes to existing APIs
- [ ] Database migrations created (if schema changed)
- [ ] Environment variables documented (if new ones added)

## Screenshots (if applicable)
[Add screenshots of UI changes]

## Related Issues
Closes #[issue number]
```

### Review Process

1. **Automated checks** must pass (tests, linting, coverage)
2. **Code review** by at least one maintainer
3. **Manual testing** of new features
4. **Documentation review** if applicable
5. **Merge** after approval

## Security Guidelines

### API Security
- **Never commit secrets** to version control
- **Use environment variables** for sensitive configuration
- **Validate all input** using Pydantic models
- **Implement proper error handling** (don't leak sensitive info)
- **Use authentication** for protected endpoints

```python
# ✅ GOOD: Secure error handling
from app.auth import get_current_user

@router.get("/me")
async def get_current_user_profile(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(User).where(User.id == current_user.id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        # Log the full error for debugging
        print(f"Database error: {e}")
        # Return generic error to user
        raise HTTPException(status_code=500, detail="Internal server error")

# ❌ BAD: Leaking sensitive information
try:
    result = await db.execute(select(User).where(User.email == email))
except Exception as e:
    # Don't expose database details to users
    raise HTTPException(status_code=500, detail=str(e))
```

### Database Security
- **Use parameterized queries** (SQLAlchemy handles this)
- **Implement proper authentication** before database access
- **Follow principle of least privilege** for database permissions
- **Use async database operations** to prevent blocking

### Frontend Security
- **Sanitize user input** before displaying
- **Use HTTPS** in production
- **Implement proper authentication** state management
- **Don't store sensitive data** in localStorage
- **Validate API responses** before using data

## Performance Considerations

### Backend Performance
- **Use async/await** for I/O operations
- **Implement pagination** for large datasets
- **Add database indexes** for frequently queried fields
- **Cache frequently accessed data** when appropriate
- **Use connection pooling** for database connections

```python
# ✅ GOOD: Paginated endpoint
from sqlalchemy import select
from fastapi import Query

@router.get("/meals")
async def get_meals(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    offset = (page - 1) * limit
    
    query = select(Meal)
    
    if search:
        query = query.where(Meal.name.ilike(f"%{search}%"))
    
    result = await db.execute(query.offset(offset).limit(limit))
    meals = result.scalars().all()
    
    return {"data": meals, "page": page, "limit": limit}
```

### Frontend Performance
- **Use React.memo** for expensive components
- **Implement lazy loading** for routes and components
- **Optimize images** and use Next.js Image component
- **Minimize bundle size** by tree-shaking unused code
- **Use dynamic imports** for heavy dependencies

```typescript
// ✅ GOOD: Lazy loading and memoization
import dynamic from 'next/dynamic';
import { memo } from 'react';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
    loading: () => <p>Loading...</p>,
    ssr: false
});

const OptimizedMealList = memo(({ meals }: { meals: Meal[] }) => {
    return (
        <div>
            {meals.map(meal => (
                <MealCard key={meal.id} meal={meal} />
            ))}
        </div>
    );
});
```

## Common Patterns and Best Practices

### Error Handling Patterns

```python
# ✅ GOOD: Consistent error responses
from fastapi import HTTPException
from datetime import datetime

def create_error_response(status_code: int, message: str, details: str = None):
    return HTTPException(
        status_code=status_code,
        detail={
            "message": message,
            "details": details,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# Usage:
if not meal_data:
    raise create_error_response(404, "Meal not found", f"ID: {meal_id}")
```

### API Response Patterns

```python
# ✅ GOOD: Consistent response format
from datetime import datetime

def create_success_response(data, message: str = "Success"):
    return {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }

def create_error_response(message: str, details=None):
    return {
        "success": False,
        "message": message,
        "details": details,
        "timestamp": datetime.utcnow().isoformat()
    }
```

### Database Query Patterns

```python
# ✅ GOOD: Reusable database functions
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

async def get_meal_by_id(meal_id: int, db: AsyncSession) -> Optional[Meal]:
    """Get meal by ID with error handling"""
    try:
        result = await db.execute(select(Meal).where(Meal.id == meal_id))
        return result.scalar_one_or_none()
    except Exception as e:
        print(f"Error fetching meal {meal_id}: {e}")
        return None

async def update_meal_status(meal_id: int, is_active: bool, db: AsyncSession) -> bool:
    """Update meal active status"""
    try:
        result = await db.execute(
            select(Meal).where(Meal.id == meal_id)
        )
        meal = result.scalar_one_or_none()
        if meal:
            meal.is_active = is_active
            await db.commit()
            return True
        return False
    except Exception as e:
        print(f"Error updating meal {meal_id}: {e}")
        await db.rollback()
        return False
```

## Getting Help

### Resources
- **Project Documentation**: Check [README.md](../README.md) and [Project/README.md](Project/README.md)
- **API Documentation**: Available at `http://localhost:8000/docs` when backend is running
- **Test Examples**: Look at existing tests in `Project/tests/`
- **Code Examples**: Check existing route handlers and components

### Communication Channels
- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Pull Request Comments**: For code-specific discussions
- **Discord**: [Join our Discord server](https://discord.gg/u73Dqj5dsV) for real-time help

### Contact Maintainers
- **GitHub**: [@pranshavpatel](https://github.com/pranshavpatel)
- **Team Members**:
  - Pranshav Patel - ppatel49@ncsu.edu
  - Namit Patel - npatel44@ncsu.edu
  - Janam Patel - jpatel46@ncsu.edu
  - Vivek Vanera - vvanera@ncsu.edu

---

Thank you for contributing to VibeDish! Your efforts help make this platform better for everyone and reduce food waste, one mood at a time. 🎵🍽️🌱

## Quick Reference

### Useful Commands
```bash
# Backend
cd Project
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload                    # Start backend
pytest tests/ --cov=app --cov=Mood2FoodRecSys -v # Run tests
pytest -k "meal" -v                              # Run specific tests
alembic upgrade head                             # Run migrations
alembic revision --autogenerate -m "description" # Create migration

# Frontend  
cd Project/client
npm run dev                                      # Start frontend
npm run build                                    # Build for production
npm run lint                                     # Check code style
npm test                                         # Run tests

# Both
git checkout -b feature/your-feature-name        # Create feature branch
git add . && git commit -m "feat: descriptive message"  # Commit changes
git push origin feature/your-feature-name        # Push for PR
```

### File Locations
- **Backend Routes**: `Project/app/routers/`
- **Backend Models**: `Project/app/models.py`  
- **Backend Tests**: `Project/tests/`
- **Recommendation System**: `Project/Mood2FoodRecSys/`
- **Frontend Pages**: `Project/client/app/`
- **Frontend Components**: `Project/client/components/`
- **Frontend Tests**: `Project/client/__tests__/`
- **Configuration**: `Project/.env`, `Project/client/.env.local`
- **Database Migrations**: `Project/alembic/versions/`
