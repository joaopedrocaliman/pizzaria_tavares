/* =========================================================
   CONFIGURAÇÕES DO RESTAURANTE
   Edite aqui os dados da Pizzaria Tavares.
   ========================================================= */
const CONFIG = {
  restaurantName: 'Pizzaria Tavares',

  // WhatsApp que recebe os pedidos: formato internacional, SÓ dígitos
  // 55 (Brasil) + DDD + número.  (19) 99999-9999 -> 5519999999999
  // ATENÇÃO: número fictício — substituir pelo número oficial.
  whatsappNumber: '5519999999999',

  // Taxa de entrega em CENTAVOS (500 = R$ 5,00). Aplicada somente na modalidade Entrega.
  deliveryFee: 500,

  // Endereço para retirada (fictício — substituir pelo endereço real).
  pickupAddress: 'Rua das Rosas, 123',

  // Formas de pagamento aceitas na ENTREGA. "cash: true" ativa a pergunta de troco.
  paymentMethods: [
    { id: 'dinheiro', label: 'Dinheiro', cash: true },
    { id: 'pix', label: 'Pix' },
    { id: 'debito', label: 'Cartão de débito' },
    { id: 'credito', label: 'Cartão de crédito' }
  ],

  // Chave usada no localStorage para guardar o carrinho.
  storageKey: 'pizzaria_tavares_cart_v1'
};

/* ---------- Utilitários monetários (valores sempre em centavos inteiros) ---------- */
function formatBRL(cents) {
  const value = (Math.round(cents) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  return value.replace(/\u00a0/g, ' ');
}

/** Converte texto digitado ("50", "50,00", "R$ 1.000,50", "50.5") em centavos. Retorna NaN se inválido. */
function parseBRL(text) {
  if (text == null) return NaN;
  let s = String(text).replace(/[^\d.,]/g, '');
  if (!s) return NaN;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes('.')) {
    const parts = s.split('.');
    const last = parts[parts.length - 1];
    // "1.000" = milhar; "50.5" ou "50.50" = decimal
    s = last.length === 3 ? parts.join('') : parts.slice(0, -1).join('') + '.' + last;
  }
  const n = Number(s);
  if (!isFinite(n)) return NaN;
  return Math.round(n * 100);
}

function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
