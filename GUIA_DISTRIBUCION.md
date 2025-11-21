# 📱 Guía de Distribución - Alabaré Multimedia PWA

## 🌟 ¿Qué es una PWA?

Esta aplicación es una **Progressive Web App (PWA)**, lo que significa que funciona como una aplicación nativa en cualquier dispositivo (iPad, iPhone, Android, tabletas, etc.) sin necesidad de las tiendas de aplicaciones (App Store/Play Store).

## 📦 Opciones de Distribución

### Opción 1: Hosting Web (RECOMENDADO) 🚀

Esta es la forma más fácil y profesional:

#### Paso 1: Subir a un servicio de hosting gratuito

Opciones gratuitas y fáciles:

**A) GitHub Pages (Recomendado)**
1. Crea una cuenta gratuita en [github.com](https://github.com)
2. Crea un nuevo repositorio público
3. Sube todo el contenido de la carpeta `alabare-dist`
4. Activa GitHub Pages en Settings → Pages
5. Tu sitio estará en: `https://tuusuario.github.io/nombre-repo`

**B) Netlify**
1. Crea una cuenta en [netlify.com](https://www.netlify.com/)
2. Arrastra la carpeta `alabare-dist` al navegador
3. ¡Listo! Tendrás una URL como `https://alabare-12345.netlify.app`

**C) Vercel**
- Similar a Netlify: [vercel.com](https://vercel.com/)

#### Paso 2: Instalar en dispositivos móviles

**En iPad/iPhone (iOS):**
1. Abre Safari y ve a la URL de tu sitio
2. Toca el botón "Compartir" (cuadrado con flecha arriba)
3. Selecciona "Agregar a pantalla de inicio"
4. ¡Listo! Aparecerá un ícono como una app normal

**En Android:**
1. Abre Chrome y ve a la URL de tu sitio
2. Chrome mostrará automáticamente "Agregar Alabaré a pantalla de inicio"
3. O toca el menú (⋮) → "Agregar a pantalla de inicio"
4. ¡Listo!

**Características después de instalar:**
- ✅ Ícono en la pantalla de inicio
- ✅ Se abre a pantalla completa (sin barra del navegador)
- ✅ Funciona offline después de la primera visita
- ✅ Parece una app nativa

---

### Opción 2: Archivo ZIP para distribución manual

Si prefieres distribuir directamente sin hosting:

#### Paso 1: Crear el archivo
```bash
# Comprimir la carpeta alabare-dist
Compress-Archive -Path alabare-dist\* -DestinationPath Alabare-Multimedia.zip
```

#### Paso 2: En dispositivos

**Android:**
1. Copia el ZIP al dispositivo
2. Descomprime usando "Files" o "ZArchiver"
3. Abre `index.html` con Chrome
4. **Limitación**: No se puede instalar como PWA desde archivos locales

**iPad/iOS:**
- ⚠️ **NO funciona**: iOS no permite abrir archivos HTML locales por seguridad
- **Debes usar la Opción 1 (hosting web)**

---

### Opción 3: Aplicación nativa real (Avanzado)

Para crear una app real para App Store/Play Store:

**Usando Capacitor** (gratuito):
```bash
# Instalar Capacitor
npm install -g @capacitor/cli
cd alabare-dist
capacitor init
capacitor add ios
capacitor add android
```

Luego compilar con Xcode (iOS) o Android Studio (Android).

**Costo**: Publicar requiere:
- App Store: $99/año (cuenta de desarrollador Apple)
- Play Store: $25 una sola vez

---

## 🎯 Recomendación Final

**Para empezar: Usa la Opción 1 (GitHub Pages o Netlify)**

Ventajas:
- ✅ Gratis y fácil
- ✅ Funciona en TODOS los dispositivos (iOS, Android, PC, tablets)
- ✅ No requiere App Store/Play Store
- ✅ Actualizaciones instantáneas (solo cambias el código en el servidor)
- ✅ Se instala como app real
- ✅ Funciona offline
- ✅ No hay límites de descargas

---

## 📝 Archivos PWA Incluidos

- `manifest.json` - Configuración de la PWA
- `sw.js` - Service Worker para funcionamiento offline
- `icon-192.png` y `icon-512.png` - Íconos de la aplicación
- Actualizaciones en `index.html` para soporte PWA

---

## 🆘 Soporte

Si tienes problemas:
1. Asegúrate de que el sitio esté en **HTTPS** (GitHub Pages y Netlify lo proveen automáticamente)
2. Los PWAs requieren HTTPS (excepto en localhost para pruebas)
3. Limpia la caché del navegador si hay problemas de actualización

---

© 2025 Miguel Romero Vásquez
