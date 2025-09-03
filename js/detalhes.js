import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { AUTHORIZED_EMAIL } from './config.js';

// Usa instâncias já inicializadas
const db = getFirestore();
const auth = getAuth();

const EMAIL_AUTORIZADO = AUTHORIZED_EMAIL;

// Variáveis globais para armazenar dados
let animeOriginal = null;
let temporadaAtual = null;

// Função para obter ID da URL
function obterIdDaUrl() {
    if (window.routeParams) {
        return window.routeParams.get('id');
    }
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Função para carregar detalhes do anime
async function carregarDetalhes() {
    const animeId = obterIdDaUrl();
    
    if (!animeId) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('anime-detalhes').innerHTML = '<div class="danger">ID do anime não encontrado.</div>';
        return;
    }

    try {
        // Tenta buscar na coleção "animes" primeiro
        let docRef = doc(db, "animes", animeId);
        let docSnap = await getDoc(docRef);

        // Se não encontrar e usuário for autorizado, tenta na coleção "outros"
        if (!docSnap.exists()) {
            const user = auth.currentUser;
            if (user && user.email === EMAIL_AUTORIZADO) {
                docRef = doc(db, "outros", animeId);
                docSnap = await getDoc(docRef);
            }
        }

        document.getElementById('loading').style.display = 'none';

        if (docSnap.exists()) {
            const anime = docSnap.data();
            animeOriginal = anime; // Armazena dados originais
            exibirDetalhes(anime);
        } else {
            document.getElementById('anime-detalhes').innerHTML = '<div class="danger">Anime não encontrado.</div>';
        }
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('anime-detalhes').innerHTML = `<div class="danger">Erro ao carregar: ${error.message}</div>`;
    }
}

// Função para exibir detalhes do anime ou temporada
function exibirDetalhes(anime, temporada = null) {
    const isTemporada = temporada !== null;
    const dados = isTemporada ? temporada : anime;
    
    const generosTexto = anime.generos ? anime.generos.join(', ') : anime.genero || 'N/A';
    
    // Usa imagem da temporada se estiver visualizando uma temporada e ela tiver imagem
    const imagemUrl = isTemporada && dados.imagem ? dados.imagem : anime.imagem;
    const imagemHtml = imagemUrl ? `<img src="${imagemUrl}" alt="${anime.nome}" class="anime-image-detalhes">` : '';
    
    // Botão agora fica no header
    
    // Monta descrições com sanitização
    let descricoesHtml = '';
    if (isTemporada) {
        if (dados.descricoes && dados.descricoes.length > 0) {
            descricoesHtml = dados.descricoes.map((desc, index) => {
                const descSegura = desc.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `<div class="descricao-item">
                    <strong>Versão ${index + 1}:</strong>
                    <p>${descSegura}</p>
                </div>`;
            }).join('');
        } else if (dados.descricao) {
            const descSegura = dados.descricao.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            descricoesHtml = `<div class="descricao-item"><p>${descSegura}</p></div>`;
        } else {
            descricoesHtml = '<p>Nenhuma descrição disponível</p>';
        }
    } else {
        if (anime.descricoes && anime.descricoes.length > 0) {
            descricoesHtml = anime.descricoes.map((desc, index) => {
                const descSegura = desc.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `<div class="descricao-item">
                    <strong>Versão ${index + 1}:</strong>
                    <p>${descSegura}</p>
                </div>`;
            }).join('');
        } else if (anime.descricao) {
            const descSegura = anime.descricao.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            descricoesHtml = `<div class="descricao-item"><p>${descSegura}</p></div>`;
        } else {
            descricoesHtml = '<p>Nenhuma descrição disponível</p>';
        }
    }

    const titulo = isTemporada ? 
        `${dados.numero}ª Temporada - ${dados.nome || anime.nome}` : 
        `#${anime.ordem || 'N/A'} - ${anime.nome}`;
    
    const nota = isTemporada ? 
        (dados.nota !== null && dados.nota !== undefined ? dados.nota + '/10 ⭐' : 'Não avaliado') :
        (anime.nota !== null ? anime.nota + '/10 ⭐' : 'Não avaliado');

    // Verifica se usuário está autorizado para mostrar botão alterar
    const user = auth.currentUser;
    const isAuthorized = user && user.email === EMAIL_AUTORIZADO;
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id');
    
    let botoesAdmin = '';
    if (isAuthorized) {
        const animeIdCorreto = obterIdDaUrl();
        let botaoAlterar = '';
        let botaoAssistir = '';
        
        if (isTemporada) {
            botaoAlterar = `<button onclick="alterarTemporada('${animeIdCorreto}', ${temporada.numero})" class="btn-alterar-detalhes">Alterar</button>`;
        } else {
            botaoAlterar = `<button onclick="alterarAnimeDetalhes('${animeIdCorreto}')" class="btn-alterar-detalhes">Alterar</button>`;
        }
        
        // Adiciona botão Assistir se houver anime_slug
        let slugParaAssistir = anime.anime_slug;
        
        // Se estiver visualizando temporada e ela tiver slug, usar o da temporada
        if (isTemporada && temporada.anime_slug) {
            slugParaAssistir = temporada.anime_slug;
        }
        
        if (slugParaAssistir) {
            botaoAssistir = `<button onclick="window.open('http://18.230.118.237/assistir?anime=${slugParaAssistir}', '_blank')" class="btn-assistir-detalhes">Assistir</button>`;
        }
        
        botoesAdmin = botaoAlterar + botaoAssistir;
    }
    
    // Sanitiza dados antes de inserir no DOM
    const tituloSeguro = titulo.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const generosSeguro = generosTexto.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    const detalhesHtml = `
        <div class="anime-detalhes-container">
            ${imagemHtml}
            <div class="anime-detalhes-content">
                <div class="anime-detalhes-titulo">
                    <div><h2>${tituloSeguro}</h2></div>
                    <div class="divAlterar">${botoesAdmin}</div>
                </div>
                <div class="detalhes-info">
                    <p><strong>Nota:</strong> ${nota}</p>
                    <p><strong>Gêneros:</strong> ${generosSeguro}</p>
                    <div class="descricao-detalhes">
                        <strong>Descrições:</strong>
                        ${descricoesHtml}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('anime-detalhes').innerHTML = detalhesHtml;
    
    // Sempre exibe temporadas se existirem
    if (anime.temporadas && anime.temporadas.length > 0) {
        exibirTemporadas(anime.temporadas, anime.nome, isTemporada ? temporada.numero : null);
    }
    
    // Atualiza apenas o h1, mantém título da página inalterado
    const tituloH1 = isTemporada ? 
        `${dados.numero}ª Temporada - ${dados.nome || anime.nome}` : 
        `#${anime.ordem || 'N/A'} - ${anime.nome}`;
    
    // Sanitiza título antes de inserir no DOM
    const tituloH1Seguro = tituloH1.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const nomeAnimeSeguro = anime.nome.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Título da página sempre do anime principal
    if (!document.title.includes(anime.nome)) {
        document.title = `${nomeAnimeSeguro} - Lista de Animes`;
    }
    
    document.querySelector('#detalhes_titulo').innerHTML = tituloH1Seguro;
    
    // Adiciona botão voltar ao anime no header se estiver visualizando temporada
    const divVoltar = document.getElementById('div-voltar');
    if (isTemporada) {
        const nomeAnimeSeguroBtn = anime.nome.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        divVoltar.innerHTML = `
            <button onclick="voltarParaAnime()" class="btn-principal">← ${nomeAnimeSeguroBtn}</button>
            <button onclick="window.location.href='index.html'" class="btn-voltar">← Voltar</button>
        `;
    } else {
        divVoltar.innerHTML = '<button onclick="window.location.href=\'index.html\'" class="btn-voltar">← Voltar</button>';
    }
}

// Função para exibir temporadas
function exibirTemporadas(temporadas, nomeAnime, temporadaAtiva = null) {
    const container = document.getElementById('temporadas');
    const temporadasContainer = document.getElementById('temporadas-container');
    
    // Mostra o container de temporadas
    temporadasContainer.style.display = 'block';
    
    // Verifica se usuário está autorizado
    const user = auth.currentUser;
    const isAuthorized = user && user.email === EMAIL_AUTORIZADO;
    
    container.innerHTML = '';
    
    // Ordena temporadas por número
    const temporadasOrdenadas = temporadas.sort((a, b) => (a.numero || 0) - (b.numero || 0));
    
    temporadasOrdenadas.forEach(temporada => {
        const div = document.createElement('div');
        const isAtiva = temporadaAtiva === temporada.numero;
        div.className = isAtiva ? 'anime anime-ativo' : 'anime';
        
        const botaoAlterarTemporada = isAuthorized ? `<button onclick="alterarTemporada('${animeOriginal.id || animeOriginal.ordem}', ${temporada.numero})" class="btn-alterar">Alterar</button>` : '';
        const botaoVisualizarTemporada = isAtiva ? 
            `<button onclick="voltarParaAnime()" class="btn-visualizar" id="btn-visualizar_detalhes">Voltar ao Anime</button>` :
            `<button onclick="visualizarTemporada(${temporada.numero})" class="btn-visualizar">Visualizar</button>`;
        
        // Sanitiza dados antes de inserir no DOM
        const descricaoSegura = temporada.descricao ? temporada.descricao.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
        const nomeTemporadaSeguro = temporada.nome ? temporada.nome.replace(/</g, '&lt;').replace(/>/g, '&gt;') : nomeAnime;
        const nomeAnimeSeguro = nomeAnime.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        const generosTexto = animeOriginal.generos ? animeOriginal.generos.join(', ') : animeOriginal.genero || 'N/A';
        const generosSeguro = generosTexto.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const imagemHtml = temporada.imagem ? `<img src="${temporada.imagem}" alt="${nomeTemporadaSeguro || nomeAnimeSeguro}" class="anime-image">` : '';
        
        div.innerHTML = `
            ${imagemHtml}
            <div class="anime-content">
                <h3>${temporada.numero}ª Temporada - ${nomeTemporadaSeguro || nomeAnimeSeguro} ${isAtiva ? '(Visualizando)' : ''}</h3>
                <p><strong>Nota:</strong> ${temporada.nota !== null && temporada.nota !== undefined ? temporada.nota + '/10 ⭐' : '???'}</p>
                <p><strong>Gêneros:</strong> ${generosSeguro}</p>
                <p><strong>Descrição:</strong> ${descricaoSegura}</p>
                <div class="botoes-anime">
                    ${botaoVisualizarTemporada}
                    ${botaoAlterarTemporada}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// Função para visualizar temporada
window.visualizarTemporada = (numeroTemporada) => {
    const temporada = animeOriginal.temporadas.find(t => t.numero === numeroTemporada);
    if (temporada) {
        temporadaAtual = temporada;
        exibirDetalhes(animeOriginal, temporada);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Função para voltar ao anime principal
window.voltarParaAnime = () => {
    temporadaAtual = null;
    exibirDetalhes(animeOriginal);
};

// Função para alterar anime dos detalhes
window.alterarAnimeDetalhes = (animeId) => {
    if (typeof navigateTo !== 'undefined') {
        navigateTo(`alterar?id=${animeId}`);
    } else {
        window.location.href = `alterar_anime.html?id=${animeId}`;
    }
};

// Função para alterar temporada
window.alterarTemporada = (animeId, numeroTemporada) => {
    const urlParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '');
    const idCorreto = urlParams.get('id');
    if (typeof navigateTo !== 'undefined') {
        navigateTo(`alterar?id=${idCorreto}&temporada=${numeroTemporada}`);
    } else {
        window.location.href = `alterar_anime.html?id=${idCorreto}&temporada=${numeroTemporada}`;
    }
};

// Função de inicialização
async function inicializar() {
    await carregarDetalhes();
    // Mostra a página após tudo carregar
    setTimeout(() => {
        console.log("Carregando...");
        document.body.classList.add('loaded');
    }, 100);
}

// Monitora autenticação e carrega detalhes
onAuthStateChanged(auth, (user) => {
    // Não precisa recarregar aqui, já é feito na inicialização
});

// Executa inicialização quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
} else {
    setTimeout(inicializar, 100);
}

// Exporta função para uso no SPA
window.inicializarApp = inicializar;