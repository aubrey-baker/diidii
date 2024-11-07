from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/recommend', methods=['POST'])
def recommend():
    user_data = request.get_json()
    genre = user_data.get("genre")
    artist = user_data.get("artist")

    # Connect to the Llama server for music recommendation
    llama_response = get_llama_recommendation(genre, artist)
    
    # Assume the llama server returns a list of suggested songs
    recommendations = llama_response.get("suggestions", [])

    return jsonify({"suggestions": recommendations})

def get_llama_recommendation(genre, artist):
    # Replace with the actual URL and API call to your Llama server
    llama_url = "http://localhost:8000/get_recommendations"
    response = requests.post(llama_url, json={"genre": genre, "artist": artist})
    
    # Returning dummy data for the purpose of this example
    return response.json() if response.status_code == 200 else {"suggestions": ["Example Song 1", "Example Song 2"]}

if __name__ == '__main__':
    app.run(port=5000)
