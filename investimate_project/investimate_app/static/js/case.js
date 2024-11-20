const populateCaseData = (caseData) => {
    document.getElementById('case-name').textContent = caseData.fields.name;
    document.getElementById('case-status').textContent = caseData.fields.status;
    document.getElementById('case-created_at').textContent = new Date(caseData.fields.created_at).toLocaleString();
    document.getElementById('case-description').textContent = caseData.fields.description;
}

const populateCaseFiles = (caseData) => {
    const fileList = document.getElementById("file-list");
    const files = JSON.parse(caseData.fields.files);
    Object.keys(files).forEach((file) => {
        const li = document.createElement("li");
        li.innerHTML = `<button type="button" class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#fileModal">${file}</button>`;
        fileList.appendChild(li);
        li.addEventListener("click", (e) => {
            document.getElementById("modal-file-content").textContent = files[file]
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;
    const pathSegments = path.split('/');
    const caseId = pathSegments[2];

    fetch(`/api/case/${caseId}/`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            const caseData = JSON.parse(data.case)[0];
            console.log(caseData);
            populateCaseData(caseData);
            populateCaseFiles(caseData);
        })
        .catch((error) => {
            console.error("Error fetching case data:", error);
        });
});