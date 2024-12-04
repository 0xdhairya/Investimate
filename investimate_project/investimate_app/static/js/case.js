import { setAiAction, fillEntityList, fillPredictionFiles, aiActionsApis } from './ai-box.js'

let annotations = {
    'date': [],
    'name': [],
    'location': [],
    'contact-number': [],
    'miscellaneous': [],
};
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
    fillEntityList(annotations, totalEntities);
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

const highlightAnnotation = (category, text) => {
    const modalContent = document.getElementById("file-content");
    const innerHTML = modalContent.innerHTML;
    const highlightHTML = `<span class="highlight-${category}" data-highlight>
                    ${text}
                    <span class="p-0 remove-highlight-btn" data-category="${category}" data-text="${text}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                        </svg>
                    </span>
                </span>`;
    const newHTML = innerHTML.replace(text, highlightHTML);
    modalContent.innerHTML = newHTML;
}
const applyHighlights = (annotations) => {
    Object.keys(annotations).forEach((category) => {
        annotations[category].forEach((text) => {
            highlightAnnotation(category, text);
        })
    })
};

const addHighlightRemovalListeners = (caseData) => {
    const removeButtons = document.querySelectorAll(".remove-highlight-btn");
    removeButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent triggering other click events

            const highlightedText = button.dataset.text;
            const category = button.dataset.category;
            const file = document.getElementById("file-name").textContent;

            if (confirm(`Do you want to remove the highlight for "${highlightedText}"?`)) {
                const highlightSpan = button.parentNode;
                highlightSpan.replaceWith(document.createTextNode(highlightedText));
                caseData.fields.files[file].annotations[category] = caseData.fields.files[file].annotations[category].filter(
                    (e) => e !== highlightedText
                );
                saveHighlightToServer(caseData.pk, caseData.fields.files);
            }
        });
    });
};

const populateCaseFiles = (caseData) => {
    const fileList = document.getElementById("file-list");
    const files = caseData.fields.files;
    const fileName = document.getElementById("file-name");
    const fileContent = document.getElementById("file-content");
    const fillInCase = (file) => {
        const annotations = files[file].annotations || [];
        fileName.textContent = file;
        fileContent.textContent = files[file].content;
        applyHighlights(annotations);
        addHighlightRemovalListeners(caseData);
    }
    Object.keys(files).forEach((file, i) => {
        const li = document.createElement("li");
        li.innerHTML = `<button type="button" class="btn btn-sm btn-outline-primary">${file}</button>`;
        fileList.appendChild(li);
        if (i == 0) {
            fillInCase(file)
        }
        li.addEventListener("click", () => fillInCase(file));
    });
    fillPredictionFiles(Object.keys(files));
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
    const fileName = document.getElementById("file-name").textContent;
    const files = caseData.fields.files;
    if (files[fileName].annotations[annotationCategory]) {
        files[fileName].annotations[annotationCategory].push(text);
    } else {
        files[fileName].annotations[annotationCategory] = [text];
    }
    saveHighlightToServer(caseData.pk, files);
}

const highlightText = (caseData) => {
    const fileContent = document.getElementById('file-content');
    fileContent.addEventListener("mouseup", () => {
        const selectedText = window.getSelection().toString();
        if (!selectedText) {
            return;
        }
        const annotationCategory = document.querySelector('input[name="highlight-color"]:checked').value;
        highlightAnnotation(annotationCategory, selectedText);
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