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
            document.getElementById("modal-file-content").textContent = files[file];
            document.getElementById("exampleModalLabel").textContent = file;
            addHighlightRemovalListeners();
        });
    });
}

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

function saveHighlightToServer(caseId, updatedContent) {
    fetch(`/api/case/highlight/${caseId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify({ updatedContent }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            alert(data.message || "Changes saved successfully.");
        })
        .catch((error) => {
            console.error("Error saving changes:", error);
            alert("Failed to save the changes. Please try again.");
        });
}

function saveUpdatedFile(caseData) {
    const modalContent = document.getElementById("modal-file-content");
    const fileName = document.getElementById("exampleModalLabel").textContent;
    const files = JSON.parse(caseData.fields.files);

    files[fileName] = modalContent.innerHTML;

    saveHighlightToServer(caseData.pk, JSON.stringify(files));
}

function addHighlightRemovalListeners(caseData) {
    const highlights = document.querySelectorAll('[data-highlight]');
    highlights.forEach((highlight) => {
        highlight.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent triggering other click events
            const highlightedText = highlight.textContent;

            if (confirm(`Do you want to remove the highlight for "${highlightedText}"?`)) {
                highlight.replaceWith(document.createTextNode(highlightedText));
                saveUpdatedFile(caseData);
            }
        });
    });
}

const highlightText = (caseData) => {
    const saveHighlightButton = document.getElementById("save-highlight");
    saveHighlightButton.addEventListener("click", () => {
        const selectedText = window.getSelection().toString();
        if (!selectedText) {
            alert("Please select text to highlight.");
            return;
        }

        const selectedColor = document.querySelector('input[name="highlight-color"]:checked').value;
        const modalContent = document.getElementById("modal-file-content");

        const innerHTML = modalContent.innerHTML;
        const newHTML = innerHTML.replace(
            selectedText,
            `<span class="highlight-${selectedColor}" data-highlight>${selectedText}</span>`
        );
        modalContent.innerHTML = newHTML;

        saveUpdatedFile(caseData);

        addHighlightRemovalListeners(caseData);
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
            highlightText(caseData);
        })
        .catch((error) => {
            console.error("Error fetching case data:", error);
        });
});