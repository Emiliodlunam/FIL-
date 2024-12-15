const API_URL = "http://localhost:3000";
let token = null;
let currentUsername = null;

// DOM Elements
const authMessage = document.getElementById('authMessage');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const userSection = document.getElementById('userSection');

const searchForm = document.getElementById('searchForm');
const searchQueryInput = document.getElementById('searchQuery');
const searchAuthorInput = document.getElementById('searchAuthor');
const searchResults = document.getElementById('searchResults');
const paginationControls = document.getElementById('paginationControls');

const myShelf = document.getElementById('myShelf');
const recommendationsDiv = document.getElementById('recommendations');
const statsDiv = document.getElementById('stats');

const toast = document.getElementById('toast');
const spinnerOverlay = document.getElementById('spinnerOverlay');

const filterCategoryInput = document.getElementById('filterCategory');
const applyFilterBtn = document.getElementById('applyFilterBtn');

const navbar = document.getElementById('navbar');

let currentSearchPage = 1;
let currentSearchQuery = '';
let currentSearchAuthor = '';

// Mostrar notificaciones
function showToast(message) {
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Mostrar spinner
function showSpinner(show) {
    spinnerOverlay.style.display = show ? 'flex' : 'none';
}

// Registro
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;

    try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({username, password})
        });
        const data = await res.json();
        if(data.error) {
            authMessage.textContent = data.error;
        } else {
            authMessage.style.color = 'green';
            authMessage.textContent = data.message;
        }
    } catch (err) {
        authMessage.style.color = 'red';
        authMessage.textContent = "Error de conexión con el servidor.";
    }
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('logUsername').value;
    const password = document.getElementById('logPassword').value;

    try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({username, password})
        });
        const data = await res.json();
        if(data.error) {
            authMessage.style.color = 'red';
            authMessage.textContent = data.error;
        } else {
            token = data.token;
            currentUsername = data.username;
            authMessage.style.color = 'green';
            authMessage.textContent = "Sesión iniciada.";
            renderUserSection();
            showMainSections();
            loadMyShelf();
            loadStats();
            loadRecommendations();
        }
    } catch (err) {
        authMessage.style.color = 'red';
        authMessage.textContent = "Error de conexión con el servidor.";
    }
});

// Render top user section
function renderUserSection() {
    if(token && currentUsername) {
        userSection.innerHTML = `
            <span style="font-weight:bold;">${currentUsername}</span>
            <button id="logoutBtn" style="padding:5px 10px; background:#e74c3c; color:#fff; border:none; border-radius:4px; cursor:pointer;">Logout</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', () => {
            token = null;
            currentUsername = null;
            userSection.innerHTML = '';
            hideMainSections();
            authMessage.textContent = "Sesión cerrada.";
        });
    } else {
        userSection.innerHTML = '';
    }
}

function showMainSections() {
    navbar.style.display = 'block';
    document.querySelector('.search-section').style.display = 'block';
    document.querySelector('.filters-section').style.display = 'block';
    document.querySelector('.library-section').style.display = 'block';
}

function hideMainSections() {
    navbar.style.display = 'none';
    document.querySelector('.search-section').style.display = 'none';
    document.querySelector('.filters-section').style.display = 'none';
    document.querySelector('.library-section').style.display = 'none';
}

// Búsqueda de libros
if(searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentSearchQuery = searchQueryInput.value.trim();
        currentSearchAuthor = searchAuthorInput.value.trim();
        currentSearchPage = 1;
        searchBooksAndDisplay();
    });
}

async function searchBooksAndDisplay() {
    if(!currentSearchQuery) return;
    showSpinner(true);
    try {
        const res = await fetch(`${API_URL}/api/books?q=${encodeURIComponent(currentSearchQuery)}&author=${encodeURIComponent(currentSearchAuthor)}&page=${currentSearchPage}`);
        const data = await res.json();
        showSpinner(false);
        displaySearchResults(data.books, data.total);
    } catch (err) {
        showSpinner(false);
        showToast("Error de conexión al buscar libros.");
    }
}

// Paginación
function displayPagination(total) {
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(total/10);
    if(totalPages <= 1) return;

    for(let i=1; i<=totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.style.marginRight='5px';
        btn.style.padding='5px';
        if(i===currentSearchPage) {
            btn.style.fontWeight = 'bold';
            btn.style.background='#ccc';
        }
        btn.addEventListener('click', ()=> {
            currentSearchPage = i;
            searchBooksAndDisplay();
        });
        paginationControls.appendChild(btn);
    }
}

// Mostrar resultados de búsqueda
function displaySearchResults(books, total) {
    searchResults.innerHTML = '';
    if (books.length === 0) {
        searchResults.innerHTML = '<p>No se encontraron resultados.</p>';
        paginationControls.innerHTML = '';
        return;
    }
    books.forEach(book => {
        const card = createBookCard(book, false);
        searchResults.appendChild(card);
    });
    displayPagination(total);
}


// Crear tarjeta de libro
function createBookCard(book, inShelf = true) {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
        <img src="${book.thumbnail}" alt="Portada"/>
        <h3>${book.title}</h3>
        <p>${book.authors}</p>
        ${book.pages ? `<p>Páginas: ${book.pages}</p>` : ''}
        ${book.publisher ? `<p>Editorial: ${book.publisher}</p>` : ''}
        ${book.publishedDate ? `<p>Publicado: ${book.publishedDate}</p>` : ''}
    `;

    if (!inShelf) {
        // Botón para agregar
        const btn = document.createElement('button');
        btn.textContent = 'Agregar a mi biblioteca';
        btn.addEventListener('click', () => addToShelf(book));
        card.appendChild(btn);
    } else {
        // En estantería: mostrar rating con estrellas, reseña, marcar terminado, tags, compartir
        const ratingDiv = createStarRating(book);
        card.appendChild(ratingDiv);

        // Reseña
        const reviewInput = document.createElement('textarea');
        reviewInput.placeholder = "Escribe una reseña...";
        reviewInput.value = book.review || "";
        reviewInput.addEventListener('change', () => updateReview(book.book_id, reviewInput.value));
        card.appendChild(reviewInput);

        // Tags
        const tagsInput = document.createElement('input');
        tagsInput.placeholder = "Etiquetas (separadas por coma)";
        tagsInput.value = (book.tags || []).join(", ");
        tagsInput.addEventListener('change', () => {
            const tags = tagsInput.value.split(',').map(t => t.trim()).filter(t=>t);
            updateTags(book.book_id, tags);
        });
        card.appendChild(tagsInput);

        // Marcar terminado
        if(!book.finishedDate){
            const finishBtn = document.createElement('button');
            finishBtn.textContent = "Marcar como leído";
            finishBtn.addEventListener('click', () => finishBook(book.book_id));
            card.appendChild(finishBtn);
        } else {
            const finishedP = document.createElement('p');
            finishedP.textContent = `Terminado el: ${book.finishedDate}`;
            card.appendChild(finishedP);
        }

        // Compartir
        const shareBtn = document.createElement('button');
        shareBtn.textContent = "Compartir";
        shareBtn.addEventListener('click', () => {
            const shareLink = `${window.location.origin}?bookId=${book.book_id}`;
            navigator.clipboard.writeText(shareLink);
            showToast("Enlace copiado al portapapeles");
        });
        card.appendChild(shareBtn);

        // Botón eliminar
        const delBtn = document.createElement('button');
        delBtn.textContent = "Eliminar";
        delBtn.style.background = "red";
        delBtn.style.color = "white";
        delBtn.addEventListener('click', () => removeFromShelf(book.book_id));
        card.appendChild(delBtn);
    }

    return card;
}

// Crear rating con estrellas
function createStarRating(book) {
    const ratingContainer = document.createElement('div');
    ratingContainer.style.marginTop = '10px';

    const currentRating = book.rating || 0;

    for (let i=1; i<=5; i++) {
        const star = document.createElement('span');
        star.className = 'star' + (i<=currentRating?' selected':'');
        star.textContent = '★';
        star.addEventListener('click', () => updateRating(book.book_id, i));
        star.addEventListener('mouseover', ()=>star.style.color='#f1c40f');
        star.addEventListener('mouseout', ()=>star.classList.contains('selected')?star.style.color='#f1c40f':star.style.color='#ccc');
        ratingContainer.appendChild(star);
    }

    return ratingContainer;
}

// Agregar libro a la estantería
async function addToShelf(book) {
    if(!token) {
        showToast("Debes iniciar sesión.");
        return;
    }
    showSpinner(true);
    const res = await fetch(`${API_URL}/api/shelf`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ book })
    });
    showSpinner(false);
    const data = await res.json();
    if (data.error) {
        showToast(data.error);
    } else {
        showToast(data.message);
        loadMyShelf();
        loadStats();
        loadRecommendations();
    }
}

// Cargar estantería
async function loadMyShelf(category='') {
    if(!token) return;
    showSpinner(true);
    const url = `${API_URL}/api/shelf${category?`?category=${encodeURIComponent(category)}`:''}`;
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    showSpinner(false);
    const books = await res.json();
    displayMyShelf(books);
}

// Mostrar estantería
function displayMyShelf(books) {
    myShelf.innerHTML = '';
    if (books.length === 0) {
        myShelf.innerHTML = '<p>No hay libros en tu biblioteca.</p>';
        return;
    }
    books.forEach(book => {
        const card = createBookCard(book, true);
        myShelf.appendChild(card);
    });
}

// Actualizar calificación
async function updateRating(bookId, rating) {
    if(!token) {
        showToast("Debes iniciar sesión.");
        return;
    }
    const res = await fetch(`${API_URL}/api/shelf/rate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId, rating })
    });
    const data = await res.json();
    if (data.error) {
        showToast(data.error);
    } else {
        showToast(data.message);
        loadMyShelf(filterCategoryInput.value.trim());
    }
}

// Actualizar reseña
async function updateReview(bookId, review) {
    if(!token) return;
    const res = await fetch(`${API_URL}/api/shelf/review`, {
        method: 'POST',
        headers: {'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({bookId, review})
    });
    const data = await res.json();
    if(data.error) showToast(data.error);
    else showToast(data.message);
}

// Actualizar tags
async function updateTags(bookId, tags) {
    if(!token) return;
    const res = await fetch(`${API_URL}/api/shelf/tags`, {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({bookId, tags})
    });
    const data = await res.json();
    if(data.error) showToast(data.error);
    else showToast(data.message);
}

// Marcar terminado
async function finishBook(bookId) {
    if(!token) return;
    const res = await fetch(`${API_URL}/api/shelf/finish`, {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({bookId})
    });
    const data = await res.json();
    if(data.error) showToast(data.error);
    else {
        showToast(data.message);
        loadMyShelf(filterCategoryInput.value.trim());
        loadStats();
    }
}

// Eliminar libro
async function removeFromShelf(bookId) {
    if(!token) {
        showToast("Debes iniciar sesión.");
        return;
    }
    const res = await fetch(`${API_URL}/api/shelf/${bookId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await res.json();
    if(data.error) {
        showToast(data.error);
    } else {
        showToast(data.message);
        loadMyShelf(filterCategoryInput.value.trim());
        loadStats();
        loadRecommendations();
    }
}

// Estadísticas
async function loadStats() {
    if(!token) return;
    const res = await fetch(`${API_URL}/api/stats`, {
        headers:{'Authorization':`Bearer ${token}`}
    });
    const data = await res.json();
    statsDiv.innerHTML = `
        <p>Libros leídos: ${data.totalBooksRead}</p>
        <p>Páginas leídas: ${data.totalPages}</p>
    `;
}

// Recomendaciones
async function loadRecommendations() {
    if(!token) return;
    const res = await fetch(`${API_URL}/api/recommendations`, {
        headers:{'Authorization':`Bearer ${token}`}
    });
    const data = await res.json();
    recommendationsDiv.innerHTML = '';
    if(data.length === 0) {
        recommendationsDiv.innerHTML = '<p>No hay recomendaciones disponibles.</p>';
        return;
    }
    data.forEach(book => {
        const card = createBookCard(book, false);
        recommendationsDiv.appendChild(card);
    });
}

// Filtro por categoría
applyFilterBtn.addEventListener('click', () => {
    loadMyShelf(filterCategoryInput.value.trim());
});
