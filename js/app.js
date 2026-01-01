import { getFirestore, collection, getDocs, addDoc, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Usa a instância do Firebase já inicializada
const auth = getAuth();
const db = getFirestore();
const provider = new GoogleAuthProvider();

// Função de login com Google
window.loginComGoogle = async () => {
    try {
        await signInWithPopup(auth, provider);
        carregarAnimes();
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

// Email autorizado (substitua pelo seu email)
const EMAIL_AUTORIZADO = 'victorhenriquesantanasouza@gmail.com';

// Função para verificar autenticação
function verificarAutenticacao() {
    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');

    // Verifica se os elementos existem (para compatibilidade)
    if (!loginForm || !adminPanel) return;

    const user = auth.currentUser;

    if (user && user.email === EMAIL_AUTORIZADO) {
        // Usuário autorizado
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
        // Adiciona mensagem de boas-vindas no painel admin
        const adminHeader = adminPanel.querySelector('.admin-header h2');
        if (adminHeader) {
            adminHeader.innerHTML = `Bem-vindo, ${user.displayName}! - Adicionar Novo Anime`;
        }
        // Inicializa API selects por padrão
        setTimeout(() => {
            inicializarJikanSelect();
            inicializarApiSelect();
        }, 100);

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
}

// Monitora estado de autenticação
onAuthStateChanged(auth, verificarAutenticacao);

// Função para adicionar anime
function inicializarFormulario() {
    const animeForm = document.getElementById('animeForm');
    if (animeForm && !animeForm.hasAttribute('data-listener-added')) {
        animeForm.setAttribute('data-listener-added', 'true');
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
}

// Função para adicionar novo anime
async function adicionarNovoAnime() {
    const nome = document.getElementById('nome').value;
    const notaValue = document.getElementById('nota').value;
    const nota = notaValue ? parseFloat(notaValue) : null;
    const tipoAdicao = document.querySelector('input[name="tipoAdicao"]:checked').value;
    let generos = [];
    let malId = null;

    if (tipoAdicao === 'manual') {
        const generoSelect = document.getElementById('genero');
        generos = Array.from(generoSelect.selectedOptions).map(option => option.value);
    } else if (tipoAdicao === 'api') {
        const animeJikanSelect = document.getElementById('animeJikan');
        const selectedJikanOption = animeJikanSelect.selectedOptions[0];
        if (selectedJikanOption && selectedJikanOption.dataset.anime) {
            const jikanData = JSON.parse(selectedJikanOption.dataset.anime);
            const generosIngles = jikanData.genres?.map(g => g.name) || [];
            generos = traduzirGeneros(generosIngles);
            malId = jikanData.mal_id;
        }
    }
    const descricao = document.getElementById('descricao').value;

    // Captura dados das APIs
    let imagemUrl = null;
    let animeSlug = null;
    let animeLink = null;
    
    if (tipoAdicao === 'api') {
        // Determina qual imagem usar
        const imagemSelect = document.getElementById('imagemSelect');
        const imagemEscolhida = imagemSelect ? imagemSelect.value : '';
        
        if (imagemEscolhida === 'jikan') {
            const jikanSelect = document.getElementById('animeJikan');
            const jikanOption = jikanSelect.selectedOptions[0];
            if (jikanOption && jikanOption.dataset.anime) {
                const jikanData = JSON.parse(jikanOption.dataset.anime);
                imagemUrl = jikanData.images?.jpg?.image_url || null;
            }
        } else if (imagemEscolhida === 'animefire') {
            const animeApiSelect = document.getElementById('animeApi');
            const animeApiOption = animeApiSelect.selectedOptions[0];
            if (animeApiOption && animeApiOption.dataset.anime) {
                const animeFireData = JSON.parse(animeApiOption.dataset.anime);
                imagemUrl = animeFireData.thumbnail || null;
            }
        } else if (imagemEscolhida) {
            imagemUrl = imagemEscolhida; // URL direta das imagens extras
        }
        
        // Pega dados do AnimeFire se disponível
        const animeApiSelect = document.getElementById('animeApi');
        const animeApiOption = animeApiSelect.selectedOptions[0];
        if (animeApiOption && animeApiOption.dataset.anime) {
            const animeFireData = JSON.parse(animeApiOption.dataset.anime);
            animeSlug = animeFireData.slug || null;
            animeLink = animeFireData.animeLink || null;
        }
    }

    try {
        const colecao = generos.includes('Hentai') ? 'outros' : 'animes';
        const proximoId = await obterProximoId(colecao);

        const animeData = {
            ordem: proximoId,
            nome: nome,
            nota: nota,
            generos: generos,
            descricao: descricao,
            descricoes: [{ texto: descricao, data: new Date() }],
            dataInsercao: new Date()
        };
        
        // Adiciona campos opcionais apenas se não forem undefined
        if (imagemUrl !== null) animeData.imagem = imagemUrl;
        if (animeSlug !== null) animeData.anime_slug = animeSlug;
        if (animeLink !== null) animeData.animeLink = animeLink;
        if (malId !== null) animeData.mal_id = malId;

        await addDoc(collection(db, colecao), animeData);

        resetarFormulario();
        carregarAnimes();
        document.getElementById('status').innerHTML = '<div class="success">✅ Anime adicionado com sucesso!</div>';
        
        // Remove mensagem após 4 segundos
        setTimeout(() => {
            document.getElementById('status').innerHTML = '';
        }, 2000);
        
        // Reinicializa Select2 após adicionar anime
        setTimeout(() => {
            inicializarJikanSelect();
            inicializarApiSelect();
        }, 100);

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

    // Captura dados das APIs
    let imagemUrl = null;
    let animeSlug = null;
    let animeLink = null;
    let malId = null;
    
    const apiVincular = document.querySelector('input[name="apiVincular"]:checked')?.value || 'nenhuma';
    
    if (apiVincular === 'api') {
        // Determina qual imagem usar
        const imagemSelect = document.getElementById('imagemSelectVincular');
        const imagemEscolhida = imagemSelect ? imagemSelect.value : '';
        
        if (imagemEscolhida === 'jikan') {
            const jikanSelect = document.getElementById('animeJikanVincular');
            const jikanOption = jikanSelect.selectedOptions[0];
            if (jikanOption && jikanOption.dataset.anime) {
                const jikanData = JSON.parse(jikanOption.dataset.anime);
                imagemUrl = jikanData.images?.jpg?.image_url || null;
                malId = jikanData.mal_id || null;
            }
        } else if (imagemEscolhida === 'animefire') {
            const animeApiSelect = document.getElementById('animeApiVincular');
            const animeApiOption = animeApiSelect.selectedOptions[0];
            if (animeApiOption && animeApiOption.dataset.anime) {
                const animeFireData = JSON.parse(animeApiOption.dataset.anime);
                imagemUrl = animeFireData.thumbnail || null;
            }
        } else if (imagemEscolhida) {
            imagemUrl = imagemEscolhida; // URL direta das imagens extras
        }
        
        // Pega dados do AnimeFire se disponível
        const animeApiSelect = document.getElementById('animeApiVincular');
        const animeApiOption = animeApiSelect.selectedOptions[0];
        if (animeApiOption && animeApiOption.dataset.anime) {
            const animeFireData = JSON.parse(animeApiOption.dataset.anime);
            animeSlug = animeFireData.slug || null;
            animeLink = animeFireData.animeLink || null;
        }
        
        // Pega mal_id do Jikan se não foi definido ainda
        if (!malId) {
            const jikanSelect = document.getElementById('animeJikanVincular');
            const jikanOption = jikanSelect.selectedOptions[0];
            if (jikanOption && jikanOption.dataset.anime) {
                const jikanData = JSON.parse(jikanOption.dataset.anime);
                malId = jikanData.mal_id || null;
            }
        }
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

        // Adiciona nova temporada com sistema de descrições
        const novaTemporada = {
            numero: proximaTemporada,
            nome: nome,
            nota: nota,
            descricao: descricao,
            descricoes: [{ texto: descricao, data: new Date() }]
        };

        // Adiciona campos opcionais apenas se não forem undefined
        if (imagemUrl !== null) novaTemporada.imagem = imagemUrl;
        if (animeSlug !== null) novaTemporada.anime_slug = animeSlug;
        if (animeLink !== null) novaTemporada.animeLink = animeLink;
        if (malId !== null) novaTemporada.mal_id = malId;

        temporadas.push(novaTemporada);

        // Atualiza o documento
        await updateDoc(doc(db, 'animes', animeId), {
            temporadas: temporadas
        });

        resetarFormulario();
        carregarAnimes();
        document.getElementById('status').innerHTML = `<div class="success">✅ ${proximaTemporada}ª Temporada adicionada com sucesso!</div>`;
        
        // Remove mensagem após 4 segundos
        setTimeout(() => {
            document.getElementById('status').innerHTML = '';
        }, 2000);
        
        // Limpa campos das APIs para temporadas
        if (typeof $ !== 'undefined') {
            $('#animeJikanVincular').val(null).trigger('change');
            $('#animeApiVincular').val(null).trigger('change');
            if ($('#imagemSelectVincular').hasClass('select2-hidden-accessible')) {
                $('#imagemSelectVincular').val(null).trigger('change');
            }
        }
        
        // Oculta seleção de imagem
        const imagemOpcoesVincular = document.getElementById('imagemOpcoesVincular');
        if (imagemOpcoesVincular) imagemOpcoesVincular.style.display = 'none';

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
                <div>
                    <h3>Erro Firebase</h3>
                    <p><strong>Detalhes:</strong> ${error.message}</p>
                </div>
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
    
    // Verifica se não há resultados
    if (animesFiltrados.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-size: 18px; margin: 40px 0;">Nenhum anime correspondente</p>';
        return;
    }
    
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
            const ultimaDescricao = anime.descricoes[anime.descricoes.length - 1];
            descricaoMaisRecente = typeof ultimaDescricao === 'string' ? ultimaDescricao : ultimaDescricao.texto;
        }

        // Verifica se comentários estão habilitados
        const comentariosHabilitados = localStorage.getItem('comentariosHabilitados') === 'true';
        const descricaoExibida = comentariosHabilitados ? descricaoMaisRecente : '<span id="amarelo">Cuidado Spoiler⚠️⚠️⚠️!!!</span>';

        // Sanitiza dados antes de inserir no DOM
        const nomeSeguro = anime.nome ? anime.nome.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'N/A';
        const generosSeguro = generosTexto.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        div.innerHTML = `
                ${imagemHtml}
                <div class="anime-content">
                    <h3>#${anime.ordem || 'N/A'} - ${nomeSeguro}</h3>
                    <p><strong>Nota:</strong> ${anime.nota !== null ? anime.nota + '/10 ⭐' : '???'}</p>
                    <p><strong>Gêneros:</strong> ${generosSeguro}</p>
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
    document.getElementById('animeJikan').required = false;
    document.getElementById('animeExistente').required = false;
    
    // Remove required dos campos de vincular se existirem
    const animeJikanVincular = document.getElementById('animeJikanVincular');
    if (animeJikanVincular) animeJikanVincular.required = false;

    if (tipoAdicao === 'manual') {
        generoManual.style.display = 'flex';
        document.getElementById('genero').required = true;
    } else if (tipoAdicao === 'api') {
        generoApi.style.display = 'flex';
        document.getElementById('animeJikan').required = true;
        // Aguarda o elemento ficar visível antes de inicializar
        setTimeout(() => {
            inicializarJikanSelect();
            inicializarApiSelect();
        }, 100);
    } else if (tipoAdicao === 'vincular') {
        animeVinculado.style.display = 'flex';
        document.getElementById('animeExistente').required = true;
        popularAnimesExistentes();
        alterarApiVincular();
    }
};

// Mantém compatibilidade com código existente
window.alterarTipoGenero = window.alterarTipoAdicao;

// Função para alternar API na vinculação
window.alterarApiVincular = () => {
    const apiVincular = document.querySelector('input[name="apiVincular"]:checked')?.value || 'nenhuma';
    const generoApiVincular = document.getElementById('generoApiVincular');
    
    if (apiVincular === 'nenhuma') {
        generoApiVincular.style.display = 'none';
    } else if (apiVincular === 'api') {
        generoApiVincular.style.display = 'flex';
        document.getElementById('animeJikanVincular').required = true;
        
        // Inicializa os selects das APIs
        inicializarJikanSelectVincular();
        inicializarApiSelectVincular();
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
            templateResult: function(option) {
                if (option.loading) return option.text;
                if (!option.element || !option.element.dataset.imageUrl) return $(`<div>${option.text}</div>`);
                
                return $(`
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${option.element.dataset.imageUrl}" style="width: 40px; height: 60px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none'">
                        <div>${option.text}</div>
                    </div>
                `);
            },
            templateSelection: function(option) {
                return option.text;
            }
        });
        
        const imagemOpcoes = document.getElementById('imagemOpcoes');
        if (imagemOpcoes) imagemOpcoes.style.display = 'flex';
        
    } catch (error) {
        console.error('Erro ao carregar imagens:', error);
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
        
        $('#animeJikan').on('select2:clear', function() {
            const imagemOpcoes = document.getElementById('imagemOpcoes');
            if (imagemOpcoes) imagemOpcoes.style.display = 'none';
        });
    }
}

// Função para inicializar Select2 da API Jikan para vincular
function inicializarJikanSelectVincular() {
    if (typeof $ !== 'undefined' && $('#animeJikanVincular').length) {
        if ($('#animeJikanVincular').hasClass('select2-hidden-accessible')) {
            $('#animeJikanVincular').select2('destroy');
        }
        
        $('#animeJikanVincular').select2({
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
                    const option = document.querySelector(`#animeJikanVincular option[value="${anime.id}"]`);
                    if (option) {
                        option.dataset.anime = JSON.stringify(anime.anime);
                    }
                    carregarImagensAnimeVincular(anime.anime.mal_id);
                }
                return anime.text;
            }
        });
        
        $('#animeJikanVincular').on('select2:clear', function() {
            const imagemOpcoes = document.getElementById('imagemOpcoesVincular');
            if (imagemOpcoes) imagemOpcoes.style.display = 'none';
        });
    }
}

// Função para inicializar Select2 da API AnFire para vincular
function inicializarApiSelectVincular() {
    if (typeof $ !== 'undefined' && $('#animeApiVincular').length) {
        if ($('#animeApiVincular').hasClass('select2-hidden-accessible')) {
            $('#animeApiVincular').select2('destroy');
        }
        
        $('#animeApiVincular').select2({
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
                    const option = document.querySelector(`#animeApiVincular option[value="${anime.id}"]`);
                    if (option) {
                        option.dataset.anime = JSON.stringify(anime.anime);
                    }
                    // Atualiza opções de imagem se Jikan já estiver selecionado
                    const jikanSelect = document.getElementById('animeJikanVincular');
                    if (jikanSelect && jikanSelect.value) {
                        const jikanOption = jikanSelect.selectedOptions[0];
                        if (jikanOption && jikanOption.dataset.anime) {
                            const jikanData = JSON.parse(jikanOption.dataset.anime);
                            carregarImagensAnimeVincular(jikanData.mal_id);
                        }
                    }
                }
                return anime.text;
            }
        });
    }
}

// Função para carregar imagens do anime para vincular
async function carregarImagensAnimeVincular(malId) {
    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}/pictures`);
        const data = await response.json();
        
        // Destroi Select2 existente se houver
        if ($('#imagemSelectVincular').hasClass('select2-hidden-accessible')) {
            $('#imagemSelectVincular').select2('destroy');
        }
        
        const imagemSelect = document.getElementById('imagemSelectVincular');
        if (!imagemSelect) return;
        
        imagemSelect.innerHTML = '<option value="">Selecione uma imagem...</option>';
        
        // Pega URLs das imagens para usar no Select2
        let jikanImageUrl = null;
        let animeFireImageUrl = null;
        
        // Pega imagem do Jikan
        const jikanSelect = document.getElementById('animeJikanVincular');
        if (jikanSelect && jikanSelect.selectedOptions[0] && jikanSelect.selectedOptions[0].dataset.anime) {
            const jikanData = JSON.parse(jikanSelect.selectedOptions[0].dataset.anime);
            jikanImageUrl = jikanData.images?.jpg?.image_url;
        }
        
        // Pega imagem do AnimeFire
        const animeApiSelect = document.getElementById('animeApiVincular');
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
        $('#imagemSelectVincular').select2({
            placeholder: 'Selecione uma imagem...',
            allowClear: true,
            templateResult: function(option) {
                if (option.loading) return option.text;
                if (!option.element || !option.element.dataset.imageUrl) return $(`<div>${option.text}</div>`);
                
                return $(`
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${option.element.dataset.imageUrl}" style="width: 40px; height: 60px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none'">
                        <div>${option.text}</div>
                    </div>
                `);
            },
            templateSelection: function(option) {
                return option.text;
            }
        });
        
        const imagemOpcoes = document.getElementById('imagemOpcoesVincular');
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
        $('#animeJikan').val(null).trigger('change');
        if ($('#imagemSelect').hasClass('select2-hidden-accessible')) {
            $('#imagemSelect').val(null).trigger('change');
        }
    }
    
    // Oculta seleção de imagem
    const imagemOpcoes = document.getElementById('imagemOpcoes');
    if (imagemOpcoes) imagemOpcoes.style.display = 'none';

    // Limpa status
    const status = document.getElementById('status');
    if (status) {
        status.innerHTML = '';
    }
};

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

    // Apenas atualiza a exibição sem recarregar dados
    if (todosAnimes.length > 0) {
        exibirAnimes(todosAnimes);
    }
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

// Fecha filtros ao clicar fora
document.addEventListener('click', (event) => {
    const filtrosAvancados = document.getElementById('filtrosAvancados');
    const toggleButton = document.getElementById('toggleFiltros');
    
    if (filtrosAvancados && filtrosAvancados.style.display !== 'none') {
        if (!filtrosAvancados.contains(event.target) && event.target !== toggleButton) {
            filtrosAvancados.style.display = 'none';
        }
    }
});

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

// Função para aplicar máscara no campo nota
function aplicarMascaraNota() {
    const notaInput = document.getElementById('nota');
    if (notaInput) {
        notaInput.addEventListener('input', function() {
            let valor = parseFloat(this.value);
            if (valor > 10) {
                this.value = '10';
            }
        });
    }
}

// Função de inicialização
async function inicializar() {
    await carregarAnimes();
    inicializarBotaoComentarios();
    inicializarFiltros();
    inicializarFormulario();
    aplicarMascaraNota();
    // Verifica autenticação após carregar a página
    setTimeout(verificarAutenticacao, 200);
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
    // DOM já está pronto
    setTimeout(inicializar, 100);
}

// Exporta função para uso no SPA
window.inicializarApp = inicializar;