// ==========================================
// RRR INTERNATIONAL - PRODUCT DETAILS
// Backend API Integration
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const detailsContainer = document.getElementById(
        "productDetailsContent"
    );

    const notFoundContainer = document.getElementById(
        "productDetailsNotFound"
    );

    const API_URL = "http://localhost:8082/api/machinery";

    // ------------------------------------------
    // ESCAPE HTML VALUES
    // ------------------------------------------

    function escapeProductText(value) {

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

    // ------------------------------------------
    // GET PRODUCT ID FROM URL
    // ------------------------------------------

    function getProductId() {

        const parameters = new URLSearchParams(
            window.location.search
        );

        const productId = Number(parameters.get("id"));

        if (!Number.isInteger(productId) || productId <= 0) {
            return null;
        }

        return productId;

    }

    // ------------------------------------------
    // LOAD PRODUCT FROM BACKEND
    // ------------------------------------------

    async function loadProductDetails() {

        if (!detailsContainer || !notFoundContainer) {
            return;
        }

        const productId = getProductId();

        if (!productId) {
            showNotFound();
            return;
        }

        detailsContainer.hidden = false;
        notFoundContainer.hidden = true;

        detailsContainer.innerHTML = "<p>Loading machinery details...</p>";

        try {

            const response = await fetch(
                `${API_URL}/${productId}`
            );

            if (response.status === 404) {
                showNotFound();
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to load machinery details.");
            }

            const product = await response.json();

            // Find a matching local product for its image and specifications.
            const localProduct =
                typeof machineryProducts !== "undefined"
                    ? machineryProducts.find(function (item) {
                        return String(item.id) === String(product.id);
                    })
                    : null;

            // Prefer image URL saved in the backend.
            const imagePath =
                product.imageUrl ||
                (localProduct ? localProduct.image : "");

            // Display backend information with local fallback.
            const mergedProduct = {

                ...product,

                name:
                    product.name ||
                    (localProduct ? localProduct.name : "Textile Machinery"),

                model:
                    product.model ||
                    (localProduct
                        ? localProduct.model
                        : "Model details to be confirmed"),

                category:
                    product.category ||
                    (localProduct ? localProduct.category : "Textile"),

                description:
                    product.description ||
                    (localProduct
                        ? localProduct.description
                        : "Contact RRR International for details."),

                status:
                    product.status || "Contact for Availability",

                image: imagePath,

                specifications:
                    localProduct?.specifications || {}

            };

            renderProductDetails(mergedProduct);

        } catch (error) {

            console.error("Product details error:", error);

            detailsContainer.hidden = false;
            notFoundContainer.hidden = true;

            detailsContainer.innerHTML = `
                <p>
                    Unable to load machinery details.
                    Please check whether the backend is running.
                </p>
            `;

        }

    }

    // ------------------------------------------
    // SHOW NOT FOUND
    // ------------------------------------------

    function showNotFound() {

        detailsContainer.hidden = true;
        notFoundContainer.hidden = false;

        document.title =
            "Machinery Not Found | RRR International";

    }

    // ------------------------------------------
    // RENDER PRODUCT DETAILS
    // ------------------------------------------

    function renderProductDetails(product) {

        const safeName = escapeProductText(product.name);
        const safeModel = escapeProductText(product.model);
        const safeDescription = escapeProductText(product.description);
        const safeStatus = escapeProductText(product.status);

        const categoryName = product.category
            ? product.category.charAt(0).toUpperCase() +
              product.category.slice(1)
            : "Textile";

        const safeCategory = escapeProductText(categoryName);

        const imagePath = product.image
            ? escapeProductText(product.image)
            : "";

        // Specifications
        const specificationRows = Object.entries(
            product.specifications || {}
        )
            .map(function ([label, value]) {

                return `
                    <div class="detail-spec-row">
                        <span>${escapeProductText(label)}</span>
                        <strong>${escapeProductText(value)}</strong>
                    </div>
                `;

            })
            .join("");

        // WhatsApp enquiry
        const message =
            `Hello RRR International, I am interested in ${product.name}. ` +
            `Please share the specifications, price if available, and current availability.`;

        const whatsappLink =
            `https://wa.me/919976161358?text=${encodeURIComponent(message)}`;

        // Image markup
        const imageMarkup = imagePath
            ? `
                <img
                    src="${imagePath}"
                    alt="${safeName}"
                    class="details-product-image"
                    onerror="this.style.display='none'; this.nextElementSibling.hidden=false;"
                >

                <div class="details-image-placeholder" hidden>
                    <span aria-hidden="true">⚙️</span>
                    <p>${safeCategory.toUpperCase()} MACHINERY</p>
                    <small>Image currently unavailable</small>
                </div>
            `
            : `
                <div class="details-image-placeholder">
                    <span aria-hidden="true">⚙️</span>
                    <p>${safeCategory.toUpperCase()} MACHINERY</p>
                    <small>Product photo unavailable</small>
                </div>
            `;

        // Render details
        detailsContainer.innerHTML = `

            <div class="product-details-grid">

                <div class="details-image-column">

                    <div class="details-main-image">
                        ${imageMarkup}
                    </div>

                    <p class="details-image-note">
                        Contact us for machinery specifications and availability.
                    </p>

                </div>

                <div class="details-information">

                    <p class="section-label">
                        ${safeCategory.toUpperCase()} MACHINERY
                    </p>

                    <h1>${safeName}</h1>

                    <p class="details-model">
                        ${safeModel}
                    </p>

                    <div class="details-status">
                        <span class="details-status-dot"></span>
                        ${safeStatus}
                    </div>

                    <div class="details-description">
                        <h2>Product Overview</h2>
                        <p>${safeDescription}</p>
                    </div>

                    <div class="details-specifications">
                        <h2>Specifications</h2>

                        ${
                            specificationRows ||
                            "<p>Contact us for specifications.</p>"
                        }

                    </div>

                    <div class="details-actions">

                        <a
                            href="${whatsappLink}"
                            class="btn btn-primary"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Enquire on WhatsApp
                        </a>

                        <a
                            href="products.html"
                            class="details-back-btn"
                        >
                            ← Back to Machinery
                        </a>

                    </div>

                    <p class="details-disclaimer">
                        Specifications, pricing and availability should be
                        confirmed directly with RRR International.
                    </p>

                </div>

            </div>

        `;

        detailsContainer.hidden = false;
        notFoundContainer.hidden = true;

        document.title =
            `${product.name} | RRR International`;

    }

    // Start
    loadProductDetails();

});