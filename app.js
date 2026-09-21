// =========================================================================
// SECCIÓN 1: VARIABLES GLOBALES Y CONFIGURACIÓN DE CONEXIÓN
// Descripción: Define la URL del backend de Google Apps Script para la transmisión 
// de datos y centraliza el diccionario de enlaces externos de la WebApp.
// =========================================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz5f-HM7FAWTxf3oDPFafcZ4EUL-5Bbt6UtBU6JgqsHIqEGAN1Z5TFyx3af7B6nijvAvg/exec";

// Diccionario de enlaces externos para cada pestaña
// 🌟 INTEGRADO: Enlace nativo de la hoja Seguridad desde el principio
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
// Descripción: Define los nombres rigurosos de los encabezados y campos que 
// se mostrarán en la sección "Añadir Registro" / "Editar Registros" según la hoja.
// =========================================================================
const estructuras = {
    "Superintendentes": { tipo: "horizontal", campos: ["Grupo / Día", "Superintendente / Visitante", "Teléfono / Acompañante"] },
    "Hospitalidad": { tipo: "horizontal", campos: ["Grupo / Día", "Superintendente / Visitante", "Teléfono / Acompañante", "Dirección"] },
    "Estudios Día 1": { tipo: "vertical", campos: ["Día", "Visitante", "Acompañante", "Teléfono", "Estudiante", "Dirección", "Publicación", "Detalles"] },
    "Estudios Día 2": { tipo: "vertical", campos: ["Día", "Visitante", "Acompañante", "Teléfono", "Estudiante", "Dirección", "Publicación", "Detalles"] },
    "Estudios Día 3": { tipo: "vertical", campos: ["Día", "Visitante", "Acompañante", "Teléfono", "Estudiante", "Dirección", "Publicación", "Detalles"] },
    "Pastoreo Día 1": { tipo: "vertical", campos: ["Día", "Acompañante", "Teléfono", "Hogar", "Contacto", "Dirección", "Detalles", "Objetivo"] },
    "Pastoreo Día 2": { tipo: "vertical", campos: ["Día", "Acompañante", "Teléfono", "Hogar", "Contacto", "Dirección", "Detalles", "Objetivo"] },
    "Pastoreo Día 3": { tipo: "vertical", campos: ["Día", "Acompañante", "Teléfono", "Hogar", "Contacto", "Dirección", "Detalles", "Objetivo"] },
    "Seguridad": { tipo: "vertical", campos: ["Fecha / Estado"] } // 🌟 Un solo input para la celda A1
};

// =========================================================================
// SECCIÓN 3: CONTROL DE ESTADO GLOBAL E INICIALIZADORES DEL DOM
// Descripción: Administra el índice del registro activo bajo edición y coordina 
// los escuchadores de eventos principales en el arranque de la aplicación (DOMContentLoaded).
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
// Descripción: Limpia los emojis/paréntesis del selector de hojas para inyectar 
// el nombre en el enlace superior, actualiza su href correspondiente y vacía 
// el contenedor para dibujar los inputs exactos definidos en la Sección 2.
// =========================================================================
function inicializarFormulario() {
    const selector = document.getElementById("selectorHoja");
    const hoja = selector.value;
    const contenedor = document.getElementById("contenedorCampos");
    contenedor.innerHTML = "";
    cancelarEdicion();

    // Obtener el texto visible del selector (Ej: "👥 Superintendentes (Horizontal)")
    const textoCompleto = selector.options[selector.selectedIndex].text;

    // LIMPIEZA EXCLUSIVA: Extrae solo el nombre sin emojis ni texto en paréntesis
    const textoLimpio = textoCompleto
        .replace(/[\u2000-\u3300\ud83c-\udfff\ud83d-\udfff\ud83e-\udfff]/g, '')
        .replace(/\s*.*?\s*/g, '')
        .trim();

    const enlaceElemento = document.getElementById("nombreHojaActiva");

    // Inyectar ÚNICAMENTE el nombre limpio dentro de la etiqueta <a>
    if (enlaceElemento) {
        enlaceElemento.innerText = textoLimpio;
        enlaceElemento.href = enlacesExternos[hoja] || "#";

        // Cambiar dinámicamente los estilos visuales si tiene o no enlace configurado
        if (!enlacesExternos[hoja] || enlacesExternos[hoja] === "#") {
            enlaceElemento.style.textDecoration = "none";
            enlaceElemento.style.color = "#333333";
            enlaceElemento.style.cursor = "default";
        } else {
            enlaceElemento.style.textDecoration = "underline";
            enlaceElemento.style.color = "var(--primary)";
            enlaceElemento.style.cursor = "pointer";
        }
    }

    // Inyección automatizada de los inputs: En el caso de "Seguridad" inyectará exclusivamente 1 input
    if (estructuras[hoja] && estructuras[hoja].campos) {
        estructuras[hoja].campos.forEach(campo => {
            const div = document.createElement("div");
            div.className = "form-group-dinamico";
            div.innerHTML = `<label>${campo}</label><input type="text" name="${campo}" required>`;
            contenedor.appendChild(div);
        });
    }
}

// =========================================================================
// SECCIÓN 5: MOTOR DE CARGA Y LECTURA ASÍNCRONA DE DATOS REMOTOS (REPARADO)
// Descripción: Realiza la consulta asíncrona a la base de datos de Google Sheets.
// Si la sección activa es Seguridad, aplica un blindaje visual ocultando la tabla
// inferior para forzar el uso del input único. Mantiene la estructura de parámetros 
// nativa del respaldo original para evitar fallos de conexión (MIME/CORS).
// =========================================================================
async function cargarDatos() {
    const hoja = document.getElementById("selectorHoja").value;
    const tablaCabecera = document.getElementById("tablaCabecera");
    const tablaCuerpo = document.getElementById("tablaCuerpo");
    const contenedorTabla = document.getElementById("tablaDatos")?.parentElement;

    if (!tablaCabecera || !tablaCuerpo) return;

    // 🛡️ REGLA DE EXCLUSIÓN TOTAL PARA SEGURIDAD:
    // Ocultamos mecánicamente la grilla completa para que no se listen las 67 líneas inferiores
    if (hoja === "Seguridad") {
        if (contenedorTabla) contenedorTabla.style.display = "none";
        tablaCabecera.innerHTML = "";
        tablaCuerpo.innerHTML = "";
        console.log("🛡️ [Control A1] Tabla inferior de control apagada. Forzando actualización atómica.");
        
        try {
            // Consulta síncrona usando la estructura de URL limpia original de tu respaldo
            const res = await fetch(`${WEB_APP_URL}?hoja=${encodeURIComponent(hoja)}`);
            const json = await res.json();
            
            if (json && json.status === "success" && json.data && json.data.length > 0) {
                // Al ser vertical persistente, capturamos el valor guardado en la celda A1 (Línea 1)
                const fila1 = json.data[0];
                const valorRealA1 = fila1["Fecha / Estado"] || Object.values(fila1)[0] || "";
                
                const inputA1 = document.querySelector("#contenedorCampos input");
                if (inputA1) {
                    inputA1.value = valorRealA1;
                    document.getElementById("formTitulo").innerText = "Editar Registro (Línea 1)";
                }
            }
        } catch (err) {
            console.error("Error al precargar celda A1 de Seguridad: ", err);
        }
        return;
    }

    // COMPORTAMIENTO ORIGINAL DE TU RESPALDO PARA LAS HOJAS DE LA 1 A LA 8
    if (contenedorTabla) contenedorTabla.style.display = "block";
    tablaCabecera.innerHTML = "<tr><th>Cargando datos desde la nube...</th></tr>";
    tablaCuerpo.innerHTML = "";

    try {
        // Estructura de URL exacta de tu primer respaldo estable (Evita el error text/html MIME)
        const res = await fetch(`${WEB_APP_URL}?hoja=${encodeURIComponent(hoja)}`);
        const json = await res.json();

        let htmlCabecera = "<tr>";
        estructuras[hoja].campos.forEach(c => htmlCabecera += `<th>${c}</th>`);
        htmlCabecera += "<th>Acciones</th></tr>";
        tablaCabecera.innerHTML = htmlCabecera;

        if (json.status === "success" && json.data && json.data.length > 0) {
            json.data.forEach((row, index) => {
                let htmlFila = "<tr>";
                
                // Mapeo seguro y tolerante por nombre o posición de columna
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
        } else {
            tablaCuerpo.innerHTML = `<tr><td colspan="${estructuras[hoja].campos.length + 1}">No hay registros guardados en esta sección.</td></tr>`;
        }
} catch (e) {
        console.error("Error de carga asíncrona: ", e);
        if (tablaCabecera) tablaCabecera.innerHTML = "<tr><th>Error de conexión con el servidor.</th></tr>";
    }
}

// =========================================================================
// SECCIÓN 6: PROCESAMIENTO Y TRANSMISIÓN DE GUARDADO CON AISLAMIENTO DE CELDA
// Descripción: Captura los datos del formulario mediante FormData. Si la hoja 
// activa es "Seguridad", realiza un bypass deteniendo el mapeo masivo y genera 
// un payload con la bandera 'soloCelda' enfocada en la línea 1. En las demás 
// hojas, ejecuta el ciclo .forEach tradicional antes de enviar vía POST HTTP.
// =========================================================================
async function guardarRegistro(e) {
    e.preventDefault();
    const hoja = document.getElementById("selectorHoja").value;
    const formData = new FormData(e.target);
    const datos = {};
    let payload = {};

    // 🛡️ EL BLINDAJE DE EXCLUSIÓN TOTAL (ANTI-BORRADO DE LAS LÍNEAS 2 A LA 8)
    // Interceptamos si la hoja activa es Seguridad para abortar la recolección
    // masiva de campos vacíos ocultos que borraba las celdas inferiores.
    if (hoja === "Seguridad" || hoja === "Seguridad (Programa)") {
        // Captura el valor del único input de texto visible en tu pantalla
        const valorA1 = formData.get("Fecha / Estado") || formData.get("txtGrupo") || document.getElementById("txtGrupo")?.value;

        payload = {
            action: "update",            // Forzamos acción de actualización sobre el registro
            hoja: "Seguridad",
            tipoEstructura: "vertical",  // Declarada como hoja vertical de control
            index: 0,                    // Apunta fijamente a la primera línea de datos (Celda A1)
            datos: { "Fecha / Estado": valorA1 }, // Paquete limpio de un solo parámetro para A1
            soloCelda: true              // Bandera que instruye el aislamiento atómico de rango
        };
        console.warn("🛡️ [Aislamiento de Celda] Saltando bucle masivo general. Transmitiendo exclusivamente celda A1.");
    } else {
        // =========================================================================
        // TU MOTOR SÍNCRONO ORIGINAL INTACTO PARA TODAS LAS DEMÁS HOJAS
        // =========================================================================
        estructuras[hoja].campos.forEach(c => datos[c] = formData.get(c));

        payload = {
            action: registroEditandoIndex !== null ? "update" : "create",
            hoja: hoja,
            tipoEstructura: estructuras[hoja].tipo,
            index: registroEditandoIndex,
            datos: datos
        };
    }

    // --- PROCESO DE TRANSMISIÓN DE FÁBRICA ---
    const btnGuardar = document.getElementById("btnGuardar");
    if (btnGuardar) btnGuardar.innerText = "Procesando...";

    try {
        await fetch(WEB_APP_URL, { method: "POST", body: JSON.stringify(payload) });
    } catch (err) {
        alert("Error al guardar.");
    }

    if (btnGuardar) btnGuardar.innerText = "💾 Guardar Registro";
    e.target.reset();
    inicializarFormulario();
    cargarDatos();
}

// =========================================================================
// SECCIÓN 7: GESTIÓN DE MODIFICACIÓN, ELIMINACIÓN Y LIMPIEZA DE ESTADO
// Descripción: Administra la carga de datos en los campos superiores para su 
// edición mediante un motor tolerante a la estructura del objeto devuelto por 
// el servidor. También gestiona las peticiones de borrado y la cancelación del estado.
// =========================================================================

window.editarRegistro = (index, rowData) => {
    registroEditandoIndex = index;
    document.getElementById("formTitulo").innerText = "Editar Registro";
    
    const btnCancelar = document.getElementById("btnCancelar");
    if (btnCancelar) btnCancelar.style.display = "inline-block";

    // Capturamos todos los inputs dinámicos que se dibujaron en pantalla
    const campos = document.querySelectorAll("#contenedorCampos input");
    
    // 🌟 MOTOR DE CARGA TOLERANTE PARA EDICIÓN:
    // Mapeamos de forma secuencial cada campo según su posición en el formulario
    campos.forEach((input, i) => {
        // Opción A: Intenta extraer el dato por el nombre del input (Ej: rowData["Grupo"])
        // Opción B: Intenta extraer por el índice numérico correlativo (Ej: rowData[0], rowData[1])
        // Opción C: Extrae el valor directamente por la posición de los datos en el objeto de Google
        let valorRecuperado = rowData[input.name] || rowData[i] || Object.values(rowData)[i] || "";
        
        input.value = valorRecuperado;
    });
    
    console.log("✏️ Registro cargado con éxito en los campos de edición superior utilizando mapeo posicional.");
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

    try {
        await fetch(WEB_APP_URL, { method: "POST", body: JSON.stringify(payload) });
    } catch (err) {
        console.error("Error al eliminar el registro: ", err);
    }
    
    cargarDatos();
};

function cancelarEdicion() {
    registroEditandoIndex = null;
    
    const formTitulo = document.getElementById("formTitulo");
    if (formTitulo) formTitulo.innerText = "Añadir Registro";
    
    const btnCancelar = document.getElementById("btnCancelar");
    if (btnCancelar) btnCancelar.style.display = "none";
    
    const form = document.getElementById("formularioDatos");
    if (form) form.reset();
}

// =========================================================================
// SECCIÓN 8: MAQUINARIA INTERACTIVA DE INSTALACIÓN PWA Y SERVICE WORKER
// Descripción: Administra la captura del evento de instalación nativa para 
// desplegar el botón en el encabezado, gestiona la elección del usuario y 
// da de alta el archivo sw.js para permitir la persistencia en caché.
// =========================================================================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btnInstalar = document.getElementById('btnInstalar');
    if (btnInstalar) btnInstalar.style.display = 'block';
});

const btnInstalarElement = document.getElementById('btnInstalar');
if (btnInstalarElement) {
    btnInstalarElement.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                const btnInstalar = document.getElementById('btnInstalar');
                if (btnInstalar) btnInstalar.style.display = 'none';
            }
            deferredPrompt = null;
        }
    });
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

