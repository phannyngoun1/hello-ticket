import os
import psycopg2

try:
    # Get database URL from environment or use default
    db_url = os.getenv("DATABASE_URL", "postgresql://hello:123456@localhost:5432/hello_operational")
    
    # Parse the URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    # Connect to database
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # List all tables
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    
    tables = cur.fetchall()
    print(f"Tables in database ({len(tables)} total):")
    for table in tables:
        print(f"  - {table[0]}")
    
    # Check specifically for file_uploads and layouts
    print("\nChecking key tables:")
    for table_name in ['file_uploads', 'layouts', 'sections', 'show_images']:
        cur.execute(f"""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '{table_name}'
            );
        """)
        exists = cur.fetchone()[0]
        print(f"  {table_name}: {'EXISTS' if exists else 'MISSING'}")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
