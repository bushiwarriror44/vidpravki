let activeTab = "stats";
let csrfToken = null;

async function fetchCsrfToken() {
    try {
        const response = await fetch('/api/csrf-token', {
            credentials: 'same-origin'
        });
        const data = await response.json();
        csrfToken = data.csrf_token;
    } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
    }
}

function switchTab(tabName) {
    activeTab = tabName;

    document.querySelectorAll(".tab-button").forEach((btn) => {
        btn.classList.remove("active");
    });
    if (event && event.target) {
        event.target.closest(".tab-button")?.classList.add("active");
    }

    document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
    });
    const tabElement = document.getElementById(tabName + "-tab");
    if (tabElement) {
        tabElement.classList.add("active");
    }

    if (tabName === 'stats') {
        if (typeof loadUmamiSettings === 'function') {
            loadUmamiSettings();
        }
    } else if (tabName === 'shipments') {
        if (typeof loadShipmentsPage === 'function') {
            loadShipmentsPage();
        }
    } else if (tabName === 'wholesale') {
        if (typeof loadWholesalePage === 'function') {
            loadWholesalePage();
        }
    } else if (tabName === 'promotions') {
        if (typeof loadPromotionsPage === 'function') {
            loadPromotionsPage();
        }
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    await fetchCsrfToken();
});
