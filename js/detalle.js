document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    const loadingMsg = document.getElementById('loading-msg');
    const errorMsg = document.getElementById('error-msg');
    const contentDiv = document.getElementById('detalle-content');

    if (!id || typeof propertiesData === 'undefined') {
        loadingMsg.style.display = 'none';
        errorMsg.style.display = 'block';
        return;
    }

    const prop = propertiesData.find(p => p.id == id);

    if (!prop) {
        loadingMsg.style.display = 'none';
        errorMsg.style.display = 'block';
        return;
    }

    // Populate Data
    document.title = `${prop.titulo} - Detalle`;
    document.getElementById('detail-title').innerText = prop.titulo;
    document.getElementById('detail-address').innerText = prop.direccion || prop.ciudades || '';
    document.getElementById('detail-price').innerText = prop.precio || 'Consultar';

    // Badge logic
    const status = prop.estados ? prop.estados[0] : '';
    const type = prop.tipos ? prop.tipos[0] : 'Propiedad';
    const badgeText = status || type;
    const badgeEl = document.getElementById('detail-badge');
    badgeEl.innerText = badgeText;
    if (status.toLowerCase().includes('venta')) {
        badgeEl.style.backgroundColor = 'var(--primary)';
    } else {
        badgeEl.style.backgroundColor = 'var(--secondary)';
    }

    // Features
    const featuresContainer = document.getElementById('detail-features');
    let featuresHtml = '';

    // Basic fields
    if (prop.dormitorios) featuresHtml += `<div class="feature-item"><i class="fas fa-bed"></i> ${prop.dormitorios} Dormitorios</div>`;
    if (prop.banos) featuresHtml += `<div class="feature-item"><i class="fas fa-bath"></i> ${prop.banos} Baños</div>`;
    if (prop.garajes) featuresHtml += `<div class="feature-item"><i class="fas fa-car"></i> ${prop.garajes} Garajes</div>`;
    if (prop.superficie_m2 || prop.superficie) featuresHtml += `<div class="feature-item"><i class="fas fa-ruler-combined"></i> ${prop.superficie_m2 || prop.superficie} m²</div>`;

    // Extra features array
    if (prop.caracteristicas && prop.caracteristicas.length > 0) {
        prop.caracteristicas.forEach(char => {
            featuresHtml += `<div class="feature-item"><i class="fas fa-check"></i> ${char}</div>`;
        });
    }
    featuresContainer.innerHTML = featuresHtml;

    // Description
    const descEl = document.getElementById('detail-description');
    // Si la descripción existe, usarla. Si no, usar el fallback pero más limpio
    if (prop.descripcion && prop.descripcion.trim().length > 10) {
        descEl.innerText = prop.descripcion;
    } else {
        descEl.innerText = `Excelente propiedad ubicada en ${prop.direccion || prop.ciudades || 'la zona'}. Contáctenos para más información.`;
    }

    // Media Strip
    const track = document.getElementById('media-track');
    const container = document.getElementById('media-strip');
    let images = [];

    // Collect all images
    if (prop.imagenes && prop.imagenes.length > 0) {
        images = prop.imagenes.map(img => img.url);
    } else if (prop.imagen) {
        images = [prop.imagen];
    }

    // Ensure minimum 2 images
    while (images.length < 2) {
        images.push('img/img_no_disp.png');
    }

    // Duplicate content 4 times for lengthy scroll
    let displayImages = [...images, ...images, ...images, ...images];

    track.innerHTML = displayImages.map((url, index) => `
        <div class="media-strip-item" onclick="openLightbox(${index % images.length})">
            <img src="${url}" alt="Foto propiedad">
        </div>
    `).join('');

    // Advanced Scroll Logic
    let baseSpeed = 1;
    let currentSpeed = baseSpeed;
    let autoScrollInterval;

    function startAutoScroll() {
        if (autoScrollInterval) clearInterval(autoScrollInterval);
        autoScrollInterval = setInterval(() => {
            if (container) {
                container.scrollLeft += currentSpeed;

                // Infinite Loop fix (approximate)
                // When moving right (speed > 0), check if near end.
                if (currentSpeed > 0 && container.scrollLeft >= (container.scrollWidth - container.clientWidth)) {
                    container.scrollLeft = 0;
                }
                // When moving left (speed < 0), check if near start.
                else if (currentSpeed < 0 && container.scrollLeft <= 0) {
                    container.scrollLeft = container.scrollWidth - container.clientWidth;
                }
            }
        }, 20);
    }

    startAutoScroll();

    // Mouse Interaction
    if (container) {
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            const pct = x / width;

            // Mouse Zones for Acceleration:
            // 0 - 0.15 : Fast Left (-6) (Reverse)
            // 0.15 - 0.30 : Slow Left (-3)
            // 0.30 - 0.70 : Normal Right (1)
            // 0.70 - 0.85 : Slow Right (3) (Accelerated Forward)
            // 0.85 - 1.0 : Fast Right (6)

            if (pct > 0.85) {
                currentSpeed = 6;
            } else if (pct > 0.70) {
                currentSpeed = 3;
            } else if (pct < 0.15) {
                currentSpeed = -6;
            } else if (pct < 0.30) {
                currentSpeed = -3;
            } else {
                currentSpeed = baseSpeed;
            }
        });

        container.addEventListener('mouseleave', () => {
            currentSpeed = baseSpeed;
        });

        // Touch Interaction (Pause on touch)
        container.addEventListener('touchstart', () => currentSpeed = 0);
        container.addEventListener('touchend', () => currentSpeed = baseSpeed);
    }

    // Keyboard Support for Lightbox
    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('lightbox');
        // Check if lightbox is open (has 'show' class or display flex)
        if (lightbox && lightbox.style.display === 'flex') {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextLightboxImage();
            if (e.key === 'ArrowLeft') prevLightboxImage();
        }
    });

    // Map
    const mapContainer = document.getElementById('map-container');
    let lat = null, lng = null;
    if (prop.coordenadas) {
        const parts = prop.coordenadas.split(',');
        lat = parts[0];
        lng = parts[1];
    } else if (prop.lat && prop.lng) {
        lat = prop.lat;
        lng = prop.lng;
    }

    if (lat && lng) {
        // Tabbed Map Interface
        mapContainer.innerHTML = `
            <div style="display:flex; background:#f1f1f1; border-bottom:1px solid #ddd;">
                <button onclick="switchDetailMap('map')" id="btn-map" style="flex:1; padding:10px; border:none; background:white; font-weight:bold; cursor:pointer;">Mapa</button>
                <button onclick="switchDetailMap('sv')" id="btn-sv" style="flex:1; padding:10px; border:none; background:#f1f1f1; color:#666; cursor:pointer;">Street View</button>
            </div>
            <div style="position:relative; height:calc(100% - 40px); width:100%;">
                <div id="view-map" style="width:100%; height:100%; display:block;">
                    <iframe width="100%" height="100%" frameborder="0" style="border:0" 
                        src="https://maps.google.com/maps?q=${lat},${lng}&hl=es&z=15&output=embed">
                    </iframe>
                </div>
                <div id="view-sv" style="width:100%; height:100%; display:none;">
                    <iframe width="100%" height="100%" frameborder="0" style="border:0" 
                        src="https://maps.google.com/maps?q=${lat},${lng}&layer=c&cbll=${lat},${lng}&cbp=12,0,0,0,0&output=svembed">
                    </iframe>
                </div>
            </div>
        `;

        // Expose switcher
        window.switchDetailMap = function (type) {
            const btnMap = document.getElementById('btn-map');
            const btnSv = document.getElementById('btn-sv');
            const viewMap = document.getElementById('view-map');
            const viewSv = document.getElementById('view-sv');

            if (type === 'map') {
                viewMap.style.display = 'block';
                viewSv.style.display = 'none';
                btnMap.style.background = 'white';
                btnMap.style.fontWeight = 'bold';
                btnMap.style.color = 'black';
                btnSv.style.background = '#f1f1f1';
                btnSv.style.fontWeight = 'normal';
                btnSv.style.color = '#666';
            } else {
                viewMap.style.display = 'none';
                viewSv.style.display = 'block';
                btnSv.style.background = 'white';
                btnSv.style.fontWeight = 'bold';
                btnSv.style.color = 'black';
                btnMap.style.background = '#f1f1f1';
                btnMap.style.fontWeight = 'normal';
                btnMap.style.color = '#666';
            }
        };

    } else {
        mapContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;">Ubicación no disponible en mapa</div>';
    }

    // WhatsApp Button
    const btnWa = document.getElementById('btn-whatsapp');
    const currentUrl = window.location.href;
    const msg = encodeURIComponent(`Hola, estoy interesado en la propiedad: ${prop.titulo} (ID: ${prop.id}). \nEnlace: ${currentUrl}`);
    btnWa.href = `https://wa.me/5493456495561?text=${msg}`;

    // Show Content
    loadingMsg.style.display = 'none';
    contentDiv.style.display = 'block';

    window.lightboxImages = images;

});

let currentLightboxIndex = 0;

function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const images = window.lightboxImages || [];

    if (images.length === 0) return;

    currentLightboxIndex = index;
    // Fix: Handle placeholder url if present
    img.src = images[currentLightboxIndex];

    lightbox.style.display = 'flex';
    setTimeout(() => lightbox.classList.add('show'), 10);
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('show');
    setTimeout(() => lightbox.style.display = 'none', 300);
}

function nextLightboxImage() {
    const images = window.lightboxImages || [];
    currentLightboxIndex = (currentLightboxIndex + 1) % images.length;
    document.getElementById('lightbox-img').src = images[currentLightboxIndex];
}

function prevLightboxImage() {
    const images = window.lightboxImages || [];
    currentLightboxIndex = (currentLightboxIndex - 1 + images.length) % images.length;
    document.getElementById('lightbox-img').src = images[currentLightboxIndex];
}

document.addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
});
