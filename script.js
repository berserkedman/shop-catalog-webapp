let tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let cart = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let isDarkTheme = localStorage.getItem('theme') === 'dark';
let isAdmin = false;

// НАСТРОЙКИ
const MANAGER_USERNAME = "твой_username"; // ЗАМЕНИ!
const INFO_URL = "https://telegra.ph/";

// ДЕМО ТОВАРЫ
let allProducts = [
    {
        id: 1,
        name: "Угловой диван 'Комфорт'",
        description: "Современный диван с механизмом трансформации",
        price: 45000,
        oldPrice: 60000,
        photo: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
        category: "Мебель"
    },
    {
        id: 2,
        name: "Кресло 'Лофт'",
        description: "Стильное кресло в стиле лофт",
        price: 15000,
        photo: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400",
        category: "Мебель"
    },
    {
        id: 3,
        name: "Журнальный столик",
        description: "Элегантный столик из дерева",
        price: 8500,
        oldPrice: 12000,
        photo: "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=400",
        category: "Мебель"
    }
];

let currentCategory = 'all';

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем админа
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        // Здесь можно проверить ID админа
        isAdmin = false; // Установи true для тестирования
    }
    
    if (isAdmin) {
        document.body.classList.add('admin-mode');
    }
    
    // Применяем тему
    if (isDarkTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    loadProducts();
    setupEventListeners();
});

function setupEventListeners() {
    // Кнопка связи
    const contactBtn = document.getElementById('contactBtn');
    if (contactBtn) {
        contactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            tg.openTelegramLink(`https://t.me/${MANAGER_USERNAME}`);
        });
    }
    
    // Переключатель темы
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        updateThemeIcon();
    }
}

function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    
    if (isDarkTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = isDarkTheme ? '☀️' : '🌙';
    }
}

function loadProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    let filtered = currentCategory === 'all' 
        ? allProducts 
        : allProducts.filter(p => p.category === currentCategory);
    
    filtered.forEach(product => {
        const card = createProductCard(product);
        grid.appendChild(card);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => openProductModal(product);
    
    const discount = product.oldPrice 
        ? Math.round((1 - product.price / product.oldPrice) * 100)
        : 0;
    
    const isFavorite = favorites.includes(product.id);
    
    card.innerHTML = `
        <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                onclick="event.stopPropagation(); toggleFavorite(${product.id})">
        </button>
        ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
        ${isAdmin ? `<button class="admin-btn" onclick="event.stopPropagation(); editProduct(${product.id})">✏️</button>` : ''}
        <img src="${product.photo}" class="product-image" 
             onerror="this.src='https://via.placeholder.com/400?text=Фото'">
        <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div>
                ${product.oldPrice ? `<span class="product-old-price">${formatPrice(product.oldPrice)}</span>` : ''}
                <div class="product-price">${formatPrice(product.price)}</div>
            </div>
        </div>
    `;
    
    return card;
}

function openProductModal(product) {
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    
    const discount = product.oldPrice 
        ? Math.round((1 - product.price / product.oldPrice) * 100)
        : 0;
    
    const isFavorite = favorites.includes(product.id);
    const inCart = cart.some(item => item.id === product.id);
    
    modalBody.innerHTML = `
        <img src="${product.photo}" class="modal-image" 
             onerror="this.src='https://via.placeholder.com/500x300?text=Фото'">
        <div class="modal-body">
            <h2 class="modal-title">${product.name}</h2>
            <p class="modal-description">${product.description}</p>
            
            <div class="modal-price-section">
                ${product.oldPrice ? `
                    <span class="modal-old-price">${formatPrice(product.oldPrice)}</span>
                    <span style="color: var(--accent); font-weight: 700;">Скидка ${discount}%!</span><br>
                ` : ''}
                <span class="modal-price">${formatPrice(product.price)}</span>
            </div>
            
            <div class="modal-buttons">
                <button class="btn btn-primary ${inCart ? 'in-cart' : ''}" 
                        id="addToCartBtn${product.id}"
                        onclick="addToCart(${product.id})">
                    ${inCart ? '✅ В корзине' : '🛒 В корзину'}
                </button>
                <button class="btn btn-secondary" onclick="toggleFavorite(${product.id}); updateModalButtons(${product.id});">
                    ${isFavorite ? '★ В избранном' : '☆ В избранное'}
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    
    const alreadyInCart = cart.some(item => item.id === productId);
    
    if (alreadyInCart) {
        showNotification('⚠️ Товар уже в корзине');
        return;
    }
    
    cart.push(product);
    document.getElementById('cartCount').textContent = cart.length;
    
    const btn = document.getElementById(`addToCartBtn${productId}`);
    if (btn) {
        btn.classList.add('in-cart');
        btn.textContent = '✅ В корзине';
    }
    
    showNotification(`✅ ${product.name} добавлен!`);
}

function toggleFavorite(productId) {
    const index = favorites.indexOf(productId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(productId);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    loadProducts();
}

function updateModalButtons(productId) {
    const isFavorite = favorites.includes(productId);
    const btn = event.target;
    btn.textContent = isFavorite ? '★ В избранном' : '☆ В избранное';
}

function showCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    loadProducts();
}

function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
    
    filtered.forEach(product => {
        grid.appendChild(createProductCard(product));
    });
}

function openCart() {
    if (cart.length === 0) {
        showNotification('Корзина пуста');
        return;
    }
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    tg.sendData(JSON.stringify({items: cart, total: total}));
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + '₽';
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 400);
    }, 3000);
}

window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target == modal) closeModal();
}

// ADMIN ФУНКЦИИ
function editProduct(productId) {
    // TODO: Открыть форму редактирования
    showNotification('Функция в разработке');
}
