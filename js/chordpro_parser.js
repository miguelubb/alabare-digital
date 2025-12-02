/**
 * ChordPro Parser - Convierte formato ChordPro a HTML
 * 
 * Formato ChordPro:
 * - Directivas: {title: ...}, {subtitle: ...}, {key: ...}
 * - Acordes: [Am]Letra [G]más letra
 * - Secciones: {start_of_chorus}, {end_of_chorus}
 * 
 * @module chordpro_parser
 */

class ChordProParser {
    constructor() {
        this.metadata = {};
    }

    /**
     * Parsea contenido ChordPro completo
     * @param {string} content - Contenido del archivo .cho
     * @returns {object} - { metadata, html }
     */
    parse(content) {
        const lines = content.split('\n');
        this.metadata = {};
        let htmlLines = [];
        let inChorus = false;
        let inVerse = false;

        for (let line of lines) {
            line = line.trim();

            // Directivas de metadata
            if (line.startsWith('{') && line.endsWith('}')) {
                this.parseDirective(line);
                continue;
            }

            // Línea vacía
            if (!line) {
                htmlLines.push('<div class="song-spacer"></div>');
                continue;
            }

            // Líneas con acordes
            if (line.includes('[')) {
                htmlLines.push(this.parseChordLine(line));
            } else {
                // Línea de solo letra
                htmlLines.push(`<div class="lyrics-line">${this.escapeHtml(line)}</div>`);
            }
        }

        return {
            metadata: this.metadata,
            html: htmlLines.join('\n')
        };
    }

    /**
     * Parsea directivas ChordPro como {title: ...}
     * @param {string} line - Línea con directiva
     */
    parseDirective(line) {
        // Remover llaves
        const content = line.slice(1, -1).trim();

        // Separar directiva de valor
        const colonIndex = content.indexOf(':');
        if (colonIndex === -1) return;

        const directive = content.slice(0, colonIndex).trim();
        const value = content.slice(colonIndex + 1).trim();

        // Almacenar metadata
        switch (directive) {
            case 'title':
            case 't':
                this.metadata.title = value;
                break;
            case 'subtitle':
            case 'st':
                if (!this.metadata.subtitles) this.metadata.subtitles = [];
                this.metadata.subtitles.push(value);
                break;
            case 'key':
                this.metadata.key = value;
                break;
            case 'tempo':
                this.metadata.tempo = value;
                break;
            case 'meta':
                if (!this.metadata.meta) this.metadata.meta = {};
                const [metaKey, ...metaValueParts] = value.split(' ');
                this.metadata.meta[metaKey] = metaValueParts.join(' ');
                break;
        }
    }

    /**
     * Parsea una línea con acordes y letra
     * Ejemplo: "[Am]Letra de la [G]canción"
     * 
     * @param {string} line - Línea con acordes en formato [Acorde]
     * @returns {string} - HTML con acordes superpuestos
     */
    parseChordLine(line) {
        const parts = [];
        let currentPos = 0;
        const chordRegex = /\[([^\]]+)\]/g;
        let match;
        let lastIndex = 0;

        // Encontrar todos los acordes y sus posiciones
        const chords = [];
        while ((match = chordRegex.exec(line)) !== null) {
            chords.push({
                chord: match[1],
                position: match.index,
                length: match[0].length
            });
        }

        if (chords.length === 0) {
            return `<div class="lyrics-line">${this.escapeHtml(line)}</div>`;
        }

        // Remover acordes de la línea para obtener solo letra
        let lyricsOnly = line;
        for (let i = chords.length - 1; i >= 0; i--) {
            const chord = chords[i];
            lyricsOnly = lyricsOnly.slice(0, chord.position) +
                lyricsOnly.slice(chord.position + chord.length);
        }

        // Construir HTML con acordes posicionados
        let html = '<div class="chord-line-container">';
        html += '<div class="chords-row">';

        // Generar spans con acordes en posiciones correctas
        let charCount = 0;
        for (let i = 0; i < chords.length; i++) {
            const chord = chords[i];
            // Ajustar posición considerando acordes previos removidos
            let adjustedPos = chord.position;
            for (let j = 0; j < i; j++) {
                adjustedPos -= chords[j].length;
            }

            // Espacios antes del acorde
            const spaceBefore = adjustedPos - charCount;
            if (spaceBefore > 0) {
                html += '<span class="chord-spacer">' + '&nbsp;'.repeat(spaceBefore) + '</span>';
            }

            // El acorde
            html += `<span class="chord">${this.escapeHtml(chord.chord)}</span>`;
            charCount = adjustedPos + 1;
        }

        html += '</div>';
        html += `<div class="lyrics-row">${this.escapeHtml(lyricsOnly)}</div>`;
        html += '</div>';

        return html;
    }

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Renderiza metadata como HTML
     * @returns {string}
     */
    renderMetadata() {
        let html = '';

        if (this.metadata.title) {
            html += `<h2 class="song-title">${this.escapeHtml(this.metadata.title)}</h2>`;
        }

        if (this.metadata.subtitles) {
            for (const subtitle of this.metadata.subtitles) {
                html += `<p class="song-subtitle text-muted fst-italic">${this.escapeHtml(subtitle)}</p>`;
            }
        }

        if (this.metadata.key || this.metadata.tempo) {
            html += '<div class="song-metadata">';
            if (this.metadata.key) {
                html += `<span class="badge bg-info me-2">Tono: ${this.escapeHtml(this.metadata.key)}</span>`;
            }
            if (this.metadata.tempo) {
                html += `<span class="badge bg-secondary">Ritmo: ${this.escapeHtml(this.metadata.tempo)}</span>`;
            }
            html += '</div>';
        }

        return html;
    }

    /**
     * Parsea y renderiza todo (wrapper completo)
     * @param {string} content - Contenido ChordPro
     * @returns {string} - HTML completo con metadata y letra
     */
    parseAndRender(content) {
        const parsed = this.parse(content);
        let html = '<div class="chordpro-song">';
        html += this.renderMetadata();
        html += '<div class="song-content">';
        html += parsed.html;
        html += '</div>';
        html += '</div>';
        return html;
    }
}

// Export para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChordProParser;
}
