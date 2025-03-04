import psycopg2
import requests
from bs4 import BeautifulSoup
from datetime import datetime

# Database connection settings
DB_PARAMS = {
    "dbname": "sewing_patterns",
    "user": "user",
    "password": "password",
    "host": "sewing_patterns_db",  # This should be the service name in docker-compose
    "port": 5432
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

def scrape_pattern(brand, pattern_number):
    url = f"https://www.simplicity.com/{brand.lower()}/{brand[0].lower()}{pattern_number}"
    response = requests.get(url, headers=HEADERS)

    if response.status_code != 200:
        return {"error": "Failed to retrieve data"}

    soup = BeautifulSoup(response.text, "html.parser")

    title_tag = soup.find("meta", property="og:title")
    desc_tag = soup.find("meta", attrs={"name": "description"})
    image_tag = soup.find("meta", property="og:image")

    title = title_tag["content"] if title_tag else "Unknown Title"
    description = desc_tag["content"] if desc_tag else "No description available"
    image = image_tag["content"] if image_tag else ""

    # Insert into database
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO patterns (brand, pattern_number, title, description, image, last_updated)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (brand, pattern_number) 
            DO UPDATE SET 
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                image = EXCLUDED.image,
                last_updated = EXCLUDED.last_updated;
        """, (brand, pattern_number, title, description, image, datetime.now()))

        conn.commit()
        cur.close()
        conn.close()

    except Exception as e:
        return {"error": f"Database error: {e}"}

    return {
        "title": title,
        "description": description,
        "image": image
    }
