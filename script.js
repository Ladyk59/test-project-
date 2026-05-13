document.querySelectorAll(" .toggle").forEach(button => {
    button.addEventListener("click", () => {
        const checklist = button.nextElementSibling;
        checklist.classList.toggle("hidden");
    });
});

document.querySelectorAll("a[href^='#']").forEach(anchor => {
    anchor.addEventListener("click", function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            target.scrollIntoView({ behavior: "smooth" });
        }
    });
});

const filterSelect = document.getElementById("filter");
const booksContainer = document.querySelector(".books");
const originalBookOrder = booksContainer ? Array.from(booksContainer.querySelectorAll(".book")) : [];

function getBookPrice(book) {
    const priceText = book.querySelector(".book__price")?.textContent ?? "";
    return Number.parseFloat(priceText.replace(/[^\d.]/g, "")) || 0;
}

function getBookRating(book) {
    const icons = book.querySelectorAll(".book__rating i");
    let rating = 0;

    icons.forEach(icon => {
        if (icon.classList.contains("fa-star-half-alt")) {
            rating += 0.5;
        } else if (icon.classList.contains("fa-star")) {
            rating += 1;
        }
    });

    return rating;
}

if (filterSelect && booksContainer) {
    filterSelect.addEventListener("change", event => {
        const selectedValue = event.target.value;
        const books = Array.from(booksContainer.querySelectorAll(".book"));

        if (!selectedValue) {
            books.sort((firstBook, secondBook) => originalBookOrder.indexOf(firstBook) - originalBookOrder.indexOf(secondBook));
        } else if (selectedValue === "LOW_TO_HIGH") {
            books.sort((firstBook, secondBook) => getBookPrice(firstBook) - getBookPrice(secondBook));
        } else if (selectedValue === "HIGH_TO_LOW") {
            books.sort((firstBook, secondBook) => getBookPrice(secondBook) - getBookPrice(firstBook));
        } else if (selectedValue === "RATING") {
            books.sort((firstBook, secondBook) => getBookRating(secondBook) - getBookRating(firstBook));
        }

        books.forEach(book => booksContainer.appendChild(book));
    });
}