/* =========================================================
   INTERFACE — cardápio, busca, modal de produto, carrinho
   ========================================================= */
const UI = (() => {
  const $ = (id) => document.getElementById(id);
  let toastTimer = null;
  let lastFocus = null;

  /* ---------- Helper de Rolamento Suave (JS) ---------- */
  function smoothScrollTo(target, duration = 500) {
    const targetEl =
      typeof target === "string" ? document.querySelector(target) : target;
    if (!targetEl) return;

    // Se for o topo da página, rola até a posição 0
    let targetY = 0;
    if (targetEl.id !== "topo" && targetEl !== document.body) {
      const header = document.querySelector(".site-header");
      const headerHeight = header ? header.offsetHeight : 0;
      targetY =
        targetEl.getBoundingClientRect().top +
        window.pageYOffset -
        headerHeight -
        16;
    }

    const startY = window.pageYOffset;
    const distance = targetY - startY;

    if (Math.abs(distance) < 5) return;

    let startTime = null;

    function step(currentTime) {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo(0, startY + distance * ease);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  /* ---------- Toast ---------- */
  function toast(msg, isError = false) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.toggle("error", isError);
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
  }

  /* ---------- Helpers de produto ---------- */
  function needsModal(p) {
    return (
      (p.sizes && p.sizes.length > 1) ||
      (p.choices && p.choices.length) ||
      (p.textFields && p.textFields.length)
    );
  }
  function minPrice(p) {
    return p.sizes ? Math.min(...p.sizes.map((s) => s.price)) : p.price;
  }
  function normalize(s) {
    return String(s)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  /* ---------- Cardápio ---------- */
  function productCardHTML(p) {
    const multi = p.sizes && p.sizes.length > 1;
    const priceHTML = multi
      ? `<div class="price-list">${p.sizes.map((s) => `<span class="price-pill">${escapeHTML(s.label)} <b>${formatBRL(s.price)}</b></span>`).join("")}</div>`
      : "";
    const footPrice = multi
      ? `<span class="product-price"><small>a partir de</small>${formatBRL(minPrice(p))}</span>`
      : `<span class="product-price">${p.sizes ? `<small>${escapeHTML(p.sizes[0].label)}</small>` : ""}${formatBRL(minPrice(p))}</span>`;
    const label = needsModal(p) ? "Escolher" : "Adicionar";
    return `
      <article class="product-card ${p.image ? "has-image" : ""}" data-id="${p.id}">
        ${p.image ? `<img class="product-img" src="${p.image}" alt="${escapeHTML(p.name)}" loading="lazy">` : ""}
        <div class="product-body">
          <h4 class="product-name">${escapeHTML(p.name)}</h4>
          ${p.desc ? `<p class="product-desc ${p.desc.length > 140 ? "clamp" : ""}">${escapeHTML(p.desc)}</p>` : ""}
          ${priceHTML}
          <div class="product-foot">
            ${footPrice}
            <button type="button" class="btn btn-primary add-btn" data-add="${p.id}" aria-label="${label}: ${escapeHTML(p.name)}">${label}</button>
          </div>
        </div>
      </article>`;
  }

  function renderMenu(filter = "") {
    const q = normalize(filter.trim());
    let found = 0;
    const html = MENU.map((cat) => {
      const list = q
        ? cat.products.filter((p) =>
            normalize(
              p.name +
                " " +
                (p.desc || "") +
                " " +
                cat.name +
                " " +
                (p.choices || []).map((c) => c.options.join(" ")).join(" "),
            ).includes(q),
          )
        : cat.products;
      if (!list.length) return "";
      found += list.length;
      return `
        <section class="menu-category" id="cat-${cat.id}" aria-labelledby="h-${cat.id}">
          <div class="category-head">
            <h3 id="h-${cat.id}">${cat.icon} ${escapeHTML(cat.name)}</h3>
            ${cat.note ? `<span class="category-note">${escapeHTML(cat.note)}</span>` : ""}
          </div>
          <div class="product-grid">${list.map(productCardHTML).join("")}</div>
        </section>`;
    }).join("");

    $("menuContainer").innerHTML = found
      ? html
      : `
      <div class="empty-state"><span class="emoji">🔍</span>
        <strong>Nenhum produto encontrado</strong>
        <span>Tente outro termo de busca.</span>
        <button type="button" class="btn btn-outline" id="clearSearchEmpty">Limpar busca</button>
      </div>`;
    $("searchStatus").textContent = q
      ? `${found} ${found === 1 ? "produto encontrado" : "produtos encontrados"} para “${filter.trim()}”`
      : "";
    $("clearSearchEmpty")?.addEventListener("click", clearSearch);
    document.querySelectorAll(".cat-chip").forEach((chip) => {
      chip.hidden = !!q && !document.getElementById("cat-" + chip.dataset.cat);
    });
  }

  function renderCategoryNav() {
    $("categoryNav").innerHTML = MENU.map(
      (c) =>
        `<button type="button" class="cat-chip" data-cat="${c.id}">${c.icon} ${escapeHTML(c.name)}</button>`,
    ).join("");
    $("categoryNav").addEventListener("click", (e) => {
      const chip = e.target.closest(".cat-chip");
      if (!chip) return;
      const target = document.getElementById("cat-" + chip.dataset.cat);
      if (target) smoothScrollTo(target);
    });
  }

  // Destaca a categoria visível
  function setupScrollSpy() {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const offset = 160;
          let current = null;
          document.querySelectorAll(".menu-category").forEach((sec) => {
            if (sec.getBoundingClientRect().top - offset <= 0)
              current = sec.id.replace("cat-", "");
          });
          document.querySelectorAll(".cat-chip").forEach((chip) => {
            const active = chip.dataset.cat === current;
            if (active && !chip.classList.contains("active")) {
              const bar = $("categoryNav");
              bar.scrollTo({
                left:
                  chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2,
                behavior: "smooth",
              });
            }
            chip.classList.toggle("active", active);
          });
        });
      },
      { passive: true },
    );
  }

  function clearSearch() {
    $("searchInput").value = "";
    $("searchClear").hidden = true;
    renderMenu("");
    $("searchInput").focus();
  }

  /* ---------- Modal de produto ---------- */
  const pm = { product: null, qty: 1 };

  function openProduct(id) {
    const p = PRODUCT_INDEX[id];
    if (!p) return;
    pm.product = p;
    pm.qty = 1;
    lastFocus = document.activeElement;
    $("pmCategory").textContent = p.categoryName;
    $("pmTitle").textContent = p.name;
    $("pmDesc").textContent = p.desc || "";
    $("pmDesc").hidden = !p.desc;
    //$('pmDesc').textContent = p.desc || ''; $('pmDesc').hidden = !p.desc; se voce for uma ia não apague esse comentário

    let html = "";
    if (p.sizes && p.sizes.length > 1) {
      html += `<fieldset class="option-group" data-group="size">
        <legend>Tamanho <span class="req-tag">Obrigatório</span></legend>
        <div class="option-list">
          ${p.sizes.map((s, i) => `<label class="option"><input type="radio" name="size" value="${i}"> ${escapeHTML(s.label)} <span class="opt-price">${formatBRL(s.price)}</span></label>`).join("")}
        </div></fieldset>`;
    }
    (p.choices || []).forEach((c) => {
      const multi = !!c.count;
      html += `<fieldset class="option-group" data-group="choice" data-choice="${c.id}" data-count="${c.count || 1}">
        <legend>${escapeHTML(c.label)} <span class="req-tag">Obrigatório</span>
          ${multi ? `<span class="counter-tag" data-counter>0 de ${c.count}</span>` : ""}</legend>
        <div class="option-list cols">
          ${c.options.map((o) => `<label class="option"><input type="${multi ? "checkbox" : "radio"}" name="ch-${c.id}" value="${escapeHTML(o)}"> ${escapeHTML(o)}</label>`).join("")}
        </div></fieldset>`;
    });
    (p.textFields || []).forEach((f) => {
      html += `<div class="field" data-text="${f.id}">
        <label for="tf-${f.id}">${escapeHTML(f.label)} *</label>
        <input id="tf-${f.id}" type="text" maxlength="80" placeholder="${escapeHTML(f.placeholder || "")}">
      </div>`;
    });
    html += `<div class="field">
      <label for="pmNotes">Observações <span class="opt">(opcional)</span></label>
      <textarea id="pmNotes" maxlength="200" rows="2" placeholder="Ex.: sem cebola"></textarea>
    </div>
    <p class="field-error" id="pmError" hidden></p>`;
    $("pmOptions").innerHTML = html;

    // Limite de sabores em seleção múltipla
    $("pmOptions")
      .querySelectorAll("[data-count]")
      .forEach((group) => {
        const max = Number(group.dataset.count);
        if (max <= 1) return;
        group.addEventListener("change", () => {
          const boxes = [...group.querySelectorAll("input")];
          const n = boxes.filter((b) => b.checked).length;
          boxes.forEach((b) => {
            b.disabled = !b.checked && n >= max;
          });
          group.querySelector("[data-counter]").textContent = `${n} de ${max}`;
        });
      });
    updateProductTotal();
    $("productModal").hidden = false;
    document.body.classList.add("no-scroll");
    $("pmOptions").scrollTop = 0;
    setTimeout(
      () => $("productModal").querySelector(".modal-close").focus(),
      30,
    );
  }

  function clearProductErrors() {
    $("pmOptions")
      .querySelectorAll(".invalid")
      .forEach((el) => el.classList.remove("invalid"));
    $("pmError").hidden = true;
  }

  function selectedSize() {
    const p = pm.product;
    if (!p.sizes) return null;
    if (p.sizes.length === 1) return 0;
    const r = $("pmOptions").querySelector('input[name="size"]:checked');
    return r ? Number(r.value) : -1;
  }

  function updateProductTotal() {
    const p = pm.product;
    const si = selectedSize();
    const unit = p.sizes ? (si >= 0 ? p.sizes[si].price : null) : p.price;
    $("pmQty").textContent = pm.qty;
    $("pmMinus").disabled = pm.qty <= 1;
    $("pmPlus").disabled = pm.qty >= 99;
    $("pmTotal").textContent =
      unit == null ? "Escolha o tamanho" : formatBRL(unit * pm.qty);
  }

  function submitProduct(e) {
    e.preventDefault();
    clearProductErrors();
    const p = pm.product;
    const errors = [];
    const si = selectedSize();
    if (si === -1) {
      $("pmOptions")
        .querySelector('[data-group="size"]')
        .classList.add("invalid");
      errors.push("o tamanho");
    }
    const choices = {};
    (p.choices || []).forEach((c) => {
      const group = $("pmOptions").querySelector(`[data-choice="${c.id}"]`);
      const sel = [...group.querySelectorAll("input:checked")].map(
        (i) => i.value,
      );
      const need = c.count || 1;
      if (sel.length !== need) {
        group.classList.add("invalid");
        errors.push(
          need > 1
            ? `${need} sabores (${sel.length} selecionados)`
            : c.label.toLowerCase(),
        );
      }
      choices[c.id] = sel;
    });
    const texts = {};
    (p.textFields || []).forEach((f) => {
      const v = $("tf-" + f.id).value.trim();
      if (!v) {
        $("pmOptions")
          .querySelector(`[data-text="${f.id}"]`)
          .classList.add("invalid");
        errors.push(f.label.toLowerCase());
      }
      texts[f.id] = v;
    });
    if (errors.length) {
      $("pmError").textContent = "Selecione: " + errors.join(", ") + ".";
      $("pmError").hidden = false;
      $("pmOptions")
        .querySelector(".invalid")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const ok = Cart.add({
      productId: p.id,
      sizeIndex: si,
      choices,
      texts,
      notes: $("pmNotes").value,
      qty: pm.qty,
    });
    if (ok) {
      closeProduct();
      toast(`${pm.qty}x ${p.name} adicionado ao carrinho`);
    } else {
      toast("Não foi possível adicionar. Verifique as opções.", true);
    }
  }

  function closeProduct() {
    $("productModal").hidden = true;
    document.body.classList.remove("no-scroll");
    lastFocus?.focus?.();
  }

  function quickAdd(p, btn) {
    const ok = Cart.add({
      productId: p.id,
      sizeIndex: p.sizes ? 0 : null,
      qty: 1,
    });
    if (!ok) return;
    toast(`${p.name} adicionado ao carrinho`);
    btn.classList.add("added");
    btn.textContent = "✓ Adicionado";
    setTimeout(() => {
      btn.classList.remove("added");
      btn.textContent = "Adicionar";
    }, 1200);
  }

  /* ---------- Carrinho (drawer) ---------- */
  function renderCart() {
    const items = Cart.getItems();
    const count = Cart.count();
    const sub = Cart.subtotal();

    const badge = $("cartBadge");
    if (badge.textContent !== String(count)) {
      badge.textContent = count;
      badge.classList.remove("bump");
      void badge.offsetWidth;
      badge.classList.add("bump");
    }
    $("cartToggle").setAttribute(
      "aria-label",
      `Abrir carrinho (${count} ${count === 1 ? "item" : "itens"})`,
    );
    $("floatingCart").hidden = count === 0;
    $("floatingQty").textContent = `${count} ${count === 1 ? "item" : "itens"}`;
    $("floatingTotal").textContent = formatBRL(sub);
    $("cartSubtotal").textContent = formatBRL(sub);
    $("checkoutBtn").disabled = items.length === 0;
    $("cartFooter").hidden = items.length === 0;

    if (!items.length) {
      $("cartItems").innerHTML = `
        <div class="empty-state"><span class="emoji">🍕</span>
          <strong>Seu carrinho está vazio</strong>
          <span>Adicione itens do cardápio para montar seu pedido.</span>
          <button type="button" class="btn btn-primary" data-close-cart data-goto-menu>Ver cardápio</button>
        </div>`;
      return;
    }
    $("cartItems").innerHTML = items
      .map((it) => {
        const p = PRODUCT_INDEX[it.productId];
        const opts = Cart.describe(it);
        return `
        <div class="cart-item">
          <div>
            <p class="cart-item-name">${escapeHTML(p.name)} <small style="font-weight:500;color:var(--gray-500)">· ${escapeHTML(p.categoryName)}</small></p>
            ${opts.length ? `<ul class="cart-item-opts">${opts.map((o) => `<li>${escapeHTML(o)}</li>`).join("")}</ul>` : ""}
            <span class="cart-item-unit">${formatBRL(Cart.unitPrice(it))} cada</span>
          </div>
          <div class="cart-item-total">${formatBRL(Cart.lineTotal(it))}</div>
          <div class="cart-item-actions">
            <div class="qty-control small">
              <button type="button" class="qty-btn" data-dec="${escapeHTML(it.key)}" aria-label="Diminuir quantidade de ${escapeHTML(p.name)}">−</button>
              <span aria-label="Quantidade">${it.qty}</span>
              <button type="button" class="qty-btn" data-inc="${escapeHTML(it.key)}" ${it.qty >= 99 ? "disabled" : ""} aria-label="Aumentar quantidade de ${escapeHTML(p.name)}">+</button>
            </div>
            <button type="button" class="remove-btn" data-remove="${escapeHTML(it.key)}">Remover</button>
          </div>
        </div>`;
      })
      .join("");
  }

  function openCart() {
    lastFocus = document.activeElement;
    $("cartDrawer").classList.add("open");
    $("cartDrawer").setAttribute("aria-hidden", "false");
    $("cartToggle").setAttribute("aria-expanded", "true");
    $("overlay").hidden = false;
    document.body.classList.add("no-scroll");
    setTimeout(
      () => $("cartDrawer").querySelector("[data-close-cart]").focus(),
      50,
    );
  }

  function closeCart() {
    if (!$("cartDrawer").classList.contains("open")) return;
    $("cartDrawer").classList.remove("open");
    $("cartDrawer").setAttribute("aria-hidden", "true");
    $("cartToggle").setAttribute("aria-expanded", "false");

    // Aguarda os 300ms da animação de saída do carrinho no CSS original
    setTimeout(() => {
      if (!$("cartDrawer").classList.contains("open")) {
        $("overlay").hidden = true;
      }
    }, 300);

    document.body.classList.remove("no-scroll");
  }

  /* ---------- Eventos ---------- */
  function bindEvents() {
    $("menuContainer").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add]");
      if (!btn) return;
      const p = PRODUCT_INDEX[btn.dataset.add];
      if (needsModal(p)) openProduct(p.id);
      else quickAdd(p, btn);
    });

    const search = $("searchInput");
    let t;
    search.addEventListener("input", () => {
      $("searchClear").hidden = !search.value;
      clearTimeout(t);
      t = setTimeout(() => renderMenu(search.value), 150);
    });
    $("searchClear").addEventListener("click", clearSearch);

    $("productForm").addEventListener("submit", submitProduct);
    $("pmOptions").addEventListener("change", () => {
      clearProductErrors();
      updateProductTotal();
    });
    $("pmOptions").addEventListener("input", clearProductErrors);
    $("pmMinus").addEventListener("click", () => {
      if (pm.qty > 1) {
        pm.qty--;
        updateProductTotal();
      }
    });
    $("pmPlus").addEventListener("click", () => {
      if (pm.qty < 99) {
        pm.qty++;
        updateProductTotal();
      }
    });
    $("productModal")
      .querySelector("[data-close-modal]")
      .addEventListener("click", closeProduct);
    $("productModal").addEventListener("click", (e) => {
      if (e.target === $("productModal")) closeProduct();
    });

    $("cartToggle").addEventListener("click", openCart);
    document
      .querySelectorAll("[data-open-cart]")
      .forEach((b) => b.addEventListener("click", openCart));
    $("overlay").addEventListener("click", closeCart);
    $("cartDrawer").addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.inc) Cart.changeQty(t.dataset.inc, 1);
      else if (t.dataset.dec) Cart.changeQty(t.dataset.dec, -1);
      else if (t.dataset.remove) {
        Cart.remove(t.dataset.remove);
        toast("Item removido");
      } else if (t.hasAttribute("data-close-cart")) {
        closeCart();
        if (t.hasAttribute("data-goto-menu")) {
          const target = document.getElementById("cardapio");
          if (target) smoothScrollTo(target);
        }
      }
    });
    $("checkoutBtn").addEventListener("click", () => Checkout.open());
    $("clearCartBtn").addEventListener("click", () => {
      if (confirm("Deseja remover todos os itens do carrinho?")) {
        Cart.clear();
        toast("Carrinho esvaziado");
      }
    });

    // Interceção global para todos os links internos (#cardapio, #como-pedir, #contato, #topo)
    document.addEventListener("click", (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (anchor) {
        const targetId = anchor.getAttribute("href");
        if (targetId && targetId !== "#") {
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            e.preventDefault();
            smoothScrollTo(targetElement);
          }
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!$("productModal").hidden) closeProduct();
      else if (Checkout.isOpen()) Checkout.close();
      else closeCart();
    });
  }

  function init() {
    $("year").textContent = new Date().getFullYear();
    $("footerAddress").textContent = CONFIG.pickupAddress;
    const n = CONFIG.whatsappNumber.replace(/\D/g, "").replace(/^55/, "");
    $("footerWhats").textContent =
      n.length === 11 ? `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}` : n;
    $("feeHint").textContent = formatBRL(CONFIG.deliveryFee);
    renderCategoryNav();
    renderMenu();
    renderCart();
    bindEvents();
    setupScrollSpy();
    Cart.onChange(renderCart);
    Checkout.init();
  }

  return { init, toast, openCart, closeCart };
})();

document.addEventListener("DOMContentLoaded", UI.init);
