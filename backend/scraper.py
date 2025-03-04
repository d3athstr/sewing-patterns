import requests

def scrape_pattern(brand, pattern_number):
    url_map = {
        "Butterick": f"https://simplicity.com/butterick/b{pattern_number}",
        "Vogue": f"https://simplicity.com/vogue-patterns/v{pattern_number}",
        "Simplicity": f"https://simplicity.com/simplicity-patterns/s{pattern_number}",
        "McCall's": f"https://simplicity.com/mccalls/m{pattern_number}",
        "Know Me": f"https://simplicity.com/know-me/me{pattern_number}",
        "New Look": f"https://simplicity.com/new-look/n{pattern_number}",
        "Burda": f"https://simplicity.com/burda-style/bur{pattern_number}",
    }

    if brand not in url_map:
        return {"error": "Brand not supported"}

    url = url_map[brand]
    response = requests.get(url)

    if response.status_code != 200:
        return {"error": "Failed to retrieve data"}

    return {
        "title": f"{brand} {pattern_number}",
        "description": f"Scraped data for {brand} {pattern_number}",
        "image": "https://via.placeholder.com/150"
    }
