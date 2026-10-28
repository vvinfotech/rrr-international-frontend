
"use strict";

/* ==========================================
   RRR INTERNATIONAL - ADMIN DASHBOARD
   Backend: Spring Boot
   API: http://localhost:8082
========================================== */

const API_URL = "https://rrr-international-backend.onrender.com/api/admin/verify";

const authCredentials = sessionStorage.getItem("rrrAdminAuth");

let machineryList = [];
let currentImageUrl = "";
let previewObjectUrl = null;
let messageTimer = null;

/* ==========================================
   DOM HELPERS
========================================== */

function getElement(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
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

function showMessage(text, type = "info") {
    const messageBox = getElement("appMessage");

    if (!messageBox) return;

    messageBox.textContent = text;
    messageBox.className = "app-message " + type;

    clearTimeout(messageTimer);

    messageTimer = setTimeout(function () {
        messageBox.className = "app-message";
        messageBox.textContent = "";
    }, 5000);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* ==========================================
   AUTHENTICATION
========================================== */

async function verifyAdmin() {
    if (!authCredentials) {
        window.location.replace("login.html");
        return false;
    }

    try {
        const response = await fetch(API_BASE_URL + "/api/admin/verify", {
            method: "GET",
            headers: {
                "Authorization": "Basic " + authCredentials,
                "Accept": "application/json"
            }
        });

        if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem("rrrAdminAuth");
            window.location.replace("login.html");
            return false;
        }

        if (!response.ok) {
            showMessage(
                "Unable to verify admin access. Please try again.",
                "error"
            );
            return false;
        }

        return true;

    } catch (error) {
        showMessage(
            "Cannot connect to the backend. Check whether Spring Boot is running on port 8082.",
            "error"
        );

        return false;
    }
}

function logout() {
    sessionStorage.removeItem("rrrAdminAuth");
    window.location.replace("login.html");
}

/* ==========================================
   API REQUEST HELPER
========================================== */

async function apiRequest(endpoint, options = {}) {
    const headers = new Headers(options.headers || {});

    headers.set("Authorization", "Basic " + authCredentials);
    headers.set("Accept", "application/json");

    const requestOptions = {
        ...options,
        headers: headers
    };

    const response = await fetch(API_BASE_URL + endpoint, requestOptions);

    if (response.status === 401 || response.status === 403) {
        sessionStorage.removeItem("rrrAdminAuth");
        window.location.replace("login.html");
        throw new Error("Admin authentication failed. Please log in again.");
    }

    if (!response.ok) {
        let errorMessage = "Request failed (" + response.status + ").";

        try {
            const responseData = await response.json();

            if (responseData.message) {
                errorMessage = responseData.message;
            } else if (responseData.error) {
                errorMessage = responseData.error;
            }
        } catch (error) {
            // Keep the default error message.
        }

        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return response.json();
    }

    return null;
}

/* ==========================================
   LOAD MACHINERY
========================================== */

async function loadMachinery(showError = true) {
    const tableBody = getElement("machineryTableBody");

    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    Loading machinery...
                </td>
            </tr>
        `;
    }

    try {
        const response = await fetch(API_BASE_URL + "/api/machinery", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Could not load machinery records.");
        }

        const data = await response.json();

        machineryList = Array.isArray(data) ? data : [];

        renderStatistics();
        renderMachineryTable();
        renderRecentMachinery();

        return true;

    } catch (error) {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-cell">
                        Unable to load machinery. Check the backend connection.
                    </td>
                </tr>
            `;
        }

        const recentBody = getElement("recentMachineryBody");

        if (recentBody) {
            recentBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-cell">
                        Unable to load machinery.
                    </td>
                </tr>
            `;
        }

        if (showError) {
            showMessage(error.message, "error");
        }

        return false;
    }
}

/* ==========================================
   DASHBOARD STATISTICS
========================================== */

function renderStatistics() {
    const total = machineryList.length;

    const available = machineryList.filter(function (item) {
        return String(item.status || "AVAILABLE").toUpperCase() === "AVAILABLE";
    }).length;

    const sold = machineryList.filter(function (item) {
        return String(item.status || "").toUpperCase() === "SOLD";
    }).length;

    getElement("totalCount").textContent = total;
    getElement("availableCount").textContent = available;
    getElement("soldCount").textContent = sold;
}

/* ==========================================
   STATUS BADGE
========================================== */

function statusBadge(status) {
    const normalizedStatus = String(status || "AVAILABLE").toUpperCase();

    if (normalizedStatus === "AVAILABLE") {
        return '<span class="badge badge-available">Available</span>';
    }

    if (normalizedStatus === "SOLD") {
        return '<span class="badge badge-sold">Sold</span>';
    }

    return `
        <span class="badge badge-other">
            ${escapeHTML(normalizedStatus)}
        </span>
    `;
}

/* ==========================================
   MACHINE IMAGE
========================================== */

function machineImage(imageUrl, machineName) {
    const safeName = escapeHTML(machineName || "Machinery");

    if (imageUrl) {
        return `
            <img
                class="machine-thumb"
                src="${escapeHTML(imageUrl)}"
                alt="${safeName}"
                loading="lazy"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            >
            <div
                class="machine-thumb machine-thumb-placeholder"
                style="display:none;"
            >⚙</div>
        `;
    }

    return `
        <div class="machine-thumb machine-thumb-placeholder">⚙</div>
    `;
}

/* ==========================================
   RENDER RECENT MACHINERY
========================================== */

function renderRecentMachinery() {
    const tbody = getElement("recentMachineryBody");

    if (!tbody) return;

    const recentItems = [...machineryList]
        .sort(function (a, b) {
            return Number(b.id || 0) - Number(a.id || 0);
        })
        .slice(0, 5);

    if (recentItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-cell">
                    No machinery records found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = recentItems.map(function (item) {
        return `
            <tr>
                <td>
                    <div class="machine-cell">
                        ${machineImage(item.imageUrl, item.name)}
                        <div>
                            <div class="machine-name">
                                ${escapeHTML(item.name)}
                            </div>
                            <div class="machine-id">
                                ID: ${escapeHTML(item.id)}
                            </div>
                        </div>
                    </div>
                </td>

                <td>${escapeHTML(item.category)}</td>
                <td>${escapeHTML(item.brand || "—")}</td>
                <td>${escapeHTML(item.model || "—")}</td>
                <td>${statusBadge(item.status)}</td>
            </tr>
        `;
    }).join("");
}

/* ==========================================
   RENDER FULL MACHINERY TABLE
========================================== */

function renderMachineryTable() {
    const tbody = getElement("machineryTableBody");

    if (!tbody) return;

    const searchText = (
        getElement("searchInput")?.value || ""
    ).trim().toLowerCase();

    const selectedStatus = (
        getElement("statusFilter")?.value || ""
    ).toUpperCase();

    const filteredItems = machineryList.filter(function (item) {
        const searchableText = [
            item.name,
            item.category,
            item.brand,
            item.model,
            item.description,
            item.id
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchText);

        const matchesStatus = !selectedStatus ||
            String(item.status || "AVAILABLE").toUpperCase() === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    if (filteredItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    No matching machinery found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredItems.map(function (item) {
        return `
            <tr>
                <td>${escapeHTML(item.id)}</td>

                <td>
                    <div class="machine-cell">
                        ${machineImage(item.imageUrl, item.name)}
                        <div>
                            <div class="machine-name">
                                ${escapeHTML(item.name)}
                            </div>
                        </div>
                    </div>
                </td>

                <td>${escapeHTML(item.category)}</td>

                <td>
                    <div>${escapeHTML(item.brand || "—")}</div>
                    <small>${escapeHTML(item.model || "—")}</small>
                </td>

                <td>${statusBadge(item.status)}</td>

                <td>
                    <div class="action-buttons">
                        <button
                            type="button"
                            class="action-btn edit-btn"
                            data-action="edit"
                            data-id="${escapeHTML(item.id)}"
                        >Edit</button>

                        <button
                            type="button"
                            class="action-btn delete-btn"
                            data-action="delete"
                            data-id="${escapeHTML(item.id)}"
                        >Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

/* ==========================================
   SECTION NAVIGATION
========================================== */

function showSection(sectionId) {
    const validSections = ["overview", "machinery", "add-machinery"];

    if (!validSections.includes(sectionId)) {
        sectionId = "overview";
    }

    document.querySelectorAll(".content-section").forEach(function (section) {
        section.classList.toggle("hidden", section.id !== sectionId);
    });

    document.querySelectorAll(".sidebar-nav .nav-link").forEach(function (link) {
        link.classList.toggle(
            "active",
            link.dataset.section === sectionId
        );
    });

    const titles = {
        overview: "Dashboard Overview",
        machinery: "Machinery Inventory",
        "add-machinery": "Manage Machinery"
    };

    getElement("pageTitle").textContent = titles[sectionId];

    getElement("sidebar").classList.remove("open");

    if (sectionId === "machinery") {
        renderMachineryTable();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* ==========================================
   ADD / EDIT FORM
========================================== */

function resetMachineryForm() {
    getElement("machineryForm").reset();
    getElement("machineryId").value = "";

    currentImageUrl = "";

    getElement("formHeading").textContent = "Add New Machinery";
    getElement("saveMachineryBtn").textContent = "Save Machinery";

    clearImagePreview();
}

function openAddForm() {
    resetMachineryForm();
    showSection("add-machinery");
}

function openEditForm(id) {
    const item = machineryList.find(function (machine) {
        return String(machine.id) === String(id);
    });

    if (!item) {
        showMessage("Machinery record not found.", "error");
        return;
    }

    resetMachineryForm();

    getElement("machineryId").value = item.id;
    getElement("machineName").value = item.name || "";
    getElement("category").value = item.category || "";
    getElement("brand").value = item.brand || "";
    getElement("model").value = item.model || "";
    getElement("description").value = item.description || "";
    getElement("status").value = String(item.status || "AVAILABLE").toUpperCase();

    currentImageUrl = item.imageUrl || "";

    getElement("formHeading").textContent = "Edit Machinery";
    getElement("saveMachineryBtn").textContent = "Update Machinery";

    if (currentImageUrl) {
        showImagePreview(currentImageUrl);
    }

    showSection("add-machinery");
}

/* ==========================================
   IMAGE PREVIEW
========================================== */

function clearImagePreview() {
    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
    }

    const preview = getElement("imagePreview");

    preview.removeAttribute("src");
    preview.style.display = "none";

    getElement("previewPlaceholder").style.display = "block";
}

function showImagePreview(source) {
    const preview = getElement("imagePreview");

    preview.onload = function () {
        preview.style.display = "block";
        getElement("previewPlaceholder").style.display = "none";
    };

    preview.onerror = function () {
        preview.style.display = "none";
        getElement("previewPlaceholder").textContent =
            "Unable to display image preview.";
        getElement("previewPlaceholder").style.display = "block";
    };

    preview.src = source;
}

/* ==========================================
   CLOUDINARY IMAGE UPLOAD
========================================== */

async function uploadMachineryImage(file) {
    const formData = new FormData();

    formData.append("image", file);

    const result = await apiRequest("/api/machinery/upload-image", {
        method: "POST",
        body: formData
    });

    if (!result || !result.imageUrl) {
        throw new Error("Image upload did not return an image URL.");
    }

    return result.imageUrl;
}

/* ==========================================
   SAVE MACHINERY
========================================== */

async function saveMachinery(event) {
    event.preventDefault();

    const id = getElement("machineryId").value;

    const name = getElement("machineName").value.trim();
    const category = getElement("category").value;
    const brand = getElement("brand").value.trim();
    const model = getElement("model").value.trim();
    const description = getElement("description").value.trim();
    const status = getElement("status").value;

    const imageFile = getElement("machineImage").files[0];

    if (!name || !category) {
        showMessage("Please enter the machine name and category.", "error");
        return;
    }

    if (
        imageFile &&
        !["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)
    ) {
        showMessage("Please choose a JPG, PNG or WebP image.", "error");
        return;
    }

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
        showMessage("Image size must be 5 MB or less.", "error");
        return;
    }

    const saveButton = getElement("saveMachineryBtn");

    saveButton.disabled = true;
    saveButton.textContent = imageFile ? "Uploading image..." : "Saving...";

    try {
        let imageUrl = currentImageUrl;

        if (imageFile) {
            imageUrl = await uploadMachineryImage(imageFile);
        }

        const machineryData = {
            name: name,
            category: category,
            brand: brand,
            model: model,
            description: description,
            status: status,
            imageUrl: imageUrl || null
        };

        const endpoint = id
            ? "/api/machinery/" + encodeURIComponent(id)
            : "/api/machinery";

        const method = id ? "PUT" : "POST";

        saveButton.textContent = "Saving details...";

        await apiRequest(endpoint, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(machineryData)
        });

        showMessage(
            id
                ? "Machinery updated successfully."
                : "Machinery added successfully.",
            "success"
        );

        resetMachineryForm();

        await loadMachinery(false);

        showSection("machinery");

    } catch (error) {
        showMessage(error.message || "Unable to save machinery.", "error");

    } finally {
        saveButton.disabled = false;

        if (getElement("machineryId").value) {
            saveButton.textContent = "Update Machinery";
        } else {
            saveButton.textContent = "Save Machinery";
        }
    }
}

/* ==========================================
   DELETE MACHINERY
========================================== */

async function deleteMachinery(id) {
    const item = machineryList.find(function (machine) {
        return String(machine.id) === String(id);
    });

    if (!item) {
        showMessage("Machinery record not found.", "error");
        return;
    }

    const confirmed = window.confirm(
        'Delete "' + item.name + '" permanently from the database?'
    );

    if (!confirmed) return;

    try {
        await apiRequest("/api/machinery/" + encodeURIComponent(id), {
            method: "DELETE"
        });

        showMessage("Machinery deleted successfully.", "success");

        await loadMachinery(false);

    } catch (error) {
        showMessage(error.message || "Unable to delete machinery.", "error");
    }
}

/* ==========================================
   EVENT LISTENERS
========================================== */

function setupEventListeners() {
    document.querySelectorAll(".sidebar-nav .nav-link").forEach(function (link) {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            showSection(link.dataset.section);
        });
    });

    getElement("quickAddBtn").addEventListener("click", openAddForm);
    getElement("listAddBtn").addEventListener("click", openAddForm);

    getElement("viewAllBtn").addEventListener("click", function () {
        showSection("machinery");
    });

    getElement("cancelFormBtn").addEventListener("click", function () {
        resetMachineryForm();
        showSection("machinery");
    });

    getElement("logoutBtn").addEventListener("click", function (event) {
        event.preventDefault();

        if (window.confirm("Are you sure you want to logout?")) {
            logout();
        }
    });

    getElement("viewWebsite").addEventListener("click", function (event) {
        event.preventDefault();

        window.open(
            "http://127.0.0.1:5500/index.html",
            "_blank",
            "noopener,noreferrer"
        );
    });

    getElement("menuToggle").addEventListener("click", function () {
        getElement("sidebar").classList.toggle("open");
    });

    getElement("searchInput").addEventListener("input", renderMachineryTable);
    getElement("statusFilter").addEventListener("change", renderMachineryTable);

    getElement("refreshBtn").addEventListener("click", async function () {
        const success = await loadMachinery();

        if (success) {
            showMessage("Machinery list refreshed.", "success");
        }
    });

    getElement("machineryForm").addEventListener("submit", saveMachinery);

    getElement("machineImage").addEventListener("change", function (event) {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        if (
            !["image/jpeg", "image/png", "image/webp"].includes(file.type)
        ) {
            event.target.value = "";
            showMessage("Choose a JPG, PNG or WebP image.", "error");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            event.target.value = "";
            showMessage("Image size must be 5 MB or less.", "error");
            return;
        }

        if (previewObjectUrl) {
            URL.revokeObjectURL(previewObjectUrl);
        }

        previewObjectUrl = URL.createObjectURL(file);
        showImagePreview(previewObjectUrl);
    });

    getElement("machineryTableBody").addEventListener("click", function (event) {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

        if (action === "edit") {
            openEditForm(id);
        } else if (action === "delete") {
            deleteMachinery(id);
        }
    });
}

/* ==========================================
   INITIALIZE DASHBOARD
========================================== */

document.addEventListener("DOMContentLoaded", async function () {
    const verified = await verifyAdmin();

    if (!verified) {
        return;
    }

    setupEventListeners();

    await loadMachinery();

    showSection("overview");
});
