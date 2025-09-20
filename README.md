# 📺 Lista de Animes

Sistema completo de gerenciamento de animes e personagens com Firebase e integração com múltiplas APIs.

## 🚀 Funcionalidades

### 👥 **Para Visitantes**
- ✅ Visualizar lista completa de animes com filtros avançados
- ✅ Ver detalhes completos: nota, gêneros, descrição, imagem e temporadas
- ✅ Página de estatísticas interativas com gráficos Chart.js
- ✅ Interface responsiva para mobile e desktop
- ✅ Sistema de busca e filtros por gênero, nota e ordenação

### 🔐 **Para Administradores**
- ✅ Login com Google (apenas email autorizado)
- ✅ **Gerenciar Animes**: Adicionar, editar e vincular temporadas
- ✅ **Gerenciar Personagens**: Sistema completo de cadastro de personagens
- ✅ Integração com APIs duplas (Jikan + AnimeFire)
- ✅ Sistema de seleção de imagens múltiplas
- ✅ Tradução automática de gêneros (inglês → português)
- ✅ Sistema de versionamento de descrições
- ✅ Validação de notas (máximo 10) e campos obrigatórios

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript ES6+ (Modules)
- **Backend**: Firebase Firestore v10
- **Autenticação**: Google Auth OAuth2
- **APIs Externas**: 
  - Jikan API v4 (MyAnimeList)
  - AnimeFire API (http://18.230.118.237/anime/search)
- **UI Components**: Select2, Chart.js
- **Arquitetura**: SPA (Single Page Application) com roteamento
- **Responsividade**: CSS Media Queries + Animações CSS

## 📱 Design Responsivo

- **Desktop (>950px)**: Menu horizontal, dropdowns animados, layout com imagens laterais
- **Mobile (<768px)**: Menu hambúrguer com sub-menus, layout empilhado, imagens em destaque
- **Tablet (768px-950px)**: Layout híbrido adaptativo
- **Animações**: Transições suaves em dropdowns, hover effects, fade in/out
- **UX**: Mensagens auto-hide (4s), validação em tempo real, feedback visual

## 🔧 Estrutura do Projeto

```
ListaAnimes/
├── index.html                    # SPA Container + Navbar
├── pages/
│   ├── home.html                 # Lista pública de animes
│   ├── gerenciar_animes.html     # Admin - Gerenciar animes
│   ├── gerenciar_personagens.html # Admin - Gerenciar personagens
│   ├── alterar.html              # Admin - Editar animes
│   ├── detalhes.html             # Detalhes do anime + temporadas
│   ├── estatisticas.html         # Gráficos e estatísticas
├── js/
│   ├── router.js                 # Sistema de roteamento SPA
│   ├── all.js                    # Firebase config + funções globais
│   ├── app.js                    # Lógica principal (home + gerenciar)
│   ├── alterar_anime.js          # Edição de animes
│   ├── gerenciar_personagens.js  # Gerenciamento de personagens
│   ├── detalhes.js               # Página de detalhes
│   ├── estatisticas.js           # Gráficos Chart.js
├── css/
│   ├── styles.css                # Estilos principais + responsivo
│   └── bootstrap-utils.css       # Utilitários CSS
├── Images/                       # Favicon e assets
└── teste-*/                      # Pastas de testes de APIs
```

## 🎯 Como Usar

### **Visitantes**
1. **Home**: Visualize lista completa com filtros avançados
2. **Estatísticas**: Gráficos interativos de notas e gêneros
3. **Detalhes**: Clique em "Visualizar" para ver informações completas
4. **Filtros**: Use busca por nome, gênero, nota e ordenação

### **Administradores**
1. **Login**: Clique em "Login" e autentique com Google
2. **Gerenciar Animes**:
   - Adicionar novos animes via API dupla (Jikan + AnimeFire)
   - Selecionar entre múltiplas imagens disponíveis
   - Vincular temporadas a animes existentes
   - Editar dados usando botão "Alterar"
3. **Gerenciar Personagens**:
   - Cadastrar personagens com anime de origem
   - Sistema completo de CRUD

## 🔐 Autenticação

- Apenas o email `victorhenriquesantanasouza@gmail.com` tem acesso admin
- Login via Google OAuth2
- Botões de edição só aparecem para usuários autorizados

## 📊 Banco de Dados

### **Coleção: animes**
```javascript
{
  ordem: 1,                           // ID sequencial
  nome: "Nome do Anime",              // String
  nota: 8.5,                          // Number (0-10) ou null
  generos: ["Ação", "Drama"],         // Array de strings (PT)
  descricao: "Descrição atual...",    // String (versão mais recente)
  descricoes: ["Desc1", "Desc2"],     // Array histórico de versões
  imagem: "https://cdn.myanimelist.net/...", // URL da imagem
  anime_slug: "anime-slug",           // Slug para AnimeFire (opcional)
  animeLink: "https://animefire.net/...", // Link AnimeFire (opcional)
  mal_id: 12345                       // MyAnimeList ID (opcional)
}
```

### **Coleção: personagens**
```javascript
{
  nome: "Nome do Personagem",         // String
  anime: "Anime de Origem",           // String
  descricao: "Descrição...",          // String
  dataCriacao: Timestamp              // Data de cadastro
}
```

## 🌐 Integração de APIs

### **Sistema Dual de APIs**
- **Jikan API v4** (Obrigatório): `https://api.jikan.moe/v4/anime`
  - Dados: Título, gêneros, sinopse, imagem principal
  - Imagens extras: `/pictures` endpoint
  - Tradução automática de gêneros EN→PT
  
- **AnimeFire API** (Opcional): `http://18.230.118.237/anime/search`
  - Dados complementares: slug, link, imagem alternativa
  - Integração para streaming brasileiro

### **Funcionalidades da API**
- Busca inteligente com Select2
- Seleção de imagens múltiplas
- Cache e otimização de requisições
- Tratamento de erros e fallbacks

## 📱 Sistema Responsivo

### **Breakpoints Principais**
- **Mobile**: `<768px` - Layout vertical, menu hambúrguer
- **Tablet**: `768px-950px` - Layout híbrido
- **Desktop**: `>950px` - Menu horizontal, dropdowns

### **Funcionalidades Responsivas**
- Menu adaptativo com animações
- Sub-menus hierárquicos no mobile
- Gráficos redimensionáveis (Chart.js)
- Formulários que se adaptam ao tamanho da tela
- Imagens responsivas com object-fit

## 🚀 Deploy

### **GitHub Pages**
1. Faça upload dos arquivos para o repositório
2. Vá em Settings → Pages
3. Selecione "Deploy from branch" → main
4. Site disponível em: `https://victorhssouza.github.io/ListaAnimes/`

## 🔄 Funcionalidades Avançadas

### **Sistema de Navegação**
- SPA com roteamento dinâmico
- Proteção de rotas administrativas
- Navegação com histórico (back/forward)
- URLs amigáveis com parâmetros

### **Experiência do Usuário**
- Animações CSS suaves em todos os elementos
- Mensagens auto-hide (4 segundos)
- Loading states e feedback visual
- Validação em tempo real de formulários
- Sistema de filtros avançados com persistência

### **Performance e Otimização**
- Lazy loading de scripts por página
- Cache inteligente de dados da API
- Debounce em buscas e filtros
- Otimização de re-renders
- Gestão eficiente de memória (Chart.js)

### **Recursos Administrativos**
- Versionamento completo de descrições
- Sistema de temporadas vinculadas
- Múltiplas opções de imagem por anime
- Backup automático de dados
- Logs de atividades administrativas

## 👨‍💻 Desenvolvedor

**Victor Henrique Santana Souza**
- GitHub: [@VictorHSSouza](https://github.com/VictorHSSouza)
- Email: victorhenriquesantanasouza@gmail.com

---

⭐ **Desenvolvido com Firebase + APIs Múltiplas + Chart.js**

## 📈 Estatísticas do Projeto

- **Linhas de Código**: ~3000+ linhas
- **Arquivos JavaScript**: 7 módulos especializados
- **Páginas**: 7 páginas SPA
- **APIs Integradas**: 2 (Jikan + AnimeFire)
- **Responsividade**: 3 breakpoints principais
- **Funcionalidades**: 15+ recursos principais

## 🔒 Segurança

- Autenticação OAuth2 com Google
- Validação de email autorizado server-side
- Proteção de rotas administrativas
- Sanitização de inputs (XSS protection)
- Validação de dados no frontend e backend
- Rate limiting nas APIs externas
