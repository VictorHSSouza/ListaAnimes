import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { firebaseConfig, AUTHORIZED_EMAIL } from './config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exporta instâncias para uso global
window.firebaseApp = app;
window.firebaseAuth = auth;
window.auth = auth; // Para compatibilidade com router
window.db = db; // Para uso nos outros scripts
window.firebaseConfig = firebaseConfig; // Para acesso ao projectId

// Função para controlar dropdown
window.toggleDropdown = () => {
    const dropdown = document.querySelector('.mobile-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
};

// Função para controlar dropdown de Gerenciar
window.toggleGerenciarDropdown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const dropdown = event.target.closest('.dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
};

// Função para controlar sub-menu mobile
window.toggleMobileSubmenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const submenu = document.getElementById('mobile-gerenciar-submenu');
    if (submenu) {
        submenu.classList.toggle('active');
    }
};

// Função para fechar todos os dropdowns
window.closeAllDropdowns = () => {
    // Fecha dropdown mobile
    const mobileDropdown = document.querySelector('.mobile-dropdown');
    if (mobileDropdown) {
        mobileDropdown.classList.remove('active');
    }
    
    // Fecha sub-menu mobile
    const mobileSubmenu = document.getElementById('mobile-gerenciar-submenu');
    if (mobileSubmenu) {
        mobileSubmenu.classList.remove('active');
    }
    
    // Fecha dropdown de Gerenciar (desktop)
    const desktopDropdown = document.querySelector('.navbar-desktop .dropdown');
    if (desktopDropdown) {
        desktopDropdown.classList.remove('active');
    }
};

// Função para confirmar logout
window.confirmarSair = () => {
    if (confirm('Tem certeza que deseja sair?')) {
        if (typeof sair !== 'undefined') {
            sair();
        }
    }
};

// Fecha dropdown ao clicar fora
document.addEventListener('click', (event) => {
    // Dropdown mobile
    const mobileDropdown = document.querySelector('.mobile-dropdown');
    if (mobileDropdown && !mobileDropdown.contains(event.target)) {
        mobileDropdown.classList.remove('active');
        // Fecha sub-menu também
        const mobileSubmenu = document.getElementById('mobile-gerenciar-submenu');
        if (mobileSubmenu) {
            mobileSubmenu.classList.remove('active');
        }
    }
    
    // Dropdown de Gerenciar (desktop)
    const desktopDropdown = document.querySelector('.navbar-desktop .dropdown');
    const gerenciarContainer = event.target.closest('.navbar-desktop .dropdown');
    if (desktopDropdown && !gerenciarContainer) {
        desktopDropdown.classList.remove('active');
    }
});

onAuthStateChanged(auth, (user) => {
    const adminBtns = document.querySelectorAll('.admin-only');
    const loginBtns = document.querySelectorAll('.login-only');
    const logoutBtns = document.querySelectorAll('.logout-only');
    
    adminBtns.forEach(btn => {
        if (user && user.email === AUTHORIZED_EMAIL) {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    });
    
    loginBtns.forEach(btn => {
        if (!user) {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    });
    
    logoutBtns.forEach(btn => {
        if (user) {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    });
});