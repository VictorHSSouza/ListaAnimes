import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
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
    
    const tipoAdicao = document.querySelector('input[name="tipoAdicao"]:checked').value;
    
    if (tipoAdicao === 'vincular') {
        // Lógica para vincular temporada
        await adicionarTemporada();
    } else {
        // Lógica para adicionar novo anime
        await adicionarNovoAnime();
    }
    });
}

// Função para adicionar novo anime
async function adicionarNovoAnime() {
    const nome = document.getElementById('nome').value;
    const notaValue = document.getElementById('nota').value;
    const nota = notaValue ? parseFloat(notaValue) : null;
    const tipoAdicao = document.querySelector('input[name="tipoAdicao"]:checked').value;
    let generos = [];
    
    if (tipoAdicao === 'manual') {
        const generoSelect = document.getElementById('genero');
        generos = Array.from(generoSelect.selectedOptions).map(option => option.value);
    } else if (tipoAdicao === 'api') {
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
    if (tipoAdicao === 'api') {
        const animeApiSelect = document.getElementById('animeApi');
        const selectedOption = animeApiSelect.selectedOptions[0];
        if (selectedOption && selectedOption.dataset.anime) {
            const animeData = JSON.parse(selectedOption.dataset.anime);
            imagemUrl = animeData.images?.jpg?.image_url || null;
        }
    }
    
    try {
        const colecao = generos.includes('Hentai') ? 'outros' : 'animes';
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
        carregarAnimes();
        document.getElementById('status').innerHTML = '<div class="success">✅ Anime adicionado com sucesso!</div>';
        
    } catch (error) {
        document.getElementById('status').innerHTML = `<div class="danger">❌ Erro: ${error.message}</div>`;
    }
}

// Função para adicionar temporada
async function adicionarTemporada() {
    const animeId = document.getElementById('animeExistente').value;
    const nome = document.getElementById('nome').value;
    const notaValue = document.getElementById('nota').value;
    const nota = notaValue ? parseFloat(notaValue) : null;
    const descricao = document.getElementById('descricao').value;
    
    if (!animeId) {
        document.getElementById('status').innerHTML = '<div class="danger">❌ Selecione um anime para vincular!</div>';
        return;
    }
    
    try {
        // Busca o anime existente
        const animeDoc = await getDoc(doc(db, 'animes', animeId));
        if (!animeDoc.exists()) {
            throw new Error('Anime não encontrado!');
        }
        
        const animeData = animeDoc.data();
        const temporadas = animeData.temporadas || [];
        
        // Gera automaticamente o próximo número de temporada
        const proximaTemporada = temporadas.length + 1;
        
        // Adiciona nova temporada
        temporadas.push({
            numero: proximaTemporada,
            nome: nome,
            nota: nota,
            descricao: descricao
        });
        
        // Atualiza o documento
        await updateDoc(doc(db, 'animes', animeId), {
            temporadas: temporadas
        });
        
        resetarFormulario();
        carregarAnimes();
        document.getElementById('status').innerHTML = `<div class="success">✅ ${proximaTemporada}ª Temporada adicionada com sucesso!</div>`;
        
    } catch (error) {
        document.getElementById('status').innerHTML = `<div class="danger">❌ Erro: ${error.message}</div>`;
    }
}

// Variável global para armazenar animes
let todosAnimes = [];

// Função para carregar animes
async function carregarAnimes() {
    try {
        const querySnapshot = await getDocs(collection(db, "animes"));
        todosAnimes = [];
        
        querySnapshot.forEach((doc) => {
            todosAnimes.push({ id: doc.id, ...doc.data() });
        });

        document.getElementById('loading').style.display = 'none';
        
        if (todosAnimes.length === 0) {
            document.getElementById('animes').innerHTML = '<p>Nenhum anime encontrado.</p>';
            return;
        }

        popularFiltroGeneros();
        exibirAnimes(todosAnimes);

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

// Função para exibir animes com filtros aplicados
function exibirAnimes(animes) {
    const container = document.getElementById('animes');
    
    // Aplica filtro de pesquisa
    const termoPesquisa = document.getElementById('pesquisaAnime')?.value.toLowerCase() || '';
    const generoSelecionado = document.getElementById('filtroGenero')?.value || '';
    const notaMinima = parseFloat(document.getElementById('filtroNota')?.value) || 0;
    
    let animesFiltrados = animes.filter(anime => {
        // Filtro por nome
        const nomeMatch = anime.nome.toLowerCase().includes(termoPesquisa);
        
        // Filtro por gênero
        const generoMatch = !generoSelecionado || 
            (anime.generos && anime.generos.includes(generoSelecionado));
        
        // Filtro por nota mínima
        const notaMatch = !notaMinima || (anime.nota && anime.nota >= notaMinima);
        
        return nomeMatch && generoMatch && notaMatch;
    });
    
    // Aplica ordenação
    const tipoOrdem = document.getElementById('filtroOrdem')?.value || 'ordem';
    switch (tipoOrdem) {
        case 'alfabetica':
            animesFiltrados.sort((a, b) => a.nome.localeCompare(b.nome));
            break;
        case 'nota':
            animesFiltrados.sort((a, b) => {
                const notaA = a.nota || 0;
                const notaB = b.nota || 0;
                if (notaB !== notaA) {
                    return notaB - notaA;
                }
                return (a.ordem || 0) - (b.ordem || 0);
            });
            break;
        default: // 'ordem'
            animesFiltrados.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    }
    
    // Verifica se usuário está autorizado
    const user = auth.currentUser;
    const isAuthorized = user && user.email === EMAIL_AUTORIZADO;
    
    container.innerHTML = '';
    animesFiltrados.forEach(anime => {
            
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

// Função para alternar tipo de adição
window.alterarTipoAdicao = () => {
    const tipoAdicao = document.querySelector('input[name="tipoAdicao"]:checked').value;
    const generoManual = document.getElementById('generoManual');
    const generoApi = document.getElementById('generoApi');
    const animeVinculado = document.getElementById('animeVinculado');
    
    // Oculta todas as seções primeiro
    generoManual.style.display = 'none';
    generoApi.style.display = 'none';
    animeVinculado.style.display = 'none';
    
    // Remove required de todos
    document.getElementById('genero').required = false;
    document.getElementById('animeApi').required = false;
    document.getElementById('animeExistente').required = false;
    
    if (tipoAdicao === 'manual') {
        generoManual.style.display = 'block';
        document.getElementById('genero').required = true;
    } else if (tipoAdicao === 'api') {
        generoApi.style.display = 'block';
        document.getElementById('animeApi').required = true;
        inicializarApiSelect();
    } else if (tipoAdicao === 'vincular') {
        animeVinculado.style.display = 'block';
        document.getElementById('animeExistente').required = true;
        popularAnimesExistentes();
    }
};

// Mantém compatibilidade com código existente
window.alterarTipoGenero = window.alterarTipoAdicao;

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
    const animeExistente = document.getElementById('animeExistente');
    
    if (nome) nome.value = '';
    if (nota) nota.value = '';
    if (descricao) descricao.value = '';
    if (genero) genero.selectedIndex = -1;
    if (animeExistente) animeExistente.selectedIndex = 0;
    
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

// Função para popular filtro de gêneros
function popularFiltroGeneros() {
    const filtroGenero = document.getElementById('filtroGenero');
    if (!filtroGenero || todosAnimes.length === 0) return;
    
    const generosUnicos = new Set();
    todosAnimes.forEach(anime => {
        if (anime.generos) {
            anime.generos.forEach(genero => {
                if (genero !== 'Hentai') {
                    generosUnicos.add(genero);
                }
            });
        }
    });
    
    // Limpa opções existentes (exceto "Todos os Gêneros")
    filtroGenero.innerHTML = '<option value="">Todos os Gêneros</option>';
    
    // Adiciona gêneros ordenados
    Array.from(generosUnicos).sort().forEach(genero => {
        const option = document.createElement('option');
        option.value = genero;
        option.textContent = genero;
        filtroGenero.appendChild(option);
    });
}

// Event listeners para filtros
function inicializarFiltros() {
    const pesquisaInput = document.getElementById('pesquisaAnime');
    const filtroGenero = document.getElementById('filtroGenero');
    const filtroNota = document.getElementById('filtroNota');
    const filtroOrdem = document.getElementById('filtroOrdem');
    
    const aplicarFiltros = () => {
        if (todosAnimes.length > 0) {
            exibirAnimes(todosAnimes);
        }
    };
    
    if (pesquisaInput) {
        pesquisaInput.addEventListener('input', aplicarFiltros);
    }
    
    if (filtroGenero) {
        filtroGenero.addEventListener('change', aplicarFiltros);
    }
    
    if (filtroNota) {
        filtroNota.addEventListener('input', aplicarFiltros);
    }
    
    if (filtroOrdem) {
        filtroOrdem.addEventListener('change', aplicarFiltros);
    }
}

// Função para mostrar/ocultar filtros avançados
window.toggleFiltros = () => {
    const filtrosAvancados = document.getElementById('filtrosAvancados');
    const isVisible = filtrosAvancados.style.display !== 'none';
    filtrosAvancados.style.display = isVisible ? 'none' : 'flex';
};

// Função para limpar todos os filtros
window.limparFiltros = () => {
    document.getElementById('pesquisaAnime').value = '';
    document.getElementById('filtroGenero').value = '';
    document.getElementById('filtroNota').value = '';
    document.getElementById('filtroOrdem').value = 'ordem';
    
    // Fecha a caixa de filtros
    document.getElementById('filtrosAvancados').style.display = 'none';
    
    if (todosAnimes.length > 0) {
        exibirAnimes(todosAnimes);
    }
};



// Função para popular select com animes existentes
async function popularAnimesExistentes() {
    try {
        const querySnapshot = await getDocs(collection(db, "animes"));
        const animeSelect = document.getElementById('animeExistente');
        
        // Limpa opções existentes
        animeSelect.innerHTML = '<option value="">Selecione um anime...</option>';
        
        const animes = [];
        querySnapshot.forEach((doc) => {
            animes.push({ id: doc.id, ...doc.data() });
        });
        
        // Ordena por ordem
        animes.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        
        // Adiciona opções
        animes.forEach(anime => {
            const option = document.createElement('option');
            option.value = anime.id;
            option.textContent = `#${anime.ordem} - ${anime.nome}`;
            animeSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erro ao carregar animes existentes:', error);
    }
}

// Carrega animes ao iniciar
carregarAnimes();
inicializarBotaoComentarios();
inicializarFiltros();