import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { AUTHORIZED_EMAIL } from './config.js';

// Usa a instância do Firebase já inicializada
const db = getFirestore();
const auth = getAuth();

// Email autorizado
const EMAIL_AUTORIZADO = AUTHORIZED_EMAIL;

// Função para carregar personagens do anime
async function carregarPersonagensAnime() {
    const urlParams = window.routeParams || new URLSearchParams(window.location.search);
    const animeId = urlParams.get('animeId');

    if (!animeId) {
        mostrarErro();
        return;
    }

    try {
        const querySnapshot = await getDocs(collection(db, "animes"));
        let animeEncontrado = null;

        querySnapshot.forEach((doc) => {
            if (doc.id === animeId) {
                animeEncontrado = { id: doc.id, ...doc.data() };
            }
        });

        if (animeEncontrado && animeEncontrado.personagens && animeEncontrado.personagens.length > 0) {
            exibirPersonagensAnime(animeEncontrado);
        } else if (animeEncontrado) {
            mostrarSemPersonagens(animeEncontrado.nome);
        } else {
            mostrarErro();
        }

    } catch (error) {
        console.error('Erro ao carregar personagens:', error);
        mostrarErro();
    }
}

// Função para exibir personagens do anime
function exibirPersonagensAnime(anime) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('personagens-anime').style.display = 'block';

    const animeSeguro = anime.nome ? anime.nome.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'N/A';
    document.getElementById('animeNome').textContent = `Personagens de ${animeSeguro}`;

    const container = document.getElementById('personagens');
    container.innerHTML = '';

    anime.personagens.forEach((personagem, index) => {
        const personagemCard = document.createElement('div');
        personagemCard.className = 'personagem-collapse';
        personagemCard.id = `personagem-${index}`;

        const nomeSeguro = personagem.nome ? personagem.nome.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'N/A';
        const descricaoSegura = personagem.descricao ? personagem.descricao.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Sem descrição disponível';
        
        const imagemMini = personagem.imagem ? `<img src="${personagem.imagem}" alt="${nomeSeguro}" class="personagem-collapse-mini-image">` : '<div class="personagem-collapse-mini-image" style="background: #ddd;"></div>';
        const imagemGrande = personagem.imagem ? `<img src="${personagem.imagem}" alt="${nomeSeguro}" class="personagem-collapse-image">` : '';

        // Verifica se usuário está autorizado
        const user = auth.currentUser;
        const isAuthorized = user && user.email === EMAIL_AUTORIZADO;
        const nomeEncoded = encodeURIComponent(personagem.nome);
        const btnAlterar = isAuthorized ? 
            `<button onclick="navigateTo('alterar_personagem?animeId=${anime.id}&nome=${nomeEncoded}')" class="btn-alterar">Alterar</button>` : '';

        personagemCard.innerHTML = `
            <div class="personagem-collapse-header" onclick="toggleCollapse(${index})">
                ${imagemMini}
                <span class="personagem-collapse-title">${nomeSeguro}</span>
                <span class="personagem-collapse-arrow">▼</span>
            </div>
            <div class="personagem-collapse-content">
                ${imagemGrande}
                <div class="personagem-collapse-info">
                    <h3>${nomeSeguro}</h3>
                    <div id="favoritos-${index}" style="margin: 5px 0; font-size: 13px; color: #007cba;"></div>
                    <p>${descricaoSegura}</p>
                    <div class="personagem-collapse-actions">
                        ${btnAlterar}
                    </div>
                </div>
            </div>
        `;

        // Carrega favoritos se tiver jikan_id
        if (personagem.jikan_id) {
            carregarFavoritos(personagem.jikan_id, index);
        }

        container.appendChild(personagemCard);
    });

    // Abre o collapse do personagem clicado e faz scroll até ele
    const urlParams = window.routeParams || new URLSearchParams(window.location.search);
    const personagemNome = urlParams.get('nome');
    if (personagemNome) {
        const personagemIndex = anime.personagens.findIndex(p => p.nome === decodeURIComponent(personagemNome));
        if (personagemIndex !== -1) {
            setTimeout(() => {
                toggleCollapse(personagemIndex);
                // Faz scroll até o card do personagem
                const personagemCard = document.getElementById(`personagem-${personagemIndex}`);
                if (personagemCard) {
                    personagemCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 200);
        }
    }
}

// Função para carregar favoritos da API Jikan
async function carregarFavoritos(jikanId, index) {
    try {
        const response = await fetch(`https://api.jikan.moe/v4/characters/${jikanId}/full`);
        const data = await response.json();
        
        const favoritosDiv = document.getElementById(`favoritos-${index}`);
        if (favoritosDiv && data.data && data.data.favorites) {
            const favoritos = data.data.favorites.toLocaleString('pt-BR');
            favoritosDiv.innerHTML = `♥ ${favoritos} favoritos no MyAnimeList`;
        }
    } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
    }
}

// Função para mostrar quando não há personagens
function mostrarSemPersonagens(animeNome) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('personagens-anime').style.display = 'block';
    
    const animeSeguro = animeNome ? animeNome.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'N/A';
    document.getElementById('animeNome').textContent = `Personagens de ${animeSeguro}`;
    
    const container = document.getElementById('personagens');
    container.innerHTML = '<p style="text-align: center; color: #666; font-size: 18px; margin: 40px 0;">Nenhum personagem cadastrado para este anime</p>';
}

// Função para controlar collapse (apenas um aberto por vez)
window.toggleCollapse = (index) => {
    const targetCollapse = document.getElementById(`personagem-${index}`);
    
    // Se o collapse clicado já está aberto, fecha ele
    if (targetCollapse && targetCollapse.classList.contains('expanded')) {
        targetCollapse.classList.remove('expanded');
        return;
    }
    
    // Fecha todos os collapses
    const allCollapses = document.querySelectorAll('.personagem-collapse');
    allCollapses.forEach(collapse => {
        collapse.classList.remove('expanded');
    });
    
    // Abre o collapse clicado
    if (targetCollapse) {
        targetCollapse.classList.add('expanded');
    }
};

// Função para mostrar erro
function mostrarErro() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('personagem-erro').style.display = 'block';
}

// Função de inicialização
async function inicializar() {
    await carregarPersonagensAnime();
    
    // Mostra a página após tudo carregar
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
}

// Executa inicialização quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
} else {
    setTimeout(inicializar, 100);
}

// Exporta função para uso no SPA
window.inicializarApp = inicializar;