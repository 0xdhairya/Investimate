import { insightsSection } from './case.js';

const entities = {};
let entitiesCount = 0;

export const setAiAction = () => {
    const dropdownItems = document.querySelectorAll('.ai-action-dropdown-items');
    const dropdownToggle = document.getElementById('aiActionDropdownMenu');
    dropdownItems.forEach(item => {
        item.addEventListener('click', (event) => {
            const aiAction = event.target.textContent;
            dropdownToggle.textContent = aiAction;
            if (aiAction.toLowerCase() == 'prediction') {
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

const removeEntity = (annotations, removedEntityNumber) => {
    const entityListElement = document.getElementById("entity-list");
    const removedDiv = document.getElementById(`entity-${removedEntityNumber}`);
    const category = removedDiv.querySelector(`#entity-${removedEntityNumber}-category`).value;
    const valueSelect = removedDiv.querySelector(`#entity-${removedEntityNumber}-value`);
    const selectedOption = valueSelect.options[valueSelect.selectedIndex];
    const text = selectedOption.value;
    const file = selectedOption.dataset.file;
    entityListElement.removeChild(removedDiv);
    entitiesCount--;

    if (file) {
        annotations[category].push({ file, text });
    }

    Object.keys(entities).forEach((e) => {
        if (entities[`entity-${removedEntityNumber + 1}`]) {
            entities[`entity-${removedEntityNumber}`] = entities[`entity-${removedEntityNumber + 1}`]
            delete entities[`entity-${removedEntityNumber + 1}`];
        } else {
            delete entities[`entity-${removedEntityNumber}`];
        }
    });

    const remainingEntities = Array.from(entityListElement.children);
    remainingEntities.forEach((child, index) => {
        const newIndex = index + 1;
        child.id = `entity-${newIndex}`;

        const title = child.querySelector(`[id^="entity-title-"]`);
        if (title) title.id = `entity-title-${newIndex}`;
        if (title) title.textContent = `Entity ${newIndex}`;

        const categorySelect = child.querySelector(`[id^="entity-"][id$="-category"]`);
        if (categorySelect) {
            categorySelect.id = `entity-${newIndex}-category`;
            categorySelect.setAttribute("aria-label", `entity-${newIndex}-category`);
        }

        const valueSelect = child.querySelector(`[id^="entity-"][id$="-value"]`);
        if (valueSelect) {
            valueSelect.id = `entity-${newIndex}-value`;
            valueSelect.setAttribute("aria-label", `entity-${newIndex}-value`);
        }

        const removeButton = child.querySelector(`[id^="remove-entity-"]`);
        if (removeButton) {
            removeButton.id = `remove-entity-${newIndex}`;
            const newRemoveButton = removeButton.cloneNode(true);
            newRemoveButton.addEventListener("click", () => removeEntity(annotations, newIndex)); // Add new listener
            removeButton.parentNode.replaceChild(newRemoveButton, removeButton);
        }
    });

};

const entityItem = (annotations, i, hidden = false) => {
    const div = document.createElement("div");
    div.classList.add("p-1");
    div.classList.add("m-1");
    div.id = `entity-${i}`;
    div.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
        <p id="entity-title-${i}" class="fs-6 m-0">Entity ${i}</p>
        <button id="remove-entity-${i}" class="btn btn-outline-danger btn-sm" ${hidden ? "hidden" : ""}>X</button>
    </div>
    <div>
        <select id="entity-${i}-category" class="form-select fs-6" aria-label="entity-${i}-category">
        <option selected disabled>Select Category</option>'
            ${annotations['name'].length ? '<option value="name">Name</option>' : ''}
            ${annotations['location'].length ? '<option value="location">Location</option>' : ''}
            ${annotations['date'].length ? '<option value="date">Date</option>' : ''}
            ${annotations['contact-number'].length ? '<option value="contact-number">Contact Number</option>' : ''}
            ${annotations['miscellaneous'].length ? '<option value="miscellaneous">Miscellaneous</option>' : ''}
        </select>
        <select id="entity-${i}-value" class="form-select fs-6" aria-label="entity-${i}-value">
            <option selected disabled>Select Category First</option>
        </select>
    </div>
    `;

    const updateCategorySelectors = (i) => {
        const catSel = document.querySelector(`#entity-${i}-category`);
        catSel.innerHTML = '<option selected disabled>Select Category</option>';
        if (annotations['name'].length) {
            const opt = document.createElement("option");
            opt.value = 'name';
            opt.textContent = 'Name';
            catSel.appendChild(opt);
        }
        if (annotations['location'].length) {
            const opt = document.createElement("option");
            opt.value = 'location';
            opt.textContent = 'Location';
            catSel.appendChild(opt);
        }
        if (annotations['date'].length) {
            const opt = document.createElement("option");
            opt.value = 'date';
            opt.textContent = 'Date';
            catSel.appendChild(opt);
        }
        if (annotations['contact-number'].length) {
            const opt = document.createElement("option");
            opt.value = 'contact-number';
            opt.textContent = 'Contact Number';
            catSel.appendChild(opt);
        }
        if (annotations['miscellaneous'].length) {
            const opt = document.createElement("option");
            opt.value = 'miscellaneous';
            opt.textContent = 'Miscellaneous';
            catSel.appendChild(opt);
        }
    }

    const categorySelect = div.querySelector(`#entity-${i}-category`);
    const valueSelect = div.querySelector(`#entity-${i}-value`);
    categorySelect.addEventListener("change", () => {
        const selectedCategory = categorySelect.value;
        valueSelect.innerHTML = '<option selected disabled>Select Entity</option>';
        if (selectedCategory in annotations) {
            annotations[selectedCategory].forEach((option) => {
                const opt = document.createElement("option");
                opt.value = option.text;
                opt.textContent = `${option.text} (${option.file})`;
                opt.setAttribute("data-file", option.file);
                valueSelect.appendChild(opt);
            });
        }
    });

    valueSelect.addEventListener("change", () => {
        const selectedOption = valueSelect.options[valueSelect.selectedIndex];
        const category = div.querySelector(`#entity-${i}-category`)?.value;
        const text = selectedOption.value;
        const file = selectedOption.dataset.file;
        const oldEntityValues = entities[`entity-${i}`];

        if (file && category) {

            entities[`entity-${i}`] = { file, text, category };

            annotations[category] = annotations[category].filter((e) => {
                return !(e.text == text && e.file == file);
            });
            if (oldEntityValues) {
                annotations[oldEntityValues.category].push({ text: oldEntityValues.text, file: oldEntityValues.file });
            }
            for (let j = i + 1; j <= entitiesCount; j++) {
                updateCategorySelectors(j);
            }
        }
    });

    div.querySelector(`#remove-entity-${i}`).addEventListener("click", () => {
        removeEntity(annotations, i);
    });

    return div;
};

const addEntityItem = (annotations, totalEntities) => {
    document.getElementById('addEntityButton').addEventListener('click', () => {
        if (totalEntities <= entitiesCount) {
            alert('No more entities available to add');
            return;
        }
        const entityListElement = document.getElementById('entity-list');
        entitiesCount += 1;
        entityListElement.appendChild(entityItem(annotations, entitiesCount));
    });
}

export const fillEntityList = (annotations, minTwoEntities, totalEntities) => {
    console.log('Here', minTwoEntities, totalEntities);
    if (!minTwoEntities) {
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
    entitiesCount = 0;
    entitiesCount += 1;
    entityListElement.appendChild(entityItem(ann, 1, true));
    entitiesCount += 1;
    entityListElement.appendChild(entityItem(ann, 2, true));
    addEntityItem(ann, totalEntities);
}

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

const aiMakeConnection = (caseData) => {
    const entityList = document.getElementById("entity-list");
    const entitiesElement = Array.from(entityList.children);
    let errors = 0;

    entitiesElement.forEach((entity, i) => {
        const categoryDropdown = entity.querySelector(`#entity-${i + 1}-category`);
        const valueDropdown = entity.querySelector(`#entity-${i + 1}-value`);

        if (!categoryDropdown || categoryDropdown.value == 'Select Category' || !valueDropdown || valueDropdown.value == 'Select Category First' || valueDropdown.value == 'Select Entity') {
            entity.classList.add('red-border');
            errors += 1;
        } else {
            entity.classList.remove('red-border');
        }
    })

    if (errors != 0) return;

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
            // Handle the response from Django
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

    // Validate Prediction Text
    if (!predictionText || predictionText === '') {
        errorMessageElement.innerText = 'Please enter some event to predict';
        isValid = false;
    }

    // Validate Dates Based on Selected Radio Button
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
        return; // Stop execution if validations fail
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