from app.database import SessionLocal, create_db_and_tables
from app.services.synthetic_data_generator import SyntheticDataGenerator


def main() -> None:
    create_db_and_tables()
    db = SessionLocal()
    try:
        result = SyntheticDataGenerator(db).seed_demo_data()
        print(f"Seeded {result['created_msmes']} MSME profiles")
    finally:
        db.close()


if __name__ == "__main__":
    main()
