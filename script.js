const API_URL = "https://fakestoreapi.com/products";
const MAX_RESULTS = 6;

const booksContainer = document.getElementById("books-results");
const resultsStatus = document.getElementById("results-status");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("category-filter");
const sortFilter = document.getElementById("sort-filter");
const resetFiltersButton = document.getElementById("reset-filters");
const paginationControls = document.getElementById("pagination-controls");
const backToTopButton = document.getElementById("back-to-top");
const FILTERS_STORAGE_KEY = "preppers.filters.v1";

let products = [];
let filteredProducts = [];
let currentPage = 1;

document.querySelectorAll(".toggle").forEach((button) => {
    button.addEventListener("click", () => {
        const checklist = button.nextElementSibling;
        checklist.classList.toggle("hidden");
        const isExpanded = !checklist.classList.contains("hidden");
        button.setAttribute("aria-expanded", String(isExpanded));
    });
});

document.querySelectorAll("a[href^='#']").forEach((anchor) => {
    anchor.addEventListener("click", function (event) {
        event.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            target.scrollIntoView({ behavior: "smooth" });
        }
    });
});

function formatMoney(price) {
    return `$${Number(price).toFixed(2)}`;
}

function toTitleCase(text) {
    return text
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function populateCategoryFilter(items) {
    const categories = [...new Set(items.map((item) => item.category))].sort();

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = toTitleCase(category);
        categoryFilter.appendChild(option);
    });
}

function renderProducts(items) {
    booksContainer.innerHTML = "";
    booksContainer.setAttribute("aria-busy", "false");

    if (items.length === 0) {
        return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach((product, index) => {
        const card = document.createElement("article");
        card.className = "book";
        card.style.animationDelay = `${index * 60}ms`;

        card.innerHTML = `
            <img class="book__img" src="${product.image}" alt="${product.title}">
            <h3 class="book__title">${product.title}</h3>
            <div class="book__meta">
                <span class="book__badge">${toTitleCase(product.category)}</span>
                <span class="book__price">${formatMoney(product.price)}</span>
            </div>
            <p class="book__rating">Rating: ${product.rating.rate} / 5 (${product.rating.count} reviews)</p>
        `;

        fragment.appendChild(card);
    });

    booksContainer.appendChild(fragment);
}

function renderEmptyState() {
    booksContainer.innerHTML = `
        <article class="empty-state" aria-live="polite">
            <div class="empty-state__icon" aria-hidden="true">0</div>
            <h4 class="empty-state__title">No matching products found</h4>
            <p class="empty-state__text">Try a broader search term, switch category, or reset all filters.</p>
        </article>
    `;
    booksContainer.setAttribute("aria-busy", "false");
}

function renderSkeletonCards(count = MAX_RESULTS) {
    booksContainer.innerHTML = "";
    booksContainer.setAttribute("aria-busy", "true");

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i += 1) {
        const card = document.createElement("article");
        card.className = "book skeleton-card";
        card.setAttribute("aria-hidden", "true");
        card.innerHTML = `
            <div class="skeleton-block skeleton-image"></div>
            <div class="skeleton-block skeleton-title"></div>
            <div class="skeleton-row">
                <div class="skeleton-block skeleton-chip"></div>
                <div class="skeleton-block skeleton-price"></div>
            </div>
            <div class="skeleton-block skeleton-rating"></div>
        `;
        fragment.appendChild(card);
    }

    booksContainer.appendChild(fragment);
}

function createPageButton(page) {
    const pageButton = document.createElement("button");
    pageButton.type = "button";
    pageButton.textContent = String(page);
    pageButton.setAttribute("aria-label", `Go to page ${page}`);

    if (page === currentPage) {
        pageButton.classList.add("pagination__current");
        pageButton.disabled = true;
    }

    pageButton.addEventListener("click", () => {
        currentPage = page;
        renderCurrentPage();
    });

    return pageButton;
}

function createEllipsis() {
    const ellipsis = document.createElement("span");
    ellipsis.className = "pagination__ellipsis";
    ellipsis.textContent = "...";
    ellipsis.setAttribute("aria-hidden", "true");
    return ellipsis;
}

function getVisiblePages(totalPages) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = [1];
    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

    if (rangeStart > 2) {
        pages.push("ELLIPSIS");
    }

    for (let page = rangeStart; page <= rangeEnd; page += 1) {
        pages.push(page);
    }

    if (rangeEnd < totalPages - 1) {
        pages.push("ELLIPSIS");
    }

    pages.push(totalPages);
    return pages;
}

function renderPagination(totalItems) {
    paginationControls.innerHTML = "";

    const totalPages = Math.ceil(totalItems / MAX_RESULTS);

    if (totalPages <= 1) {
        return;
    }

    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "Previous";
    previous.setAttribute("aria-label", "Go to previous page");
    previous.disabled = currentPage === 1;
    previous.addEventListener("click", () => {
        currentPage -= 1;
        renderCurrentPage();
    });
    paginationControls.appendChild(previous);

    const visiblePages = getVisiblePages(totalPages);
    visiblePages.forEach((page) => {
        if (page === "ELLIPSIS") {
            paginationControls.appendChild(createEllipsis());
            return;
        }

        paginationControls.appendChild(createPageButton(page));
    });

    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "Next";
    next.setAttribute("aria-label", "Go to next page");
    next.disabled = currentPage === totalPages;
    next.addEventListener("click", () => {
        currentPage += 1;
        renderCurrentPage();
    });
    paginationControls.appendChild(next);
}

function renderCurrentPage() {
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / MAX_RESULTS));

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * MAX_RESULTS;
    const visibleItems = filteredProducts.slice(startIndex, startIndex + MAX_RESULTS);

    renderProducts(visibleItems);
    renderPagination(filteredProducts.length);

    if (filteredProducts.length === 0) {
        renderEmptyState();
        paginationControls.innerHTML = "";
        resultsStatus.textContent = "No matching results. Try a different search or filter.";
        return;
    }

    const firstVisible = startIndex + 1;
    const lastVisible = startIndex + visibleItems.length;
    resultsStatus.textContent = `Showing ${firstVisible}-${lastVisible} of ${filteredProducts.length} matching items.`;
}

function applyFilters(resetPage = false) {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    const sortBy = sortFilter.value;

    filteredProducts = [...products].filter((product) => {
        const matchesSearch =
            product.title.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === "ALL" || product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    if (sortBy === "LOW_TO_HIGH") {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === "HIGH_TO_LOW") {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === "RATING") {
        filteredProducts.sort((a, b) => b.rating.rate - a.rating.rate);
    }

    if (resetPage) {
        currentPage = 1;
    }

    renderCurrentPage();
}

function debounce(callback, delayMs) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback(...args), delayMs);
    };
}

function saveFilters() {
    const filterState = {
        searchTerm: searchInput.value,
        selectedCategory: categoryFilter.value,
        sortBy: sortFilter.value
    };

    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filterState));
}

function restoreFilters() {
    const savedState = localStorage.getItem(FILTERS_STORAGE_KEY);

    if (!savedState) {
        return;
    }

    try {
        const parsed = JSON.parse(savedState);
        searchInput.value = parsed.searchTerm || "";
        sortFilter.value = parsed.sortBy || "DEFAULT";

        const hasSavedCategory = Array.from(categoryFilter.options)
            .some((option) => option.value === parsed.selectedCategory);
        categoryFilter.value = hasSavedCategory ? parsed.selectedCategory : "ALL";
    } catch (error) {
        localStorage.removeItem(FILTERS_STORAGE_KEY);
    }
}

function updateBackToTopVisibility() {
    if (window.scrollY > 320) {
        backToTopButton.classList.add("is-visible");
    } else {
        backToTopButton.classList.remove("is-visible");
    }
}

async function loadProducts() {
    try {
        resultsStatus.textContent = "Loading products...";
        renderSkeletonCards();
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        products = await response.json();
        populateCategoryFilter(products);
        restoreFilters();
        applyFilters(true);
    } catch (error) {
        booksContainer.innerHTML = "";
        booksContainer.setAttribute("aria-busy", "false");
        paginationControls.innerHTML = "";
        resultsStatus.textContent = "Unable to load products right now. Please try again later.";
        console.error(error);
    }
}

const debouncedSearch = debounce(() => applyFilters(true), 250);

searchInput.addEventListener("input", () => {
    saveFilters();
    debouncedSearch();
});
categoryFilter.addEventListener("change", () => {
    saveFilters();
    applyFilters(true);
});
sortFilter.addEventListener("change", () => {
    saveFilters();
    applyFilters(true);
});
resetFiltersButton.addEventListener("click", () => {
    searchInput.value = "";
    categoryFilter.value = "ALL";
    sortFilter.value = "DEFAULT";
    saveFilters();
    applyFilters(true);
});

backToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("scroll", updateBackToTopVisibility);
updateBackToTopVisibility();

loadProducts();
