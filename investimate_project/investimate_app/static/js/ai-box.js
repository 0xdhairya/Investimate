import { insightsSection } from './case.js';


export const setAiAction = () => {
    const dropdownItems = document.querySelectorAll('.ai-action-dropdown-items');
    const dropdownToggle = document.getElementById('aiActionDropdownMenu');
    dropdownItems.forEach(item => {
        item.addEventListener('click', (event) => {
            const aiAction = event.target.textContent;
            dropdownToggle.textContent = aiAction;
            if (aiAction.toLowerCase() == 'hypothesize') {
                document.getElementById('section-prediction').hidden = false;
                document.getElementById('section-connection').hidden = true;
                setDatePicker();
            } else {
                document.getElementById('section-prediction').hidden = true;
                document.getElementById('section-connection').hidden = false;
            }
        });
    });
}

export const fillEntityList = (annotations, totalEntities) => {
    if (totalEntities < 2) {
        document.getElementById('no-entities').hidden = false;
        document.getElementById('contain-entities').hidden = true;
        return;
    } else {
        document.getElementById('no-entities').hidden = true;
        document.getElementById('contain-entities').hidden = false;
    }
    const ann = { ...annotations };
    const entityListElement = document.getElementById('entity-list');
    entityListElement.innerHTML = '';
    Object.keys(ann).forEach((cat) => {
        if (ann[cat].length > 0) {
            const parent = document.createElement('div');
            parent.className = "my-2"
            parent.innerHTML = `<p class="m-0 text-center text-capitalize">${cat}</p>`;
            const catEntityList = document.createElement('ul');
            catEntityList.className = "m-0 cat-entity-list"
            ann[cat].forEach((e) => {
                const child = document.createElement('li');
                child.className = "entity-list-item form-check align-items-center p-0 m-0"
                child.innerHTML = `
                    <input class="form-check-input small" type="checkbox" value="${e.text}" data-file=${e.file} data-category=${cat}>
                    <label class="form-check-label small" for="${cat}">
                        ${e.text} (${e.file})
                    </label>`;
                catEntityList.appendChild(child);
            })
            parent.appendChild(catEntityList);
            entityListElement.appendChild(parent);
        }
    });
}

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

const aiMakeConnection = (caseData) => {
    const entities = [];
    const errorBox = document.getElementById('aiConnectionTextError');
    errorBox.innerText = '';
    const checkboxes = document.querySelectorAll('#entity-list .form-check-input:checked');

    checkboxes.forEach((checkbox, i) => {
        entities.push({
            category: checkbox.dataset.category,
            file: checkbox.dataset.file,
            text: checkbox.value,
        });
    });

    if (entities.length < 2) {
        errorBox.innerText = 'Please select atleast two entities to make a connection between them.';
        return;
    }
    fetch(`/api/case/${caseData.pk}/ai/connection`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify(entities),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            checkboxes.forEach((checkbox) => {
                checkbox.checked = false;
            });
            console.log("Response from server:", data);
        })
        .catch((error) => {
            console.error("Error sending data:", error);
        });
}

const setDatePicker = () => {
    const updateDatePicker = () => {
        const selectedValue = document.querySelector('input[name="predictionDate"]:checked').value;
        predictionDatePicker.innerHTML = "";
        if (selectedValue === "Date") {
            const input = document.createElement("input");
            input.type = "date";
            input.className = "form-control";
            input.id = "specificDatePicker";
            predictionDatePicker.appendChild(input);
        } else if (selectedValue === "Date Range") {
            const startLabel = document.createElement("label");
            startLabel.textContent = "Start Date";
            startLabel.className = "small";

            const startDate = document.createElement("input");
            startDate.type = "date";
            startDate.className = "form-control";
            startDate.id = "startDatePicker";

            const endLabel = document.createElement("label");
            endLabel.textContent = "End Date";
            endLabel.className = "small";

            const endDate = document.createElement("input");
            endDate.type = "date";
            endDate.className = "form-control";
            endDate.id = "endDatePicker";

            predictionDatePicker.appendChild(startLabel);
            predictionDatePicker.appendChild(startDate);
            predictionDatePicker.appendChild(endLabel);
            predictionDatePicker.appendChild(endDate);
        }
    }

    const radioButtons = document.getElementsByName("predictionDate");
    radioButtons.forEach((radio) => {
        radio.addEventListener("change", () => {
            updateDatePicker();
            const datePickerErrorElement = document.getElementById('aiDatePickerError');
            datePickerErrorElement.innerText = ''
        });
    });
};

const aiMakePrediction = (caseData) => {
    const predictionText = document.getElementById('aiPredictionText')?.value;
    const errorMessageElement = document.getElementById('aiPredictionTextError');

    const selectedDateType = document.querySelector('input[name="predictionDate"]:checked')?.value;
    const datePickerErrorElement = document.getElementById('aiDatePickerError');
    let isValid = true;

    errorMessageElement.innerText = '';
    datePickerErrorElement.innerText = '';

    if (!predictionText || predictionText === '') {
        errorMessageElement.innerText = 'Please enter some event to predict';
        isValid = false;
    }

    if (selectedDateType === 'Date') {
        const specificDate = document.getElementById('specificDatePicker')?.value;
        if (!specificDate || specificDate === '') {
            datePickerErrorElement.innerText = 'Please select a specific date.';
            isValid = false;
        }
    } else if (selectedDateType === 'Date Range') {
        const startDate = document.getElementById('startDatePicker')?.value;
        const endDate = document.getElementById('endDatePicker')?.value;
        const err = [];

        if (!startDate || startDate === '') {
            err.push('start');
            isValid = false;
        }
        if (!endDate || endDate === '') {
            err.push('end');
            isValid = false;
        }

        if (err.length) {
            datePickerErrorElement.innerText = `Please enter ${err.join(' and ')} date.`;
        } else if (new Date(startDate) > new Date(endDate)) {
            datePickerErrorElement.innerText = 'Start date cannot be after end date.';
            isValid = false;
        }
    }

    if (!isValid) {
        return;
    }

    const body = {
        predictionText,
    };
    if (selectedDateType === 'Date') {
        body.date = document.getElementById('specificDatePicker').value;
    } else if (selectedDateType === 'Date Range') {
        body.startDate = document.getElementById('startDatePicker').value;
        body.endDate = document.getElementById('endDatePicker').value;
    }

    fetch(`/api/case/${caseData.pk}/ai/prediction`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify(body),
    }).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then((data) => {
        console.log("Response from server:", data);
        insightsSection(caseData.pk, data.insights);
    }).catch((error) => {
        console.error("Error sending data:", error);
    });
}

export const aiActionsApis = (caseData) => {
    document.getElementById("aiMakeConnection").addEventListener("click", () => aiMakeConnection(caseData));
    document.getElementById("aiMakePrediction").addEventListener("click", () => aiMakePrediction(caseData));
}