// DOM Content
const container = document.querySelector('.container');
// DOM Buttons
const buyButton = document.getElementById('buy-button');
const shoppingBag = document.getElementById('shopping-bag');
// DOM Cart
const cartModal = document.querySelector('.cart');
const cartItems = document.querySelector('.items');
// DOM Values
const itemsCounter = document.getElementById('item-counter');
const subTotal = document.getElementById('subtotal');
const tax = document.getElementById('taxes');
const total = document.getElementById('total');
const itemsCounterBag = document.getElementById('count');
const clearCartDisplay = document.querySelector('.clear-items');
const clearCart = document.getElementById('clear-cart')
// Local Variables
let cartOpen = false;
let counter = 0;
let totalValue = parseInt(total.textContent);

let allProducts;

// The shopping cart had been created with the POO.
class shoppingCart {
  constructor() {
    this.total = JSON.parse(localStorage.getItem('total')) || 0;
    this.taxRate = 0.1;
    this.items = [];
  }

// First method: Obtaining the values of the products
  async fetchProducts() {
    try {
      const response = await fetch('http://localhost:3000/products');

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const products = await response.json();
      allProducts = products;

      this.renderProductsWithStock(allProducts);
    } catch (e) {
      console.error(`Hubo un error al obtener los productos: ${e}`);
    }
  }

  /**
   * 
   * @param {*} productsArray An array stablished called at 'fetchProducts' method to render all the objects dinamically in the HTML document.
   */
  renderProductsWithStock(productsArray) {
    container.innerHTML = '';
    productsArray.forEach((product) => {
      container.innerHTML += `
        <div class="product" id="${product.id}">
          <h2 id="product-name">${product.name}</h2>
          <p id="product-price">$ ${product.price}</p>
          <div class="button-container"><button id="add-to-cart" onclick="newCart.addItemToCartAndReduceStock(${product.id})"><span class="material-symbols-outlined">
                        add_shopping_cart
                    </span></button></div>
        </div>
        `
    });
  }
  
  /**
   * 
   * @param {*} productID It's an object of the initial 'array' we got it from the button added in the last method, the method 'addItemToCartAndReduceStock' is passed as a value for the attribute 'onclick'
   * @returns {undefined} only if it finds nothing.
   */
  addItemToCartAndReduceStock(productID) {
    const productToADD = allProducts.find(p => p.id === productID);
    if (!productToADD) {
      console.error('Producto no encontrado en la lista local.');
      return;
    }

    if (productToADD.stock <= 0) {
      alert('¡Este producto está agotado!');
      return;
    }

    productToADD.stock--;

    this.addItem(productToADD);
  }

  /**
   * This is the initial method to start the cart engine, it'll store the products choosed by the user (one by one). 
   * @param {*} item It's an filtered object in the initial 'array'
   */
  addItem(item) {
    this.items.push(item);
    this.renderCart();
  }

  /**
   * This method allows re-group all the same objects (products) stored in the constructor 'this.items' with 'addItem',
   * @returns An array with objects: the products and a count of itself
   */
  getAccumulatedItems() {
    const itemCounts = {};
    const itemDetailsMap = {};

    for (const item of this.items) {
      itemCounts[item.id] = (itemCounts[item.id] || 0) + 1;

      if (!itemDetailsMap[item.id]) {
        itemDetailsMap[item.id] = item;
      }
    }

    const accumulatedList = [];
    for (const productID in itemCounts) {
      const product = itemDetailsMap[productID];
      const count = itemCounts[productID];

      if (product) {
        accumulatedList.push({
          product: product,
          count: count
        });
      }
    }
    return accumulatedList;
  }

  // This is a method that renders the cart on the screen, the bases are on the HTML Document and here receives the values and the products (with its counts provided in the last method). It calls another methods to render and actualize the DOM.
  renderCart() {
    cartItems.innerHTML = '';

    const itemsAccumulation = this.getAccumulatedItems();

    if (itemsAccumulation.length == 0) {
      clearCartDisplay.style.display = 'none';
    } else {
      clearCartDisplay.style.display = 'block';
      itemsAccumulation.forEach(i => {
        cartItems.innerHTML += `
      <div class="item">
          <div class="item-data">
              <h2 id="item-name">${i.product.name}</h2>
              <h2>$ <span id="item-price">${i.product.price.toFixed(2)}</span></h2>
          </div>
          <div class="item-counter">
              <p id="item-count">x${i.count}</p>
          </div>
          <div class="item-btn">
              <button onclick="newCart.removeItemById(${i.product.id})">
                  <span class="material-symbols-outlined">
                  remove_shopping_cart
                  </span>
                  </button>
                  </div>
      </div>
      `;
      });
    }

    this.calculateTax();
    this.calculateTotal();
    this.totals();
  }

  // Method to render the sub-totals (how expensive is your purchase without taxes).
  totals() {
    counter = this.items.length;
    itemsCounter.textContent = counter;
    itemsCounterBag.textContent = counter;

    const prices = this.items.reduce((acc, curr) => {
      return acc + curr.price;
    }, 0);

    subTotal.textContent = prices.toFixed(2);
  }

  // Method to calculate the taxes depending on the quantity of products.
  calculateTax() {
    let currentTaxRate = 0;

    if (this.items.length === 0) {
      currentTaxRate = 0;
    } else if (this.items.length >= 1 && this.items.length < 5) {
      currentTaxRate = this.taxRate;
    } else if (this.items.length >= 5 && this.items.length < 10) {
      currentTaxRate = (this.taxRate * 3);
    } else {
      currentTaxRate = (this.taxRate * 10);
    }

    tax.textContent = currentTaxRate.toFixed(2);
    return currentTaxRate;
  }

  // Method to calculate the total after taxes, it will store the ammount in the localStorage.
  calculateTotal() {
    const currentSubtotal = this.items.reduce((acc, curr) => acc + curr.price, 0);
    const currentTax = this.calculateTax();
    let currentTotal = (currentSubtotal + currentTax).toFixed(2);
    total.textContent = currentTotal;
    localStorage.setItem('total', JSON.stringify(currentTotal));
  }

  /**
   * 
   * @param {*} productId Receive an product ID in the method 'renderCart', allows to remove elements not desired (one by one). 
   */
  removeItemById(productId) {
    const itemIndex = this.items.findIndex(i => i.id == productId);

    if (itemIndex !== -1) {
      this.items.splice(itemIndex, 1);
      this.renderCart();
      allProducts[itemIndex].stock++;
    } else {
      console.log(`El item con ID ${productId} no se encontró en el carrito.`);
    }
  }

  // Method to clear the cart.
  clearCart() {
    const accumulatedList = this.getAccumulatedItems();

    for (let i = 0; i < accumulatedList.length; i++) {
      const productRetorned = accumulatedList[i];
      const productIS = productRetorned.product;
      const productCount = productRetorned.count;
      const productToReturn = allProducts.find(p => p.id == productIS.id);
      productToReturn.stock = productToReturn.stock + productCount;
    }

    this.items = [];
    this.renderCart();
    this.totals();
  }

  // This method made the 'PUT' request filtering the 'stock' property and then sending to the back-end an array with the quantity of each product stock.
  async purchaseCart() {
    if (this.items.length === 0) {
      alert('El carrito está vacío. No hay nada que comprar.');
      return;
    }

    const itemsToPurchase = this.getAccumulatedItems();    

    try {
      const userItemsMap = new Map();
      itemsToPurchase.forEach(i => {
        userItemsMap.set(i.product.id, i.product);
      })
  
      const finalProducts = allProducts.map(product => {
        const userProduct = userItemsMap.get(product.id);
        if (userProduct) {
          if (product.stock !== userProduct.stock) {
            // console.log({ ...product, stock: userProduct.stock })
            return { ...product, stock: userProduct.stock };
          } else {
            // console.log(product);
            return product;
          }
        } else {
          // console.log(product);
          return product;
        }
      });

      const finalStock = finalProducts.map(p => p.stock);
      
      const response = await fetch(`http://localhost:3000/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalStock)
      });
      
      console.log(finalStock, response);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al actualizar stock del producto ${productID}: ${errorData || response.statusText}`);
      }

      alert('¡Compra realizada con éxito!');
      this.items = [];
      this.renderCart();
      this.totals();
    } catch (error) {
      console.error('Error durante el proceso de compra:', error);
      console.error(`Hubo un error al procesar tu compra: ${error.message}`);
    }
  }
}

// Instantiating the 'shopping cart'
const newCart = new shoppingCart();


// ----- COOKIES -----

const cookieBanner = document.getElementById('cookie-banner');
const acceptCookiesButton = document.getElementById('accept-cookies');
const declineCookiesButton = document.getElementById('decline-cookies');
let aceptedCookies = false;

function setCookie(name, value, hour) {
  let expires = '';
  if (hour) {
    const date = new Date();
    date.setTime(date.getTime() + (hour * 1000 * 60 * 60));
    expires = date.toUTCString();
  }
  document.cookie = `${name}=${value || 0}; expires=${expires}; path=/`
}

function getCookie(name) {
  const cookieName = `${name}=`;
  const cookiesIndex = document.cookie.split(';');
  for (let i = 0; i < cookiesIndex.length; i++) {
    let cookie = cookiesIndex[i];
    while (cookie.charAt(0) === ' ') cookie = cookie.substring(1, cookie.length);
    if (cookie.indexOf(cookieName) === 0) return cookie.substring(cookieName.length, cookie.length);
  }
  return null;
}

let startClock = 0; // Para el contador de tiempo en la página, ligado a cookies.
let timerInterval;

function spentTime() {

  timerInterval = setInterval(() => {
    startClock++;
  }, 1000)

  console.log('Hay una función de cronómetro abierta, esto no está registrando nada porque habría que manipular el servidor.');
}

function checkCookieConsent() {
  const userConsent = getCookie('user_cookie_consent');
  if (userConsent === null) {
    shoppingBag.setAttribute('title', 'Acepta las cookies para usar el carrito');
    cookieBanner.classList.add('show');
  } else {
    cookieBanner.classList.remove('show');
    loadTheme();
    themeToggleButton.addEventListener('click', toggleTheme);
    shoppingBag.addEventListener('click', enableBag);
  }
}

function enableBag() {
  cartOpen = !cartOpen;
  if (cartOpen) {
    cartModal.classList.add('active');
  } else {
    cartModal.classList.remove('active');
  }
}


// ----- DARK MODE -----

// Get references to the button and the body
const themeToggleButton = document.getElementById('light');
const body = document.body;
const themeIcon = themeToggleButton.querySelector('.material-symbols-outlined');

// --- Optional: Check for user's preferred theme from local storage or system ---

function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeIcon.textContent = 'light_mode'; // Change icon to sun
  } else {
    // Default to light mode if nothing saved or it's 'light'
    body.classList.remove('dark-mode');
    themeIcon.textContent = 'brightness_2'; // Change icon to moon
  }
}

function toggleTheme() {
  // Toggle the 'dark-mode' class on the body
  body.classList.toggle('dark-mode');

  // Change the button icon based on the current theme
  if (body.classList.contains('dark-mode')) {
    themeIcon.textContent = 'light_mode'; // If it's dark, show sun icon to switch to light
    localStorage.setItem('theme', 'dark'); // Optional: Save preference
  } else {
    themeIcon.textContent = 'brightness_2'; // If it's light, show moon icon to switch to dark
    localStorage.setItem('theme', 'light'); // Optional: Save preference
  }
}



// ----- EVENT LISTENERS -----

clearCart.addEventListener('click', () => {
  newCart.clearCart();
});

buyButton.addEventListener('click', () => {
  newCart.purchaseCart();
})

acceptCookiesButton.addEventListener('click', () => {
  aceptedCookies = true;
  setCookie('user_cookie_consent', 'accepted', 24);
  checkCookieConsent();
  spentTime();
});

declineCookiesButton.addEventListener('click', () => {
  aceptedCookies = false;
  checkCookieConsent();
  document.getElementsByTagName('h1')[0].textContent = 'My first shopping cart (cookies desactivadas).';
});

document.addEventListener('DOMContentLoaded', () => {
  newCart.renderCart();
  newCart.calculateTax();
  newCart.fetchProducts();
  checkCookieConsent();
});


