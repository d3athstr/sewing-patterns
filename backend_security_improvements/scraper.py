"""
Scraper module for the Sewing Patterns application.
Provides functionality to scrape pattern data from websites.
"""
import requests
from bs4 import BeautifulSoup
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define valid fields for pattern data
VALID_FIELDS = {
    "brand", 
    "pattern_number", 
    "title", 
    "description", 
    "image_data", 
    "format", 
    "size", 
    "difficulty", 
    "material_recommendations", 
    "yardage", 
    "notions", 
    "cut_status", 
    "cut_size", 
    "inventory_qty", 
    "cosplay_hackable", 
    "cosplay_notes", 
    "notes"
}

def download_image_data(image_url):
    """
    Download the image and return its binary content.
    
    Args:
        image_url (str): URL of the image to download
        
    Returns:
        bytes: Binary image data or None if download fails
    """
    try:
        response = requests.get(image_url, stream=True, timeout=10)
        response.raise_for_status()
        return response.content
    except requests.RequestException as e:
        logger.error(f"Error downloading image {image_url}: {e}")
        return None

def scrape_pattern(brand, pattern_number):
    """
    Scrape pattern information from the web.
    
    Args:
        brand (str): The pattern brand (e.g., "Butterick")
        pattern_number (str): The pattern number
        
    Returns:
        dict: Pattern data or error information
        
    Raises:
        requests.RequestException: If network request fails
    """
    # Brand mappings for URL construction
    brand_mappings = {
        "Butterick": ("butterick", "b"),
        "Vogue": ("vogue-patterns", "v"),
        "Simplicity": ("simplicity", "s"),
        "McCall's": ("mccalls", "m"),
        "Know Me": ("know-me", "me"),
        "New Look": ("new-look", "n"),
        "Burda": ("burda-style", "bur"),
    }
    
    # Validate brand
    if brand not in brand_mappings:
        logger.warning(f"Brand '{brand}' is not supported")
        return {"error": f"Brand '{brand}' is not supported"}
    
    # Construct URL
    url_path, prefix = brand_mappings[brand]
    url = f"https://www.simplicity.com/{url_path}/{prefix}{pattern_number}/"
    logger.info(f"Requesting URL: {url}")
    
    # Set headers to mimic browser
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    try:
        # Make request
        response = requests.get(url, headers=headers, timeout=10)
        logger.info(f"HTTP Status Code: {response.status_code}")
        
        # Handle 404 with retry
        if response.status_code == 404:
            # Retry with alternative "pd" prefix
            pd_url = f"https://www.simplicity.com/{url_path}/pd{prefix}{pattern_number}/"
            logger.info(f"Retrying with alternative URL: {pd_url}")
            response = requests.get(pd_url, headers=headers, timeout=10)
            logger.info(f"HTTP Status Code (Retry): {response.status_code}")
            
            if response.status_code != 200:
                return {"error": f"Failed to retrieve data from {url} and {pd_url}"}
        elif response.status_code != 200:
            return {"error": f"Failed to retrieve data from {url}"}
        
        # Parse response
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Extract title
        title_tag = soup.find("meta", property="og:title")
        title = title_tag["content"] if title_tag else f"{brand} {pattern_number}"
        logger.info(f"Title: {title}")
        
        # Extract description
        desc_tag = soup.find("meta", attrs={"name": "description"})
        description = desc_tag["content"] if desc_tag else "No description available"
        logger.info(f"Description: {description}")
        
        # Extract image URL
        image_tag = soup.find("meta", property="og:image")
        image_url = image_tag["content"] if image_tag else "https://via.placeholder.com/150"
        logger.info(f"Image URL: {image_url}")
        
        # Download the image binary data
        image_data = download_image_data(image_url)
        if image_data is None:
            logger.warning("Using placeholder image data because download failed")
            image_data = download_image_data("https://via.placeholder.com/150")
        
        # Create pattern data dictionary with default values
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
        
        # Filter out invalid fields before returning
        return {k: v for k, v in pattern_data.items() if k in VALID_FIELDS}
        
    except requests.RequestException as e:
        logger.error(f"Network error: {str(e)}")
        return {"error": f"Network error: {str(e)}"}
    except Exception as e:
        logger.error(f"Scraper error: {str(e)}")
        return {"error": f"Scraper error: {str(e)}"}
