let tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let cart = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let isDarkTheme = localStorage.getItem('theme') === 'dark';
let isAdmin = false;

// Проверяем админа (через start_param или initData)
if (tg.initDataUnsafe?.user?.id) {
    const ADMIN_ID = 8379534280; // ЗАМЕНИ НА СВОЙ ID!
    isAdmin = tg.initDataUnsafe.user.id === ADMIN_ID;
}

// ТОВАРЫ из localStorage или демо
let allProducts = JSON.parse(localStorage.getItem('products')) || [
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

// СОХРАНЕНИЕ ТОВАРОВ
function saveProducts() {
    localStorage.setItem('products', JSON.stringify(allProducts));
}

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', function() {
    if (isAdmin) {
        document.body.classList.add('admin-mode');
        showNotification('🔧 Режим администратора активирован');
    }
    
    if (isDarkTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    loadProducts();
    setupEventListeners();
    
    // Добавляем кнопку "Добавить товар" для админа
    if (isAdmin) {
        addAdminButtons();
    }
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
    
    card.onclick = () => openProductModal(product);
    
    const isFavorite = favorites.includes(product.id);
    
    card.innerHTML = `
        <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                onclick="event.stopPropagation(); toggleFavorite(${product.id})">
        </button>
        ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
        ${isAdmin ? `
            <button class="admin-delete-btn" onclick="event.stopPropagation(); deleteProduct(${product.id})" title="Удалить">🗑</button>
        ` : ''}
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
                    ${isAdmin ? `<button class="edit-price-btn" onclick="editPrice(${product.id}, 'old')" title="Изменить старую цену">✏️</button>` : ''}
                    <span style="color: #FF3B3B; font-weight: 700;">🔥 Скидка ${discount}%!</span><br>
                ` : ''}
                <span class="modal-price">${formatPrice(product.price)}</span>
                ${isAdmin ? `<button class="edit-price-btn" onclick="editPrice(${product.id}, 'current')" title="Изменить цену">✏️</button>` : ''}
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
    closeModal();
    loadProducts();
    showNotification('✅ Цена обновлена');
    
    // Отправляем в бот
    sendToBot({
        action: 'update_product',
        product_id: productId,
        price: product.price,
        old_price: product.oldPrice
    });
}

// ДОБАВЛЕНИЕ ТОВАРА
function showAddProductModal() {
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div class="modal-body">
            <h2 class="modal-title">➕ Добавить товар</h2>
            
            <div class="form-group">
                <label>Название товара</label>
                <input type="text" id="newProductName" placeholder="Например: Диван угловой">
            </div>
            
            <div class="form-group">
                <label>Описание</label>
                <textarea id="newProductDesc" placeholder="Описание товара..." rows="3"></textarea>
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
                <label>Ссылка на фото</label>
                <input type="text" id="newProductPhoto" placeholder="https://example.com/photo.jpg">
            </div>
            
            <div class="form-group">
                <label>Категория</label>
                <input type="text" id="newProductCategory" placeholder="Мебель" value="Мебель">
            </div>
            
            <div class="modal-buttons">
                <button class="btn btn-primary" onclick="saveNewProduct()">✅ Добавить</button>
                <button class="btn btn-secondary" onclick="closeModal()">❌ Отмена</button>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function saveNewProduct() {
    const name = document.getElementById('newProductName').value.trim();
    const description = document.getElementById('newProductDesc').value.trim();
    const price = parseFloat(document.getElementById('newProductPrice').value);
    const oldPrice = parseFloat(document.getElementById('newProductOldPrice').value) || null;
    const photo = document.getElementById('newProductPhoto').value.trim();
    const category = document.getElementById('newProductCategory').value.trim() || 'Мебель';
    
    if (!name || !price) {
        showNotification('❌ Заполните название и цену');
        return;
    }
    
    const newProduct = {
        id: Date.now(),
        name: name,
        description: description,
        price: price,
        oldPrice: oldPrice,
        photo: photo || 'https://via.placeholder.com/400?text=Фото',
        category: category
    };
    
    allProducts.push(newProduct);
    saveProducts();
    closeModal();
    loadProducts();
    showNotification(`✅ Товар "${name}" добавлен!`);
    
    // Отправляем в бот
    sendToBot({
        action: 'add_product',
        ...newProduct
    });
}

// УДАЛЕНИЕ ТОВАРА
function deleteProduct(productId) {
    if (!confirm('Удалить этот товар?')) return;
    
    allProducts = allProducts.filter(p => p.id !== productId);
    saveProducts();
    loadProducts();
    showNotification('🗑 Товар удален');
    
    // Отправляем в бот
    sendToBot({
        action: 'delete_product',
        product_id: productId
    });
}

// ОТПРАВКА ДАННЫХ В БОТ
function sendToBot(data) {
    if (tg.sendData) {
        try {
            tg.sendData(JSON.stringify(data));
        } catch (e) {
            console.error('Ошибка отправки в бот:', e);
        }
    }
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
    
    if (cart.some(item => item.id === productId)) {
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
        showNotification('🛒 Корзина пуста');
        return;
    }
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    
    sendToBot({
        action: 'order',
        items: cart,
        total: total
    });
}

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

window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target == modal) closeModal();
}
