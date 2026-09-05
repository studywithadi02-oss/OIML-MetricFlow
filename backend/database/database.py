import sqlite3
from pathlib import Path


# Database file will be created inside backend/database/
DATABASE_PATH = Path(__file__).resolve().parent / "metricflow.db"


def get_connection():
    """
    Create and return a SQLite database connection.
    """
    connection = sqlite3.connect(DATABASE_PATH)

    # Allows rows to behave like dictionaries
    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():
    """
    Create the inspections table if it does not already exist.
    """

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS inspections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            session_id TEXT UNIQUE NOT NULL,
            inspector_name TEXT,

            instrument_name TEXT NOT NULL,
            manufacturer TEXT,
            model TEXT,
            serial_number TEXT,

            accuracy_class TEXT,
            capacity REAL,
            scale_e REAL,

            weighing_status TEXT,
            eccentricity_status TEXT,
            repeatability_status TEXT,
            tare_zero_status TEXT,

            final_status TEXT,

            created_at TEXT NOT NULL
        )
        """
    )

    connection.commit()
    connection.close()


if __name__ == "__main__":
    initialize_database()
    print("Database initialized successfully.")
    print(f"Database location: {DATABASE_PATH}")