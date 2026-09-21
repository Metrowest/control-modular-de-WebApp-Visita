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
// SECCIÓN 5: MOTOR DE CARGA Y LECTURA ASÍNCRONA DE DATOS REMOTOS (CORREGIDO)
// Descripción: Realiza la consulta a la base de datos de Google Sheets mediante
// la inyección de script nativa de tu primera versión. Separa dinámicamente
// las vistas horizontales y verticales y elimina los encabezados repetidos.
// =========================================================================
function cargarDatos() {
    const hoja = document.getElementById("selectorHoja").value;
    const tablaCabecera = document.getElementById("tablaCabecera");
    const tablaCuerpo = document.getElementById("tablaCuerpo");
    const contenedorTabla = document.getElementById("tablaDatos")?.parentElement;

    if (!tablaCabecera || !tablaCuerpo) return;

    // 🛡️ REGLA DE EXCLUSIÓN TOTAL PARA SEGURIDAD:
    if (hoja === "Seguridad") {
        if (contenedorTabla) contenedorTabla.style.display = "none";
        tablaCabecera.innerHTML = "";
        tablaCuerpo.innerHTML = "";
        console.log("🛡️ [Control A1] Tabla inferior de control apagada. Forzando actualización atómica.");
        
        // Petición silenciosa usando el callback nativo que tu servidor exige
        const urlSeguraA1 = `${WEB_APP_URL}?hoja=${encodeURIComponent(hoja)}&callback=recibirDatosDesdeGoogle`;
        inyectarScriptRed(urlSeguraA1);
        return;
    }

    // Comportamiento normal para las hojas de la 1 a la 8
    if (contenedorTabla) contenedorTabla.style.display = "block";
    tablaCabecera.innerHTML = "<tr><th>Cargando datos desde la nube...</th></tr>";
    tablaCuerpo.innerHTML = "";

    const urlSeguraGeneral = `${WEB_APP_URL}?hoja=${encodeURIComponent(hoja)}&callback=recibirDatosDesdeGoogle`;
    inyectarScriptRed(urlSeguraGeneral);
}

function inyectarScriptRed(url) {
    const puenteViejo = document.getElementById("puente-jsonp-google");
    if (puenteViejo) puenteViejo.remove();

    const scriptPuente = document.createElement("script");
    scriptPuente.id = "puente-jsonp-google";
    scriptPuente.src = url;
    scriptPuente.onerror = function() {
        const tablaCabecera = document.getElementById("tablaCabecera");
        if (tablaCabecera) tablaCabecera.innerHTML = "<tr><th>Error crítico de conexión con el servidor.</th></tr>";
    };
    document.body.appendChild(scriptPuente);
}

// 🌟 CALLBACK ORIGINAL DE TU PRIMERA VERSIÓN CON DETECCIÓN HORIZONTAL/VERTICAL
window.recibirDatosDesdeGoogle = function(json) {
    const hoja = document.getElementById("selectorHoja").value;
    const tablaCabecera = document.getElementById("tablaCabecera");
    const tablaCuerpo = document.getElementById("tablaCuerpo");

    if (!tablaCabecera || !tablaCuerpo) return;

    const puenteViejo = document.getElementById("puente-jsonp-google");
    if (puenteViejo) puenteViejo.remove();

    // 1. Manejo exclusivo de la hoja Seguridad (Precarga el input único sin pintar tabla abajo)
    if (hoja === "Seguridad") {
        if (json && json.status === "success" && json.data && json.data.length > 0) {
            const fila1 = json.data[0] || json.data;
            const valorRealA1 = fila1["Fecha / Estado"] || Object.values(fila1)[0] || "";
            const inputA1 = document.querySelector("#contenedorCampos input");
            if (inputA1) {
                inputA1.value = String(valorRealA1).trim();
                document.getElementById("formTitulo").innerText = "Editar Registro (Línea 1)";
            }
        }
        return;
    }

    // 2. Dibujar la cabecera dinámica con los nombres de tus campos para las hojas 1 a 8
    let htmlCabecera = "<tr>";
    estructuras[hoja].campos.forEach(c => htmlCabecera += `<th>${c}</th>`);
    htmlCabecera += "<th>Acciones</th></tr>";
    tablaCabecera.innerHTML = htmlCabecera;

    if (json && json.status === "success" && json.data && json.data.length > 0) {
        
        // 🌟 CORRECCIÓN SOLICITADA: PRESENTACIÓN HOJAS VERTICALES (Hojas 3 a la 8)
        // Toma la columna vertical de Sheets y la acopla en una sola línea horizontal limpia
        if (estructuras[hoja].tipo === "vertical") {
            let htmlFila = "<tr>";
            
            estructuras[hoja].campos.forEach((campo, i) => {
                let celdaDato = json.data[i];
                let valorReal = "";
                
                if (celdaDato) {
                    let valoresInternos = Object.values(celdaDato);
                    valorReal = (valoresInternos[1] !== undefined) ? valoresInternos[1] : valoresInternos[0];
                    if (String(valorReal).trim() === campo) valorReal = valoresInternos[1] || "";
                }
                htmlFila += `<td>${String(valorReal).trim()}</td>`;
            });

            htmlFila += `<td>
                <button type="button" class="btn-edit" onclick="editarRegistro(0, ${JSON.stringify(json.data).replace(/"/g, '&quot;')})">✏️</button>
                <button type="button" class="btn-delete" onclick="borrarRegistro(0)">🗑️</button>
            </td></tr>`;
            tablaCuerpo.innerHTML = htmlFila;

        } else {
            // 🌟 CORRECCIÓN SOLICITADA: PRESENTACIÓN HOJAS HORIZONTALES (Hojas 1 y 2)
            json.data.forEach((row, index) => {
                // LIMPIEZA DE ENCABEZADOS: Si el renglón repite los títulos, no lo pinta en la tabla
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
// SECCIÓN 6: PROCESAMIENTO Y TRANSMISIÓN DE GUARDADO CON LÓGICA DE CONTROL
// Descripción: Captura el submit del formulario Datos. Si la sección activa es 
// Seguridad, realiza un bypass asíncrono para ignorar el bucle .forEach general, 
// aislando la celda A1 e inyectando la propiedad soloCelda: true. Usa mode: 'no-cors'
// para replicar la transmisión de la app actual y evadir bloqueos de red.
// =========================================================================
async function guardarRegistro(e) {
    e.preventDefault();
    const hoja = document.getElementById("selectorHoja").value;
    const formData = new FormData(e.target);
    const datos = {};
    let payload = {};

    // 🛡️ EL AJUSTE EXACTO: Si es Seguridad, aislamos los datos para proteger las líneas 2 a 8
    if (hoja === "Seguridad" || hoja === "Seguridad (Programa)") {
        const valorA1 = formData.get("Fecha / Estado") || formData.get("txtGrupo") || document.getElementById("txtGrupo")?.value;

        payload = {
            action: "update",            // Forzamos acción de actualización sobre el registro
            hoja: "Seguridad",
            tipoEstructura: "vertical",  // Definida como hoja vertical persistente
            index: 0,                    // Apunta fijamente a la primera línea de datos (Celda A1)
            datos: { "Fecha / Estado": valorA1 }, // Paquete limpio de un solo parámetro para A1
            soloCelda: true              // Bandera crítica que le prohíbe al backend vaciar rangos
        };
        console.warn("🛡️ [Aislamiento de Celda] Saltando bucle masivo general. Transmitiendo exclusivamente celda A1.");
    } else {
        // =========================================================================
        // COMPORTAMIENTO ORIGINAL INTACTO PARA TODAS LAS DEMÁS HOJAS DEL RESPALDO
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

    // --- PROCESO DE TRANSMISIÓN TRADICIONAL DE TU APLICACIÓN ---
    const btnGuardar = document.getElementById("btnGuardar");
    if (btnGuardar) btnGuardar.innerText = "Procesando...";

    try {
        // 🚀 SINCRONIZACIÓN CON APP ACTUAL: mode: "no-cors" elimina el bloqueo de origen de inmediato
        await fetch(WEB_APP_URL, { 
            method: "POST", 
            mode: "no-cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload) 
        });
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
    
    if (document.getElementById("formTitulo")) {
        document.getElementById("formTitulo").innerText = "Editar Registro";
    }
    
    const btnCancelar = document.getElementById("btnCancelar");
    if (btnCancelar) btnCancelar.style.display = "inline-block";

    const campos = document.querySelectorAll("#contenedorCampos input");
    campos.forEach((input, i) => {
        let valorRecuperado = rowData[input.name] || rowData[i] || Object.values(rowData)[i] || "";
        input.value = valorRecuperado;
    });
};

window.borrarRegistro = async (index) => {
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;
    const hoja = document.getElementById("selectorHoja").value;

    const parametrosBorrar = `action=delete&hoja=${encodeURIComponent(hoja)}&tipoEstructura=${estructuras[hoja].tipo}&index=${index}`;
    const urlBorrar = `${WEB_APP_URL}?${parametrosBorrar}&callback=cargarDatos`;
    
    const scriptBorrar = document.createElement("script");
    scriptBorrar.src = urlBorrar;
    document.body.appendChild(scriptBorrar);
};

function cancelarEdicion() {
    registroEditandoIndex = null;
    if (document.getElementById("formTitulo")) {
        document.getElementById("formTitulo").innerText = "Añadir Registro";
    }
    if (document.getElementById("btnCancelar")) {
        document.getElementById("btnCancelar").style.display = "none";
    }
    const form = document.getElementById("formularioDatos");
    if (form) form.reset();
}
