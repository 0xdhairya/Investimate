import { setAiAction, fillEntityList, aiActionsApis } from './ai-box.js'

let annotations = {
    'date': [],
    'name': [],
    'location': [],
    'contact-number': [],
    'miscellaneous': [],
};
let minTwoEntities = false;
let totalEntities = 0;

const notesSection = (caseData) => {
    const caseNotes = document.getElementById('case-notes');
    caseNotes.textContent = caseData.fields.notes;

    let typingTimeout;
    let savedNotes;

    caseNotes.addEventListener('input', () => {
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            const notes = caseNotes.value;
            fetch(`/api/case/${caseData.pk}/update-notes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken(),
                },
                body: JSON.stringify({ updatedContent: notes }),
            }).then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
                .then((data) => {
                    const saved = document.getElementById('notes-saved');
                    saved.hidden = false;
                    clearTimeout(savedNotes);
                    savedNotes = setTimeout(() => {
                        saved.hidden = true;
                    }, 3000);
                })
                .catch((error) => {
                    console.error("Error fetching case data:", error);
                    caseNotes.textContent = caseData.fields.notes;
                });
        }, 8000);
    });
}

export const insightsSection = (case_id, insights) => {
    const insightElement = document.getElementById('insight-list');
    insightElement.innerHTML = ''
    insights.forEach((insight, i) => {
        const insightItem = document.createElement('div');
        insightItem.classList.add('insight-item');
        if (insight.category == 'Hypothesis') {
            insightItem.innerText = `${i + 1}. ${insight.category}: ${insight.input.text}`;
        }
        insightItem.addEventListener("click", () => {
            window.location.href = `/case/${case_id}/insight/${insight.id}`;
        });
        insightElement.appendChild(insightItem);
    })
}

const checkForMinTwoEntities = () => {
    totalEntities = 0;
    Object.keys(annotations).forEach((cat) => {
        totalEntities += annotations[cat].length;
    })
    minTwoEntities = totalEntities > 1 ? true : false;
    fillEntityList(annotations, minTwoEntities, totalEntities);
}

const populateAnnotations = (files) => {
    annotations = {
        'date': [],
        'name': [],
        'location': [],
        'contact-number': [],
        'miscellaneous': [],
    };
    Object.keys(files).forEach((file) => {
        Object.keys(files[file].annotations).forEach((category) => {
            files[file].annotations[category].forEach((ann) => {
                annotations[category].push({ text: ann, file })
            })
        });
    });
    checkForMinTwoEntities();
}

const populateCaseData = (caseData) => {
    document.getElementById('case-name').textContent = caseData.fields.name;
    document.getElementById('case-status').textContent = caseData.fields.status;
    document.getElementById('case-created_at').textContent = new Date(caseData.fields.created_at).toLocaleString();
    document.getElementById('case-description').textContent = caseData.fields.description;
    populateAnnotations(caseData.fields.files);
    aiActionsApis(caseData);
    notesSection(caseData);
    insightsSection(caseData.pk, caseData.fields.insights);
}

const applyHighlights = (annotations) => {
    Object.keys(annotations).forEach((category) => {
        annotations[category].forEach((text) => {
            const modalContent = document.getElementById("modal-file-content");
            const innerHTML = modalContent.innerHTML;
            const newHTML = innerHTML.replace(
                text,
                `<span class="highlight-${category}" data-highlight>${text}</span>`
            );
            modalContent.innerHTML = newHTML;
        })
    })
};

const addHighlightRemovalListeners = (caseData) => {
    const annotations = document.querySelectorAll('[data-highlight]');
    annotations.forEach((annotation) => {
        const category = annotation.getAttribute('class').split('highlight-')[1];
        const file = document.getElementById("exampleModalLabel").textContent;
        annotation.addEventListener("click", (e) => {
            e.stopPropagation();
            const highlightedText = annotation.textContent;
            if (confirm(`Do you want to remove the annotation for "${highlightedText}"?`)) {
                annotation.replaceWith(document.createTextNode(highlightedText));
                caseData.fields.files[file].annotations[category] = caseData.fields.files[file].annotations[category].filter((e) => e != highlightedText)
                saveHighlightToServer(caseData.pk, caseData.fields.files);
            }
        });
    });
};

const populateCaseFiles = (caseData) => {
    const fileList = document.getElementById("file-list");
    const files = caseData.fields.files;
    Object.keys(files).forEach((file) => {
        const li = document.createElement("li");
        li.innerHTML = `<button type="button" class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#fileModal">${file}</button>`;
        fileList.appendChild(li);
        li.addEventListener("click", () => {
            const annotations = files[file].annotations || [];
            document.getElementById("modal-file-content").textContent = files[file].content;
            document.getElementById("exampleModalLabel").textContent = file;
            applyHighlights(annotations);
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
        body: JSON.stringify({ updatedContent: JSON.stringify(updatedContent) }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(() => {
            populateAnnotations(updatedContent);
        })
        .catch((error) => {
            console.error("Error saving changes:", error);
            alert("Failed to save the changes. Please try again.");
        });
}

function saveUpdatedFile(caseData, annotationCategory, text) {
    const fileName = document.getElementById("exampleModalLabel").textContent;
    const files = caseData.fields.files;
    if (files[fileName].annotations[annotationCategory]) {
        files[fileName].annotations[annotationCategory].push(text);
    } else {
        files[fileName].annotations[annotationCategory] = [text];
    }
    saveHighlightToServer(caseData.pk, files);
}

const highlightText = (caseData) => {
    const saveHighlightButton = document.getElementById("save-highlight");
    saveHighlightButton.addEventListener("click", () => {
        const selectedText = window.getSelection().toString();
        if (!selectedText) {
            alert("Please select text to annotate.");
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
        saveUpdatedFile(caseData, annotationCategory, selectedText);
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
            console.log('CASE', caseData);

            const files = JSON.parse(caseData.fields.files);
            caseData.fields.files = files;
            populateCaseData(caseData);
            populateCaseFiles(caseData);
            highlightText(caseData);
            setAiAction();
        })
        .catch((error) => {
            console.error("Error fetching case data:", error);
        });
});