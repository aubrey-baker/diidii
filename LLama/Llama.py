from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Load the MSD dataset (replace with the actual file path)
msd_dataset = pd.read_csv("/Users/wayanprice/diidii/datasets_for_diidii/msd_metadata_cleaned.csv")

# Sample questions
questions = [
    {"id": 1, "question": "What mood are you trying to achieve? (e.g., calm, happy, energetic)"},
    {"id": 2, "question": "What is your preferred tempo range? (e.g., 90-120)"},
    {"id": 3, "question": "Do you have a favorite genre of music? (e.g., classical, jazz, rock, pop)"},
    {"id": 4, "question": "Do you prefer music with lyrics or instrumental tracks?"},
]

@app.route('/questions', methods=['GET'])
def get_questions():
    return jsonify(questions)

@app.route('/submit', methods=['POST'])
def submit_preferences():
    user_responses = request.json

    # Extract user inputs
    mood = user_responses.get("q1", "").lower()
    tempo_range = user_responses.get("q2", "")  # e.g., "90-120"
    genre = user_responses.get("q3", "").lower()
    lyrics_preference = user_responses.get("q4", "").lower()

    # Parse tempo range
    try:
        min_tempo, max_tempo = map(int, tempo_range.split('-'))
    except ValueError:
        min_tempo, max_tempo = 0, 300  # Default range

    # Filter the MSD dataset
    recommendations = msd_dataset[
        (msd_dataset['tempo'] >= min_tempo) &
        (msd_dataset['tempo'] <= max_tempo)
    ]

    if genre:
        recommendations = recommendations[recommendations['artist_name'].str.contains(genre, na=False)]

    # Limit recommendations
    top_recommendations = recommendations.head(10).to_dict(orient='records')

    return jsonify({"data": top_recommendations})

if __name__ == '__main__':
    app.run(debug=True)
