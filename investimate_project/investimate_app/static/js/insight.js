const fillPredictionFiles = (files) => {
    const list = document.getElementById('prediction-file-list');
    files.forEach((file) => {
        const child = document.createElement('li');
        child.innerHTML = `<div class="border border-primary p-1 rounded text-primary" >${file}</div>`;
        list.appendChild(child);
    })
}

const populateCaseFiles = (files) => {
    const fileList = document.getElementById("file-list");
    const list = document.getElementById('prediction-file-list');
    fileList.innerHTML = '';
    list.innerHTML = '';
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
            fillPredictionFiles(data.insight.input.files);
            populateInsight(data.insight);
        })
        .catch((error) => {
            console.error("Error fetching case data:", error);
        });
});