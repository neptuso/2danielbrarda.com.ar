
document.addEventListener('DOMContentLoaded', () => {
    // Referencia al contenedor
    const gridContainer = document.getElementById('todas-propiedades-grid');
    const resultsCount = document.getElementById('resultados-count');
    const noResults = document.getElementById('no-results');

    // Referencias a filtros
    const filtroOperacion = document.getElementById('filtro-operacion');
    const filtroTipo = document.getElementById('filtro-tipo');
    const filtroCiudad = document.getElementById('filtro-ciudad');
    const filtroTexto = document.getElementById('filtro-texto');
    const btnBuscar = document.getElementById('btn-buscar');

    let allProperties = [];
    let map = null;
    let markersGroup = null;

    // Cargar datos
    if (typeof propertiesData !== 'undefined') {
        allProperties = [...propertiesData];
        // Ordenar por ID descendente por defecto (más nuevas primero)
        allProperties.sort((a, b) => Number(b.id) - Number(a.id));

        renderProperties(allProperties);
        initPropertiesMap(allProperties);
    } else {
        console.error('propertiesData no está cargado');
    }

    function initPropertiesMap(properties) {
        const mapContainer = document.getElementById('map-properties');
        if (!mapContainer) return;

        // Si el mapa ya existe, lo removemos para reinicializar
        if (map) {
            map.remove();
        }

        // Filter properties with coordinates
        const propsWithCoords = properties.filter(prop => {
            if (prop.coordenadas) {
                const parts = prop.coordenadas.split(',');
                return parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]));
            }
            return prop.lat && prop.lng && !isNaN(parseFloat(prop.lat)) && !isNaN(parseFloat(prop.lng));
        });

        if (propsWithCoords.length === 0) {
            mapContainer.style.display = 'none';
            return;
        } else {
            mapContainer.style.display = 'block';
        }

        // Calculate center from first property or use default
        let centerLat = -30.751, centerLng = -57.989;
        if (propsWithCoords.length > 0) {
            const firstProp = propsWithCoords[0];
            if (firstProp.coordenadas) {
                const parts = firstProp.coordenadas.split(',');
                centerLat = parseFloat(parts[0]);
                centerLng = parseFloat(parts[1]);
            } else {
                centerLat = parseFloat(firstProp.lat);
                centerLng = parseFloat(firstProp.lng);
            }
        }

        // Initialize Leaflet map
        map = L.map('map-properties').setView([centerLat, centerLng], 13);

        // Initialize Marker Cluster Group
        markersGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            spiderfyOnMaxZoom: true,
            disableClusteringAtZoom: 18
        });
        map.addLayer(markersGroup);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        // RealHomes style marker icon
        const customIcon = L.icon({
            iconUrl: 'https://danielbrarda.com.ar/wp-content/themes/realhomes/assets/modern/images/map/single-family-home-map-icon.png',
            iconSize: [42, 57],
            iconAnchor: [21, 57],
            popupAnchor: [1, -50]
        });

        // Add markers for each property
        propsWithCoords.forEach(prop => {
            let lat, lng;
            if (prop.coordenadas) {
                const parts = prop.coordenadas.split(',');
                lat = parseFloat(parts[0]);
                lng = parseFloat(parts[1]);
            } else {
                lat = parseFloat(prop.lat);
                lng = parseFloat(prop.lng);
            }

            const imageSrc = prop.imagen || (prop.imagenes && prop.imagenes.length > 0 ? prop.imagenes[0].url : 'img/img_no_disp.png');
            const price = prop.precio || 'Consultar';

            // Create popup content
            const popupContent = `
                <div class="map-popup-card" style="width: 250px; text-align: center; cursor: pointer; font-family: 'Open Sans', sans-serif;" onclick="window.location.href='detalle.html?id=${prop.id}'">
                    <img src="${imageSrc}" alt="${prop.titulo}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
                    <h4 style="margin: 0 0 5px; font-size: 15px; color: #2c3e50; font-weight: 700; font-family: 'Montserrat', sans-serif;">${prop.titulo}</h4>
                    <p style="margin: 0 0 10px; font-size: 18px; color: #1e73be; font-weight: 700;">${price}</p>
                    <span style="display: block; background: #ea723d; color: white; padding: 6px; border-radius: 4px; font-size: 13px; font-weight: 600;">Ver Propiedad</span>
                </div>
            `;

            // Create marker with custom icon
            const marker = L.marker([lat, lng], { icon: customIcon, title: prop.titulo });

            // Bind popup
            marker.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-leaflet-popup'
            });

            // Add to cluster group
            markersGroup.addLayer(marker);
        });

        // Fit map to show all markers if there are multiple
        if (propsWithCoords.length > 1) {
            map.fitBounds(markersGroup.getBounds(), { padding: [50, 50] });
        }

        // Ensure tiles are loaded correctly after dynamic resize/init
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }

    // Función para renderizar
    function renderProperties(properties) {
        if (!gridContainer) return;

        gridContainer.innerHTML = '';

        if (properties.length === 0) {
            noResults.style.display = 'block';
            resultsCount.innerText = '0 propiedades encontradas';
            return;
        }

        noResults.style.display = 'none';
        resultsCount.innerText = `Mostrando ${properties.length} propiedades`;

        const html = properties.map(prop => createPropertyCard(prop)).join('');
        gridContainer.innerHTML = html;
    }

    // Reutilizar lógica de card de scripts.js o redefinirla aquí para independencia
    function createPropertyCard(prop) {
        let mapBtn = '';
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
            // Usamos la función global openModal de scripts.js si está disponible
            mapBtn = `<button class="btn-google-maps" onclick="openModal('${lat}', '${lng}', '${prop.titulo.replace(/'/g, "\\'")}')" title="Ver Mapa"><i class="fas fa-map-marked-alt"></i></button>`;
        }

        let imageSrc = prop.imagen || (prop.imagenes && prop.imagenes.length > 0 ? prop.imagenes[0].url : 'img/img_no_disp.png');
        let type = prop.tipos ? prop.tipos[0] : (prop.tipo || 'Propiedad');
        let status = prop.estados ? prop.estados[0] : '';
        let badgeColor = (status && status.toLowerCase().includes('venta')) ? 'var(--primary)' : 'var(--secondary)';
        let badgeText = status || type;

        return `
            <div class="property-card">
                <div class="property-image">
                    <a href="detalle.html?id=${prop.id}">
                        <img src="${imageSrc}" alt="${prop.titulo}" loading="lazy">
                    </a>
                    <div class="property-badge" style="background: ${badgeColor}">${badgeText}</div>
                </div>
                <div class="property-content">
                    <h3><a href="detalle.html?id=${prop.id}">${prop.titulo}</a></h3>
                    <p style="font-size: 0.9em; color: #666; margin-bottom: 10px;">
                        <i class="fas fa-map-marker-alt"></i> ${prop.direccion || prop.ciudades || ''}
                    </p>
                    <div class="property-features" style="display: flex; gap: 10px; margin-bottom: 15px; font-size: 0.85em; color: #555;">
                        ${prop.dormitorios ? `<span><i class="fas fa-bed"></i> ${prop.dormitorios}</span>` : ''}
                        ${prop.banos ? `<span><i class="fas fa-bath"></i> ${prop.banos}</span>` : ''}
                        ${(prop.superficie_m2 || prop.superficie) ? `<span><i class="fas fa-ruler-combined"></i> ${prop.superficie_m2 || prop.superficie}m²</span>` : ''}
                    </div>
                    <div class="property-footer">
                        <div class="property-price">${prop.precio || 'Consultar'}</div>
                        <div class="property-actions">
                            ${mapBtn}
                            <a href="detalle.html?id=${prop.id}" class="btn btn-primary" style="padding: 8px 15px; font-size: 0.8rem; border-radius: 6px;">
                                Ver Propiedad
                            </a>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    // Aplicar filtros desde URL (si vienen de index.html o menu)
    const urlParams = new URLSearchParams(window.location.search);
    const operacionParam = urlParams.get('operacion');
    const tipoParam = urlParams.get('tipo');
    const ubicacionParam = urlParams.get('ubicacion');

    if (operacionParam && filtroOperacion) filtroOperacion.value = operacionParam;
    if (tipoParam && filtroTipo) filtroTipo.value = tipoParam;
    if (ubicacionParam && filtroCiudad && ubicacionParam !== 'Otras') filtroCiudad.value = ubicacionParam;

    // Función para aplicar filtros
    function applyFilters() {
        if (!allProperties || allProperties.length === 0) return;

        const urlParams = new URLSearchParams(window.location.search);
        const ubicacionUrl = urlParams.get('ubicacion');

        const operacion = filtroOperacion.value.toLowerCase();
        const tipo = filtroTipo.value.toLowerCase();
        const ciudad = filtroCiudad.value.toLowerCase();
        const texto = filtroTexto.value.toLowerCase();

        const filtered = allProperties.filter(prop => {
            // Filtro por operación (Venta/Alquiler)
            if (operacion) {
                const estados = prop.estados ? prop.estados.map(e => e.toLowerCase()) : [];
                if (!estados.some(e => e.includes(operacion))) return false;
            }

            // Filtro por tipo
            if (tipo) {
                const tipos = prop.tipos ? prop.tipos.map(t => t.toLowerCase()) : [];
                if (!tipos.some(t => t.includes(tipo))) return false;
            }

            // Filtro por ubicación (desde menú o select)
            if (ubicacionUrl === 'Otras') {
                // Lógica de "Otras localidades": No Chajarí
                const ciudades = prop.ciudades ? prop.ciudades.toLowerCase() : '';
                if (ciudades.includes('chajari')) return false;
            } else if (ciudad) {
                const ciudades = prop.ciudades ? prop.ciudades.toLowerCase() : '';
                const direccion = prop.direccion ? prop.direccion.toLowerCase() : '';
                if (!ciudades.includes(ciudad) && !direccion.includes(ciudad)) return false;
            }

            // Filtro por texto (busca en título y descripción)
            if (texto) {
                const titulo = prop.titulo ? prop.titulo.toLowerCase() : '';
                const descripcion = prop.descripcion ? prop.descripcion.toLowerCase() : '';
                if (!titulo.includes(texto) && !descripcion.includes(texto)) return false;
            }

            return true;
        });

        renderProperties(filtered);
        initPropertiesMap(filtered); // Actualizar mapa con resultados filtrados
    }

    // Event listeners para filtros
    if (btnBuscar) {
        btnBuscar.addEventListener('click', applyFilters);
    }

    // También aplicar filtros al presionar Enter en el campo de texto
    if (filtroTexto) {
        filtroTexto.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') applyFilters();
        });
    }

    // Si había parámetros en la URL al cargar, aplicar filtros inicialmente
    if (operacionParam || tipoParam || ubicacionParam) {
        applyFilters();
    }
});
