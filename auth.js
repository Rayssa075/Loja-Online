// =================================================================
// AUTENTICAÇÃO E MULTI-LOJISTA
// Cada lojista tem seu próprio ID e seus próprios dados isolados
// no LocalStorage (produtos, pedidos, categorias, configurações).
// =================================================================

const CHAVE_LOJISTAS = "lojistas_cadastrados";
const CHAVE_SESSAO = "sessao_lojista_ativo";

// --- FUNÇÕES DE ACESSO AOS LOJISTAS CADASTRADOS ---
function obterLojistas() {
    return JSON.parse(localStorage.getItem(CHAVE_LOJISTAS)) || [];
}

function salvarLojistas(lista) {
    localStorage.setItem(CHAVE_LOJISTAS, JSON.stringify(lista));
}

// --- API PÚBLICA DE AUTENTICAÇÃO (usada pelo painel.js e por login.html) ---
window.Auth = {
    // Retorna o ID do lojista logado, ou null se ninguém estiver logado
    getLojaId: function () {
        return localStorage.getItem(CHAVE_SESSAO);
    },

    // Retorna os dados (nome da loja, e-mail) do lojista logado
    getLojaAtual: function () {
        const id = this.getLojaId();
        if (!id) return null;
        return obterLojistas().find(l => l.id === id) || null;
    },

    // Monta uma chave de LocalStorage exclusiva do lojista logado
    // Ex: chave('produtos_loja') -> 'produtos_loja__lj_1234567890'
    chave: function (nomeBase) {
        const id = this.getLojaId();
        return id ? `${nomeBase}__${id}` : nomeBase;
    },

    // Garante que existe um lojista logado; se não, manda pro login
    exigirLogin: function () {
        if (!this.getLojaId()) {
            window.location.href = "login.html";
        }
    },

    // Encerra a sessão e volta pro login
    logout: function () {
        localStorage.removeItem(CHAVE_SESSAO);
        window.location.href = "login.html";
    }
};

// --- CADASTRO DE NOVO LOJISTA ---
function cadastrarLojista(nomeLoja, email, senha) {
    const lojistas = obterLojistas();

    const emailFormatado = email.trim().toLowerCase();
    const jaExiste = lojistas.some(l => l.email === emailFormatado);
    if (jaExiste) {
        return { sucesso: false, erro: "Já existe uma loja cadastrada com esse e-mail." };
    }

    const novoLojista = {
        id: "lj_" + Date.now(),
        nomeLoja: nomeLoja.trim(),
        email: emailFormatado,
        senha: senha // Protótipo (LocalStorage)
    };

    lojistas.push(novoLojista);
    salvarLojistas(lojistas);

    return { sucesso: true, lojista: novoLojista };
}

// --- LOGIN DE LOJISTA EXISTENTE ---
function autenticarLojista(email, senha) {
    const emailFormatado = email.trim().toLowerCase();
    const lojista = obterLojistas().find(l => l.email === emailFormatado && l.senha === senha);

    if (!lojista) {
        return { sucesso: false, erro: "E-mail ou senha incorretos." };
    }

    return { sucesso: true, lojista: lojista };
}

// =================================================================
// LÓGICA EXCLUSIVA DA PÁGINA login.html
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
    const abas = document.querySelectorAll(".auth-aba");
    const formLogin = document.getElementById("form-login");
    const formCadastro = document.getElementById("form-cadastro");

    if (!formLogin || !formCadastro) return; // Não estamos na página de login

    // Se já existe alguém logado, pula direto pro painel
    if (window.Auth.getLojaId()) {
        window.location.href = "painel.html";
        return;
    }

    // --- ALTERNAR ENTRE ABAS "ENTRAR" E "CRIAR MINHA LOJA" ---
    abas.forEach(aba => {
        aba.addEventListener("click", () => {
            abas.forEach(a => a.classList.remove("ativa"));
            aba.classList.add("ativa");

            document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("ativa"));
            document.getElementById(aba.dataset.alvo).classList.add("ativa");
        });
    });

    // --- SUBMIT DO LOGIN ---
    formLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const senha = document.getElementById("login-senha").value;
        const erroEl = document.getElementById("login-erro");

        const resultado = autenticarLojista(email, senha);
        if (!resultado.sucesso) {
            erroEl.textContent = resultado.erro;
            return;
        }

        erroEl.textContent = "";
        localStorage.setItem(CHAVE_SESSAO, resultado.lojista.id);
        window.location.href = "painel.html";
    });

    // --- SUBMIT DO CADASTRO ---
    formCadastro.addEventListener("submit", (e) => {
        e.preventDefault();
        const nomeLoja = document.getElementById("cad-nome-loja").value;
        const email = document.getElementById("cad-email").value;
        const senha = document.getElementById("cad-senha").value;
        const erroEl = document.getElementById("cadastro-erro");

        if (!nomeLoja.trim() || !email.trim() || !senha) {
            erroEl.textContent = "Preencha todos os campos.";
            return;
        }

        const resultado = cadastrarLojista(nomeLoja, email, senha);
        if (!resultado.sucesso) {
            erroEl.textContent = resultado.erro;
            return;
        }

        erroEl.textContent = "";
        localStorage.setItem(CHAVE_SESSAO, resultado.lojista.id);
        window.location.href = "painel.html";
    });
});