import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Função de login com Google
window.loginComGoogle = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        document.getElementById('loginStatus').innerHTML = `<div style="color: red;">❌ ${error.message}</div>`;
    }
};

// Função de logout
window.sair = async () => {
    await signOut(auth);
};

// Email autorizado
const EMAIL_AUTORIZADO = 'victorhenriquesantanasouza@gmail.com';

// Monitora estado de autenticação
onAuthStateChanged(auth, (user) => {
    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');

    if (user && user.email === EMAIL_AUTORIZADO) {
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
        carregarPersonagem();
    } else if (user) {
        document.getElementById('loginStatus').innerHTML = `<div class="danger">❌ Acesso negado, ${user.displayName}. Apenas o administrador pode alterar personagens.</div>`;
        loginForm.style.display = 'block';
        adminPanel.style.display = 'none';
    } else {
        document.getElementById('loginStatus').innerHTML = '';
        loginForm.style.display = 'block';
        adminPanel.style.display = 'none';
    }
});

// Função para carregar dados do personagem
async function carregarPersonagem() {
    const urlParams = window.routeParams || new URLSearchParams(window.location.search);
    const animeId = urlParams.get('animeId');
    const personagemNome = urlParams.get('nome');

    if (!animeId || !personagemNome) {
        document.getElementById('status').innerHTML = '<div class="danger">❌ Parâmetros inválidos!</div>';
        return;
    }

    try {
        const docRef = doc(db, "animes", animeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const animeData = docSnap.data();
            const personagens = animeData.personagens || [];
            const personagemIndex = personagens.findIndex(p => p.nome === decodeURIComponent(personagemNome));

            if (personagemIndex !== -1) {
                const personagem = personagens[personagemIndex];
                
                document.getElementById('animeId').value = animeId;
                document.getElementById('personagemIndex').value = personagemIndex;
                document.getElementById('nome').value = personagem.nome || '';
                document.getElementById('descricao').value = personagem.descricao || '';

                // Carrega imagens se tiver jikan_id
                if (personagem.jikan_id) {
                    await carregarImagensPersonagem(personagem.jikan_id);
                }

                // Atualiza título
                document.querySelector('h2').textContent = `Alterar Personagem - ${personagem.nome}`;
            } else {
                document.getElementById('status').innerHTML = '<div class="danger">❌ Personagem não encontrado!</div>';
            }
        } else {
            document.getElementById('status').innerHTML = '<div class="danger">❌ Anime não encontrado!</div>';
        }
    } catch (error) {
        document.getElementById('status').innerHTML = `<div class="danger">❌ Erro: ${error.message}</div>`;
    }
}

// Função para alterar personagem
const alterarForm = document.getElementById('alterarPersonagemForm');
if (alterarForm) {
    alterarForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const animeId = document.getElementById('animeId').value;
        const personagemIndex = parseInt(document.getElementById('personagemIndex').value);
        const nome = document.getElementById('nome').value;
        const descricao = document.getElementById('descricao').value;

        try {
            const docRef = doc(db, "animes", animeId);
            const docSnap = await getDoc(docRef);
            const animeData = docSnap.data();
            const personagens = [...animeData.personagens];

            // Atualiza o personagem
            const personagemAtual = personagens[personagemIndex];
            personagens[personagemIndex] = {
                ...personagemAtual,
                nome: nome,
                descricao: descricao
            };

            // Verifica se foi selecionada uma nova imagem
            const imagemSelect = document.getElementById('imagemPersonagemSelect');
            if (imagemSelect && imagemSelect.value) {
                personagens[personagemIndex].imagem = imagemSelect.value;
            }

            await updateDoc(docRef, {
                personagens: personagens
            });

            document.getElementById('status').innerHTML = '<div class="success">✅ Personagem alterado com sucesso!</div>';
            setTimeout(() => {
                const nomeEncoded = encodeURIComponent(nome);
                if (typeof navigateTo !== 'undefined') {
                    navigateTo(`detalhes_personagem?animeId=${animeId}&nome=${nomeEncoded}`);
                }
            }, 1500);

        } catch (error) {
            document.getElementById('status').innerHTML = `<div class="danger">❌ Erro: ${error.message}</div>`;
        }
    });
}

// Função para carregar imagens do personagem
async function carregarImagensPersonagem(jikanId) {
    try {
        const response = await fetch(`https://api.jikan.moe/v4/characters/${jikanId}/pictures`);
        const data = await response.json();

        const imagemSelect = document.getElementById('imagemPersonagemSelect');
        const imagemOpcoes = document.getElementById('imagemPersonagemOpcoes');

        if (!imagemSelect || !data.data || data.data.length === 0) {
            return;
        }

        // Limpa e popula o select
        imagemSelect.innerHTML = '<option value="">Manter imagem atual</option>';

        data.data.forEach((picture, index) => {
            const option = document.createElement('option');
            option.value = picture.jpg.image_url;
            option.textContent = `Imagem ${index + 1}`;
            option.dataset.imageUrl = picture.jpg.image_url;
            imagemSelect.appendChild(option);
        });

        // Inicializa Select2 com imagens
        if (typeof $ !== 'undefined') {
            $('#imagemPersonagemSelect').select2({
                placeholder: 'Manter imagem atual',
                allowClear: true,
                templateResult: function (option) {
                    if (option.loading) return option.text;
                    if (!option.element || !option.element.dataset.imageUrl) return $(`<div>${option.text}</div>`);

                    return $(`
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${option.element.dataset.imageUrl}" style="width: 40px; height: 60px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none'">
                            <div>${option.text}</div>
                        </div>
                    `);
                },
                templateSelection: function (option) {
                    return option.text;
                }
            });
        }

        imagemOpcoes.style.display = 'flex';

    } catch (error) {
        console.error('Erro ao carregar imagens do personagem:', error);
    }
}

// Função de inicialização
async function inicializar() {
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