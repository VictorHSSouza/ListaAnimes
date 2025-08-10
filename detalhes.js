import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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

// Função para obter ID da URL
function obterIdDaUrl() {
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
        const docRef = doc(db, "animes", animeId);
        const docSnap = await getDoc(docRef);

        document.getElementById('loading').style.display = 'none';

        if (docSnap.exists()) {
            const anime = docSnap.data();
            exibirDetalhes(anime);
        } else {
            document.getElementById('anime-detalhes').innerHTML = '<div class="danger">Anime não encontrado.</div>';
        }
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('anime-detalhes').innerHTML = `<div class="danger">Erro ao carregar: ${error.message}</div>`;
    }
}

// Função para exibir detalhes do anime
function exibirDetalhes(anime) {
    const generosTexto = anime.generos ? anime.generos.join(', ') : anime.genero || 'N/A';
    const imagemHtml = anime.imagem ? `<img src="${anime.imagem}" alt="${anime.nome}" class="anime-image-detalhes">` : '';
    
    // Monta todas as descrições
    let descricoesHtml = '';
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

    const detalhesHtml = `
        <div class="anime-detalhes-container">
            ${imagemHtml}
            <div class="anime-detalhes-content">
                <h2>#${anime.ordem || 'N/A'} - ${anime.nome}</h2>
                <div class="detalhes-info">
                    <p><strong>Nota:</strong> ${anime.nota !== null ? anime.nota + '/10 ⭐' : 'Não avaliado'}</p>
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
    
    // Atualiza o título da página e h1
    document.title = `${anime.nome} - Lista de Animes`;
    document.querySelector('h1').innerHTML = `#${anime.ordem || 'N/A'} - ${anime.nome}`;
}

// Carrega detalhes ao iniciar
carregarDetalhes();