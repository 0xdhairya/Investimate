const createCaseTile = (name, date, status, key) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <div class="case-card" id="case-id-${key}" key=${key}>
          <p class="h2">${name}</p>
          <div>
              <span>Status:</span>
              <span><strong>${status}</strong></span>
          </div>
          <div>
              <span>Created On</span>
              <span><strong>${new Date(date).toLocaleString()}</strong></span>
          </div>
      </div>
      `;
    div.addEventListener("click", () => {
        window.location.href = `/case/${key}`;
    });
    return div;
};

const populateAllCases = async () => {
    allCasesElement = document.getElementById("all-cases");
    if (allCases.length === 0) {
        allCasesElement.innerHTML = `
            <div class="container">
                <div class="h-100 text-center align-content-center mb-5">
                    <p class="h3">No Cases Yet...</p>
                    <p class="card-subtitle">Create your first case and get started.</p>
                </div>
            </div>
            `;
    } else {
        console.log('CASES', allCases)
        for (let i = 0; i < allCases.length; i += 1) {
            allCasesElement?.appendChild(
                createCaseTile(
                    allCases[i].fields.name,
                    allCases[i].fields.created_at,
                    allCases[i].fields.status,
                    allCases[i].pk
                )
            );
        }
    }
};

document.addEventListener("DOMContentLoaded", () => populateAllCases());
