import sys
import os

# Add backend directory to sys.path so 'app' imports work reliably
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

if __name__ == "__main__":
    import uvicorn
    from app.core.config import settings
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
