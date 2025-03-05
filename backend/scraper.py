import requests
from bs4 import BeautifulSoup

def construct_pattern_url(brand, pattern_number):
    """Generate the correct URL for the given brand and pattern number."""
    brand_map = {
        "Butterick": "butterick/b",
        "Vogue": "vogue-patterns/v",
        "Simplicity": "simplicity/s",
        "McCall's": "mccalls/m",
        "Know Me": "know-me/me",
        "New Look": "new-look/n",
        "Burda": "burda-style/bur"
    }

    if brand not in brand_map:
        return None

    return f"https://simplicity.com/{brand_map[brand]}{pattern_number}"

def scrape_pattern(brand, pattern_number):
    try:
        # ✅ Ensure correct brand-to-URL mappings
        brand_map = {
            "Butterick": "butterick/b",
            "Vogue": "vogue-patterns/v",
            "Simplicity": "simplicity/s",
            "McCall's": "mccalls/m",
            "Know Me": "know-me/me",
            "New Look": "new-look/n",
            "Burda": "burda-style/bur"
        }

        # Normalize brand key (case-insensitive check)
        normalized_brand = brand.strip().title()

        if normalized_brand not in brand_map:
            return {"error": f"Brand '{brand}' not recognized"}

        url = f"https://www.simplicity.com/{brand_map[normalized_brand]}{pattern_number}/"

        response = requests.get(url)
        if response.status_code != 200:
            return {"error": f"Failed to fetch data from {url} (HTTP {response.status_code})"}

        soup = BeautifulSoup(response.text, 'html.parser')

        # ✅ Extract Data
        title = soup.find("h1").text.strip() if soup.find("h1") else f"{brand} {pattern_number}"
        description = soup.find("div", class_="description").text.strip() if soup.find("div", class_="description") else "No description available"
        image = soup.find("img", class_="product-image")["src"] if soup.find("img", class_="product-image") else "https://via.placeholder.com/150"

        return {
            "brand": brand,
            "pattern_number": pattern_number,
            "title": title,
            "description": description,
            "image": image,
            "difficulty": "Intermediate",  # Placeholder value
            "size": "S-XL",
            "format": "PDF",
            "material_recommendations": "Cotton, Linen",
            "notions": "Zipper, Buttons"
        }

    except Exception as e:
        return {"error": f"Scraper error: {str(e)}"}
