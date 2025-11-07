import os
import databases
from dotenv import load_dotenv

load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")
database = databases.Database(
    DATABASE_URL, min_size=5, max_size=20, ssl=False, statement_cache_size=0
)
