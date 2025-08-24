let dadosAnimes = [];
let chartNotas = null;
let chartGeneros = null;
let chartQuantidade = null;

async function carregarEstatisticas() {
    const loading = document.getElementById('loading');
    loading.style.display = 'block';

    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const animes = [];
        const querySnapshot = await getDocs(collection(window.db, 'animes'));

        querySnapshot.forEach((doc) => {
            animes.push(doc.data());
        });
        
        dadosAnimes = animes;
        calcularEstatisticas(animes);

    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    } finally {
        loading.style.display = 'none';
    }
}

function calcularEstatisticas(animes) {
    // Total de animes
    document.getElementById('total-animes').textContent = animes.length;

    // Nota média
    const animesComNota = animes.filter(anime => anime.nota && anime.nota > 0);
    const notaMedia = animesComNota.length > 0
        ? (animesComNota.reduce((sum, anime) => sum + anime.nota, 0) / animesComNota.length).toFixed(2)
        : '0';
    document.getElementById('nota-media').textContent = notaMedia;

    // Gênero mais comum
    const generos = {};
    animes.forEach(anime => {
        if (anime.generos && Array.isArray(anime.generos)) {
            anime.generos.forEach(genero => {
                generos[genero] = (generos[genero] || 0) + 1;
            });
        }
    });

    const generoMaisComum = Object.keys(generos).length > 0
        ? Object.keys(generos).reduce((a, b) => generos[a] > generos[b] ? a : b)
        : 'Nenhum';
    document.getElementById('genero-comum').textContent = generoMaisComum;

    // Animes com nota 10
    const animesNota10 = animes.filter(anime => anime.nota === 10).length;
    document.getElementById('nota-dez').textContent = animesNota10;

    // Criar gráficos
    criarGraficoNotas(animes);
    criarGraficoGeneros(animes);
    criarGraficoQuantidade(animes);
}

function criarGraficoNotas(animes) {
    const canvas = document.getElementById('notasChart');
    const ctx = canvas.getContext('2d');
    
    // Destrói gráfico existente usando Chart.getChart()
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }
    
    if (chartNotas) {
        chartNotas.destroy();
        chartNotas = null;
    }
    
    const ordenarPorNota = document.getElementById('ordenarPorNota').checked;
    let animesComNota = animes.filter(anime => anime.nota && anime.nota > 0);
    
    if (ordenarPorNota) {
        animesComNota.sort((a, b) => b.nota - a.nota);
    } else {
        animesComNota.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    }

    chartNotas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: animesComNota.map(anime => anime.nome.length > 12 ? anime.nome.substring(0, 12) + '...' : anime.nome),
            datasets: [{
                label: 'Nota',
                data: animesComNota.map(anime => anime.nota),
                backgroundColor: animesComNota.map(anime => {
                    if (anime.nota >= 9) return '#4CAF50';
                    if (anime.nota >= 8) return '#8BC34A';
                    if (anime.nota >= 7) return '#CDDC39';
                    if (anime.nota >= 6) return '#FFC107';
                    if (anime.nota >= 5) return '#FF9800';
                    if (anime.nota >= 4) return '#FF5722';
                    return '#F44336';
                })
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function criarGraficoGeneros(animes) {
    const canvas = document.getElementById('generosChart');
    const ctx = canvas.getContext('2d');
    
    // Destrói gráfico existente usando Chart.getChart()
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }
    
    if (chartGeneros) {
        chartGeneros.destroy();
        chartGeneros = null;
    }
    
    const animesComNota = animes.filter(anime => anime.nota && anime.nota > 0);
    const generoStats = {};
    
    animesComNota.forEach(anime => {
        if (anime.generos && Array.isArray(anime.generos)) {
            anime.generos.forEach(genero => {
                if (!generoStats[genero]) {
                    generoStats[genero] = { total: 0, count: 0 };
                }
                generoStats[genero].total += anime.nota;
                generoStats[genero].count += 1;
            });
        }
    });
    
    const ordenarPorMedia = document.getElementById('ordenarGenerosPorMedia').checked;
    let generoMedias = Object.keys(generoStats)
        .filter(genero => genero !== 'Hentai')
        .map(genero => ({
            genero,
            media: generoStats[genero].total / generoStats[genero].count
        }));
    
    if (ordenarPorMedia) {
        generoMedias.sort((a, b) => b.media - a.media);
    } else {
        generoMedias.sort((a, b) => a.genero.localeCompare(b.genero));
    }
    
    chartGeneros = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: generoMedias.map(item => item.genero),
            datasets: [{
                label: 'Média',
                data: generoMedias.map(item => item.media),
                backgroundColor: generoMedias.map(item => {
                    if (item.media >= 9) return '#4CAF50';
                    if (item.media >= 8) return '#8BC34A';
                    if (item.media >= 7) return '#CDDC39';
                    if (item.media >= 6) return '#FFC107';
                    if (item.media >= 5) return '#FF9800';
                    if (item.media >= 4) return '#FF5722';
                    return '#F44336';
                })
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

window.atualizarGraficos = function() {
    if (dadosAnimes.length > 0) {
        criarGraficoNotas(dadosAnimes);
        criarGraficoGeneros(dadosAnimes);
        criarGraficoQuantidade(dadosAnimes);
    }
}

function criarGraficoQuantidade(animes) {
    const canvas = document.getElementById('quantidadeChart');
    const ctx = canvas.getContext('2d');
    
    // Destrói gráfico existente usando Chart.getChart()
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }
    
    if (chartQuantidade) {
        chartQuantidade.destroy();
        chartQuantidade = null;
    }
    
    const generoCount = {};
    
    animes.forEach(anime => {
        if (anime.generos && Array.isArray(anime.generos)) {
            anime.generos.forEach(genero => {
                generoCount[genero] = (generoCount[genero] || 0) + 1;
            });
        }
    });
    
    const ordenarPorQuantidade = document.getElementById('ordenarQuantidadePorTotal').checked;
    let generoQuantidades = Object.keys(generoCount)
        .filter(genero => genero !== 'Hentai')
        .map(genero => ({
            genero,
            quantidade: generoCount[genero]
        }));
    
    if (ordenarPorQuantidade) {
        generoQuantidades.sort((a, b) => b.quantidade - a.quantidade);
    } else {
        generoQuantidades.sort((a, b) => a.genero.localeCompare(b.genero));
    }
    
    chartQuantidade = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: generoQuantidades.map(item => item.genero),
            datasets: [{
                label: 'Quantidade',
                data: generoQuantidades.map(item => item.quantidade),
                backgroundColor: '#007cba'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Função para destruir gráficos existentes
function destruirGraficos() {
    if (chartNotas) {
        chartNotas.destroy();
        chartNotas = null;
    }
    if (chartGeneros) {
        chartGeneros.destroy();
        chartGeneros = null;
    }
    if (chartQuantidade) {
        chartQuantidade.destroy();
        chartQuantidade = null;
    }
}

// Função de inicialização
async function inicializar() {
    destruirGraficos();
    await carregarEstatisticas();
    // Mostra a página após tudo carregar
    setTimeout(() => {
        console.log("Carregando...");
        document.body.classList.add('loaded');
    }, 100);
}

// Inicialização da página de estatísticas
window.inicializarApp = inicializar;