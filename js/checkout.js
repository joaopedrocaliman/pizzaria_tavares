/* =========================================================
   FINALIZAÇÃO DO PEDIDO — etapas, validação e WhatsApp
   Fluxo ENTREGA:  Modalidade → Endereço → Pagamento → Revisão
   Fluxo RETIRADA: Modalidade → Revisão
   ========================================================= */
const Checkout = (() => {
  const state = {
    mode: null,               // 'entrega' | 'retirada'
    address: { street: '', number: '', district: '', complement: '', reference: '' },
    payment: null,            // id de CONFIG.paymentMethods
    needChange: null,         // 'sim' | 'nao'
    changeFor: '',            // texto digitado
    notes: '',
    stepIndex: 0,
    sent: false
  };

  let els = {};

  const STEP_LABELS = { mode: 'Modalidade', address: 'Endereço', payment: 'Pagamento', review: 'Revisão' };

  function steps() {
    return state.mode === 'entrega' ? ['mode', 'address', 'payment', 'review'] : ['mode', 'review'];
  }
  function currentStep() { return steps()[state.stepIndex]; }
  function paymentInfo() { return CONFIG.paymentMethods.find((p) => p.id === state.payment) || null; }
  function fee() { return state.mode === 'entrega' ? CONFIG.deliveryFee : 0; }
  function total() { return Cart.subtotal() + fee(); }
  function changeForCents() { return parseBRL(state.changeFor); }

  /* ---------- Abrir / fechar ---------- */
  function open() {
    if (Cart.isEmpty()) { UI.toast('Seu carrinho está vazio. Adicione itens antes de finalizar.', true); return; }
    state.stepIndex = 0;
    state.sent = false;
    UI.closeCart();
    els.modal.hidden = false;
    document.body.classList.add('no-scroll');
    render();
    setTimeout(() => els.content.querySelector('input')?.focus(), 50);
  }
  function close() {
    els.modal.hidden = true;
    document.body.classList.remove('no-scroll');
  }

  /* ---------- Renderização ---------- */
  function render() {
    // Carrinho pode ter sido esvaziado em outra aba
    if (Cart.isEmpty() && !state.sent) { close(); return; }

    const list = steps();
    els.stepper.innerHTML = list.map((s, i) =>
      `<li class="${i < state.stepIndex ? 'done' : ''} ${i === state.stepIndex ? 'current' : ''}" ${i === state.stepIndex ? 'aria-current="step"' : ''}>${STEP_LABELS[s]}</li>`
    ).join('');

    els.back.textContent = state.stepIndex === 0 ? 'Voltar ao carrinho' : 'Voltar';
    els.next.className = 'btn btn-primary';
    els.next.hidden = false;
    els.back.hidden = false;

    if (state.sent) { renderSent(); return; }

    const step = currentStep();
    if (step === 'mode') renderMode();
    if (step === 'address') renderAddress();
    if (step === 'payment') renderPayment();
    if (step === 'review') renderReview();
    els.content.scrollTop = 0;
  }

  function renderMode() {
    els.content.innerHTML = `
      <p class="step-title">Como você deseja receber o pedido?</p>
      <div class="mode-options" role="radiogroup" aria-label="Modalidade" id="modeGroup">
        <label class="mode-card">
          <input type="radio" name="mode" value="entrega" ${state.mode === 'entrega' ? 'checked' : ''}>
          <span class="mode-icon" aria-hidden="true">🛵</span>
          <strong>Entrega</strong>
          <small>Taxa de ${formatBRL(CONFIG.deliveryFee)}</small>
        </label>
        <label class="mode-card">
          <input type="radio" name="mode" value="retirada" ${state.mode === 'retirada' ? 'checked' : ''}>
          <span class="mode-icon" aria-hidden="true">🏪</span>
          <strong>Retirada no restaurante</strong>
          <small>${escapeHTML(CONFIG.pickupAddress)}</small>
        </label>
      </div>
      <p class="field-error" id="modeError" hidden>Selecione Entrega ou Retirada para continuar.</p>`;
    els.next.textContent = 'Continuar';
    els.content.querySelectorAll('input[name="mode"]').forEach((r) =>
      r.addEventListener('change', () => { state.mode = r.value; els.content.querySelector('#modeError').hidden = true; render(); }));
  }

  function renderAddress() {
    const a = state.address;
    els.content.innerHTML = `
      <p class="step-title">Endereço de entrega</p>
      <div class="field-row">
        <div class="field" data-field="street">
          <label for="fStreet">Rua ou avenida *</label>
          <input id="fStreet" type="text" autocomplete="address-line1" maxlength="120" value="${escapeHTML(a.street)}" required>
        </div>
        <div class="field" data-field="number">
          <label for="fNumber">Número *</label>
          <input id="fNumber" type="text" inputmode="numeric" maxlength="12" value="${escapeHTML(a.number)}" required>
        </div>
      </div>
      <div class="field" data-field="district">
        <label for="fDistrict">Bairro *</label>
        <input id="fDistrict" type="text" maxlength="80" value="${escapeHTML(a.district)}" required>
      </div>
      <div class="field">
        <label for="fComplement">Complemento <span class="opt">(opcional)</span></label>
        <input id="fComplement" type="text" maxlength="80" placeholder="Apto, bloco, casa…" value="${escapeHTML(a.complement)}">
      </div>
      <div class="field">
        <label for="fReference">Ponto de referência <span class="opt">(opcional)</span></label>
        <input id="fReference" type="text" maxlength="120" value="${escapeHTML(a.reference)}">
      </div>
      <p class="field-error" id="addrError" hidden></p>`;
    els.next.textContent = 'Continuar';
    const map = { fStreet: 'street', fNumber: 'number', fDistrict: 'district', fComplement: 'complement', fReference: 'reference' };
    Object.entries(map).forEach(([id, key]) => {
      const input = els.content.querySelector('#' + id);
      input.addEventListener('input', () => {
        state.address[key] = input.value;
        input.closest('.field').classList.remove('invalid');
      });
    });
  }

  function renderPayment() {
    const pay = paymentInfo();
    const t = total();
    let changeHTML = '';
    if (pay && pay.cash) {
      changeHTML = `
        <fieldset class="option-group" id="changeGroup" style="margin-top:18px">
          <legend>Precisa de troco? <span class="req-tag">Obrigatório</span></legend>
          <div class="option-list">
            <label class="option"><input type="radio" name="needChange" value="sim" ${state.needChange === 'sim' ? 'checked' : ''}> Sim, preciso de troco</label>
            <label class="option"><input type="radio" name="needChange" value="nao" ${state.needChange === 'nao' ? 'checked' : ''}> Não preciso de troco</label>
          </div>
        </fieldset>
        ${state.needChange === 'sim' ? `
        <div class="field" data-field="changeFor">
          <label for="fChange">Troco para quanto? *</label>
          <input id="fChange" type="text" inputmode="decimal" placeholder="Ex.: 100,00" value="${escapeHTML(state.changeFor)}" autocomplete="off">
        </div>
        <div id="changeInfo" aria-live="polite"></div>` : ''}`;
    }

    els.content.innerHTML = `
      <p class="step-title">Forma de pagamento</p>
      <div class="info-box">Total a pagar na entrega: <strong>${formatBRL(t)}</strong> <small>(subtotal ${formatBRL(Cart.subtotal())} + entrega ${formatBRL(CONFIG.deliveryFee)})</small></div>
      <fieldset class="option-group" id="payGroup" style="margin-top:14px">
        <legend>Como deseja pagar? <span class="req-tag">Obrigatório</span></legend>
        <div class="option-list">
          ${CONFIG.paymentMethods.map((p) => `
            <label class="option"><input type="radio" name="payment" value="${p.id}" ${state.payment === p.id ? 'checked' : ''}> ${escapeHTML(p.label)}</label>`).join('')}
        </div>
      </fieldset>
      ${changeHTML}
      <p class="field-error" id="payError" hidden></p>`;
    els.next.textContent = 'Revisar pedido';

    els.content.querySelectorAll('input[name="payment"]').forEach((r) => r.addEventListener('change', () => {
      state.payment = r.value;
      if (!paymentInfo().cash) { state.needChange = null; state.changeFor = ''; }
      render();
    }));
    els.content.querySelectorAll('input[name="needChange"]').forEach((r) => r.addEventListener('change', () => {
      state.needChange = r.value;
      if (r.value === 'nao') state.changeFor = '';
      render();
      els.content.querySelector('#fChange')?.focus();
    }));
    const fChange = els.content.querySelector('#fChange');
    if (fChange) {
      fChange.addEventListener('input', () => { state.changeFor = fChange.value; fChange.closest('.field').classList.remove('invalid'); updateChangeInfo(); });
      updateChangeInfo();
    }
  }

  function updateChangeInfo() {
    const box = els.content.querySelector('#changeInfo');
    if (!box) return;
    if (!state.changeFor.trim()) { box.innerHTML = ''; return; }
    const v = changeForCents();
    const t = total();
    if (isNaN(v) || v <= 0) box.innerHTML = '<p class="info-box error">Informe um valor válido. Ex.: 100,00</p>';
    else if (v <= t) box.innerHTML = `<p class="info-box error">O valor precisa ser maior que o total de ${formatBRL(t)}. Se for pagar o valor exato, escolha “Não preciso de troco”.</p>`;
    else box.innerHTML = `<p class="info-box success">Troco estimado: ${formatBRL(v - t)}</p>`;
  }

  function itemsReviewHTML() {
    return Cart.getItems().map((it) => {
      const p = PRODUCT_INDEX[it.productId];
      const opts = Cart.describe(it);
      return `<div class="review-item">
        <div><strong>${it.qty}x ${escapeHTML(Cart.fullName(it))}</strong>
          ${opts.length ? `<ul>${opts.map((o) => `<li>${escapeHTML(o)}</li>`).join('')}</ul>` : ''}
          <span class="unit">${formatBRL(Cart.unitPrice(it))} cada</span>
        </div>
        <strong>${formatBRL(Cart.lineTotal(it))}</strong>
      </div>`;
    }).join('');
  }

  function renderReview() {
    const isDelivery = state.mode === 'entrega';
    const a = state.address;
    const pay = paymentInfo();
    let paymentHTML = '';
    if (isDelivery) {
      paymentHTML = `<p><strong>${escapeHTML(pay.label)}</strong></p>`;
      if (pay.cash) {
        if (state.needChange === 'sim') {
          const v = changeForCents();
          paymentHTML += `<p>Troco para: ${formatBRL(v)}</p><p>Troco estimado: ${formatBRL(v - total())}</p>`;
        } else paymentHTML += '<p>Não precisa de troco</p>';
      }
    }

    els.content.innerHTML = `
      <p class="step-title">Confira seu pedido</p>
      <div class="review-block">
        <h4>Itens <button type="button" data-edit="cart">Editar carrinho</button></h4>
        ${itemsReviewHTML()}
      </div>
      <div class="review-block">
        <h4>Valores</h4>
        <div class="review-line"><span>Subtotal</span><span>${formatBRL(Cart.subtotal())}</span></div>
        ${isDelivery ? `<div class="review-line"><span>Taxa de entrega</span><span>${formatBRL(CONFIG.deliveryFee)}</span></div>` : ''}
        <div class="review-line total"><span>Total</span><span>${formatBRL(total())}</span></div>
      </div>
      <div class="review-block">
        <h4>Modalidade <button type="button" data-edit="mode">Alterar</button></h4>
        <p><strong>${isDelivery ? '🛵 Entrega' : '🏪 Retirada no restaurante'}</strong></p>
        ${!isDelivery ? `<p>Retirar em: ${escapeHTML(CONFIG.pickupAddress)}</p>` : ''}
      </div>
      ${isDelivery ? `
      <div class="review-block">
        <h4>Endereço <button type="button" data-edit="address">Alterar</button></h4>
        <p>${escapeHTML(a.street.trim())}, ${escapeHTML(a.number.trim())}</p>
        <p>Bairro: ${escapeHTML(a.district.trim())}</p>
        ${a.complement.trim() ? `<p>Complemento: ${escapeHTML(a.complement.trim())}</p>` : ''}
        ${a.reference.trim() ? `<p>Referência: ${escapeHTML(a.reference.trim())}</p>` : ''}
      </div>
      <div class="review-block">
        <h4>Pagamento <button type="button" data-edit="payment">Alterar</button></h4>
        ${paymentHTML}
      </div>` : ''}
      <div class="field">
        <label for="fNotes">Observações do pedido <span class="opt">(opcional)</span></label>
        <textarea id="fNotes" maxlength="300" placeholder="Ex.: sabor do suco, marca do refrigerante…">${escapeHTML(state.notes)}</textarea>
      </div>
      <p class="info-box warn">Ao continuar, o WhatsApp será aberto com a mensagem pronta. <strong>O pedido só é enviado quando você tocar em “Enviar” no WhatsApp.</strong></p>`;

    els.next.innerHTML = 'Enviar pelo WhatsApp';
    els.next.className = 'btn btn-whatsapp';

    const notes = els.content.querySelector('#fNotes');
    notes.addEventListener('input', () => { state.notes = notes.value; });
    els.content.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
      const target = b.dataset.edit;
      if (target === 'cart') { close(); UI.openCart(); return; }
      state.stepIndex = steps().indexOf(target);
      render();
    }));
  }

  function renderSent() {
    els.stepper.innerHTML = '';
    els.content.innerHTML = `
      <div class="sent-state">
        <div class="emoji" aria-hidden="true">📲</div>
        <h4>Quase lá! Falta enviar no WhatsApp</h4>
        <p>Abrimos o WhatsApp com a mensagem do seu pedido. <strong>Toque em “Enviar” na conversa</strong> para que a Pizzaria Tavares receba seu pedido.</p>
        <p class="info-box">Seu pedido ainda <strong>não</strong> foi confirmado. A confirmação será feita pelo restaurante no WhatsApp.</p>
        <div class="sent-actions">
          <a class="btn btn-whatsapp btn-lg" id="reopenWhats" href="${buildWhatsAppURL()}" target="_blank" rel="noopener">Abrir o WhatsApp novamente</a>
          <button type="button" class="btn btn-outline" id="doneBtn">Já enviei — limpar carrinho</button>
        </div>
      </div>`;
    els.back.textContent = 'Voltar à revisão';
    els.next.hidden = true;
    els.content.querySelector('#doneBtn').addEventListener('click', () => {
      Cart.clear();
      resetState();
      close();
      UI.toast('Carrinho limpo. Obrigado pela preferência!');
    });
  }

  /* ---------- Validação ---------- */
  function validateStep() {
    const step = currentStep();
    if (step === 'mode') {
      if (!state.mode) { els.content.querySelector('#modeError').hidden = false; return false; }
      return true;
    }
    if (step === 'address') {
      const required = { street: 'Rua ou avenida', number: 'Número', district: 'Bairro' };
      const missing = [];
      Object.entries(required).forEach(([key, label]) => {
        const ok = state.address[key].trim().length >= (key === 'number' ? 1 : 2);
        els.content.querySelector(`[data-field="${key}"]`).classList.toggle('invalid', !ok);
        if (!ok) missing.push(label);
      });
      const err = els.content.querySelector('#addrError');
      if (missing.length) {
        err.textContent = 'Preencha: ' + missing.join(', ') + '.';
        err.hidden = false;
        els.content.querySelector('.field.invalid input')?.focus();
        return false;
      }
      return true;
    }
    if (step === 'payment') {
      const err = els.content.querySelector('#payError');
      const fail = (msg) => { err.textContent = msg; err.hidden = false; return false; };
      const pay = paymentInfo();
      if (!pay) return fail('Selecione a forma de pagamento.');
      if (pay.cash) {
        if (!state.needChange) return fail('Informe se precisa de troco.');
        if (state.needChange === 'sim') {
          const v = changeForCents();
          const field = els.content.querySelector('[data-field="changeFor"]');
          if (!state.changeFor.trim() || isNaN(v) || v <= 0) { field.classList.add('invalid'); return fail('Informe para quanto precisa de troco.'); }
          if (v <= total()) { field.classList.add('invalid'); return fail(`O valor para troco deve ser maior que o total (${formatBRL(total())}).`); }
        }
      }
      return true;
    }
    return true;
  }

  /** Revalida tudo antes de gerar a mensagem final. Retorna a etapa com problema, ou null. */
  function validateAll() {
    if (Cart.isEmpty()) return 'cart';
    if (!state.mode) return 'mode';
    if (state.mode === 'entrega') {
      const a = state.address;
      if (a.street.trim().length < 2 || !a.number.trim() || a.district.trim().length < 2) return 'address';
      const pay = paymentInfo();
      if (!pay) return 'payment';
      if (pay.cash) {
        if (!state.needChange) return 'payment';
        if (state.needChange === 'sim') {
          const v = changeForCents();
          if (isNaN(v) || v <= total()) return 'payment';
        }
      }
    }
    // Conferência do cálculo: soma das linhas = subtotal
    const check = Cart.getItems().reduce((s, it) => s + Cart.unitPrice(it) * it.qty, 0);
    if (check !== Cart.subtotal() || !Number.isInteger(check)) return 'cart';
    return null;
  }

  /* ---------- Mensagem do WhatsApp ---------- */
  function buildMessage() {
    const isDelivery = state.mode === 'entrega';
    const L = [];
    L.push('Olá! Gostaria de fazer um pedido.', '', '*MEU PEDIDO*', '');
    Cart.getItems().forEach((it) => {
      const p = PRODUCT_INDEX[it.productId];
      L.push(`${it.qty}x ${Cart.fullName(it)} — ${formatBRL(Cart.lineTotal(it))}`);
      Cart.describe(it).forEach((d) => L.push(`   • ${d}`));
      if (it.qty > 1) L.push(`   (${formatBRL(Cart.unitPrice(it))} cada)`);
    });
    L.push('');
    if (isDelivery) {
      L.push(`*Subtotal:* ${formatBRL(Cart.subtotal())}`);
      L.push(`*Taxa de entrega:* ${formatBRL(CONFIG.deliveryFee)}`);
    }
    L.push(`*TOTAL:* ${formatBRL(total())}`, '');

    if (isDelivery) {
      const a = state.address;
      L.push('*MODALIDADE:* Entrega', '', '*DADOS PARA ENTREGA*', '');
      L.push(`Endereço: ${a.street.trim()}, ${a.number.trim()}`);
      L.push(`Bairro: ${a.district.trim()}`);
      if (a.complement.trim()) L.push(`Complemento: ${a.complement.trim()}`);
      if (a.reference.trim()) L.push(`Referência: ${a.reference.trim()}`);
      L.push('');
      const pay = paymentInfo();
      L.push(`*FORMA DE PAGAMENTO:* ${pay.label}`);
      if (pay.cash) {
        if (state.needChange === 'sim') {
          const v = changeForCents();
          L.push(`*Troco para:* ${formatBRL(v)}`);
          L.push(`*Troco estimado:* ${formatBRL(v - total())}`);
        } else {
          L.push('*Troco:* Não preciso de troco');
        }
      }
      L.push('');
    } else {
      L.push('*MODALIDADE:* Retirada no restaurante.', '');
    }

    if (state.notes.trim()) L.push(`*OBSERVAÇÕES:* ${state.notes.trim()}`, '');
    L.push('Obrigado!');
    return L.join('\n');
  }

  function buildWhatsAppURL() {
    const number = String(CONFIG.whatsappNumber).replace(/\D/g, '');
    return `https://wa.me/${number}?text=${encodeURIComponent(buildMessage())}`;
  }

  function sendToWhatsApp() {
    const problem = validateAll();
    if (problem === 'cart') { UI.toast('Verifique os itens do carrinho.', true); close(); UI.openCart(); return; }
    if (problem) {
      UI.toast('Há informações pendentes. Verifique a etapa indicada.', true);
      state.stepIndex = steps().indexOf(problem);
      render();
      return;
    }
    const url = buildWhatsAppURL();
    const win = window.open(url, '_blank', 'noopener');
    state.sent = true;
    render();
    if (!win) {
      // Navegador bloqueou a nova aba: o botão "Abrir o WhatsApp novamente" continua disponível.
      UI.toast('Toque em “Abrir o WhatsApp novamente” para continuar.');
    }
  }

  function resetState() {
    state.mode = null;
    state.address = { street: '', number: '', district: '', complement: '', reference: '' };
    state.payment = null; state.needChange = null; state.changeFor = ''; state.notes = '';
    state.stepIndex = 0; state.sent = false;
  }

  /* ---------- Navegação ---------- */
  function next() {
    if (state.sent) return;
    if (currentStep() === 'review') { sendToWhatsApp(); return; }
    if (!validateStep()) return;
    state.stepIndex++;
    render();
  }
  function back() {
    if (state.sent) { state.sent = false; render(); return; }
    if (state.stepIndex === 0) { close(); UI.openCart(); return; }
    state.stepIndex--;
    render();
  }

  function init() {
    els = {
      modal: document.getElementById('checkoutModal'),
      content: document.getElementById('checkoutContent'),
      stepper: document.getElementById('stepper'),
      back: document.getElementById('coBack'),
      next: document.getElementById('coNext')
    };
    els.next.addEventListener('click', next);
    els.back.addEventListener('click', back);
    els.modal.querySelector('[data-close-checkout]').addEventListener('click', close);
    els.modal.addEventListener('click', (e) => { if (e.target === els.modal) close(); });
    Cart.onChange(() => { if (!els.modal.hidden && !state.sent) render(); });
  }

  return { init, open, close, isOpen: () => els.modal && !els.modal.hidden, buildMessage, buildWhatsAppURL, _state: state };
})();
