
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/chat_history"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def create_db_and_tables():
    Base.metadata.create_all(engine)
