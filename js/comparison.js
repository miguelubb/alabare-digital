/**
 * Comparison Page Logic
 * Maneja la comparación lado a lado de HTML vs ChordPro
 */

document.addEventListener('DOMContentLoaded', async () => {
    const songSelector = document.getElementById('songSelector');
    const htmlPreview = document.getElementById('htmlPreview');
    const chordproPreview = document.getElementById('chordproPreview');
    const conversionStatus = document.getElementById('conversionStatus');
    const songCount = document.getElementById('songCount');
    const convertMoreBtn = document.getElementById('convertMoreBtn');

    const parser = new ChordProParser();
    const convertedSongs = new Set();

    // Cargar lista de archivos ChordPro convertidos
    await loadConvertedSongs();

    // Poblar selector con todas las canciones
    populateSongSelector();

    // Event listener para cambio de selección
    songSelector.addEventListener('change', async () => {
        const songId = songSelector.value;
        if (songId) {
            await loadComparison(songId);
        }
    });

    /**
     * Carga la lista de canciones ya convertidas a ChordPro
     */
    async function loadConvertedSongs() {
        try {
            // Intentar obtener la lista de archivos .cho del directorio
            // Nota: Esto requiere un endpoint del servidor o listar estáticamente
            // Por ahora, asumimos las 5 canciones convertidas
            const testSongs = ['414', '203', '535', '240', '505'];
            testSongs.forEach(id => convertedSongs.add(id));

            songCount.textContent = convertedSongs.size;
        } catch (error) {
            console.error('Error cargando canciones convertidas:', error);
        }
    }

    /**
     * Puebla el selector con todas las canciones disponibles
     */
    function populateSongSelector() {
        if (typeof songsData === 'undefined') {
            console.error('songsData no está definido');
            return;
        }

        const optgroup = document.createElement('optgroup');
        optgroup.label = 'Canciones Convertidas';

        let addedCount = 0;

        songsData.forEach(category => {
            category.songs.forEach(song => {
                // Solo mostrar canciones que están convertidas
                if (convertedSongs.has(song.id)) {
                    const option = document.createElement('option');
                    option.value = song.id;
                    option.textContent = `[${song.id}] ${song.title}`;
                    optgroup.appendChild(option);
                    addedCount++;
                }
            });
        });

        if (addedCount > 0) {
            songSelector.appendChild(optgroup);
        }

        // Agregar opciones para canciones no convertidas
        const notConvertedGroup = document.createElement('optgroup');
        notConvertedGroup.label = 'Pendientes de Conversión (muestran solo HTML)';

        songsData.forEach(category => {
            category.songs.forEach(song => {
                if (!convertedSongs.has(song.id) && song.lyricsContent) {
                    const option = document.createElement('option');
                    option.value = song.id;
                    option.textContent = `[${song.id}] ${song.title} (⚠️ solo HTML)`;
                    option.setAttribute('data-not-converted', 'true');
                    notConvertedGroup.appendChild(option);
                }
            });
        });

        songSelector.appendChild(notConvertedGroup);
    }

    /**
     * Carga y muestra la comparación para una canción específica
     */
    async function loadComparison(songId) {
        conversionStatus.textContent = 'Cargando...';

        try {
            // Encontrar canción en los datos
            const song = findSongById(songId);

            if (!song) {
                showError('No se encontró la canción');
                return;
            }

            // Mostrar HTML original
            displayHtml(song);

            // Intentar cargar y mostrar ChordPro
            if (convertedSongs.has(songId)) {
                await displayChordPro(song);
                conversionStatus.innerHTML = `
                    <span class="diff-indicator same"></span>
                    Conversión exitosa
                `;
            } else {
                chordproPreview.innerHTML = `
                    <div class="alert alert-warning m-4">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong>Esta canción aún no ha sido convertida</strong>
                        <p class="mb-0 mt-2">Ejecuta el script de conversión para ver la comparación.</p>
                        <pre class="mt-2 bg-light p-2 rounded"><code>python Scripts/html_to_chordpro.py --song-id ${songId}</code></pre>
                    </div>
                `;
                conversionStatus.innerHTML = `
                    <span class="diff-indicator different"></span>
                    Pendiente de conversión
                `;
            }

        } catch (error) {
            console.error('Error cargando comparación:', error);
            showError(`Error: ${error.message}`);
        }
    }

    /**
     * Muestra el HTML original de la canción
     */
    async function displayHtml(song) {
        try {
            // Generar nombre de archivo HTML
            const htmlFileName = generateHtmlFilename(song);

            // Hacer petición al servidor para obtener el HTML original
            const response = await fetch(`/api/compare?filename=${encodeURIComponent(htmlFileName)}`);

            if (!response.ok) {
                throw new Error(`No se pudo cargar el archivo HTML original: ${response.statusText}`);
            }

            const htmlContent = await response.text();

            // Parsear y limpiar HTML (quitar título duplicado)
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;

            // Remover el primer título si existe
            const firstDt = tempDiv.querySelector('dt');
            if (firstDt) {
                firstDt.remove();
            }

            htmlPreview.innerHTML = `
                <div class="lyrics-container">
                    <p class="text-center text-muted mb-2">Canción ${song.id}</p>
                    <h2 class="display-6 mb-2 text-center">${song.title}</h2>
                    <div class="lyrics-content">
                        ${tempDiv.innerHTML}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error cargando HTML original:', error);
            htmlPreview.innerHTML = `
                <div class="alert alert-danger m-4">
                    <i class="bi bi-x-circle me-2"></i>
                    <strong>Error al cargar HTML original</strong>
                    <p class="mb-0 mt-2">${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * Genera el nombre de archivo HTML para una canción
     */
    function generateHtmlFilename(song) {
        // Normalizar el título para coincidir con el patrón de nombres de archivo
        const title = song.title
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
            .trim()
            .replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos

        // Formato: {id}_{titulo}.htm con ID de 3 dígitos
        return `${song.id.padStart(3, '0')}_${title}.htm`;
    }

    /**
     * Carga y muestra la versión ChordPro convertida
     */
    async function displayChordPro(song) {
        const fileName = generateChordProFilename(song);
        const filePath = `data/chordpro/${fileName}`;

        try {
            const response = await fetch(filePath);

            if (!response.ok) {
                throw new Error(`No se pudo cargar: ${response.statusText}`);
            }

            const chordproContent = await response.text();
            const renderedHtml = parser.parseAndRender(chordproContent);

            chordproPreview.innerHTML = `
                <div class="lyrics-container">
                    ${renderedHtml}
                </div>
            `;

        } catch (error) {
            console.error('Error cargando ChordPro:', error);
            chordproPreview.innerHTML = `
                <div class="alert alert-danger m-4">
                    <i class="bi bi-x-circle me-2"></i>
                    <strong>Error al cargar archivo ChordPro</strong>
                    <p class="mb-0 mt-2">${error.message}</p>
                    <p class="mb-0 mt-1 small">Ruta: ${filePath}</p>
                </div>
            `;
        }
    }

    /**
     * Genera el nombre de archivo ChordPro para una canción
     */
    function generateChordProFilename(song) {
        const title = song.title
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/[-\s]+/g, '_');
        return `${song.id}_${title}.cho`;
    }

    /**
     * Busca una canción por ID en songsData
     */
    function findSongById(songId) {
        for (const category of songsData) {
            for (const song of category.songs) {
                if (song.id === songId) {
                    return song;
                }
            }
        }
        return null;
    }

    /**
     * Muestra un mensaje de error
     */
    function showError(message) {
        conversionStatus.innerHTML = `
            <span class="diff-indicator different"></span>
            ${message}
        `;

        htmlPreview.innerHTML = `
            <div class="alert alert-danger m-4">
                <i class="bi bi-x-circle me-2"></i>
                ${message}
            </div>
        `;

        chordproPreview.innerHTML = htmlPreview.innerHTML;
    }

    // Botón para convertir más canciones
    convertMoreBtn.addEventListener('click', () => {
        const instructions = `
Para convertir más canciones, ejecuta en la terminal:

Convertir una canción específica:
  python Scripts/html_to_chordpro.py --song-id 414

Convertir las primeras 20:
  python Scripts/html_to_chordpro.py --batch --limit 20

Convertir todas:
  python Scripts/html_to_chordpro.py --batch
        `.trim();

        alert(instructions);
    });
});
