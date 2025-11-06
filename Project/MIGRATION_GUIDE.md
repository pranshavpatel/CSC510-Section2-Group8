# Database Migration Guide

## Overview
This project now uses **Alembic** for database migrations and **SQLAlchemy ORM** for database operations.

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Database Configuration
Ensure your `.env` file has the correct `DATABASE_URL`:
```
DATABASE_URL=postgresql+asyncpg://user:password@host:port/database
```

## Migration Commands

### Create a New Migration
```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "description_of_changes"

# Create empty migration (manual)
alembic revision -m "description_of_changes"
```

### Apply Migrations
```bash
# Upgrade to latest version
alembic upgrade head

# Upgrade to specific version
alembic upgrade <revision_id>

# Upgrade one version forward
alembic upgrade +1
```

### Rollback Migrations
```bash
# Downgrade one version
alembic downgrade -1

# Downgrade to specific version
alembic downgrade <revision_id>

# Downgrade to base (remove all)
alembic downgrade base
```

### View Migration History
```bash
# Show current version
alembic current

# Show migration history
alembic history

# Show pending migrations
alembic history --verbose
```

## Project Structure

```
Project/
├── alembic/
│   ├── versions/          # Migration files
│   ├── env.py            # Alembic environment config
│   └── script.py.mako    # Migration template
├── app/
│   ├── models.py         # SQLAlchemy ORM models
│   ├── db.py             # Database connection
│   └── routers/          # API endpoints
├── alembic.ini           # Alembic configuration
└── requirements.txt      # Python dependencies
```

## ORM Models

All database tables are defined as SQLAlchemy models in `app/models.py`:

- **User** - User accounts
- **Restaurant** - Restaurant information
- **Meal** - Menu items
- **Address** - User addresses
- **Cart** - Shopping carts
- **CartItem** - Items in cart
- **Order** - Customer orders
- **OrderItem** - Items in order
- **OrderStatusEvent** - Order status history
- **RestaurantStaff** - Staff assignments
- **Mood** - User mood data
- **UserPreference** - User preferences
- **UserSpotifyAuthToken** - Spotify authentication
- **SustainabilityMetric** - Sustainability tracking

## Using ORM in Code

### Example: Query with ORM
```python
from sqlalchemy import select
from app.models import User, Restaurant
from app.db import get_db

async def get_user(user_id: str, db: AsyncSession):
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()
```

### Example: Create with ORM
```python
from app.models import Address

async def create_address(data: dict, db: AsyncSession):
    address = Address(**data)
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address
```

### Example: Update with ORM
```python
async def update_user(user_id: str, name: str, db: AsyncSession):
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user:
        user.name = name
        await db.commit()
        await db.refresh(user)
    return user
```

## Migration Workflow

### 1. Modify Models
Edit `app/models.py` to add/modify tables or columns.

### 2. Generate Migration
```bash
alembic revision --autogenerate -m "add_new_column"
```

### 3. Review Migration
Check the generated file in `alembic/versions/` and edit if needed.

### 4. Apply Migration
```bash
alembic upgrade head
```

### 5. Test
Run your application and tests to verify the changes.

## Best Practices

1. **Always review auto-generated migrations** before applying
2. **Test migrations** on development database first
3. **Keep migrations small** and focused on one change
4. **Write descriptive migration messages**
5. **Never edit applied migrations** - create new ones instead
6. **Backup database** before running migrations in production
7. **Use transactions** for data migrations

## Common Issues

### Issue: Migration conflicts
**Solution:** Merge migration branches or create a merge migration
```bash
alembic merge <rev1> <rev2> -m "merge migrations"
```

### Issue: Database out of sync
**Solution:** Stamp current version without running migrations
```bash
alembic stamp head
```

### Issue: Need to modify applied migration
**Solution:** Create a new migration to fix it
```bash
alembic revision -m "fix_previous_migration"
```

## Initial Setup (First Time)

If you're setting up the database for the first time:

```bash
# 1. Create database (if not exists)
createdb your_database_name

# 2. Run migrations
alembic upgrade head

# 3. Verify
alembic current
```

## Production Deployment

```bash
# 1. Backup database
pg_dump your_database > backup.sql

# 2. Apply migrations
alembic upgrade head

# 3. Verify
alembic current

# 4. Restart application
```

## Rollback in Production

```bash
# 1. Backup current state
pg_dump your_database > backup_before_rollback.sql

# 2. Rollback
alembic downgrade -1

# 3. Verify
alembic current

# 4. Restart application
```

## Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [FastAPI with SQLAlchemy](https://fastapi.tiangolo.com/tutorial/sql-databases/)
