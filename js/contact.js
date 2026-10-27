// =====================================
// RRR INTERNATIONAL - CONTACT FORM
// WhatsApp Enquiry Integration
// =====================================

document.addEventListener("DOMContentLoaded", function () {

    const contactForm = document.getElementById("contactEnquiryForm");
    const formMessage = document.getElementById("contactFormMessage");

    // RRR International WhatsApp Number
    const whatsappNumber = "919976161358";

    if (!contactForm) {
        return;
    }

    contactForm.addEventListener("submit", function (event) {

        event.preventDefault();

        // Get form values
        const customerName = document
            .getElementById("customerName")
            .value.trim();

        const customerPhone = document
            .getElementById("customerPhone")
            .value.trim();

        const machineryType = document
            .getElementById("machineryType")
            .value;

        const customerMessage = document
            .getElementById("customerMessage")
            .value.trim();

        // Validate form
        if (
            !customerName ||
            !customerPhone ||
            !machineryType ||
            !customerMessage
        ) {
            formMessage.textContent =
                "Please complete all required fields.";

            return;
        }

        // Prepare WhatsApp message
        const whatsappMessage =
            "Hello RRR International,\n\n" +
            "I would like to enquire about textile machinery.\n\n" +
            "*Customer Details*\n" +
            "Name: " + customerName + "\n" +
            "Phone: " + customerPhone + "\n\n" +
            "*Machinery Category:* " + machineryType + "\n\n" +
            "*Requirements:*\n" + customerMessage + "\n\n" +
            "Please share the available machine details and specifications.\n\n" +
            "Thank you.";

        // Encode message for WhatsApp URL
        const encodedMessage = encodeURIComponent(whatsappMessage);

        const whatsappURL =
            "https://wa.me/" +
            whatsappNumber +
            "?text=" +
            encodedMessage;

        // Open WhatsApp with the prepared message
        const whatsappWindow = window.open(
            whatsappURL,
            "_blank",
            "noopener,noreferrer"
        );

        // Show status message
        if (whatsappWindow) {
            formMessage.style.color = "#16834A";
            formMessage.textContent =
                "WhatsApp opened. Please review and send your enquiry.";
        } else {
            formMessage.style.color = "#B42318";
            formMessage.textContent =
                "WhatsApp could not open automatically. Please allow pop-ups and try again.";
        }

    });

});
