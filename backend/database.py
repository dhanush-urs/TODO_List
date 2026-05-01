from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
import sys
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get database configuration from environment variables
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_NAME = os.getenv('DB_NAME', 'todo_app')

# Build connection string
if DB_PASSWORD:
    # Encode password to handle special characters
    encoded_password = quote_plus(DB_PASSWORD)
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
else:
    # No password
    DATABASE_URL = f"mysql+pymysql://{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"🔗 Connecting to: mysql+pymysql://{DB_USER}:{'***' if DB_PASSWORD else '(no password)'}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# Create engine with connection pooling
try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=3600,   # Recycle connections after 1 hour
        echo=False,          # Set to True for SQL debugging
        connect_args={
            "charset": "utf8mb4"
        }
    )
    
    # Test connection immediately
    with engine.connect() as connection:
        print("✅ Database connection successful!")
        
except OperationalError as e:
    print("❌ Database connection failed!")
    print(f"Error: {e}")
    print("\nTroubleshooting:")
    print("1. Ensure MySQL server is running: brew services start mysql")
    print("2. Check .env file exists and has correct credentials")
    print("3. Verify database exists:")
    print(f"   mysql -u {DB_USER} -p -e 'CREATE DATABASE IF NOT EXISTS {DB_NAME};'")
    print("4. Check .env file format:")
    print("   DB_USER=root")
    print("   DB_PASSWORD=your_password")
    print(f"   DB_HOST={DB_HOST}")
    print(f"   DB_PORT={DB_PORT}")
    print(f"   DB_NAME={DB_NAME}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    sys.exit(1)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
