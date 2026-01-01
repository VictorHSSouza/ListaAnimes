import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { firebaseConfig, AUTHORIZED_EMAIL } from './config.js';

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
const EMAIL_AUTORIZADO = AUTHORIZED_EMAIL;

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
                const ultimaDescricao = dadosParaEdicao.descricoes[dadosParaEdicao.descricoes.length - 1];
                descricaoAtual = typeof ultimaDescricao === 'string' ? ultimaDescricao : ultimaDescricao.texto;
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

                // Captura dados das APIs
                let imagemUrl = temporadaAtual.imagem;
                let animeSlug = temporadaAtual.anime_slug;
                let animeLink = temporadaAtual.animeLink;
                let malId = temporadaAtual.mal_id;
                
                const tipoGenero = document.querySelector('input[name="generoTipo"]:checked').value;
                
                if (tipoGenero === 'api') {
                    // Determina qual imagem usar
                    const imagemSelect = document.getElementById('imagemSelect');
                    const imagemEscolhida = imagemSelect ? imagemSelect.value : '';
                    
                    if (imagemEscolhida === 'jikan') {
                        const jikanSelect = document.getElementById('animeJikan');
                        const jikanOption = jikanSelect.selectedOptions[0];
                        if (jikanOption && jikanOption.dataset.anime) {
                            const jikanData = JSON.parse(jikanOption.dataset.anime);
                            imagemUrl = jikanData.images?.jpg?.image_url || temporadaAtual.imagem;
                            malId = jikanData.mal_id || temporadaAtual.mal_id;
                        }
                    } else if (imagemEscolhida === 'animefire') {
                        const animeApiSelect = document.getElementById('animeApi');
                        const animeApiOption = animeApiSelect.selectedOptions[0];
                        if (animeApiOption && animeApiOption.dataset.anime) {
                            const animeFireData = JSON.parse(animeApiOption.dataset.anime);
                            imagemUrl = animeFireData.thumbnail || temporadaAtual.imagem;
                        }
                    } else if (imagemEscolhida) {
                        imagemUrl = imagemEscolhida; // URL direta das imagens extras
                    }
                    
                    // Pega dados do AnimeFire se disponível
                    const animeApiSelect = document.getElementById('animeApi');
                    const animeApiOption = animeApiSelect.selectedOptions[0];
                    if (animeApiOption && animeApiOption.dataset.anime) {
                        const animeFireData = JSON.parse(animeApiOption.dataset.anime);
                        animeSlug = animeFireData.slug || temporadaAtual.anime_slug;
                        animeLink = animeFireData.animeLink || temporadaAtual.animeLink;
                    }
                    
                    // Pega mal_id do Jikan se não foi definido ainda
                    if (!malId) {
                        const jikanSelect = document.getElementById('animeJikan');
                        const jikanOption = jikanSelect.selectedOptions[0];
                        if (jikanOption && jikanOption.dataset.anime) {
                            const jikanData = JSON.parse(jikanOption.dataset.anime);
                            malId = jikanData.mal_id || null;
                        }
                    }
                }

                // Verifica se a descrição mudou
                const descricoesExistentes = temporadaAtual.descricoes || [{ texto: temporadaAtual.descricao, data: new Date() }].filter(d => d.texto);
                const descricaoAtual = descricoesExistentes.length > 0 ? descricoesExistentes[descricoesExistentes.length - 1].texto : '';
                const novasDescricoes = descricao !== descricaoAtual ? [...descricoesExistentes, { texto: descricao, data: new Date() }] : descricoesExistentes;

                // Atualiza temporada
                const novaTemporadaData = {
                    ...temporadaAtual,
                    nome: nome,
                    nota: nota,
                    descricao: descricao,
                    descricoes: novasDescricoes,
                    imagem: imagemUrl
                };

                // Adiciona campos opcionais apenas se não forem undefined
                if (animeSlug !== null) novaTemporadaData.anime_slug = animeSlug;
                if (animeLink !== null) novaTemporadaData.animeLink = animeLink;
                if (malId !== null) novaTemporadaData.mal_id = malId;

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
                let imagemUrl = animeAtual.imagem;
                let animeSlug = animeAtual.anime_slug;
                let animeLink = animeAtual.animeLink;
                let malId = animeAtual.mal_id;

                if (tipoGenero === 'manual') {
                    const generoSelect = document.getElementById('genero');
                    generos = Array.from(generoSelect.selectedOptions).map(option => option.value);
                    // Mantém mal_id existente quando usar gêneros manuais
                    malId = animeAtual.mal_id || null;
                } else if (tipoGenero === 'api') {
                    const animeJikanSelect = document.getElementById('animeJikan');
                    const selectedJikanOption = animeJikanSelect.selectedOptions[0];
                    if (selectedJikanOption && selectedJikanOption.dataset.anime) {
                        const jikanData = JSON.parse(selectedJikanOption.dataset.anime);
                        const generosIngles = jikanData.genres?.map(g => g.name) || [];
                        const generosJikan = traduzirGeneros(generosIngles);
                        
                        // Só sobrescreve gêneros se não existirem no banco
                        generos = (animeAtual.generos && animeAtual.generos.length > 0) ? animeAtual.generos : generosJikan;
                        malId = jikanData.mal_id;
                    } else {
                        // Se não há seleção do Jikan, mantém os gêneros originais do banco
                        generos = animeAtual.generos || [];
                    }

                    // Determina qual imagem usar
                    const imagemSelect = document.getElementById('imagemSelect');
                    const imagemEscolhida = imagemSelect ? imagemSelect.value : '';

                    if (imagemEscolhida === 'jikan') {
                        const jikanSelect = document.getElementById('animeJikan');
                        const jikanOption = jikanSelect.selectedOptions[0];
                        if (jikanOption && jikanOption.dataset.anime) {
                            const jikanData = JSON.parse(jikanOption.dataset.anime);
                            imagemUrl = jikanData.images?.jpg?.image_url || animeAtual.imagem;
                        }
                    } else if (imagemEscolhida === 'animefire') {
                        const animeApiSelect = document.getElementById('animeApi');
                        const animeApiOption = animeApiSelect.selectedOptions[0];
                        if (animeApiOption && animeApiOption.dataset.anime) {
                            const animeFireData = JSON.parse(animeApiOption.dataset.anime);
                            imagemUrl = animeFireData.thumbnail || animeAtual.imagem;
                        }
                    } else if (imagemEscolhida) {
                        imagemUrl = imagemEscolhida; // URL direta das imagens extras
                    }

                    // Pega dados do AnimeFire se disponível
                    const animeApiSelect = document.getElementById('animeApi');
                    const animeApiOption = animeApiSelect.selectedOptions[0];
                    if (animeApiOption && animeApiOption.dataset.anime) {
                        const animeFireData = JSON.parse(animeApiOption.dataset.anime);
                        animeSlug = animeFireData.slug || animeAtual.anime_slug;
                        animeLink = animeFireData.animeLink || animeAtual.animeLink;
                    }
                }

                const descricoesExistentes = animeAtual.descricoes || [{ texto: animeAtual.descricao, data: new Date() }].filter(d => d.texto);
                const descricaoAtual = descricoesExistentes.length > 0 ? descricoesExistentes[descricoesExistentes.length - 1].texto : '';
                const novasDescricoes = descricao !== descricaoAtual ? [...descricoesExistentes, { texto: descricao, data: new Date() }] : descricoesExistentes;

                const updateData = {
                    nome: nome,
                    nota: nota,
                    generos: generos,
                    descricoes: novasDescricoes,
                    descricao: descricao
                };

                // Adiciona campos opcionais apenas se não forem null ou undefined
                if (imagemUrl !== null && imagemUrl !== undefined) updateData.imagem = imagemUrl;
                if (animeSlug !== null && animeSlug !== undefined) updateData.anime_slug = animeSlug;
                if (animeLink !== null && animeLink !== undefined) updateData.animeLink = animeLink;
                if (malId !== null && malId !== undefined) updateData.mal_id = malId;

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

    // Oculta todas as seções primeiro
    generoManual.style.display = 'none';
    generoApi.style.display = 'none';

    // Remove required de todos
    document.getElementById('genero').required = false;
    document.getElementById('genero').removeAttribute('required');
    document.getElementById('animeApi').required = false;
    document.getElementById('animeJikan').required = false;

    if (tipoGenero === 'manual') {
        generoManual.style.display = 'flex';
        document.getElementById('genero').required = true;
        document.getElementById('genero').setAttribute('required', 'required');
    } else if (tipoGenero === 'api') {
        generoApi.style.display = 'flex';
        
        // Verifica se já tem mal_id cadastrado
        let temMalId = false;
        if (window.isTemporada && window.animeOriginal) {
            const temporada = window.animeOriginal.temporadas?.find(t => t.numero === window.numeroTemporada);
            temMalId = temporada && temporada.mal_id;
        } else if (window.animeOriginal) {
            temMalId = window.animeOriginal.mal_id;
        }
        
        // Jikan é obrigatório apenas se não tiver mal_id
        document.getElementById('animeJikan').required = !temMalId;
        
        // Atualiza texto do small
        const jikanHelp = document.getElementById('jikanHelp');
        if (jikanHelp) {
            jikanHelp.textContent = temMalId ? 
                'Jikan API (Opcional) - Digite para pesquisar animes' : 
                'Jikan API (Obrigatório) - Digite para pesquisar animes';
        }

        // Inicializa os selects das APIs
        inicializarJikanSelect();
        inicializarApiSelect();
    }
};

// Função para inicializar Select2 da API AnFire
function inicializarApiSelect() {
    if (typeof $ !== 'undefined' && $('#animeApi').length) {
        if ($('#animeApi').hasClass('select2-hidden-accessible')) {
            $('#animeApi').select2('destroy');
        }

        $('#animeApi').select2({
            placeholder: 'Digite o nome do anime para pesquisar (opcional)...',
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
                    // Atualiza opções de imagem se Jikan já estiver selecionado
                    const jikanSelect = document.getElementById('animeJikan');
                    if (jikanSelect && jikanSelect.value) {
                        const jikanOption = jikanSelect.selectedOptions[0];
                        if (jikanOption && jikanOption.dataset.anime) {
                            const jikanData = JSON.parse(jikanOption.dataset.anime);
                            carregarImagensAnime(jikanData.mal_id);
                        }
                    }
                }
                return anime.text;
            }
        });
    }
}

// Função para inicializar Select2 da API Jikan
function inicializarJikanSelect() {
    if (typeof $ !== 'undefined' && $('#animeJikan').length) {
        if ($('#animeJikan').hasClass('select2-hidden-accessible')) {
            $('#animeJikan').select2('destroy');
        }

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
                    carregarImagensAnime(anime.anime.mal_id);
                }
                return anime.text;
            }
        });

        $('#animeJikan').on('select2:clear', function () {
            const imagemOpcoes = document.getElementById('imagemOpcoes');
            if (imagemOpcoes) imagemOpcoes.style.display = 'none';
        });
    }
}

// Função para carregar imagens do anime
async function carregarImagensAnime(malId) {
    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}/pictures`);
        const data = await response.json();

        // Destroi Select2 existente se houver
        if ($('#imagemSelect').hasClass('select2-hidden-accessible')) {
            $('#imagemSelect').select2('destroy');
        }

        const imagemSelect = document.getElementById('imagemSelect');
        if (!imagemSelect) return;

        imagemSelect.innerHTML = '<option value="">Selecione uma imagem...</option>';

        // Pega URLs das imagens para usar no Select2
        let jikanImageUrl = null;
        let animeFireImageUrl = null;

        // Pega imagem do Jikan
        const jikanSelect = document.getElementById('animeJikan');
        if (jikanSelect && jikanSelect.selectedOptions[0] && jikanSelect.selectedOptions[0].dataset.anime) {
            const jikanData = JSON.parse(jikanSelect.selectedOptions[0].dataset.anime);
            jikanImageUrl = jikanData.images?.jpg?.image_url;
        }

        // Pega imagem do AnimeFire
        const animeApiSelect = document.getElementById('animeApi');
        if (animeApiSelect && animeApiSelect.selectedOptions[0] && animeApiSelect.selectedOptions[0].dataset.anime) {
            const animeFireData = JSON.parse(animeApiSelect.selectedOptions[0].dataset.anime);
            animeFireImageUrl = animeFireData.thumbnail;
        }

        // Adiciona imagem principal do Jikan
        if (jikanImageUrl) {
            const jikanOption = document.createElement('option');
            jikanOption.value = 'jikan';
            jikanOption.textContent = 'Imagem Principal (Jikan)';
            jikanOption.dataset.imageUrl = jikanImageUrl;
            imagemSelect.appendChild(jikanOption);
        }

        // Adiciona imagem do AnimeFire se disponível
        if (animeFireImageUrl) {
            const animeFireOption = document.createElement('option');
            animeFireOption.value = 'animefire';
            animeFireOption.textContent = 'Imagem do AnimeFire';
            animeFireOption.dataset.imageUrl = animeFireImageUrl;
            imagemSelect.appendChild(animeFireOption);
        }

        // Adiciona imagens extras do Jikan
        data.data.forEach((picture, index) => {
            const option = document.createElement('option');
            option.value = picture.jpg.image_url;
            option.textContent = `Imagem Extra ${index + 1}`;
            option.dataset.imageUrl = picture.jpg.image_url;
            imagemSelect.appendChild(option);
        });

        // Inicializa Select2 com imagens
        $('#imagemSelect').select2({
            placeholder: 'Selecione uma imagem...',
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

        const imagemOpcoes = document.getElementById('imagemOpcoes');
        if (imagemOpcoes) imagemOpcoes.style.display = 'flex';

    } catch (error) {
        console.error('Erro ao carregar imagens:', error);
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