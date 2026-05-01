import sys
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

# Load environment variables (mostly for local testing if needed, but strict in production)
load_dotenv()

# STRICT ENVIRONMENT-BASED CONFIG
DATABASE_URL = os.getenv("DATABASE_URL")

# If DATABASE_URL is not set, we cannot proceed in production
if not DATABASE_URL:
    # Check if individual Railway variables exist as a backup if DATABASE_URL is missing
    MYSQLHOST = os.getenv('MYSQLHOST')
    MYSQLUSER = os.getenv('MYSQLUSER')
    MYSQLPASSWORD = os.getenv('MYSQLPASSWORD')
    MYSQLPORT = os.getenv('MYSQLPORT', '3306')
    MYSQLDATABASE = os.getenv('MYSQLDATABASE')
    
    if all([MYSQLHOST, MYSQLUSER, MYSQLDATABASE]):
        DATABASE_URL = f"mysql+pymysql://{MYSQLUSER}:{MYSQLPASSWORD}@{MYSQLHOST}:{MYSQLPORT}/{MYSQLDATABASE}"
    else:
        raise ValueError("DATABASE_URL (or Railway MySQL variables) is not set in environment variables. Connection failed.")

# Ensure compatibility with MySQL + PyMySQL
if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)
elif not DATABASE_URL.startswith("mysql+pymysql://"):
    # If it's just host/pass/etc without scheme, we should be careful, but usually DATABASE_URL has scheme
    pass

# Debug logging (temporary)
print(f"DEBUG: Using DATABASE_URL: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")

# Create engine with connection pooling
try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=3600,   # Recycle connections after 1 hour
        echo=False
    )
    
    # Test connection immediately
    with engine.connect() as connection:
        print("✅ Database connection successful using environment URL!")
        
except OperationalError as e:
    print("❌ Database connection failed!")
    print(f"Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error during database setup: {e}")
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
