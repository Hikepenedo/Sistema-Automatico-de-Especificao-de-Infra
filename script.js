const $ = id => document.getElementById(id);

let calculoAtivo = null;
let ultimosResultados = null;

const BOTOES_TIPO = { backbone: 'btnBackbone', horizontal: 'btnHorizontal', complete: 'btnComplete' };
const SECOES_POR_TIPO = {
    backbone: ['backboneSection'],
    horizontal: ['horizontalSection'],
    complete: ['backboneSection', 'horizontalSection']
};
const CAMPOS_PONTOS = ['pontosDados', 'pontosVoz', 'pontosCFTV', 'pontosWiFi', 'pontosOutros'];

document.addEventListener('DOMContentLoaded', inicializarEventos);

function inicializarEventos() {
    Object.entries(BOTOES_TIPO).forEach(([tipo, id]) => $(id).addEventListener('click', () => selecionarTipo(tipo)));
    $('calcularBtn').addEventListener('click', realizarCalculo);
    $('novoCalculoBtn').addEventListener('click', novoCalculo);
    $('exportExcelBtn').addEventListener('click', exportarExcel);
}

function selecionarTipo(tipo) {
    calculoAtivo = tipo;
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    $(BOTOES_TIPO[tipo]).classList.add('active');
    ['backboneSection', 'horizontalSection'].forEach(id => {
        $(id).style.display = SECOES_POR_TIPO[tipo].includes(id) ? 'block' : 'none';
    });
    $('calcularContainer').style.display = 'flex';
    rolarPara('calculadora');
}

function realizarCalculo(e) {
    e.preventDefault();
    if (!calculoAtivo) {
        alert('Por favor, selecione um tipo de cálculo!');
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
    const quantidadeFibras = dados.numFibras * totalBackbones;

    return {
        ...dados,
        totalBackbones,
        totalPavimentos: dados.numPavimentos,
        quantidadeFibras,
        caboOticoBaseMetros,
        totalCaboOticoMetros: (caboOticoBaseMetros * 2 * 1.2).toFixed(2),
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

function lerFormularioHorizontal() {
    return {
        numPavimentosMH: lerInteiro('numPavimentosMH', 1),
        numPontosPavimento: lerInteiro('numPontosPavimento', 50),
        mediaDistancia: lerDecimal('mediaDistancia', 100),
        categoriaCabo: lerValor('categoriaCabo'),
        materialSEQ: lerValor('materialSEQ'),
        materialSET: lerValor('materialSET'),
        pontos: lerPontosPorServico()
    };
}

function calcularMalhaHorizontal() {
    const dados = lerFormularioHorizontal();
    const totalServicos = Object.values(dados.pontos).reduce((total, pontos) => total + pontos, 0);
    const pontosPorPavimento = Math.max(dados.numPontosPavimento, totalServicos);
    const pontosNaoClassificados = Math.max(dados.numPontosPavimento - totalServicos, 0);
    const totalPontos = pontosPorPavimento * dados.numPavimentosMH;
    const quantidadePatchPanels = Math.ceil(totalPontos / 24);
    const quantidadeTomadas = totalPontos;

    return {
        totalCaboUTPMetros: ((dados.mediaDistancia * totalPontos) + (100 * dados.numPavimentosMH)).toFixed(2),
        quantidadeConectoresRJ45: totalPontos * 2,
        quantidadePatchPanels,
        quantidadePatchCords: totalPontos + 10,
        quantidadeTomadas,
        quantidadeCaixas: Math.ceil(totalPontos / 2),
        categoriaCabo: dados.categoriaCabo,
        totalPontos,
        materialSEQ: dados.materialSEQ,
        materialSET: dados.materialSET,
        materialSEQQtd: quantidadePatchPanels,
        materialSETQtd: quantidadeTomadas,
        salas: montarMateriaisPorSala({
            quantidadePatchPanels,
            quantidadePatchCords: totalPontos + 10,
            quantidadeTomadas,
            quantidadeCaixas: Math.ceil(totalPontos / 2)
        }),
        detalhes: montarDetalhesPontos(dados.pontos, dados.numPavimentosMH, pontosNaoClassificados)
    };
}

function montarMateriaisPorSala(quantidades) {
    return {
        seq: [
            linha('Patch Panel RJ45', quantidades.quantidadePatchPanels),
            linha('Patch Cord', quantidades.quantidadePatchCords),
            linha('Caixa de Terminação', quantidades.quantidadeCaixas)
        ],
        set: [
            linha('Tomada RJ45', quantidades.quantidadeTomadas),
            linha('Caixa 2x2', quantidades.quantidadeCaixas),
            linha('Roseta', quantidades.quantidadeTomadas)
        ]
    };
}

function montarDetalhesPontos(pontos, pavimentos, naoClassificados) {
    return {
        pontosDados: pontos.pontosDados * pavimentos,
        pontosVoz: pontos.pontosVoz * pavimentos,
        pontosCFTV: pontos.pontosCFTV * pavimentos,
        pontosWiFi: pontos.pontosWiFi * pavimentos,
        pontosOutros: (pontos.pontosOutros + naoClassificados) * pavimentos
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
        `Cabo de fibra óptica ${tipoCabo} ${caracteristica} - (${formatarMedida(backbone.caboOticoBaseMetros)} x 2 x 1,2=${formatarMedida(backbone.totalCaboOticoMetros)}m) - com ${backbone.numFibras} fibras;`,
        `DIO - Distribuidor Interno Óptico - usar ${formatarQuantidade(materiais.portasDIO)} portas - 1 Chassi de 19" (24 portas) - 1U - ${formatarQuantidade(materiais.quantidadeDIO)} unidade${unidadeDIO};`,
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
    const excel = contexto === 'excel';
    return [
        linha('Categoria do Cabo', horizontal.categoriaCabo),
        linha(excel ? 'Total de Cabo UTP (m)' : 'Total de Cabo UTP', `${horizontal.totalCaboUTPMetros}${excel ? '' : ' m'}`),
        linha('Total de Pontos', horizontal.totalPontos),
        linha('- Pontos Dados', horizontal.detalhes.pontosDados),
        linha('- Pontos Voz', horizontal.detalhes.pontosVoz),
        ...linhasCondicionaisPontos(horizontal.detalhes),
        linha(excel ? 'Conectores RJ45' : 'Quantidade de Conectores RJ45', horizontal.quantidadeConectoresRJ45),
        linha(excel ? 'Patch Panels' : 'Quantidade de Patch Panels', horizontal.quantidadePatchPanels),
        linha(excel ? 'Patch Cords' : 'Quantidade de Patch Cords', horizontal.quantidadePatchCords),
        linha(excel ? 'Tomadas' : 'Quantidade de Tomadas', horizontal.quantidadeTomadas),
        linha(excel ? 'Caixas' : 'Quantidade de Caixas', horizontal.quantidadeCaixas),
        ...montarLinhasSalas(horizontal.salas)
    ];
}

function montarLinhasSalas(salas) {
    return [
        linhaColspan('Sala de Equipamentos (SEQ)', 'section-row'),
        ...salas.seq,
        linhaColspan('Sala de Telecom (SET)', 'section-row'),
        ...salas.set
    ];
}

function linhasCondicionaisPontos(detalhes) {
    return [
        ['- Pontos CFTV', detalhes.pontosCFTV],
        ['- Pontos Wi-Fi', detalhes.pontosWiFi],
        ['- Pontos Outros', detalhes.pontosOutros]
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
    $(idCard).style.display = linhas ? 'block' : 'none';
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
    ['resultado', 'backboneSection', 'horizontalSection', 'calcularContainer'].forEach(id => {
        $(id).style.display = 'none';
    });
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
        secoes.push(montarSecaoExcel('MALHA HORIZONTAL', montarLinhasHorizontal(ultimosResultados.horizontal, 'excel')));
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

    alert('Arquivo Excel gerado com sucesso!');
}

function rolarPara(id) {
    setTimeout(() => $(id).scrollIntoView({ behavior: 'smooth' }), 100);
}
