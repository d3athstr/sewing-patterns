from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
import psycopg2

app = Flask(__name__)

# PostgreSQL Database Connection
DB_CONFIG = {
    "dbname": "sewing_patterns",
    "user": "user",
    "password": "password",
    "host": "sewing_patterns_db",  # This is the Docker service name
    "port": "5432"
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

# Function to connect to PostgreSQL
def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

# Function to check if the pattern already exists in the database
def check_pattern_in_db(brand, pattern_number):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT title, description, image FROM patterns WHERE brand = %s AND pattern_number = %s", (brand, pattern_number))
    result = cur.fetchone()
    cur.close()
    conn.close()
    return result

# Function to insert new pattern into the database
def insert_pattern_into_db(brand, pattern_number, title, description, image):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO patterns (brand, pattern_number, title, description, image) VALUES (%s, %s, %s, %s, %s)",
        (brand, pattern_number, title, description, image)
    )
    conn.commit()
    cur.close()
    conn.close()

# Function to scrape pattern details
def scrape_pattern(brand, pattern_number):
    brand_map = {
        "Butterick": f"/butterick/b{pattern_number}",
        "Vogue": f"/vogue-patterns/v{pattern_number}",
        "Simplicity": f"/simplicity-patterns/s{pattern_number}",
        "McCall's": f"/mccalls/m{pattern_number}",
        "Know Me": f"/know-me/me{pattern_number}",
        "New Look": f"/new-look/n{pattern_number}",
        "Burda": f"/burda-style/bur{pattern_number}"
    }

    if brand not in brand_map:
        return {"error": "Unsupported brand"}

    url = f"https://www.simplicity.com{brand_map[brand]}"
    response = requests.get(url, headers=HEADERS)

    if response.status_code != 200:
        return {"error": "Failed to retrieve data"}

    soup = BeautifulSoup(response.text, "html.parser")

    title_tag = soup.find("meta", property="og:title")
    title = title_tag["content"] if title_tag else "NOT FOUND"

    desc_tag = soup.find("meta", attrs={"name": "description"})
    description = desc_tag["content"] if desc_tag else "NOT FOUND"

    image_tag = soup.find("meta", property="og:image")
    image = image_tag["content"] if image_tag else "NOT FOUND"

    return {"title": title, "description": description, "image": image}

@app.route("/scrape", methods=["GET"])
def scrape():
    brand = request.args.get("brand")
    pattern_number = request.args.get("pattern_number")

    if not brand or not pattern_number:
        return jsonify({"error": "Missing brand or pattern_number"}), 400

    # Check if pattern already exists in DB
    pattern = check_pattern_in_db(brand, pattern_number)
    if pattern:
        return jsonify({"title": pattern[0], "description": pattern[1], "image": pattern[2]})

    # If not in DB, scrape it
    pattern_data = scrape_pattern(brand, pattern_number)
    
    if "error" in pattern_data:
        return jsonify(pattern_data), 500

    # Insert into DB
    insert_pattern_into_db(brand, pattern_number, pattern_data["title"], pattern_data["description"], pattern_data["image"])

    return jsonify(pattern_data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
