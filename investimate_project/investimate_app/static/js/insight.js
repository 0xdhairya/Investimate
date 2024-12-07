function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

const fillPredictionFiles = (caseId, insightId, allFiles, predictionFiles) => {
    const predictionFilesEle = document.getElementById('prediction-file-list');
    const newInputFilesEle = document.getElementById('all-file-checkbox');
    const editButton = document.getElementById('edit-prediction-files');
    const cancelButton = document.getElementById('cancel-prediction-files');
    const saveButton = document.getElementById('save-prediction-files');

    editButton.addEventListener('click', () => {
        cancelButton.hidden = false;
        saveButton.hidden = false;
        editButton.hidden = true;
        predictionFilesEle.hidden = true;
        newInputFilesEle.hidden = false;
    });

    cancelButton.addEventListener('click', () => {
        cancelButton.hidden = true;
        saveButton.hidden = true;
        editButton.hidden = false;
        predictionFilesEle.hidden = false;
        newInputFilesEle.hidden = true;
    });

    saveButton.addEventListener('click', () => {
        const newPredictionFiles = [];
        const checkboxes = document.querySelectorAll('#all-file-checkbox .form-check-input:checked');
        checkboxes.forEach((checkbox) => {
            newPredictionFiles.push(checkbox.value);
        });
        console.log('New Files', newPredictionFiles);

        let equal = false;
        predictionFiles.sort();
        newPredictionFiles.sort();
        equal = predictionFiles.join() == newPredictionFiles.join()
        if (equal) {
            alert('No changes in files detected!');
            return;
        }

        cancelButton.disabled = true;
        saveButton.disabled = true;
        saveButton.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Regenerating...`;

        fetch(`/api/case/${caseId}/ai/regenerate-prediction/${insightId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken(),
            },
            body: JSON.stringify({ predictionFiles: newPredictionFiles }),
        }).then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        }).then((data) => {
            console.log("Response from server:", data);
            location.reload();
        }).catch((error) => {
            console.error("Error sending data:", error);
        }).finally(() => {
        });

        // After API call success
        // cancelButton.hidden = true;
        // saveButton.hidden = true;
        // editButton.hidden = false;
        // cancelButton.disabled = false;
        // saveButton.disabled = false;
        // predictionFilesEle.hidden = false;
        // newInputFilesEle.hidden = true;
    });

    predictionFiles.forEach((file) => {
        const child = document.createElement('li');
        child.innerHTML = `<div class="border border-primary p-1 rounded text-primary" >${file}</div>`;
        predictionFilesEle.appendChild(child);
    });

    Object.keys(allFiles).forEach((file) => {
        const child = document.createElement('li');
        child.innerHTML = `
        <div class="form-check border border-primary rounded text-primary p-1 align-items-center">
            <input class="form-check-input small" type="checkbox" value="${file}" ${predictionFiles.includes(file) ? 'checked' : ''}>
            <label class="form-check-label small" for="prediction-files">${file}</label>
        </div>`;
        newInputFilesEle.appendChild(child);
    });
}

const populateCaseFiles = (files) => {
    const fileList = document.getElementById("file-list");
    fileList.innerHTML = '';
    Object.keys(files).forEach((file) => {
        const li = document.createElement("li");
        li.innerHTML = `<button type="button" class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#fileModal">${file}</button>`;
        fileList.appendChild(li);
        li.addEventListener("click", () => {
            document.getElementById("modal-file-content").textContent = files[file].content;
            document.getElementById("exampleModalLabel").textContent = file;
        });
    });
}

const searchKeyword = (files) => {
    const searchButton = document.getElementById('fileSearchButton');
    searchButton.addEventListener(('click'), () => {
        const errorText = document.getElementById('fileSearchTextError');
        const searchKeyword = document.getElementById('fileSearchText')?.value;
        errorText.innerText = '';
        console.log('SEARCH', searchKeyword);
        if (!searchKeyword || searchKeyword == '') {
            errorText.innerText = 'Search text cannot be empty';
            return;
        }
        const filteredFiles = {}
        Object.keys(files).forEach((file) => {
            if (files[file].content.includes(searchKeyword)) {
                filteredFiles[file] = files[file]
            }
        });
        populateCaseFiles(filteredFiles)
    })
}

const resetSearch = (files) => {
    const resetButton = document.getElementById('fileSearchResetButton');
    resetButton.addEventListener(('click'), () => {
        const searchText = document.getElementById('fileSearchText');
        searchText.value = '';
        populateCaseFiles(files)
    })
}

const populateInsight = (insight) => {
    document.getElementById('insightTitle').innerText = insight.category + (insight.category == 'Hypothesis' ? ': ' + insight.input.text : ' between:');
    document.getElementById('predictionValue').innerText = insight.output.insight;
    if (insight.category == 'Connection') {
        const list = document.getElementById('connection-items');
        insight.input.entities.forEach((e) => {
            const li = document.createElement('li');
            li.innerText = `${e.text}(${e.file})`;
            list.appendChild(li);
        })
    }
    const insightsFiles = document.getElementById('insightFiles');
    Object.keys(insight.output.files).forEach((file) => {
        const div = document.createElement('div');
        div.innerHTML = `
        <p class="h6">${file}</p>
        <ul></ul>
        `;
        const ul = div.querySelector('ul');
        insight.output.files[file].forEach((line) => {
            const item = document.createElement('li');
            item.innerText = line;
            ul.appendChild(item);
        })
        insightsFiles.appendChild(div);
    })
}

document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;
    const pathSegments = path.split('/');
    const caseId = pathSegments[2];
    const insightId = pathSegments[4];

    fetch(`/api/case/${caseId}/insight/${insightId}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            const files = JSON.parse(data.caseFiles);
            populateCaseFiles(files);
            searchKeyword(files);
            resetSearch(files);
            if (data.insight.category == 'Hypothesis')
                fillPredictionFiles(caseId, insightId, files, data.insight.input.files);
            populateInsight(data.insight);
        })
        .catch((error) => {
            console.error("Error fetching case data:", error);
        });
});