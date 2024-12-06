const createCaseTile = (name, date, status, key) => {
    const div = document.createElement("div");
    div.classList.add("case-card");
    div.setAttribute("key", key);
    div.innerHTML = `
        <p class="h2">${name}</p>
        <div>
            <span>Status:</span>
            <span><strong>${status}</strong></span>
        </div>
        <div>
            <span>Created At:</span>
            <span><strong>${new Date(date).toLocaleString()}</strong></span>
        </div>
    `;
    div.addEventListener("click", () => {
        window.location.href = `/case/${key}`;
    });
    return div;
};

const populateRecentCases = (recentCases) => {
    const recentCasesElement = document.getElementById("recent-cases");
    if (recentCases.length === 0) {
        recentCasesElement.innerHTML = `
            <div class="container">
                <div class="h-100 text-center align-content-center mb-5">
                    <p class="h3">No Cases Yet...</p>
                    <p class="card-subtitle">Add your first case <a href="/add-case/" >here</a> to get started.</p>
                </div>
            </div>
            `;
    } else {
        recentCases.forEach((caseItem) => {
            recentCasesElement.appendChild(
                createCaseTile(
                    caseItem.fields.name,
                    caseItem.fields.created_at,
                    caseItem.fields.status,
                    caseItem.pk
                )
            );
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    fetch('/api/home/')
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            const recentCases = JSON.parse(data.recentCases);
            populateRecentCases(recentCases);
        })
        .catch((error) => {
            console.error("Error fetching case data:", error);
        });
});
