import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

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
const provider = new GoogleAuthProvider();

// Função de login com Google
window.loginComGoogle = async () => {
    try {
        await signInWithPopup(auth, provider);
        carregarAnimes();
        // A mensagem será exibida no onAuthStateChanged
    } catch (error) {
        document.getElementById('loginStatus').innerHTML = `<div class="danger">❌ ${error.message}</div>`;
    }
};

// Função de logout
window.sair = async () => {
    await signOut(auth);
    carregarAnimes();   
};

// Email autorizado (substitua pelo seu email)
const EMAIL_AUTORIZADO = 'victorhenriquesantanasouza@gmail.com';

// Monitora estado de autenticação
onAuthStateChanged(auth, (user) => {
    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');
    
    // Verifica se os elementos existem (para compatibilidade com index.html)
    if (!loginForm || !adminPanel) return;
    
    if (user && user.email === EMAIL_AUTORIZADO) {
        // Usuário autorizado
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
        // Adiciona mensagem de boas-vindas no painel admin
        const adminHeader = adminPanel.querySelector('.admin-header h2');
        if (adminHeader) {
            adminHeader.innerHTML = `Bem-vindo, ${user.displayName}! - Adicionar Novo Anime`;
        }
        // Inicializa API select por padrão
        inicializarApiSelect();

    } else if (user) {
        // Usuário logado mas não autorizado
        document.getElementById('loginStatus').innerHTML = `<div class="danger">❌ Acesso negado, ${user.displayName}. Apenas o administrador pode gerenciar animes.</div>`;
        loginForm.style.display = 'block';
        adminPanel.style.display = 'none';
    } else {
        // Ninguém logado
        document.getElementById('loginStatus').innerHTML = '';
        loginForm.style.display = 'block';
        adminPanel.style.display = 'none';
        // Restaura o título original
        const adminHeader = document.querySelector('#adminPanel .admin-header h2');
        if (adminHeader) {
            adminHeader.innerHTML = 'Adicionar Novo Anime';
        }
    }
});

// Função para adicionar anime
const animeForm = document.getElementById('animeForm');
if (animeForm) {
    animeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const notaValue = document.getElementById('nota').value;
    const nota = notaValue ? parseFloat(notaValue) : null;
    // Verifica qual tipo de gênero foi selecionado
    const tipoGenero = document.querySelector('input[name="generoTipo"]:checked').value;
    let generos = [];
    
    if (tipoGenero === 'manual') {
        const generoSelect = document.getElementById('genero');
        generos = Array.from(generoSelect.selectedOptions).map(option => option.value);
    } else {
        const animeApiSelect = document.getElementById('animeApi');
        const selectedOption = animeApiSelect.selectedOptions[0];
        if (selectedOption && selectedOption.dataset.anime) {
            const animeData = JSON.parse(selectedOption.dataset.anime);
            const generosIngles = animeData.genres?.map(g => g.name) || [];
            generos = traduzirGeneros(generosIngles);
        }
    }
    const descricao = document.getElementById('descricao').value;
    
    // Captura URL da imagem se for da API
    let imagemUrl = null;
    if (tipoGenero === 'api') {
        const animeApiSelect = document.getElementById('animeApi');
        const selectedOption = animeApiSelect.selectedOptions[0];
        if (selectedOption && selectedOption.dataset.anime) {
            const animeData = JSON.parse(selectedOption.dataset.anime);
            imagemUrl = animeData.images?.jpg?.image_url || null;
        }
    }
    
    try {
        // Verifica se contém Hentai para definir coleção
        const colecao = generos.includes('Hentai') ? 'outros' : 'animes';
        
        // Busca o próximo ID sequencial
        const proximoId = await obterProximoId(colecao);
        
        await addDoc(collection(db, colecao), {
            ordem: proximoId,
            nome: nome,
            nota: nota,
            generos: generos,
            descricao: descricao,
            imagem: imagemUrl
        });
        
        resetarFormulario();
        carregarAnimes(); // Recarrega a lista
        document.getElementById('status').innerHTML = '<div class="success">✅ Anime adicionado com sucesso!</div>';
        
    } catch (error) {
        document.getElementById('status').innerHTML = `<div class="danger">❌ Erro: ${error.message}</div>`;
    }
    });
}

// Função para carregar animes
async function carregarAnimes() {
    try {
        const querySnapshot = await getDocs(collection(db, "animes"));
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
        
        // Verifica se usuário está autorizado
        const user = auth.currentUser;
        const isAuthorized = user && user.email === EMAIL_AUTORIZADO;
        
        container.innerHTML = '';
        animes.forEach(anime => {
            
            const div = document.createElement('div');
            div.className = 'anime';
            const generosTexto = anime.generos ? anime.generos.join(', ') : anime.genero || 'N/A';
            const imagemHtml = anime.imagem ? `<img src="${anime.imagem}" alt="${anime.nome}" class="anime-image">` : '';
            const botaoAlterarAnime = isAuthorized ? `<button onclick="alterarAnime('${anime.id}')" class="btn-alterar">Alterar</button>` : '';
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

// Função para obter o próximo ID sequencial
async function obterProximoId(colecaoNome = "animes") {
    try {
        const querySnapshot = await getDocs(collection(db, colecaoNome));
        let maiorId = 0;
        
        querySnapshot.forEach((doc) => {
            const anime = doc.data();
            if (anime.ordem && anime.ordem > maiorId) {
                maiorId = anime.ordem;
            }
        });
        
        return maiorId + 1;
    } catch (error) {
        console.error('Erro ao obter próximo ID:', error);
        return 1; // Retorna 1 se houver erro
    }
}

// Função para alternar tipo de gênero
window.alterarTipoGenero = () => {
    const tipoGenero = document.querySelector('input[name="generoTipo"]:checked').value;
    const generoManual = document.getElementById('generoManual');
    const generoApi = document.getElementById('generoApi');
    
    if (tipoGenero === 'manual') {
        generoManual.style.display = 'block';
        generoApi.style.display = 'none';
        document.getElementById('genero').required = true;
        document.getElementById('animeApi').required = false;
    } else {
        generoManual.style.display = 'none';
        generoApi.style.display = 'block';
        document.getElementById('genero').required = false;
        document.getElementById('animeApi').required = true;
        inicializarApiSelect();
    }
};

// Função para inicializar Select2 da API
function inicializarApiSelect() {
    if (typeof $ !== 'undefined' && $('#animeApi').length && !$('#animeApi').hasClass('select2-hidden-accessible')) {
        $('#animeApi').select2({
            placeholder: 'Digite o nome do anime para pesquisar...',
            allowClear: true,
            ajax: {
                url: function (params) {
                    return `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(params.term)}&limit=10`;
                },
                dataType: 'json',
                delay: 300,
                processResults: function (data) {
                    return {
                        results: data.data.map(anime => ({
                            id: anime.mal_id,
                            text: anime.title,
                            anime: anime
                        }))
                    };
                },
                cache: true
            },
            minimumInputLength: 2,
            templateResult: function(anime) {
                if (anime.loading) return anime.text;
                return $(`<div>${anime.text}</div>`);
            },
            templateSelection: function(anime) {
                if (anime.anime) {
                    // Armazena dados do anime no option
                    const option = document.querySelector(`#animeApi option[value="${anime.id}"]`);
                    if (option) {
                        option.dataset.anime = JSON.stringify(anime.anime);
                    }
                }
                return anime.text;
            }
        });
    }
}

// Função para traduzir gêneros do inglês para português
function traduzirGeneros(generosIngles) {
    const traducoes = {
        'Action': 'Ação',
        'Adventure': 'Aventura',
        'Comedy': 'Comédia',
        'Drama': 'Drama',
        'Romance': 'Romance',
        'Fantasy': 'Fantasia',
        'Sci-Fi': 'Ficção Científica',
        'Science Fiction': 'Ficção Científica',
        'Horror': 'Terror',
        'Thriller': 'Suspense',
        'Supernatural': 'Sobrenatural',
        'Mystery': 'Mistério',
        'Slice of Life': 'Slice of Life',
        'Sports': 'Esportes',
        'School': 'Escolar',
        'Military': 'Militar',
        'Historical': 'Histórico',
        'Mecha': 'Mecha',
        'Music': 'Música',
        'Psychological': 'Psicológico',
        'Seinen': 'Seinen',
        'Shounen': 'Shounen',
        'Shoujo': 'Shoujo',
        'Josei': 'Josei',
        'Kids': 'Infantil',
        'Magic': 'Magia',
        'Martial Arts': 'Artes Marciais',
        'Game': 'Jogo',
        'Demons': 'Demônios',
        'Vampire': 'Vampiro',
        'Super Power': 'Super Poderes',
        'Police': 'Polícia',
        'Space': 'Espacial',
        'Parody': 'Paródia',
        'Samurai': 'Samurai',
        'Harem': 'Harém',
        'Ecchi': 'Ecchi',
        'Hentai': 'Hentai'
    };
    
    return generosIngles.map(genero => traducoes[genero] || genero);
}

// Função para resetar formulário
window.resetarFormulario = () => {
    // Reseta campos manualmente
    const nome = document.getElementById('nome');
    const nota = document.getElementById('nota');
    const descricao = document.getElementById('descricao');
    const genero = document.getElementById('genero');
    
    if (nome) nome.value = '';
    if (nota) nota.value = '';
    if (descricao) descricao.value = '';
    if (genero) genero.selectedIndex = -1;
    
    // Reseta Select2
    if (typeof $ !== 'undefined') {
        $('#animeApi').val(null).trigger('change');
    }
    
    // Limpa status
    const status = document.getElementById('status');
    if (status) {
        status.innerHTML = '';
    }
};

// Função para alterar anime
window.alterarAnime = (animeId) => {
    window.location.href = `alterar_anime.html?id=${animeId}`;
};

// Função para visualizar anime
window.visualizarAnime = (animeId) => {
    window.location.href = `detalhes.html?id=${animeId}`;
};

// Função para alternar comentários
window.toggleComentarios = () => {
    const comentariosHabilitados = localStorage.getItem('comentariosHabilitados') === 'true';
    const novoEstado = !comentariosHabilitados;
    localStorage.setItem('comentariosHabilitados', novoEstado);
    
    const botao = document.getElementById('toggleComentarios');
    botao.textContent = novoEstado ? 'Desabilitar Comentários' : 'Habilitar Comentários';
    
    carregarAnimes();
};

// Inicializa o botão de comentários
function inicializarBotaoComentarios() {
    const comentariosHabilitados = localStorage.getItem('comentariosHabilitados') === 'true';
    const botao = document.getElementById('toggleComentarios');
    if (botao) {
        botao.textContent = comentariosHabilitados ? 'Desabilitar Comentários' : 'Habilitar Comentários';
    }
}

// Função para mostrar/ocultar botão Outros
function atualizarBotaoOutros() {
    const user = auth.currentUser;
    const botaoOutros = document.getElementById('btnOutros');
    if (botaoOutros) {
        if (user && user.email === EMAIL_AUTORIZADO) {
            botaoOutros.style.display = 'block';
        } else {
            botaoOutros.style.display = 'none';
        }
    }
}

// Monitora autenticação para mostrar botão Outros
onAuthStateChanged(auth, (user) => {
    atualizarBotaoOutros();
});

// Carrega animes ao iniciar
carregarAnimes();
inicializarBotaoComentarios();