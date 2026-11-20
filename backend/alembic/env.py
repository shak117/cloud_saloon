import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, text
from alembic import context

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.database import Base
import app.models  # load all models

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table":
        # Only manage tables within the salon schema
        return object.schema == settings.DB_SCHEMA
    return True

def run_migrations_offline() -> None:
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table_schema=settings.DB_SCHEMA,
        include_schemas=True,
        include_object=include_object
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        url=settings.DATABASE_URL,
        connect_args={"options": f"-c search_path={settings.DB_SCHEMA},public"}
    )

    with connectable.connect() as connection:
        connection.execute(text(f"CREATE SCHEMA IF NOT EXISTS {settings.DB_SCHEMA};"))
        connection.commit()
        
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table_schema=settings.DB_SCHEMA,
            include_schemas=True,
            include_object=include_object
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
