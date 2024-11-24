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

const aiMakeConnection = (case_id) => {
    console.log('Sending connection');

    const entityListElement = document.getElementById("entity-list");
    console.log('Child', entityListElement.children)
    entityListElement.children.forEach((c) => console.log('Child', c))

    fetch(`/api/cases/${case_id}/ai/connection`, {
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

const aiMakePrediction = (case_id) => {
    const predictionTest = document.getElementById('aiPredictionText')?.value;
    const errorMessageElement = document.getElementById('aiPredictionTextError');
    if (predictionTest && predictionTest != '') {
        errorMessageElement.innerText = '';
        const body = {
            data: predictionTest,
        };
        fetch(`/api/cases/${case_id}/ai/prediction`, {
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
        }).catch((error) => {
            console.error("Error sending data:", error);
        });
        return;
    }
    if (predictionTest == '') errorMessageElement.innerText = 'Please enter some event to predict';
}

export const aiActionsApis = (case_id) => {
    document.getElementById("aiMakeConnection").addEventListener("click", () => aiMakeConnection(case_id));
    document.getElementById("aiMakePrediction").addEventListener("click", () => aiMakePrediction(case_id));
}