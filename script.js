let tg = window.Telegram.WebApp;
tg.expand();

let cart = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// НАСТРОЙКИ МАГАЗИНА (потом будут из бота)
const MANAGER_USERNAME = "твой_username"; // ЗАМЕНИ на свой username
const INFO_URL = "https://telegra.ph/"; // ЗАМЕНИ на ссылку Telegraph статьи

const demoProducts = [
    {
        id: 1,
        name: "Угловой диван 'Комфорт'",
        description: "Современный диван с механизмом трансформации. Обивка из качественной экокожи. Идеально подойдет для гостиной.",
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
    }
];

let currentCategory = 'all';

// КНОПКА СВЯЗИ
document.getElementById('contactBtn').addEventListener('click', function(e) {
    e.preventDefault();
    tg.openTelegramLink(`https://t.me/${MANAGER_USERNAME}`);
});

// КНОПКА ИНФО
document.getElementById('infoBtn').addEventListener('click', function(e) {
    e.preventDefault();
    tg.openLink(INFO_URL);
});

function loadProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    let filtered = currentCategory === 'all' 
        ? demoProducts 
        : demoProducts.filter(p => p.category === currentCategory);
    
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
            ${isFavorite ? '⭐' : '☆'}
        </button>
        ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
        <img src="${product.photo}" class="product-image" 
             onerror="this.src='https://via.placeholder.com/400?text=Фото'">
        <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div>
                ${product.oldPrice ? `<span class="product-old-price">${product.oldPrice}₽</span>` : ''}
                <div class="product-price">${product.price}₽</div>
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
    
    modalBody.innerHTML = `
        <img src="${product.photo}" class="modal-image" 
             onerror="this.src='https://via.placeholder.com/500x300?text=Фото'">
        <div class="modal-body">
            <h2 class="modal-title">${product.name}</h2>
            <p class="modal-description">${product.description}</p>
            
            <div class="modal-price-section">
                ${product.oldPrice ? `
                    <span class="modal-old-price">${product.oldPrice}₽</span>
                    <span style="color: #ff4757; font-weight: bold;">Скидка ${discount}%!</span><br>
                ` : ''}
                <span class="modal-price">${product.price}₽</span>
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
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function addToCart(productId) {
    const product = demoProducts.find(p => p.id === productId);
    cart.push(product);
    document.getElementById('cartCount').textContent = cart.length;
    tg.showAlert(`✅ ${product.name} добавлен в корзину!`);
    closeModal();
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
    
    const filtered = demoProducts.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
    
    filtered.forEach(product => {
        grid.appendChild(createProductCard(product));
    });
}

function openCart() {
    if (cart.length === 0) {
        tg.showAlert('Корзина пуста');
        return;
    }
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    tg.sendData(JSON.stringify({items: cart, total: total}));
}

window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target == modal) closeModal();
}

loadProducts();
