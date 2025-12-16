let tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let isDarkTheme = localStorage.getItem('theme') === 'dark';
let isAdmin = false;

// НАСТРОЙКИ
const MANAGER_USERNAME = "твой_username"; // ЗАМЕНИ!

// ПРОВЕРКА АДМИНА
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('admin') === 'true') {
    isAdmin = true;
}

if (tg.initDataUnsafe?.user?.id) {
    const ADMIN_ID = 123456789; // ЗАМЕНИ НА СВОЙ ID!
    if (tg.initDataUnsafe.user.id === ADMIN_ID) {
        isAdmin = true;
    }
}

console.log('🔧 Admin mode:', isAdmin);

// ТОВАРЫ
let allProducts = JSON.parse(localStorage.getItem('products')) || [
    {
        id: 1,
        name: "Угловой диван 'Комфорт'",
        description: "Современный диван с механизмом трансформации. Обивка из качественной экокожи. Идеально подойдет для гостиной. Механизм раскладки - еврокнижка, ортопедический матрас в комплекте.",
        price: 45000,
        oldPrice: 60000,
        photos: [
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
            "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800",
            "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800"
        ],
        category: "Мебель"
    },
    {
        id: 2,
        name: "Кресло 'Лофт'",
        description: "Стильное кресло в стиле лофт. Прочный каркас, удобное сиденье.",
        price: 15000,
        photos: ["https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800"],
        category: "Мебель"
    },
    {
        id: 3,
        name: "Журнальный столик",
        description: "Элегантный столик из натурального дерева с металлическими ножками.",
        price: 8500,
        oldPrice: 12000,
        photos: ["https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=800"],
        category: "Мебель"
    }
];

let currentCategory = 'all';
let currentPage = 'main';
let currentProduct = null;
let currentPhotoIndex = 0;

// СОХРАНЕНИЕ
function saveProducts() {
    localStorage.setItem('products', JSON.stringify(allProducts));
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function updateCartCount() {
    const countEl = document.getElementById('cartCount');
    if (countEl) {
        countEl.textContent = cart.length;
    }
}

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', function() {
    if (isAdmin) {
        document.body.classList.add('admin-mode');
        showNotification('🔧 Режим администратора');
        addAdminButtons();
    }
    
    if (isDarkTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    loadProducts();
    setupEventListeners();
    updateCartCount();
});

function addAdminButtons() {
    const header = document.querySelector('.header');
    const adminPanel = document.createElement('div');
    adminPanel.className = 'admin-panel';
    adminPanel.innerHTML = `
        <button class="admin-add-btn" onclick="showAddProductModal()">➕ Добавить товар</button>
    `;
    header.appendChild(adminPanel);
}

function setupEventListeners() {
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

// НАВИГАЦИЯ
function showPage(page) {
    currentPage = page;
    
    const mainPage = document.getElementById('mainPage');
    const productPage = document.getElementById('productPage');
    const cartPage = document.getElementById('cartPage');
    const favoritesPage = document.getElementById('favoritesPage');
    
    mainPage.classList.remove('active');
    productPage.classList.remove('active');
    cartPage.classList.remove('active');
    favoritesPage.classList.remove('active');
    
    if (page === 'main') {
        mainPage.classList.add('active');
    } else if (page === 'product') {
        productPage.classList.add('active');
    } else if (page === 'cart') {
        cartPage.classList.add('active');
        renderCart();
    } else if (page === 'favorites') {
        favoritesPage.classList.add('active');
        renderFavorites();
    }
    
    window.scrollTo(0, 0);
}

// ГЛАВНАЯ СТРАНИЦА
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
    
    const discount = product.oldPrice 
        ? Math.round((1 - product.price / product.oldPrice) * 100)
        : 0;
    
    if (discount > 0) {
        card.classList.add('discount');
    }
    
    card.onclick = () => openProduct(product.id);
    
    const isFavorite = favorites.includes(product.id);
    const mainPhoto = product.photos?.[0] || product.photo || 'https://via.placeholder.com/400';
    
    card.innerHTML = `
        <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                onclick="event.stopPropagation(); toggleFavorite(${product.id})">
        </button>
        ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
        ${isAdmin ? `
            <button class="admin-delete-btn" onclick="event.stopPropagation(); deleteProduct(${product.id})" title="Удалить">🗑</button>
        ` : ''}
        <img src="${mainPhoto}" class="product-image" 
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

// СТРАНИЦА ТОВАРА
function openProduct(productId) {
    currentProduct = allProducts.find(p => p.id === productId);
    if (!currentProduct) return;
    
    currentPhotoIndex = 0;
    
    const productPage = document.getElementById('productPage');
    const photos = currentProduct.photos || [currentProduct.photo] || ['https://via.placeholder.com/800'];
    
    const discount = currentProduct.oldPrice 
        ? Math.round((1 - currentProduct.price / currentProduct.oldPrice) * 100)
        : 0;
    
    const isFavorite = favorites.includes(currentProduct.id);
    const inCart = cart.some(item => item.id === currentProduct.id);
    
    // Проверяем длину описания
    const shortDesc = currentProduct.description.substring(0, 150);
    const needsExpand = currentProduct.description.length > 150;
    
    productPage.innerHTML = `
        <button class="back-btn" onclick="showPage('main')">←</button>
        
        <div class="product-gallery">
            <div class="gallery-container" id="galleryContainer">
                ${photos.map((photo, index) => `
                    <div class="gallery-slide">
                        <img src="${photo}" onerror="this.src='https://via.placeholder.com/800'">
                    </div>
                `).join('')}
            </div>
            
            ${photos.length > 1 ? `
                <button class="gallery-arrow prev" onclick="prevPhoto()">‹</button>
                <button class="gallery-arrow next" onclick="nextPhoto()">›</button>
                
                <div class="gallery-dots">
                    ${photos.map((_, index) => `
                        <div class="gallery-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
        
        <div class="product-details">
            <h1 class="product-title">${currentProduct.name}</h1>
            
            <div class="product-description ${needsExpand ? '' : 'expanded'}" id="productDesc">
                ${needsExpand ? shortDesc + '...' : currentProduct.description}
            </div>
            
            ${needsExpand ? `
                <button class="expand-btn" onclick="toggleDescription()">
                    <span id="expandText">Показать полное описание</span> ▼
                </button>
            ` : ''}
            
            <div class="product-price-section">
                ${currentProduct.oldPrice ? `
                    <span class="product-old-price-large">${formatPrice(currentProduct.oldPrice)}</span>
                    ${isAdmin ? `<button class="edit-price-btn" onclick="editPrice(${currentProduct.id}, 'old')">✏️</button>` : ''}
                    <span style="color: #FF3B3B; font-weight: 700;">🔥 Скидка ${discount}%!</span><br>
                ` : ''}
                <span class="product-price-large">${formatPrice(currentProduct.price)}</span>
                ${isAdmin ? `<button class="edit-price-btn" onclick="editPrice(${currentProduct.id}, 'current')">✏️</button>` : ''}
            </div>
            
            <div class="product-actions">
                <button class="btn btn-primary ${inCart ? 'in-cart' : ''}" 
                        id="addToCartBtn"
                        onclick="addToCart(${currentProduct.id})">
                    ${inCart ? '✅ В корзине' : '🛒 В корзину'}
                </button>
                <button class="btn btn-secondary" onclick="toggleFavorite(${currentProduct.id}); updateProductButtons();">
                    ${isFavorite ? '★ В избранном' : '☆ В избранное'}
                </button>
            </div>
        </div>
    `;
    
    showPage('product');
    setupSwipe();
}

// ГАЛЕРЕЯ - СВАЙП
let touchStartX = 0;
let touchEndX = 0;

function setupSwipe() {
    const gallery = document.querySelector('.product-gallery');
    if (!gallery) return;
    
    gallery.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});
    
    gallery.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});
}

function handleSwipe() {
    if (touchEndX < touchStartX - 50) nextPhoto();
    if (touchEndX > touchStartX + 50) prevPhoto();
}

function nextPhoto() {
    const photos = currentProduct.photos || [currentProduct.photo];
    if (currentPhotoIndex < photos.length - 1) {
        currentPhotoIndex++;
        updateGallery();
    }
}

function prevPhoto() {
    if (currentPhotoIndex > 0) {
        currentPhotoIndex--;
        updateGallery();
    }
}

function updateGallery() {
    const container = document.getElementById('galleryContainer');
    const dots = document.querySelectorAll('.gallery-dot');
    
    if (container) {
        container.style.transform = `translateX(-${currentPhotoIndex * 100}%)`;
    }
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentPhotoIndex);
    });
}

function toggleDescription() {
    const desc = document.getElementById('productDesc');
    const text = document.getElementById('expandText');
    
    if (desc.classList.contains('expanded')) {
        desc.classList.remove('expanded');
        desc.textContent = currentProduct.description.substring(0, 150) + '...';
        text.textContent = 'Показать полное описание';
    } else {
        desc.classList.add('expanded');
        desc.textContent = currentProduct.description;
        text.textContent = 'Скрыть описание';
    }
}

function updateProductButtons() {
    const isFavorite = favorites.includes(currentProduct.id);
    const btn = event.target;
    btn.textContent = isFavorite ? '★ В избранном' : '☆ В избранное';
}

// КОРЗИНА
function openCart() {
    showPage('cart');
}

function renderCart() {
    const cartPage = document.getElementById('cartPage');
    
    if (cart.length === 0) {
        cartPage.innerHTML = `
            <button class="back-btn" onclick="showPage('main')">←</button>
            <div class="product-details" style="text-align: center; padding-top: 100px;">
                <h1 class="product-title">🛒 Корзина пуста</h1>
                <p style="color: var(--text-gray); margin-top: 16px;">Добавьте товары из каталога</p>
                <button class="btn btn-primary" style="margin-top: 24px; max-width: 300px;" onclick="showPage('main')">
                    🛍 В каталог
                </button>
            </div>
        `;
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    
    cartPage.innerHTML = `
        <button class="back-btn" onclick="showPage('main')">←</button>
        
        <div class="product-details">
            <h1 class="product-title">🛒 Корзина (${cart.length})</h1>
            
            <div class="cart-items">
                ${cart.map(item => `
                    <div class="cart-item" style="
                        background: var(--bg-card);
                        border-radius: 16px;
                        padding: 16px;
                        margin-bottom: 16px;
                        box-shadow: var(--shadow);
                        display: flex;
                        gap: 16px;
                    ">
                        <img src="${item.photos?.[0] || item.photo || 'https://via.placeholder.com/100'}" 
                             style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover;">
                        
                        <div style="flex: 1;">
                            <div style="font-weight: 600; margin-bottom: 8px;">${item.name}</div>
                            <div style="font-size: 18px; font-weight: 700; color: #FF3B3B;">
                                ${formatPrice(item.price)}
                            </div>
                        </div>
                        
                        <button onclick="removeFromCart(${item.id})" style="
                            background: rgba(255, 59, 59, 0.1);
                            border: none;
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            color: #FF3B3B;
                            font-size: 20px;
                            cursor: pointer;
                        ">🗑</button>
                    </div>
                `).join('')}
            </div>
            
            <div style="
                background: var(--bg-cream);
                padding: 20px;
                border-radius: 16px;
                margin: 24px 0;
            ">
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 700;">
                    <span>Итого:</span>
                    <span style="
                        background: linear-gradient(135deg, #FF6B35 0%, #FF3B3B 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        font-size: 24px;
                    ">${formatPrice(total)}</span>
                </div>
            </div>
            
            <button class="btn btn-primary" onclick="contactManager()" style="width: 100%; padding: 18px;">
                📞 Связаться с менеджером
            </button>
        </div>
    `;
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart();
    showNotification('🗑 Товар удален из корзины');
}

// ИЗБРАННОЕ
function showFavorites() {
    showPage('favorites');
}

function renderFavorites() {
    const favPage = document.getElementById('favoritesPage');
    const favoriteProducts = allProducts.filter(p => favorites.includes(p.id));
    
    if (favoriteProducts.length === 0) {
        favPage.innerHTML = `
            <button class="back-btn" onclick="showPage('main')">←</button>
            <div class="product-details" style="text-align: center; padding-top: 100px;">
                <h1 class="product-title">⭐ Избранное пусто</h1>
                <p style="color: var(--text-gray); margin-top: 16px;">Добавляйте товары в избранное, нажимая ★</p>
                <button class="btn btn-primary" style="margin-top: 24px; max-width: 300px;" onclick="showPage('main')">
                    🛍 В каталог
                </button>
            </div>
        `;
        return;
    }
    
    favPage.innerHTML = `
        <button class="back-btn" onclick="showPage('main')">←</button>
        
        <div class="product-details">
            <h1 class="product-title">⭐ Избранное (${favoriteProducts.length})</h1>
            
            <div class="products-grid" style="padding: 0; margin-top: 24px;">
                ${favoriteProducts.map(product => {
                    const card = createProductCard(product);
                    return card.outerHTML;
                }).join('')}
            </div>
        </div>
    `;
    
    // Переинициализируем события на карточках
    favPage.querySelectorAll('.product-card').forEach((card, index) => {
        const product = favoriteProducts[index];
        card.onclick = () => openProduct(product.id);
        
        const favBtn = card.querySelector('.favorite-btn');
        if (favBtn) {
            favBtn.onclick = (e) => {
                e.stopPropagation();
                toggleFavorite(product.id);
                renderFavorites();
            };
        }
    });
}

// СВЯЗЬ С МЕНЕДЖЕРОМ
function contactManager() {
    const url = `https://t.me/${MANAGER_USERNAME}`;
    
    if (tg.openTelegramLink) {
        tg.openTelegramLink(url);
    } else if (tg.openLink) {
        tg.openLink(url);
    } else {
        window.open(url, '_blank');
    }
}

// ДЕЙСТВИЯ С ТОВАРАМИ
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    
    if (cart.some(item => item.id === productId)) {
        showNotification('⚠️ Товар уже в корзине');
        return;
    }
    
    cart.push(product);
    saveCart();
    
    const btn = document.getElementById('addToCartBtn');
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
    saveFavorites();
    loadProducts();
}

// РЕДАКТИРОВАНИЕ ЦЕНЫ
function editPrice(productId, priceType) {
    const product = allProducts.find(p => p.id === productId);
    const currentPrice = priceType === 'old' ? product.oldPrice : product.price;
    
    const newPrice = prompt(
        `Введите новую ${priceType === 'old' ? 'старую цену' : 'цену'}:`,
        currentPrice || ''
    );
    
    if (newPrice === null) return;
    
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
        showNotification('❌ Неверная цена');
        return;
    }
    
    if (priceType === 'old') {
        product.oldPrice = price > 0 ? price : null;
    } else {
        product.price = price;
    }
    
    saveProducts();
    openProduct(productId);
    showNotification('✅ Цена обновлена');
    
    sendToBot({
        action: 'update_product',
        product_id: productId,
        price: product.price,
        old_price: product.oldPrice
    });
}

// ДОБАВЛЕНИЕ ТОВАРА
function showAddProductModal() {
    const modal = document.getElementById('addProductModal');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <h2 class="modal-title">➕ Добавить товар</h2>
        
        <div class="form-group">
            <label>Название</label>
            <input type="text" id="newProductName" placeholder="Диван угловой">
        </div>
        
        <div class="form-group">
            <label>Описание</label>
            <textarea id="newProductDesc" placeholder="Полное описание товара..." rows="4"></textarea>
        </div>
        
        <div class="form-group">
            <label>Цена (₽)</label>
            <input type="number" id="newProductPrice" placeholder="25000">
        </div>
        
        <div class="form-group">
            <label>Старая цена (₽, необязательно)</label>
            <input type="number" id="newProductOldPrice" placeholder="30000">
        </div>
        
        <div class="form-group">
            <label>Ссылки на фото (по одной на строку, до 10 шт)</label>
            <textarea id="newProductPhotos" placeholder="https://example.com/photo1.jpg
https://example.com/photo2.jpg" rows="5"></textarea>
        </div>
        
        <div class="form-group">
            <label>Категория</label>
            <input type="text" id="newProductCategory" value="Мебель">
        </div>
        
        <div class="product-actions">
            <button class="btn btn-primary" onclick="saveNewProduct()">✅ Добавить</button>
            <button class="btn btn-secondary" onclick="closeModal()">❌ Отмена</button>
        </div>
    `;
    
    modal.classList.add('show');
}

function saveNewProduct() {
    const name = document.getElementById('newProductName').value.trim();
    const description = document.getElementById('newProductDesc').value.trim();
    const price = parseFloat(document.getElementById('newProductPrice').value);
    const oldPrice = parseFloat(document.getElementById('newProductOldPrice').value) || null;
    const photosText = document.getElementById('newProductPhotos').value.trim();
    const category = document.getElementById('newProductCategory').value.trim() || 'Мебель';
    
    if (!name || !price) {
        showNotification('❌ Заполните название и цену');
        return;
    }
    
    const photos = photosText
        .split('\n')
        .map(url => url.trim())
        .filter(url => url)
        .slice(0, 10);
    
    if (photos.length === 0) {
        photos.push('https://via.placeholder.com/800?text=Фото');
    }
    
    const newProduct = {
        id: Date.now(),
        name,
        description,
        price,
        oldPrice,
        photos,
        category
    };
    
    allProducts.push(newProduct);
    saveProducts();
    closeModal();
    loadProducts();
    showNotification(`✅ Товар "${name}" добавлен!`);
    
    sendToBot({
        action: 'add_product',
        name,
        description,
        price,
        old_price: oldPrice,
        photo: photos[0],
        category
    });
}

function deleteProduct(productId) {
    if (!confirm('Удалить этот товар?')) return;
    
    allProducts = allProducts.filter(p => p.id !== productId);
    saveProducts();
    loadProducts();
    showNotification('🗑 Товар удален');
    
    sendToBot({
        action: 'delete_product',
        product_id: productId
    });
}

function closeModal() {
    document.getElementById('addProductModal').classList.remove('show');
}

// КАТЕГОРИИ И ПОИСК
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

// ОТПРАВКА В БОТ
function sendToBot(data) {
    if (tg.sendData) {
        try {
            tg.sendData(JSON.stringify(data));
        } catch (e) {
            console.error('Ошибка:', e);
        }
    }
}

// УТИЛИТЫ
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + '₽';
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}
