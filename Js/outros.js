import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
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



// Função para carregar animes da coleção "outros"
async function carregarOutros() {
    try {
        const querySnapshot = await getDocs(collection(db, "outros"));
        const animes = [];
        
        querySnapshot.forEach((doc) => {
            animes.push({ id: doc.id, ...doc.data() });
        });

        document.getElementById('loading').style.display = 'none';
        const container = document.getElementById('animes');

        if (animes.length === 0) {
            container.innerHTML = '<p>Nenhum anime encontrado.</p>';
            return;
        }

        // Ordena animes pelo campo ordem
        animes.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        
        container.innerHTML = '';
        animes.forEach(anime => {
            const div = document.createElement('div');
            div.className = 'anime';
            const generosTexto = anime.generos ? anime.generos.join(', ') : anime.genero || 'N/A';
            const imagemHtml = anime.imagem ? `<img src="${anime.imagem}" alt="${anime.nome}" class="anime-image">` : '';
            const botaoAlterarAnime = `<button onclick="alterarAnime('${anime.id}')" class="btn-alterar">Alterar</button>`;
            const botaoVisualizar = `<button onclick="visualizarAnime('${anime.id}')" class="btn-visualizar">Visualizar</button>`;
            
            // Pega a descrição mais recente
            let descricaoMaisRecente = anime.descricao;
            if (anime.descricoes && anime.descricoes.length > 0) {
                descricaoMaisRecente = anime.descricoes[anime.descricoes.length - 1];
            }
            
            // Verifica se comentários estão habilitados
            const comentariosHabilitados = localStorage.getItem('comentariosHabilitados') === 'true';
            const descricaoExibida = comentariosHabilitados ? descricaoMaisRecente : '<span id="amarelo">Cuidado Spoiler⚠️⚠️⚠️!!!</span>';
            
            div.innerHTML = `
                ${imagemHtml}
                <div class="anime-content">
                    <h3>#${anime.ordem || 'N/A'} - ${anime.nome}</h3>
                    <p><strong>Nota:</strong> ${anime.nota !== null ? anime.nota + '/10 ⭐' : '???'}</p>
                    <p><strong>Gêneros:</strong> ${generosTexto}</p>
                    <p><strong>Descrição:</strong> ${descricaoExibida}</p>
                    <div class="botoes-anime">
                        ${botaoVisualizar}
                        ${botaoAlterarAnime}
                    </div>
                </div>
            `;
            container.appendChild(div);
        });

    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('animes').innerHTML = `
            <div class="anime" style="background-color: #ffe6e6; border-color: #ff9999;">
                <h3>Erro Firebase</h3>
                <p><strong>Detalhes:</strong> ${error.message}</p>
            </div>
        `;
    }
}

// Função para alterar anime
window.alterarAnime = (animeId) => {
    if (typeof navigateTo !== 'undefined') {
        navigateTo(`alterar?id=${animeId}`);
    } else {
        window.location.href = `alterar_anime.html?id=${animeId}`;
    }
};

// Função para visualizar anime
window.visualizarAnime = (animeId) => {
    if (typeof navigateTo !== 'undefined') {
        navigateTo(`detalhes?id=${animeId}`);
    } else {
        window.location.href = `detalhes.html?id=${animeId}`;
    }
};

// Função para alternar comentários
window.toggleComentarios = () => {
    const comentariosHabilitados = localStorage.getItem('comentariosHabilitados') === 'true';
    const novoEstado = !comentariosHabilitados;
    localStorage.setItem('comentariosHabilitados', novoEstado);
    
    const botao = document.getElementById('toggleComentarios');
    botao.textContent = novoEstado ? 'Desabilitar Comentários' : 'Habilitar Comentários';
    
    carregarOutros();
};

// Inicializa o botão de comentários
function inicializarBotaoComentarios() {
    const comentariosHabilitados = localStorage.getItem('comentariosHabilitados') === 'true';
    const botao = document.getElementById('toggleComentarios');
    if (botao) {
        botao.textContent = comentariosHabilitados ? 'Desabilitar Comentários' : 'Habilitar Comentários';
    }
}

// Função de inicialização para outros
function inicializar() {
    inicializarBotaoComentarios();
    // Verifica autenticação e carrega dados
    const user = auth.currentUser;
    if (user && user.email === EMAIL_AUTORIZADO) {
        carregarOutros();
    } else {
        // Aguarda autenticação
        onAuthStateChanged(auth, (user) => {
            if (user && user.email === EMAIL_AUTORIZADO) {
                carregarOutros();
            }
        });
    }
}

// Executa inicialização quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
} else {
    setTimeout(inicializar, 100);
}

// Exporta função para uso no SPA
window.inicializarApp = inicializar;

inicializarBotaoComentarios();