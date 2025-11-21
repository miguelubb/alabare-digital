document.addEventListener('DOMContentLoaded', () => {
    const songListContainer = document.getElementById('songList');
    const searchInput = document.getElementById('searchInput');
    const audioPlayer = document.getElementById('audioPlayer');
    const playerTitle = document.getElementById('playerTitle');
    const mainContent = document.getElementById('mainContent');

    // Check if data loaded
    if (typeof songsData === 'undefined') {
        songListContainer.innerHTML = '<div class="p-3 text-danger">Error: No se cargaron los datos de canciones.</div>';
        return;
    }

    // Initial render
    renderCategories(songsData);

    // Render Categories (Accordion)
    function renderCategories(categories) {
        songListContainer.innerHTML = '';

        if (categories.length === 0) {
            songListContainer.innerHTML = '<div class="p-3 text-muted">No se encontraron resultados.</div>';
            return;
        }

        const accordion = document.createElement('div');
        accordion.className = 'accordion accordion-flush';
        accordion.id = 'songsAccordion';

        categories.forEach((cat, index) => {
            // Skip empty categories
            if (!cat.songs || cat.songs.length === 0) return;

            const itemId = `heading${index}`;
            const collapseId = `collapse${index}`;

            const item = document.createElement('div');
            item.className = 'accordion-item';

            item.innerHTML = `
                <h2 class="accordion-header" id="${itemId}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                        ${cat.title} <span class="badge bg-secondary ms-2 rounded-pill">${cat.songs.length}</span>
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${itemId}" data-bs-parent="#songsAccordion">
                    <div class="accordion-body p-0">
                        <div class="list-group list-group-flush">
                            ${cat.songs.map(song => `
                                <button class="list-group-item list-group-item-action ps-4 song-btn ${(!song.lyricsContent || song.lyricsContent.length < 50) ? 'text-danger' : ''}" 
                                    data-path="${song.path}" 
                                    data-title="${song.title}"
                                    data-index="${index}"
                                    data-song-id="${song.id}">
                                    <i class="bi bi-music-note me-2 text-muted"></i>${song.title} [${song.id}]
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            accordion.appendChild(item);
        });

        songListContainer.appendChild(accordion);

        // Add click listeners to new buttons
        document.querySelectorAll('.song-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Find the song object to get the full content (including lyrics)
                // Storing large lyrics in dataset is bad practice, so we lookup by ID
                const catIndex = btn.dataset.index;
                const songId = btn.dataset.songId;
                const category = songsData[catIndex];
                const song = category.songs.find(s => s.id === songId);

                if (song) {
                    selectSong(song, btn);
                }
            });
        });
    }

    // Select song function (Display lyrics, prepare audio)
    function selectSong(song, buttonElement) {
        // Update active state
        document.querySelectorAll('.song-btn').forEach(btn => btn.classList.remove('active'));
        if (buttonElement) {
            buttonElement.classList.add('active');
        }

        // Update player (BUT DO NOT AUTO PLAY)
        const encodedPath = song.path.split('/').map(part => encodeURIComponent(part)).join('/');
        if (audioPlayer.src !== window.location.origin + '/' + encodedPath && audioPlayer.src !== encodedPath) {
            audioPlayer.src = encodedPath;
        }
        playerTitle.textContent = song.title;

        // Load Lyrics
        displayLyrics(song.id, song.title, song.lyricsContent);
    }

    function displayLyrics(id, title, content) {
        if (!content) {
            mainContent.innerHTML = `
                <div class="text-center mt-5">
                    <h2 class="display-6">${title} [${id}]</h2>
                    <p class="text-muted">Letra no disponible.</p>
                </div>
            `;
            return;
        }

        mainContent.innerHTML = `
            <div class="lyrics-container">
                <h2 class="display-6 mb-4 text-center">${title}</h2>
                <div class="lyrics-content lead">
                    ${content}
                </div>
            </div>
        `;
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();

        if (!term) {
            renderCategories(songsData);
            return;
        }

        // Filter categories and songs
        const filteredData = songsData.map(cat => {
            const matchingSongs = cat.songs.filter(song =>
                song.title.toLowerCase().includes(term) || song.id.includes(term)
            );
            return {
                ...cat,
                songs: matchingSongs
            };
        }).filter(cat => cat.songs.length > 0);

        renderCategories(filteredData);

        // Open all accordions when searching
        document.querySelectorAll('.accordion-collapse').forEach(el => {
            el.classList.add('show');
        });
    });
});
