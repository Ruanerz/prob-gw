// --- Lógica de Fractales Gold ---
// IDs de ítems relevantes para fractales (basado en los nombres de la tabla de promedios)
// Puedes agregar/quitar ítems aquí según tus necesidades
// Ingredientes comerciables válidos para fractales, cotejados con dones.js
// Lista exacta y en orden según indicación del usuario
export const FRACTALES_ITEMS = [
  { key: 'hueso', id: 24341, nombre: 'Hueso grande' },
  { key: 'veneno', id: 24282, nombre: 'Vesícula de veneno potente' },
  { key: 'polvo', id: 24276, nombre: 'Montón de polvo incandescente' },
  { key: 'totem', id: 24299, nombre: 'Tótem intrincado' },
  { key: 'garra', id: 24350, nombre: 'Garra grande' },
  { key: 'colmillo', id: 24356, nombre: 'Colmillo grande' },
  { key: 'sangre', id: 24294, nombre: 'Vial de sangre potente' },
  { key: 'escama', id: 24288, nombre: 'Escama grande' },
  { key: 'infusion_mas1', id: 49424, nombre: 'Infusión +1' }
];

// Datos de stacks de fractales obtenidos de registros históricos
// Se utilizan para calcular promedios de materiales y oro
export const FRACTAL_STACKS = [
  {
    stacks: 55,
    data: {
      oro_de_basura: 59510000,
      garra: 4625.45,
      totem: 4360.23,
      sangre: 5005.12,
      veneno: 4610.56,
      hueso: 4685.78,
      escama: 4750.98,
      colmillo: 4845.01,
      polvo: 4855.34,
      infusion_mas1: 31039.56,
      llaves_encriptacion: 1426.12,
      empíreos: 8445.67
    }
  },
  {
    stacks: 17,
    data: {
      oro_de_basura: 18068500,
      garra: 1340.23,
      totem: 1640.45,
      sangre: 1385.12,
      veneno: 1475.56,
      hueso: 1380.78,
      escama: 1585.98,
      colmillo: 1295.01,
      polvo: 1540.34,
      infusion_mas1: 9799.56,
      llaves_encriptacion: 427.12,
      empíreos: 4125.67
    }
  },
  {
    stacks: 32,
    data: {
      oro_de_basura: 34443500,
      recetas_ascendentes: 65.23,
      infusion_mas1: 18256.56,
      llaves_encriptacion: 783.12,
      hueso: 2685.78,
      veneno: 2775.98,
      polvo: 2665.34,
      totem: 2815.01,
      garra: 2730.45,
      colmillo: 2685.12,
      sangre: 2545.56,
      escama: 2645.98,
      hematites: 8090.12,
      empíreos: 7645.67,
      dragonita: 7645.67,
      sacos_reliquias: 538.12,
      saco_equipamiento: 4.01,
      miniatura: 154
    }
  },
  {
    stacks: 4000,
    data: {
      oro_de_basura: 4283407500,
      recetas_ascendentes: 7555,
      infusion_mas1: 2263678,
      llaves_encriptacion: 99812,
      hueso: 334960,
      veneno: 337195,
      polvo: 337825,
      totem: 338230,
      garra: 339190,
      colmillo: 336540,
      sangre: 339475,
      escama: 339260,
      hematites: 1013835,
      empíreos: 1012619,
      dragonita: 1006125,
      sacos_reliquias: 66795,
      saco_equipamiento: 171,
      miniatura: 19787
    }
  }
];
// Ítems no comerciables o no relevantes para fractales (comentados)
// { key: 'infusion_mas1', id: 49424, nombre: 'Infusión +1' },
// { key: 'empíreos', id: 46735, nombre: 'Fragmento empíreo' },
// { key: 'dragonita', id: 46733, nombre: 'Mineral de dragonita' },
// { key: 'hematites', id: 46731, nombre: 'Montón de polvo de hematites' },
// { key: 'llaves_encriptacion', id: 70438, nombre: 'Clave de encriptación fractal' },
// { key: 'oro_de_basura', id: 0, nombre: 'Oro crudo' },
// { key: 'recetas_asce', id: 0, nombre: 'Recetas ascendidas' },
// { key: 'sacos_reliquias', id: 79792, nombre: 'Puñado de reliquias fractales' },
// { key: 'saco_equipamiento', id: 71510, nombre: 'Saco de equipo excepcional' },
// { key: 'miniatura', id: 74268, nombre: 'Miniatura del profesor Miau' }


// Utilidad para obtener solo los ítems con ID válido de mercado
export function getItemsConMercado() {
  return FRACTALES_ITEMS.filter(item => item.id && item.id > 0);
}

// Utilidad para mapear key a nombre
export function keyToNombre(key) {
  const item = FRACTALES_ITEMS.find(i => i.key === key);
  return item ? item.nombre : key;
}
