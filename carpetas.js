// =========================================================================
// ARCHIVO INTEGRADO CENTRAL: carpetas.js (PRODUCCIÓN - PARTE 1)
// REQUISITOS INTEGRADOS: CUMPLIMIENTO ESTRICTO DE LAS EMISIONES 1 A 11
// =========================================================================

// =========================================================================
// SECCIÓN 1: ENLACE DE RED WEB APP DE PRODUCCIÓN PARA DRIVE (CONECTADO)
// =========================================================================
const CARPETAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyTjFd6E3bbZvfdK0ltV85SFqLHukNOQsKBhxB5HXtj2GBa3SegPSaMl2eOmyccCnK7CQ/exec";

// =========================================================================
// SECCIÓN 2: VARIABLES DE MEMORIA INTERNA AISLADA DE PRODUCCIÓN
// =========================================================================
let drive_IdCarpetaActiva = "1FaVX1EbJlhJWSgnaoqL7WqJqRaJbGzKM"; // Carpeta raíz
let drive_NombreArchivoSeleccionado = "";
let drive_MimeTypeSeleccionado = "";
let drive_Base64DataSeleccionada = "";

// =========================================================================
// SECCIÓN 3: EMISORES DE PETICIONES DE CONSULTA (JSONP MOTORS CALLBACK API)
// =========================================================================

// REQ 1 y 2: Lanza la petición script sincronizada con la macro de Google
function Secc3_Fun1_DispararCargaEstructuraNube(folderId) {
    const viejo = document.getElementById("script-drive-carga");
    if (viejo) viejo.remove();
    const script = document.createElement("script");
    script.id = "script-drive-carga";
    script.src = `${CARPETAS_WEB_APP_URL}?accion=listarEstructura&folderId=${encodeURIComponent(folderId)}&callback=recibirEstructuraDrive`;
    document.body.appendChild(script);
}

// REQ 4: Envía el nombre del archivo para validar duplicados usando el callback correcto
function Secc3_Fun2_DispararVerificacionPreexistenciaNube(nombreArc) {
    const viejo = document.getElementById("script-drive-verificar");
    if (viejo) viejo.remove();
    const script = document.createElement("script");
    script.id = "script-drive-verificar";
    script.src = `${CARPETAS_WEB_APP_URL}?accion=verificarArchivo&nombreArchivo=${encodeURIComponent(nombreArc)}&destinoFolderId=${encodeURIComponent(drive_IdCarpetaActiva)}&callback=recibirVerificacionDrive`;
    document.body.appendChild(script);
}

// =========================================================================
// SECCIÓN 4: RECEPTORES VISUALES DE RESPUESTAS ASÍNCRONAS (REJILLAS)
// =========================================================================

window.recibirEstructuraDrive = function (resultado) {
    if (!resultado || resultado.status !== "success") return;
    
    drive_IdCarpetaActiva = resultado.idCarpetaActual;

    const selectorSub = document.getElementById("selectorSubcarpetas");
    if (selectorSub) {
        selectorSub.innerHTML = "";
        
        let optRaiz = document.createElement("option");
        optRaiz.value = resultado.idCarpetaActual;
        optRaiz.innerText = "📁 " + resultado.nombreCarpetaActual + " (Ubicación Activa)";
        selectorSub.appendChild(optRaiz);

        if (resultado.idCarpetaActual !== "1FaVX1EbJlhJWSgnaoqL7WqJqRaJbGzKM") {
            let optEscape = document.createElement("option");
            optEscape.value = "1FaVX1EbJlhJWSgnaoqL7WqJqRaJbGzKM";
            optEscape.innerText = "⬅️ Regresar a la Raíz (Visita Actual)";
            selectorSub.appendChild(optEscape);
        }

        if (resultado.carpetas && resultado.carpetas.length > 0) {
            resultado.carpetas.forEach(sub => {
                let opt = document.createElement("option");
                opt.value = sub.id;
                opt.innerText = "📁 → " + sub.nombre;
                selectorSub.appendChild(opt);
            });
        }
        
        selectorSub.value = drive_IdCarpetaActiva;
    }

    const tablaCuerpoDrive = document.getElementById("tablaCuerpoDrive");
    if (tablaCuerpoDrive) {
        tablaCuerpoDrive.innerHTML = "";
        if (!resultado.archivos || resultado.archivos.length === 0) {
            tablaCuerpoDrive.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:1rem; color:#666;">No hay archivos guardados en esta ubicación.</td></tr>`;
            return;
        }
        resultado.archivos.forEach(arc => {
            let htmlFila = "<tr>";
            htmlFila += `<td><strong>${arc.nombre}</strong></td>`;
            htmlFila += `<td>${obtenerIconoFormato(arc.mimeType || "Archivo")}</td>`;
            htmlFila += `<td><a href="${arc.url}" target="_blank" class="btn-primario" style="text-decoration:none; display:inline-block; padding:4px 10px; font-size:0.75rem !important;">👁️ Ver</a></td>`;
            htmlFila += "</tr>";
            tablaCuerpoDrive.insertAdjacentHTML("beforeend", htmlFila);
        });
    }
};

// =========================================================================
// SECCIÓN 5: INTERCEPTOR EVALUADOR DE PREEXISTENCIA Y DIÁLOGOS SÍ/NO
// =========================================================================

window.recibirVerificacionDrive = function (respuesta) {
    if (!respuesta || respuesta.status !== "success") return;

    let seMuestraEnPantalla = false;
    const tablaCuerpoDrive = document.getElementById("tablaCuerpoDrive");
    if (tablaCuerpoDrive) {
        const filas = tablaCuerpoDrive.getElementsByTagName("tr");
        for (let i = 0; i < filas.length; i++) {
            if (filas[i].innerText.includes(drive_NombreArchivoSeleccionado)) {
                seMuestraEnPantalla = true;
                break;
            }
        }
    }

    if (respuesta.existe === true || seMuestraEnPantalla === true) {
        if (respuesta.mimeTypeOriginal && respuesta.mimeTypeOriginal !== drive_MimeTypeSeleccionado) {
            alert("No es el mismo formato, no se puede actualizar.");
            Secc6_Fun2_RestablecerFormularioCarga();
            return;
        }

        let confirmarReemplazo = confirm("¿Estás seguro de que quieres reemplazar el documento?");
        if (confirmarReemplazo) {
            Secc6_Fun1_TransmitirBytesHaciaNube("actualizarExistente", respuesta.fileIdOriginal);
        } else {
            Secc6_Fun2_RestablecerFormularioCarga();
        }
    } 
    else {
        let confirmarNuevo = confirm("Este es un documento que no está en la carpeta, debes confirmar si quieres subirlo");
        if (confirmarNuevo) {
            Secc6_Fun1_TransmitirBytesHaciaNube("crearNuevo", null);
        } else {
            Secc6_Fun2_RestablecerFormularioCarga();
        }
    }
};

// =========================================================================
// SECCIÓN 6: INTERCEPCIÓN DE ARCHIVOS LOCALES (VISTA PREVIA Y MEMORIA)
// =========================================================================

function Secc5_Fun1_ProcesarSeleccionArchivoLocal(evento) {
    const listaArchivos = evento.target.files;
    const txtNombre = document.getElementById("nombreArchivoSeleccionado");
    const btnSubir = document.getElementById("btnIniciarCargaDrive");
    const previewContenedor = document.getElementById("contenedorPrevisualizacionFoto");
    const previewImg = document.getElementById("previewFotoDriveImg");

    if (!listaArchivos || listaArchivos.length === 0) {
        if (txtNombre) txtNombre.innerText = "Ningún archivo seleccionado";
        if (btnSubir) btnSubir.style.display = "none";
        if (previewContenedor) previewContenedor.style.display = "none";
        return;
    }

    const archivoFisico = listaArchivos[0];
    drive_NombreArchivoSeleccionado = archivoFisico.name;
    drive_MimeTypeSeleccionado = archivoFisico.type;
    
    if (txtNombre) txtNombre.innerText = archivoFisico.name;
    if (btnSubir) btnSubir.style.display = "inline-block";

    if (archivoFisico.type.startsWith("image/")) {
        const lectorVistaPrevia = new FileReader();
        lectorVistaPrevia.onload = function (e) {
            if (previewImg) previewImg.src = e.target.result;
            if (previewContenedor) previewContenedor.style.display = "flex";
        };
        lectorVistaPrevia.readAsDataURL(archivoFisico);
    } else {
        if (previewContenedor) previewContenedor.style.display = "none";
    }

    const lectorBase64 = new FileReader();
    lectorBase64.onload = function (e) {
        drive_Base64DataSeleccionada = e.target.result;
    };
    lectorBase64.readAsDataURL(archivoFisico);
}

// =========================================================================
// SECCIÓN 7: MOTOR DE EMISIÓN DE TRANSFERENCIA DE BYTES (JSON COMPATIBLE)
// =========================================================================

function Secc6_Fun1_TransmitirBytesHaciaNube(tipoAccion, fileIdOriginal) {
    const btn = document.getElementById("btnIniciarCargaDrive");
    if (btn) { btn.disabled = true; btn.innerText = "Subiendo archivo..."; }

    const base64DataRaw = drive_Base64DataSeleccionada || "";
    const base64Pura = base64DataRaw.indexOf(",") > -1 ? base64DataRaw.split(",")[1] : base64DataRaw;

    let paqueteCarga = {
        accion: tipoAccion,
        destinoFolderId: drive_IdCarpetaActiva,
        nombreArchivo: drive_NombreArchivoSeleccionado,
        mimeType: drive_MimeTypeSeleccionado,
        base64Data: base64Pura,
        fileIdOriginal: fileIdOriginal
    };

    fetch(CARPETAS_WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify(paqueteCarga)
    })
    .then(res => res.json())
    .then(data => {
        alert("Recuerda confirmar si el nuevo documento se ve en el WebApp \"Visita\".");
        Secc6_Fun2_RestablecerFormularioCarga();
        setTimeout(() => Secc3_Fun1_DispararCargaEstructuraNube(drive_IdCarpetaActiva), 300);
    })
    .catch(err => {
        console.error("Aviso original de red:", err);
        alert("Recuerda confirmar si el nuevo documento se ve en el WebApp \"Visita\".");
        Secc6_Fun2_RestablecerFormularioCarga();
        setTimeout(() => Secc3_Fun1_DispararCargaEstructuraNube(drive_IdCarpetaActiva), 1000);
    });
}

function Secc6_Fun2_RestablecerFormularioCarga() {
    const btn = document.getElementById("btnIniciarCargaDrive");
    if (btn) { btn.disabled = false; btn.innerText = "🚀 Subir a Carpeta Activa"; }
    document.getElementById("archivoSubirDrive").value = "";
    document.getElementById("nombreArchivoSeleccionado").innerText = "Ningún archivo seleccionado";
    if (document.getElementById("contenedorPrevisualizacionFoto")) {
        document.getElementById("contenedorPrevisualizacionFoto").style.display = "none";
    }
}

// =========================================================================
// SECCIÓN 8: ESCUCHAS DE EVENTOS BINDING AUTOMÁTICOS
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const selectorSub = document.getElementById("selectorSubcarpetas");
    if (selectorSub) {
        selectorSub.addEventListener("change", (e) => {
            drive_IdCarpetaActiva = e.target.value;
            const tablaCuerpoDrive = document.getElementById("tablaCuerpoDrive");
            if (tablaCuerpoDrive) {
                tablaCuerpoDrive.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:1rem; color:#666;">⏳ Sincronizando archivos...</td></tr>`;
            }
            Secc3_Fun1_DispararCargaEstructuraNube(e.target.value);
        });
    }

    const inputArchivo = document.getElementById("archivoSubirDrive");
    if (inputArchivo) {
        inputArchivo.addEventListener("change", Secc5_Fun1_ProcesarSeleccionArchivoLocal);
    }

    const btnCarga = document.getElementById("btnIniciarCargaDrive");
    if (btnCarga) {
        btnCarga.addEventListener("click", () => {
            if (!drive_NombreArchivoSeleccionado) {
                alert("Por favor, selecciona un documento primero.");
                return;
            }
            Secc3_Fun2_DispararVerificacionPreexistenciaNube(drive_NombreArchivoSeleccionado);
        });
    }

    setTimeout(() => {
        Secc3_Fun1_DispararCargaEstructuraNube(drive_IdCarpetaActiva);
    }, 1000);
});
// =========================================================================
// PROGRAMACIÓN COMPLEMENTARIA INDEPENDIENTE: VISTA PREVIA DEL ICONO EN TIEMPO REAL
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const inputArchivoOriginal = document.getElementById("archivoSubirDrive");
    const btnCargaOriginal = document.getElementById("btnIniciarCargaDrive");
    const contenedorIcono = document.getElementById("vistaPreviaIconoDrive");
    
    if (inputArchivoOriginal && contenedorIcono) {
        // 1. Escuchar la selección para pintar el icono de color al lado del nombre nativo
        inputArchivoOriginal.addEventListener("change", (e) => {
            const archivos = e.target.files;
            
            if (!archivos || archivos.length === 0) {
                contenedorIcono.innerHTML = "";
                return;
            }
            
            const documento = archivos[0];
            const formatoDetectado = documento.type || documento.name.split('.').pop();
            
            // Inyectamos únicamente el HTML del icono con su color sin repetir texto
            contenedorIcono.innerHTML = obtenerIconoFormato(formatoDetectado);
        });
    }

    if (btnCargaOriginal && contenedorIcono) {
        // 2. Monitorear el botón verde para borrar el icono cuando el sistema termine de subir
        btnCargaOriginal.addEventListener("click", () => {
            const intervaloLimpieza = setInterval(() => {
                // Cuando tu lógica nativa original limpie el input de archivos, removemos el icono de color
                if (!inputArchivoOriginal || !inputArchivoOriginal.value) {
                    contenedorIcono.innerHTML = "";
                    clearInterval(intervaloLimpieza);
                }
            }, 500);
        });
    }
});
