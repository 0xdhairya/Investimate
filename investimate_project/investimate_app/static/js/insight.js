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

const populateInsight = (insight) => {
    document.getElementById('predictionTitle').innerText = insight.category + ': ' + insight.input.text;
    document.getElementById('predictionValue').innerText = insight.output.text;
    const insightsFiles = document.getElementById('insightFiles');
    console.log('files', insight.output);

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
            populateInsight(data.insight);
        })
        .catch((error) => {
            console.error("Error fetching case data:", error);
        });
});