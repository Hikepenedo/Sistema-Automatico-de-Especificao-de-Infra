const $ = id => document.getElementById(id);

let calculoAtivo = null;
let ultimosResultados = null;

const BOTOES_TIPO = { backbone: 'btnBackbone', horizontal: 'btnHorizontal', complete: 'btnComplete' };
const SECOES_POR_TIPO = {
    backbone: ['backboneSection'],
    horizontal: ['horizontalSection'],
    complete: ['backboneSection', 'horizontalSection']
};
const CAMPOS_PONTOS = ['pontosDados', 'pontosVoz', 'pontosCFTV'];
const SERVICOS_PONTOS = {
    pontosDados: 'Malha Horizontal',
    pontosVoz: 'Telefonia',
    pontosCFTV: 'CFTV'
};

const COR_SERVICO = {
    pontosDados: 'Azul',
    pontosVoz: 'Amarelo',
    pontosCFTV: 'Vermelho'
}

document.addEventListener('DOMContentLoaded', inicializarEventos);

function inicializarEventos() {
    Object.entries(BOTOES_TIPO).forEach(([tipo, id]) => $(id).addEventListener('click', () => selecionarTipo(tipo)));
    $('calcularBtn').addEventListener('click', realizarCalculo);
    $('novoCalculoBtn').addEventListener('click', novoCalculo);
    $('exportExcelBtn').addEventListener('click', exportarExcel);
    $('toggleServicePointsBtn').addEventListener('click', alternarPontosPorServico);
    $('addEspelhoBtn').addEventListener('click', adicionarEspelhoTomada);
    $('espelhosContainer').addEventListener('click', removerEspelhoTomada);
    $('numPontosPavimento').addEventListener('input', atualizarContadores);
    $('servicePointsSection').addEventListener('input', atualizarContadores);
    $('espelhosContainer').addEventListener('input', atualizarContadores);
    $('espelhosContainer').addEventListener('change', atualizarContadores);
    atualizarContadores();
}

function selecionarTipo(tipo) {
    calculoAtivo = tipo;
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    $(BOTOES_TIPO[tipo]).classList.add('active');
    ['backboneSection', 'horizontalSection'].forEach(id => {
        $(id).style.display = SECOES_POR_TIPO[tipo].includes(id) ? 'block' : 'none';
    });
    ocultarPontosPorServico();
    $('calcularContainer').style.display = 'flex';
    rolarPara('calculadora');
}

function realizarCalculo(e) {
    e.preventDefault();
    if (!calculoAtivo) {
        mostrarNotificacao('Por favor, selecione um tipo de cálculo!', 'erro');
        return;
    }

    if (deveCalcular('horizontal') && !validarPontosPorServico()) {
        return;
    }

    if (deveCalcular('horizontal') && !validarFurosEspelhos()) {
        return;
    }

    ultimosResultados = {
        backbone: deveCalcular('backbone') ? calcularBackbone() : null,
        horizontal: deveCalcular('horizontal') ? calcularMalhaHorizontal() : null,
        tipo: calculoAtivo
    };
    exibirResultados();
}

function deveCalcular(tipo) {
    return calculoAtivo === tipo || calculoAtivo === 'complete';
}

function alternarPontosPorServico() {
    const secao = $('servicePointsSection');
    const botao = $('toggleServicePointsBtn');
    const exibir = secao.style.display === 'none';

    secao.style.display = exibir ? 'block' : 'none';
    botao.setAttribute('aria-expanded', String(exibir));

    if (exibir) rolarPara('servicePointsSection');
}

function ocultarPontosPorServico() {
    $('servicePointsSection').style.display = 'none';
    $('toggleServicePointsBtn').setAttribute('aria-expanded', 'false');
}

function validarPontosPorServico() {
    const totalPontosServicos = calcularTotalPontosServicoRede();
    const { pontosTelecom, pontosRede } = obterPontosRede();

    if (totalPontosServicos === pontosRede) {
        return true;
    }

    $('servicePointsSection').style.display = 'block';
    $('toggleServicePointsBtn').setAttribute('aria-expanded', 'true');
    rolarPara('servicePointsSection');
    mostrarNotificacao(`A soma dos pontos por serviço (${totalPontosServicos}) deve ser igual ao número de pontos de rede (${pontosTelecom} x 2 = ${pontosRede}).`, 'erro');
    return false;
}

function validarFurosEspelhos() {
    const espelhos = lerEspelhosTomada();
    const { pontosTelecom, pontosRede } = obterPontosRede();
    const totalFuros = calcularTotalFurosEspelhos(espelhos);

    if (totalFuros === pontosRede) {
        return true;
    }

    mostrarNotificacao(`O total de furos dos espelhos (${totalFuros}) deve ser igual ao número de pontos de rede (${pontosTelecom} x 2 = ${pontosRede}).`, 'erro');
    rolarPara('espelhosContainer');
    return false;
}

function obterPontosRede() {
    const pontosTelecom = lerInteiro('numPontosPavimento', 50);
    return {
        pontosTelecom,
        pontosRede: pontosTelecom * 2
    };
}

function atualizarContadores() {
    const { pontosRede } = obterPontosRede();
    const totalPontosServicos = calcularTotalPontosServicoRede();
    const totalFuros = calcularTotalFurosEspelhos(lerEspelhosTomada());

    atualizarContador('servicePointsCounter', totalPontosServicos, pontosRede, totalPontosServicos !== pontosRede);
    atualizarContador('mirrorHolesCounter', totalFuros, pontosRede, totalFuros !== pontosRede);
}

function atualizarContador(id, atual, total, invalido) {
    const contador = $(id);

    contador.textContent = `${atual} / ${total}`;
    contador.classList.toggle('is-invalid', invalido);
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    const notificacaoAnterior = document.querySelector('.toast-notification');

    if (notificacaoAnterior) {
        notificacaoAnterior.remove();
    }

    const notificacao = document.createElement('div');
    notificacao.className = `toast-notification toast-${tipo}`;
    notificacao.textContent = mensagem;
    document.body.appendChild(notificacao);

    setTimeout(() => {
        notificacao.classList.add('show');
    }, 10);

    setTimeout(() => {
        notificacao.classList.remove('show');
        setTimeout(() => notificacao.remove(), 250);
    }, 4500);
}

function lerInteiro(id, valorPadrao = 0) {
    return parseInt($(id).value) || valorPadrao;
}

function lerDecimal(id, valorPadrao = 0) {
    return parseFloat($(id).value) || valorPadrao;
}

function lerValor(id, valorPadrao = '') {
    return $(id).value || valorPadrao;
}

function lerFormularioBackbone() {
    return {
        numPavimentos: lerInteiro('numPavimentos', 1),
        numFibras: lerInteiro('numFibras', 12),
        mediaLance: lerDecimal('mediaLance', 50),
        tipoFibra: lerValor('tipoFibra'),
        caracteristicaFibra: lerValor('caracteristicaFibra', 'Não especificada'),
        qtdBackbonesAndar: lerInteiro('qtdBackbonesAndar', 1),
        backbonePrimario: $('backbonePrimario').checked,
        backboneSecundario: $('backboneSecundario').checked
    };
}

function calcularBackbone() {
    const dados = lerFormularioBackbone();
    const totalBackbones = dados.qtdBackbonesAndar * dados.numPavimentos;
    const caboOticoBaseMetros = Math.floor(calcularCaboOticoBaseMetros(dados.mediaLance, dados.numPavimentos));
    const caboOticoTotalBaseMetros = caboOticoBaseMetros * dados.qtdBackbonesAndar;
    const quantidadeFibras = dados.numFibras * totalBackbones;

    return {
        ...dados,
        totalBackbones,
        totalPavimentos: dados.numPavimentos,
        quantidadeFibras,
        caboOticoBaseMetros,
        caboOticoTotalBaseMetros,
        totalCaboOticoMetros: (caboOticoTotalBaseMetros * 2 * 1.2).toFixed(2),
        materiaisOpticos: calcularMateriaisOpticos(quantidadeFibras)
    };
}

function calcularCaboOticoBaseMetros(mediaLance, totalPavimentos) {
    return Array.from({ length: totalPavimentos }, (_, i) => mediaLance * (i + 1))
        .reduce((total, metros) => total + metros, 0);
}

function calcularMateriaisOpticos(totalFibras) {
    const portasDIO = Math.ceil(totalFibras / 2);
    return {
        portasDIO,
        quantidadeDIO: Math.ceil(portasDIO / 24),
        quantidadeCaixaEmenda: Math.ceil(totalFibras / 12),
        quantidadeAcopladorLC: portasDIO,
        quantidadePigtailLC: totalFibras,
        quantidadeCordaoLC: totalFibras
    };
}

function lerPontosPorServico() {
    return CAMPOS_PONTOS.reduce((pontos, campo) => {
        pontos[campo] = lerInteiro(campo, 0);
        return pontos;
    }, {});
}

function somarPontosPorServico(pontos) {
    return Object.values(pontos).reduce((total, quantidade) => total + quantidade, 0);
}

function calcularTotalPontosServicoRede() {
    return somarPontosPorServico(lerPontosPorServico());
}

function lerEspelhosTomada() {
    return Array.from(document.querySelectorAll('.mirror-row')).map(row => ({
        furacao: parseInt(row.querySelector('.mirror-holes').value) || 0,
        polegada: row.querySelector('.mirror-size').value,
        quantidade: parseInt(row.querySelector('.mirror-quantity').value) || 0
    }));
}

function calcularTotalFurosEspelhos(espelhos) {
    return espelhos.reduce((total, espelho) => total + (espelho.furacao * espelho.quantidade), 0);
}

function adicionarEspelhoTomada() {
    const row = document.createElement('div');
    row.className = 'mirror-row';
    row.innerHTML = `
        <div class="form-group">
            <label>Furação do Espelho</label>
            <select class="mirror-holes">
                <option value="1">1 furo</option>
                <option value="2">2 furos</option>
                <option value="4">4 furos</option>
                <option value="6">6 furos</option>
            </select>
        </div>

        <div class="form-group">
            <label>Polegada do Espelho</label>
            <select class="mirror-size">
                <option value="4&quot; x 2&quot;">4" x 2"</option>
                <option value="4&quot; x 4&quot;">4" x 4"</option>
            </select>
        </div>

        <div class="form-group">
            <label>Quantidade</label>
            <input type="number" class="mirror-quantity" min="0" value="0">
        </div>

        <button type="button" class="btn btn-secondary btn-icon remove-mirror-btn" aria-label="Remover espelho">
            <i class="fas fa-trash"></i>
        </button>
    `;

    $('espelhosContainer').appendChild(row);
    atualizarContadores();
}

function removerEspelhoTomada(e) {
    const botaoRemover = e.target.closest('.remove-mirror-btn');

    if (botaoRemover) {
        botaoRemover.closest('.mirror-row').remove();
        atualizarContadores();
    }
}

function limparEspelhosTomada() {
    document.querySelectorAll('.mirror-row:not(:first-child)').forEach(row => row.remove());
}

function lerFormularioHorizontal() {
    return {
        numPavimentosMH: lerInteiro('numPavimentosMH', 1),
        numPontosPavimento: lerInteiro('numPontosPavimento', 50),
        mediaDistancia: lerDecimal('mediaDistancia', 100),
        categoriaCabo: lerValor('categoriaCabo'),
        tipoCaboMetalico: lerValor('tipoCaboMetalico', 'UTP'),
        espelhos: lerEspelhosTomada(),
        numBandejas: lerInteiro('numBandejas', 0),
        numBandejasMoveis: lerInteiro('numBandejasMoveis', 0),
        totalUBandejas: lerInteiro('totalUBandejas', 0),
        pontos: lerPontosPorServico()
    };
}

function calcularMalhaHorizontal() {
    const dados = lerFormularioHorizontal();
    const totalServicos = somarPontosPorServico(dados.pontos);
    const pontosPorPavimento = Math.max(dados.numPontosPavimento, totalServicos);
    const totalPontos = pontosPorPavimento * dados.numPavimentosMH;
    const pontosRede = dados.numPontosPavimento * 2 * dados.numPavimentosMH;
    const pontosRedePorPavimento = dados.numPontosPavimento * 2;
    const caboHorizontalMetros = pontosRedePorPavimento * dados.mediaDistancia * dados.numPavimentosMH;
    const quantidadePatchPanels = Math.ceil(pontosRede / 24);
    const quantidadeTomadas = totalPontos;

    return {
        totalCaboUTPMetros: ((dados.mediaDistancia * totalPontos) + (100 * dados.numPavimentosMH)).toFixed(2),
        quantidadeConectoresRJ45: totalPontos * 2,
        quantidadePatchPanels,
        quantidadePatchCords: totalPontos + 10,
        quantidadeTomadas,
        quantidadeCaixas: Math.ceil(totalPontos / 2),
        categoriaCabo: dados.categoriaCabo,
        tipoCaboMetalico: dados.tipoCaboMetalico,
        mediaDistancia: dados.mediaDistancia,
        espelhos: dados.espelhos,
        totalFurosEspelhos: calcularTotalFurosEspelhos(dados.espelhos),
        totalPontos,
        pontosTelecom: dados.numPontosPavimento,
        pontosRedePorPavimento,
        numPavimentos: dados.numPavimentosMH,
        pontosRede,
        caboHorizontalMetros,
        caixasCaboHorizontal: Math.ceil(caboHorizontalMetros / 305),
        numBandejas: dados.numBandejas,
        numBandejasMoveis: dados.numBandejasMoveis,
        totalUBandejas: dados.totalUBandejas,
        detalhes: montarDetalhesPontos(dados.pontos, dados.numPavimentosMH)
    };
}

function montarDetalhesPontos(pontos, pavimentos) {
    return {
        pontosDados: pontos.pontosDados * pavimentos,
        pontosVoz: pontos.pontosVoz * pavimentos,
        pontosCFTV: pontos.pontosCFTV * pavimentos
    };
}

function formatarMedida(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: Number.isInteger(Number(valor)) ? 0 : 1,
        maximumFractionDigits: 2
    });
}

function formatarQuantidade(valor) {
    return String(valor).padStart(2, '0');
}

function obterCaracteristicaFibra(backbone) {
    if (backbone.caracteristicaFibra && backbone.caracteristicaFibra !== 'Não especificada') {
        return `${backbone.caracteristicaFibra.replace('/', ' x ')} µm`;
    }
    return backbone.tipoFibra === 'MM' ? '50 x 125 µm' : '9 x 125 µm';
}

function montarEspecificacoesBackbone(backbone) {
    const materiais = backbone.materiaisOpticos;
    const caracteristica = obterCaracteristicaFibra(backbone);
    const tipoCabo = backbone.tipoFibra === 'MM' ? 'FOMMIG' : 'FOSMIG';
    const unidadeDIO = materiais.quantidadeDIO > 1 ? 's' : '';
    const unidadeCaixa = materiais.quantidadeCaixaEmenda > 1 ? 's' : '';

    return [
        `Cabo de fibra óptica ${tipoCabo} ${caracteristica} - (${formatarMedida(backbone.caboOticoBaseMetros)} x ${formatarMedida(backbone.qtdBackbonesAndar)} x 2 x 1,2=${formatarMedida(backbone.totalCaboOticoMetros)}m) - com ${backbone.numFibras} fibras;`,
        `DIO - Distribuidor Interno Óptico - usar ${formatarQuantidade(materiais.portasDIO)} portas - ${formatarQuantidade(materiais.quantidadeDIO)} Chassi${unidadeDIO} de 19" (24 portas) - 1U;`,
        `Caixa de emenda (suporta 12 emendas) = ${formatarQuantidade(materiais.quantidadeCaixaEmenda)} unidade${unidadeCaixa};`,
        `Acoplador óptico (${caracteristica}) simples - conector LC - ${formatarQuantidade(materiais.quantidadeAcopladorLC)} unidades;`,
        `Pigtail (${caracteristica}) simples - conector LC - 1,5m - ${formatarQuantidade(materiais.quantidadePigtailLC)} unidades;`,
        `Cordão óptico (${caracteristica}) simples - conector LC - 3m - ${formatarQuantidade(materiais.quantidadeCordaoLC)} unidades.`
    ];
}

function montarEspecificacoesBackboneSET(backbone) {
    const materiais = backbone.materiaisOpticos;
    const caracteristica = obterCaracteristicaFibra(backbone);
    const quantidadeTerminadores = Math.ceil(backbone.quantidadeFibras / backbone.numFibras);
    const unidadeTerminador = quantidadeTerminadores > 1 ? 'unidades' : 'unidade';
    const unidadePigtail = materiais.portasDIO > 1 ? 'unidades' : 'unidade';

    return [
        `Terminador Óptico (TO) de ${backbone.numFibras} fibras – ${formatarQuantidade(quantidadeTerminadores)} ${unidadeTerminador};`,
        `Pigtail (${caracteristica}) duplo – conector LC - 3m - ${formatarQuantidade(materiais.portasDIO)} ${unidadePigtail};`
    ];
}

function linha(label, valor) {
    return { label, valor };
}

function linhaColspan(valor, className = '') {
    return { valor, colspan: true, className };
}

function montarLinhasBackbone(backbone, incluirClasse = false) {
    const classeSecao = incluirClasse ? 'section-row' : '';
    const classeEspecificacao = incluirClasse ? 'specification-cell' : '';

    return [
        linhaColspan('Sala de Equipamentos (SEQ)', classeSecao),
        ...montarEspecificacoesBackbone(backbone)
            .map(item => linhaColspan(item, classeEspecificacao)),
        linhaColspan('Sala de Telecom (SET)', classeSecao),
        ...montarEspecificacoesBackboneSET(backbone)
            .map(item => linhaColspan(item, classeEspecificacao))
    ];
}

function montarLinhasHorizontal(horizontal, contexto = 'tela') {
    const classeSecao = contexto === 'excel' ? '' : 'section-row';
    const classeEspecificacao = contexto === 'excel' ? '' : 'specification-cell';

    return [
        linhaColspan('Área de Trabalho', classeSecao),
        linhaColspan(montarEspecificacaoCordaoFlex(horizontal), classeEspecificacao),
        linhaColspan(montarEspecificacaoTomadaFemea(horizontal), classeEspecificacao),
        ...montarEspecificacoesEspelhos(horizontal)
            .map(especificacao => linhaColspan(especificacao, classeEspecificacao)),
        linhaColspan('Cabo Horizontal', classeSecao),
        linhaColspan(montarEspecificacaoCaboHorizontal(horizontal), classeEspecificacao),
        linhaColspan('Sala de Telecom (SET)', classeSecao),
        linhaColspan(montarEspecificacaoPatchPanelMH(horizontal), classeEspecificacao),
        ...montarEspecificacoesPatchPanelSET(horizontal)
            .map(especificacao => linhaColspan(especificacao, classeEspecificacao)),
        linhaColspan(montarEspecificacaoOrganizadorFrontal(horizontal), classeEspecificacao),
        ...montarEspecificacaoPatchCable(horizontal)
            .map(especificacao => linhaColspan(especificacao, classeEspecificacao)),    
        linhaColspan(montarEspecificacaoBandejas(horizontal), classeEspecificacao),
        linhaColspan(montarEspecificacaoExaustor(horizontal), classeEspecificacao),
        linhaColspan(montarEspecificacaoRack(horizontal), classeEspecificacao),
        linhaColspan('Miscelânias', classeSecao)
    ];
}

function montarEspecificacaoCordaoFlex(horizontal) {
    return `Cordão ${horizontal.tipoCaboMetalico} flex ${horizontal.categoriaCabo} - 3m - (${horizontal.pontosTelecom} x 2 x ${horizontal.numPavimentos} = ${horizontal.pontosRede}) unidades (Patch Cord);`;
}

function montarEspecificacaoTomadaFemea(horizontal) {
    return `Tomada Fêmea ${horizontal.categoriaCabo} - ${horizontal.pontosRede} unidades;`;
}

function montarEspecificacaoCaboHorizontal(horizontal) {
    return `Cabo ${horizontal.categoriaCabo} ${horizontal.tipoCaboMetalico} - (${horizontal.pontosRedePorPavimento} x ${formatarMedida(horizontal.mediaDistancia)} x ${horizontal.numPavimentos} = ${formatarMedida(horizontal.caboHorizontalMetros)}m / 305m = ${horizontal.caixasCaboHorizontal} caixa${horizontal.caixasCaboHorizontal > 1 ? 's' : ''});`;
}

function montarEspecificacaoPatchPanelMH(horizontal) {
    return `Patch Panel Malha Horizontal ${horizontal.categoriaCabo} - 24 portas RJ45 - 1U - 19" - ${horizontal.quantidadePatchPanels} unidade${horizontal.quantidadePatchPanels > 1 ? 's' : ''};`;
}

function montarEspecificacoesPatchPanelSET(horizontal) {
    return Object.entries(SERVICOS_PONTOS)
        .map(([campo, servico]) => ({
            servico,
            quantidadePontos: horizontal.detalhes[campo],
            quantidadePatchPanels: Math.ceil(horizontal.detalhes[campo] / 24)
        }))
        .filter(item => item.quantidadePontos > 0 && item.servico !== 'Malha Horizontal')
        .map(item => `Patch Panel ${item.servico} - ${horizontal.categoriaCabo} - 24 portas RJ45 - 1U - 19" - ${item.quantidadePatchPanels} unidade${item.quantidadePatchPanels > 1 ? 's' : ''};`);
}

function getNumeroOrganizadoresFrontal(horizontal) {
    const totalPPporServico = Object.keys(SERVICOS_PONTOS)
        .reduce((total, campo) => total + Math.ceil(horizontal.detalhes[campo] / 24), 0);
    return totalPPporServico + horizontal.quantidadePatchPanels;
}

function montarEspecificacaoOrganizadorFrontal(horizontal) {
    const totalOrganizadores = getNumeroOrganizadoresFrontal(horizontal);
    return `Organizador Frontal - 1U - 19" - ${totalOrganizadores} unidade${totalOrganizadores > 1 ? 's' : ''};`;
}

function montarEspecificacaoBandejas(horizontal) {
    return `Bandeja - 19" - ${horizontal.numBandejas} Fixas - ${horizontal.numBandejasMoveis} Moveis - ${horizontal.totalUBandejas}U `
}

function montarEspecificacaoPatchCable(horizontal) {
    return Object.entries(COR_SERVICO)
        .map(([campo, servico]) => ({
            servico,
            quantidadePatchCable: horizontal.detalhes[campo]
        }))
        .filter(item => item.quantidadePatchCable > 0 )
        .map(item => `Cordao de Ligacao (Patch Cable) - ${item.servico}- 3m - ${horizontal.categoriaCabo} - ${item.quantidadePatchCable} unidade${item.quantidadePatchCable > 1 ? 's' : ''};`);

}

function montarEspecificacaoRack(horizontal) {
    const totalU = (horizontal.totalUBandejas + (getNumeroOrganizadoresFrontal(horizontal) * 2) + 2);
    // 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48
    

}

function montarEspecificacaoExaustor(horizontal) {
    const totalExaustores = horizontal.numPavimentos * 2;
    return `Exaustor - ${totalExaustores} unidades - 1U`;
}
function montarEspecificacoesEspelhos(horizontal) {
    return horizontal.espelhos
        .filter(espelho => espelho.quantidade > 0)
        .map(espelho => {
            const quantidade = espelho.quantidade * horizontal.numPavimentos;
            return `Espelho de tomada - ${quantidade} unidade${quantidade > 1 ? 's' : ''} ${espelho.polegada} com ${espelho.furacao} furo${espelho.furacao > 1 ? 's' : ''};`;
        });
}

function linhasCondicionaisPontos(detalhes) {
    return [
        ['- Pontos CFTV', detalhes.pontosCFTV]
    ].filter(([, valor]) => valor > 0).map(([label, valor]) => linha(label, valor));
}

function montarHtmlTabela(linhas) {
    return linhas.map(item => {
        if (!item.colspan) return `<tr><td>${item.label}</td><td>${item.valor}</td></tr>`;
        const classe = item.className ? ` class="${item.className}"` : '';
        return `<tr><td colspan="2"${classe}>${item.valor}</td></tr>`;
    }).join('');
}

function renderizarSecao(idCard, idBody, linhas) {
    const deveExibir = linhas && linhas.length > 0;
    $(idCard).style.display = deveExibir ? 'block' : 'none';
    if (linhas) $(idBody).innerHTML = montarHtmlTabela(linhas);
}

function renderizarBackbone() {
    renderizarSecao(
        'resultBackbone',
        'resultBackboneBody',
        ultimosResultados.backbone && montarLinhasBackbone(ultimosResultados.backbone, true)
    );
}

function renderizarHorizontal() {
    renderizarSecao(
        'resultHorizontal',
        'resultHorizontalBody',
        ultimosResultados.horizontal && montarLinhasHorizontal(ultimosResultados.horizontal)
    );
}

function exibirResultados() {
    $('resultado').style.display = 'block';
    renderizarBackbone();
    renderizarHorizontal();
    rolarPara('resultado');
}

function novoCalculo() {
    $('calculoForm').reset();
    limparEspelhosTomada();
    atualizarContadores();
    ['resultado', 'backboneSection', 'horizontalSection', 'calcularContainer'].forEach(id => {
        $(id).style.display = 'none';
    });
    ocultarPontosPorServico();
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    calculoAtivo = null;
    ultimosResultados = null;
    document.querySelector('.calculation-type-section').scrollIntoView({ behavior: 'smooth' });
}

function montarLinhaExcel(item) {
    return item.colspan
        ? `<tr><td colspan="2">${item.valor}</td></tr>`
        : `<tr><td>${item.label}</td><td>${item.valor}</td></tr>`;
}

function montarSecaoExcel(titulo, linhas) {
    return `<tr><td colspan="2"><b>${titulo}</b></td></tr>${linhas.map(montarLinhaExcel).join('')}`;
}

function montarTabelaExcel() {
    const secoes = [
        '<tr><td colspan="2"><b>CALCULADORA DE MATERIAIS - CABEAMENTO ESTRUTURADO</b></td></tr>',
        `<tr><td colspan="2"><b>Data: ${new Date().toLocaleDateString('pt-BR')}</b></td></tr>`,
        '<tr><td colspan="2"></td></tr>'
    ];

    if (ultimosResultados.backbone) {
        secoes.push(montarSecaoExcel('BACKBONE ÓPTICO', montarLinhasBackbone(ultimosResultados.backbone)));
        secoes.push('<tr><td colspan="2"></td></tr>');
    }
    if (ultimosResultados.horizontal) {
        const linhasHorizontal = montarLinhasHorizontal(ultimosResultados.horizontal, 'excel');
        if (linhasHorizontal.length > 0) {
            secoes.push(montarSecaoExcel('MALHA HORIZONTAL', linhasHorizontal));
        }
    }

    return `<table border="1" cellpadding="10" cellspacing="0">${secoes.join('')}</table>`;
}

function exportarExcel() {
    if (!ultimosResultados) return;

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body>${montarTabelaExcel()}</body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `calcular_materiais_${new Date().getTime()}.xls`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    mostrarNotificacao('Arquivo Excel gerado com sucesso!', 'sucesso');
}

function rolarPara(id) {
    setTimeout(() => $(id).scrollIntoView({ behavior: 'smooth' }), 100);
}
