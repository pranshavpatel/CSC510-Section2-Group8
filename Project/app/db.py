from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from .config import settings

# Ensure we're using asyncpg driver
db_url = settings.ASYNC_DATABASE_URL or settings.DATABASE_URL
if not db_url:
    raise ValueError("DATABASE_URL not set")

# Force asyncpg driver
if "postgresql://" in db_url and "+asyncpg" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
elif "postgres://" in db_url:
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://")

print(f"Using database driver: {db_url.split('://')[0]}")

engine = create_async_engine(
    db_url,
    pool_pre_ping=True,
    connect_args={"ssl": "require"}, 
    future=True,
    echo=False 
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_db():
    async with SessionLocal() as session:
        yield session
