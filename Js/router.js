// Sistema de roteamento simples
class Router {
    constructor() {
        this.routes = {
            '': 'pages/home.html',
            'index': 'pages/home.html',
            'gerenciar': 'pages/gerenciar.html',
            'alterar': 'pages/alterar.html',
            'detalhes': 'pages/detalhes.html',
            'outros': 'pages/outros.html'
        };
        
        this.history = [];
        this.currentPage = null;
        this.init();
    }
    
    init() {
        window.addEventListener('popstate', () => this.loadRoute());
        this.loadRoute();
    }
    
    async loadRoute() {
        const fullHash = window.location.hash.slice(1) || '';
        const [path, params] = fullHash.split('?');
        const route = this.routes[path] || this.routes[''];
        
        // Verifica se é página protegida
        if (path === 'outros' || path === 'alterar' || path === 'gerenciar') {
            // Importa Firebase auth para verificar
            const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            const auth = getAuth();
            const user = auth.currentUser;
            
            if (!user || user.email !== 'victorhenriquesantanasouza@gmail.com') {
                // Redireciona para home se não autorizado
                this.navigate('index');
                return;
            }
        }
        
        // Armazena página atual com parâmetros
        this.currentPage = fullHash || 'index';
        
        // Armazena parâmetros para uso nos scripts
        window.routeParams = new URLSearchParams(params || '');
        
        try {
            const response = await fetch(route);
            const html = await response.text();
            document.getElementById('app-content').innerHTML = html;
            
            // Carrega o script específico da página
            this.loadPageScript(path);
            
            // Atualiza título
            this.updateTitle(path);
            
        } catch (error) {
            document.getElementById('app-content').innerHTML = '<h1>Página não encontrada</h1>';
        }
    }
    
    loadPageScript(path) {
        // Remove script anterior se existir
        const oldScript = document.getElementById('page-script');
        if (oldScript) oldScript.remove();
        
        // Carrega novo script
        const scriptMap = {
            '': 'Js/app.js',
            'index': 'Js/app.js',
            'gerenciar': 'Js/app.js',
            'alterar': 'Js/alterar_anime.js',
            'detalhes': 'Js/detalhes.js',
            'outros': 'Js/outros.js'
        };
        
        const scriptSrc = scriptMap[path];
        if (scriptSrc) {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = `${scriptSrc}?v=${Date.now()}`;
            script.id = 'page-script';
            script.onload = () => {
                if (window.inicializarApp) {
                    window.inicializarApp();
                }
            };
            document.body.appendChild(script);
        }
    }
    
    updateTitle(path) {
        const titles = {
            '': 'Lista de Animes',
            'index': 'Lista de Animes',
            'gerenciar': 'Gerenciar Animes',
            'alterar': 'Alterar Anime',
            'detalhes': 'Detalhes do Anime',
            'outros': 'Outros - Lista de Animes'
        };
        
        document.getElementById('page-title').textContent = titles[path] || 'Lista de Animes';
    }
    
    navigate(path) {
        const currentHash = window.location.hash.slice(1) || 'index';
        if (this.currentPage && currentHash !== path) {
            this.history.push(currentHash);
        }
        window.location.hash = path;
        this.loadRoute();
    }
    
    goBack() {
        if (this.history.length > 0) {
            const previousPath = this.history.pop();
            window.location.hash = previousPath;
            this.loadRoute();
        } else {
            this.navigate('index');
        }
    }
}

// Funções globais para navegação
window.navigateTo = (path) => {
    // Fecha dropdown antes de navegar
    const dropdown = document.querySelector('.dropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
    }
    router.navigate(path);
};

window.goBack = () => {
    router.goBack();
};

// Inicializa o roteador
const router = new Router();