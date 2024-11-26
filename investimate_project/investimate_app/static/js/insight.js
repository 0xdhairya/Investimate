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
        const filteredFiles = Object.keys(files).filter((file) => files[file].content.includes(searchKeyword));
        populateCaseFiles(filteredFiles)
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
            console.log('CASE files', files);
            populateCaseFiles(files);
            searchKeyword(files);
        })
        .catch((error) => {
            console.error("Error fetching case data:", error);
        });
});