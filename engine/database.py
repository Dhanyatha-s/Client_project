import sqlite3
import os
import logging

# Configure logging for production visibility
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DB_PATH = 'data/holter.db'

def initialize_database():
    """
    Ensures the data directory exists and initializes the patients table 
    with a seed record if it doesn't exist.
    """
    # 1. Ensure the directory exists to avoid 'sqlite3.OperationalError'
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    try:
        # 2. Use a context manager for the connection
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            
            # Create Table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS patients (
                    id TEXT PRIMARY KEY, 
                    name TEXT, 
                    age INTEGER, 
                    created_at TEXT
                )
            ''')
            
            # 3. Use Parameterized Queries for safety (even for test data)
            seed_data = ('P001', 'Test Patient', 45, '2026-01-01')
            cursor.execute('''
                INSERT OR IGNORE INTO patients (id, name, age, created_at) 
                VALUES (?, ?, ?, ?)
            ''', seed_data)
            
            conn.commit()
            logger.info("Database initialized and seed record verified.")

    except sqlite3.Error as e:
        logger.error(f"Database error during initialization: {e}")
        raise

def fetch_all_patients():
    """Retrieves all records from the patients table."""
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM patients')
            return cursor.fetchall()
    except sqlite3.Error as e:
        logger.error(f"Error fetching patients: {e}")
        return []

if __name__ == "__main__":
    # Run initialization
    initialize_database()
    
    # Verify and print results
    patients = fetch_all_patients()
    print("-" * 30)
    print("Current Patient Records:")
    for p in patients:
        print(f"ID: {p[0]} | Name: {p[1]} | Age: {p[2]} | Date: {p[3]}")
    print("-" * 30)
