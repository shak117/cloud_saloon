import logging
from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("cloud_salon.database")

# Explicit search_path configuration for PostgreSQL
connect_args = {}
if "postgresql" in settings.DATABASE_URL:
    connect_args = {
        "options": f"-c search_path={settings.DB_SCHEMA},public"
    }

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

metadata = MetaData(schema=settings.DB_SCHEMA)
Base = declarative_base(metadata=metadata)

def init_db():
    """Ensure the salon schema exists in PostgreSQL and create tables."""
    try:
        with engine.connect() as conn:
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {settings.DB_SCHEMA};"))
            conn.commit()
            logger.info(f"Verified schema '{settings.DB_SCHEMA}' in PostgreSQL.")
        
        # Create all tables registered with Base
        Base.metadata.create_all(bind=engine)
        logger.info("Initialized all Cloud Salon PostgreSQL tables successfully.")
    except Exception as e:
        logger.error(f"Error initializing Cloud Salon database: {e}")
        raise e

def get_db():
    """Dependency that provides a database session."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
