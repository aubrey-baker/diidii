function submitPreferences() {
    const genre = document.getElementById("genre").value;
    const artist = document.getElementById("artist").value;

    fetch("http://localhost:5000/recommend", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ genre, artist })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("suggestions").style.display = "block";
        const list = document.getElementById("suggested-music");
        list.innerHTML = "";
        data.suggestions.forEach(song => {
            const listItem = document.createElement("li");
            listItem.textContent = song;
            list.appendChild(listItem);
        });
    })
    .catch(error => console.error("Error:", error));
}
