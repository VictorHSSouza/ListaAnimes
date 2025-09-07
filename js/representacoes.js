import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
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

        // Aqui você pode implementar a lógica para carregar as representações
        // Por enquanto, vou mostrar uma mensagem de exemplo
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('representacoes-content').style.display = 'block';
        
        const container = document.getElementById('representacoes-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2>Página de Representações</h2>
                <p>Esta é a nova página de representações. Aqui você pode implementar a funcionalidade desejada.</p>
            </div>
        `;

    } catch (error) {
        console.error('Erro ao carregar representações:', error);
        mostrarErro();
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

// Exporta função para uso no SPA
window.inicializarApp = inicializar;