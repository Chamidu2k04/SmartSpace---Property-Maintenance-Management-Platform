from contextlib import asynccontextmanager
from typing import AsyncIterator

import asyncpg

from core.config import get_settings


class Database:
    def __init__(self) -> None:
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        if self._pool is None:
            self._pool = await asyncpg.create_pool(get_settings().database_url, min_size=1, max_size=10)

    async def disconnect(self) -> None:
        if self._pool is not None:
            await self._pool.close()
            self._pool = None

    @property
    def pool(self) -> asyncpg.Pool:
        if self._pool is None:
            raise RuntimeError("Database pool has not been initialized.")
        return self._pool

    @asynccontextmanager
    async def connection(self) -> AsyncIterator[asyncpg.Connection]:
        async with self.pool.acquire() as connection:
            yield connection


database = Database()
