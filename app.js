const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz5f-HM7FAWTxf3oDPFafcZ4EUL-5Bbt6UtBU6JgqsHIqEGAN1Z5TFyx3af7B6nijvAvg/exec";

// Mapeo estricto de 8 campos para concordar con la base de datos modular
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

// Objeto de enlaces externos: Vinculamos tanto Hospitalidad como Superintendentes a sus páginas reales
const enlacesExternos = {
    "Superintendentes": "https://metrowest.github.io/Visita/desastre.html#punto-superintendentes", // Reemplaza aquí con tu enlace específico real
    "Hospitalidad": "https://metrowest.github.io/Visita/Almuerzo.html",
    "Estudios Día 1": "https://metrowest.github.io/Visita/estudio1A.html",
    "Estudios Día 2": "https://metrowest.github.io/Visita/estudio2A.html",
    "Estudios Día 3": "https://metrowest.github.io/Visita/estudio3A.html",
    "Pastoreo Día 1": "https://metrowest.github.io/Visita/pastoreo1A.html",
    "Pastoreo Día 2": "https://metrowest.github.io/Visita/pastoreo2A.html",
    "Pastoreo Día 3": "https://metrowest.github.io/Visita/pastoreo3A.html"
};

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
        .replace(/\s*\(.*?\)\s*/g, '')
        .trim();

    const enlaceElemento = document.getElementById("nombreHojaActiva");

    // Inyectar ÚNICAMENTE el nombre limpio dentro de la etiqueta <a>
    enlaceElemento.innerText = textoLimpio;
    enlaceElemento.href = enlacesExternos[hoja];

    // Cambiar dinámicamente los estilos visuales si tiene o no enlace configurado
    if (enlacesExternos[hoja] === "#") {
        enlaceElemento.style.textDecoration = "none";
        enlaceElemento.style.color = "#333333";
        enlaceElemento.style.cursor = "default";
    } else {
        enlaceElemento.style.textDecoration = "underline";
        enlaceElemento.style.color = "var(--primary)";
        enlaceElemento.style.cursor = "pointer";
    }

    estructuras[hoja].campos.forEach(campo => {
        const div = document.createElement("div");
        div.innerHTML = `<label>${campo}</label><input type="text" name="${campo}" required>`;
        contenedor.appendChild(div);
    });
}

async function cargarDatos() {
    const hoja = document.getElementById("selectorHoja").value;
    const tablaCabecera = document.getElementById("tablaCabecera");
    const tablaCuerpo = document.getElementById("tablaCuerpo");

    tablaCabecera.innerHTML = "<tr><th>Cargando datos...</th></tr>";
    tablaCuerpo.innerHTML = "";

    try {
        const res = await fetch(`${WEB_APP_URL}?hoja=${encodeURIComponent(hoja)}`);
        const json = await res.json();

        let htmlCabecera = "<tr>";
        estructuras[hoja].campos.forEach(c => htmlCabecera += `<th>${c}</th>`);
        htmlCabecera += "<th>Acciones</th></tr>";
        tablaCabecera.innerHTML = htmlCabecera;

        if (json.status === "success" && json.data.length > 0) {
            json.data.forEach((row, index) => {
                let htmlFila = "<tr>";
                estructuras[hoja].campos.forEach(c => htmlFila += `<td>${row[c] || ""}</td>`);
                htmlFila += `<td>
                    <button type="button" class="btn-edit" onclick="editarRegistro(${index}, ${JSON.stringify(row).replace(/"/g, '&quot;')})">✏️</button>
                    <button type="button" class="btn-delete" onclick="borrarRegistro(${index})">🗑️</button>
                </td></tr>`;
                tablaCuerpo.insertAdjacentHTML("beforeend", htmlFila);
            });
        } else {
            tablaCuerpo.innerHTML = `<tr><td colspan="${estructuras[estructuras[hoja].campos.length + 1]}">No hay registros guardados en esta sección.</td></tr>`;
        }
    } catch (e) {
        tablaCabecera.innerHTML = "<tr><th>Error de conexión con el servidor.</th></tr>";
    }
}

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

window.editarRegistro = (index, rowData) => {
    registroEditandoIndex = index;
    document.getElementById("formTitulo").innerText = "Editar Registro";
    document.getElementById("btnCancelar").style.display = "inline-block";

    const campos = document.querySelectorAll("#contenedorCampos input");
    campos.forEach(input => {
        input.value = rowData[input.name] || "";
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

// --- INSTALACIÓN PWA ---
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
