import requests
from bs4 import BeautifulSoup

# ✅ Define only valid fields (updated to use image_data instead of image)
VALID_FIELDS = {
    "brand", "pattern_number", "title", "description", "image_data", "format",
    "size", "difficulty", "material_recommendations", "yardage",
    "notions", "cut_status", "cut_size", "inventory_qty", "cosplay_hackable",
    "cosplay_notes", "notes"
}

def download_image_data(image_url):
    """
    Download the image and return its binary content.
    """
    try:
        response = requests.get(image_url, stream=True)
        response.raise_for_status()
        return response.content
    except requests.RequestException as e:
        print(f"Error downloading image {image_url}: {e}")
        return None

def scrape_pattern(brand, pattern_number):
    brand_mappings = {
        "Butterick": ("butterick", "b"),
        "Vogue": ("vogue-patterns", "v"),
        "Simplicity": ("simplicity", "s"),
        "McCall's": ("mccalls", "m"),
        "Know Me": ("know-me", "me"),
        "New Look": ("new-look", "n"),
        "Burda": ("burda-style", "bur"),
    }

    if brand not in brand_mappings:
        return {"error": f"Brand '{brand}' is not supported"}

    url_path, prefix = brand_mappings[brand]
    url = f"https://www.simplicity.com/{url_path}/{prefix}{pattern_number}/"

    print(f"🌎 Requesting URL: {url}")

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        response = requests.get(url, headers=HEADERS)
        print(f"📡 HTTP Status Code: {response.status_code}")

        if response.status_code == 404:
            # 🔄 Retry with alternative "pd" prefix
            pd_url = f"https://www.simplicity.com/{url_path}/pd{prefix}{pattern_number}/"
            print(f"🔄 Retrying with alternative URL: {pd_url}")
            response = requests.get(pd_url, headers=HEADERS)
            print(f"📡 HTTP Status Code (Retry): {response.status_code}")

            if response.status_code != 200:
                return {"error": f"Failed to retrieve data from {url} and {pd_url}"}

        # ✅ Parse response
        soup = BeautifulSoup(response.text, "html.parser")

        title_tag = soup.find("meta", property="og:title")
        title = title_tag["content"] if title_tag else f"{brand} {pattern_number}"
        print(f"📖 Title: {title}")

        desc_tag = soup.find("meta", attrs={"name": "description"})
        description = desc_tag["content"] if desc_tag else "No description available"
        print(f"📝 Description: {description}")

        image_tag = soup.find("meta", property="og:image")
        image_url = image_tag["content"] if image_tag else "https://via.placeholder.com/150"
        print(f"🖼 Image URL: {image_url}")

        # Download the image binary data.
        image_data = download_image_data(image_url)
        if image_data is None:
            print("⚠️ Using placeholder image data because download failed")
            image_data = download_image_data("https://via.placeholder.com/150")

        # ✅ Ensure all fields have default values
        pattern_data = {
            "brand": brand,
            "pattern_number": pattern_number,
            "title": title,
            "description": description,
            "image_data": image_data,
            "format": "PDF" if "pd" in response.url else "Paper",
            "size": "Unknown",
            "difficulty": "Unknown",
            "material_recommendations": "Not specified",
            "yardage": "Not specified",
            "notions": "Not specified",
            "cut_status": "Uncut",
            "cut_size": "Not specified",
            "inventory_qty": 1,
            "cosplay_hackable": False,
            "cosplay_notes": "",
            "notes": "",
        }

        # ✅ Filter out invalid fields before returning
        return {k: v for k, v in pattern_data.items() if k in VALID_FIELDS}

    except requests.RequestException as e:
        return {"error": f"Network error: {str(e)}"}

    except Exception as e:
        return {"error": f"Scraper error: {str(e)}"}