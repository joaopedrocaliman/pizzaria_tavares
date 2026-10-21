/* =========================================================
   CARRINHO — estado, cálculos e persistência (localStorage)
   O carrinho guarda apenas IDs e escolhas; os preços são sempre
   recalculados a partir de products.js (fonte de verdade).
   ========================================================= */
const Cart = (() => {
  let items = [];        // [{ key, productId, sizeIndex, choices:{id:[...]}, texts:{id:'...'}, notes, qty }]
  const listeners = [];

  /* ---------- Persistência ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      // Descarta itens inválidos (ex.: produto removido do cardápio ou tamanho inexistente)
      items = Array.isArray(parsed) ? parsed.filter(isValidItem) : [];
    } catch (e) {
      items = [];
    }
  }

  function save() {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(items)); } catch (e) { /* armazenamento indisponível */ }
  }

  function isValidItem(it) {
    if (!it || typeof it !== 'object') return false;
    const p = PRODUCT_INDEX[it.productId];
    if (!p) return false;
    if (!Number.isInteger(it.qty) || it.qty < 1 || it.qty > 99) return false;
    if (p.sizes && !p.sizes[it.sizeIndex]) return false;
    if (p.choices) {
      for (const c of p.choices) {
        const sel = it.choices && it.choices[c.id];
        const need = c.count || 1;
        if (!Array.isArray(sel) || sel.length !== need || !sel.every((v) => c.options.includes(v))) return false;
      }
    }
    if (p.textFields) {
      for (const f of p.textFields) {
        if (!it.texts || !String(it.texts[f.id] || '').trim()) return false;
      }
    }
    return true;
  }

  /* ---------- Cálculos (centavos inteiros) ---------- */
  function unitPrice(item) {
    const p = PRODUCT_INDEX[item.productId];
    if (!p) return 0;
    return p.sizes ? p.sizes[item.sizeIndex].price : p.price;
  }
  function lineTotal(item) { return unitPrice(item) * item.qty; }
  function subtotal() { return items.reduce((sum, it) => sum + lineTotal(it), 0); }
  function count() { return items.reduce((sum, it) => sum + it.qty, 0); }

  /** Descrições legíveis das personalizações de um item. */
  function describe(item) {
    const p = PRODUCT_INDEX[item.productId];
    const lines = [];
    if (p.sizes && p.sizes.length > 1) lines.push('Tamanho: ' + p.sizes[item.sizeIndex].label);
    else if (p.sizes && p.sizes.length === 1) lines.push(p.sizes[0].label);
    (p.choices || []).forEach((c) => {
      const sel = item.choices[c.id] || [];
      const label = c.count ? 'Sabores' : c.label;
      lines.push(label + ': ' + sel.join(', '));
    });
    (p.textFields || []).forEach((f) => lines.push(f.label + ': ' + item.texts[f.id]));
    if (item.notes) lines.push('Obs.: ' + item.notes);
    return lines;
  }

  /** Nome com categoria, evitando ambiguidade (ex.: "Calabresa (Pizzas Salgadas)"). */
  function fullName(item) {
    const p = PRODUCT_INDEX[item.productId];
    return `${p.name} (${p.categoryName})`;
  }

  function makeKey(it) {
    return JSON.stringify([it.productId, it.sizeIndex, it.choices, it.texts, it.notes]);
  }

  /* ---------- Operações ---------- */
  function add(data) {
    const item = {
      productId: data.productId,
      sizeIndex: Number.isInteger(data.sizeIndex) ? data.sizeIndex : null,
      choices: data.choices || {},
      texts: data.texts || {},
      notes: (data.notes || '').trim().slice(0, 200),
      qty: Math.max(1, Math.min(99, data.qty | 0))
    };
    if (!isValidItem(item)) return false;
    item.key = makeKey(item);
    const existing = items.find((i) => i.key === item.key);
    if (existing) existing.qty = Math.min(99, existing.qty + item.qty);
    else items.push(item);
    commit();
    return true;
  }

  function changeQty(key, delta) {
    const it = items.find((i) => i.key === key);
    if (!it) return;
    it.qty += delta;
    if (it.qty < 1) items = items.filter((i) => i.key !== key);
    else if (it.qty > 99) it.qty = 99;
    commit();
  }

  function remove(key) {
    items = items.filter((i) => i.key !== key);
    commit();
  }

  function clear() { items = []; commit(); }

  function commit() { save(); listeners.forEach((fn) => fn()); }
  function onChange(fn) { listeners.push(fn); }
  function getItems() { return items.slice(); }
  function isEmpty() { return items.length === 0; }

  load();
  // Sincroniza entre abas
  window.addEventListener('storage', (e) => {
    if (e.key === CONFIG.storageKey) { load(); listeners.forEach((fn) => fn()); }
  });

  return { add, changeQty, remove, clear, onChange, getItems, isEmpty, unitPrice, lineTotal, subtotal, count, describe, fullName };
})();
