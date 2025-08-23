import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
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
    } catch (error) {
        document.getElementById('loginStatus').innerHTML = `<div style="color: red;">❌ ${error.message}</div>`;
    }
};

// Função de logout
window.sair = async () => {
    await signOut(auth);
};

// Função para voltar ao gerenciamento
window.voltarGerenciar = () => {
    window.location.href = 'index.html';
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
        carregarAnime();
    } else if (user) {
        document.getElementById('loginStatus').innerHTML = `<div class="danger">❌ Acesso negado, ${user.displayName}. Apenas o administrador pode gerenciar animes.</div>`;
        loginForm.style.display = 'block';
        adminPanel.style.display = 'none';
    } else {
        document.getElementById('loginStatus').innerHTML = '';
        loginForm.style.display = 'block';
        adminPanel.style.display = 'none';
    }
});

// Função para carregar dados do anime
async function carregarAnime() {
    const urlParams = window.routeParams || new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id');
    const numeroTemporada = urlParams.get('temporada');

    if (!animeId) {
        document.getElementById('status').innerHTML = '<div class="danger">❌ ID do anime não encontrado!</div>';
        return;
    }

    // Armazena se é edição de temporada
    window.isTemporada = numeroTemporada !== null;
    window.numeroTemporada = numeroTemporada ? parseInt(numeroTemporada) : null;

    try {
        // Tenta buscar na coleção "animes" primeiro
        let docRef = doc(db, "animes", animeId);
        let docSnap = await getDoc(docRef);
        let colecaoOriginal = "animes";

        // Se não encontrar e usuário for autorizado, tenta na coleção "outros"
        if (!docSnap.exists()) {
            const user = auth.currentUser;
            if (user && user.email === EMAIL_AUTORIZADO) {
                docRef = doc(db, "outros", animeId);
                docSnap = await getDoc(docRef);
                colecaoOriginal = "outros";
            }
        }

        if (docSnap.exists()) {
            const anime = docSnap.data();
            window.colecaoOriginal = colecaoOriginal;
            window.animeOriginal = anime;

            let dadosParaEdicao = anime;

            // Se for edição de temporada, busca dados da temporada
            if (window.isTemporada && anime.temporadas) {
                const temporada = anime.temporadas.find(t => t.numero === window.numeroTemporada);
                if (temporada) {
                    dadosParaEdicao = temporada;
                    // Força seleção da opção "api" e desabilita manual
                    document.querySelector('input[value="api"]').checked = true;
                    document.querySelector('input[value="manual"]').disabled = true;
                    alterarTipoGenero();

                    // Remove required do select da API para temporadas
                    document.getElementById('animeApi').required = false;

                    // Atualiza título
                    document.querySelector('h2').textContent = `Alterar ${window.numeroTemporada}ª Temporada - ${anime.nome}`;
                } else {
                    document.getElementById('status').innerHTML = '<div class="danger">❌ Temporada não encontrada!</div>';
                    return;
                }
            }

            document.getElementById('animeId').value = animeId;
            document.getElementById('nome').value = dadosParaEdicao.nome || '';
            document.getElementById('nota').value = dadosParaEdicao.nota || '';

            // Pega a descrição mais recente
            let descricaoAtual = dadosParaEdicao.descricao;
            if (dadosParaEdicao.descricoes && dadosParaEdicao.descricoes.length > 0) {
                descricaoAtual = dadosParaEdicao.descricoes[dadosParaEdicao.descricoes.length - 1];
            }
            document.getElementById('descricao').value = descricaoAtual || '';

            // Para temporadas, não seleciona gêneros (serão herdados do anime principal)
            if (!window.isTemporada) {
                const generoSelect = document.getElementById('genero');
                if (anime.generos) {
                    Array.from(generoSelect.options).forEach(option => {
                        option.selected = anime.generos.includes(option.value);
                    });
                }
            }
        } else {
            document.getElementById('status').innerHTML = '<div class="danger">❌ Anime não encontrado!</div>';
        }
    } catch (error) {
        document.getElementById('status').innerHTML = `<div class="danger">❌ Erro: ${error.message}</div>`;
    }
}

// Função para alterar anime
const alterarForm = document.getElementById('alterarForm');
if (alterarForm) {
    alterarForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const animeId = document.getElementById('animeId').value;
        const nome = document.getElementById('nome').value;
        const notaValue = document.getElementById('nota').value;
        const nota = notaValue ? parseFloat(notaValue) : null;
        const descricao = document.getElementById('descricao').value;

        try {
            const colecao = window.colecaoOriginal || "animes";
            const docRef = doc(db, colecao, animeId);
            const docSnap = await getDoc(docRef);
            const animeAtual = docSnap.data();

            if (window.isTemporada) {
                // Lógica para alterar temporada
                const temporadas = [...animeAtual.temporadas];
                const indexTemporada = temporadas.findIndex(t => t.numero === window.numeroTemporada);

                if (indexTemporada === -1) {
                    throw new Error('Temporada não encontrada!');
                }

                const temporadaAtual = temporadas[indexTemporada];

                // Captura imagem, anime_slug e animeLink da API se selecionada
                let imagemUrl = temporadaAtual.imagem;
                let animeSlug = temporadaAtual.anime_slug;
                let animeLink = temporadaAtual.animeLink;
                
                // Verifica AnFire API
                const animeApiSelect = document.getElementById('animeApi');
                const selectedAnFireOption = animeApiSelect.selectedOptions[0];
                if (selectedAnFireOption && selectedAnFireOption.dataset.anime) {
                    const animeData = JSON.parse(selectedAnFireOption.dataset.anime);
                    imagemUrl = animeData.thumbnail || temporadaAtual.imagem;
                    animeSlug = animeData.slug || temporadaAtual.anime_slug;
                    animeLink = animeData.animeLink || temporadaAtual.animeLink;
                }
                
                // Verifica Jikan API
                const animeJikanSelect = document.getElementById('animeJikan');
                const selectedJikanOption = animeJikanSelect.selectedOptions[0];
                if (selectedJikanOption && selectedJikanOption.dataset.anime) {
                    const animeData = JSON.parse(selectedJikanOption.dataset.anime);
                    imagemUrl = animeData.images?.jpg?.image_url || temporadaAtual.imagem;
                }

                // Verifica se a descrição mudou
                const descricoesExistentes = temporadaAtual.descricoes || [temporadaAtual.descricao].filter(Boolean);
                const descricaoAtual = descricoesExistentes[descricoesExistentes.length - 1] || '';
                const novasDescricoes = descricao !== descricaoAtual ? [...descricoesExistentes, descricao] : descricoesExistentes;

                // Atualiza temporada
                const novaTemporadaData = {
                    ...temporadaAtual,
                    nome: nome,
                    nota: nota,
                    descricao: descricao,
                    descricoes: novasDescricoes,
                    imagem: imagemUrl
                };

                if (animeSlug !== undefined && animeSlug !== null) {
                    novaTemporadaData.anime_slug = animeSlug;
                }
                if (animeLink !== undefined && animeLink !== null) {
                    novaTemporadaData.animeLink = animeLink;
                }

                temporadas[indexTemporada] = novaTemporadaData;

                await updateDoc(docRef, {
                    temporadas: temporadas
                });

                document.getElementById('status').innerHTML = '<div class="success">✅ Temporada alterada com sucesso!</div>';
                setTimeout(() => {
                    if (typeof navigateTo !== 'undefined') {
                        navigateTo(`detalhes?id=${animeId}`);
                    } else {
                        window.location.href = `detalhes.html?id=${animeId}`;
                    }
                }, 1500);

            } else {
                // Lógica original para alterar anime
                const tipoGenero = document.querySelector('input[name="generoTipo"]:checked').value;
                let generos = [];
                let imagemUrl = null;
                let animeSlug = null;
                let animeLink = null;

                if (tipoGenero === 'manual') {
                    const generoSelect = document.getElementById('genero');
                    generos = Array.from(generoSelect.selectedOptions).map(option => option.value);
                    imagemUrl = animeAtual.imagem;
                    animeSlug = animeAtual.anime_slug;
                    animeLink = animeAtual.animeLink;
                } else if (tipoGenero === 'api') {
                    const animeApiSelect = document.getElementById('animeApi');
                    const selectedOption = animeApiSelect.selectedOptions[0];
                    if (selectedOption && selectedOption.dataset.anime) {
                        const animeData = JSON.parse(selectedOption.dataset.anime);
                        generos = animeData.genres || [];
                        imagemUrl = animeData.thumbnail || animeAtual.imagem;
                        animeSlug = animeData.slug || animeAtual.anime_slug;
                        animeLink = animeData.animeLink || animeAtual.animeLink;
                    }
                } else if (tipoGenero === 'jikan') {
                    const animeJikanSelect = document.getElementById('animeJikan');
                    const selectedOption = animeJikanSelect.selectedOptions[0];
                    if (selectedOption && selectedOption.dataset.anime) {
                        const animeData = JSON.parse(selectedOption.dataset.anime);
                        const generosIngles = animeData.genres?.map(g => g.name) || [];
                        generos = traduzirGeneros(generosIngles);
                        imagemUrl = animeData.images?.jpg?.image_url || animeAtual.imagem;
                        animeSlug = animeAtual.anime_slug;
                        animeLink = animeAtual.animeLink;
                    }
                }

                const descricoesExistentes = animeAtual.descricoes || [animeAtual.descricao].filter(Boolean);
                const descricaoAtual = descricoesExistentes[descricoesExistentes.length - 1] || '';
                const novasDescricoes = descricao !== descricaoAtual ? [...descricoesExistentes, descricao] : descricoesExistentes;

                const updateData = {
                    nome: nome,
                    nota: nota,
                    generos: generos,
                    descricoes: novasDescricoes,
                    descricao: descricao,
                    imagem: imagemUrl
                };

                if (animeSlug !== undefined && animeSlug !== null) {
                    updateData.anime_slug = animeSlug;
                }
                if (animeLink !== undefined && animeLink !== null) {
                    updateData.animeLink = animeLink;
                }

                await updateDoc(docRef, updateData);

                document.getElementById('status').innerHTML = '<div class="success">✅ Anime alterado com sucesso!</div>';
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }

        } catch (error) {
            document.getElementById('status').innerHTML = `<div class="danger">❌ Erro: ${error.message}</div>`;
        }
    });
}

// Função para alternar tipo de gênero
window.alterarTipoGenero = () => {
    const tipoGenero = document.querySelector('input[name="generoTipo"]:checked').value;
    const generoManual = document.getElementById('generoManual');
    const generoApi = document.getElementById('generoApi');
    const generoJikan = document.getElementById('generoJikan');

    // Oculta todas as seções primeiro
    generoManual.style.display = 'none';
    generoApi.style.display = 'none';
    generoJikan.style.display = 'none';

    // Remove required de todos
    document.getElementById('genero').required = false;
    document.getElementById('animeApi').required = false;
    document.getElementById('animeJikan').required = false;

    if (tipoGenero === 'manual') {
        generoManual.style.display = 'block';
        document.getElementById('genero').required = true;
    } else if (tipoGenero === 'api') {
        generoApi.style.display = 'block';
        document.getElementById('animeApi').required = false;
        inicializarApiSelect();
    } else if (tipoGenero === 'jikan') {
        generoJikan.style.display = 'block';
        document.getElementById('animeJikan').required = false;
        inicializarJikanSelect();
    }
};

// Função para inicializar Select2 da API AnFire
function inicializarApiSelect() {
    if (typeof $ !== 'undefined' && $('#animeApi').length && !$('#animeApi').hasClass('select2-hidden-accessible')) {
        $('#animeApi').select2({
            placeholder: 'Digite o nome do anime para pesquisar...',
            allowClear: true,
            ajax: {
                url: 'http://18.230.118.237/anime/search',
                dataType: 'json',
                delay: 300,
                data: function (params) {
                    return {
                        q: params.term
                    };
                },
                processResults: function (data) {
                    return {
                        results: data.result.map(anime => ({
                            id: anime.animeName,
                            text: anime.animeName,
                            anime: anime
                        }))
                    };
                },
                cache: true
            },
            minimumInputLength: 2,
            templateResult: function (anime) {
                if (anime.loading) return anime.text;
                if (!anime.anime) return $(`<div>${anime.text}</div>`);
                
                return $(`
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${anime.anime.thumbnail}" style="width: 40px; height: 60px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none'">
                        <div>${anime.text}</div>
                    </div>
                `);
            },
            templateSelection: function (anime) {
                if (anime.anime) {
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

// Função para inicializar Select2 da API Jikan
function inicializarJikanSelect() {
    if (typeof $ !== 'undefined' && $('#animeJikan').length && !$('#animeJikan').hasClass('select2-hidden-accessible')) {
        $('#animeJikan').select2({
            placeholder: 'Digite o nome do anime para pesquisar...',
            allowClear: true,
            ajax: {
                url: 'https://api.jikan.moe/v4/anime',
                dataType: 'json',
                delay: 300,
                data: function (params) {
                    return {
                        q: params.term,
                        limit: 10
                    };
                },
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
            templateResult: function (anime) {
                if (anime.loading) return anime.text;
                if (!anime.anime) return $(`<div>${anime.text}</div>`);
                
                return $(`
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${anime.anime.images.jpg.image_url}" style="width: 40px; height: 60px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none'">
                        <div>${anime.text}</div>
                    </div>
                `);
            },
            templateSelection: function (anime) {
                if (anime.anime) {
                    const option = document.querySelector(`#animeJikan option[value="${anime.id}"]`);
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
    carregarAnime(); // Recarrega os dados originais
    document.getElementById('status').innerHTML = '';
};

// Função para aplicar máscara no campo nota
function aplicarMascaraNota() {
    const notaInput = document.getElementById('nota');
    if (notaInput) {
        notaInput.addEventListener('input', function () {
            let valor = parseFloat(this.value);
            if (valor > 10) {
                this.value = '10';
            }
        });
    }
}

// Função de inicialização
async function inicializar() {
    await carregarAnime();
    aplicarMascaraNota();

    // Mostra a página após tudo carregar
    setTimeout(() => {
        console.log("Carregando...");
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