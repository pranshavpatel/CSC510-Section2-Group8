# SQLAlchemy ORM Setup

## Overview
This project uses SQLAlchemy ORM with Alembic migrations for database management.

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Migrations
```bash
# Using helper script
python migrate.py upgrade

# Or directly with alembic
alembic upgrade head
```

### 3. Verify Setup
```bash
python migrate.py current
```

## ORM Models Location
All models are defined in: `app/models.py`

## Available Models
- User
- Restaurant
- Meal
- Address
- Cart
- CartItem
- Order
- OrderItem
- OrderStatusEvent
- RestaurantStaff
- Mood
- UserPreference
- UserSpotifyAuthToken
- SustainabilityMetric

## Usage Examples

### Query Example
```python
from sqlalchemy import select
from app.models import User
from app.db import get_db

async def get_user_by_email(email: str, db):
    result = await db.execute(
        select(User).where(User.email == email)
    )
    return result.scalar_one_or_none()
```

### Create Example
```python
from app.models import Restaurant

async def create_restaurant(name: str, address: str, db):
    restaurant = Restaurant(name=name, address=address)
    db.add(restaurant)
    await db.commit()
    await db.refresh(restaurant)
    return restaurant
```

### Update Example
```python
from sqlalchemy import update
from app.models import Meal

async def update_meal_price(meal_id: str, new_price: float, db):
    await db.execute(
        update(Meal)
        .where(Meal.id == meal_id)
        .values(surplus_price=new_price)
    )
    await db.commit()
```

### Delete Example
```python
from sqlalchemy import delete
from app.models import CartItem

async def delete_cart_item(item_id: str, db):
    await db.execute(
        delete(CartItem).where(CartItem.id == item_id)
    )
    await db.commit()
```

## Migration Commands

```bash
# Create new migration
python migrate.py create "add new column"

# Apply migrations
python migrate.py upgrade

# Rollback
python migrate.py downgrade

# View history
python migrate.py history

# Check current version
python migrate.py current
```

## Files Structure
```
Project/
├── app/
│   └── models.py          # ORM models
├── alembic/
│   ├── versions/          # Migration files
│   └── env.py            # Alembic config
├── alembic.ini           # Alembic settings
├── migrate.py            # Helper script
├── MIGRATION_GUIDE.md    # Detailed guide
└── ORM_SETUP.md          # This file
```
