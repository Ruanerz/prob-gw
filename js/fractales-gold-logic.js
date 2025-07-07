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
// Ítems no comerciables o no relevantes para fractales (comentados)
// { key: 'infusion_mas1', id: 49424, nombre: 'Infusión +1' },
// { key: 'empireos', id: 77302, nombre: 'Fragmento de empíreo' },
// { key: 'dragonita', id: 43773, nombre: 'Mineral de dragonita' },
// { key: 'hematites', id: 43772, nombre: 'Fragmento de hematites' },
// { key: 'llaves_de_enc', id: 0, nombre: 'Llaves de encriptación' },
// { key: 'oro_de_basura', id: 0, nombre: 'Oro crudo' },
// { key: 'recetas_asce', id: 0, nombre: 'Recetas ascendidas' },
// { key: 'sacos_de_reli', id: 0, nombre: 'Sacos de reliquias' },
// { key: 'saco_de_equi', id: 0, nombre: 'Saco de equipo excepcional' },
// { key: 'miniatura_de_miau', id: 0, nombre: 'Miniatura de miau' }


// Utilidad para obtener solo los ítems con ID válido de mercado
export function getItemsConMercado() {
  return FRACTALES_ITEMS.filter(item => item.id && item.id > 0);
}

// Utilidad para mapear key a nombre
export function keyToNombre(key) {
  const item = FRACTALES_ITEMS.find(i => i.key === key);
  return item ? item.nombre : key;
}
