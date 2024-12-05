import requests
import random
import os
import time

def fetch_random_media():
    # Wikimedia Commons API endpoint
    url = "https://commons.wikimedia.org/w/api.php"

    # Parameters for the API request
    params = {
        "action": "query",
        "format": "json",
        "generator": "random",
        "grnnamespace": "6",  # Namespace for files
        "prop": "imageinfo|videoinfo",
        "iiprop": "url",
        "viprop": "url",
        "grnlimit": "10"  # Fetch 10 random media files to increase chances of getting videos
    }

    headers = {
        "User-Agent": "CS410 UMass Boston (aubrey.place ; Jordan.Baker001@umb.edu)" 
    }

    # Make the API request
    response = requests.get(url, params=params, headers=headers)
    data = response.json()

    # Extract media URLs
    pages = data.get("query", {}).get("pages", {})
    media_urls = []
    video_urls = []

    for page in pages.values():
        if "imageinfo" in page:
            media_urls.append(page["imageinfo"][0]["url"])
        if "videoinfo" in page:
            video_urls.append(page["videoinfo"][0]["url"])

    # Ensure at least 2 videos are included
    if len(video_urls) < 2:
        return None, None

    # Filter URLs to include only common image and video formats
    media_urls = [url for url in media_urls if url.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.mp4', '.webm', '.ogg'))]
    media_urls.extend(video_urls)

    # Select random media URLs
    random.shuffle(media_urls)
    return media_urls[:5], video_urls[:2]

def download_media(media_url, save_path):
    try:
        headers = {
            "User-Agent": "CS410 UMass Boston (aubrey.place ; Jordan.Baker001@umb.edu)" 
        }
        response = requests.get(media_url, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        with open(save_path, 'wb') as file:
            file.write(response.content)
        print(f"Media downloaded: {save_path}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to download media: {e}")

if __name__ == "__main__":
    num_media = 5  # Specify the number of media files to download

    # Ensure the test_media directory exists
    save_dir = os.path.join(os.getcwd(), "test_media")
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    media_urls, video_urls = fetch_random_media()
    if media_urls and video_urls:
        for i, media_url in enumerate(media_urls):
            print(f"Random Media URL: {media_url}")

            # Define the save path for the media with a timestamp to ensure uniqueness
            timestamp = int(time.time())
            file_extension = os.path.splitext(media_url)[1]
            save_path = os.path.join(save_dir, f"random_media_{timestamp}_{i}{file_extension}")

            # Download the media
            download_media(media_url, save_path)
    else:
        print("No suitable media found or not enough videos.")