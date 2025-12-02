/**
 * Editor Logic
 * Maneja la edición de ChordPro con CodeMirror y preview en tiempo real
 */

document.addEventListener('DOMContentLoaded', async () => {
    const songSelector = document.getElementById('songSelector');
    const previewContent = document.getElementById('previewContent');
    const saveBtn = document.getElementById('saveBtn');

    // Inicializar Parser
    const parser = new ChordProParser();

    // Inicializar CodeMirror
    const editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
        mode: 'markdown', // Usamos markdown como base para el resaltado
        theme: 'monokai',
        lineNumbers: true,
        lineWrapping: true,
        autofocus: true
    });

    // Evento de cambio en el editor para actualizar preview
    editor.on('change', () => {
        updatePreview();
    });

    // Cargar lista de canciones
    await populateSongSelector();

    // Evento de selección de canción
    songSelector.addEventListener('change', async () => {
        const songId = songSelector.value;
        if (songId) {
            await loadSong(songId);
        }
    });

    // Cargar canción desde URL si existe
    const urlParams = new URLSearchParams(window.location.search);
    const urlSongId = urlParams.get('songId');
    if (urlSongId) {
        // Establecer valor en selector (si existe en la lista)
        // Nota: Si la lista se carga asíncronamente, esto podría necesitar esperar
        // Pero populateSongSelector es await, así que debería estar listo
        songSelector.value = urlSongId;
        await loadSong(urlSongId);

        // Ocultar selector para modo "edición directa" si se prefiere
        // document.querySelector('.card-header').style.display = 'none';
    }

    // Evento Guardar
    saveBtn.addEventListener('click', async () => {
        const content = editor.getValue();
        const songId = songSelector.value;

        if (!songId) {
            alert('Por favor selecciona una canción primero.');
            return;
        }

        // Obtener nombre de archivo
        const song = findSongById(songId);
        const filename = generateChordProFilename(song);

        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Guardando...';

            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: filename,
                    content: content
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert('¡Canción guardada correctamente!');
            } else {
                throw new Error(result.error || 'Error desconocido al guardar');
            }

        } catch (error) {
            console.error('Error al guardar:', error);
            alert(`Error al guardar: ${error.message}`);
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-save me-1"></i> Guardar';
        }
    });

    /**
     * Actualiza el panel de vista previa
     */
    function updatePreview() {
        const content = editor.getValue();

        if (!content.trim()) {
            previewContent.innerHTML = `
                <div class="text-center text-muted mt-5">
                    <i class="bi bi-music-note-beamed display-4 opacity-25"></i>
                    <p class="mt-3">Escribe código ChordPro para ver el resultado</p>
                </div>
            `;
            return;
        }

        try {
            const html = parser.parseAndRender(content);
            previewContent.innerHTML = html;
        } catch (error) {
            previewContent.innerHTML = `
                <div class="alert alert-danger">
                    Error de renderizado: ${error.message}
                </div>
            `;
        }
    }

    /**
     * Carga la lista de canciones en el selector
     */
    async function populateSongSelector() {
        // Intentar cargar lista de archivos convertidos (simulado por ahora)
        // En una implementación real, esto vendría de una API que lista archivos .cho
        const convertedIds = ['414', '203', '535', '240', '505'];

        if (typeof songsData === 'undefined') {
            console.error('songsData no está definido');
            return;
        }

        const optgroup = document.createElement('optgroup');
        optgroup.label = 'Canciones Disponibles (.cho)';

        songsData.forEach(category => {
            category.songs.forEach(song => {
                if (convertedIds.includes(song.id)) {
                    const option = document.createElement('option');
                    option.value = song.id;
                    option.textContent = `[${song.id}] ${song.title}`;
                    optgroup.appendChild(option);
                }
            });
        });

        songSelector.appendChild(optgroup);
    }

    /**
     * Carga el contenido de una canción en el editor
     */
    async function loadSong(songId) {
        // Buscar título para el nombre del archivo
        const song = findSongById(songId);
        if (!song) return;

        const fileName = generateChordProFilename(song);
        const filePath = `data/chordpro/${fileName}`;

        try {
            // Mostrar estado de carga
            editor.setValue('Cargando...');

            // Agregar timestamp para evitar caché del navegador
            const response = await fetch(`${filePath}?t=${Date.now()}`);
            if (!response.ok) throw new Error('No se pudo cargar el archivo');

            const content = await response.text();

            // Establecer contenido en el editor
            editor.setValue(content);

            // Limpiar historial de deshacer para que no se pueda deshacer la carga inicial
            editor.clearHistory();

        } catch (error) {
            console.error('Error cargando canción:', error);
            editor.setValue(`Error al cargar el archivo: ${error.message}`);
        }
    }

    // Helpers reutilizados de comparison.js
    function findSongById(songId) {
        for (const category of songsData) {
            for (const song of category.songs) {
                if (song.id === songId) return song;
            }
        }
        return null;
    }

    function generateChordProFilename(song) {
        const title = song.title
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/[-\s]+/g, '_');
        return `${song.id}_${title}.cho`;
    }
});
