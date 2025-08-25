import { getFirestore, collection, getDocs, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Usa a instância do Firebase já inicializada
const auth = getAuth();
const db = getFirestore();
const provider = new GoogleAuthProvider();

// Função de login com Google
window.loginComGoogle = async () => {
    try {
        await signInWithPopup(auth, provider);
        carregarPersonagens();
    } catch (error) {
        document.getElementById('loginStatus').innerHTML = `<div class="danger">❌ ${error.message}</div>`;
    }
};

// Função de logout
window.sair = async () => {
    await signOut(auth);
    if (typeof navigateTo !== 'undefined') {
        navigateTo('index');
    }
};

// Email autorizado
const EMAIL_AUTORIZADO = 'victorhenriquesantanasouza@gmail.com';

// Função para verificar autenticação
function verificarAutenticacao() {
    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');

    if (!loginForm || !adminPanel) return;

    const user = auth.currentUser;

    if (user && user.email === EMAIL_AUTORIZADO) {
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
        const adminHeader = adminPanel.querySelector('.admin-header h2');
        if (adminHeader) {
            adminHeader.innerHTML = `Bem-vindo, ${user.displayName}! - Adicionar Novo Personagem`;
        }
    } else if (user) {
        document.getElementById('loginStatus').innerHTML = `<div class="danger">❌ Acesso negado, ${user.displayName}. Apenas o administrador pode gerenciar personagens.</div>`;
        loginForm.style.display = 'block';
        adminPanel.style.display = 'none';
    } else {
        document.getElementById('loginStatus').innerHTML = '';
        loginForm.style.display = 'block';
        adminPanel.style.display = 'none';
    }
}

// Monitora estado de autenticação
onAuthStateChanged(auth, verificarAutenticacao);

// Função para inicializar formulário
function inicializarFormulario() {
    const personagemForm = document.getElementById('personagemForm');
    if (personagemForm && !personagemForm.hasAttribute('data-listener-added')) {
        personagemForm.setAttribute('data-listener-added', 'true');
        personagemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await adicionarPersonagem();
        });
    }
}

// Função para adicionar personagem
async function adicionarPersonagem() {
    const nome = document.getElementById('nome').value;
    const anime = document.getElementById('anime').value;
    const descricao = document.getElementById('descricao').value;

    try {
        const personagemData = {
            nome: nome,
            anime: anime,
            descricao: descricao,
            dataCriacao: new Date()
        };

        await addDoc(collection(db, 'personagens'), personagemData);

        resetarFormulario();
        carregarPersonagens();
        document.getElementById('status').innerHTML = '<div class="success">✅ Personagem adicionado com sucesso!</div>';
        
        setTimeout(() => {
            document.getElementById('status').innerHTML = '';
        }, 4000);

    } catch (error) {
        document.getElementById('status').innerHTML = `<div class="danger">❌ Erro: ${error.message}</div>`;
    }
}

// Função para carregar personagens
async function carregarPersonagens() {
    try {
        const querySnapshot = await getDocs(collection(db, "personagens"));
        const personagens = [];

        querySnapshot.forEach((doc) => {
            personagens.push({ id: doc.id, ...doc.data() });
        });

        document.getElementById('loading').style.display = 'none';

        if (personagens.length === 0) {
            document.getElementById('personagens').innerHTML = '<p>Nenhum personagem encontrado.</p>';
            return;
        }

        exibirPersonagens(personagens);

    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('personagens').innerHTML = `
            <div class="anime" style="background-color: #ffe6e6; border-color: #ff9999;">
                <h3>Erro Firebase</h3>
                <p><strong>Detalhes:</strong> ${error.message}</p>
            </div>
        `;
    }
}

// Função para exibir personagens
function exibirPersonagens(personagens) {
    const container = document.getElementById('personagens');
    const user = auth.currentUser;
    const isAuthorized = user && user.email === EMAIL_AUTORIZADO;

    container.innerHTML = '';
    personagens.forEach(personagem => {
        const div = document.createElement('div');
        div.className = 'anime';

        div.innerHTML = `
            <div class="anime-content">
                <h3>${personagem.nome}</h3>
                <p><strong>Anime:</strong> ${personagem.anime}</p>
                <p><strong>Descrição:</strong> ${personagem.descricao}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// Função para resetar formulário
window.resetarFormulario = () => {
    const nome = document.getElementById('nome');
    const anime = document.getElementById('anime');
    const descricao = document.getElementById('descricao');

    if (nome) nome.value = '';
    if (anime) anime.value = '';
    if (descricao) descricao.value = '';

    const status = document.getElementById('status');
    if (status) {
        status.innerHTML = '';
    }
};

// Função de inicialização
async function inicializar() {
    await carregarPersonagens();
    inicializarFormulario();
    setTimeout(verificarAutenticacao, 200);
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