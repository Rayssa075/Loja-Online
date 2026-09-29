# 👕 Brothers Vintage – Painel de Gestão para Lojistas (Protótipo)

Painel administrativo para **lojas de roupas vintage**. Nele, o lojista cria a conta da sua loja e controla tudo em um só lugar: **estoque, pedidos, vendas, cupons e frete**.

Cada loja tem os seus **próprios dados**, separados das outras. Assim, várias lojas podem usar o mesmo painel sem misturar informações.

> ⚠️ Este é um projeto de estudo. Os dados ficam salvos no navegador e o login ainda não é seguro para uso real.

---

## ✨ O que ele faz

### 🔐 Acesso
- Cadastro de nova loja (nome da loja, e-mail e senha)
- Login e logout
- Cada lojista vê apenas os dados da sua própria loja
- O nome da loja aparece no topo do painel

### 📊 Visão geral
- Faturamento por período: **diário**, **semanal**, **mensal** ou por **datas escolhidas**
- Total de peças no estoque
- Alerta de **estoque baixo** (tamanhos com 3 unidades ou menos)
- **Meta de faturamento do mês** com barra de progresso
- Gráfico de faturamento dos **últimos 6 meses**

### 👗 Produtos e estoque
- Cadastro de peças com nome, categoria, preço e **várias fotos**
- Estoque separado por tamanho: **P, M, G, GG e Único**
- Categorias que o lojista pode criar e apagar
- Editar, **duplicar** e excluir produtos
- Busca por nome e filtro por categoria
- Etiquetas de cor para estoque baixo e esgotado

### 📦 Pedidos
- Lista de pedidos com cliente, contato, itens, total e forma de pagamento
- Mudança de status: **Pendente → Enviado → Entregue**
- Busca por cliente e filtros por status e por mês
- **Exportar pedidos em CSV** (abre no Excel e no Google Planilhas)
- Sino de notificação com o número de pedidos pendentes

### 📈 Relatórios
- Produtos **mais vendidos** e **menos vendidos**
- Ranking dos **tamanhos mais procurados**
- **Ticket médio**
- **Forma de pagamento favorita**

### ⚙️ Configurações da loja
- Meta de faturamento mensal
- Valor mínimo para **frete grátis** e valor do **frete fixo**
- **Cupons de desconto**, com porcentagem e data de validade (aparecem como ativos ou expirados)
- **Frete por região**, com faixas de CEP e valor para cada uma

### 🎨 Extras
- **Modo escuro**, que fica salvo para cada loja
- Funciona no celular e no computador

---

## 📂 Arquivos

| Arquivo | Para que serve |
|---|---|
| `login.html` | Tela de entrada, com as abas "Entrar" e "Criar minha loja" |
| `painel.html` | Estrutura do painel administrativo |
| `painel.js` | Lógica do painel (estoque, pedidos, relatórios e configurações) |
| `painel.css` | Visual do painel e do modo escuro |
| `auth.js` | Cadastro, login, sessão e separação dos dados de cada loja |
| `firebase-config.js` | Configuração do Firebase, preparada para uma versão futura (ainda não usada) |
| `settings.json` | Configuração do Live Server (porta 5501) |

---

## ▶️ Como usar

1. Baixe todos os arquivos e deixe-os **na mesma pasta**.
2. Abra a pasta no **VS Code** e clique em **Go Live** (extensão Live Server). O projeto está configurado para a porta **5501**.
3. Abra o `login.html`.
4. Na aba **Criar minha loja**, cadastre sua loja.
5. Você será levado ao painel. Pode cadastrar peças, ver pedidos e mudar as configurações.

A primeira vez que uma loja entra, o painel já vem com **2 produtos, 4 pedidos e o cupom `VINTAGE10`** de exemplo, para você testar tudo.

---

## 💾 Como os dados são guardados

Tudo fica no **localStorage** do navegador. Cada loja ganha um código próprio (por exemplo, `lj_1234567890`) e os dados dela são salvos com esse código no nome:

- Produtos
- Pedidos
- Categorias
- Configurações
- Modo escuro

É assim que uma loja não enxerga os dados da outra.

---

## 🛠️ Tecnologias

- **HTML** e **CSS** para as telas
- **JavaScript** puro para toda a lógica
- **localStorage** para guardar os dados
- **Firebase** (Authentication e Firestore) já configurado no arquivo `firebase-config.js`, para a próxima etapa do projeto

---

## ⚠️ Limitações

- Os dados ficam **só no navegador** onde foram criados. Se trocar de computador ou limpar o navegador, eles somem.
- As **senhas são salvas sem proteção** no navegador. Não use senhas reais.
- As fotos são guardadas dentro do navegador, que tem um limite de espaço. Muitas fotos grandes podem encher o armazenamento.
- Os pedidos de exemplo são fixos. Ainda não existe uma loja virtual ligada ao painel para receber pedidos de verdade.
- Os cupons e o frete configurados ainda não são usados por nenhuma loja virtual.

---

## 🚀 Ideias para melhorar

- Trocar o `localStorage` pelo **Firebase** (login seguro e banco de dados na nuvem)
- Guardar as fotos em um serviço de armazenamento, em vez de dentro do navegador
- Criar a **loja virtual** do cliente (o botão "Ver Loja" já aponta para `index.html`)
- Receber pedidos reais e baixar o estoque automaticamente
- Recuperação de senha por e-mail
- Enviar aviso ao cliente quando o pedido mudar de status
- Proteger os textos digitados para que nunca sejam lidos como código
- Gráficos mais completos e relatórios em PDF

---

## 👩‍💻 Autora

**Andressa** – estudante de Engenharia Elétrica (Unifei) e Ciência de Dados (Uninter).
