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