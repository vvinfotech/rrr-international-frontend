// ========================================
// RRR INTERNATIONAL - ADMIN DASHBOARD
// ========================================


const API_URL = "http://localhost:8082/api/machinery";
const ADMIN_VERIFY_URL = "http://localhost:8082/api/admin/verify";

let selectedImageFile = null;

function getAdminAuth() {
    const auth = sessionStorage.getItem("rrrAdminAuth");

    if (!auth) {
        window.location.href = "login.html";
        return null;
    }

    return auth;
}

// ========================================
// INITIALIZE DASHBOARD
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    const addButton = document.getElementById("addMachineryBtn");
    const formContainer = document.getElementById("addMachineryForm");
    const cancelButton = document.getElementById("cancelMachineryBtn");
    const machineryForm = document.getElementById("machineryForm");
    const formMessage = document.getElementById("machineryFormMessage");

    setupImagePreview();
    loadMachinery();

    // Open Add Machinery form
    if (addButton && formContainer) {
        addButton.addEventListener("click", () => {
            machineryForm.reset();
            delete machineryForm.dataset.editId;

            formContainer.style.display = "block";

            const heading = formContainer.querySelector("h2");
            if (heading) {
                heading.textContent = "Add New Machinery";
            }

            const submitButton = machineryForm.querySelector(
                'button[type="submit"]'
            );

            if (submitButton) {
                submitButton.textContent = "Save Machinery";
            }

            if (formMessage) {
                formMessage.textContent = "";
            }

            clearImagePreview();

            formContainer.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    }

    // Close Add Machinery form
    if (cancelButton && formContainer && machineryForm) {
        cancelButton.addEventListener("click", () => {
            machineryForm.reset();
            delete machineryForm.dataset.editId;

            formContainer.style.display = "none";

            if (formMessage) {
                formMessage.textContent = "";
            }

            clearImagePreview();
        });
    }

    // Save machinery
    if (machineryForm) {
        machineryForm.addEventListener("submit", saveMachinery);
    }
});

// ========================================
// LOAD MACHINERY
// ========================================

async function loadMachinery() {
    const tableBody = document.getElementById("machineryTableBody");

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to fetch machinery records.");
        }

        const machineryList = await response.json();

        updateStatistics(machineryList);
        displayMachinery(machineryList, tableBody);

    } catch (error) {
        console.error("Load machinery error:", error);

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        Unable to load machinery.
                        Please check whether the backend is running
                        on port 8082.
                    </td>
                </tr>
            `;
        }
    }
}

// ========================================
// UPDATE STATISTICS
// ========================================

function updateStatistics(machineryList) {
    const totalElement = document.getElementById("totalMachinery");
    const availableElement = document.getElementById("availableMachinery");
    const soldElement = document.getElementById("soldMachinery");

    const total = machineryList.length;

    const available = machineryList.filter(
        machine =>
            (machine.status || "").toUpperCase() === "AVAILABLE"
    ).length;

    const sold = machineryList.filter(
        machine =>
            (machine.status || "").toUpperCase() === "SOLD"
    ).length;

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (availableElement) {
        availableElement.textContent = available;
    }

    if (soldElement) {
        soldElement.textContent = sold;
    }
}

// ========================================
// DISPLAY MACHINERY TABLE
// ========================================

function displayMachinery(machineryList, tableBody) {
    if (!tableBody) {
        return;
    }

    if (machineryList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    No machinery found. Add your first machinery.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = machineryList.map(machine => {
        const name = escapeHTML(machine.name || "Unnamed Machinery");
        const category = escapeHTML(machine.category || "N/A");
        const model = escapeHTML(machine.model || "N/A");
        const status = (machine.status || "AVAILABLE").toUpperCase();

        const statusClass =
            status === "AVAILABLE"
                ? "status-available"
                : status === "SOLD"
                    ? "status-sold"
                    : "status-pending";

        return `
            <tr>
                <td><strong>${name}</strong></td>

                <td>
                    <span class="machine-category">
                        ${category}
                    </span>
                </td>

                <td>${model}</td>

                <td>
                    <span class="${statusClass}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>
                    <button
                        type="button"
                        class="btn-edit"
                        onclick="editMachinery(${Number(machine.id)})">
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn-delete"
                        onclick="deleteMachinery(${Number(machine.id)})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

// ========================================
// PHOTO SELECTION AND PREVIEW
// ========================================

function setupImagePreview() {
    const imageInput = document.getElementById("machineImageFile");
    const previewContainer = document.getElementById(
        "machineImagePreviewContainer"
    );
    const previewImage = document.getElementById("machineImagePreview");
    const imageMessage = document.getElementById("machineImageMessage");

    if (!imageInput || !previewContainer || !previewImage) {
        console.warn("Image preview elements were not found.");
        return;
    }

    imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];

        selectedImageFile = null;

        if (!file) {
            clearImagePreview();
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            imageInput.value = "";

            clearImagePreview();

            if (imageMessage) {
                imageMessage.textContent =
                    "Please select a JPG, PNG or WebP image.";
            }

            return;
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            imageInput.value = "";

            clearImagePreview();

            if (imageMessage) {
                imageMessage.textContent =
                    "Image size must be 5 MB or less.";
            }

            return;
        }

        selectedImageFile = file;

        previewImage.src = URL.createObjectURL(file);
        previewContainer.hidden = false;

        if (imageMessage) {
            imageMessage.textContent =
                "Photo selected: " + file.name +
". Image will upload when you save the machinery.";
        }
    });
}

function clearImagePreview() {
    const imageInput = document.getElementById("machineImageFile");
    const previewContainer = document.getElementById(
        "machineImagePreviewContainer"
    );
    const previewImage = document.getElementById("machineImagePreview");
    const imageMessage = document.getElementById("machineImageMessage");

    selectedImageFile = null;

    if (imageInput) {
        imageInput.value = "";
    }

    if (previewImage) {
        if (previewImage.src.startsWith("blob:")) {
            URL.revokeObjectURL(previewImage.src);
        }

        previewImage.removeAttribute("src");
    }

    if (previewContainer) {
        previewContainer.hidden = true;
    }

    if (imageMessage) {
        imageMessage.textContent = "";
    }
}

// ========================================
// SAVE OR UPDATE MACHINERY
// ========================================


async function saveMachinery(event) {
    event.preventDefault();

    const machineryForm = event.currentTarget;
    const formContainer = document.getElementById("addMachineryForm");
    const formMessage = document.getElementById("machineryFormMessage");

    const auth = getAdminAuth();

    if (!auth) {
        return;
    }

    const formData = new FormData(machineryForm);

    const editId = machineryForm.dataset.editId;
    const isEditing = Boolean(editId);

    const machineryData = {
        name: (formData.get("name") || "").trim(),
        category: formData.get("category") || "",
        brand: (formData.get("brand") || "").trim(),
        model: (formData.get("model") || "").trim(),
        description: (formData.get("description") || "").trim(),
        imageUrl: (formData.get("imageUrl") || "").trim(),
        status: formData.get("status") || "AVAILABLE"
    };

    try {
        // STEP 1: Upload selected image to Cloudinary
        if (selectedImageFile) {
            formMessage.textContent = "Uploading image to Cloudinary...";

            const uploadData = new FormData();
            uploadData.append("image", selectedImageFile);

            const uploadResponse = await fetch(
                `${API_URL}/upload-image`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": auth
                    },
                    body: uploadData
                }
            );

            if (!uploadResponse.ok) {
                throw new Error(
                    uploadResponse.status === 401
                        ? "Session expired or login is invalid. Please log in again."
                        : "Image upload failed. Status: " +
                          uploadResponse.status
                );
            }

            const uploadResult = await uploadResponse.json();

            if (!uploadResult.imageUrl) {
                throw new Error(
                    "Cloudinary did not return an image URL."
                );
            }

            machineryData.imageUrl = uploadResult.imageUrl;
        }

        // STEP 2: Save machinery details in MySQL
        const requestURL = isEditing
            ? `${API_URL}/${editId}`
            : API_URL;

        const requestMethod = isEditing ? "PUT" : "POST";

        formMessage.textContent = isEditing
            ? "Updating machinery details..."
            : "Saving machinery details...";

        const response = await fetch(requestURL, {
            method: requestMethod,
            headers: {
                "Authorization": auth,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(machineryData)
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    "Authentication failed. Please log in again."
                );
            }

            throw new Error(
                "Unable to save machinery. Status: " +
                response.status
            );
        }

        formMessage.textContent = isEditing
            ? "Machinery updated successfully!"
            : "Machinery saved successfully!";

        machineryForm.reset();
        delete machineryForm.dataset.editId;
        clearImagePreview();

        const heading = formContainer.querySelector("h2");

        if (heading) {
            heading.textContent = "Add New Machinery";
        }

        const submitButton = machineryForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.textContent = "Save Machinery";
        }

        await loadMachinery();

    } catch (error) {
        console.error("Save machinery error:", error);

        formMessage.textContent =
            error.message || "Unable to save machinery.";
    }
}

// ========================================
// EDIT MACHINERY
// ========================================

async function editMachinery(id) {
    const formContainer = document.getElementById("addMachineryForm");
    const machineryForm = document.getElementById("machineryForm");
    const formMessage = document.getElementById("machineryFormMessage");

    try {
        const response = await fetch(`${API_URL}/${id}`, {
    headers: {
        "Authorization": getAdminAuth()
    }
});

        const machine = await response.json();

        machineryForm.reset();
        clearImagePreview();

        document.getElementById("machineName").value =
            machine.name || "";

        document.getElementById("machineCategory").value =
            machine.category || "";

        document.getElementById("machineBrand").value =
            machine.brand || "";

        document.getElementById("machineModel").value =
            machine.model || "";

        document.getElementById("machineDescription").value =
            machine.description || "";

        document.getElementById("machineImageUrl").value =
            machine.imageUrl || "";

        document.getElementById("machineStatus").value =
            (machine.status || "AVAILABLE").toUpperCase();

        machineryForm.dataset.editId = id;

        formContainer.style.display = "block";

        const heading = formContainer.querySelector("h2");

        if (heading) {
            heading.textContent = "Edit Machinery";
        }

        const submitButton = machineryForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.textContent = "Update Machinery";
        }

        formMessage.textContent = "";

        formContainer.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        console.error("Edit machinery error:", error);

        alert("Unable to load machinery details. Please try again.");
    }
}

// ========================================
// DELETE MACHINERY
// ========================================

async function deleteMachinery(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this machinery?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const auth = getAdminAuth();

if (!auth) {
    return;
}

const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
        "Authorization": auth
    }
});

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    "Access denied. Backend authentication is required."
                );
            }

            throw new Error(
                "Server returned status " + response.status
            );
        }

        alert("Machinery deleted successfully!");

        await loadMachinery();

    } catch (error) {
        console.error("Delete machinery error:", error);

        alert(
            error.message || "Unable to delete machinery."
        );
    }
}