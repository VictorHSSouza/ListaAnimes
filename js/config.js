// Firebase configuration
// Note: For client-side apps, Firebase config is not sensitive data
// These values are meant to be public and identify your Firebase project
// Security is handled by Firebase Security Rules, not by hiding config
const firebaseConfig = {
    // amazonq-ignore-next-line
    apiKey: "AIzaSyClZNdgFpmLYtY49WAexEj2U1czTTdNlMU",
    authDomain: "listaanimes-ace11.firebaseapp.com",
    projectId: "listaanimes-ace11",
    storageBucket: "listaanimes-ace11.firebasestorage.app",
    messagingSenderId: "670425575167",
    appId: "1:670425575167:web:b19728f277cf78879966ca",
    measurementId: "G-53EZCLPMZD"
};

// Authorized email for admin access
const AUTHORIZED_EMAIL = 'victorhenriquesantanasouza@gmail.com';

export { firebaseConfig, AUTHORIZED_EMAIL };