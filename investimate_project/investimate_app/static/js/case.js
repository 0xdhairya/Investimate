const populateCaseData = (caseData) => {
    document.getElementById('case-name').textContent = caseData.fields.name;
    document.getElementById('case-status').textContent = caseData.fields.status;
    document.getElementById('case-created_at').textContent = new Date(caseData.fields.created_at).toLocaleString();
    document.getElementById('case-description').textContent = caseData.fields.description;
}

const applyHighlights = (content, annotations) => {
    Object.keys(annotations).forEach((category) => {
        annotations[category].forEach((highlight) => {
            const modalContent = document.getElementById("modal-file-content");
            const innerHTML = modalContent.innerHTML;
            const newHTML = innerHTML.replace(
                highlight.text,
                `<span class="highlight-${category}" data-highlight>${highlight.text}</span>`
            );
            modalContent.innerHTML = newHTML;
        })
    })
    // // Apply each highlight
    // highlights.forEach(({ start, end, color }) => {
    //     const before = highlightedContent.slice(0, start);
    //     const toHighlight = highlightedContent.slice(start, end);
    //     const after = highlightedContent.slice(end);
    //     highlightedContent = `${before}<span class="highlight-${color}" data-highlight>${toHighlight}</span>${after}`;
    // });

    // modalContent.innerHTML = highlightedContent;
};

const populateCaseFiles = (caseData) => {
    const fileList = document.getElementById("file-list");
    const files = caseData.fields.files;
    Object.keys(files).forEach((file) => {
        const li = document.createElement("li");
        li.innerHTML = `<button type="button" class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#fileModal">${file}</button>`;
        fileList.appendChild(li);
        li.addEventListener("click", () => {
            const content = files[file].content;
            const annotations = files[file].annotations || [];
            document.getElementById("modal-file-content").textContent = files[file].content;
            document.getElementById("exampleModalLabel").textContent = file;
            applyHighlights(content, annotations);
            addHighlightRemovalListeners(caseData);
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

function saveUpdatedFile(caseData, annotationCategory) {
    const modalContent = document.getElementById("modal-file-content");
    const fileName = document.getElementById("exampleModalLabel").textContent;
    const files = caseData.fields.files;

    const highlights = [];
    const textContent = modalContent.textContent; // Extract plain text
    const spans = modalContent.querySelectorAll('[data-highlight]');
    spans.forEach((span) => {
        const start = textContent.indexOf(span.textContent);
        const end = start + span.textContent.length;
        highlights.push({ start, end, text: span.textContent });
    });

    if (files[fileName].annotations[annotationCategory]) {
        files[fileName].annotations[annotationCategory].push(...highlights);
    } else {
        files[fileName].annotations[annotationCategory] = highlights;
    }
    console.log('Saving following files data', files);

    saveHighlightToServer(caseData.pk, JSON.stringify(files));
}

// const addHighlightRemovalListeners = (caseData) => {
//     const highlights = document.querySelectorAll('[data-highlight]');
//     highlights.forEach((highlight) => {
//         highlight.addEventListener("click", (e) => {
//             e.stopPropagation();
//             const highlightedText = highlight.textContent;
//             if (confirm(`Do you want to remove the highlight for "${highlightedText}"?`)) {
//                 highlight.replaceWith(document.createTextNode(highlightedText));
//                 saveUpdatedFile(caseData);
//             }
//         });
//     });
// };

const highlightText = (caseData) => {
    const saveHighlightButton = document.getElementById("save-highlight");
    saveHighlightButton.addEventListener("click", () => {
        const selectedText = window.getSelection().toString();
        if (!selectedText) {
            alert("Please select text to highlight.");
            return;
        }

        const annotationCategory = document.querySelector('input[name="highlight-color"]:checked').value;
        const modalContent = document.getElementById("modal-file-content");

        const innerHTML = modalContent.innerHTML;
        const newHTML = innerHTML.replace(
            selectedText,
            `<span class="highlight-${annotationCategory}" data-highlight>${selectedText}</span>`
        );
        modalContent.innerHTML = newHTML;

        saveUpdatedFile(caseData, annotationCategory);

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
            const files = JSON.parse(caseData.fields.files);
            caseData.fields.files = files;

            console.log('Case Data', caseData);
            populateCaseData(caseData);
            populateCaseFiles(caseData);
            highlightText(caseData);
        })
        .catch((error) => {
            console.error("Error fetching case data:", error);
        });
});