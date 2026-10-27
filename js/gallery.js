document.addEventListener("DOMContentLoaded", function () {

    const galleryGrid = document.getElementById("galleryGrid");
    const galleryFilters = document.querySelectorAll(".gallery-filter");

    const galleryLightbox = document.getElementById("galleryLightbox");
    const lightboxClose = document.getElementById("lightboxClose");
    const lightboxImage = document.getElementById("lightboxImage");
    const lightboxTitle = document.getElementById("lightboxTitle");
    const lightboxEnquire = document.getElementById("lightboxEnquire");

    if (!galleryGrid) {
        return;
    }

    // Only three official gallery showcase images.
    const galleryProducts = [
        {
            id: 1,
            name: "Sulzer Textile Machinery",
            category: "sulzer",
            image: "./images/sulzer-machine.jpg"
        },
        {
            id: 2,
            name: "Airjet Textile Machinery",
            category: "airjet",
            image: "./images/airjet-machine.jpg"
        },
        {
            id: 3,
            name: "Loom Textile Machinery",
            category: "loom",
            image: "./images/loom-machine.jpg"
        }
    ];

    let activeCategory = "all";

    // Display the selected category images.
    function renderGallery() {

        galleryGrid.innerHTML = "";

        const filteredProducts = galleryProducts.filter(function (product) {
            return activeCategory === "all" ||
                product.category === activeCategory;
        });

        filteredProducts.forEach(function (product) {

            const card = document.createElement("article");
            card.className = "gallery-card";
            card.dataset.category = product.category;

            const imageButton = document.createElement("button");
            imageButton.className = "gallery-image-button";
            imageButton.type = "button";
            imageButton.setAttribute(
                "aria-label",
                "View " + product.name + " photo"
            );

            const image = document.createElement("img");
            image.className = "gallery-photo";
            image.src = product.image;
            image.alt = product.name;
            image.loading = "lazy";

            image.onerror = function () {
                image.alt = product.name + " image unavailable";
                imageButton.classList.add("gallery-image-error");
            };

            const zoomLabel = document.createElement("span");
            zoomLabel.className = "gallery-zoom";
            zoomLabel.textContent = "View Photo ↗";

            imageButton.appendChild(image);
            imageButton.appendChild(zoomLabel);

            const caption = document.createElement("div");
            caption.className = "gallery-caption";

            const title = document.createElement("h3");
            title.textContent = product.name;

            const description = document.createElement("p");
            description.textContent = product.category.toUpperCase() +
                " MACHINERY";

            caption.appendChild(title);
            caption.appendChild(description);

            imageButton.addEventListener("click", function () {
                openLightbox(product);
            });

            card.appendChild(imageButton);
            card.appendChild(caption);

            galleryGrid.appendChild(card);
        });
    }

    // Open enlarged image.
    function openLightbox(product) {

        if (!galleryLightbox || !lightboxImage) {
            return;
        }

        lightboxImage.src = product.image;
        lightboxImage.alt = product.name;

        if (lightboxTitle) {
            lightboxTitle.textContent = product.name;
        }

        if (lightboxEnquire) {

            const message =
                "Hello RRR International, I am interested in " +
                product.name +
                ". Please share the details and availability.";

            lightboxEnquire.href =
                "https://wa.me/919976161358?text=" +
                encodeURIComponent(message);
        }

        galleryLightbox.hidden = false;
        galleryLightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";

        if (lightboxClose) {
            lightboxClose.focus();
        }
    }

    // Close enlarged image.
    function closeLightbox() {

        if (!galleryLightbox) {
            return;
        }

        galleryLightbox.hidden = true;
        galleryLightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";

        if (lightboxImage) {
            lightboxImage.src = "";
        }
    }

    // Sulzer, Airjet, Loom filters.
    galleryFilters.forEach(function (button) {

        button.addEventListener("click", function () {

            activeCategory =
                (button.dataset.category || "all").toLowerCase();

            galleryFilters.forEach(function (filter) {
                filter.classList.remove("active");
            });

            button.classList.add("active");

            renderGallery();
        });
    });

    // Close button.
    if (lightboxClose) {
        lightboxClose.addEventListener("click", closeLightbox);
    }

    // Close when clicking outside the image.
    if (galleryLightbox) {
        galleryLightbox.addEventListener("click", function (event) {

            if (event.target === galleryLightbox) {
                closeLightbox();
            }
        });
    }

    // Close with Escape key.
    document.addEventListener("keydown", function (event) {

        if (
            event.key === "Escape" &&
            galleryLightbox &&
            !galleryLightbox.hidden
        ) {
            closeLightbox();
        }
    });

    // Initially show all three images.
    renderGallery();

});