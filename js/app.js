document.addEventListener('DOMContentLoaded', () => {
    const songListContainer = document.getElementById('songList');
    const searchInput = document.getElementById('searchInput');
    const audioPlayer = document.getElementById('audioPlayer');
    const playerTitle = document.getElementById('playerTitle');
    const mainContent = document.getElementById('mainContent');

    // UI Elements
    const welcomeMessage = document.getElementById('welcomeMessage');
    const songContainer = document.getElementById('songContainer');
    const lyricsContainer = document.getElementById('lyricsContainer');
    const originalViewContainer = document.getElementById('originalViewContainer');
    const originalLyricsContent = document.getElementById('originalLyricsContent');

    // Buttons
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const sidebar = document.getElementById('sidebar');
    const songActions = document.getElementById('songActions');
    const btnEdit = document.getElementById('btnEdit');
    const btnCompare = document.getElementById('btnCompare');

    // State
    let currentSong = null;
    const parser = new ChordProParser();

    // Check if data loaded
    if (typeof songsData === 'undefined') {
        songListContainer.innerHTML = '<div class="p-3 text-danger">Error: No se cargaron los datos de canciones.</div>';
        return;
    }

    // Initial render
    renderCategories(songsData);

    // Sidebar Toggle
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Editor elements and state
    const editorViewContainer = document.getElementById('editorViewContainer');
    const btnSaveEditor = document.getElementById('btnSaveEditor');
    let editorInstance = null;

    // Initialize CodeMirror (lazy)
    function initEditor() {
        if (!editorInstance && document.getElementById('codeEditor')) {
            editorInstance = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
                mode: 'markdown',
                theme: 'monokai',
                lineNumbers: true,
                lineWrapping: true,
                autofocus: false
            });

            editorInstance.on('change', () => {
                // Real-time preview: update rendered lyrics as user types
                if (currentSong && !editorViewContainer.classList.contains('d-none')) {
                    const content = editorInstance.getValue();
                    lyricsContainer.innerHTML = parser.parseAndRender(content);
                }
            });
        }
    }

    // Edit Button - Toggle Editor
    btnEdit.addEventListener('click', async () => {
        if (!currentSong) return;

        const isEditorOpen = !editorViewContainer.classList.contains('d-none');

        if (isEditorOpen) {
            // Close editor
            editorViewContainer.classList.add('d-none');
            btnEdit.classList.remove('active');
            // Reload content to ensure consistency
            await loadSongContent(currentSong);
        } else {
            // Open editor
            editorViewContainer.classList.remove('d-none');
            originalViewContainer.classList.remove('show');
            btnCompare.classList.remove('active');
            btnEdit.classList.add('active');

            // Initialize CodeMirror if needed
            initEditor();

            // Load ChordPro content
            const fileName = generateChordProFilename(currentSong);
            const filePath = `data/chordpro/${fileName}?v=${new Date().getTime()}`;

            try {
                const response = await fetch(filePath);
                if (response.ok) {
                    const content = await response.text();
                    editorInstance.setValue(content);
                } else {
                    // File doesn't exist, create template
                    editorInstance.setValue(`{title: ${currentSong.title}}\n{subtitle: ${currentSong.id}}\n\n(Escribe aquí la canción en formato ChordPro)`);
                }
            } catch (error) {
                console.error('Error loading for editor:', error);
                editorInstance.setValue(`Error: ${error.message}`);
            }

            // Refresh editor layout
            setTimeout(() => editorInstance.refresh(), 100);
        }
    });

    // Compare Button - Toggle Original View
    btnCompare.addEventListener('click', () => {
        if (!currentSong) return;

        const isCompareOpen = originalViewContainer.classList.contains('show');

        if (isCompareOpen) {
            // Close compare
            originalViewContainer.classList.remove('show');
            btnCompare.classList.remove('active');
        } else {
            // Open compare, close editor if open
            editorViewContainer.classList.add('d-none');
            btnEdit.classList.remove('active');

            originalViewContainer.classList.add('show');
            btnCompare.classList.add('active');
            renderOriginalHtml(currentSong);
        }
    });

    // Save Button - Save edited ChordPro
    btnSaveEditor.addEventListener('click', async () => {
        if (!currentSong || !editorInstance) return;

        const content = editorInstance.getValue();
        const filename = generateChordProFilename(currentSong);

        try {
            btnSaveEditor.disabled = true;
            btnSaveEditor.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Guardando...';

            const response = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: filename,
                    content: content
                })
            });

            if (response.ok) {
                // Success feedback
                btnSaveEditor.innerHTML = '<i class="bi bi-check-lg me-1"></i> Guardado';
                setTimeout(() => {
                    btnSaveEditor.disabled = false;
                    btnSaveEditor.innerHTML = '<i class="bi bi-save me-1"></i> Guardar';
                }, 1500);

                // Update rendered view
                lyricsContainer.innerHTML = parser.parseAndRender(content);
            } else {
                const result = await response.json();
                alert(`Error al guardar: ${result.error}`);
                btnSaveEditor.disabled = false;
                btnSaveEditor.innerHTML = '<i class="bi bi-save me-1"></i> Guardar';
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert(`Error de red al guardar: ${error.message}`);
            btnSaveEditor.disabled = false;
            btnSaveEditor.innerHTML = '<i class="bi bi-save me-1"></i> Guardar';
        }
    });

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
                    <button class="accordion-button collapsed d-flex justify-content-between align-items-center" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                        <span style="flex: 1;">${cat.title}</span>
                        <span class="badge bg-secondary rounded-pill me-3">${cat.songs.length}</span>
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${itemId}" data-bs-parent="#songsAccordion">
                    <div class="accordion-body p-0">
                        <div class="list-group list-group-flush">
                            ${cat.songs.map(song => `
                                <button class="list-group-item list-group-item-action ps-4 song-btn d-flex justify-content-between align-items-center" 
                                    data-index="${index}"
                                    data-song-id="${song.id}">
                                    <span class="song-title-text">
                                        <i class="bi bi-music-note me-2 text-muted"></i>${song.title}
                                    </span>
                                    <span class="text-muted small">[${song.id}]</span>
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

    // Select song function
    async function selectSong(song, buttonElement) {
        currentSong = song;

        // Update active state
        document.querySelectorAll('.song-btn').forEach(btn => btn.classList.remove('active'));
        if (buttonElement) {
            buttonElement.classList.add('active');
        } else {
            // If called programmatically, find the button and activate it
            const btn = document.querySelector(`.song-btn[data-song-id="${song.id}"]`);
            if (btn) btn.classList.add('active');
        }

        // Show toolbar and container, hide welcome
        welcomeMessage.classList.add('d-none');
        songContainer.classList.remove('d-none');
        songActions.classList.remove('d-none');

        // Reset compare view
        originalViewContainer.classList.remove('show');
        btnCompare.classList.remove('active');

        // Update player (BUT DO NOT AUTO PLAY)
        const encodedPath = song.path.split('/').map(part => encodeURIComponent(part)).join('/');
        if (audioPlayer.src !== window.location.origin + '/' + encodedPath && audioPlayer.src !== encodedPath) {
            audioPlayer.src = encodedPath;
        }
        playerTitle.textContent = song.title;

        // Load Content
        await loadSongContent(song);
    }

    async function loadSongContent(song) {
        // 1. Load ChordPro Content
        lyricsContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary"></div></div>';

        const fileName = generateChordProFilename(song);
        const filePath = `data/chordpro/${fileName}?v=${new Date().getTime()}`; // Cache busting

        try {
            const response = await fetch(filePath);
            if (response.ok) {
                const chordproContent = await response.text();
                lyricsContainer.innerHTML = parser.parseAndRender(chordproContent);
            } else {
                lyricsContainer.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        No se encontró la versión ChordPro. 
                        <br><small>Ejecuta el script de conversión para generar este archivo.</small>
                    </div>`;
            }
        } catch (error) {
            console.error('Error loading ChordPro:', error);
            lyricsContainer.innerHTML = `<div class="alert alert-danger">Error cargando la canción: ${error.message}</div>`;
        }

        // 2. Load Original HTML (for comparison view)
        renderOriginalHtml(song);
    }

    async function renderOriginalHtml(song) {
        // Determinar la carpeta base según el ID de la canción
        const songId = parseInt(song.id);
        let folder = '';

        if (songId >= 1 && songId <= 299) {
            folder = 'Letra_Alabare_II';
        } else if (songId >= 301 && songId <= 575) {
            folder = 'Letra_Alabare_III';
        } else {
            // Fallback al contenido en songs_data.js si el ID está fuera de rango
            if (!song.lyricsContent) {
                originalLyricsContent.innerHTML = '<div class="alert alert-warning">Letra original no disponible.</div>';
                return;
            }
            const parser = new DOMParser();
            const doc = parser.parseFromString(song.lyricsContent, 'text/html');
            const firstDt = doc.querySelector('dt');
            if (firstDt) firstDt.remove();
            originalLyricsContent.innerHTML = `
                <div class="lyrics-container">
                    <h2 class="display-6 mb-2 text-center">${song.title}</h2>
                    <div class="lyrics-content">
                        ${doc.body.innerHTML}
                    </div>
                </div>
            `;
            return;
        }

        // Construir el nombre del archivo basado en el ID y título
        const fileName = generateOriginalFilename(song);
        const filePath = `${folder}/${fileName}`;

        try {
            originalLyricsContent.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary"></div></div>';

            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`No se pudo cargar el archivo: ${response.status}`);
            }

            const htmlContent = await response.text();

            // Parse and clean HTML (remove first title)
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            const firstDt = doc.querySelector('dt');
            if (firstDt) firstDt.remove();

            originalLyricsContent.innerHTML = `
                <div class="lyrics-container">
                    <h2 class="display-6 mb-2 text-center">${song.title}</h2>
                    <div class="lyrics-content">
                        ${doc.body.innerHTML}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading original HTML:', error);
            // Fallback al contenido en songs_data.js
            if (song.lyricsContent) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(song.lyricsContent, 'text/html');
                const firstDt = doc.querySelector('dt');
                if (firstDt) firstDt.remove();
                originalLyricsContent.innerHTML = `
                    <div class="lyrics-container">
                        <h2 class="display-6 mb-2 text-center">${song.title}</h2>
                        <div class="lyrics-content">
                            ${doc.body.innerHTML}
                        </div>
                    </div>
                `;
            } else {
                originalLyricsContent.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        No se pudo cargar el archivo original.
                        <br><small>Ruta: ${filePath}</small>
                    </div>`;
            }
        }
    }

    function generateOriginalFilename(song) {
        // Normalizar el título para coincidir con el patrón de nombres de archivo
        const title = song.title
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
            .trim()
            .replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos
        // Formato: {id}_{titulo}.htm
        return `${song.id.padStart(3, '0')}_${title}.htm`;
    }

    function generateChordProFilename(song) {
        const title = song.title
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove diacritics (accents)
            .replace(/ñ/g, 'n')
            .replace(/Ñ/g, 'N')
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/[-\s]+/g, '_')
            .toLowerCase();
        return `${song.id}_${title}.cho`;
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();

        if (!term) {
            renderCategories(songsData);
            return;
        }

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
