# Pizzaria Tavares — Cardápio Digital com Pedido via WhatsApp

Site estático (HTML5 + CSS3 + JavaScript puro, sem frameworks e sem backend). O cliente monta o carrinho, escolhe **Entrega** ou **Retirada** e envia o pedido pronto pelo WhatsApp.

## Estrutura
```
index.html          Página única (cabeçalho, hero, como pedir, cardápio, rodapé, carrinho e modais)
css/style.css       Identidade visual (preto/branco da logo) e responsividade
js/config.js        ⚙ CONFIGURAÇÕES: WhatsApp, taxa de entrega, endereço, formas de pagamento + utilitários de moeda
js/products.js      🍕 CARDÁPIO completo (11 categorias, 133 produtos)
js/cart.js          Carrinho: cálculos em centavos, persistência em localStorage
js/checkout.js      Etapas da finalização, validações, mensagem e link do WhatsApp
js/main.js          Interface: cardápio, busca, categorias, modal de produto, carrinho
assets/logo.png     Logo oficial
assets/images/      (vazia) fotos reais dos produtos, quando houver
tests/test.html     Testes automáticos da lógica (resultado no console)
tests/ui-flow.html  Teste automático do fluxo completo da interface (resultado no console)
```

## Como executar localmente
Abra o `index.html` no navegador (clique duplo). Se preferir um servidor local: `python -m http.server` na pasta e acesse `http://localhost:8000`.

## Como configurar (js/config.js)
- `whatsappNumber`: apenas dígitos, 55 + DDD + número. Ex.: (19) 99204-0259 → `'5519992040259'`. **O número atual (5519999999999) é fictício.**
- `deliveryFee`: em centavos (`500` = R$ 5,00).
- `pickupAddress`: endereço para retirada (**atual é fictício**: Rua das Rosas, 123).
- `paymentMethods`: formas aceitas na entrega; `cash: true` ativa a pergunta de troco.

## Como atualizar o cardápio (js/products.js)
- Preço único: `single('prefixo', 'Nome', 'Descrição', 40)` (em reais).
- Com tamanhos: `sized('prefixo', 'Nome', 'Descrição', ['Média','Grande'], [54, 59])`.
- Escolha obrigatória: `{ choices: [{ id: 'sabor', label: 'Sabor', options: [...] }] }`; múltipla com `count: 4`.
- Foto: adicione `image: 'assets/images/arquivo.jpg'` ao produto (use somente fotos reais do produto).

## Funcionalidades
- Busca por nome, ingrediente ou sabor; barra de categorias fixa com destaque da seção atual.
- Modal de produto com tamanho, sabores, campo de recheio, observações e quantidade; validação obrigatória.
- Carrinho (painel lateral + barra flutuante no celular): +/−, remover, esvaziar, subtotal; salvo no localStorage.
- Finalização em etapas: **1ª pergunta = Entrega ou Retirada**.
  - Entrega → endereço (rua, número, bairro obrigatórios) → pagamento (Dinheiro, Pix, Débito, Crédito) → troco somente se Dinheiro (valor validado > total, troco estimado calculado) → revisão.
  - Retirada → direto para a revisão (sem endereço/pagamento/troco).
- Revisão com links para alterar cada etapa; mensagem formatada via `encodeURIComponent` para `wa.me`.
- Após abrir o WhatsApp, o site avisa que é preciso tocar em **Enviar**; o carrinho só é limpo quando o cliente confirma.

## Decisões / pontos a confirmar com o restaurante
1. **WhatsApp e endereço** são fictícios — substituir em `config.js`.
2. **Moda da Casa**: permite escolher 4 sabores entre todas as pizzas salgadas. Confirmar se há restrições.
3. **Batata Recheada (Pizzas e Pastéis)**: o cliente digita o sabor (qualquer sabor exceto especiais).
4. **Banana (pastel doce)**: o cardápio diz "c/ canela e leite condensado e c/ doce de leite" — cadastrado sem escolha; confirmar se são duas opções.
5. **Torresmo**: só porção inteira (R$ 35,00), conforme o cardápio.
6. **Sucos e refrigerantes**: sabores/marcas não informados — o cliente informa nas observações.
7. **Pizzas meio a meio, bordas e adicionais**: não constam no cardápio e não foram implementados.
8. **Horário de funcionamento** e **fotos dos produtos**: não fornecidos; nenhuma foto genérica foi usada.
9. Telefones do rodapé (3582-5100 / 99204-0259) foram retirados da própria logo.

## Publicação
Qualquer hospedagem estática (Genspark Hosted Deploy, Netlify, GitHub Pages, Vercel). Basta enviar a pasta inteira. Ainda não foi publicado.
