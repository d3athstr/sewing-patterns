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

    return f"https://www.simplicity.com/{brand_map[brand]}{pattern_number}/"

def scrape_pattern(brand, pattern_number):
    try:
        url = construct_pattern_url(brand, pattern_number)
        if not url:
            return {"error": f"Brand '{brand}' not recognized"}

        HEADERS = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }

        response = requests.get(url, headers=HEADERS)
        if response.status_code != 200:
            return {"error": f"Failed to fetch data from {url} (HTTP {response.status_code})"}

        soup = BeautifulSoup(response.text, "html.parser")

        # Extract title
        title_tag = soup.find("meta", property="og:title")
        title = title_tag["content"] if title_tag else f"{brand} {pattern_number}"

        # Extract description
        desc_tag = soup.find("meta", attrs={"name": "description"})
        description = desc_tag["content"] if desc_tag else "No description available"

        # ✅ Extract image using the previously working method
        image_tag = soup.find("meta", property="og:image")
        image = image_tag["content"] if image_tag else "https://via.placeholder.com/150"

        return {
            "brand": brand,
            "pattern_number": pattern_number,
            "title": title,
            "description": description,
            "image": image,  # Corrected image extraction
            "difficulty": "Intermediate",  # Placeholder
            "size": "S-XL",
            "format": "PDF",
            "material_recommendations": "Cotton, Linen",
            "notions": "Zipper, Buttons"
        }

    except Exception as e:
        return {"error": f"Scraper error: {str(e)}"}
