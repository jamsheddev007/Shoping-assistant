const PRODUCTS = [
  { id: "linen-shirt", name: "The Sunday Linen Shirt", category: "Clothing", price: 88, rating: "4.9", reviews: 28, badge: "A best-loved", image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=900&q=82", alt: "Relaxed ivory linen shirt on a model" },
  { id: "everyday-trench", name: "The Everyday Trench", category: "Clothing", price: 198, rating: "4.8", reviews: 16, badge: "Just arrived", image: "https://images.unsplash.com/photo-1548126032-079a0fb0099d?auto=format&fit=crop&w=900&q=82", alt: "Classic long neutral trench coat styled for everyday" },
  { id: "soft-knit", name: "The Soft Hour Knit", category: "Clothing", price: 124, rating: "5.0", reviews: 12, badge: "Soft by nature", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=82", alt: "Soft neutral knit sweater with a relaxed shape" },
  { id: "daylight-dress", name: "The Daylight Dress", category: "Clothing", price: 148, rating: "4.9", reviews: 21, badge: "Easy favorite", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=82", alt: "Flowing light-colored dress in a simple silhouette" },
  { id: "weekender-bag", name: "The Weekender Bag", category: "Accessories", price: 112, rating: "4.7", reviews: 9, badge: "Made to go", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=82", alt: "Structured tan leather shoulder bag" },
  { id: "gold-hoops", name: "The Little Gold Hoops", category: "Accessories", price: 56, rating: "4.9", reviews: 34, badge: "A small something", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=82", alt: "Delicate gold hoop earrings" },
  { id: "leather-flats", name: "The City Leather Flat", category: "Shoes", price: 138, rating: "4.8", reviews: 18, badge: "Walk awhile", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=82", alt: "Minimal leather flats in a warm neutral tone" },
  { id: "weekend-denim", name: "The Weekend Denim", category: "Clothing", price: 118, rating: "4.9", reviews: 25, badge: "Your new old pair", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=82", alt: "Classic blue denim jeans with a relaxed fit" }
];

const OUTFITS = [
  { description: "A relaxed layer, a soft knit, and the kind of denim you reach for without thinking.", ids: ["everyday-trench", "soft-knit", "weekend-denim"] },
  { description: "A one-and-done dress, small golden details, and flats made for taking the long way home.", ids: ["daylight-dress", "gold-hoops", "leather-flats"] },
  { description: "The linen shirt you borrow from yourself, an easy bag, and somewhere lovely to be.", ids: ["linen-shirt", "weekender-bag", "leather-flats"] }
];

const KEYS = { bag: "styleai-bag", users: "styleai-demo-users", session: "styleai-session", orders: "styleai-orders" };
const DEMO_USER = { name: "StyleAI Guest", email: "hello@styleai.com", password: "styleai123" };
const money = amount => `$${amount.toFixed(2)}`;
const safeRead = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};

let bag = safeRead(KEYS.bag, []);
let orders = safeRead(KEYS.orders, []);
if (!Array.isArray(orders)) orders = [];
let users = safeRead(KEYS.users, []);
if (!Array.isArray(users)) users = [];
if (!users.some(user => user.email === DEMO_USER.email)) {
  users.unshift(DEMO_USER);
  localStorage.setItem(KEYS.users, JSON.stringify(users));
}
let activeCategory = "All";
let outfitIndex = 0;
let authMode = "login";
let toastTimer;

const grid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#product-search");
const overlay = document.querySelector("#overlay");
const bagDrawer = document.querySelector("#bag-drawer");
const authModal = document.querySelector("#auth-modal");
const toast = document.querySelector("#toast");

function withFallback(image) {
  const fallback = image.dataset.fallback || "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80";
  image.addEventListener("error", () => {
    if (image.src !== fallback) image.src = fallback;
  }, { once: true });
}

document.querySelectorAll("img[data-fallback]").forEach(withFallback);

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const visible = PRODUCTS.filter(product => {
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesSearch = `${product.name} ${product.category}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  grid.innerHTML = visible.map((product, index) => `
    <article class="product-card" style="animation-delay:${Math.min(index * 45, 180)}ms">
      <div class="product-image-wrap">
        <img class="product-image" src="${product.image}" alt="${product.alt}" data-fallback="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80" loading="lazy">
        <span class="product-badge">${product.badge}</span>
        <button class="quick-add" type="button" data-add="${product.id}" aria-label="Add ${product.name} to bag"><span>Add to bag</span><span aria-hidden="true">+</span></button>
      </div>
      <div class="product-info"><span class="product-name">${product.name}</span><span class="product-price">${money(product.price)}</span><div class="product-meta"><span>${product.category}</span><span class="rating" aria-label="Rated ${product.rating} out of 5">★ ${product.rating} <span>(${product.reviews})</span></span></div></div>
    </article>`).join("");
  grid.querySelectorAll("img[data-fallback]").forEach(withFallback);
  document.querySelector("#results-count").textContent = `${visible.length} ${visible.length === 1 ? "piece" : "pieces"}`;
  document.querySelector("#empty-state").hidden = visible.length !== 0;
}

function persistBag() {
  localStorage.setItem(KEYS.bag, JSON.stringify(bag));
  renderBag();
}

function addToBag(id) {
  const product = PRODUCTS.find(item => item.id === id);
  if (!product) return;
  const existing = bag.find(item => item.id === id);
  if (existing) existing.quantity += 1;
  else bag.push({ id, quantity: 1 });
  persistBag();
  showToast(`${product.name} added to your bag`);
}

function changeQuantity(id, amount) {
  const item = bag.find(entry => entry.id === id);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity < 1) bag = bag.filter(entry => entry.id !== id);
  persistBag();
}

function renderBag() {
  const totalItems = bag.reduce((total, item) => total + item.quantity, 0);
  const subtotal = bag.reduce((total, item) => {
    const product = PRODUCTS.find(entry => entry.id === item.id);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);
  document.querySelector(".bag-count").textContent = totalItems;
  document.querySelector(".bag-count").setAttribute("aria-label", `${totalItems} ${totalItems === 1 ? "item" : "items"} in bag`);
  document.querySelector("#drawer-item-count").textContent = `(${totalItems})`;
  document.querySelector("#bag-subtotal").textContent = money(subtotal);
  document.querySelector("#bag-items").innerHTML = bag.map(item => {
    const product = PRODUCTS.find(entry => entry.id === item.id);
    if (!product) return "";
    return `<article class="bag-row"><img src="${product.image}" alt="${product.alt}" data-fallback="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80"><div class="bag-row-info"><strong>${product.name}</strong><small>${product.category}</small><div class="quantity-control" aria-label="Quantity for ${product.name}"><button type="button" data-quantity="${product.id}" data-change="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-quantity="${product.id}" data-change="1" aria-label="Increase quantity">+</button></div></div><div class="bag-row-end"><span>${money(product.price * item.quantity)}</span><button class="remove-item" type="button" data-remove="${product.id}">Remove</button></div></article>`;
  }).join("");
  document.querySelectorAll("#bag-items img[data-fallback]").forEach(withFallback);
  document.querySelector("#bag-empty").classList.toggle("visible", totalItems === 0);
  document.querySelector("#bag-summary").hidden = false;
}

function renderOrders() {
  const content = document.querySelector("#orders-content");
  const session = safeRead(KEYS.session, null);
  if (!session?.email) {
    content.innerHTML = `<div class="orders-empty"><p>Sign in to view your orders.</p><button class="button button-dark" type="button" data-orders-login>Sign in <span aria-hidden="true">↗</span></button></div>`;
    return;
  }
  const accountOrders = orders.filter(order => order.userEmail === session.email.toLowerCase());
  if (accountOrders.length === 0) {
    content.innerHTML = `<div class="orders-empty"><p>You haven't placed any orders yet</p><a class="button button-dark" href="#collection">Browse the collection <span aria-hidden="true">↗</span></a></div>`;
    return;
  }
  content.innerHTML = accountOrders.slice().reverse().map(order => `
    <article class="order-entry">
      <header class="order-header"><div><p class="eyebrow">Order ${order.id}</p><time datetime="${order.date}">${new Date(order.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</time></div><span class="order-status">${order.status}</span></header>
      <div class="order-items">${order.items.map(item => `<div class="order-item"><img src="${item.image}" alt="${item.name}" data-fallback="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80"><div><strong>${item.name}</strong><small>Quantity: ${item.quantity}</small></div><span>${money(item.price)} each</span></div>`).join("")}</div>
      <p class="order-total"><span>Total</span><strong>${money(order.total)}</strong></p>
    </article>`).join("");
  content.querySelectorAll("img[data-fallback]").forEach(withFallback);
}

function syncPage() {
  const ordersPage = document.querySelector("#orders");
  const showingOrders = window.location.hash === "#orders";
  document.querySelectorAll("main > section").forEach(section => {
    section.hidden = section === ordersPage ? !showingOrders : showingOrders;
  });
  renderOrders();
  if (showingOrders) window.scrollTo(0, 0);
}

function syncOverlay() {
  const open = bagDrawer.classList.contains("open") || authModal.classList.contains("open");
  overlay.hidden = !open;
  requestAnimationFrame(() => overlay.classList.toggle("visible", open));
  document.body.classList.toggle("dialog-open", open);
}

function openBag() {
  closeDialogs();
  bagDrawer.classList.add("open");
  bagDrawer.setAttribute("aria-hidden", "false");
  syncOverlay();
  bagDrawer.querySelector("[data-close]").focus();
}

function openAuth() {
  closeDialogs();
  authModal.classList.add("open");
  authModal.setAttribute("aria-hidden", "false");
  syncOverlay();
  document.querySelector("#auth-email").focus();
}

function closeDialogs() {
  const wasBagOpen = bagDrawer.classList.contains("open");
  const wasAuthOpen = authModal.classList.contains("open");
  if (wasBagOpen) document.querySelector(".bag-trigger").focus();
  else if (wasAuthOpen) {
    const accountTrigger = document.querySelector(".account-trigger");
    (accountTrigger.hidden ? document.querySelector("#login-trigger") : accountTrigger).focus();
  }
  bagDrawer.classList.remove("open");
  bagDrawer.setAttribute("aria-hidden", "true");
  authModal.classList.remove("open");
  authModal.setAttribute("aria-hidden", "true");
  syncOverlay();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function renderOutfit() {
  const outfit = OUTFITS[outfitIndex];
  document.querySelector("#outfit-description").textContent = outfit.description;
  const picks = outfit.ids.map(id => PRODUCTS.find(product => product.id === id)).filter(Boolean);
  document.querySelector("#outfit-picks").innerHTML = picks.map(product => `<div class="outfit-pick"><img src="${product.image}" alt="${product.alt}" data-fallback="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=300&q=80" loading="lazy"><div><span>${product.name}</span><small>${money(product.price)}</small></div></div>`).join("");
  document.querySelectorAll("#outfit-picks img[data-fallback]").forEach(withFallback);
}

function setAuthMode(mode) {
  authMode = mode;
  const register = mode === "register";
  document.querySelectorAll(".auth-tab").forEach(tab => {
    const selected = tab.dataset.authMode === mode;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });
  document.querySelector("#auth-title").innerHTML = register ? "Make it <em>yours.</em>" : "Welcome <em>back.</em>";
  document.querySelector("#auth-submit").innerHTML = `${register ? "Create account" : "Sign in"} <span aria-hidden="true">↗</span>`;
  document.querySelector("#auth-password").autocomplete = register ? "new-password" : "current-password";
  document.querySelector("#auth-message").textContent = "";
  document.querySelector("#auth-message").classList.remove("success");
}

document.querySelectorAll(".filter-button").forEach(button => button.addEventListener("click", () => {
  activeCategory = button.dataset.category;
  document.querySelectorAll(".filter-button").forEach(filter => {
    const active = filter === button;
    filter.classList.toggle("active", active);
    filter.setAttribute("aria-pressed", String(active));
  });
  renderProducts();
}));
searchInput.addEventListener("input", renderProducts);
document.querySelectorAll("[data-nav-category]").forEach(link => link.addEventListener("click", () => {
  activeCategory = link.dataset.navCategory;
  document.querySelectorAll(".filter-button").forEach(button => {
    const active = button.dataset.category === activeCategory;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderProducts();
}));

grid.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (button) addToBag(button.dataset.add);
});
document.querySelector("#bag-items").addEventListener("click", event => {
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");
  if (quantityButton) changeQuantity(quantityButton.dataset.quantity, Number(quantityButton.dataset.change));
  if (removeButton) {
    bag = bag.filter(item => item.id !== removeButton.dataset.remove);
    persistBag();
  }
});
document.querySelector(".bag-trigger").addEventListener("click", openBag);
document.querySelector(".account-trigger").addEventListener("click", openAuth);
document.querySelector("#login-trigger").addEventListener("click", () => {
  setAuthMode("login");
  openAuth();
});
document.querySelector("#register-trigger").addEventListener("click", () => {
  setAuthMode("register");
  openAuth();
});
document.querySelector("#logout-button").addEventListener("click", () => {
  localStorage.removeItem(KEYS.session);
  updateAccountLabel();
  showToast("You have been logged out successfully");
});
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", closeDialogs));
overlay.addEventListener("click", closeDialogs);
document.addEventListener("keydown", event => { if (event.key === "Escape") closeDialogs(); });
document.querySelectorAll(".auth-tab").forEach(tab => tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode)));
document.querySelector("#orders-content").addEventListener("click", event => {
  if (event.target.closest("[data-orders-login]")) {
    setAuthMode("login");
    openAuth();
  }
});
window.addEventListener("hashchange", syncPage);

document.querySelector("#auth-form").addEventListener("submit", event => {
  event.preventDefault();
  const email = document.querySelector("#auth-email").value.trim().toLowerCase();
  const password = document.querySelector("#auth-password").value;
  const message = document.querySelector("#auth-message");
  message.classList.remove("success");
  if (authMode === "register") {
    if (users.some(user => user.email === email) || email === DEMO_USER.email) {
      message.textContent = "That email already has an account. Try signing in.";
      return;
    }
    users.push({ email, password, name: email.split("@")[0] });
    localStorage.setItem(KEYS.users, JSON.stringify(users));
    localStorage.setItem(KEYS.session, JSON.stringify({ email, name: email.split("@")[0] }));
    message.textContent = "Your account is ready. Lovely to have you here.";
  } else {
    const account = email === DEMO_USER.email && password === DEMO_USER.password
      ? DEMO_USER
      : users.find(user => user.email === email && user.password === password);
    if (!account) {
      message.textContent = "We couldn't match those details. Check them and try again.";
      return;
    }
    localStorage.setItem(KEYS.session, JSON.stringify({ email: account.email, name: account.name }));
    message.textContent = `Welcome, ${account.name}. You're all signed in.`;
  }
  message.classList.add("success");
  updateAccountLabel();
  setTimeout(closeDialogs, 1200);
});

function updateAccountLabel() {
  const session = safeRead(KEYS.session, null);
  const label = document.querySelector(".account-label");
  const loggedIn = Boolean(session?.email);
  label.textContent = session?.name ? session.name.split(" ")[0] : "Account";
  document.querySelector(".account-trigger").hidden = !loggedIn;
  document.querySelector("#logout-button").hidden = !loggedIn;
  document.querySelector("#login-trigger").hidden = loggedIn;
  document.querySelector("#register-trigger").hidden = loggedIn;
  document.querySelector(".account-trigger").setAttribute("aria-label", session?.name ? `Account: ${session.name}` : "Open account");
  renderOrders();
}

document.querySelector("#suggest-outfit").addEventListener("click", () => {
  outfitIndex = (outfitIndex + 1 + Math.floor(Math.random() * (OUTFITS.length - 1))) % OUTFITS.length;
  renderOutfit();
});
document.querySelector("#newsletter-form").addEventListener("submit", event => {
  event.preventDefault();
  document.querySelector("#newsletter-message").textContent = "You're on the list. See you in your inbox.";
  event.currentTarget.reset();
});
document.querySelector("#checkout-button").addEventListener("click", () => {
  if (bag.length === 0) {
    showToast("Your bag is empty");
    return;
  }
  const items = bag.map(item => {
    const product = PRODUCTS.find(entry => entry.id === item.id);
    return product ? { name: product.name, image: product.image, quantity: item.quantity, price: product.price } : null;
  }).filter(Boolean);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const session = safeRead(KEYS.session, null);
  const orderId = `SA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  orders.push({
    id: orderId,
    date: new Date().toISOString(),
    userEmail: session?.email?.toLowerCase() ?? null,
    items,
    total,
    status: "Order Placed"
  });
  localStorage.setItem(KEYS.orders, JSON.stringify(orders));
  bag = [];
  localStorage.removeItem(KEYS.bag);
  renderBag();
  renderOrders();
  closeDialogs();
  showToast("Your Order Has Been Placed Successfully");
});

renderProducts();
renderBag();
renderOutfit();
updateAccountLabel();
syncPage();