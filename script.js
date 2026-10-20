/* ==========================================
   BURGER HOUSE — ETAPA 4
   Carrinho demonstrativo (sem pagamento)
   ========================================== */

// Configure apenas se existir um estabelecimento real e autorizado.
// Formato: 55 + DDD + número. No portfólio, deixe vazio.
const WHATSAPP_NUMBER = "";
const STORAGE_KEY = "burgerHouseDemoCart_v1";
const MAX_PER_ITEM = 99;

const brl = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

// 01 — Ano automático
const yearElement = document.getElementById("year");
if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// 02 — Catálogo: cada cartão fornece identificador, nome e preço em centavos.
// Trabalhar em centavos evita erros de arredondamento no subtotal.
const productCards = Array.from(document.querySelectorAll(".product-card"));
const products = new Map();

for (const card of productCards) {
    const id = card.dataset.productId;
    const name = card.dataset.productName;
    const priceCents = Number(card.dataset.priceCents);
    const image = card.querySelector(".product-image");
    const emoji = card.querySelector(".food-emoji");

    if (!id || !name || !Number.isSafeInteger(priceCents) || priceCents < 0) {
        console.warn("Produto com dados inválidos:", card);
        continue;
    }

    products.set(id, {
        id,
        name,
        priceCents,
        imageSrc: image?.getAttribute("src") || "",
        emoji: emoji?.textContent?.trim() || "🍔"
    });

    // Preço visível sempre corresponde ao preço usado no carrinho.
    const priceLabel = card.querySelector(".product-price");
    if (priceLabel) {
        priceLabel.textContent = brl.format(priceCents / 100);
    }
}

// 03 — Filtros de categorias
const filterButtons = document.querySelectorAll(".filter-button");
const menuFeedback = document.getElementById("menu-feedback");

function applyMenuFilter(category) {
    let visibleCount = 0;

    for (const card of productCards) {
        const visible = category === "todos" || card.dataset.category === category;
        card.hidden = !visible;
        if (visible) visibleCount++;
    }

    filterButtons.forEach((button) => {
        const selected = button.dataset.filter === category;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
    });

    if (menuFeedback) {
        menuFeedback.textContent = `Exibindo ${visibleCount} ${visibleCount === 1 ? "produto" : "produtos"}.`;
    }
}

filterButtons.forEach((button) => {
    button.addEventListener("click", () => applyMenuFilter(button.dataset.filter));
});

// 04 — Persistência local; nenhum dado pessoal é salvo.
const cart = new Map();

try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
        for (const [id, quantity] of Object.entries(stored)) {
            if (products.has(id) && Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_PER_ITEM) {
                cart.set(id, quantity);
            }
        }
    }
} catch (error) {
    // Modo privado e armazenamento desabilitado não impedem o funcionamento.
    console.info("Carrinho iniciado sem dados salvos.");
}

function saveCart() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(cart)));
    } catch (error) {
        // O carrinho segue funcionando em memória.
    }
}

function cartQuantity() {
    return Array.from(cart.values()).reduce((total, qty) => total + qty, 0);
}

function cartSubtotalCents() {
    let total = 0;
    for (const [id, quantity] of cart) {
        total += products.get(id).priceCents * quantity;
    }
    return total;
}

// 05 — Elementos do modal
const cartTrigger = document.getElementById("cart-trigger");
const cartDialog = document.getElementById("cart-dialog");
const cartClose = document.getElementById("cart-close");
const cartContinue = document.getElementById("cart-continue");
const cartCount = document.getElementById("cart-count");
const cartItems = document.getElementById("cart-items");
const cartEmpty = document.getElementById("cart-empty");
const cartSubtotal = document.getElementById("cart-subtotal");
const cartClear = document.getElementById("cart-clear");
const checkoutForm = document.getElementById("checkout-form");
const prepareOrder = document.getElementById("prepare-order");
const orderResult = document.getElementById("order-result");
const orderMessage = document.getElementById("order-message");
const orderResultStatus = document.getElementById("order-result-status");
const copyOrder = document.getElementById("copy-order");
const copyFeedback = document.getElementById("copy-feedback");
const whatsappOrder = document.getElementById("whatsapp-order");
const cartToast = document.getElementById("cart-toast");
const customerName = document.getElementById("customer-name");
const fulfillment = document.getElementById("fulfillment");
const deliveryField = document.getElementById("delivery-field");
const deliveryAddress = document.getElementById("delivery-address");
const orderNotes = document.getElementById("order-notes");

let toastTimer;
let previousFocus = null;

function showToast(message) {
    if (!cartToast) return;
    cartToast.textContent = message;
    cartToast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => cartToast.classList.remove("is-visible"), 2600);
}

function invalidateOrderPreview() {
    if (orderResult) orderResult.hidden = true;
    if (whatsappOrder) {
        whatsappOrder.hidden = true;
        whatsappOrder.removeAttribute("href");
    }
    if (copyFeedback) copyFeedback.textContent = "";
}

// Cria botões com eventos via delegação; nada de innerHTML com valores do usuário.
function quantityButton(action, id, name, label, symbol) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `qty-button qty-${action}`;
    button.dataset.cartAction = action;
    button.dataset.id = id;
    button.setAttribute("aria-label", `${label} ${name}`);
    button.textContent = symbol;
    return button;
}

function renderCart() {
    if (!cartItems) return;

    cartItems.replaceChildren();

    for (const [id, qty] of cart) {
        const product = products.get(id);
        if (!product) continue;

        const row = document.createElement("li");
        row.className = "cart-item";

        const thumb = document.createElement("div");
        thumb.className = "cart-item-thumb";
        if (product.imageSrc) {
            const image = document.createElement("img");
            image.src = product.imageSrc;
            image.alt = "";
            image.loading = "lazy";
            thumb.append(image);
        } else {
            const emoji = document.createElement("span");
            emoji.textContent = product.emoji;
            emoji.setAttribute("aria-hidden", "true");
            thumb.append(emoji);
        }

        const details = document.createElement("div");
        details.className = "cart-item-details";

        const title = document.createElement("strong");
        title.className = "cart-item-title";
        title.textContent = product.name;

        const unit = document.createElement("span");
        unit.className = "cart-item-unit";
        unit.textContent = `${brl.format(product.priceCents / 100)} / unidade`;

        const controls = document.createElement("div");
        controls.className = "quantity-controls";
        controls.append(
            quantityButton("decrease", id, product.name, "Diminuir quantidade de", "−")
        );

        const count = document.createElement("span");
        count.className = "quantity-value";
        count.textContent = String(qty);
        count.setAttribute("aria-label", `${qty} unidades`);
        controls.append(count);

        controls.append(
            quantityButton("increase", id, product.name, "Aumentar quantidade de", "+")
        );
        controls.append(
            quantityButton("remove", id, product.name, "Remover", "Remover")
        );

        details.append(title, unit, controls);

        const lineTotal = document.createElement("strong");
        lineTotal.className = "cart-item-total";
        lineTotal.textContent = brl.format((product.priceCents * qty) / 100);

        row.append(thumb, details, lineTotal);
        cartItems.append(row);
    }

    const totalQty = cartQuantity();
    if (cartCount) {
        cartCount.textContent = String(totalQty);
        cartCount.setAttribute("aria-label", `${totalQty} itens no carrinho`);
        cartTrigger?.setAttribute("aria-label", `Abrir carrinho de pedidos (${totalQty} ${totalQty === 1 ? "item" : "itens"})`);
    }
    if (cartSubtotal) cartSubtotal.textContent = brl.format(cartSubtotalCents() / 100);
    if (cartEmpty) cartEmpty.hidden = cart.size > 0;
    if (prepareOrder) prepareOrder.disabled = cart.size === 0;
    if (cartClear) cartClear.disabled = cart.size === 0;
    invalidateOrderPreview();
    saveCart();
}

function addToCart(id) {
    const product = products.get(id);
    if (!product) return;

    const current = cart.get(id) || 0;
    if (current >= MAX_PER_ITEM) {
        showToast(`Limite de ${MAX_PER_ITEM} unidades por produto.`);
        return;
    }

    cart.set(id, current + 1);
    renderCart();
    showToast(`${product.name} adicionado ao carrinho.`);
}

const menuGrid = document.querySelector(".menu-grid");
if (menuGrid) {
    menuGrid.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-add]");
        if (!button || !menuGrid.contains(button)) return;
        addToCart(button.dataset.add);
    });
}

if (cartItems) {
    cartItems.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-cart-action]");
        if (!button) return;
        const id = button.dataset.id;
        const current = cart.get(id) || 0;
        if (!products.has(id)) return;

        switch (button.dataset.cartAction) {
            case "increase":
                if (current >= MAX_PER_ITEM) {
                    showToast(`Limite de ${MAX_PER_ITEM} unidades por produto.`);
                    return;
                }
                cart.set(id, current + 1);
                break;
            case "decrease":
                if (current <= 1) cart.delete(id);
                else cart.set(id, current - 1);
                break;
            case "remove":
                cart.delete(id);
                break;
            default:
                return;
        }
        renderCart();
    });
}

function openCart() {
    if (!cartDialog || cartDialog.open) return;
    previousFocus = document.activeElement;
    renderCart();
    cartDialog.showModal();
    document.body.classList.add("cart-is-open");
}

function closeCart() {
    if (cartDialog?.open) cartDialog.close();
}

cartTrigger?.addEventListener("click", openCart);
cartClose?.addEventListener("click", closeCart);
cartContinue?.addEventListener("click", closeCart);
cartClear?.addEventListener("click", () => {
    cart.clear();
    renderCart();
    showToast("Carrinho limpo.");
});

cartDialog?.addEventListener("close", () => {
    document.body.classList.remove("cart-is-open");
    if (previousFocus?.isConnected) previousFocus.focus();
});

// Clique fora da janela fecha o modal; Escape é nativo do <dialog>.
cartDialog?.addEventListener("click", (event) => {
    if (event.target === cartDialog) closeCart();
});

// 06 — Campo condicional de entrega
function updateFulfillmentField() {
    const isDelivery = fulfillment?.value === "entrega";
    if (deliveryField) deliveryField.hidden = !isDelivery;
    if (deliveryAddress) {
        deliveryAddress.required = isDelivery;
        if (!isDelivery) deliveryAddress.value = "";
        deliveryAddress.setCustomValidity("");
    }
    invalidateOrderPreview();
}
fulfillment?.addEventListener("change", updateFulfillmentField);
checkoutForm?.addEventListener("input", invalidateOrderPreview);
updateFulfillmentField();

// 07 — Montar pedido demonstrativo
checkoutForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!cart.size) return;

    const name = customerName.value.trim().replace(/\s+/g, " ");
    customerName.setCustomValidity(name.length < 2 ? "Digite seu nome com pelo menos 2 caracteres." : "");
    if (!checkoutForm.reportValidity()) return;

    const isDelivery = fulfillment.value === "entrega";
    const address = deliveryAddress.value.trim();
    if (isDelivery && address.length < 5) {
        deliveryAddress.setCustomValidity("Informe um endereço mais completo.");
        deliveryAddress.reportValidity();
        return;
    }
    deliveryAddress.setCustomValidity("");

    const lines = [
        "Olá! Gostaria de consultar um pedido na Burger House.",
        "",
        `Nome: ${name}`,
        `Modalidade desejada: ${isDelivery ? "Entrega" : "Retirada"}`,
    ];
    if (isDelivery) lines.push(`Endereço informado: ${address}`);

    lines.push("", "Produtos:");
    for (const [id, quantity] of cart) {
        const product = products.get(id);
        const totalCents = product.priceCents * quantity;
        lines.push(`${quantity}x ${product.name} — ${brl.format(totalCents / 100)}`);
    }

    lines.push("", `Subtotal dos produtos: ${brl.format(cartSubtotalCents() / 100)}`);
    if (orderNotes.value.trim()) lines.push(`Observações: ${orderNotes.value.trim()}`);
    lines.push("", "Valores demonstrativos. Taxas de entrega não incluídas.", "Por favor, confirmem disponibilidade e valor final.");

    const message = lines.join("\n");
    orderMessage.value = message;
    orderResult.hidden = false;
    orderResultStatus.textContent = "Mensagem gerada para demonstração. Nenhum pedido foi enviado ou confirmado.";

    // Só apresenta o link quando um WhatsApp real e autorizado for configurado.
    if (/^55\d{10,11}$/.test(WHATSAPP_NUMBER)) {
        whatsappOrder.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        whatsappOrder.hidden = false;
    } else {
        whatsappOrder.hidden = true;
        whatsappOrder.removeAttribute("href");
    }

    orderResult.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "nearest"
    });
});
customerName?.addEventListener("input", () => customerName.setCustomValidity(""));
deliveryAddress?.addEventListener("input", () => deliveryAddress.setCustomValidity(""));

copyOrder?.addEventListener("click", async () => {
    if (!orderMessage?.value) return;
    try {
        if (!navigator.clipboard) throw new Error("Clipboard indisponível");
        await navigator.clipboard.writeText(orderMessage.value);
        copyFeedback.textContent = "Mensagem copiada!";
    } catch (error) {
        orderMessage.focus();
        orderMessage.select();
        copyFeedback.textContent = "Texto selecionado. Use Ctrl + C para copiar.";
    }
});

// 08 — Animações de rolagem da Etapa 3
const revealElements = document.querySelectorAll("[data-reveal]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducedMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -20px 0px" });

    revealElements.forEach((element) => {
        element.classList.add("reveal-ready");
        revealObserver.observe(element);
    });
}

renderCart();


// ==========================================
// ETAPA 5 — MENU MOBILE ACESSÍVEL
// ==========================================
// O menu permanece visível quando o JavaScript está indisponível.
const menuToggle = document.getElementById("menu-toggle");
const mainNavigation = document.getElementById("main-navigation");

if (menuToggle && mainNavigation) {
    document.documentElement.classList.add("js-enabled");

    function closeMobileMenu({ restoreFocus = false } = {}) {
        const wasOpen = mainNavigation.classList.contains("is-open");
        mainNavigation.classList.remove("is-open");
        menuToggle.classList.remove("is-active");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menu");
        if (restoreFocus && wasOpen) menuToggle.focus();
    }

    menuToggle.addEventListener("click", () => {
        const opening = !mainNavigation.classList.contains("is-open");
        mainNavigation.classList.toggle("is-open", opening);
        menuToggle.classList.toggle("is-active", opening);
        menuToggle.setAttribute("aria-expanded", String(opening));
        menuToggle.setAttribute("aria-label", opening ? "Fechar menu" : "Abrir menu");
    });

    mainNavigation.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", () => closeMobileMenu());
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && mainNavigation.classList.contains("is-open")) {
            closeMobileMenu({ restoreFocus: true });
        }
    });

    document.addEventListener("click", (event) => {
        if (mainNavigation.classList.contains("is-open") &&
            !event.target.closest(".site-header")) {
            closeMobileMenu();
        }
    });

    const desktopMenu = window.matchMedia("(min-width: 1181px)");
    desktopMenu.addEventListener("change", (event) => {
        if (event.matches) closeMobileMenu();
    });
}
