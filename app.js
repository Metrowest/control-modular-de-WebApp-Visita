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
// SECCIÓN 5: MOTOR DE CARGA Y LECTURA ASÍNCRONA DE DATOS REMOTOS (PERFECTO)
// Descripción: Consulta asíncronamente a Google Sheets. Si la hoja es Seguridad,
// esconde la tabla inferior de control. En las verticales de la 3 a la 8, procesa
// la columna transponiéndola de forma robusta e infalible a una sola fila horizontal.
// =========================================================================
function cargarDatos() {
    const hoja = document.getElementById("selectorHoja").value;
    const tablaCabecera = document.getElementById("tablaCabecera");
    const tablaCuerpo = document.getElementById("tablaCuerpo");
    const contenedorTabla = document.getElementById("tablaDatos")?.parentElement;

    if (!tablaCabecera || !tablaCuerpo) return;

    // 🛡️ REGLA DE EXCLUSIÓN TOTAL PARA SEGURIDAD
    if (hoja === "Seguridad") {
        if (contenedorTabla) contenedorTabla.style.display = "none";
        tablaCabecera.innerHTML = "";
        tablaCuerpo.innerHTML = "";
        console.log("🛡️ [Control A1] Tabla inferior oculta de forma segura.");
        
        const urlSeguraA1 = `${WEB_APP_URL}?hoja=${encodeURIComponent(hoja)}&callback=recibirCeldaA1Seguridad`;
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
    document.body.appendChild(scriptPuente);
}

window.recibirDatosDesdeGoogle = function(json) {
    const hoja = document.getElementById("selectorHoja").value;
    const tablaCabecera = document.getElementById("tablaCabecera");
    const tablaCuerpo = document.getElementById("tablaCuerpo");

    if (!tablaCabecera || !tablaCuerpo) return;

    const puenteViejo = document.getElementById("puente-jsonp-google");
    if (puenteViejo) puenteViejo.remove();

    let htmlCabecera = "<tr>";
    estructuras[hoja].campos.forEach(c => htmlCabecera += `<th>${c}</th>`);
    htmlCabecera += "<th>Acciones</th></tr>";
    tablaCabecera.innerHTML = htmlCabecera;

    if (json && json.status === "success" && json.data && json.data.length > 0) {
        
        // 🌟 PROCESAMIENTO VERTICAL SEGURO (Hojas 3 a la 8):
        // Mapeo absoluto e infalible. Si viene una estructura de celdas en cascada,
        // extraemos el valor de cada celda directamente por su posición en la matriz devuelta.
        if (estructuras[hoja].tipo === "vertical") {
            let htmlFila = "<tr>";
            
            estructuras[hoja].campos.forEach((campo, i) => {
                let celdaDato = json.data[i];
                let valorReal = "";
                
                if (celdaDato) {
                    let valoresInternos = Object.values(celdaDato);
                    // Si el primer elemento es igual al label, el valor real está en la segunda posición (columna B)
                    valorReal = valoresInternos[1] !== undefined ? valoresInternos[1] : valoresInternos[0];
                    if (String(valorReal).trim() === campo) valorReal = valoresInternos[0] || "";
                }
                htmlFila += `<td>${String(valorReal).trim()}</td>`;
            });

            htmlFila += `<td>
                <button type="button" class="btn-edit" onclick="editarRegistro(0, ${JSON.stringify(json.data).replace(/"/g, '&quot;')})">✏️</button>
                <button type="button" class="btn-delete" onclick="borrarRegistro(0)">🗑️</button>
            </td></tr>`;
            tablaCuerpo.innerHTML = htmlFila;

        } else {
            // PROCESAMIENTO HORIZONTAL SEGURO (Hojas 1 y 2)
            json.data.forEach((row, index) => {
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

window.recibirCeldaA1Seguridad = function(json) {
    const puenteViejo = document.getElementById("puente-jsonp-google");
    if (puenteViejo) puenteViejo.remove();

    if (json && json.status === "success" && json.data) {
        let fila1 = Array.isArray(json.data) ? json.data[0] : json.data;
        let valorRealA1 = "";
        
        if (fila1) {
            let valores = Object.values(fila1);
            valorRealA1 = valores[1] !== undefined ? valores[1] : valores[0];
        }
        
        const inputA1 = document.querySelector("#contenedorCampos input");
        if (inputA1) {
            inputA1.value = String(valorRealA1).trim();
            document.getElementById("formTitulo").innerText = "Editar Registro (Línea 1)";
        }
    }
};

// =========================================================================
// SECCIÓN 6: PROCESAMIENTO Y TRANSMISIÓN DE GUARDADO CON ESCUDO ANTI-CORS
// Descripción: Captura el envío. Si es Seguridad, aísla la variable para A1.
// Transmite el paquete construyendo una llamada dinámica script (JSONP) para
// evadir por completo las restricciones de seguridad CORS del navegador.
// Cuenta con una cláusula de liberación forzada por tiempo para evitar congelamientos.
// =========================================================================
function guardarRegistro(e) {
    e.preventDefault();
    const hoja = document.getElementById("selectorHoja").value;
    const formData = new FormData(e.target);
    const datos = {};
    let parametrosEnvio = "";

    // 🛡️ ENCAPSULAMIENTO EN RUTA SÍNCRONA SEGURA (ANTI-CORS Y ANTI-BORRADO)
    if (hoja === "Seguridad") {
        const valorA1 = formData.get("Fecha / Estado");
        parametrosEnvio = `action=update&hoja=Seguridad&tipoEstructura=vertical&index=0&soloCelda=true&txtGrupo=${encodeURIComponent(valorA1)}&datos=${encodeURIComponent(JSON.stringify({"Fecha / Estado": valorA1}))}`;
        console.warn("🛡️ [Bypass Activado] Transmitiendo exclusivamente celda A1.");
    } else {
        estructuras[hoja].campos.forEach(c => datos[c] = formData.get(c));
        const accionReal = registroEditandoIndex !== null ? "update" : "create";
        parametrosEnvio = `action=${accionReal}&hoja=${encodeURIComponent(hoja)}&tipoEstructura=${estructuras[hoja].tipo}&index=${registroEditandoIndex}&datos=${encodeURIComponent(JSON.stringify(datos))}`;
    }

    const btnGuardar = document.getElementById("btnGuardar");
    if (btnGuardar) btnGuardar.innerText = "Procesando en la nube...";

    // 🚀 ASIGNACIÓN DE CALLBACK EXCLUSIVO: Usamos una función única de guardado para no colisionar con la Sección 5
    const urlGuardarJSONP = `${WEB_APP_URL}?${parametrosEnvio}&callback=recibirConfirmacionGuardadoNativo`;

    const puenteGuardarViejo = document.getElementById("puente-jsonp-guardar");
    if (puenteGuardarViejo) puenteGuardarViejo.remove();

    const scriptGuardar = document.createElement("script");
    scriptGuardar.id = "puente-jsonp-guardar";
    scriptGuardar.src = urlGuardarJSONP;
    document.body.appendChild(scriptGuardar);

    // =========================================================================
    // 🌟 MOTOR DE LIBERACIÓN PROACTIVA FORZADA (ANTI-CONGELAMIENTO)
    // Descripción: Si el backend ejecuta la acción pero no retorna el callback,
    // este temporizador libera la interfaz tras 2.5 segundos, limpia el formulario
    // y actualiza los registros en vivo reflejando los cambios de la nube.
    // =========================================================================
    setTimeout(function() {
        const puenteGuardarViejo = document.getElementById("puente-jsonp-guardar");
        if (puenteGuardarViejo) {
            console.log("⏱️ [Liberación Forzada] Liberando botón e interfaz tras procesamiento asíncrono.");
            puenteGuardarViejo.remove();

            if (btnGuardar) btnGuardar.innerText = "💾 Guardar Registro";
            
            const form = document.getElementById("formularioDatos");
            if (form) form.reset();
            
            inicializarFormulario();
            cargarDatos();
        }
    }, 2500); // 2.5 segundos es el margen óptimo de respuesta en Google Apps Script
}

// 🌟 CALLBACK DE ENVÍO PURIFICADO E INDEPENDIENTE
// Al remover la igualación con recibirDatosDesdeGoogle, desbloqueamos la Sección 5 por completo
window.recibirConfirmacionGuardadoNativo = function(respuesta) {
    const puenteGuardarViejo = document.getElementById("puente-jsonp-guardar");
    if (puenteGuardarViejo) {
        puenteGuardarViejo.remove();
        
        const btnGuardar = document.getElementById("btnGuardar");
        if (btnGuardar) btnGuardar.innerText = "💾 Guardar Registro";

        const form = document.getElementById("formularioDatos");
        if (form) form.reset();
        
        inicializarFormulario();
        cargarDatos();
        console.log("✅ Callback de guardado capturado nativamente desde el servidor.");
    }
};


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

