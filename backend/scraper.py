import requests
from bs4 import BeautifulSoup

def scrape_pattern(brand, pattern_number):
    brand_mappings = {
        "Butterick": ("butterick", "b"),
        "Vogue": ("vogue-patterns", "v"),
        "Simplicity": ("simplicity-patterns", "s"),
        "McCall's": ("mccalls", "m"),
        "Know Me": ("know-me", "me"),
        "New Look": ("new-look", "n"),
        "Burda": ("burda-style", "bur"),
    }

    if brand not in brand_mappings:
        return {"error": f"Brand {brand} not supported"}

    url_path, prefix = brand_mappings[brand]
    base_url = f"https://www.simplicity.com/{url_path}/{prefix}{pattern_number}/"
    
    print(f"🌎 Requesting URL: {base_url}")  # Debugging

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }

    response = requests.get(base_url, headers=HEADERS)
    print(f"📡 HTTP Status Code: {response.status_code}")  # Debugging

    format_type = "Paper"  # Default format

    # Retry with 'pd' prefix if 404
    if response.status_code == 404:
        pd_url = f"https://www.simplicity.com/{url_path}/pd{prefix}{pattern_number}/"
        print(f"🔄 Retrying with alternative URL: {pd_url}")
        response = requests.get(pd_url, headers=HEADERS)
        print(f"📡 HTTP Status Code: {response.status_code}")
        if response.status_code == 200:
            base_url = pd_url
            format_type = "PDF"  # Update format if digital version is used

    if response.status_code != 200:
        return {"error": "Failed to retrieve data"}

    soup = BeautifulSoup(response.text, "html.parser")

    # Extract title
    title_tag = soup.find("meta", property="og:title")
    title = title_tag["content"] if title_tag else f"{brand} {pattern_number}"
    print(f"📖 Title: {title}")  # Debugging

    # Extract description
    desc_tag = soup.find("meta", attrs={"name": "description"})
    description = desc_tag["content"] if desc_tag else "No description available"
    print(f"📝 Description: {description}")  # Debugging

    # Extract image
    image_tag = soup.find("meta", property="og:image")
    image = image_tag["content"] if image_tag else "https://via.placeholder.com/150"
    print(f"🖼 Image URL: {image}")  # Debugging

    return {
        "brand": brand,
        "pattern_number": pattern_number,
        "title": title,
        "description": description,
        "image": image,
        "format": format_type,  # Updated based on URL success
        "difficulty": "Intermediate",
        "size": "S-XL",
        "material_recommendations": "Cotton, Linen",
        "notions": "Zipper, Buttons"
    }