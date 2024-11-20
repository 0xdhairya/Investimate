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

const populateAllCases = async () => {
    const allCasesElement = document.getElementById("all-cases");
    if (allCases.length === 0) {
        allCasesElement.innerHTML = `
            <div class="container">
                <div class="h-100 text-center align-content-center mb-5">
                    <p class="h3">No Cases Yet...</p>
                    <p class="card-subtitle">Create your first case and get started.</p>
                </div>
            </div>
        `;
    } else {
        allCases.forEach((caseItem) => {
            allCasesElement.appendChild(
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

document.addEventListener("DOMContentLoaded", () => populateAllCases());
