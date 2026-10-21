/* =========================================================
   CARDÁPIO — PIZZARIA TAVARES
   Fonte: cardápio oficial enviado pelo restaurante.

   Todos os preços estão em CENTAVOS (10300 = R$ 103,00) para
   evitar erros de arredondamento.

   Estrutura de um produto:
   {
     id:      identificador único (texto, sem espaços)
     name:    nome exibido
     desc:    descrição/ingredientes (opcional)
     price:   preço único em centavos            — OU —
     sizes:   [{ label: 'Média', price: 5400 }, ...]  (tamanhos com preço próprio)
     choices: [{ id, label, options: [...], count?: n }]  (escolhas obrigatórias, sem custo extra)
     textFields: [{ id, label, placeholder }]  (campo de texto obrigatório)
     image:   'assets/images/arquivo.jpg' (opcional — use apenas fotos reais do produto)
   }
   ========================================================= */

/* ---------- Funções auxiliares de cadastro ---------- */
const SIZE_PORCAO = ['Meia', 'Inteira'];
const SIZE_PASTEL = ['Feira', 'Grande', 'Gigante'];
const SIZE_PIZZA = ['Média', 'Grande'];

function slug(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Cria produto com tamanhos. prices em reais (ex.: 26 ou 30.5) — convertidos para centavos. */
function sized(prefix, name, desc, labels, prices, extra = {}) {
  return {
    id: prefix + '-' + slug(name),
    name,
    desc,
    sizes: labels.map((label, i) => ({ label, price: Math.round(prices[i] * 100) })),
    ...extra
  };
}

/** Cria produto de preço único. price em reais. */
function single(prefix, name, desc, price, extra = {}) {
  return { id: prefix + '-' + slug(name), name, desc, price: Math.round(price * 100), ...extra };
}

/* ---------- Listas de sabores ---------- */
const ESFIHA_SALGADA_SABORES = ['Alemã', 'Alho', 'Atum', 'Baiana', 'Beringela', 'Brócolis', 'Calabresa',
  'Calabresa c/ Catupiry', 'Camarão', 'Carne Seca', 'Costela', 'Carne', 'Escarola', 'Frango c/ Catupiry',
  'Filé-Mignon', 'Gratinada', 'Milho', 'Mussarela', 'Palmito', 'Pepperoni', '3 Queijos', '4 Queijos', '5 Queijos'];

const ESFIHA_DOCE_SABORES = ['Prestígio', 'Confete', 'Banana c/ Doce de Leite', 'Chocolate c/ Morango',
  'Chocolate Branco c/ Kiwi', 'Mesclada', 'Romeu e Julieta'];

const BATATA_ESPECIAIS = ['Camarão', 'Bacalhau', 'Carne Seca', 'Costela', 'Strogonoff de Carne',
  'Strogonoff de Frango', 'Filé-Mignon', '3 Queijos', '4 Queijos', '5 Queijos'];

/* ---------- Pizzas salgadas (usadas também na "Moda da Casa") ---------- */
const PIZZAS_SALGADAS_DATA = [
  ['3 Queijos', 'Molho, mussarela, provolone, catupiry, tomate, azeitona, orégano', 54, 59],
  ['4 Queijos', 'Molho, mussarela, provolone, parmesão, catupiry, tomate, azeitona, orégano', 56, 61],
  ['5 Queijos', 'Molho, mussarela, provolone, gorgonzola, catupiry, tomate, azeitona, orégano', 59, 64],
  ['A Bolognesa', 'Mussarela, molho de carne, champignon, catupiry, tomate, azeitona, orégano', 56, 59],
  ['Abobrinha', 'Molho, mussarela, parmesão, abobrinha, tomate, azeitona, orégano', 51, 54],
  ['Alemã', 'Molho, mussarela, bacon frito, tomate, azeitona, orégano', 52, 55],
  ['Alho', 'Molho, mussarela, alho frito, tomate, azeitona, orégano', 51, 54],
  ['Aliche', 'Molho, mussarela, parmesão, aliche, tomate, azeitona, orégano', 53, 56],
  ['Atum', 'Molho, mussarela, atum, cebola, azeitona, orégano', 52, 56],
  ['Atum c/ Catupiry', 'Molho, mussarela, atum, catupiry, cebola, azeitona, orégano', 55, 58],
  ['Bacalhau', 'Molho, mussarela, bacalhau, tomate, azeitona, orégano', 67, 73],
  ['Bacalhau Portuguesa', 'Molho, bacalhau, ovo, cebola, tomate, azeitona, orégano', 69, 75],
  ['Bacon Especial', 'Molho, mussarela, parmesão, bacon frito, ovo, tomate, azeitona, orégano', 53, 58],
  ['Baiana', 'Molho, mussarela, calabresa apimentada, ovo, cebola, tomate, azeitona, orégano', 51, 54],
  ['Berinjela', 'Mussarela, parmesão, berinjela à parmegiana, tomate, azeitona, orégano', 49, 54],
  ['Biquinho', 'Molho, mussarela, rúcula, pimenta biquinho, tomate, azeitona, orégano', 54, 59],
  ['Brasileira', 'Molho, mussarela, calabresa, presunto, milho, ervilha, ovo, palmito, cebola, tomate, azeitona, orégano', 53, 58],
  ['Brócolis', 'Molho, mussarela, brócolis, tomate, azeitona, orégano', 49, 53],
  ['Calabresa', 'Molho, mussarela, calabresa, cebola, tomate, azeitona, orégano', 48, 55],
  ['Calabresa c/ Catupiry', 'Molho, mussarela, calabresa, catupiry, tomate, azeitona, orégano', 53, 57],
  ['Calabresa c/ Salame', 'Molho, mussarela, calabresa, salame, cebola, tomate, azeitona, orégano', 57, 60],
  ['Califórnia', 'Molho, mussarela, lombo, catupiry, pêssego, figo, abacaxi, cereja', 54, 57],
  ['Camarão', 'Molho, mussarela, camarão, tomate, azeitona, orégano', 67, 73],
  ['Camarão c/ Catupiry', 'Molho, mussarela, camarão, catupiry, tomate, azeitona, orégano', 71, 77],
  ['Carne Seca', 'Mussarela, carne seca, tomate, azeitona, orégano', 63, 67],
  ['Creme de Milho', 'Molho, mussarela, creme de milho, batata palha, tomate, azeitona, orégano', 53, 57],
  ['Escarola', 'Molho, mussarela, escarola, tomate, azeitona, orégano', 49, 54],
  ['Filé-Mignon', 'Molho, mussarela, filé-mignon, champignon, tomate, azeitona, orégano', 65, 69],
  ['Filé-Mignon c/ Catupiry', 'Molho, mussarela, filé-mignon, catupiry, champignon, cebola, tomate, azeitona, orégano', 68, 72],
  ['Frango c/ Catupiry', 'Molho, mussarela, frango desfiado, catupiry, tomate, azeitona, orégano', 53, 56],
  ['Lombo c/ Catupiry', 'Molho, mussarela, lombo canadense, catupiry, cebola, tomate, azeitona, orégano', 54, 59],
  ['Marguerita', 'Molho, mussarela, parmesão, manjericão, tomate, azeitona, orégano', 53, 56],
  ['Milho Verde', 'Molho, mussarela, milho verde, tomate, azeitona, orégano', 49, 54],
  ['Moda da Casa', 'Monte a sua pizza em 4 sabores', 58, 63],
  ['Mussarela', 'Molho, mussarela, tomate, azeitona, orégano', 48, 53],
  ['Napolitana', 'Molho, mussarela, parmesão, champignon, cebola, tomate, azeitona, orégano', 54, 57],
  ['Nova Portuguesa', 'Molho, mussarela, peito de perú, aliche, ovo, cebola, tomate, azeitona, orégano', 62, 65],
  ['Palmito', 'Molho, mussarela, palmito, champignon, tomate, azeitona, orégano', 54, 57],
  ['Palmito Especial', 'Molho, mussarela, palmito, cheddar, bacon, cebola, tomate, azeitona, orégano', 57, 60],
  ['Pepperoni', 'Molho, mussarela, pepperoni, tomate, azeitona, orégano', 56, 60],
  ['Portuguesa', 'Molho, mussarela, presunto, palmito, ovo, ervilha, cebola, tomate, azeitona, orégano', 56, 60],
  ['Rúcula', 'Molho, mussarela, parmesão, tomate seco, rúcula, tomate, azeitona, orégano', 53, 57],
  ['Salame', 'Molho, mussarela, salame, tomate, azeitona, orégano', 57, 62],
  ['Strogonoff Carne', 'Molho, mussarela, strogonoff, champignon, tomate, azeitona, orégano', 65, 69],
  ['Strogonoff Frango', 'Molho, mussarela, strogonoff, champignon, tomate, azeitona, orégano', 62, 66]
];

// Sabores disponíveis para montar a "Moda da Casa" (todas as pizzas salgadas do cardápio).
// ⚠ Confirmar com o restaurante se há restrição de sabores na Moda da Casa.
const MODA_DA_CASA_SABORES = PIZZAS_SALGADAS_DATA.map((p) => p[0]).filter((n) => n !== 'Moda da Casa');

/* =========================================================
   CATEGORIAS E PRODUTOS
   ========================================================= */
const MENU = [
  {
    id: 'pratos-executivos',
    name: 'Pratos Executivos',
    icon: '🍽️',
    products: [
      single('exec', 'Strogonoff de Carne', 'Acompanha arroz e batata palha', 103),
      single('exec', 'Strogonoff de Frango', 'Acompanha arroz e batata palha', 83),
      single('exec', 'Filé-Mignon à Parmegiana', 'Acompanha arroz e batatas fritas', 120),
      single('exec', 'Frango à Parmegiana', 'Acompanha arroz e batatas fritas', 92),
      single('exec', 'Filé-Mignon Grelhado', 'Acompanha arroz e batatas fritas', 108),
      single('exec', 'Frango Grelhado', 'Acompanha arroz e batatas fritas', 75),
      single('exec', 'Picanha Fatiada', 'Acompanha arroz e batatas fritas', 135)
    ]
  },
  {
    id: 'porcoes',
    name: 'Porções',
    icon: '🍟',
    note: 'Preços: Meia | Inteira',
    products: [
      sized('porc', 'Anéis de Cebola', '', SIZE_PORCAO, [29, 35]),
      sized('porc', 'Calabresa Acebolada', '', SIZE_PORCAO, [41, 47]),
      sized('porc', 'Contra Filé Acebolado', '', SIZE_PORCAO, [66, 77]),
      sized('porc', 'Frango à Passarinho', '', SIZE_PORCAO, [41, 47]),
      sized('porc', 'Fritas Completa', '', SIZE_PORCAO, [37, 44]),
      sized('porc', 'Fritas Simples', '', SIZE_PORCAO, [28, 33]),
      sized('porc', 'Frios', '', SIZE_PORCAO, [53, 62]),
      sized('porc', 'Tilápia', '', SIZE_PORCAO, [49, 59]),
      sized('porc', 'Provolone à Milanesa', '', SIZE_PORCAO, [44, 52]),
      sized('porc', 'Picanha', '', SIZE_PORCAO, [88, 102]),
      sized('porc', 'Torresmo', 'Disponível somente porção inteira', ['Inteira'], [35])
    ]
  },
  {
    id: 'batatas-recheadas',
    name: 'Batatas Recheadas',
    icon: '🥔',
    products: [
      single('bat', 'Batata Recheada – Recheios Pizzas e Pastéis',
        'Escolha qualquer sabor do menu de pizzas e pastéis, exceto os recheios especiais', 31, {
          textFields: [{ id: 'recheio', label: 'Sabor do recheio', placeholder: 'Ex.: Calabresa, Portuguesa…' }]
        }),
      single('bat', 'Batata Recheada – Especiais',
        'Camarão, Bacalhau, Carne Seca, Costela, Strogonoff de Carne, Strogonoff de Frango, Filé-Mignon, 3 Queijos, 4 Queijos e 5 Queijos', 37, {
          choices: [{ id: 'recheio', label: 'Recheio especial', options: BATATA_ESPECIAIS }]
        })
    ]
  },
  {
    id: 'massas',
    name: 'Massas',
    icon: '🍝',
    products: [
      single('massa', 'Lasanha', 'Bolognesa, Beringela, Camarão, Frango ou 4 Queijos', 40, {
        choices: [{ id: 'sabor', label: 'Sabor', options: ['Bolognesa', 'Beringela', 'Camarão', 'Frango', '4 Queijos'] }]
      }),
      single('massa', 'Espaguete', 'Bolognesa, Alho e Óleo ou Molho Branco c/ Brócolis e Bacon', 40, {
        choices: [{ id: 'sabor', label: 'Sabor', options: ['Bolognesa', 'Alho e Óleo', 'Molho Branco c/ Brócolis e Bacon'] }]
      }),
      single('massa', 'Panquecas', 'Carne, Frango c/ Catupiry, Palmito, Frios, Sensação ou Banana', 30, {
        choices: [{ id: 'sabor', label: 'Sabor', options: ['Carne', 'Frango c/ Catupiry', 'Palmito', 'Frios', 'Sensação', 'Banana'] }]
      })
    ]
  },
  {
    id: 'esfihas',
    name: 'Esfihas',
    icon: '🥟',
    products: [
      single('esf', 'Esfiha Salgada', ESFIHA_SALGADA_SABORES.join(', '), 14, {
        choices: [{ id: 'sabor', label: 'Sabor', options: ESFIHA_SALGADA_SABORES }]
      }),
      single('esf', 'Esfiha Doce', ESFIHA_DOCE_SABORES.join(', '), 14, {
        choices: [{ id: 'sabor', label: 'Sabor', options: ESFIHA_DOCE_SABORES }]
      })
    ]
  },
  {
    id: 'pasteis-tradicionais',
    name: 'Pastéis Tradicionais',
    icon: '🥠',
    note: 'Preços: Feira | Grande | Gigante',
    products: [
      ['Carne'], ['Carne e Queijo'], ['Frango c/ Catupiry'],
      ['Palmito c/ Catupiry'], ['Presunto e Queijo'], ['Queijo']
    ].map(([n]) => sized('pastrad', n, '', SIZE_PASTEL, [26, 29, 32]))
  },
  {
    id: 'pasteis-salgados',
    name: 'Pastéis Salgados',
    icon: '🥠',
    note: 'Preços: Feira | Grande | Gigante',
    products: [
      ['3 Queijos', 'Mussarela, catupiry, provolone, tomate', 28, 31, 34],
      ['Atum', 'Mussarela, atum, catupiry', 27, 31, 35],
      ['Bauru', 'Mussarela, carne, tomate, cebola, azeitona, presunto', 30.5, 34, 37],
      ['Brócolis 1', 'Mussarela, brócolis, bacon, tomate, azeitona, catupiry', 28.5, 32, 35.5],
      ['Brócolis 2', 'Mussarela, brócolis, champignon, tomate, milho', 29.5, 33, 36.5],
      ['Calabresa', 'Mussarela, calabresa, tomate, cebola', 28, 31.5, 35],
      ['Camarão', 'Mussarela, creme de camarão', 33.5, 35.5, 38.5],
      ['Carne 1', 'Carne, catupiry, tomate, cebola, azeitona', 30.5, 33.5, 36.5],
      ['Carne 2', 'Carne, tomate, azeitona, cebola', 27.5, 31.5, 34.5],
      ['Carne 3', 'Carne, champignon, cebola, tomate', 29, 32.5, 36],
      ['Carne 4', 'Carne, ervilha, milho, azeitona, cebola, tomate', 27.5, 31.5, 36.5],
      ['Carne 5', 'Mussarela, carne, azeitona, cebola, tomate, bacon, ovo, presunto', 30.5, 33, 37],
      ['Carne 6', 'Mussarela, carne, palmito, azeitona, cebola, tomate', 28, 31.5, 35],
      ['Carne Paulista', 'Carne, calabresa, ovo, azeitona, cebola, tomate', 29.5, 33, 36],
      ['Carne Seca', 'Mussarela, carne seca, catupiry', 33.5, 35.5, 38.5],
      ['Costela', 'Mussarela, costela, catupiry', 33.5, 35.5, 38.5],
      ['Escarola', 'Mussarela, escarola, milho, catupiry', 26, 29, 33],
      ['Frango 1', 'Mussarela, frango, ervilha, milho, azeitona, tomate, bacon', 29, 32.5, 35],
      ['Frango 2', 'Frango, champignon, catupiry, ervilha, tomate', 30, 34, 36],
      ['Lombinho', 'Mussarela, lombo, cebola, tomate, catupiry', 28.5, 32.5, 35],
      ['Milho c/ Mussarela', '', 27.5, 30.5, 32.5],
      ['Milho c/ Catupiry', '', 28.5, 31.5, 33.5],
      ['Mussarela', 'Mussarela, alho, tomate', 27, 30, 33],
      ['Napolitano', 'Mussarela, parmesão, tomate, azeitona', 29.5, 33, 35],
      ['Pizza', 'Mussarela, presunto, tomate, ovo, orégano', 27, 30, 34],
      ['Pizza Americano', 'Mussarela, presunto, ovo, tomate, champignon, palmito', 29.5, 33, 36],
      ['Pizza c/ Alcaparra', 'Mussarela, presunto, ovo, tomate, alcaparra', 28, 31, 35],
      ['Queijo Especial', 'Mussarela, bacon, tomate', 27, 30, 33],
      ['Vegetariano', 'Mussarela, brócolis, palmito, champignon, azeitona, ervilha, milho', 29, 32.5, 35.5]
    ].map(([n, d, a, b, c]) => sized('passal', n, d, SIZE_PASTEL, [a, b, c]))
  },
  {
    id: 'pasteis-doces',
    name: 'Pastéis Doces',
    icon: '🍫',
    note: 'Preços: Feira | Grande | Gigante',
    products: [
      sized('pasdoc', 'Banana', 'c/ Canela e leite condensado e c/ doce de leite', SIZE_PASTEL, [25.5, 28, 30.5]),
      sized('pasdoc', 'Chocolate', 'Ao leite, branco, com morango ou mesclado', SIZE_PASTEL, [27, 30, 33.5], {
        choices: [{ id: 'sabor', label: 'Opção', options: ['Ao leite', 'Branco', 'Com morango', 'Mesclado'] }]
      }),
      sized('pasdoc', 'Romeu e Julieta', '', SIZE_PASTEL, [25.5, 28, 30.5]),
      sized('pasdoc', 'Goiabada c/ Catupiry', '', SIZE_PASTEL, [25.5, 28, 30.5]),
      sized('pasdoc', 'Nutella', 'c/ morango ou c/ beijinho', SIZE_PASTEL, [28, 32, 34.5], {
        choices: [{ id: 'sabor', label: 'Opção', options: ['c/ Morango', 'c/ Beijinho'] }]
      })
    ]
  },
  {
    id: 'pizzas-salgadas',
    name: 'Pizzas Salgadas',
    icon: '🍕',
    note: 'Preços: Média | Grande',
    products: PIZZAS_SALGADAS_DATA.map(([n, d, m, g]) =>
      sized('pizsal', n, d, SIZE_PIZZA, [m, g],
        n === 'Moda da Casa'
          ? { choices: [{ id: 'sabores', label: 'Escolha os 4 sabores', options: MODA_DA_CASA_SABORES, count: 4 }] }
          : {})
    )
  },
  {
    id: 'pizzas-doces',
    name: 'Pizzas Doces',
    icon: '🍓',
    note: 'Preços: Média | Grande',
    products: [
      sized('pizdoc', 'Banana', 'c/ Doce de Leite ou Chocolate', SIZE_PIZZA, [47, 49], {
        choices: [{ id: 'sabor', label: 'Opção', options: ['c/ Doce de Leite', 'c/ Chocolate'] }]
      }),
      sized('pizdoc', 'Chocolate', 'c/ morango, cereja ou abacaxi / Prestígio / Confete', SIZE_PIZZA, [49, 52], {
        choices: [{ id: 'sabor', label: 'Opção', options: ['c/ Morango', 'c/ Cereja', 'c/ Abacaxi', 'Prestígio', 'Confete'] }]
      }),
      sized('pizdoc', 'Chocolate Branco', 'c/ kiwi', SIZE_PIZZA, [51, 54]),
      sized('pizdoc', 'Romeu e Julieta', '', SIZE_PIZZA, [45, 48])
    ]
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    icon: '🥤',
    products: [
      single('beb', 'Água c/ Gás', '', 4.5),
      single('beb', 'Água s/ Gás', '', 3.5),
      single('beb', 'Cerveja Antarctica BOA 600ml', '', 16),
      single('beb', 'Cerveja Antarctica Original 600ml', '', 17),
      single('beb', 'Cerveja Brahma 600ml', '', 16),
      single('beb', 'Cerveja Sub-Zero 600ml', '', 13),
      single('beb', 'Cerveja Heineken 600ml', '', 19),
      single('beb', 'Cerveja 350ml', '', 8),
      single('beb', 'Chopp 300ml', '', 12),
      single('beb', 'Chopp 500ml', '', 14),
      single('beb', 'Chopp 600ml', '', 19),
      single('beb', 'Chopp Vinho', '', 16),
      single('beb', 'Malzbier / Cerveja sem álcool', '', 12, {
        choices: [{ id: 'tipo', label: 'Escolha', options: ['Malzbier', 'Cerveja sem álcool'] }]
      }),
      single('beb', 'Suco – Copo', 'Informe o sabor desejado nas observações', 12),
      single('beb', 'Suco – Jarra', 'Informe o sabor desejado nas observações', 16),
      single('beb', 'Refrigerante Lata / KS', 'Informe a marca/sabor nas observações', 8, {
        choices: [{ id: 'tipo', label: 'Embalagem', options: ['Lata', 'KS'] }]
      }),
      single('beb', 'Refrigerante 600ml', 'Informe a marca/sabor nas observações', 12),
      single('beb', 'Refrigerante 2L', 'Informe a marca/sabor nas observações', 16),
      single('beb', 'Tônica / H2O', '', 9, {
        choices: [{ id: 'tipo', label: 'Escolha', options: ['Tônica', 'H2O'] }]
      })
    ]
  }
];

/** Índice rápido id -> produto (usado pelo carrinho para recalcular preços). */
const PRODUCT_INDEX = {};
MENU.forEach((cat) => cat.products.forEach((p) => {
  p.categoryId = cat.id;
  p.categoryName = cat.name;
  PRODUCT_INDEX[p.id] = p;
}));
