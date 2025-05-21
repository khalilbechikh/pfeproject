from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import declarative_base, relationship
import uuid
from datetime import datetime

Base = declarative_base()

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    agent_type = Column(String)
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("conversations.id"))
    sender = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    message_type = Column(String)
    conversation = relationship("Conversation", back_populates="messages")
    files = relationship("File", back_populates="message")

class File(Base):
    __tablename__ = "files"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String, ForeignKey("messages.id"))
    file_content = Column(JSON)  # {line_number: line}
    file_name = Column(String)
    message = relationship("Message", back_populates="files")
