import psycopg2
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base  # assuming your SQLAlchemy models are in models.py

# ---------- EDIT THESE ----------
DB_USER = "postgres"
DB_PASS = "postgres"
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "chat_history"
DB_SCHEMA = "public"  # Optional: default is "public"
# -------------------------------

# 1. Connect to postgres (maintenance DB) and create your target DB if not exists
def create_database_if_not_exists():
    con = psycopg2.connect(
        dbname='postgres',
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT
    )
    con.autocommit = True
    cur = con.cursor()
    cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
    exists = cur.fetchone()
    if not exists:
        print(f"Creating database {DB_NAME}...")
        cur.execute(f'CREATE DATABASE "{DB_NAME}"')
    else:
        print(f"Database {DB_NAME} already exists.")
    cur.close()
    con.close()

# 2. Create tables in your target DB
def create_tables():
    # Use SQLAlchemy for table creation
    db_url = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(db_url)
    Base.metadata.create_all(engine)
    print("All tables created.")

if __name__ == "__main__":
    create_database_if_not_exists()
    create_tables()
