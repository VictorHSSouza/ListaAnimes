// Sistema de roteamento simples
class Router {
    constructor() {
        this.routes = {
            '': 'pages/home.html',
            'index': 'pages/home.html',
            'gerenciar': 'pages/gerenciar_animes.html',
            'gerenciar_animes': 'pages/gerenciar_animes.html',
            'gerenciar_personagens': 'pages/gerenciar_personagens.html',
            'alterar': 'pages/alterar.html',
            'detalhes': 'pages/detalhes.html',
            'outros': 'pages/outros.html',
            'estatisticas': 'pages/estatisticas.html'
        };
        
        this.history = [];
        this.currentPage = null;
        this.init();
    }
    
    init() {
        window.addEventListener('popstate', () => this.loadRoute());
        this.loadRoute();
    }
    
    async checkAuth() {
        return new Promise(async (resolve) => {
            try {
                // Aguarda Firebase estar disponível
                for (let i = 0; i < 50; i++) {
                    if (window.auth) break;
                    await new Promise(r => setTimeout(r, 100));
                }
                
                if (!window.auth) {
                    resolve(false);
                    return;
                }
                
                // Usa onAuthStateChanged para aguardar estado real
                const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                
                const unsubscribe = onAuthStateChanged(window.auth, (user) => {
                    unsubscribe();
                    const isAuthorized = user && user.email === 'victorhenriquesantanasouza@gmail.com';
                    resolve(isAuthorized);
                });
                
            } catch (error) {
                resolve(false);
            }
        });
    }
    
    async loadRoute() {
        const fullHash = window.location.hash.slice(1) || '';
        const [path, params] = fullHash.split('?');
        
        // Se a rota não existe, redireciona para index
        if (path && !this.routes[path]) {
            this.navigate('index');
            return;
        }
        
        const route = this.routes[path] || this.routes[''];
        
        // Verifica se é página protegida
        if (path === 'outros' || path === 'alterar' || path === 'gerenciar' || path === 'gerenciar_animes' || path === 'gerenciar_personagens') {
            const isAuthorized = await this.checkAuth();
            if (!isAuthorized) {
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
            const response = await fetch(`${route}?v=${Date.now()}`);
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
            '': 'js/app.js',
            'index': 'js/app.js',
            'gerenciar': 'js/app.js',
            'gerenciar_animes': 'js/app.js',
            'gerenciar_personagens': 'js/gerenciar_personagens.js',
            'alterar': 'js/alterar_anime.js',
            'detalhes': 'js/detalhes.js',
            'outros': 'js/outros.js',
            'estatisticas': 'js/estatisticas.js'
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
            'gerenciar_animes': 'Gerenciar Animes',
            'gerenciar_personagens': 'Gerenciar Personagens',
            'alterar': 'Alterar Anime',
            'detalhes': 'Detalhes do Anime',
            'outros': 'Outros - Lista de Animes',
            'estatisticas': 'Estatísticas - Lista de Animes'
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

// Inicializa o roteador
const router = new Router();

// Funções globais para navegação
window.navigateTo = (path) => {
    // Fecha todos os dropdowns antes de navegar
    if (window.closeAllDropdowns) {
        window.closeAllDropdowns();
    }
    router.navigate(path);
};

window.goBack = () => {
    router.goBack();
};

// Exporta router para uso global
window.router = router;