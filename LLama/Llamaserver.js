document.addEventListener("DOMContentLoaded", function () {
    const questionsContainer = document.getElementById("questions-container");
    const recommendationsDiv = document.getElementById("recommendations");

    // Fetch questions and populate form
    async function loadQuestions() {
        try {
            const response = await fetch("http://127.0.0.1:5000/questions");
            console.log("Response status:", response.status);
            const questions = await response.json();
            console.log("Questions received:", questions);
    
            const container = document.getElementById("questions-container");
            questions.forEach((question) => {
                const questionDiv = document.createElement("div");
                questionDiv.className = "question";
    
                questionDiv.innerHTML = `
                    <label for="q${question.id}">${question.question}</label>
                    <input type="text" id="q${question.id}" name="q${question.id}" placeholder="Your answer">
                `;
    
                container.appendChild(questionDiv);
            });
        } catch (error) {
            console.error("Error loading questions:", error);
            const container = document.getElementById("questions-container");
            container.innerHTML = "<p>Failed to load questions. Please try again later.</p>";
        }
    }
    

    // Handle form submission
    async function handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        try {
            const response = await fetch("http://127.0.0.1:5000/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            recommendationsDiv.innerHTML = "";

            if (result.data.length > 0) {
                result.data.forEach(song => {
                    const div = document.createElement("div");
                    div.className = "recommendation-item";
                    div.innerHTML = `
                        <p><strong>Title:</strong> ${song.title}</p>
                        <p><strong>Artist:</strong> ${song.artist_name}</p>
                        <p><strong>Year:</strong> ${song.year}</p>
                        <p><strong>Description:</strong> ${song.description}</p>
                    `;
                    recommendationsDiv.appendChild(div);
                });
            } else {
                recommendationsDiv.innerHTML = "<p>No recommendations found based on your preferences.</p>";
            }
        } catch (error) {
            console.error("Error submitting preferences:", error);
            recommendationsDiv.innerHTML = "<p>An error occurred while fetching recommendations.</p>";
        }
    }

    // Load questions and attach event listeners
    loadQuestions();
    document.getElementById("questionnaire-form").addEventListener("submit", handleSubmit);
});
