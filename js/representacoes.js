import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, getDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { AUTHORIZED_EMAIL } from './config.js';

// Usa a instância do Firebase já inicializada
const db = getFirestore();
const auth = getAuth();

// Email autorizado
const EMAIL_AUTORIZADO = AUTHORIZED_EMAIL;

// Função para carregar representações
async function carregarRepresentacoes() {
    try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('representacoes-content').style.display = 'none';
        document.getElementById('representacoes-erro').style.display = 'none';

        // Carrega representações do Firebase
        const querySnapshot = await getDocs(collection(db, "representacoes"));
        const representacoes = [];

        querySnapshot.forEach((doc) => {
            representacoes.push({ id: doc.id, ...doc.data() });
        });

        document.getElementById('loading').style.display = 'none';
        document.getElementById('representacoes-content').style.display = 'block';
        
        // Mostra botão Nova Representação para admin
        const user = auth.currentUser;
        const isAuthorized = user && user.email === EMAIL_AUTORIZADO;
        const btnNova = document.getElementById('btn-nova-representacao');
        if (btnNova) {
            btnNova.style.display = isAuthorized ? 'inline-block' : 'none';
        }
        
        exibirRepresentacoes(representacoes);

    } catch (error) {
        console.error('Erro ao carregar representações:', error);
        mostrarErro();
    }
}

// Função para exibir representações
function exibirRepresentacoes(representacoes) {
    const container = document.getElementById('representacoes-container');
    
    // Verifica se usuário é admin
    const user = auth.currentUser;
    const isAuthorized = user && user.email === EMAIL_AUTORIZADO;

    container.innerHTML = '';

    representacoes.forEach(representacao => {
        const categoriaDiv = document.createElement('div');
        categoriaDiv.className = 'representacao-categoria';
        
        const personagens = representacao.personagens || [];
        const melhor = personagens[0];
        const outros = personagens.slice(1, 5);
        
        categoriaDiv.innerHTML = `
            <h2 class="representacao-titulo">${representacao.titulo}</h2>
            ${isAuthorized ? `<div class="representacao-button">
                ${personagens.length < 5 ? `<div class="admin-btn" id="representacao-adicionar" onclick="abrirModal('${representacao.id}', '${representacao.titulo}')">+</div>` : ''}
                <div class="admin-btn" id="representacao-alterar" onclick="abrirModalAlterar('${representacao.id}', '${representacao.titulo}')">✎</div>
                <div class="admin-btn" id="representacao-excluir" onclick="excluirRepresentacao('${representacao.id}')">-</div>
            </div>` : ''}
            <div class="representacao-grid">
                <div class="card-principal">
                    <div class="posicao-badge">1º</div>
                    <div class="card-personagem">
                        ${melhor ? `
                            <img src="${melhor.imagem || ''}" alt="${melhor.nome}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDE1MCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTgwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9Ijc1IiB5PSI5MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TZW0gaW1hZ2VtPC90ZXh0Pgo8L3N2Zz4K'">
                            <h4>${melhor.nome}</h4>
                            <p>${melhor.animeNome}</p>
                        ` : '<p>Nenhum personagem</p>'}
                    </div>
                </div>
                <div class="cards-secundarios">
                    ${Array.from({length: 4}, (_, index) => {
                        const personagem = outros[index];
                        return `
                            <div class="card-secundario">
                                <div class="posicao-badge">${index + 2}º</div>
                                <div class="card-personagem">
                                    ${personagem ? `
                                        <img src="${personagem.imagem || ''}" alt="${personagem.nome}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgODAgMTAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjQwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TZW0gaW1hZ2VtPC90ZXh0Pgo8L3N2Zz4K'">
                                        <h4>${personagem.nome}</h4>
                                        <p>${personagem.animeNome}</p>
                                    ` : '<p>Vazio</p>'}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        container.appendChild(categoriaDiv);
    });
    
    if (representacoes.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2>Nenhuma representação encontrada</h2>
                <p>Cadastre representações no Firebase para visualizá-las aqui.</p>
            </div>
        `;
    }
}

// Função para mostrar erro
function mostrarErro() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('representacoes-content').style.display = 'none';
    document.getElementById('representacoes-erro').style.display = 'block';
}

// Função de inicialização
async function inicializar() {
    await carregarRepresentacoes();
    
    // Inicializa event listeners
    setTimeout(() => {
        inicializarEventListeners();
        inicializarEventListenerPersonagem();
    }, 200);
    
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

// Variáveis globais para o modal
let categoriaAtual = '';
let posicaoAtual = 0;
let todosPersonagensGlobal = [];

// Função para abrir modal
window.abrirModal = (representacaoId, titulo) => {
    categoriaAtual = representacaoId;
    posicaoAtual = titulo;
    
    const modal = document.getElementById('modal-personagem');
    const tituloModal = document.querySelector('.modal-title');
    
    tituloModal.textContent = `Adicionar personagem - ${titulo}`;
    modal.style.display = 'flex';
    
    carregarPersonagensSelect();
};

// Função para fechar modal
window.fecharModal = () => {
    const modal = document.getElementById('modal-personagem');
    modal.style.display = 'none';
    
    // Limpa Select2
    if (typeof $ !== 'undefined' && $('#personagem-select').hasClass('select2-hidden-accessible')) {
        $('#personagem-select').select2('destroy');
    }
};

// Função para excluir representação
window.excluirRepresentacao = async (representacaoId) => {
    if (!confirm('Tem certeza que deseja excluir esta representação?')) {
        return;
    }
    
    try {
        await deleteDoc(doc(db, "representacoes", representacaoId));
        alert('Representação excluída com sucesso!');
        carregarRepresentacoes();
    } catch (error) {
        console.error('Erro ao excluir representação:', error);
        alert('Erro ao excluir representação.');
    }
};

// Função para carregar personagens no Select2
async function carregarPersonagensSelect() {
    try {
        // Busca personagens já cadastrados na representação atual
        const representacaoDoc = await getDoc(doc(db, 'representacoes', categoriaAtual));
        const personagensCadastrados = representacaoDoc.exists() ? 
            (representacaoDoc.data().personagens || []).map(p => `${p.nome}_${p.animeNome}`) : [];
        
        const querySnapshot = await getDocs(collection(db, "animes"));
        const personagens = [];

        querySnapshot.forEach((doc) => {
            const anime = doc.data();
            if (anime.personagens && anime.personagens.length > 0) {
                anime.personagens.forEach(personagem => {
                    const chavePersonagem = `${personagem.nome}_${anime.nome}`;
                    // Só adiciona se não estiver já cadastrado
                    if (!personagensCadastrados.includes(chavePersonagem)) {
                        personagens.push({
                            id: `${doc.id}_${personagem.nome}`,
                            nome: personagem.nome,
                            anime: anime.nome,
                            imagem: personagem.imagem
                        });
                    }
                });
            }
        });

        const select = document.getElementById('personagem-select');
        select.innerHTML = '<option value="">Selecione um personagem...</option>';
        
        personagens.forEach(personagem => {
            const option = document.createElement('option');
            option.value = personagem.id;
            option.textContent = `${personagem.nome} (${personagem.anime})`;
            option.dataset.imagem = personagem.imagem || '';
            select.appendChild(option);
        });

        // Inicializa Select2
        if (typeof $ !== 'undefined') {
            $('#personagem-select').select2({
                placeholder: 'Selecione um personagem...',
                allowClear: true,
                templateResult: function(personagem) {
                    if (personagem.loading) return personagem.text;
                    if (!personagem.element) return $(`<div>${personagem.text}</div>`);
                    
                    const imagem = personagem.element.dataset.imagem;
                    if (imagem) {
                        return $(`
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <img src="${imagem}" style="width: 40px; height: 50px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none'">
                                <div>${personagem.text}</div>
                            </div>
                        `);
                    }
                    return $(`<div>${personagem.text}</div>`);
                },
                templateSelection: function(personagem) {
                    return personagem.text;
                }
            });
        }

    } catch (error) {
        console.error('Erro ao carregar personagens:', error);
    }
}

// Event listener para formulário de seleção de personagem
function inicializarEventListenerPersonagem() {
    const form = document.getElementById('form-selecionar-personagem');
    if (form && !form.hasAttribute('data-listener-personagem')) {
        form.setAttribute('data-listener-personagem', 'true');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const personagemId = document.getElementById('personagem-select').value;
            if (personagemId) {
                await adicionarPersonagemRepresentacao(personagemId);
            }
        });
    }
}

// Função para abrir modal de nova representação
window.abrirModalNovaRepresentacao = () => {
    const modal = document.getElementById('modal-nova-representacao');
    modal.style.display = 'flex';
    document.getElementById('titulo-representacao').focus();
};

// Função para fechar modal de nova representação
window.fecharModalNova = () => {
    const modal = document.getElementById('modal-nova-representacao');
    modal.style.display = 'none';
    document.getElementById('titulo-representacao').value = '';
};

// Variável global para ID da representação sendo alterada
let representacaoAlterandoId = '';
let personagensOrdenados = [];

// Função para abrir modal de alterar representação
window.abrirModalAlterar = async (representacaoId, tituloAtual) => {
    representacaoAlterandoId = representacaoId;
    const modal = document.getElementById('modal-alterar-representacao');
    const input = document.getElementById('titulo-alterar-representacao');
    input.value = tituloAtual;
    
    await carregarPersonagensSortable(representacaoId);
    
    modal.style.display = 'flex';
    input.focus();
};

// Função para fechar modal de alterar representação
window.fecharModalAlterar = () => {
    const modal = document.getElementById('modal-alterar-representacao');
    modal.style.display = 'none';
    document.getElementById('titulo-alterar-representacao').value = '';
    document.getElementById('personagens-sortable').innerHTML = '';
    representacaoAlterandoId = '';
    personagensOrdenados = [];
};

// Event listener para formulário de nova representação
function inicializarEventListeners() {
    const formNova = document.getElementById('form-nova-representacao');
    if (formNova && !formNova.hasAttribute('data-listener-added')) {
        formNova.setAttribute('data-listener-added', 'true');
        formNova.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titulo = document.getElementById('titulo-representacao').value.trim();
            if (titulo) {
                await criarNovaRepresentacao(titulo);
            }
        });
    }
    
    const formAlterar = document.getElementById('form-alterar-representacao');
    if (formAlterar && !formAlterar.hasAttribute('data-listener-added')) {
        formAlterar.setAttribute('data-listener-added', 'true');
        formAlterar.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titulo = document.getElementById('titulo-alterar-representacao').value.trim();
            if (titulo) {
                await alterarRepresentacao(titulo);
            }
        });
    }
}

// Função para adicionar personagem à representação
async function adicionarPersonagemRepresentacao(personagemId) {
    try {
        // Busca dados do personagem selecionado
        const [animeId, nomePersonagem] = personagemId.split('_');
        
        const animeDoc = await getDoc(doc(db, 'animes', animeId));
        if (!animeDoc.exists()) {
            alert('Anime não encontrado!');
            return;
        }
        
        const animeData = animeDoc.data();
        const personagem = animeData.personagens?.find(p => p.nome === nomePersonagem);
        
        if (!personagem) {
            alert('Personagem não encontrado!');
            return;
        }
        
        // Busca a representação atual
        const representacaoDoc = await getDoc(doc(db, 'representacoes', categoriaAtual));
        if (!representacaoDoc.exists()) {
            alert('Representação não encontrada!');
            return;
        }
        
        const representacaoData = representacaoDoc.data();
        const personagensAtuais = representacaoData.personagens || [];
        
        // Verifica se já tem 5 personagens
        if (personagensAtuais.length >= 5) {
            alert('Esta representação já possui o máximo de 5 personagens!');
            return;
        }
        
        // Adiciona o novo personagem
        const novoPersonagem = {
            nome: personagem.nome,
            animeNome: animeData.nome,
            imagem: personagem.imagem
        };
        
        personagensAtuais.push(novoPersonagem);
        
        // Atualiza no Firebase
        await updateDoc(doc(db, 'representacoes', categoriaAtual), {
            personagens: personagensAtuais
        });
        
        fecharModal();
        await carregarRepresentacoes();
        
    } catch (error) {
        console.error('Erro ao adicionar personagem:', error);
        alert('Erro ao adicionar personagem: ' + error.message);
    }
}

// Função para criar nova representação no Firebase
async function criarNovaRepresentacao(titulo) {
    try {
        // Verifica se já existe uma representação com esse título
        const querySnapshot = await getDocs(collection(db, "representacoes"));
        const tituloExiste = querySnapshot.docs.some(doc => 
            doc.data().titulo.toLowerCase() === titulo.toLowerCase()
        );
        
        if (tituloExiste) {
            alert('Já existe uma representação com esse título!');
            return;
        }
        
        const docRef = await addDoc(collection(db, "representacoes"), {
            titulo: titulo,
            personagens: []
        });
        
        fecharModalNova();
        await carregarRepresentacoes();
        
    } catch (error) {
        console.error('Erro ao criar representação:', error);
        alert('Erro ao criar representação: ' + error.message);
    }
}

// Função para carregar personagens na lista ordenável
async function carregarPersonagensSortable(representacaoId) {
    try {
        const representacaoDoc = await getDoc(doc(db, 'representacoes', representacaoId));
        if (!representacaoDoc.exists()) return;
        
        const personagens = representacaoDoc.data().personagens || [];
        personagensOrdenados = [...personagens];
        
        const container = document.getElementById('personagens-sortable');
        container.innerHTML = '';
        
        if (personagens.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">Nenhum personagem cadastrado</p>';
            return;
        }
        
        personagens.forEach((personagem, index) => {
            const item = document.createElement('div');
            item.className = 'personagem-item';
            item.draggable = true;
            item.dataset.index = index;
            
            item.innerHTML = `
                <div class="personagem-posicao">${index + 1}</div>
                <div class="personagem-info">
                    <img src="${personagem.imagem || ''}" alt="${personagem.nome}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA0MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNlbSBpbWFnZW08L3RleHQ+Cjwvc3ZnPgo='">
                    <div class="personagem-dados">
                        <h5>${personagem.nome}</h5>
                        <p>${personagem.animeNome}</p>
                    </div>
                </div>
                <button class="personagem-remove" onclick="removerPersonagem(${index})">&times;</button>
                <div class="drag-handle">☰</div>
            `;
            
            // Event listeners para drag and drop
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
            
            container.appendChild(item);
        });
        
    } catch (error) {
        console.error('Erro ao carregar personagens:', error);
    }
}

// Funções para drag and drop
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    if (draggedElement !== this) {
        const draggedIndex = parseInt(draggedElement.dataset.index);
        const targetIndex = parseInt(this.dataset.index);
        
        // Reordena o array
        const draggedItem = personagensOrdenados[draggedIndex];
        personagensOrdenados.splice(draggedIndex, 1);
        personagensOrdenados.splice(targetIndex, 0, draggedItem);
        
        // Recarrega a lista
        atualizarListaPersonagens();
    }
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedElement = null;
}

// Função para atualizar a lista após reordenamento
function atualizarListaPersonagens() {
    const container = document.getElementById('personagens-sortable');
    container.innerHTML = '';
    
    personagensOrdenados.forEach((personagem, index) => {
        const item = document.createElement('div');
        item.className = 'personagem-item';
        item.draggable = true;
        item.dataset.index = index;
        
        item.innerHTML = `
            <div class="personagem-posicao">${index + 1}</div>
            <div class="personagem-info">
                <img src="${personagem.imagem || ''}" alt="${personagem.nome}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA0MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNlbSBpbWFnZW08L3RleHQ+Cjwvc3ZnPgo='">
                <div class="personagem-dados">
                    <h5>${personagem.nome}</h5>
                    <p>${personagem.animeNome}</p>
                </div>
            </div>
            <button class="personagem-remove" onclick="removerPersonagem(${index})">&times;</button>
            <div class="drag-handle">☰</div>
        `;
        
        // Event listeners para drag and drop
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
        
        container.appendChild(item);
    });
}

// Função para alterar representação no Firebase
async function alterarRepresentacao(novoTitulo) {
    try {
        // Verifica se já existe uma representação com esse título (exceto a atual)
        const querySnapshot = await getDocs(collection(db, "representacoes"));
        const tituloExiste = querySnapshot.docs.some(doc => 
            doc.id !== representacaoAlterandoId && 
            doc.data().titulo.toLowerCase() === novoTitulo.toLowerCase()
        );
        
        if (tituloExiste) {
            alert('Já existe uma representação com esse título!');
            return;
        }
        
        // Atualiza título e ordem dos personagens
        await updateDoc(doc(db, 'representacoes', representacaoAlterandoId), {
            titulo: novoTitulo,
            personagens: personagensOrdenados
        });
        
        fecharModalAlterar();
        await carregarRepresentacoes();
        
    } catch (error) {
        console.error('Erro ao alterar representação:', error);
        alert('Erro ao alterar representação: ' + error.message);
    }
}

// Função para remover personagem da lista
window.removerPersonagem = (index) => {
    if (confirm('Tem certeza que deseja remover este personagem da representação?')) {
        personagensOrdenados.splice(index, 1);
        atualizarListaPersonagens();
    }
};

// Fecha modals ao clicar fora
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modal-personagem');
    const modalNova = document.getElementById('modal-nova-representacao');
    const modalAlterar = document.getElementById('modal-alterar-representacao');
    
    if (e.target === modal) {
        fecharModal();
    }
    if (e.target === modalNova) {
        fecharModalNova();
    }
    if (e.target === modalAlterar) {
        fecharModalAlterar();
    }
});

// Exporta função para uso no SPA
window.inicializarApp = inicializar;