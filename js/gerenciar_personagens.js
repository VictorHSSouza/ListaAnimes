import { getFirestore, collection, getDocs, addDoc, doc, getDoc, updateDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
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
            const nomeUsuarioSeguro = user.displayName ? user.displayName.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Usuário';
            adminHeader.innerHTML = `Bem-vindo, ${nomeUsuarioSeguro}! - Adicionar Novo Personagem`;
        }
    } else if (user) {
        const nomeUsuarioSeguro = user.displayName ? user.displayName.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Usuário';
        document.getElementById('loginStatus').innerHTML = `<div class="danger">❌ Acesso negado, ${nomeUsuarioSeguro}. Apenas o administrador pode gerenciar personagens.</div>`;
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
    const animeSelect = document.getElementById('animeSelect');
    const animeId = animeSelect.value;
    const descricao = document.getElementById('descricao').value;
    const personagemSelect = document.getElementById('personagemSelect');
    const selectedOption = personagemSelect.selectedOptions[0];

    try {
        // Pega dados do personagem selecionado
        let imagemUrl = '';
        let jikanId = null;
        let aboutPersonagem = '';

        if (selectedOption && selectedOption.dataset.image) {
            imagemUrl = selectedOption.dataset.image;
        }

        if (selectedOption && selectedOption.dataset.jikanId) {
            jikanId = parseInt(selectedOption.dataset.jikanId);
        }

        if (selectedOption && selectedOption.dataset.about) {
            aboutPersonagem = selectedOption.dataset.about;
        }

        const personagemData = {
            nome: nome,
            descricao: descricao || aboutPersonagem
        };

        // Pega imagem selecionada
        const imagemPersonagemSelect = document.getElementById('imagemPersonagemSelect');
        if (imagemPersonagemSelect && imagemPersonagemSelect.value) {
            imagemUrl = imagemPersonagemSelect.value;
        }

        // Adiciona campos opcionais apenas se existirem
        if (imagemUrl) personagemData.imagem = imagemUrl;
        if (jikanId) personagemData.jikan_id = jikanId;

        // Busca o anime no Firebase
        const animeDocRef = doc(db, 'animes', animeId);
        const animeDoc = await getDoc(animeDocRef);

        if (!animeDoc.exists()) {
            throw new Error('Anime não encontrado!');
        }

        const animeData = animeDoc.data();
        const personagensExistentes = animeData.personagens || [];

        // Adiciona o novo personagem ao array
        personagensExistentes.push(personagemData);

        // Atualiza o documento do anime
        await updateDoc(animeDocRef, {
            personagens: personagensExistentes
        });

        carregarPersonagens();

        resetarFormulario();

        // Mostra mensagem apenas após resetar o formulário
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
        const querySnapshot = await getDocs(collection(db, "animes"));
        const todosPersonagens = [];

        querySnapshot.forEach((doc) => {
            const animeData = doc.data();
            if (animeData.personagens && animeData.personagens.length > 0) {
                animeData.personagens.forEach((personagem, index) => {
                    todosPersonagens.push({
                        ...personagem,
                        animeNome: animeData.nome,
                        animeId: doc.id,
                        animeOrdem: animeData.ordem || 0,
                        personagemIndex: index
                    });
                });
            }
        });

        // Ordena por ordem do anime, depois por índice de inserção do personagem
        todosPersonagens.sort((a, b) => {
            if (a.animeOrdem !== b.animeOrdem) {
                return a.animeOrdem - b.animeOrdem;
            }
            return a.personagemIndex - b.personagemIndex;
        });

        document.getElementById('loading').style.display = 'none';

        if (todosPersonagens.length === 0) {
            document.getElementById('personagens').innerHTML = '<p>Nenhum personagem encontrado.</p>';
            return;
        }

        exibirPersonagens(todosPersonagens);

    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('personagens').innerHTML = `
            <div class="anime" style="background-color: #ffe6e6; border-color: #ff9999;">
                <div>
                    <h3>Erro Firebase</h3>
                    <p><strong>Detalhes:</strong> ${error.message}</p>
                </div>
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
        div.className = 'personagem-item';

        // Sanitiza dados antes de inserir no DOM
        const nomeSeguro = personagem.nome ? personagem.nome.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
        const animeSeguro = personagem.animeNome ? personagem.animeNome.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
        const descricaoSegura = personagem.descricao ? personagem.descricao.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
        const imagemUrl = personagem.imagem || '';

        div.innerHTML = `
            <div>
                <img src="${imagemUrl}" alt="${nomeSeguro}" class="personagem-imagem-lista"> 
            </div>
            <div class="personagem-texto-lista">
                <span class="personagem-nome-lista">${nomeSeguro}</span>
                <span class="personagem-anime-lista">${animeSeguro}</span>
            </div>
        `;

        // Adiciona eventos de hover
        div.addEventListener('mouseenter', (e) => {
            mostrarHoverCard(e, {
                nome: nomeSeguro,
                anime: animeSeguro,
                descricao: descricaoSegura,
                imagem: imagemUrl
            });
        });

        div.addEventListener('mousemove', (e) => {
            moverHoverCard(e);
        });

        div.addEventListener('mouseleave', () => {
            esconderHoverCard();
        });

        // Adiciona evento de clique para visualizar personagem
        div.addEventListener('click', () => {
            const nomeEncoded = encodeURIComponent(personagem.nome);
            if (typeof navigateTo !== 'undefined') {
                navigateTo(`detalhes_personagem?animeId=${personagem.animeId}&nome=${nomeEncoded}`);
            }
        });

        container.appendChild(div);
    });
}

// Funções para o hover card
function mostrarHoverCard(e, personagem) {
    const hoverCard = document.getElementById('personagemHoverCard');
    const cardImage = document.getElementById('hoverCardImage');
    const cardNome = document.getElementById('hoverCardNome');
    const cardAnime = document.getElementById('hoverCardAnime');
    const cardDescricao = document.getElementById('hoverCardDescricao');

    cardNome.textContent = personagem.nome;
    cardAnime.textContent = personagem.anime;
    cardDescricao.textContent = personagem.descricao;

    if (personagem.imagem) {
        cardImage.src = personagem.imagem;
        cardImage.style.display = 'block';
    } else {
        cardImage.style.display = 'none';
    }

    hoverCard.style.display = 'block';
    moverHoverCard(e);
}

function moverHoverCard(e) {
    const hoverCard = document.getElementById('personagemHoverCard');
    const cardWidth = 400; // max-width do card
    const cardHeight = 300; // altura aproximada do card

    let left = e.pageX + 20;
    let right = 'auto';
    let top = e.pageY;
    let bottom = 'auto';

    // Verifica se o card sairia da tela na direita
    if ((window.innerWidth - 10) / 2 < e.pageX) {
        left = 'auto';
        right = window.innerWidth - e.pageX + 'px';
    } else {
        left = left + 'px'
    }

    // Verifica se o card sairia da tela na parte inferior
    if (top + cardHeight + 35 > window.innerHeight + window.scrollY) {
        top = 'auto';
        bottom = window.innerHeight - e.pageY + 'px';
    } else {
        top = top + 'px';
    }

    hoverCard.style.left = left;
    hoverCard.style.right = right;
    hoverCard.style.top = top;
    hoverCard.style.bottom = bottom;
}

function esconderHoverCard() {
    const hoverCard = document.getElementById('personagemHoverCard');
    hoverCard.style.display = 'none';
}

// Função para resetar formulário
window.resetarFormulario = () => {
    const nome = document.getElementById('nome');
    const animeSelect = document.getElementById('animeSelect');
    const descricao = document.getElementById('descricao');
    const restanteFormulario = document.getElementById('restanteFormulario');

    if (nome) nome.value = '';
    if (animeSelect) animeSelect.selectedIndex = 0;
    if (descricao) descricao.value = '';

    // Reset Select2 do personagem
    if (typeof $ !== 'undefined' && $('#personagemSelect').hasClass('select2-hidden-accessible')) {
        $('#personagemSelect').select2('destroy');
    }
    $('#personagemSelect').empty().append('<option value="">Primeiro selecione um anime</option>');

    // Reset select de imagem
    if (typeof $ !== 'undefined' && $('#imagemPersonagemSelect').hasClass('select2-hidden-accessible')) {
        $('#imagemPersonagemSelect').select2('destroy');
    }
    $('#imagemPersonagemSelect').empty().append('<option value="">Selecione uma imagem...</option>');
    document.getElementById('imagemPersonagemOpcoes').style.display = 'none';
    document.getElementById('imagemPersonagemSelect').required = false;

    // Remove mensagens informativas
    const infoMessages = restanteFormulario.querySelectorAll('.info');
    infoMessages.forEach(msg => msg.remove());

    // Oculta o restante do formulário
    restanteFormulario.style.display = 'none';

    const status = document.getElementById('status');
    if (status) {
        status.innerHTML = '';
    }
};

// Função para carregar animes no select
async function carregarAnimesSelect() {
    try {
        const querySnapshot = await getDocs(collection(db, "animes"));
        const animeSelect = document.getElementById('animeSelect');

        animeSelect.innerHTML = '<option value="">Selecione um anime...</option>';

        const animes = [];
        querySnapshot.forEach((doc) => {
            animes.push({ id: doc.id, ...doc.data() });
        });

        animes.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        animes.forEach(anime => {
            const option = document.createElement('option');
            option.value = anime.id;
            option.textContent = `#${anime.ordem} - ${anime.nome}`;
            option.dataset.malId = anime.mal_id;
            animeSelect.appendChild(option);
        });

        // Adiciona evento para carregar personagens
        animeSelect.addEventListener('change', carregarPersonagensSelect);

    } catch (error) {
        console.error('Erro ao carregar animes:', error);
    }
}

// Função para carregar personagens via Jikan API
async function carregarPersonagensSelect() {
    const animeSelect = document.getElementById('animeSelect');
    const selectedOption = animeSelect.selectedOptions[0];
    const malId = selectedOption?.dataset.malId;
    const animeId = animeSelect.value;
    const restanteFormulario = document.getElementById('restanteFormulario');
    const carregandoPersonagens = document.getElementById('carregandoPersonagens');

    if (!malId || malId === 'undefined') {
        if ($('#personagemSelect').hasClass('select2-hidden-accessible')) {
            $('#personagemSelect').select2('destroy');
        }
        $('#personagemSelect').empty().append('<option value="">Este anime não possui integração com a API</option>');
        document.getElementById('personagemSelect').required = false;
        carregandoPersonagens.style.display = 'none';
        restanteFormulario.style.display = 'flex';
        return;
    }

    // Mostra mensagem de carregamento
    carregandoPersonagens.style.display = 'block';
    restanteFormulario.style.display = 'none';

    try {
        // 1. Busca personagens já cadastrados no anime
        const animeDocRef = doc(db, 'animes', animeId);
        const animeDoc = await getDoc(animeDocRef);
        const personagensCadastrados = animeDoc.exists() ? (animeDoc.data().personagens || []) : [];
        const jikanIdsCadastrados = personagensCadastrados
            .filter(p => p.jikan_id)
            .map(p => p.jikan_id);

        // 2. Busca lista de personagens do anime na API
        const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}/characters`);
        const data = await response.json();

        // Verifica se a resposta tem dados válidos
        if (!data.data || !Array.isArray(data.data)) {
            throw new Error('Dados inválidos da API');
        }

        // 3. Filtra personagens já cadastrados
        data.data = data.data.filter(char =>
            !jikanIdsCadastrados.includes(char.character.mal_id)
        );

        // Destroi Select2 anterior se existir
        if ($('#personagemSelect').hasClass('select2-hidden-accessible')) {
            $('#personagemSelect').select2('destroy');
        }

        // Limpa e popula o select
        const personagemSelect = document.getElementById('personagemSelect');
        personagemSelect.innerHTML = '<option value="">Selecione um personagem...</option>';

        // Armazena dados básicos e IDs já cadastrados
        window.animeCharacters = data;
        window.jikanIdsCadastrados = jikanIdsCadastrados;

        // Verifica se há personagens disponíveis
        if (data.data.length === 0) {
            personagemSelect.innerHTML = '<option value="">Todos os personagens já foram cadastrados</option>';
            carregandoPersonagens.style.display = 'none';
            restanteFormulario.style.display = 'flex';
            return;
        }

        // Libera Select2 imediatamente e carrega dados em background
        if (data.data.length > 15) {
            loadOrCacheCharacterDataAsync(malId, data.data);
        } else {
            loadCharacterNicknamesAsync(data.data);
        }

        // Torna o campo obrigatório quando há integração com API
        document.getElementById('personagemSelect').required = true;

        // Inicializa Select2 com busca dinâmica e imagens
        $('#personagemSelect').select2({
            placeholder: 'Digite para buscar personagens...',
            allowClear: true,
            templateResult: formatCharacterResult,
            templateSelection: formatCharacterSelection,
            ajax: {
                delay: 300,
                transport: function (params, success, failure) {
                    const term = params.data.term ? params.data.term.toLowerCase() : '';
                    const filteredChars = window.animeCharacters.data.filter(char => {
                        const nameMatch = char.character.name.toLowerCase().includes(term);

                        // Busca também nos nicknames se já carregados
                        let nicknameMatch = false;
                        if (char.fullData && char.fullData.nicknames) {
                            nicknameMatch = char.fullData.nicknames.some(nickname =>
                                nickname.toLowerCase().includes(term)
                            );
                        }

                        return nameMatch || nicknameMatch;
                    });

                    setTimeout(() => {
                        success({
                            results: filteredChars.slice(0, 10).map(char => {
                                let displayText = char.character.name;
                                if (char.fullData && char.fullData.nicknames && char.fullData.nicknames.length > 0) {
                                    displayText += ` (${char.fullData.nicknames[0]})`;
                                }
                                displayText += ` - ${char.role}`;

                                return {
                                    id: char.character.mal_id,
                                    text: displayText,
                                    character: char,
                                    image: char.character.images?.jpg?.image_url || (char.fullData?.images?.jpg?.image_url)
                                };
                            })
                        });
                    }, 100);
                }
            },
            minimumInputLength: 1
        });

        // Evento quando personagem é selecionado
        $('#personagemSelect').on('select2:select', async function (e) {
            const selectedData = e.params.data;
            if (!selectedData.character) return;

            try {
                // Busca dados completos se ainda não tem
                if (!selectedData.character.fullData) {
                    const response = await fetch(`https://api.jikan.moe/v4/characters/${selectedData.character.character.mal_id}`);
                    const fullData = await response.json();
                    selectedData.character.fullData = fullData.data;
                }

                // Atualiza o campo nome
                document.getElementById('nome').value = selectedData.character.fullData.name;

                // Armazena dados no select para uso posterior
                const option = $(this).find('option:selected');
                option.attr('data-image', selectedData.character.fullData.images?.jpg?.image_url || '');
                option.attr('data-jikan-id', selectedData.character.fullData.mal_id);
                option.attr('data-role', selectedData.character.role);
                option.attr('data-about', selectedData.character.fullData.about || '');

                // Carrega imagens do personagem
                await carregarImagensPersonagem(selectedData.character.fullData.mal_id);

            } catch (error) {
                console.error('Erro ao buscar dados completos:', error);
                document.getElementById('nome').value = selectedData.character.character.name;
            }
        });



        // Esconde carregamento e mostra o restante do formulário imediatamente
        carregandoPersonagens.style.display = 'none';
        restanteFormulario.style.display = 'flex';

        console.log(`✅ Select2 liberado! ${data.data.length} personagens disponíveis (${jikanIdsCadastrados.length} já cadastrados foram filtrados)`);



    } catch (error) {
        console.error('Erro ao carregar personagens:', error);
        const personagemSelect = document.getElementById('personagemSelect');
        personagemSelect.innerHTML = '<option value="">Erro ao carregar personagens</option>';
        carregandoPersonagens.style.display = 'none';
    }
}

// Função para carregar ou usar cache de personagens (assíncrona)
function loadOrCacheCharacterDataAsync(malId, characters) {
    (async () => {
        try {
            const cacheDoc = await getDoc(doc(db, 'personagens_grandes', malId.toString()));

            if (cacheDoc.exists()) {
                console.log('💾 Cache encontrado! Verificando completude...');
                const cachedData = cacheDoc.data();
                const missingChars = [];

                characters.forEach(char => {
                    const cached = cachedData.personagens.find(p => p.mal_id === char.character.mal_id);
                    if (cached) {
                        char.fullData = cached;
                    } else {
                        missingChars.push(char);
                    }
                });

                if (missingChars.length > 0) {
                    console.log(`🔄 Cache incompleto. Carregando ${missingChars.length} personagens restantes...`);
                    await loadMissingCharacters(missingChars, malId, cachedData);
                } else {
                    console.log('✅ Cache completo! Busca por apelidos disponível.');
                }
            } else {
                console.log('🔄 Cache não encontrado. Carregando da API e salvando via AJAX...');
                await loadAndSaveCharacterDataIncremental(malId, characters);
            }
        } catch (error) {
            console.error('Erro ao verificar cache:', error);
            loadCharacterNicknamesAsync(characters);
        }
    })();
}

// Função para carregar da API e salvar incrementalmente
async function loadAndSaveCharacterDataIncremental(malId, characters) {
    const characterData = [];

    for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        try {
            const response = await fetch(`https://api.jikan.moe/v4/characters/${char.character.mal_id}`);
            const fullData = await response.json();

            char.fullData = fullData.data;

            characterData.push({
                mal_id: fullData.data.mal_id,
                name: fullData.data.name,
                nicknames: fullData.data.nicknames || [],
                images: fullData.data.images,
                about: fullData.data.about || ''
            });

            // Salva a cada 10 personagens
            if ((i + 1) % 10 === 0 || i === characters.length - 1) {
                await saveCharacterBatch(malId, characterData, i + 1, characters.length);
                console.log(`💾 Lote ${Math.ceil((i + 1) / 10)} salvo (${i + 1}/${characters.length})`);
            }

            await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
            console.error(`Erro ao carregar ${char.character.name}:`, error);
        }
    }

    console.log('✅ Todos os dados carregados e salvos incrementalmente!');
}

// Funções para formatar Select2 com imagens
function formatCharacterResult(character) {
    if (character.loading) {
        return character.text;
    }

    if (!character.image) {
        return $(`<span>${character.text}</span>`);
    }

    return $(`
        <div style="display: flex; align-items: center; padding: 5px;">
            <img src="${character.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%; margin-right: 10px;" onerror="this.style.display='none'">
            <span>${character.text}</span>
        </div>
    `);
}

function formatCharacterSelection(character) {
    return character.text;
}

// Função para salvar lote de personagens
async function saveCharacterBatch(malId, characterData, currentIndex, total) {
    try {
        await setDoc(doc(db, 'personagens_grandes', malId.toString()), {
            mal_id: malId,
            personagens: characterData,
            data_cache: new Date(),
            total_personagens: total,
            progresso: currentIndex
        });
    } catch (error) {
        console.error('Erro ao salvar lote:', error);
    }
}

// Função para carregar personagens faltantes
async function loadMissingCharacters(missingChars, malId, cachedData) {
    console.log(`🔍 Iniciando carregamento de ${missingChars.length} personagens faltantes`);
    const characterData = [];

    for (let i = 0; i < missingChars.length; i++) {
        const char = missingChars[i];

        try {
            const charMalId = char.character?.mal_id || char.mal_id;

            if (!charMalId) {
                console.warn(`⚠️ Personagem sem mal_id:`, char);
                continue;
            }

            const response = await fetch(`https://api.jikan.moe/v4/characters/${charMalId}`);
            const fullData = await response.json();

            char.fullData = fullData.data;

            characterData.push({
                mal_id: fullData.data.mal_id,
                name: fullData.data.name,
                nicknames: fullData.data.nicknames || [],
                images: fullData.data.images,
                about: fullData.data.about || ''
            });

            // Salva a cada 10 personagens
            if ((i + 1) % 10 === 0 || i === missingChars.length - 1) {
                const allCharacters = [...cachedData.personagens, ...characterData];
                await saveCharacterBatch(malId, allCharacters, allCharacters.length, allCharacters.length);
                console.log(`📊 Progresso: ${i + 1}/${missingChars.length} personagens processados`);
                console.log(`✅ Adicionados ao banco com sucesso`);
            }

            await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
            console.error(`❌ Erro ao carregar ${char.character?.name || char.name}:`, error);
        }
    }

    console.log(`✅ Carregamento concluído! ${characterData.length} personagens carregados com sucesso`);
    return characterData;
}

// Função para carregar nicknames em background (assíncrona)
function loadCharacterNicknamesAsync(characters) {
    (async () => {
        console.log(`Carregando nicknames de ${characters.length} personagens...`);

        for (let i = 0; i < characters.length; i++) {
            const char = characters[i];
            try {
                const response = await fetch(`https://api.jikan.moe/v4/characters/${char.character.mal_id}`);
                const fullData = await response.json();

                char.fullData = fullData.data;

                if ((i + 1) % 10 === 0) {
                    console.log(`Progresso: ${i + 1}/${characters.length} personagens carregados`);
                }

                await new Promise(resolve => setTimeout(resolve, 150));
            } catch (error) {
                console.error(`Erro ao carregar dados de ${char.character.name}:`, error);
            }
        }

        console.log('✅ Todos os nicknames carregados! Busca por apelidos disponível.');
    })();
}

// Função para carregar imagens do personagem
async function carregarImagensPersonagem(jikanId) {
    try {
        const response = await fetch(`https://api.jikan.moe/v4/characters/${jikanId}/pictures`);
        const data = await response.json();

        const imagemSelect = document.getElementById('imagemPersonagemSelect');
        const imagemOpcoes = document.getElementById('imagemPersonagemOpcoes');

        if (!imagemSelect || !data.data || data.data.length === 0) {
            imagemOpcoes.style.display = 'none';
            return;
        }

        // Limpa e popula o select
        imagemSelect.innerHTML = '<option value="">Selecione uma imagem...</option>';

        data.data.forEach((picture, index) => {
            const option = document.createElement('option');
            option.value = picture.jpg.image_url;
            option.textContent = `Imagem ${index + 1}`;
            option.dataset.imageUrl = picture.jpg.image_url;
            imagemSelect.appendChild(option);
        });

        // Inicializa Select2 com imagens
        if (typeof $ !== 'undefined') {
            if ($('#imagemPersonagemSelect').hasClass('select2-hidden-accessible')) {
                $('#imagemPersonagemSelect').select2('destroy');
            }

            $('#imagemPersonagemSelect').select2({
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
        }

        imagemOpcoes.style.display = 'flex';
        imagemSelect.required = true;

    } catch (error) {
        console.error('Erro ao carregar imagens do personagem:', error);
        document.getElementById('imagemPersonagemOpcoes').style.display = 'none';
    }
}

// Função de inicialização
async function inicializar() {
    await carregarPersonagens();
    await carregarAnimesSelect();
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