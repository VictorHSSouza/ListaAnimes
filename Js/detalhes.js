import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyDYjQHR5D9R6-NeI2F1rKHcE96awGqH6to",
    authDomain: "listaanimes-ace11.firebaseapp.com",
    projectId: "listaanimes-ace11",
    storageBucket: "listaanimes-ace11.firebasestorage.app",
    messagingSenderId: "670425575167",
    appId: "1:670425575167:web:b19728f277cf78879966ca",
    measurementId: "G-53EZCLPMZD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const EMAIL_AUTORIZADO = 'victorhenriquesantanasouza@gmail.com';

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
    
    // Monta descrições
    let descricoesHtml = '';
    if (isTemporada) {
        if (dados.descricoes && dados.descricoes.length > 0) {
            descricoesHtml = dados.descricoes.map((desc, index) => 
                `<div class="descricao-item">
                    <strong>Versão ${index + 1}:</strong>
                    <p>${desc}</p>
                </div>`
            ).join('');
        } else if (dados.descricao) {
            descricoesHtml = `<div class="descricao-item"><p>${dados.descricao}</p></div>`;
        } else {
            descricoesHtml = '<p>Nenhuma descrição disponível</p>';
        }
    } else {
        if (anime.descricoes && anime.descricoes.length > 0) {
            descricoesHtml = anime.descricoes.map((desc, index) => 
                `<div class="descricao-item">
                    <strong>Versão ${index + 1}:</strong>
                    <p>${desc}</p>
                </div>`
            ).join('');
        } else if (anime.descricao) {
            descricoesHtml = `<div class="descricao-item"><p>${anime.descricao}</p></div>`;
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
    
    let botaoAlterar = '';
    if (isAuthorized) {
        const animeIdCorreto = obterIdDaUrl();
        if (isTemporada) {
            botaoAlterar = `<button onclick="alterarTemporada('${animeIdCorreto}', ${temporada.numero})" class="btn-alterar-detalhes">Alterar</button>`;
        } else {
            botaoAlterar = `<button onclick="alterarAnimeDetalhes('${animeIdCorreto}')" class="btn-alterar-detalhes">Alterar</button>`;
        }
    }
    
    const detalhesHtml = `
        <div class="anime-detalhes-container">
            ${imagemHtml}
            <div class="anime-detalhes-content">
                <div class="anime-detalhes-titulo">
                    <div><h2>${titulo}</h2></div>
                    <div>${botaoAlterar}</div>
                </div>
                <div class="detalhes-info">
                    <p><strong>Nota:</strong> ${nota}</p>
                    <p><strong>Gêneros:</strong> ${generosTexto}</p>
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
    
    // Título da página sempre do anime principal
    if (!document.title.includes(anime.nome)) {
        document.title = `${anime.nome} - Lista de Animes`;
    }
    
    document.querySelector('h1').innerHTML = tituloH1;
    
    // Adiciona botão voltar ao anime no header se estiver visualizando temporada
    const divVoltar = document.getElementById('div-voltar');
    if (isTemporada) {
        divVoltar.innerHTML = `
            <button onclick="voltarParaAnime()" class="btn-principal">← ${anime.nome}</button>
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
        
        const descricaoExibida = temporada.descricao;
        
        const generosTexto = animeOriginal.generos ? animeOriginal.generos.join(', ') : animeOriginal.genero || 'N/A';
        const imagemHtml = temporada.imagem ? `<img src="${temporada.imagem}" alt="${temporada.nome || nomeAnime}" class="anime-image">` : '';
        
        div.innerHTML = `
            ${imagemHtml}
            <div class="anime-content">
                <h3>${temporada.numero}ª Temporada - ${temporada.nome || nomeAnime} ${isAtiva ? '(Visualizando)' : ''}</h3>
                <p><strong>Nota:</strong> ${temporada.nota !== null && temporada.nota !== undefined ? temporada.nota + '/10 ⭐' : '???'}</p>
                <p><strong>Gêneros:</strong> ${generosTexto}</p>
                <p><strong>Descrição:</strong> ${descricaoExibida}</p>
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

// Monitora autenticação e carrega detalhes
onAuthStateChanged(auth, (user) => {
    carregarDetalhes();
});