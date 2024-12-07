from flask import Flask, request, jsonify, send_file
import pandas as pd
import requests
from flask_cors import CORS
import logging
import os
import io
import All_access_keys  # External file for sensitive keys and dataset path

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Load your dataset
dataset_path = All_access_keys.DATA_SET_PATH
if not os.path.exists(dataset_path):
    raise FileNotFoundError(f"Dataset not found at {dataset_path}")

# Read the dataset
dataset = pd.read_csv(dataset_path)

# Handle missing values in 'year' and 'tempo'
dataset['year'] = pd.to_numeric(dataset['year'], errors='coerce')
dataset['tempo'] = pd.to_numeric(dataset['tempo'], errors='coerce')
dataset['year'] = dataset['year'].fillna(0).astype(int)
median_tempo = dataset['tempo'].median()
dataset['tempo'] = dataset['tempo'].fillna(median_tempo)

# YouTube API Key
YOUTUBE_API_KEY = All_access_keys.YOUTUBE_API_KEY

def get_youtube_link(title, artist):
    """
    Fetch the first YouTube video link for a given song title and artist using the YouTube API.
    """
    try:
        query = f"{title} {artist}"
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "key": YOUTUBE_API_KEY,
            "maxResults": 1
        }

        response = requests.get(url, params=params)
        response.raise_for_status()
        results = response.json()
        if "items" in results and results["items"]:
            video_id = results["items"][0]["id"]["videoId"]
            return f"https://www.youtube.com/watch?v={video_id}"
    except Exception as e:
        logging.error(f"Error fetching YouTube link for '{title}' by '{artist}': {e}")
    return "YouTube link not available"

@app.route('/submit-form', methods=['POST'])
def submit_form():
    try:
        data = request.json
        tempo_preference = data.get("tempo", "").strip().lower()
        decade = data.get("decade", "").strip()
        artist = data.get("artist", "").strip().lower()

        filtered_data = dataset.copy()

        # Filter by artist or title
        if artist:
            filtered_data = filtered_data[
                (filtered_data['artist_name'].str.contains(artist, case=False, na=False)) |
                (filtered_data['title'].str.contains(artist, case=False, na=False))
            ]

        # Filter by tempo
        if tempo_preference == "fast":
            filtered_data = filtered_data[filtered_data['tempo'] > 120]
        elif tempo_preference == "slow":
            filtered_data = filtered_data[filtered_data['tempo'] <= 120]

        # Filter by decade
        if decade:
            decade_start = int(decade)
            decade_end = decade_start + 9
            filtered_data = filtered_data[
                (filtered_data['year'] >= decade_start) & (filtered_data['year'] <= decade_end) & (filtered_data['year'] != 0)
            ]

        # Handle empty results
        if filtered_data.empty:
            fallback = dataset.sample(min(5, len(dataset))).to_dict(orient="records")
            for song in fallback:
                song["youtube_link"] = get_youtube_link(song["title"], song["artist_name"])
            return jsonify({"error": "No songs match your preferences.", "fallback": fallback}), 200

        # Get recommendations
        recommendations = filtered_data.sample(min(5, len(filtered_data))).to_dict(orient="records")
        for song in recommendations:
            song["youtube_link"] = get_youtube_link(song["title"], song["artist_name"])

        return jsonify({"data": recommendations}), 200

    except Exception as e:
        logging.error(f"Error processing request: {e}")
        return jsonify({"error": "An error occurred while processing your preferences."}), 500

@app.route('/get-questions', methods=['GET'])
def get_questions():
    questions = [
        {"id": 1, "question": "Do you prefer faster or slower tempos in your music?"},
        {"id": 2, "question": "Which decade of music do you enjoy the most?"},
        {"id": 3, "question": "Is there a specific artist or song title you associate with your memories?"}
    ]
    return jsonify(questions)

@app.route('/get-artists', methods=['GET'])
def get_artists():
    try:
        artists = dataset['artist_name'].dropna().unique().tolist()
        return jsonify({"artists": artists}), 200
    except Exception as e:
        logging.error(f"Error fetching artist names: {e}")
        return jsonify({"error": "An error occurred while fetching artist names."}), 500

if __name__ == '__main__':
    app.run(debug=True)