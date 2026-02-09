from sqlalchemy import create_engine, text

# Replace with your actual DATABASE_URL
DATABASE_URL = "postgresql://neondb_owner:npg_I6cLlfsPA3XG@ep-billowing-star-aijhg1on-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("DB connection successful:", result.fetchone())
except Exception as e:
    print("DB connection failed:", e)
