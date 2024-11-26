import requests
import random
import os
import time

def fetch_random_image():
    # Wikimedia Commons API endpoint
    url = "https://commons.wikimedia.org/w/api.php"

    # Parameters for the API request
    params = {
        "action": "query",
        "format": "json",
        "generator": "random",
        "grnnamespace": "6",  # Namespace for files
        "prop": "imageinfo",
        "iiprop": "url",
        "grnlimit": "10"  # Fetch 10 random images
    }

    headers = {
        "User-Agent": "CS410 UMass Boston (aubrey.place ; Jordan.Baker001@umb.edu)" 
    }

    # Make the API request
    response = requests.get(url, params=params, headers=headers)
    data = response.json()

    # Extract image URLs
    pages = data.get("query", {}).get("pages", {})
    image_urls = [page["imageinfo"][0]["url"] for page in pages.values()]

    # Filter URLs to include only common image formats
    image_urls = [url for url in image_urls if url.lower().endswith(('.jpg', '.jpeg', '.png', '.gif'))]

    # Select a random image URL
    if image_urls:
        random_image_url = random.choice(image_urls)
        return random_image_url
    else:
        return None

def download_image(image_url, save_path):
    try:
        headers = {
            "User-Agent": "CS410 UMass Boston (aubrey.place ; Jordan.Baker001@umb.edu)" 
        }
        response = requests.get(image_url, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        with open(save_path, 'wb') as file:
            file.write(response.content)
        print(f"Image downloaded: {save_path}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to download image: {e}")

if __name__ == "__main__":
    num_images = 5  # Specify the number of images to download

    # Ensure the test_images directory exists
    save_dir = os.path.join(os.getcwd(), "test_images")
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    for i in range(num_images):
        random_image_url = fetch_random_image()
        if random_image_url:
            print(f"Random Image URL: {random_image_url}")

            # Define the save path for the image with a timestamp to ensure uniqueness
            timestamp = int(time.time())
            file_extension = os.path.splitext(random_image_url)[1]
            save_path = os.path.join(save_dir, f"random_image_{timestamp}_{i}{file_extension}")

            # Download the image
            download_image(random_image_url, save_path)
        else:
            print("No suitable image found.")