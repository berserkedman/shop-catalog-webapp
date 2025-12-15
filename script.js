// Telegram Web App API
let tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Корзина и избранное
let cart = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// ДЕМО-ТОВАРЫ (для портфолио)
// Позже это будет загружаться из бота через API
const demoProducts = [
    {
        id: 1,
        name: "Угловой диван 'Комфорт'",
        description: "Современный угловой диван с механизмом трансформации. Обивка из качественной экокожи. Идеально подойдет для гостиной.",
        price: 45000,
        oldPrice: 60000,
        photo: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
        category: "Мебель"
    },
    {
        id: 2,
        name: "Кресло 'Лофт'",
        description: "Стильное кресло в стиле лофт. Прочный каркас, удобное сиденье.",
        price: 15000,
        oldPrice: null,
        photo: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400",
        category: "Мебель"
    },
    {
        id: 3,
        name: "Журнальный столик",
        description: "Элегантный столик из натурального дерева с металлическими ножками.",
        price: 8500,
        oldPrice: 12000,
        photo: "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=400",
        category: "Мебель"
    },
    {
        id: 4,
        name: "Настольная лампа",
        description: "Современная лампа с регулировкой яркости. Подходит для рабочего стола.",
        price: 3500,
        oldPrice: null,
        photo: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400",
        category: "Декор"
    },
    {
        id: 5,
        name: "Книжный шкаф 'Модерн'",
        description: "Вместительный шкаф для книг и декора. 5 полок, прочная конструкция.",
        price: 22000,
        oldPrice: 28000,
        photo: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400",
        category: "Мебель"
    },
    {
        id: 6,
        name: "Декоративная ваза",
        description: "Керамическая ваза ручной работы. Уникальный дизайн.",
        price: 2800,
        oldPrice: null,
        photo: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400",
        category: "Декор"
    }
];

let currentCategory = 'all';
let allProducts = demoProducts;

// Загрузка товаров
function loadProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    let filteredProducts = currentCategory === 'all' 
        ? allProducts 
        : allProducts.filter(p => p.category === currentCategory);
    
    filteredProducts.forEach(product => {
        const card = createProductCard(product);
        grid.appendChild(card);
    });
    
    updateFavoriteButtons();
}

// Создание карточки товара
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
            ${isFavorite ? '⭐' : '☆'}
        </button>
        ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
        <img src="${product.photo}" alt="${product.name}" class="product-image" 
             onerror="this.src='https://via.placeholder.com/400x400?text=Фото'">
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

// Открыть модальное окно товара
function openProductModal(product) {
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    
    const discount = product.oldPrice 
        ? Math.round((1 - product.price / product.oldPrice) * 100)
        : 0;
    
    const isFavorite = favorites.includes(product.id);
    
    modalBody.innerHTML = `
        <img src="${product.photo}" alt="${product.name}" class="modal-image"
             onerror="this.src='https://via.placeholder.com/500x300?text=Фото'">
        <div class="modal-body">
            <h2 class="modal-title">${product.name}</h2>
            <p class="modal-description">${product.description}</p>
            
            <div class="modal-price-section">
                ${product.oldPrice ? `
                    <span class="modal-old-price">${formatPrice(product.oldPrice)}</span>
                    <span style="color: #ff4757; font-weight: bold;">Скидка ${discount}%!</span><br>
                ` : ''}
                <span class="modal-price">${formatPrice(product.price)}</span>
            </div>
            
            <div class="modal-buttons">
                <button class="btn btn-primary" onclick="addToCart(${product.id})">
                    🛒 В корзину
                </button>
                <button class="btn btn-secondary" onclick="toggleFavorite(${product.id}); closeModal();">
                    ${isFavorite ? '⭐ В избранном' : '☆ В избранное'}
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Закрыть модальное окно
function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

// Добавить в корзину
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    cart.push(product);
    updateCartCount();
    
    tg.showAlert(`✅ ${product.name} добавлен в корзину!`);
    closeModal();
}

// Обновить счетчик корзины
function updateCartCount() {
    document.getElementById('cartCount').textContent = cart.length;
}

// Открыть корзину
function openCart() {
    if (cart.length === 0) {
        tg.showAlert('Корзина пуста');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const cartData = {
        items: cart,
        total: total
    };
    
    // Отправляем данные в бота
    tg.sendData(JSON.stringify(cartData));
}

// Избранное
function toggleFavorite(productId) {
    const index = favorites.indexOf(productId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(productId);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteButtons();
    loadProducts();
}

function updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const productId = parseInt(btn.getAttribute('onclick').match(/\d+/)[0]);
        if (favorites.includes(productId)) {
            btn.classList.add('active');
            btn.textContent = '⭐';
        } else {
            btn.classList.remove('active');
            btn.textContent = '☆';
        }
    });
}

// Фильтр по категориям
function showCategory(category) {
    currentCategory = category;
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadProducts();
}

// Поиск
function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
    
    filtered.forEach(product => {
        const card = createProductCard(product);
        grid.appendChild(card);
    });
}

// Форматирование цены
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(price);
}

// Закрытие модалки по клику вне её
window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target == modal) {
        closeModal();
    }
}

// Инициализация
loadProducts();
updateCartCount();
