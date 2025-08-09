const API_BASE = 'https://api.jikan.moe/v4';

async function loadTopAnimes() {
    const type = document.getElementById('typeFilter').value;
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    
    loading.style.display = 'block';
    results.innerHTML = '';
    
    try {
        const response = await fetch(`${API_BASE}/top/anime?type=${type}&limit=25`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        loading.style.display = 'none';
        
        if (data.data && data.data.length > 0) {
            displayTopAnimes(data.data, type);
        } else {
            results.innerHTML = '<div class="error">Nenhum anime encontrado.</div>';
        }
        
    } catch (error) {
        loading.style.display = 'none';
        results.innerHTML = `
            <div class="error">
                <h3>❌ Erro ao carregar animes</h3>
                <p><strong>Detalhes:</strong> ${error.message}</p>
                <p>Verifique sua conexão com a internet e tente novamente.</p>
            </div>
        `;
    }
}

function displayTopAnimes(animes, type) {
    const results = document.getElementById('results');
    const typeNames = {
        'ona': 'ONA (Original Net Animation)',
        'tv': 'Séries de TV',
        'movie': 'Filmes',
        'ova': 'OVA',
        'special': 'Especiais'
    };
    
    results.innerHTML = `
        <h2 style="color: white; text-align: center; margin-bottom: 30px;">
            🏆 Top ${typeNames[type] || type.toUpperCase()}
        </h2>
        <div class="anime-grid">
            ${animes.map(anime => `
                <div class="anime-card">
                    <img src="${anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x200'}" 
                         alt="${anime.title}" class="anime-image">
                    <div class="anime-content">
                        <div class="anime-rank">#${anime.rank} Ranking</div>
                        <h3 class="anime-title">${anime.title}</h3>
                        <div class="anime-score">⭐ ${anime.score || 'N/A'}/10</div>
                        <div class="anime-details">
                            <p><strong>Tipo:</strong> ${anime.type || 'N/A'}</p>
                            <p><strong>Episódios:</strong> ${anime.episodes || 'N/A'}</p>
                            <p><strong>Status:</strong> ${anime.status || 'N/A'}</p>
                            <p><strong>Ano:</strong> ${anime.year || anime.aired?.prop?.from?.year || 'N/A'}</p>
                            <p><strong>Estúdio:</strong> ${anime.studios?.map(s => s.name).join(', ') || 'N/A'}</p>
                            <p><strong>Gêneros:</strong> ${anime.genres?.map(g => g.name).join(', ') || 'N/A'}</p>
                        </div>
                        <div class="anime-synopsis">
                            <strong>Sinopse:</strong> ${anime.synopsis ? 
                                (anime.synopsis.length > 150 ? 
                                    anime.synopsis.substring(0, 150) + '...' : 
                                    anime.synopsis) 
                                : 'Sinopse não disponível.'}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Inicializa Select2 para pesquisa de animes
function initializeAnimeSearch() {
    $('#animeSearch').select2({
        placeholder: 'Digite o nome do anime para pesquisar...',
        allowClear: true,
        ajax: {
            url: function (params) {
                return `${API_BASE}/anime?q=${encodeURIComponent(params.term)}&limit=10`;
            },
            dataType: 'json',
            delay: 300,
            processResults: function (data) {
                return {
                    results: data.data.map(anime => ({
                        id: anime.mal_id,
                        text: anime.title,
                        anime: anime
                    }))
                };
            },
            cache: true
        },
        minimumInputLength: 2
    });

    // Evento quando um anime é selecionado
    $('#animeSearch').on('select2:select', function (e) {
        const selectedAnime = e.params.data.anime;
        displaySelectedAnime(selectedAnime);
    });
}

// Exibe o anime selecionado
function displaySelectedAnime(anime) {
    const results = document.getElementById('results');
    
    results.innerHTML = `
        <h2 style="color: white; text-align: center; margin-bottom: 30px;">
            🔍 Anime Selecionado
        </h2>
        <div class="anime-grid">
            <div class="anime-card" style="max-width: 500px; margin: 0 auto;">
                <img src="${anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x200'}" 
                     alt="${anime.title}" class="anime-image">
                <div class="anime-content">
                    <div class="anime-score">⭐ ${anime.score || 'N/A'}/10</div>
                    <h3 class="anime-title">${anime.title}</h3>
                    <div class="anime-details">
                        <p><strong>Título em Inglês:</strong> ${anime.title_english || 'N/A'}</p>
                        <p><strong>Tipo:</strong> ${anime.type || 'N/A'}</p>
                        <p><strong>Episódios:</strong> ${anime.episodes || 'N/A'}</p>
                        <p><strong>Status:</strong> ${anime.status || 'N/A'}</p>
                        <p><strong>Ano:</strong> ${anime.year || anime.aired?.prop?.from?.year || 'N/A'}</p>
                        <p><strong>Estúdio:</strong> ${anime.studios?.map(s => s.name).join(', ') || 'N/A'}</p>
                        <p><strong>Gêneros:</strong> ${anime.genres?.map(g => g.name).join(', ') || 'N/A'}</p>
                        <p><strong>Duração:</strong> ${anime.duration || 'N/A'}</p>
                        <p><strong>Rating:</strong> ${anime.rating || 'N/A'}</p>
                    </div>
                    <div class="anime-synopsis">
                        <strong>Sinopse:</strong> ${anime.synopsis || 'Sinopse não disponível.'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Carrega os animes ONA ao iniciar e inicializa o Select2
$(document).ready(function() {
    initializeAnimeSearch();
    loadTopAnimes();
});