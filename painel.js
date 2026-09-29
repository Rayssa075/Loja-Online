// =================================================================
// LÓGICA DO PAINEL ADMINISTRATIVO E CONFIGURAÇÕES
// =================================================================

// --- EXIGE LOGIN ANTES DE QUALQUER COISA ---
window.Auth.exigirLogin();

// --- LIMITE PARA CONSIDERAR ESTOQUE BAIXO ---
const LIMITE_ESTOQUE_BAIXO = 3;

function classeBadgeEstoque(qtd) {
    if (qtd <= 0) return 'esgotado';
    if (qtd <= LIMITE_ESTOQUE_BAIXO) return 'baixo';
    return '';
}

// --- DADOS PADRÃO ---
const produtosPadrao = [
    {
        id: "1",
        nome: "Camisa Polo Piquet Premium",
        categoria: "Camisas Polo",
        preco: 119.90,
        fotos: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=150"],
        estoque: { P: 5, M: 8, G: 4, GG: 2, Unico: 0 }
    },
    {
        id: "2",
        nome: "Boné Snapback Vintage",
        categoria: "Bonés",
        preco: 79.90,
        fotos: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=150"],
        estoque: { P: 0, M: 0, G: 0, GG: 0, Unico: 15 }
    }
];

const pedidosPadrao = [
    { id: "01", codigoCliente: "202606-983421", cliente: "Carlos Silva", contato: "(11) 99999-1111", data: "2026-06-08", itens: "1x Camisa Polo (M)", total: 119.90, pagamento: "Pix", status: "Pendente" },
    { id: "02", codigoCliente: "202606-104857", cliente: "Mariana Souza", contato: "(21) 98888-2222", data: "2026-06-05", itens: "1x Boné Vintage", total: 79.90, pagamento: "Cartão", status: "Enviado" },
    { id: "03", codigoCliente: "202605-774391", cliente: "Pedro Alves", contato: "(19) 97777-3333", data: "2026-05-15", itens: "2x Camisa Polo (G)", total: 239.80, pagamento: "Pix", status: "Entregue" },
    { id: "04", codigoCliente: "202605-465218", cliente: "Fernanda Lima", contato: "(11) 96666-4444", data: "2026-05-10", itens: "1x Conjunto", total: 199.90, pagamento: "Pix", status: "Pendente" }
];

const configuracoesPadrao = {
    freteGratisMinimo: 199.00,
    freteFixo: 15.00,
    metaFaturamentoMensal: 0,
    cupons: [
        { codigo: "VINTAGE10", descontoPct: 10, validade: null }
    ],
    regioesFrete: []
};

// --- INICIALIZAÇÃO DOS DADOS ---
let produtosEstoque = JSON.parse(localStorage.getItem(window.Auth.chave('produtos_loja'))) || produtosPadrao;
let pedidosRecebidos = JSON.parse(localStorage.getItem(window.Auth.chave('pedidos_loja'))) || pedidosPadrao;
let categorias = JSON.parse(localStorage.getItem(window.Auth.chave('categorias_loja'))) || [
    "Camisas Normais", "Camisas Polo", "Camisas de Seleção", "Calças", "Conjuntos", "Bonés"
];
let configSistema = JSON.parse(localStorage.getItem(window.Auth.chave('configuracoes_sistema'))) || configuracoesPadrao;

if (!Array.isArray(configSistema.cupons)) configSistema.cupons = [];
if (!Array.isArray(configSistema.regioesFrete)) configSistema.regioesFrete = [];

if (!localStorage.getItem(window.Auth.chave('pedidos_loja'))) {
    localStorage.setItem(window.Auth.chave('pedidos_loja'), JSON.stringify(pedidosPadrao));
}

let filtroTempoAtual = 'este-mes'; 
let dataInicioPersonalizada = null;
let dataFimPersonalizada = null;

// --- SALVAMENTO E ATUALIZAÇÃO ---
function salvarEAtualizar() {
    localStorage.setItem(window.Auth.chave('produtos_loja'), JSON.stringify(produtosEstoque));
    localStorage.setItem(window.Auth.chave('pedidos_loja'), JSON.stringify(pedidosRecebidos));
    localStorage.setItem(window.Auth.chave('categorias_loja'), JSON.stringify(categorias));
    localStorage.setItem(window.Auth.chave('configuracoes_sistema'), JSON.stringify(configSistema));
    
    atualizarSelectCategorias();
    renderizarTabelaEstoque();
    renderizarTabelaPedidos();
    atualizarCardsPainel();
    atualizarMetaFaturamento();
    renderizarGraficoFaturamentoMensal();
    atualizarBadgeNotificacoes();
}

function atualizarSelectCategorias() {
    const selectCadastro = document.getElementById('categoria-peca');
    const selectModal = document.getElementById('edit-categoria'); 
    
    let opcoes = '<option value="">Selecione uma categoria...</option>';
    categorias.forEach(cat => { opcoes += `<option value="${cat}">${cat}</option>`; });
    
    if (selectCadastro) selectCadastro.innerHTML = opcoes;
    if (selectModal && selectModal.tagName === "SELECT") selectModal.innerHTML = opcoes;

    const selectFiltroEstoque = document.getElementById('filtro-estoque-categoria');
    if (selectFiltroEstoque) {
        const valorSelecionado = selectFiltroEstoque.value || "todas";
        let opcoesFiltro = '<option value="todas">Todas as Categorias</option>';
        categorias.forEach(cat => { opcoesFiltro += `<option value="${cat}">${cat}</option>`; });
        selectFiltroEstoque.innerHTML = opcoesFiltro;
        selectFiltroEstoque.value = valorSelecionado;
    }
}

function adicionarCategoria() {
    const novaCat = prompt("Digite o nome da nova categoria:");
    if (!novaCat) return;
    const nomeFormatado = novaCat.trim();
    if (!nomeFormatado) return;

    if (categorias.map(c => c.toLowerCase()).includes(nomeFormatado.toLowerCase())) {
        alert("Esta categoria já existe!");
        return;
    }
    categorias.push(nomeFormatado);
    salvarEAtualizar();
}

function removerCategoria() {
    const selectCadastro = document.getElementById('categoria-peca');
    if (!selectCadastro) return;
    const categoriaSelecionada = selectCadastro.value;
    if (!categoriaSelecionada) {
        alert("Por favor, selecione uma categoria na lista para poder excluí-la.");
        return;
    }
    if (confirm(`Tem certeza que deseja remover a categoria "${categoriaSelecionada}"?`)) {
        categorias = categorias.filter(cat => cat !== categoriaSelecionada);
        salvarEAtualizar();
    }
}

function lerArquivosComoBase64(fileList) {
    const arquivos = Array.from(fileList || []);
    const leituras = arquivos.map(arquivo => new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve(leitor.result);
        leitor.onerror = reject;
        leitor.readAsDataURL(arquivo);
    }));
    return Promise.all(leituras);
}

async function cadastrarNovoProduto(event) {
    if (event) event.preventDefault();

    const nomeInput = document.getElementById('nome-peca');
    const precoInput = document.getElementById('preco-peca');
    const categoriaSelect = document.getElementById('categoria-peca');

    const nome = nomeInput ? nomeInput.value.trim() : "";
    const preco = precoInput ? parseFloat(precoInput.value) : 0;
    const categoria = categoriaSelect ? categoriaSelect.value : "";

    if (!nome || !preco || !categoria) {
        alert("Por favor, preencha o nome, categoria e o preço da peça!");
        return;
    }

    const qtdP = parseInt(document.getElementById('qtd-p')?.value) || 0;
    const qtdM = parseInt(document.getElementById('qtd-m')?.value) || 0;
    const qtdG = parseInt(document.getElementById('qtd-g')?.value) || 0;
    const qtdGG = parseInt(document.getElementById('qtd-gg')?.value) || 0;
    const qtdUnico = parseInt(document.getElementById('qtd-unico')?.value) || 0;

    const inputFoto = document.getElementById('foto-peca');
    const fotoPadrao = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=150";
    let fotos = [fotoPadrao];

    if (inputFoto && inputFoto.files && inputFoto.files.length > 0) {
        fotos = await lerArquivosComoBase64(inputFoto.files);
    }

    const novoProduto = {
        id: String(Date.now()), 
        nome: nome,
        categoria: categoria, 
        preco: preco,
        fotos: fotos,
        estoque: { P: qtdP, M: qtdM, G: qtdG, GG: qtdGG, Unico: qtdUnico }
    };

    produtosEstoque.push(novoProduto);
    salvarEAtualizar();

    const formCadastrarPeca = document.getElementById('form-cadastrar-peca');
    if (formCadastrarPeca) formCadastrarPeca.reset();
    alert("Peça cadastrada com sucesso!");
}

function obterPedidosFiltradosPorTempo() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return pedidosRecebidos.filter(pedido => {
        if (!pedido.data) return false;
        const partes = pedido.data.split('-');
        const dataPedido = new Date(partes[0], partes[1] - 1, partes[2]);
        dataPedido.setHours(0, 0, 0, 0);

        if (filtroTempoAtual === 'hoje') {
            return dataPedido.getDate() === hoje.getDate() && 
                   dataPedido.getMonth() === hoje.getMonth() && 
                   dataPedido.getFullYear() === hoje.getFullYear();
        } 
        if (filtroTempoAtual === '7-dias') {
            const limiteSeteDias = new Date(hoje.getTime() - (7 * 24 * 60 * 60 * 1000));
            return dataPedido >= limiteSeteDias && dataPedido <= hoje;
        } 
        if (filtroTempoAtual === 'este-mes') {
            return dataPedido.getMonth() === hoje.getMonth() && dataPedido.getFullYear() === hoje.getFullYear();
        } 
        if (filtroTempoAtual === 'personalizado') {
            if (!dataInicioPersonalizada || !dataFimPersonalizada) return true;
            const pInicio = dataInicioPersonalizada.split('-');
            const pFim = dataFimPersonalizada.split('-');
            const inicio = new Date(pInicio[0], pInicio[1] - 1, pInicio[2]);
            const fim = new Date(pFim[0], pFim[1] - 1, pFim[2]);
            inicio.setHours(0, 0, 0, 0);
            fim.setHours(23, 59, 59, 999);
            return dataPedido >= inicio && dataPedido <= fim;
        }
        return true;
    });
}

function atualizarCardsPainel() {
    const cardTotalEstoque = document.getElementById('total-estoque');
    if (cardTotalEstoque) {
        let totalPecasFisicas = 0;
        produtosEstoque.forEach(p => {
            if (p.estoque) {
                totalPecasFisicas += (parseInt(p.estoque.P) || 0) + (parseInt(p.estoque.M) || 0) + 
                                     (parseInt(p.estoque.G) || 0) + (parseInt(p.estoque.GG) || 0) + 
                                     (parseInt(p.estoque.Unico) || 0);
            }
        });
        cardTotalEstoque.textContent = totalPecasFisicas;
    }

    const cardEstoqueBaixo = document.getElementById('qtd-estoque-baixo');
    if (cardEstoqueBaixo) {
        let contagemBaixo = 0;
        produtosEstoque.forEach(p => {
            if (!p.estoque) return;
            ['P', 'M', 'G', 'GG', 'Unico'].forEach(tam => {
                const qtd = parseInt(p.estoque[tam]) || 0;
                if (qtd > 0 && qtd <= LIMITE_ESTOQUE_BAIXO) contagemBaixo++;
            });
        });
        cardEstoqueBaixo.textContent = contagemBaixo;
    }

    const pedidosFiltrados = obterPedidosFiltradosPorTempo();
    let faturamentoTotal = 0;
    let totalVendas = pedidosRecebidos.length;
    let totalVendasPeriodo = pedidosFiltrados.length;
    
    let pendentes = 0, enviados = 0, entregues = 0;
    pedidosRecebidos.forEach(p => {
        if (p.status === "Pendente") pendentes++;
        else if (p.status === "Enviado") enviados++;
        else if (p.status === "Entregue") entregues++;
    });

    const contagemProdutos = {};
    const contagemTamanhos = { P: 0, M: 0, G: 0, GG: 0, Unico: 0 };
    const contagemPagamentos = {};
    let totalItensVendidos = 0;

    pedidosFiltrados.forEach(pedido => {
        faturamentoTotal += parseFloat(pedido.total) || 0;
        if (pedido.pagamento) {
            contagemPagamentos[pedido.pagamento] = (contagemPagamentos[pedido.pagamento] || 0) + 1;
        }
        if (pedido.itens) {
            const itensSeparados = pedido.itens.split(/[,\n]/);
            itensSeparados.forEach(itemStr => {
                const termo = itemStr.trim();
                if (!termo) return;
                const match = termo.match(/^(\d+)x\s+(.+?)(?:\s*\((.*?)\))?$/);
                if (match) {
                    const qtd = parseInt(match[1]) || 1;
                    const nomeProd = match[2].trim();
                    const tamanho = match[3] ? match[3].trim().toUpperCase() : null;

                    totalItensVendidos += qtd;
                    contagemProdutos[nomeProd] = (contagemProdutos[nomeProd] || 0) + qtd;

                    if (tamanho && contagemTamanhos[tamanho] !== undefined) {
                        contagemTamanhos[tamanho] += qtd;
                    } else if (!tamanho || tamanho === "ÚNICO" || tamanho === "UNICO" || tamanho === "ÚN") {
                        contagemTamanhos["Unico"] += qtd;
                    }
                }
            });
        }
    });

    let ticketMedio = totalVendasPeriodo > 0 ? faturamentoTotal / totalVendasPeriodo : 0;

    const elFaturamento = document.getElementById('faturamento-total');
    const elTotalVendas = document.getElementById('qtd-pedidos-totais');
    const elTicketMedioCard = document.getElementById('ticket-medio'); 
    const elPedidosPendentes = document.getElementById('qtd-pedidos-pendentes');
    const elPedidosConcluidos = document.getElementById('qtd-pedidos-concluidos');

    if (elFaturamento) elFaturamento.textContent = `R$ ${faturamentoTotal.toFixed(2).replace('.', ',')}`;
    if (elTotalVendas) elTotalVendas.textContent = totalVendas;
    if (elTicketMedioCard) elTicketMedioCard.textContent = `R$ ${ticketMedio.toFixed(2).replace('.', ',')}`;
    if (elPedidosPendentes) elPedidosPendentes.textContent = pendentes;
    if (elPedidosConcluidos) elPedidosConcluidos.textContent = `🚚 ${enviados} | 🏁 ${entregues}`;

    if (elFaturamento) {
        const elLabel = elFaturamento.nextElementSibling;
        if (elLabel && elLabel.tagName === 'SPAN') {
            const nomesFiltros = { 
                'hoje': 'Diário', 
                '7-dias': 'Semanal', 
                'este-mes': 'Mensal', 
                'personalizado': 'Personalizado' 
            };
            elLabel.textContent = `Período: ${nomesFiltros[filtroTempoAtual] || 'Mensal'}`;
        }
    }

    const elTicketMedioReal = document.getElementById('ticket-medio-real');
    if (elTicketMedioReal) {
        elTicketMedioReal.textContent = `R$ ${ticketMedio.toFixed(2).replace('.', ',')}`;
    }

    const elFormaPagamento = document.getElementById('forma-pagamento-favorita');
    if (elFormaPagamento) {
        let melhorMetodo = "Nenhum";
        let maxMetodoQtd = 0;
        for (const [metodo, qtd] of Object.entries(contagemPagamentos)) {
            if (qtd > maxMetodoQtd) {
                maxMetodoQtd = qtd;
                melhorMetodo = metodo;
            }
        }
        let percentualPagamento = totalVendas > 0 ? Math.round((maxMetodoQtd / totalVendas) * 100) : 0;
        elFormaPagamento.innerHTML = totalVendas > 0 ? `${melhorMetodo} <span style="font-size:12px; font-weight:normal; color:#666;">(${percentualPagamento}%)</span>` : "Nenhum";
    }

    const listaProdutosOrdenada = Object.entries(contagemProdutos).sort((a, b) => b[1] - a[1]);
    const maxVendasDeUmProduto = listaProdutosOrdenada.length > 0 ? listaProdutosOrdenada[0][1] : 1;

    const containerMaisVendidos = document.getElementById('lista-mais-vendidos');
    if (containerMaisVendidos) {
        containerMaisVendidos.innerHTML = '';
        const maisVendidos = listaProdutosOrdenada.slice(0, 2);
        if (maisVendidos.length === 0) {
            containerMaisVendidos.innerHTML = `<div style="color:#888; font-size:13px; padding: 5px 0;">Nenhuma venda no período.</div>`;
        } else {
            maisVendidos.forEach((prod, index) => {
                const nome = prod[0];
                const qtd = prod[1];
                const pctBarra = Math.round((qtd / maxVendasDeUmProduto) * 100);
                containerMaisVendidos.innerHTML += `
                    <div class="item-ranking" style="margin-bottom: 12px;">
                        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
                            <span>${index + 1}. ${nome}</span>
                            <b style="margin-left: auto;">${qtd} vendas</b>
                        </div>
                        <div style="width:100%; background:#e9ecef; height:6px; border-radius:3px; overflow:hidden;">
                            <div style="width:${pctBarra}%; background:#28a745; height:100%;"></div>
                        </div>
                    </div>
                `;
            });
        }
    }

    const containerMenosVendidos = document.getElementById('lista-menos-vendidos');
    if (containerMenosVendidos) {
        containerMenosVendidos.innerHTML = '';
        const todosProdutosEstoque = produtosEstoque.map(p => p.nome);
        const contagemCompleta = {};
        todosProdutosEstoque.forEach(nome => { contagemCompleta[nome] = contagemProdutos[nome] || 0; });
        const listaCompletaOrdenada = Object.entries(contagemCompleta).sort((a, b) => a[1] - b[1]);
        const menosVendidos = listaCompletaOrdenada.slice(0, 2);
        
        if (menosVendidos.length === 0 || todosProdutosEstoque.length === 0) {
            containerMenosVendidos.innerHTML = `<div style="color:#888; font-size:13px; padding: 5px 0;">Nenhum produto cadastrado.</div>`;
        } else {
            menosVendidos.forEach((prod, index) => {
                const nome = prod[0];
                const qtd = prod[1];
                containerMenosVendidos.innerHTML += `
                    <div class="item-ranking" style="margin-bottom: 12px;">
                        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
                            <span>${index + 1}. ${nome}</span>
                            <b style="margin-left: auto;">${qtd} vendas</b>
                        </div>
                        <div style="width:100%; background:#e9ecef; height:6px; border-radius:3px; overflow:hidden;">
                            <div style="width:${qtd > 0 ? 15 : 5}%; background:#fd7e14; height:100%;"></div>
                        </div>
                    </div>
                `;
            });
        }
    }

    const listaTamanhosOrdenada = Object.entries(contagemTamanhos).sort((a, b) => b[1] - a[1]);
    const containerTamanhos = document.getElementById('lista-tamanhos-ranking');
    if (containerTamanhos) {
        containerTamanhos.innerHTML = '';
        let indexRanking = 1;
        listaTamanhosOrdenada.forEach(([tam, qtd]) => {
            let pctTamanho = totalItensVendidos > 0 ? Math.round((qtd / totalItensVendidos) * 100) : 0;
            const nomeExibicao = tam === "Unico" ? "Único" : `Tamanho ${tam}`;
            containerTamanhos.innerHTML += `
                <div class="item-ranking" style="margin-bottom: 12px;">
                    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
                        <span>${indexRanking}° Lugar: ${nomeExibicao}</span>
                        <b style="margin-left: auto;">${pctTamanho}%</b>
                    </div>
                    <div style="width:100%; background:#e9ecef; height:6px; border-radius:3px; overflow:hidden;">
                        <div style="width:${pctTamanho}%; background:#007bff; height:100%;"></div>
                    </div>
                </div>
            `;
            indexRanking++;
        });
    }
}

function atualizarMetaFaturamento() {
    const textoAtual = document.getElementById('meta-texto-atual');
    const textoPercentual = document.getElementById('meta-texto-percentual');
    const barra = document.getElementById('meta-barra-progresso');
    if (!textoAtual || !textoPercentual || !barra) return;

    const hoje = new Date();
    const faturamentoDoMes = pedidosRecebidos.reduce((soma, pedido) => {
        if (!pedido.data) return soma;
        const partes = pedido.data.split('-');
        const dataPedido = new Date(partes[0], partes[1] - 1, partes[2]);
        const mesmoMes = dataPedido.getMonth() === hoje.getMonth() && dataPedido.getFullYear() === hoje.getFullYear();
        return mesmoMes ? soma + (parseFloat(pedido.total) || 0) : soma;
    }, 0);

    const meta = configSistema.metaFaturamentoMensal || 0;
    const percentual = meta > 0 ? Math.min(100, Math.round((faturamentoDoMes / meta) * 100)) : 0;

    const formatoBRL = valor => `R$ ${valor.toFixed(2).replace('.', ',')}`;
    textoAtual.textContent = `${formatoBRL(faturamentoDoMes)} de ${formatoBRL(meta)}`;
    textoPercentual.textContent = `${percentual}%`;
    barra.style.width = `${percentual}%`;
    barra.style.backgroundColor = percentual >= 100 ? '#28a745' : (percentual >= 50 ? '#ffc107' : '#fd7e14');
}

function renderizarGraficoFaturamentoMensal() {
    const container = document.getElementById('grafico-faturamento-mensal');
    if (!container) return;

    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const hoje = new Date();

    const meses = [];
    for (let i = 5; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        meses.push({ mes: data.getMonth(), ano: data.getFullYear(), total: 0 });
    }

    pedidosRecebidos.forEach(pedido => {
        if (!pedido.data) return;
        const partes = pedido.data.split('-');
        const dataPedido = new Date(partes[0], partes[1] - 1, partes[2]);
        const alvo = meses.find(m => m.mes === dataPedido.getMonth() && m.ano === dataPedido.getFullYear());
        if (alvo) alvo.total += parseFloat(pedido.total) || 0;
    });

    const maiorValor = Math.max(...meses.map(m => m.total), 1);

    container.innerHTML = meses.map(m => {
        const alturaPct = Math.round((m.total / maiorValor) * 100);
        const ehMesAtual = m.mes === hoje.getMonth() && m.ano === hoje.getFullYear();
        return `
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">
                <span style="font-size:11px; color:#555; margin-bottom:4px;">R$ ${m.total.toFixed(0)}</span>
                <div style="width:70%; height:${Math.max(alturaPct, 2)}%; background:${ehMesAtual ? '#6f42c1' : '#a389d4'}; border-radius:4px 4px 0 0;"></div>
                <span style="font-size:12px; color:#333; margin-top:6px; font-weight:${ehMesAtual ? '700' : '400'};">${nomesMeses[m.mes]}</span>
            </div>
        `;
    }).join('');
}

function exportarPedidosCSV() {
    const pedidos = window._pedidosFiltradosAtuais || pedidosRecebidos;
    if (!pedidos || pedidos.length === 0) {
        alert("Não há pedidos para exportar com os filtros atuais.");
        return;
    }

    const cabecalho = ["ID", "Cliente", "Contato", "Data", "Itens", "Total (R$)", "Pagamento", "Status"];
    const escapar = valor => `"${String(valor ?? "").replace(/"/g, '""')}"`;
    const linhas = pedidos.map(p => [
        p.id, p.cliente, p.contato, p.data, p.itens,
        (parseFloat(p.total) || 0).toFixed(2).replace('.', ','),
        p.pagamento, p.status
    ].map(escapar).join(";"));

    const conteudoCSV = "\uFEFF" + cabecalho.map(escapar).join(";") + "\n" + linhas.join("\n");
    const blob = new Blob([conteudoCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dataArquivo = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `pedidos_${dataArquivo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function atualizarBadgeNotificacoes() {
    const badge = document.getElementById('badge-notificacoes');
    if (!badge) return;
    const qtdPendentes = pedidosRecebidos.filter(p => p.status === "Pendente").length;
    if (qtdPendentes > 0) {
        badge.textContent = qtdPendentes > 99 ? "99+" : qtdPendentes;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function renderizarTabelaEstoque() {
    const corpoTabela = document.getElementById('corpo-tabela-estoque');
    if (!corpoTabela) return;
    corpoTabela.innerHTML = '';

    const inputBusca = document.getElementById('busca-estoque-produto');
    const termoBusca = inputBusca ? inputBusca.value.trim().toLowerCase() : "";
    const selectCategoria = document.getElementById('filtro-estoque-categoria');
    const categoriaEscolhida = selectCategoria ? selectCategoria.value : "todas";

    const produtosFiltrados = produtosEstoque.filter(produto => {
        if (termoBusca && !(produto.nome || "").toLowerCase().includes(termoBusca)) return false;
        if (categoriaEscolhida !== "todas" && produto.categoria !== categoriaEscolhida) return false;
        return true;
    });

    if (produtosEstoque.length > 0 && produtosFiltrados.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#666;">Nenhum produto encontrado para os filtros aplicados.</td></tr>`;
        return;
    }

    produtosFiltrados.forEach(produto => {
        const estoqueP = produto.estoque ? (produto.estoque.P || 0) : 0;
        const estoqueM = produto.estoque ? (produto.estoque.M || 0) : 0;
        const estoqueG = produto.estoque ? (produto.estoque.G || 0) : 0;
        const estoqueGG = produto.estoque ? (produto.estoque.GG || 0) : 0;
        const estoqueUnico = produto.estoque ? (produto.estoque.Unico || 0) : 0;

        const listaFotos = produto.fotos && produto.fotos.length ? produto.fotos : (produto.foto ? [produto.foto] : []);
        const fotoPrincipal = listaFotos.length ? listaFotos[0] : 'https://via.placeholder.com/150';

        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>
                <div style="position:relative; display:inline-block;">
                    <img src="${fotoPrincipal}" class="foto-produto-tabela" style="width:50px;border-radius:4px;">
                    ${listaFotos.length > 1 ? `<span style="position:absolute; bottom:-4px; right:-4px; background:#6f42c1; color:#fff; font-size:10px; padding:1px 5px; border-radius:8px;">+${listaFotos.length - 1}</span>` : ''}
                </div>
            </td>
            <td><span class="nome-produto-tabela" style="font-weight:600;">${produto.nome}</span></td>
            <td class="categoria-produto-tabela">${produto.categoria || 'Geral'}</td>
            <td class="preco-produto-tabela">R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}</td>
            <td>
                <div class="grade-tamanhos-container">
                    <span class="badge-grade ${classeBadgeEstoque(estoqueP)}">P: <b>${estoqueP}</b></span>
                    <span class="badge-grade ${classeBadgeEstoque(estoqueM)}">M: <b>${estoqueM}</b></span>
                    <span class="badge-grade ${classeBadgeEstoque(estoqueG)}">G: <b>${estoqueG}</b></span>
                    <span class="badge-grade ${classeBadgeEstoque(estoqueGG)}">GG: <b>${estoqueGG}</b></span>
                    <span class="badge-grade ${classeBadgeEstoque(estoqueUnico)}">Ún: <b>${estoqueUnico}</b></span>
                </div>
            </td>
            <td>
                <div class="botoes-acoes-tabela" style="display:flex; gap:5px; justify-content:center;">
                    <button type="button" class="btn-tabela-editar" onclick="window.gerenciadorEstoque.abrirModal('${produto.id}')">✏️ Editar</button>
                    <button type="button" class="btn-tabela-duplicar" onclick="window.gerenciadorEstoque.duplicar('${produto.id}')" style="background-color:#e9ecef; color:#333; border:1px solid #dcd8cf; border-radius:4px; padding:6px 10px; cursor:pointer;">📄 Duplicar</button>
                    <button type="button" class="btn-tabela-excluir" onclick="window.gerenciadorEstoque.excluir('${produto.id}')">🗑️ Excluir</button>
                </div>
            </td>
        `;
        corpoTabela.appendChild(linha);
    });
}

function renderizarTabelaPedidos() {
    const corpoPedidos = document.getElementById('corpo-tabela-pedidos');
    if (!corpoPedidos) return;
    
    corpoPedidos.innerHTML = '';
    const filtroMes = document.getElementById('filtro-mes-pedido');
    const modoVisualizacao = filtroMes ? filtroMes.value : "todos";

    const buscaCliente = document.getElementById('busca-pedido-cliente');
    const termoBusca = buscaCliente ? buscaCliente.value.trim().toLowerCase() : "";

    const filtroStatus = document.getElementById('filtro-status-pedido');
    const statusEscolhido = filtroStatus ? filtroStatus.value : "todos";

    const dataHoje = new Date();
    const anoAtual = dataHoje.getFullYear();
    const mesAtual = dataHoje.getMonth();

    if (!pedidosRecebidos || pedidosRecebidos.length === 0) {
        window._pedidosFiltradosAtuais = [];
        corpoPedidos.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#666;">Nenhum pedido encontrado.</td></tr>`;
        return;
    }

    const pedidosFiltrados = pedidosRecebidos.filter(pedido => {
        if (termoBusca && !(pedido.cliente || "").toLowerCase().includes(termoBusca)) return false;
        if (statusEscolhido !== "todos" && pedido.status !== statusEscolhido) return false;
        if (modoVisualizacao === "todos" || modoVisualizacao === "Todos os Pedidos") return true;

        const dataStr = pedido.data ? pedido.data : `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-01`;
        const pPed = dataStr.split('-');
        const dataPedido = new Date(pPed[0], pPed[1] - 1, pPed[2]);
        const anoPedido = dataPedido.getFullYear();
        const mesPedido = dataPedido.getMonth();

        if (modoVisualizacao === "atual") return (anoPedido === anoAtual && mesPedido === mesAtual);
        if (modoVisualizacao === "anterior") {
            let anoAlvo = anoAtual;
            let mesAlvo = mesAtual - 1;
            if (mesAlvo < 0) { mesAlvo = 11; anoAlvo = anoAtual - 1; }
            return (anoPedido === anoAlvo && mesPedido === mesAlvo);
        }
        if (modoVisualizacao === "outros") {
            let mesRetrasado = mesAtual - 2;
            let anoRetrasado = anoAtual;
            if (mesRetrasado < 0) { mesRetrasado = 12 + mesRetrasado; anoRetrasado = anoAtual - 1; }
            const ehMesRetrasadoOuAntigo = (anoPedido < anoRetrasado) || (anoPedido === anoRetrasado && mesPedido <= mesRetrasado);
            return ehMesRetrasadoOuAntigo && (pedido.status === "Entregue");
        }

        return true;
    });

    window._pedidosFiltradosAtuais = pedidosFiltrados;

    if (pedidosFiltrados.length === 0) {
        corpoPedidos.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#666;">Nenhum pedido encontrado para os filtros aplicados.</td></tr>`;
        return;
    }

    const pedidosOrdenados = [...pedidosFiltrados].reverse();

    pedidosOrdenados.forEach(pedido => {
        let dataFormatada = "Sem data";
        if (pedido.data) {
            const partes = pedido.data.split('-');
            if (partes.length === 3) dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
        } else {
            dataFormatada = `${String(dataHoje.getDate()).padStart(2, '0')}/${String(mesAtual + 1).padStart(2, '0')}/${anoAtual}`;
        }

        const codigoRef = pedido.codigoCliente || "REF-" + Math.floor(100000 + Math.random() * 900000);

        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>
                <div style="font-weight:700; color:#1a1a1a; font-size:14px;">#${pedido.id}</div>
                <div style="font-size: 11px; color: #888; font-weight: normal; margin-top: 2px;">Ref: #${codigoRef}</div>
            </td>
            <td>
                <div style="font-weight:600; color:#333;">${pedido.cliente}</div>
                <div style="font-size: 12px; color: #6c757d;">${pedido.contato}</div>
                <div style="font-size: 11px; color: #4a90e2; margin-top: 2px; display: flex; align-items: center; gap: 4px;">
                    <span>🗓️</span> ${dataFormatada}
                </div>
            </td>
            <td><span style="color: #555;">${pedido.itens}</span></td>
            <td>
                <div class="preco-produto-tabela" style="font-weight:600;">R$ ${parseFloat(pedido.total).toFixed(2).replace('.', ',')}</div>
                <div style="font-size: 11px; color: #666; background: #f1f3f5; padding: 2px 6px; display:inline-block; margin-top:4px; border-radius:3px;">${pedido.pagamento}</div>
            </td>
            <td>
                <select class="select-status-pedido" onchange="window.gerenciadorPedidos.alterarStatus('${pedido.id}', this.value)">
                    <option value="Pendente" ${pedido.status === 'Pendente' ? 'selected' : ''}>⏳ Pendente</option>
                    <option value="Enviado" ${pedido.status === 'Enviado' ? 'selected' : ''}>🚚 Enviado</option>
                    <option value="Entregue" ${pedido.status === 'Entregue' ? 'selected' : ''}>🏁 Entregue</option>
                </select>
            </td>
            <td>
                <button type="button" class="btn-tabela-excluir" onclick="window.gerenciadorPedidos.removerPedido('${pedido.id}')">🗑️ Limpar</button>
            </td>
        `;
        corpoPedidos.appendChild(linha);
    });
}

// --- CONFIGURAÇÕES DE FRETE E CUPONS ---
function carregarInputsConfiguracao() {
    const inputFreteGratis = document.getElementById('config-frete-gratis');
    const inputFreteFixo = document.getElementById('config-frete-fixo');
    const inputMetaFaturamento = document.getElementById('config-meta-faturamento');

    if (inputFreteGratis) inputFreteGratis.value = configSistema.freteGratisMinimo.toFixed(2).replace('.', ',');
    if (inputFreteFixo) inputFreteFixo.value = configSistema.freteFixo.toFixed(2).replace('.', ',');
    if (inputMetaFaturamento) inputMetaFaturamento.value = (configSistema.metaFaturamentoMensal || 0).toFixed(2).replace('.', ',');

    renderizarListaCupons();
    renderizarListaRegioesFrete();
}

function renderizarListaCupons() {
    const container = document.getElementById('lista-cupons-cadastrados');
    if (!container) return;

    if (!configSistema.cupons || configSistema.cupons.length === 0) {
        container.innerHTML = `<p style="color:#888; font-size:13px;">Nenhum cupom cadastrado.</p>`;
        return;
    }

    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

    container.innerHTML = configSistema.cupons.map((cupom, indice) => {
        let statusHtml = `<span style="color:#28a745; font-weight:600; font-size:12px;">● Ativo</span>`;
        let validadeTexto = "Sem validade definida";

        if (cupom.validade) {
            const partes = cupom.validade.split('-');
            const dataValidade = new Date(partes[0], partes[1] - 1, partes[2]);
            validadeTexto = `Válido até ${partes[2]}/${partes[1]}/${partes[0]}`;
            if (dataValidade < hoje) {
                statusHtml = `<span style="color:#e74c3c; font-weight:600; font-size:12px;">● Expirado</span>`;
            }
        }

        return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#f8f9fa; border-radius:6px; border:1px solid #e9ecef;">
                <div>
                    <b style="font-size:14px;">${cupom.codigo}</b> — ${cupom.descontoPct}% de desconto
                    <div style="font-size:12px; color:#888; margin-top:2px;">${validadeTexto}</div>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    ${statusHtml}
                    <button type="button" onclick="removerCupom(${indice})" style="background:#e74c3c; color:#fff; border:none; border-radius:4px; padding:5px 10px; cursor:pointer; font-size:12px;">Remover</button>
                </div>
            </div>
        `;
    }).join('');
}

function adicionarCupom() {
    const inputCodigo = document.getElementById('novo-cupom-codigo');
    const inputDesconto = document.getElementById('novo-cupom-desconto');
    const inputValidade = document.getElementById('novo-cupom-validade');

    const codigo = inputCodigo.value.trim().toUpperCase();
    const desconto = parseInt(inputDesconto.value);
    const validade = inputValidade.value || null;

    if (!codigo || !desconto || desconto <= 0 || desconto > 100) {
        alert("Preencha um código de cupom e um desconto válido (1 a 100%).");
        return;
    }

    if (configSistema.cupons.some(c => c.codigo === codigo)) {
        alert("Já existe um cupom com esse código.");
        return;
    }

    configSistema.cupons.push({ codigo, descontoPct: desconto, validade });
    salvarEAtualizar();
    renderizarListaCupons();

    inputCodigo.value = "";
    inputDesconto.value = "";
    inputValidade.value = "";
}

function removerCupom(indice) {
    if (confirm("Remover este cupom?")) {
        configSistema.cupons.splice(indice, 1);
        salvarEAtualizar();
        renderizarListaCupons();
    }
}

function renderizarListaRegioesFrete() {
    const container = document.getElementById('lista-regioes-frete');
    if (!container) return;

    if (!configSistema.regioesFrete || configSistema.regioesFrete.length === 0) {
        container.innerHTML = `<p style="color:#888; font-size:13px;">Nenhuma região cadastrada — todos os pedidos usam o Frete Fixo Padrão.</p>`;
        return;
    }

    container.innerHTML = configSistema.regioesFrete.map((regiao, indice) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#f8f9fa; border-radius:6px; border:1px solid #e9ecef;">
            <div>
                <b style="font-size:14px;">${regiao.nome}</b>
                <div style="font-size:12px; color:#888; margin-top:2px;">CEP ${regiao.cepInicio} até ${regiao.cepFim} — R$ ${parseFloat(regiao.valor).toFixed(2).replace('.', ',')}</div>
            </div>
            <button type="button" onclick="removerRegiaoFrete(${indice})" style="background:#e74c3c; color:#fff; border:none; border-radius:4px; padding:5px 10px; cursor:pointer; font-size:12px;">Remover</button>
        </div>
    `).join('');
}

function adicionarRegiaoFrete() {
    const inputNome = document.getElementById('nova-regiao-nome');
    const inputCepInicio = document.getElementById('nova-regiao-cep-inicio');
    const inputCepFim = document.getElementById('nova-regiao-cep-fim');
    const inputValor = document.getElementById('nova-regiao-valor');

    const nome = inputNome.value.trim();
    const cepInicio = inputCepInicio.value.trim().replace(/\D/g, '');
    const cepFim = inputCepFim.value.trim().replace(/\D/g, '');
    const valor = parseFloat(inputValor.value.replace(',', '.'));

    if (!nome || cepInicio.length !== 8 || cepFim.length !== 8 || isNaN(valor) || valor < 0) {
        alert("Preencha o nome da região, os dois CEPs completos (8 dígitos) e um valor de frete válido.");
        return;
    }

    configSistema.regioesFrete.push({ nome, cepInicio, cepFim, valor });
    salvarEAtualizar();
    renderizarListaRegioesFrete();

    inputNome.value = "";
    inputCepInicio.value = "";
    inputCepFim.value = "";
    inputValor.value = "";
}

function removerRegiaoFrete(indice) {
    if (confirm("Remover esta região de frete?")) {
        configSistema.regioesFrete.splice(indice, 1);
        salvarEAtualizar();
        renderizarListaRegioesFrete();
    }
}

function salvarConfiguracoesSistema(event) {
    if (event) event.preventDefault();

    const inputFreteGratis = document.getElementById('config-frete-gratis');
    const inputFreteFixo = document.getElementById('config-frete-fixo');
    const inputMetaFaturamento = document.getElementById('config-meta-faturamento');

    const freteGratis = inputFreteGratis ? parseFloat(inputFreteGratis.value.replace(',', '.')) : 0;
    const freteFixo = inputFreteFixo ? parseFloat(inputFreteFixo.value.replace(',', '.')) : 0;
    const metaFaturamento = inputMetaFaturamento ? parseFloat(inputMetaFaturamento.value.replace(',', '.')) : 0;

    configSistema.freteGratisMinimo = freteGratis;
    configSistema.freteFixo = freteFixo;
    configSistema.metaFaturamentoMensal = metaFaturamento || 0;

    salvarEAtualizar();
    alert("💾 Configurações do sistema atualizadas com sucesso!");
}

// --- ESCOPO GLOBAL WINDOW ---
window.gerenciadorEstoque = {
    excluir: function(idProduto) {
        if (confirm("Deseja remover este produto do estoque?")) {
            produtosEstoque = produtosEstoque.filter(p => p.id !== idProduto);
            salvarEAtualizar();
        }
    },
    duplicar: function(idProduto) {
        const produtoOriginal = produtosEstoque.find(p => p.id === idProduto);
        if (!produtoOriginal) return;

        const copia = JSON.parse(JSON.stringify(produtoOriginal));
        copia.id = String(Date.now());
        copia.nome = `${produtoOriginal.nome} (Cópia)`;

        produtosEstoque.push(copia);
        salvarEAtualizar();
        alert(`"${produtoOriginal.nome}" foi duplicado! Edite a cópia para ajustar o que for preciso.`);
    },
    abrirModal: function(idProduto) {
        const produto = produtosEstoque.find(p => p.id === idProduto);
        if (produto) {
            document.getElementById('edit-id').value = produto.id;
            document.getElementById('edit-nome').value = produto.nome;
            document.getElementById('edit-categoria').value = produto.categoria || '';
            document.getElementById('edit-preco').value = produto.preco || 0;
            
            document.getElementById('edit-qtd-p').value = produto.estoque ? (produto.estoque.P || 0) : 0;
            document.getElementById('edit-qtd-m').value = produto.estoque ? (produto.estoque.M || 0) : 0;
            document.getElementById('edit-qtd-g').value = produto.estoque ? (produto.estoque.G || 0) : 0;
            document.getElementById('edit-qtd-gg').value = produto.estoque ? (produto.estoque.GG || 0) : 0;
            document.getElementById('edit-unico-modal').value = produto.estoque ? (produto.estoque.Unico || 0) : 0;

            window.gerenciadorEstoque._fotosEmEdicao = produto.fotos && produto.fotos.length
                ? [...produto.fotos]
                : (produto.foto ? [produto.foto] : []);
            this.renderizarGaleriaEdicao();

            const modal = document.getElementById('modal-editar-estoque');
            if (modal) modal.style.setProperty('display', 'flex', 'important');
        }
    },
    renderizarGaleriaEdicao: function() {
        const container = document.getElementById('edit-galeria-fotos');
        if (!container) return;
        const fotos = window.gerenciadorEstoque._fotosEmEdicao || [];

        container.innerHTML = fotos.map((foto, indice) => `
            <div style="position:relative;">
                <img src="${foto}" style="width:50px; height:50px; object-fit:cover; border-radius:4px; border:1px solid #dcd8cf;">
                <button type="button" onclick="window.gerenciadorEstoque.removerFotoEdicao(${indice})"
                    style="position:absolute; top:-6px; right:-6px; background:#e74c3c; color:#fff; border:none; border-radius:50%; width:18px; height:18px; font-size:11px; cursor:pointer; line-height:1;">×</button>
            </div>
        `).join('');
    },
    removerFotoEdicao: function(indice) {
        window.gerenciadorEstoque._fotosEmEdicao.splice(indice, 1);
        this.renderizarGaleriaEdicao();
    },
    fecharModal: function() {
        const modal = document.getElementById('modal-editar-estoque');
        if (modal) modal.style.setProperty('display', 'none', 'important');
    }
};

window.gerenciadorPedidos = {
    alterarStatus: function(idPedido, novoStatus) {
        const pedido = pedidosRecebidos.find(p => p.id === idPedido);
        if (pedido) {
            pedido.status = novoStatus;
            salvarEAtualizar();
        }
    },
    removerPedido: function(idPedido) {
        if (confirm("Deseja remover este pedido?")) {
            pedidosRecebidos = pedidosRecebidos.filter(p => p.id !== idPedido);
            salvarEAtualizar();
        }
    }
};

// --- INICIALIZADOR PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    atualizarSelectCategorias(); 
    renderizarTabelaEstoque();
    renderizarTabelaPedidos(); 
    atualizarCardsPainel();
    atualizarMetaFaturamento();
    renderizarGraficoFaturamentoMensal();
    atualizarBadgeNotificacoes();
    carregarInputsConfiguracao();

    const btnNotificacoes = document.getElementById('btn-notificacoes');
    if (btnNotificacoes) {
        btnNotificacoes.addEventListener('click', () => {
            document.getElementById('pedidos')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    const btnModoEscuro = document.getElementById('btn-modo-escuro');
    const chaveModoEscuro = window.Auth.chave('modo_escuro_ativo');
    const modoEscuroSalvo = localStorage.getItem(chaveModoEscuro) === 'true';

    function aplicarModoEscuro(ativo) {
        document.body.classList.toggle('modo-escuro', ativo);
        if (btnModoEscuro) btnModoEscuro.textContent = ativo ? '☀️' : '🌙';
    }

    aplicarModoEscuro(modoEscuroSalvo);

    if (btnModoEscuro) {
        btnModoEscuro.addEventListener('click', () => {
            const novoEstado = !document.body.classList.contains('modo-escuro');
            aplicarModoEscuro(novoEstado);
            localStorage.setItem(chaveModoEscuro, novoEstado);
        });
    }

    const lojaAtual = window.Auth.getLojaAtual();
    const logoHeader = document.querySelector('.navbar-logo h2');
    if (lojaAtual && logoHeader) {
        logoHeader.textContent = `${lojaAtual.nomeLoja.toUpperCase()} - PAINEL ADM`;
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm("Deseja sair do painel?")) {
                window.Auth.logout();
            }
        });
    }

    const botoesFiltro = document.querySelectorAll('.btn-filtro-tempo');
    botoesFiltro.forEach(botao => {
        botao.addEventListener('click', (e) => {
            botoesFiltro.forEach(b => b.classList.remove('ativo'));
            e.currentTarget.classList.add('ativo'); 

            const textoBotao = e.currentTarget.textContent.toLowerCase();
            
            if (/hoje|di[aá]rio/.test(textoBotao)) {
                filtroTempoAtual = 'hoje';
            } else if (/7|semanal/.test(textoBotao)) {
                filtroTempoAtual = '7-dias';
            } else if (/30|mensal|m[eê]s/.test(textoBotao)) {
                filtroTempoAtual = 'este-mes'; 
            }

            atualizarCardsPainel();
        });
    });

    const btnAplicarData = document.querySelector('.btn-aplicar-data');
    if (btnAplicarData) {
        btnAplicarData.addEventListener('click', () => {
            const inputsData = document.querySelectorAll('.filtro-data-personalizada input[type="date"]');
            if (inputsData.length >= 2) {
                dataInicioPersonalizada = inputsData[0].value;
                dataFimPersonalizada = inputsData[1].value;

                if (!dataInicioPersonalizada || !dataFimPersonalizada) {
                    alert("Por favor, preencha ambas as datas para filtrar!");
                    return;
                }

                filtroTempoAtual = 'personalizado';
                botoesFiltro.forEach(b => b.classList.remove('ativo'));
                atualizarCardsPainel();
            }
        });
    }

    const btnNovaCat = document.getElementById('btn-nova-categoria');
    if (btnNovaCat) btnNovaCat.addEventListener('click', adicionarCategoria);

    const btnDeletarCat = document.getElementById('btn-deletar-categoria');
    if (btnDeletarCat) btnDeletarCat.addEventListener('click', removerCategoria);

    const formCadastro = document.getElementById('form-cadastrar-peca');
    if (formCadastro) formCadastro.addEventListener('submit', cadastrarNovoProduto);

    const filtroMes = document.getElementById('filtro-mes-pedido');
    if (filtroMes) filtroMes.addEventListener('change', renderizarTabelaPedidos);

    const buscaCliente = document.getElementById('busca-pedido-cliente');
    if (buscaCliente) buscaCliente.addEventListener('input', renderizarTabelaPedidos);

    const filtroStatus = document.getElementById('filtro-status-pedido');
    if (filtroStatus) filtroStatus.addEventListener('change', renderizarTabelaPedidos);

    const btnExportarPedidos = document.getElementById('btn-exportar-pedidos');
    if (btnExportarPedidos) btnExportarPedidos.addEventListener('click', exportarPedidosCSV);

    const buscaEstoque = document.getElementById('busca-estoque-produto');
    if (buscaEstoque) buscaEstoque.addEventListener('input', renderizarTabelaEstoque);

    const filtroCategoriaEstoque = document.getElementById('filtro-estoque-categoria');
    if (filtroCategoriaEstoque) filtroCategoriaEstoque.addEventListener('change', renderizarTabelaEstoque);

    const botaoSalvarConfig = document.getElementById('btn-salvar-config');
    if (botaoSalvarConfig) botaoSalvarConfig.addEventListener('click', salvarConfiguracoesSistema);

    const botaoAdicionarCupom = document.getElementById('btn-adicionar-cupom');
    if (botaoAdicionarCupom) botaoAdicionarCupom.addEventListener('click', adicionarCupom);

    const botaoAdicionarRegiao = document.getElementById('btn-adicionar-regiao');
    if (botaoAdicionarRegiao) botaoAdicionarRegiao.addEventListener('click', adicionarRegiaoFrete);
    
    const formEditar = document.getElementById('form-editar-estoque');
    if (formEditar) {
        formEditar.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-id').value;
            const index = produtosEstoque.findIndex(p => p.id === id);
            
            if (index !== -1) {
                produtosEstoque[index].nome = document.getElementById('edit-nome').value;
                produtosEstoque[index].categoria = document.getElementById('edit-categoria').value;
                produtosEstoque[index].preco = parseFloat(document.getElementById('edit-preco').value);
                produtosEstoque[index].estoque = {
                    P: parseInt(document.getElementById('edit-qtd-p').value) || 0,
                    M: parseInt(document.getElementById('edit-qtd-m').value) || 0,
                    G: parseInt(document.getElementById('edit-qtd-g').value) || 0,
                    GG: parseInt(document.getElementById('edit-qtd-gg').value) || 0,
                    Unico: parseInt(document.getElementById('edit-unico-modal').value) || 0
                };

                const inputEditFoto = document.getElementById('edit-foto');
                let novasFotos = [];
                if (inputEditFoto && inputEditFoto.files && inputEditFoto.files.length > 0) {
                    novasFotos = await lerArquivosComoBase64(inputEditFoto.files);
                }
                produtosEstoque[index].fotos = [...(window.gerenciadorEstoque._fotosEmEdicao || []), ...novasFotos];
                delete produtosEstoque[index].foto;

                salvarEAtualizar();
                window.gerenciadorEstoque.fecharModal();
                alert("Produto atualizado com sucesso!");
            }
        });
    }
});