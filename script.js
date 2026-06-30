let calculoAtivo = null;
let ultimosResultados = null;

document.addEventListener('DOMContentLoaded', function() {
    inicializarEventos();
});

function inicializarEventos() {
    const btnBackbone = document.getElementById('btnBackbone');
    const btnHorizontal = document.getElementById('btnHorizontal');
    const btnComplete = document.getElementById('btnComplete');

    btnBackbone.addEventListener('click', () => selecionarTipo('backbone'));
    btnHorizontal.addEventListener('click', () => selecionarTipo('horizontal'));
    btnComplete.addEventListener('click', () => selecionarTipo('complete'));

    document.getElementById('calcularBtn').addEventListener('click', realizarCalculo);

    document.getElementById('novoCalculoBtn').addEventListener('click', novoCalculo);
    document.getElementById('exportExcelBtn').addEventListener('click', exportarExcel);

}

function selecionarTipo(tipo) {
    calculoAtivo = tipo;

    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if (tipo === 'backbone') {
        document.getElementById('btnBackbone').classList.add('active');
    } else if (tipo === 'horizontal') {
        document.getElementById('btnHorizontal').classList.add('active');
    } else if (tipo === 'complete') {
        document.getElementById('btnComplete').classList.add('active');
    }

    document.getElementById('backboneSection').style.display = (tipo === 'backbone' || tipo === 'complete') ? 'block' : 'none';
    document.getElementById('horizontalSection').style.display = (tipo === 'horizontal' || tipo === 'complete') ? 'block' : 'none';

    setTimeout(() => {
        document.getElementById('calculadora').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function realizarCalculo(e) {
    e.preventDefault();

    if (!calculoAtivo) {
        alert('Por favor, selecione um tipo de cálculo!');
        return;
    }

    ultimosResultados = {
        backbone: null,
        horizontal: null,
        tipo: calculoAtivo
    };

    if (calculoAtivo === 'backbone' || calculoAtivo === 'complete') {
        ultimosResultados.backbone = calcularBackbone();
    }

    if (calculoAtivo === 'horizontal' || calculoAtivo === 'complete') {
        ultimosResultados.horizontal = calcularMalhaHorizontal();
    }

    exibirResultados();
}

function calcularBackbone() {
    const numPavimentos = parseInt(document.getElementById('numPavimentos').value) || 1;
    const numFibras = parseInt(document.getElementById('numFibras').value) || 12;
    const mediaLance = parseFloat(document.getElementById('mediaLance').value) || 50;
    const tipoFibra = document.getElementById('tipoFibra').value;
    const caracteristicaFibra = document.getElementById('caracteristicaFibra').value || 'Não especificada';
    const qtdBackbonesAndar = parseInt(document.getElementById('qtdBackbonesAndar').value) || 1;
    const backbonePrimario = document.getElementById('backbonePrimario').checked;
    const backboneSecundario = document.getElementById('backboneSecundario').checked;

    const totalPavimentos = numPavimentos;
    const backbonesPorAndar = qtdBackbonesAndar;
    const totalBackbones = backbonesPorAndar * totalPavimentos;

    let multiplicadorBackbone = 1;
    if (backbonePrimario && backboneSecundario) multiplicadorBackbone = 2;
    else if (backbonePrimario || backboneSecundario) multiplicadorBackbone = 1.5;

    const totalCaboOticoMetros = (mediaLance * totalBackbones * multiplicadorBackbone) + (50 * totalPavimentos);
    const quantidadeFibras = Math.ceil((totalCaboOticoMetros / 1000) * numFibras);

    return {
        totalCaboOticoMetros: totalCaboOticoMetros.toFixed(2),
        quantidadeFibras: quantidadeFibras,
        tipoFibra: tipoFibra,
        caracteristicaFibra: caracteristicaFibra,
        totalBackbones: totalBackbones,
        backbonePrimario: backbonePrimario,
        backboneSecundario: backboneSecundario
    };
}

function calcularMalhaHorizontal() {
    const numPavimentosMH = parseInt(document.getElementById('numPavimentosMH').value) || 1;
    const numPontosPavimento = parseInt(document.getElementById('numPontosPavimento').value) || 50;
    const mediaDistancia = parseFloat(document.getElementById('mediaDistancia').value) || 100;
    const categoriaCabo = document.getElementById('categoriaCabo').value;
    const materialSEQ = document.getElementById('materialSEQ').value;
    const materialSET = document.getElementById('materialSET').value;

    const pontosDados = parseInt(document.getElementById('pontosDados').value) || 0;
    const pontosVoz = parseInt(document.getElementById('pontosVoz').value) || 0;
    const pontosCFTV = parseInt(document.getElementById('pontosCFTV').value) || 0;
    const pontosWiFi = parseInt(document.getElementById('pontosWiFi').value) || 0;
    const pontosOutros = parseInt(document.getElementById('pontosOutros').value) || 0;

    const totalPontos = (pontosDados + pontosVoz + pontosCFTV + pontosWiFi + pontosOutros) * numPavimentosMH;
    const totalCaboUTPMetros = (mediaDistancia * totalPontos) + (100 * numPavimentosMH);
    const quantidadeConectoresRJ45 = totalPontos * 2;
    const quantidadePatchPanels = Math.ceil(totalPontos / 24);
    const quantidadePatchCords = totalPontos + 10;
    const quantidadeTomadas = totalPontos;
    const quantidadeCaixas = Math.ceil(totalPontos / 2);

    const materialSEQQtd = quantidadePatchPanels;
    const materialSETQtd = quantidadeTomadas;

    return {
        totalCaboUTPMetros: totalCaboUTPMetros.toFixed(2),
        quantidadeConectoresRJ45: quantidadeConectoresRJ45,
        quantidadePatchPanels: quantidadePatchPanels,
        quantidadePatchCords: quantidadePatchCords,
        quantidadeTomadas: quantidadeTomadas,
        quantidadeCaixas: quantidadeCaixas,
        categoriaCabo: categoriaCabo,
        totalPontos: totalPontos,
        materialSEQ: materialSEQ,
        materialSETQtd: materialSETQtd,
        materialSET: materialSET,
        materialSEQQtd: materialSEQQtd,
        detalhes: {
            pontosDados: pontosDados * numPavimentosMH,
            pontosVoz: pontosVoz * numPavimentosMH,
            pontosCFTV: pontosCFTV * numPavimentosMH,
            pontosWiFi: pontosWiFi * numPavimentosMH,
            pontosOutros: pontosOutros * numPavimentosMH
        }
    };
}

function exibirResultados() {
    document.getElementById('resultado').style.display = 'block';
    
    if (ultimosResultados.backbone) {
        document.getElementById('resultBackbone').style.display = 'block';
        const backboneBody = document.getElementById('resultBackboneBody');
        backboneBody.innerHTML = `
            <tr>
                <td>Total de Cabo Óptico</td>
                <td>${ultimosResultados.backbone.totalCaboOticoMetros} m</td>
            </tr>
            <tr>
                <td>Tipo de Fibra</td>
                <td>${ultimosResultados.backbone.tipoFibra} (${ultimosResultados.backbone.caracteristicaFibra})</td>
            </tr>
            <tr>
                <td>Quantidade de Fibras</td>
                <td>${ultimosResultados.backbone.quantidadeFibras}</td>
            </tr>
            <tr>
                <td>Total de Backbones</td>
                <td>${ultimosResultados.backbone.totalBackbones}</td>
            </tr>
            <tr>
                <td>Backbone Primário</td>
                <td>${ultimosResultados.backbone.backbonePrimario ? 'Sim' : 'Não'}</td>
            </tr>
            <tr>
                <td>Backbone Secundário</td>
                <td>${ultimosResultados.backbone.backboneSecundario ? 'Sim' : 'Não'}</td>
            </tr>
        `;
    } else {
        document.getElementById('resultBackbone').style.display = 'none';
    }

    if (ultimosResultados.horizontal) {
        document.getElementById('resultHorizontal').style.display = 'block';
        const horizontalBody = document.getElementById('resultHorizontalBody');
        horizontalBody.innerHTML = `
            <tr>
                <td>Categoria do Cabo</td>
                <td>${ultimosResultados.horizontal.categoriaCabo}</td>
            </tr>
            <tr>
                <td>Total de Cabo UTP</td>
                <td>${ultimosResultados.horizontal.totalCaboUTPMetros} m</td>
            </tr>
            <tr>
                <td>Total de Pontos</td>
                <td>${ultimosResultados.horizontal.totalPontos}</td>
            </tr>
            <tr>
                <td>- Pontos Dados</td>
                <td>${ultimosResultados.horizontal.detalhes.pontosDados}</td>
            </tr>
            <tr>
                <td>- Pontos Voz</td>
                <td>${ultimosResultados.horizontal.detalhes.pontosVoz}</td>
            </tr>
            ${ultimosResultados.horizontal.detalhes.pontosCFTV > 0 ? `
            <tr>
                <td>- Pontos CFTV</td>
                <td>${ultimosResultados.horizontal.detalhes.pontosCFTV}</td>
            </tr>` : ''}
            ${ultimosResultados.horizontal.detalhes.pontosWiFi > 0 ? `
            <tr>
                <td>- Pontos Wi-Fi</td>
                <td>${ultimosResultados.horizontal.detalhes.pontosWiFi}</td>
            </tr>` : ''}
            ${ultimosResultados.horizontal.detalhes.pontosOutros > 0 ? `
            <tr>
                <td>- Pontos Outros</td>
                <td>${ultimosResultados.horizontal.detalhes.pontosOutros}</td>
            </tr>` : ''}
            <tr>
                <td>Quantidade de Conectores RJ45</td>
                <td>${ultimosResultados.horizontal.quantidadeConectoresRJ45}</td>
            </tr>
            <tr>
                <td>Quantidade de Patch Panels</td>
                <td>${ultimosResultados.horizontal.quantidadePatchPanels}</td>
            </tr>
            <tr>
                <td>Quantidade de Patch Cords</td>
                <td>${ultimosResultados.horizontal.quantidadePatchCords}</td>
            </tr>
            <tr>
                <td>Quantidade de Tomadas</td>
                <td>${ultimosResultados.horizontal.quantidadeTomadas}</td>
            </tr>
            <tr>
                <td>Quantidade de Caixas</td>
                <td>${ultimosResultados.horizontal.quantidadeCaixas}</td>
            </tr>
            <tr>
                <td>Material da SEQ: ${ultimosResultados.horizontal.materialSEQ}</td>
                <td>${ultimosResultados.horizontal.materialSEQQtd}</td>
            </tr>
            <tr>
                <td>Material da SET: ${ultimosResultados.horizontal.materialSET}</td>
                <td>${ultimosResultados.horizontal.materialSETQtd}</td>
            </tr>
        `;
    } else {
        document.getElementById('resultHorizontal').style.display = 'none';
    }

    setTimeout(() => {
        document.getElementById('resultado').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function novoCalculo() {
    document.getElementById('calculoForm').reset();
    document.getElementById('resultado').style.display = 'none';
    document.getElementById('backboneSection').style.display = 'none';
    document.getElementById('horizontalSection').style.display = 'none';
    
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    calculoAtivo = null;
    ultimosResultados = null;

    document.querySelector('.calculation-type-section').scrollIntoView({ behavior: 'smooth' });
}

function exportarExcel() {
    if (!ultimosResultados) return;

    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><table border="1" cellpadding="10" cellspacing="0">';
    html += '<tr><td colspan="2"><b>CALCULADORA DE MATERIAIS - CABEAMENTO ESTRUTURADO</b></td></tr>';
    html += '<tr><td colspan="2"><b>Data: ' + new Date().toLocaleDateString('pt-BR') + '</b></td></tr>';
    html += '<tr><td colspan="2"></td></tr>';

    if (ultimosResultados.backbone) {
        html += '<tr><td colspan="2"><b>BACKBONE ÓPTICO</b></td></tr>';
        html += '<tr><td>Total de Cabo Óptico (m)</td><td>' + ultimosResultados.backbone.totalCaboOticoMetros + '</td></tr>';
        html += '<tr><td>Tipo de Fibra</td><td>' + ultimosResultados.backbone.tipoFibra + ' (' + ultimosResultados.backbone.caracteristicaFibra + ')</td></tr>';
        html += '<tr><td>Quantidade de Fibras</td><td>' + ultimosResultados.backbone.quantidadeFibras + '</td></tr>';
        html += '<tr><td>Total de Backbones</td><td>' + ultimosResultados.backbone.totalBackbones + '</td></tr>';
        html += '<tr><td>Backbone Primário</td><td>' + (ultimosResultados.backbone.backbonePrimario ? 'Sim' : 'Não') + '</td></tr>';
        html += '<tr><td>Backbone Secundário</td><td>' + (ultimosResultados.backbone.backboneSecundario ? 'Sim' : 'Não') + '</td></tr>';
        
        html += '<tr><td colspan="2"></td></tr>';
    }

    if (ultimosResultados.horizontal) {
        html += '<tr><td colspan="2"><b>MALHA HORIZONTAL</b></td></tr>';
        html += '<tr><td>Categoria do Cabo</td><td>' + ultimosResultados.horizontal.categoriaCabo + '</td></tr>';
        html += '<tr><td>Total de Cabo UTP (m)</td><td>' + ultimosResultados.horizontal.totalCaboUTPMetros + '</td></tr>';
        html += '<tr><td>Total de Pontos</td><td>' + ultimosResultados.horizontal.totalPontos + '</td></tr>';
        html += '<tr><td>- Pontos Dados</td><td>' + ultimosResultados.horizontal.detalhes.pontosDados + '</td></tr>';
        html += '<tr><td>- Pontos Voz</td><td>' + ultimosResultados.horizontal.detalhes.pontosVoz + '</td></tr>';
        
        if (ultimosResultados.horizontal.detalhes.pontosCFTV > 0) {
            html += '<tr><td>- Pontos CFTV</td><td>' + ultimosResultados.horizontal.detalhes.pontosCFTV + '</td></tr>';
        }
        if (ultimosResultados.horizontal.detalhes.pontosWiFi > 0) {
            html += '<tr><td>- Pontos Wi-Fi</td><td>' + ultimosResultados.horizontal.detalhes.pontosWiFi + '</td></tr>';
        }
        if (ultimosResultados.horizontal.detalhes.pontosOutros > 0) {
            html += '<tr><td>- Pontos Outros</td><td>' + ultimosResultados.horizontal.detalhes.pontosOutros + '</td></tr>';
        }

        html += '<tr><td>Conectores RJ45</td><td>' + ultimosResultados.horizontal.quantidadeConectoresRJ45 + '</td></tr>';
        html += '<tr><td>Patch Panels</td><td>' + ultimosResultados.horizontal.quantidadePatchPanels + '</td></tr>';
        html += '<tr><td>Patch Cords</td><td>' + ultimosResultados.horizontal.quantidadePatchCords + '</td></tr>';
        html += '<tr><td>Tomadas</td><td>' + ultimosResultados.horizontal.quantidadeTomadas + '</td></tr>';
        html += '<tr><td>Caixas</td><td>' + ultimosResultados.horizontal.quantidadeCaixas + '</td></tr>';
        html += '<tr><td>Material da SEQ: ' + ultimosResultados.horizontal.materialSEQ + '</td><td>' + ultimosResultados.horizontal.materialSEQQtd + '</td></tr>';
        html += '<tr><td>Material da SET: ' + ultimosResultados.horizontal.materialSET + '</td><td>' + ultimosResultados.horizontal.materialSETQtd + '</td></tr>';
    }

    html += '</table></body></html>';

    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calcular_materiais_' + new Date().getTime() + '.xls';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    alert('Arquivo Excel gerado com sucesso!');
}

function formatarNumero(num) {
    return num.toLocaleString('pt-BR');
}

function obterValorFormulario(seletor) {
    const elemento = document.querySelector(seletor);
    if (elemento.type === 'checkbox') {
        return elemento.checked;
    }
    return elemento.value;
}
