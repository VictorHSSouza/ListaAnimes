// A API do MyAnimeList v2 requer autenticação OAuth2
// Vamos usar uma API alternativa gratuita que não requer autenticação

const API_BASE = 'https://api.jikan.moe/v4';

async function searchAnimes() {
    const query = document.getElementById('searchInput').value.trim();
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    
    if (!query) {
        alert('Digite o nome de um anime para pesquisar');
        return;
    }
    
    loading.style.display = 'block';
    results.innerHTML = '';
    
    try {
        const response = await fetch(`${API_BASE}/anime?q=${encodeURIComponent(query)}&limit=10`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        loading.style.display = 'none';
        
        if (data.data && data.data.length > 0) {
            displayAnimes(data.data);
        } else {
            results.innerHTML = '<div class="error">Nenhum anime encontrado.</div>';
        }
        
    } catch (error) {
        loading.style.display = 'none';
        results.innerHTML = `
            <div class="error">
                <h3>Erro ao buscar animes</h3>
                <p><strong>Detalhes:</strong> ${error.message}</p>
                <p><strong>Nota:</strong> A API oficial do MyAnimeList v2 requer autenticação OAuth2. 
                Estamos usando a API Jikan (não oficial) que é gratuita e não requer autenticação.</p>
            </div>
        `;
    }
}

function displayAnimes(animes) {
    const results = document.getElementById('results');
    
    results.innerHTML = animes.map(anime => `
        <div class="anime-card">
            <img src="${anime.images?.jpg?.image_url || 'https://via.placeholder.com/100x140'}" 
                 alt="${anime.title}" class="anime-image">
            <div class="anime-info">
                <h3 class="anime-title">${anime.title}</h3>
                <div class="anime-details">
                    <p><strong>Título em Inglês:</strong> ${anime.title_english || 'N/A'}</p>
                    <p><strong>Tipo:</strong> ${anime.type || 'N/A'}</p>
                    <p><strong>Episódios:</strong> ${anime.episodes || 'N/A'}</p>
                    <p><strong>Status:</strong> ${anime.status || 'N/A'}</p>
                    <p><strong>Ano:</strong> ${anime.year || 'N/A'}</p>
                    <p><strong>Nota:</strong> ${anime.score || 'N/A'}/10 ⭐</p>
                    <p><strong>Gêneros:</strong> ${anime.genres?.map(g => g.name).join(', ') || 'N/A'}</p>
                    <p><strong>Sinopse:</strong> ${anime.synopsis ? anime.synopsis.substring(0, 200) + '...' : 'N/A'}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Busca inicial
window.onload = () => {
    searchAnimes();
};