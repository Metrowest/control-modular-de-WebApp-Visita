// =========================================================================
// SECCIÓN 1: VARIABLES GLOBALES Y CONFIGURACIÓN DE CONEXIÓN
// Descripción: Centraliza la URL del backend y las direcciones dinámicas.
// =========================================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz5f-HM7FAWTxf3oDPFafcZ4EUL-5Bbt6UtBU6JgqsHIqEGAN1Z5TFyx3af7B6nijvAvg/exec";

const enlacesExternos = {
    "Superintendentes": "https://metrowest.github.io/Visita/desastre.html#punto-superintendentes",
    "Hospitalidad": "https://metrowest.github.io/Visita/Almuerzo.html",
    "Estudios Día 1": "https://metrowest.github.io/Visita/estudio1A.html",
    "Estudios Día 2": "https://metrowest.github.io/Visita/estudio2A.html",
    "Estudios Día 3": "https://metrowest.github.io/Visita/estudio3A.html",
    "Pastoreo Día 1": "https://metrowest.github.io/Visita/pastoreo1A.html",
    "Pastoreo Día 2": "https://metrowest.github.io/Visita/pastoreo2A.html",
    "Pastoreo Día 3": "https://metrowest.github.io/Visita/pastoreo3A.html",
    "Seguridad": "https://metrowest.github.io/Visita/seguridad.html"
};

// =========================================================================
// SECCIÓN 2: DICCIONARIO DE ESTRUCTURAS DE DATOS (ARQUITECTURA DE HOJAS)
// Descripción: Mapeo estricto de campos de la aplicación.
// =========================================================================
const estructuras = {
    "Superintendentes": { tipo: "horizontal", campos: ["Grupo", "Superintendente", "Teléfono"] },
    "Hospitalidad": { tipo: "horizontal", campos: ["Día", "Nombre", "Teléfono", "Dirección"] },
    "Estudios Día 1": { tipo: "vertical", campos: ["Día/Hora", "Visitante", "Acompañante", "Teléfono", "Estudiante", "Dirección", "Publicación", "Detalles"] },
    "Estudios Día 2": { tipo: "vertical", campos: ["Día/Hora", "Visitante", "Acompañante", "Teléfono", "Estudiante", "Dirección", "Publicación", "Detalles"] },
    "Estudios Día 3": { tipo: "vertical", campos: ["Día/Hora", "Visitante", "Acompañante", "Teléfono", "Estudiante", "Dirección", "Publicación", "Detalles"] },
    "Pastoreo Día 1": { tipo: "vertical", campos: ["Día", "Acompañante", "Teléfono", "Hogar", "Contacto", "Dirección", "Detalles", "Objetivo"] },
    "Pastoreo Día 2": { tipo: "vertical", campos: ["Día", "Acompañante", "Teléfono", "Hogar", "Contacto", "Dirección", "Detalles", "Objetivo"] },
    "Pastoreo Día 3": { tipo: "vertical", campos: ["Día", "Acompañante", "Teléfono", "Hogar", "Contacto", "Dirección", "Detalles", "Objetivo"] }
};

// =========================================================================
// SECCIÓN 3: CONTROL DE ESTADO GLOBAL E INICIALIZADORES DEL DOM
// Descripción: Escucha y coordina los eventos de arranque del navegador.
// =========================================================================
let registroEditandoIndex = null;

document.addEventListener("DOMContentLoaded", () => {
    inicializarFormulario();
    cargarDatos();

    document.getElementById("selectorHoja").addEventListener("change", () => {
        inicializarFormulario();
        cargarDatos();
    });

    document.getElementById("formularioDatos").addEventListener("submit", guardarRegistro);
    document.getElementById("btnCancelar").addEventListener("click", cancelarEdicion);
});

// =========================================================================
// SECCIÓN 4: RENDERIZADO DINÁMICO DE FORMULARIO E INTERFAZ VISUAL
// Descripción: Dibuja las etiquetas de entrada y limpia el selector visual.
// =========================================================================
function inicializarFormulario() {
    const selector = document.getElementById("selectorHoja");
    const hoja = selector.value;
    const contenedor = document.getElementById("contenedorCampos");
    
    if (!contenedor) return;
    contenedor.innerHTML = "";
    cancelarEdicion();

    const textoCompleto = selector.options[selector.selectedIndex].text;
    const textoLimpio = textoCompleto
        .replace(/[\u2000-\u3300\ud83c-\udfff\ud83d-\udfff\ud83e-\udfff]/g, '')
        .replace(/\s*\(.*?\)\s*/g, '')
        .trim();

    const enlaceElemento = document.getElementById("nombreHojaActiva");
    if (enlaceElemento) {
        enlaceElemento.innerText = textoLimpio;
        enlaceElemento.href = enlacesExternos[hoja] || "#";

        if (enlacesExternos[hoja] === "#" || !enlacesExternos[hoja]) {
            enlaceElemento.style.textDecoration = "none";
            enlaceElemento.style.color = "#333333";
            enlaceElemento.style.cursor = "default";
        } else {
            enlaceElemento.style.textDecoration = "underline";
            enlaceElemento.style.color = "var(--primary)";
            enlaceElemento.style.cursor = "pointer";
        }
    }

    if (estructuras[hoja] && estructuras[hoja].campos) {
        estructuras[hoja].campos.forEach(campo => {
            const div = document.createElement("div");
            div.innerHTML = `<label>${campo}</label><input type="text" name="${campo}" required>`;
            contenedor.appendChild(div);
        });
    }
}

// =========================================================================
// SECCIÓN 5: MOTOR DE CARGA Y LECTURA ASÍNCRONA DE DATOS REMOTOS (CORREGIDO)
// Descripción: Realiza la consulta asíncrona a la base de datos de Google Sheets.
// Conecta mediante inyección de script (JSONP) nativa compatible con tu servidor.
// Limpia la fila de encabezados en las hojas horizontales y procesa la columna
// transponiéndola de forma robusta a una sola fila horizontal en las verticales.
// =========================================================================
function cargarDatos() {
    const hoja = document.getElementById("selectorHoja").value;
    const tablaCabecera = document.getElementById("tablaCabecera");
    const tablaCuerpo = document.getElementById("tablaCuerpo");
    const contenedorTabla = document.getElementById("tablaDatos")?.parentElement;

    if (!tablaCabecera || !tablaCuerpo) return;

    // 🛑 CLÁUSULA DE PAUSA TEMPORAL: Seguridad se queda congelada momentáneamente
    if (hoja === "Seguridad" || hoja === "Seguridad (Programa)") {
        if (contenedorTabla) contenedorTabla.style.display = "none";
        tablaCabecera.innerHTML = "";
        tablaCuerpo.innerHTML = "";
        console.log("Pestaña de Seguridad en pausa según estrategia de desarrollo.");
        return;
    }

    // Comportamiento normal de lectura para las hojas estables de la 1 a la 8
    if (contenedorTabla) contenedorTabla.style.display = "block";
    tablaCabecera.innerHTML = "<tr><th>Cargando datos desde la nube...</th></tr>";
    tablaCuerpo.innerHTML = "";

    // 🌟 CORRECCIÓN NATIVA: Usamos sheetName en lugar de hoja para que Google lo reconozca
    const urlSeguraGeneral = `${WEB_APP_URL}?sheetName=${encodeURIComponent(hoja)}&callback=recibirDatosDesdeGoogle`;
    
    // Inyección de red limpia en el documento para saltar bloqueos de CORS
    const puenteViejo = document.getElementById("puente-jsonp-google");
    if (puenteViejo) puenteViejo.remove();

    const scriptPuente = document.createElement("script");
    scriptPuente.id = "puente-jsonp-google";
    scriptPuente.src = urlSeguraGeneral;
    document.body.appendChild(scriptPuente);
}

// 🌟 CALLBACK NATIVO EXIGIDO POR TU SERVIDOR CON INTEGRACIÓN HORIZONTAL Y VERTICAL
window.recibirDatosDesdeGoogle = function(json) {
    const hoja = document.getElementById("selectorHoja").value;
    const tablaCabecera = document.getElementById("tablaCabecera");
    const tablaCuerpo = document.getElementById("tablaCuerpo");

    if (!tablaCabecera || !tablaCuerpo) return;

    const puenteViejo = document.getElementById("puente-jsonp-google");
    if (puenteViejo) puenteViejo.remove();

    // 1. Dibujar la cabecera dinámica en la pantalla con los nombres de tus campos
    let htmlCabecheader = "<tr>";
    estructuras[hoja].campos.forEach(c => htmlCabecheader += `<th>${c}</th>`);
    htmlCabecheader += "<th>Acciones</th></tr>";
    tablaCabecera.innerHTML = htmlCabecheader;

    if (json && json.status === "success" && json.data && json.data.length > 0) {
        
        // 🌟 REGLA DE PRESENTACIÓN: HOJAS VERTICALES (Hojas 3 a la 8)
        if (estructuras[hoja].tipo === "vertical") {
            let htmlFila = "<tr>";
            
            estructuras[hoja].campos.forEach((campo, i) => {
                let celdaDato = json.data[i];
                let valorReal = "";
                
                if (celdaDato) {
                    let valoresInternos = Object.values(celdaDato);
                    valorReal = (valoresInternos !== undefined) ? valoresInternos : valoresInternos;
                    if (String(valorReal).trim() === campo) valorReal = valoresInternos || "";
                }
                htmlFila += `<td>${String(valorReal).trim()}</td>`;
            });

            htmlFila += `<td>
                <button type="button" class="btn-edit" onclick="editarRegistro(0, ${JSON.stringify(json.data).replace(/"/g, '&quot;')})">✏️</button>
                <button type="button" class="btn-delete" onclick="borrarRegistro(0)">🗑️</button>
            </td></tr>`;
            tablaCuerpo.innerHTML = htmlFila;

        } else {
            // 🌟 REGLA DE PRESENTACIÓN: HOJAS HORIZONTALES (Hojas 1 y 2)
            json.data.forEach((row, index) => {
                // CORRECCIÓN: Si el renglón repite los encabezados de la hoja, saltamos su dibujo
                let valoresFila = Object.values(row).map(v => String(v).toLowerCase().trim());
                if (valoresFila.includes("grupo") || valoresFila.includes("superintendente") || valoresFila.includes("día") || valoresFila.includes("nombre")) {
                    return; 
                }

                let htmlFila = "<tr>";
                estructuras[hoja].campos.forEach((campo, i) => {
                    let valorCelda = row[campo] || row[i] || Object.values(row)[i] || "";
                    htmlFila += `<td>${valorCelda}</td>`;
                });

                htmlFila += `<td>
                    <button type="button" class="btn-edit" onclick="editarRegistro(${index}, ${JSON.stringify(row).replace(/"/g, '&quot;')})">✏️</button>
                    <button type="button" class="btn-delete" onclick="borrarRegistro(${index})">🗑️</button>
                </td></tr>`;
                tablaCuerpo.insertAdjacentHTML("beforeend", htmlFila);
            });
        }
    } else {
        tablaCuerpo.innerHTML = `<tr><td colspan="${estructuras[hoja].campos.length + 1}">No hay registros guardados en esta sección.</td></tr>`;
    }
};

// =========================================================================
// SECCIÓN 6: PROCESAMIENTO Y TRANSMISIÓN DE GUARDADO
// Descripción: Método original de tu respaldo de fábrica intacto. Mapea los
// campos dinámicos mediante el ciclo .forEach nativo y realiza el envío POST.
// =========================================================================
async function guardarRegistro(e) {
    e.preventDefault();
    const hoja = document.getElementById("selectorHoja").value;
    const formData = new FormData(e.target);
    const datos = {};

    estructuras[hoja].campos.forEach(c => datos[c] = formData.get(c));

    const payload = {
        action: registroEditandoIndex !== null ? "update" : "create",
        hoja: hoja,
        tipoEstructura: estructuras[hoja].tipo,
        index: registroEditandoIndex,
        datos: datos
    };

    document.getElementById("btnGuardar").innerText = "Procesando...";

    try {
        await fetch(WEB_APP_URL, { method: "POST", body: JSON.stringify(payload) });
    } catch (err) {
        alert("Error al guardar.");
    }

    document.getElementById("btnGuardar").innerText = "💾 Guardar Registro";
    e.target.reset();
    inicializarFormulario();
    cargarDatos();
}

// =========================================================================
// SECCIÓN 7: GESTIÓN DE MODIFICACIÓN, ELIMINACIÓN Y LIMPIEZA DE ESTADO
// Descripción: Controla los botones de editar, borrar y limpiar formulario.
// Carga los datos de las filas en los inputs superiores para su modificación.
// =========================================================================
window.editarRegistro = (index, rowData) => {
    registroEditandoIndex = index;
    document.getElementById("formTitulo").innerText = "Editar Registro";
    document.getElementById("btnCancelar").style.display = "inline-block";

    const campos = document.querySelectorAll("#contenedorCampos input");
    campos.forEach((input, i) => {
        let valorRecuperado = rowData[input.name] || rowData[i] || Object.values(rowData)[i] || "";
        input.value = valorRecuperado;
    });
};

window.borrarRegistro = async (index) => {
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;
    const hoja = document.getElementById("selectorHoja").value;

    const payload = {
        action: "delete",
        hoja: hoja,
        tipoEstructura: estructuras[hoja].tipo,
        index: index
    };

    await fetch(WEB_APP_URL, { method: "POST", body: JSON.stringify(payload) });
    cargarDatos();
};

function cancelarEdicion() {
    registroEditandoIndex = null;
    document.getElementById("formTitulo").innerText = "Añadir Registro";
    document.getElementById("btnCancelar").style.display = "none";
    const form = document.getElementById("formularioDatos");
    if (form) form.reset();
}

// =========================================================================
// SECCIÓN 8: MAQUINARIA INTERACTIVA DE INSTALACIÓN PWA Y SERVICE WORKER
// Descripción: Gestiona los eventos de la instalación nativa como PWA y 
// da de alta el sw.js para el soporte de caché de tu respaldo de fábrica.
// =========================================================================
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('btnInstalar').style.display = 'block';
});

document.getElementById('btnInstalar').addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            document.getElementById('btnInstalar').style.display = 'none';
        }
        deferredPrompt = null;
    }
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
