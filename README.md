# 📺 Lista de Animes

Sistema completo de gerenciamento de animes com Firebase e integração com a API Jikan (MyAnimeList).

## 🚀 Funcionalidades

### 👥 **Para Visitantes**
- ✅ Visualizar lista completa de animes
- ✅ Ver detalhes: nota, gêneros, descrição e imagem
- ✅ Interface responsiva para mobile e desktop

### 🔐 **Para Administradores**
- ✅ Login com Google (apenas email autorizado)
- ✅ Adicionar novos animes manualmente ou via API
- ✅ Alterar dados existentes (nome, nota, gêneros, descrição)
- ✅ Busca automática de animes na API Jikan
- ✅ Tradução automática de gêneros (inglês → português)
- ✅ Sistema de versionamento de descrições
- ✅ Upload automático de imagens da API

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Firebase Firestore
- **Autenticação**: Google Auth
- **API Externa**: Jikan API (MyAnimeList)
- **UI Components**: Select2
- **Responsividade**: CSS Media Queries

## 📱 Design Responsivo

- **Desktop**: Layout com imagens laterais e formulários completos
- **Mobile**: Layout empilhado com imagens em destaque
- **Adaptativo**: Botões e inputs se ajustam ao tamanho da tela

## 🔧 Estrutura do Projeto

```
ListaAnimes/
├── index.html              # Página pública (lista de animes)
├── gerenciar_animes.html    # Página admin (adicionar animes)
├── alterar_anime.html       # Página admin (editar animes)
├── styles.css              # Estilos globais + responsividade
├── app.js                  # JavaScript principal
├── alterar_anime.js        # JavaScript para edição
└── teste-top-ona/          # Pasta de testes da API
```

## 🎯 Como Usar

### **Visitantes**
1. Acesse a página inicial
2. Navegue pela lista de animes
3. Veja detalhes, notas e imagens

### **Administradores**
1. Acesse `/gerenciar_animes.html`
2. Faça login com Google
3. Escolha entre:
   - **Manual**: Selecione gêneros predefinidos
   - **API**: Busque animes da base do MyAnimeList
4. Preencha os dados e adicione
5. Use o botão "Alterar" nos cards para editar

## 🔐 Autenticação

- Apenas o email `victorhenriquesantanasouza@gmail.com` tem acesso admin
- Login via Google OAuth2
- Botões de edição só aparecem para usuários autorizados

## 📊 Banco de Dados

### **Estrutura dos Animes**
```javascript
{
  ordem: 1,                    // ID sequencial
  nome: "Nome do Anime",       // String
  nota: 8.5,                   // Number ou null
  generos: ["Ação", "Drama"],  // Array de strings
  descricao: "Descrição...",   // String (mais recente)
  descricoes: ["Desc1", "Desc2"], // Array histórico
  imagem: "https://...",       // URL da imagem
}
```

## 🌐 API Integration

- **Jikan API**: `https://api.jikan.moe/v4/anime`
- **Busca**: Por nome do anime
- **Dados**: Título, gêneros, imagem
- **Tradução**: Gêneros automáticos EN→PT

## 📱 Responsividade

### **Breakpoint**: 768px
- **Mobile**: Layout vertical, botões full-width
- **Desktop**: Layout horizontal, formulários fixos

## 🚀 Deploy

### **GitHub Pages**
1. Faça upload dos arquivos para o repositório
2. Vá em Settings → Pages
3. Selecione "Deploy from branch" → main
4. Site disponível em: `https://victorhssouza.github.io/ListaAnimes/`

## 🔄 Funcionalidades Avançadas

- **Ordenação**: Animes listados por ordem de cadastro
- **Versionamento**: Histórico de descrições
- **Validação**: Campos obrigatórios e opcionais
- **UX**: Mensagens de sucesso/erro
- **Performance**: Cache da API e otimizações

## 👨‍💻 Desenvolvedor

**Victor Henrique Santana Souza**
- GitHub: [@VictorHSSouza](https://github.com/VictorHSSouza)
- Email: victorhenriquesantanasouza@gmail.com

---

⭐ **Desenvolvido com Firebase + Jikan API**