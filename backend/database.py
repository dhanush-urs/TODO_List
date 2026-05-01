import sys
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

# Load environment variables from .env file
load_dotenv()

# Railway-provided MySQL variables
MYSQL_HOST = os.getenv('MYSQLHOST')
MYSQL_PORT = os.getenv('MYSQLPORT')
MYSQL_USER = os.getenv('MYSQLUSER')
MYSQL_PASSWORD = os.getenv('MYSQLPASSWORD')
MYSQL_DATABASE = os.getenv('MYSQLDATABASE')

# Fallback to local .env variables
DB_USER = MYSQL_USER or os.getenv('DB_USER', 'root')
DB_PASSWORD = MYSQL_PASSWORD or os.getenv('DB_PASSWORD', '')
DB_HOST = MYSQL_HOST or os.getenv('DB_HOST', 'localhost')
DB_PORT = MYSQL_PORT or os.getenv('DB_PORT', '3306')
DB_NAME = MYSQL_DATABASE or os.getenv('DB_NAME', 'todo_app')

# Build connection string
if DB_PASSWORD:
    encoded_password = quote_plus(DB_PASSWORD)
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
else:
    DATABASE_URL = f"mysql+pymysql://{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print("🔗 Connecting to database...")

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
