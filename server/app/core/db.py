import os
from dotenv import load_dotenv
load_dotenv()
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.models.base import Base


def _normalize_database_url(url: str) -> str:
    if url.startswith('postgresql://'):
        return url.replace('postgresql://', 'postgresql+asyncpg://', 1)
    return url


DATABASE_URL = _normalize_database_url(
    os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@localhost:5432/postgres')
)

engine = create_async_engine(DATABASE_URL, future=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    await engine.dispose()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
