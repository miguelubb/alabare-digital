// Sidebar resize and toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const resizeHandle = document.getElementById('resizeHandle');
    const toggleBtn = document.getElementById('toggleSidebar');
    const showBtn = document.getElementById('showSidebar');

    let isResizing = false;

    // Resize functionality
    if (resizeHandle) {
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const newWidth = e.clientX;
            if (newWidth >= 200 && newWidth <= 600) {
                sidebar.style.width = newWidth + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        });
    }

    // Toggle functionality
    if (toggleBtn && showBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.add('hidden');
            showBtn.style.display = 'block';
        });

        showBtn.addEventListener('click', () => {
            sidebar.classList.remove('hidden');
            showBtn.style.display = 'none';
        });
    }
});
