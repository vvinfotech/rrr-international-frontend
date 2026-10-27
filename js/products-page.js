// ==========================================
// RRR INTERNATIONAL - MACHINERY CATALOGUE
// Backend API + Cloudinary Images
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const productsGrid = document.getElementById("productsGrid");
    const productSearch = document.getElementById("productSearch");
    const noProducts = document.getElementById("noProducts");
    const filterButtons = document.querySelectorAll(".filter-btn");

    if (!productsGrid || !productSearch || !noProducts) {
        return;
    }

    const API_URL = "http://localhost:8082/api/machinery";

    let activeCategory = "all";
    let allProducts = [];

    productsGrid.innerHTML = "<p>Loading machinery catalogue...</p>";

    // ==========================================
    // LOAD MACHINERY FROM BACKEND
    // ==========================================

    async function loadProducts() {

        try {

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(
                    "Unable to load machinery. HTTP status: " +
                    response.status
                );
            }

            const backendProducts = await response.json();

            // Existing local product data, if available
            const localProducts =
                typeof machineryProducts !== "undefined"
                    ? machineryProducts
                    : [];

            allProducts = backendProducts.map(function (machine) {

                const localProduct = localProducts.find(function (product) {
                    return String(product.id) === String(machine.id);
                });

                return {

                    ...machine,

                    id: machine.id,

                    name: machine.name ||
                        (localProduct ? localProduct.name : "Textile Machinery"),

                    model: machine.model ||
                        (localProduct
                            ? localProduct.model
                            : "Model details to be confirmed"),

                    brand: machine.brand ||
                        (localProduct ? localProduct.brand : ""),

                    category: (
                        machine.category ||
                        (localProduct ? localProduct.category : "")
                    ).toLowerCase(),

                    description: machine.description ||
                        (localProduct
                            ? localProduct.description
                            : "Contact RRR International for details."),

                    status: machine.status || "CONTACT FOR AVAILABILITY",

                    image: machine.imageUrl ||
                        (localProduct ? localProduct.image : "")

                };

            });

            renderProducts();

        } catch (error) {

            console.error("Machinery loading error:", error);

            productsGrid.innerHTML = `
                <div class="catalogue-error">
                    <h3>Unable to Load Machinery</h3>
                    <p>Please check your internet connection and try again.</p>
                    <button type="button" id="retryProducts">
                        Try Again
                    </button>
                </div>
            `;

            noProducts.hidden = true;

            const retryButton = document.getElementById("retryProducts");

            if (retryButton) {
                retryButton.addEventListener("click", loadProducts);
            }

        }

    }

    // ==========================================
    // DISPLAY MACHINERY CARDS
    // ==========================================

    function renderProducts() {

        const searchText = productSearch.value.trim().toLowerCase();

        const filteredProducts = allProducts.filter(function (product) {

            const matchesSearch =
                (product.name || "").toLowerCase().includes(searchText) ||
                (product.model || "").toLowerCase().includes(searchText) ||
                (product.brand || "").toLowerCase().includes(searchText) ||
                (product.description || "").toLowerCase().includes(searchText) ||
                (product.category || "").toLowerCase().includes(searchText);

            const matchesCategory =
                activeCategory === "all" ||
                (product.category || "").toLowerCase() ===
                    activeCategory.toLowerCase();

            return matchesSearch && matchesCategory;

        });

        productsGrid.innerHTML = "";

        if (filteredProducts.length === 0) {

            noProducts.hidden = false;
            noProducts.textContent = "No machinery found.";

            return;

        }

        noProducts.hidden = true;

        filteredProducts.forEach(function (product) {

            // Product card
            const card = document.createElement("article");
            card.className = "product-card";

            // Image container
            const imageContainer = document.createElement("div");
            imageContainer.className = "product-image-container";

            const image = document.createElement("img");

            image.className = "product-image";
            image.alt = product.name || "Textile machinery";
            image.loading = "lazy";

            if (product.image) {

                image.src = product.image;

                image.onerror = function () {
                    image.alt = "Machinery image unavailable";
                    image.style.display = "none";
                };

                imageContainer.appendChild(image);

            } else {

                const placeholder = document.createElement("div");

                placeholder.className = "product-image-placeholder";
                placeholder.textContent = "Image Coming Soon";

                imageContainer.appendChild(placeholder);

            }

            // Product content
            const content = document.createElement("div");
            content.className = "product-content";

            // Category
            const category = document.createElement("p");

            category.className = "product-category";
            category.textContent = product.category
                ? product.category.toUpperCase()
                : "TEXTILE MACHINERY";

            // Name
            const title = document.createElement("h3");

            title.className = "product-title";
            title.textContent = product.name || "Textile Machinery";

            // Model
            const model = document.createElement("p");

            model.className = "product-model";
            model.textContent = "Model: " +
                (product.model || "Contact for details");

            // Brand
            const brand = document.createElement("p");

            brand.className = "product-brand";
            brand.textContent = "Brand: " +
                (product.brand || "Contact for details");

            // Availability
            const status = document.createElement("p");

            status.className = "product-status";

            const machineStatus = (
                product.status || "CONTACT FOR AVAILABILITY"
            ).toUpperCase();

            if (machineStatus === "AVAILABLE") {

                status.textContent = "Available";
                status.classList.add("available");

            } else if (machineStatus === "SOLD") {

                status.textContent = "Sold";
                status.classList.add("sold");

            } else {

                status.textContent = "Contact for Availability";

            }

            // Description
            const description = document.createElement("p");

            description.className = "product-description";
            description.textContent = product.description ||
                "Contact RRR International for machine details.";

            // Buttons container
            const actions = document.createElement("div");
            actions.className = "product-actions";

            // View Details button
            const detailsButton = document.createElement("a");

            detailsButton.className = "btn-view-details";
            detailsButton.textContent = "View Details";

            // Pass the backend machinery ID to the details page
            detailsButton.href =
                "product-details.html?id=" +
                encodeURIComponent(product.id);

            actions.appendChild(detailsButton);

            // WhatsApp enquiry button
            const enquiryButton = document.createElement("a");

            enquiryButton.className = "btn-enquire";
            enquiryButton.textContent = "Enquire Now";

            const message =
                "Hello RRR International, I am interested in " +
                (product.name || "textile machinery") +
                ", Model: " +
                (product.model || "Not specified") +
                ". Please share more details.";

            enquiryButton.href =
                "https://wa.me/919976161358?text=" +
                encodeURIComponent(message);

            enquiryButton.target = "_blank";
            enquiryButton.rel = "noopener noreferrer";

            actions.appendChild(enquiryButton);

            // Assemble card
            content.appendChild(category);
            content.appendChild(title);
            content.appendChild(model);
            content.appendChild(brand);
            content.appendChild(status);
            content.appendChild(description);
            content.appendChild(actions);

            card.appendChild(imageContainer);
            card.appendChild(content);

            productsGrid.appendChild(card);

        });

    }

    // ==========================================
    // SEARCH MACHINERY
    // ==========================================

    productSearch.addEventListener("input", function () {
        renderProducts();
    });

    // ==========================================
    // CATEGORY FILTERS
    // ==========================================

    filterButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            filterButtons.forEach(function (filterButton) {
                filterButton.classList.remove("active");
            });

            button.classList.add("active");

            activeCategory = (
                button.dataset.category || "all"
            ).toLowerCase();

            renderProducts();

        });

    });

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    loadProducts();

});