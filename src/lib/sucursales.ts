// Mapa completo de índices de sucursal → nombres legibles
// Fuente: mdl_user_info_field.param1 donde shortname = 'sucursales'
// Los índices son posiciones base-1 en la lista ordenada de Moodle.

export const SUCURSAL_MAP: Record<string, string> = {
  // Índice 1 es placeholder "Seleccionar sucursal" — se ignora
  "2":  "Recursos humanos",
  "3":  "Fábrica",
  "4":  "Marketing",
  "5":  "Comercial",
  "6":  "Mantenimiento",
  "7":  "Contable",
  "8":  "Tesorería",
  "9":  "POSADAS | Bolívar 1421",
  "10": "POSADAS | Bolívar 1879",
  "11": "POSADAS | Buenos Aires esq. Córdoba",
  "12": "POSADAS | COCOMAROLA I – GHANDI | Av. Cocomarola 6669",
  "13": "POSADAS | COCOMAROLA II – CALLE 148 A | Av. Cocomarola 7371",
  "14": "POSADAS | Junín esq. Córdoba",
  "15": "POSADAS | COSTANERA | Av. Obispo Jorge Kemerer 1541",
  "16": "POSADAS | Av. Francisco de Haro esq. Chubut",
  "17": "POSADAS | Hipermercado Libertad",
  "18": "POSADAS | ITAEMBÉ GUAZÚ | Los Lirios esq. Las Calandrias",
  "19": "POSADAS | ITAEMBÉ MINÍ | Av. 147 Nº 8596",
  "20": "POSADAS | Av. López y Planes 3058",
  "21": "POSADAS | MIGUEL LANÚS | Av. Juan Domingo Perón 1915",
  "22": "POSADAS | Av. Rademacher esq. Cabred",
  "23": "POSADAS | Av. Roque Perez 1651",
  "24": "POSADAS | RUTA 12 | Av. Fernando \"Tulo\" Llamosas",
  "25": "POSADAS | Av. San Martín esq. Av. Chacabuco",
  "26": "POSADAS | Av. Santa Catalina esq. Av. Ituzaingó",
  "27": "POSADAS | SHELL LÓPEZ Y PLANES | Av. López y Planes esq. Semilla",
  "28": "POSADAS | TACUARÍ I - SAN MARTÍN | Av. T. de Tacuarí 4090",
  "29": "POSADAS | TACUARÍ II - JAURETCHE | Av. Tambor de Tacuarí 6384",
  "30": "POSADAS | Av. Tierra del Fuego esq. Misiones",
  "31": "POSADAS | Av. Urquiza 4726",
  "32": "POSADAS | Av. Uruguay 2683",
  "33": "POSADAS | VILLA CABELLO | Av. López y Planes 7193",
  "34": "POSADAS | Av. Lucas Braulio Areco 5819 esq. Av. Sta. Cruz",
  "35": "POSADAS | AV. 213 | Av. Alicia M. de Justo 213",
  "36": "POSADAS | SAN ISIDRO | Av. Alicia M. de Justo 9048",
  "37": "2 DE MAYO | Av. Del Colono 1190",
  "38": "25 DE MAYO | Av. San Martín esq. Juan D. Perón",
  "39": "ALEM I – ACCESO RUTA 14 | Belgrano 1557",
  "40": "ALEM II - CENTRO | Belgrano 201",
  "41": "ANDRESITO | Av. Los Pioneros (frente a la plaza)",
  "42": "APÓSTOLES | Belgrano 1265",
  "43": "APÓSTOLES II | Av. Humada y Av. Brasil.",
  "44": "ARISTÓBULO | Av. Las Américas esq. Nicolás Avellaneda",
  "45": "CAMPO GRANDE | Av. Los Cafetales S/N",
  "46": "CAMPO VIERA | Avenida del Té 641",
  "47": "CANDELARIA | Mitre esq. Tarelli",
  "48": "CAPIOVÍ | Av. San Luis Gonzaga y Guaraní",
  "49": "CERRO AZUL | Chacabuco 558",
  "50": "CONCEPCIÓN | Rivadavia S/N",
  "51": "EL ALCÁZAR | Ruta Provincial 11",
  "52": "EL SOBERBIO | Av. San Martín S/N",
  "53": "ELDORADO I – CENTRO KM9 | Av. San Martín 1702",
  "54": "ELDORADO II – COSTANERA KM3 | Av. San Martín 1626",
  "55": "GARUHAPÉ | Av. República Argentina esq. España",
  "56": "GARUPÁ I – 30 VIVIENDAS | Av. Las Américas 30 Viv. Mz.A4",
  "57": "GARUPÁ II – B° DON SANTIAGO | Av. Las Américas y Brown",
  "58": "GARUPÁ III – STA. HELENA | Av. Ruta 105 y Av. Santa Helena",
  "59": "GOB. ROCA | Av. San Martín (frente al Banco Nación)",
  "60": "IGUAZÚ I - CENTRO | Av. Córdoba 170",
  "61": "IGUAZÚ II - SHOPPING | Av. Victoria Aguirre esq. Rep. de Italia",
  "62": "IGUAZÚ III – SANTA MARÍA | Julio Silveira esq. Santa María del Iguazú",
  "63": "IGUAZÚ IV – MINI DUOMO | Aeropuerto Cataratas del Iguazú",
  "64": "IGUAZÚ V - REP. ARGENTINA | Av. Néstor Kirchner S/N",
  "65": "IGUAZÚ VI - AV. BRASIL | Av. Brasil 266",
  "66": "JARDÍN AMÉRICA | Av. Libertad 508",
  "67": "MONTECARLO | Av. El Libertador 2860",
  "68": "OBERÁ I – SARMIENTO | Av. Sarmiento 1411",
  "69": "OBERÁ II - LIBERTAD | Av. Libertad 1086",
  "70": "OBERÁ III - CENTRO | Av. Libertad y 9 de Julio",
  "71": "OBERÁ IV – LAS AMÉRICAS | Av. de Las Américas 576",
  "72": "OBERÁ V – JOSÉ INGENIEROS | Av. José Ingenieros 413",
  "73": "PUERTO ESPERANZA | Boulevard 20 de junio N°1",
  "74": "PUERTO RICO I - CENTRO | Av. San Martín 2272",
  "75": "PUERTO RICO II - COSTANERA | Av. San Martín 1300",
  "76": "RUIZ DE MONTOYA | Av. Los Inmigrantes S/N - Plaza",
  "77": "SALTO ENCANTADO | Colectora 8 de Septiembre",
  "78": "SAN ANTONIO | Av. Vuelta de Obligado (frente a la Aduana)",
  "79": "SAN IGNACIO | Alberdi casi Av. San Martín",
  "80": "SAN JAVIER | Sarmiento 490",
  "81": "SAN PEDRO | Av. Güemes 1098 - Local 1",
  "82": "SAN VICENTE I – ROTONDA SAN PEDRO | Av. Libertador 1731",
  "83": "SAN VICENTE II - CENTRO | Av. Libertador 869",
  "84": "ITUZAINGÓ | Bolívar 1602",
  "85": "SANTO TOMÉ | Av. San Martín 717",
  "86": "VIRASORO | Av. Lavalle esq. Bonpland",
  "87": "CONCORDIA | Pellegrini 594",
  "88": "FEDERACIÓN | Av. Entre Ríos 170",
  "89": "RESISTENCIA I – PASEO LIBERTAD | Paseo Libertad",
  "90": "RESISTENCIA II - CENTRO | Av. Paraguay Nº60",
  "91": "RESISTENCIA III – CASTELLI | Av. Castelli 299",
  "92": "DUOMO DUO - EL PATIO | Parque Paraguayo",
  "93": "DUOMO DUO - PETRI | Acceso Oeste y Calle 201",
  "94": "VILLA ANGELA | Mitre esq. 9 de Julio",
  // Índice 95 = "Supervisor" — rol especial, se ignora en listas
  "96": "IRIGOYEN I - Av. Libertador 6, Local Nº2",
  "97": "WANDA I - Av. Leandro N. Alem S/N",
  "98": "Franquiciados",
};

// Índices a ignorar en toda lógica de matching y visualización
const IGNORED_INDICES = new Set(["1", "95"]);

/**
 * Convierte un string de índices separados por coma en un array de nombres legibles.
 * Filtra automáticamente los índices placeholder (1) y supervisor (95).
 */
export function getSucursalNames(indicesStr: string | undefined | null): string[] {
  if (!indicesStr) return [];
  return indicesStr
    .split(",")
    .map((i) => i.trim())
    .filter((i) => i !== "" && !IGNORED_INDICES.has(i))
    .map((i) => SUCURSAL_MAP[i] || `Sucursal ${i}`);
}

/**
 * Convierte un string de índices en un string legible separado por " | ".
 * Si no hay sucursales, devuelve "No asignada".
 */
export function getSucursalLabel(indicesStr: string | undefined | null): string {
  const names = getSucursalNames(indicesStr);
  return names.length > 0 ? names.join(" | ") : "No asignada";
}

/**
 * Verifica si dos strings de índices de sucursal tienen al menos un índice en común.
 * Ignora los índices placeholder (1) y supervisor (95).
 */
export function sharesBranch(
  teacherIndicesStr: string | undefined | null,
  studentIndicesStr: string | undefined | null
): boolean {
  if (!teacherIndicesStr || !studentIndicesStr) return false;
  const teacherBranches = new Set(
    teacherIndicesStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "" && !IGNORED_INDICES.has(s))
  );
  const studentBranches = studentIndicesStr
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "" && !IGNORED_INDICES.has(s));
  return studentBranches.some((b) => teacherBranches.has(b));
}

/**
 * Devuelve la lista de nombres únicos de sucursales para usar en el selector de filtros.
 * Se construye a partir de la lista real de estudiantes cargados.
 */
export function buildSucursalOptions(
  indicesStrList: (string | undefined | null)[]
): { value: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const indicesStr of indicesStrList) {
    if (!indicesStr) continue;
    indicesStr
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i !== "" && !IGNORED_INDICES.has(i))
      .forEach((i) => {
        if (!seen.has(i)) {
          seen.set(i, SUCURSAL_MAP[i] || `Sucursal ${i}`);
        }
      });
  }
  return Array.from(seen.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

/**
 * Añade el token de autenticación a una URL de pluginfile.php de Moodle.
 * Si la URL ya tiene token o no es de pluginfile, la devuelve sin cambios.
 */
export function addMoodleTokenToUrl(url: string | undefined | null, token: string): string {
  if (!url) return "";
  if (!token) return url;
  // Solo modificar URLs de pluginfile.php
  if (!url.includes("pluginfile.php")) return url;
  // Si ya tiene token, no duplicar
  if (url.includes("token=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}
