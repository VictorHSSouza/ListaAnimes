import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
const auth = getAuth(app);
const db = getFirestore(app);

// Exporta instâncias para uso global
window.firebaseApp = app;
window.firebaseAuth = auth;
window.auth = auth; // Para compatibilidade com router
window.db = db; // Para uso nos outros scripts

// Função para controlar dropdown
window.toggleDropdown = () => {
    const dropdown = document.querySelector('.dropdown');
    dropdown.classList.toggle('active');
};

// Fecha dropdown ao clicar fora
document.addEventListener('click', (event) => {
    const dropdown = document.querySelector('.dropdown');
    if (!dropdown.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});

onAuthStateChanged(auth, (user) => {
    const outrosBtns = document.querySelectorAll('.admin-only');
    const loginBtns = document.querySelectorAll('.login-only');
    
    outrosBtns.forEach(btn => {
        if (user && user.email === 'victorhenriquesantanasouza@gmail.com') {
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
});