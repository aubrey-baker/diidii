document.addEventListener("DOMContentLoaded", async function () {
    await populateArtists(); // Populate artists on page load
    const form = document.getElementById("questionnaire-form");
    const recommendationsList = document.getElementById("recommendations-list");
    const artistSelect = document.getElementById("artist");

    // Populate artist dropdown
    async function populateArtists() {
        try {
            const response = await fetch("http://127.0.0.1:5000/get-artists");
            const data = await response.json();
            if (data.artists) {
                artistSelect.innerHTML = `<option value="" disabled selected>Choose an artist</option>`;
                data.artists.forEach((artist) => {
                    const option = document.createElement("option");
                    option.value = artist;
                    option.textContent = artist;
                    artistSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error fetching artist names:", error);
        }
    }

    // Fetch recommendations based on tempo, decade, and artist
    async function fetchRecommendations(tempo, decade, artist) {
        try {
            const response = await fetch("http://127.0.0.1:5000/submit-form", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tempo, decade, artist }),
            });
            return await response.json();
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            return null;
        }
    }

    // Handle form submission
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        recommendationsList.innerHTML = "";

        const tempo = document.getElementById("tempo").value;
        const decade = document.getElementById("decade").value;
        const artist = artistSelect.value;

        if (tempo === "both") {
            // Fetch results for both "Fast" and "Slow"
            const fastResults = await fetchRecommendations("fast", decade, artist);
            const slowResults = await fetchRecommendations("slow", decade, artist);

            // Display both results
            if (fastResults) displayRecommendations(fastResults, "Fast");
            if (slowResults) displayRecommendations(slowResults, "Slow");
        } else {
            // Fetch results for selected tempo
            const results = await fetchRecommendations(tempo, decade, artist);
            if (results) displayRecommendations(results, tempo.charAt(0).toUpperCase() + tempo.slice(1));
        }
    });

    // Display recommendations in the UI
    function displayRecommendations(data, label = "") {
        if (data.error) {
            const errorItem = document.createElement("li");
            errorItem.textContent = `${label} Tempo: ${data.error}`;
            errorItem.classList.add("error");
            recommendationsList.appendChild(errorItem);

            if (data.fallback) {
                data.fallback.forEach((song) => {
                    addRecommendation(song, `${label} Fallback`);
                });
            }
            return;
        }

        data.data.forEach((song) => {
            addRecommendation(song, label);
        });
    }

    // Add individual recommendation to the list
    function addRecommendation(song, label) {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <strong>${label} Title:</strong> ${song.title || "Unknown"} <br>
            <strong>Artist:</strong> ${song.artist_name || "Unknown"} <br>
            <strong>Tempo:</strong> ${song.tempo || "Unknown"} BPM <br>
            <strong>Year:</strong> ${song.year || "Unknown"} <br>
            <h4>YouTube Recommendations:</h4>
            <ul>
                ${song.youtube_recommendations
                    .map(
                        (video) => `
                    <li>
                        <a href="${video.youtube_link}" target="_blank">${video.video_title}</a>
                    </li>`
                    )
                    .join("")}
            </ul>
        `;
        recommendationsList.appendChild(listItem);
    }

    // Populate artist dropdown on page load
    await populateArtists();
});

    // Function to handle form submission
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        recommendationsList.innerHTML = "";

        const tempo = document.getElementById("tempo").value;
        const decade = document.getElementById("decade").value;
        const artist = artistSelect.value;

        try {
            const response = await fetch("http://127.0.0.1:5000/submit-form", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tempo, decade, artist }),
            });

            const data = await response.json();

            if (data.error) {
                const errorItem = document.createElement("li");
                errorItem.textContent = data.error;
                errorItem.classList.add("error");
                recommendationsList.appendChild(errorItem);

                if (data.fallback) {
                    data.fallback.forEach((song) => {
                        const listItem = document.createElement("li");
                        listItem.innerHTML = `
                            <strong>Title:</strong> ${song.title || "Unknown"} <br>
                            <strong>Artist:</strong> ${song.artist_name || "Unknown"} <br>
                            <strong>Tempo:</strong> ${song.tempo || "Unknown"} BPM <br>
                            <strong>Year:</strong> ${song.year || "Unknown"} <br>
                            <a href="${song.youtube_link}" target="_blank">Listen on YouTube</a>
                        `;
                        recommendationsList.appendChild(listItem);
                    });
                }
                return;
            }

            // Display recommendations
            data.data.forEach((song) => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `
                    <strong>Title:</strong> ${song.title || "Unknown"} <br>
                    <strong>Artist:</strong> ${song.artist_name || "Unknown"} <br>
                    <strong>Tempo:</strong> ${song.tempo || "Unknown"} BPM <br>
                    <strong>Year:</strong> ${song.year || "Unknown"} <br>
                    <h4>YouTube Recommendations:</h4>
                    <ul>
                        ${song.youtube_recommendations
                            .map(
                                (video) => `
                            <li>
                                <a href="${video.youtube_link}" target="_blank">${video.video_title}</a>
                            </li>`
                            )
                            .join("")}
                    </ul>
                `;
                recommendationsList.appendChild(listItem);
            });
        } catch (error) {
            const errorItem = document.createElement("li");
            errorItem.textContent = "An error occurred while fetching recommendations.";
            errorItem.classList.add("error");
            recommendationsList.appendChild(errorItem);
            console.error("Error:", error);
        }
    });
