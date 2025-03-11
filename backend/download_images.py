import psycopg2
import requests
from io import BytesIO
import os

# Database connection settings (Docker-based)
DB_PARAMS = {
    "dbname": "sewing_patterns",  # Adjust if necessary
    "user": "user",    # Check docker-compose environment settings
    "password": "password",
    "host": "sewing_patterns_db",  # Docker service name as hostname
    "port": "5432"  # Default PostgreSQL port
}

def download_image(url):
    """Download an image and return its binary data."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Raise an error for bad responses (4xx and 5xx)
        return response.content  # Return binary image data
    except requests.RequestException as e:
        print(f"Failed to download {url}: {e}")
        return None

def update_database():
    """Fetch URLs from the database, download images, and update the records."""
    try:
        # Connect to the database
        conn = psycopg2.connect(**DB_PARAMS)
        cursor = conn.cursor()

        # Fetch patterns with image URLs but missing image data
        cursor.execute("SELECT id, image FROM pattern WHERE image IS NOT NULL AND image_data IS NULL")
        patterns = cursor.fetchall()

        for pattern_id, image in patterns:
            print(f"Processing pattern ID {pattern_id} - {image}")

            # Download the image
            image_data = download_image(image)
            if image_data:
                # Update the database
                cursor.execute("UPDATE pattern SET image_data = %s WHERE id = %s", (psycopg2.Binary(image_data), pattern_id))
                conn.commit()
                print(f"Updated pattern ID {pattern_id} with downloaded image.")

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    update_database()

