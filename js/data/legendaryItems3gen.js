/**
 * Mapeo de ítems legendarios de tercera generación y sus componentes
 * Basado en la estructura de Desgarro de Aurene
 */

// Importar materiales básicos de 3ra generación
import { BASIC_MATERIALS_3GEN } from './basicMaterials3gen.js';

// === ÁRBOLES REUTILIZABLES ===

// Don de dominio de jade (reutilizable)
export const GIFT_OF_JADE_MASTERY_TREE = {
  id: 96033,
  name: 'Don de dominio de jade',
  type: 'crafting_material',
  count: 1,
  components: [
    { 
      id: 97433, 
      name: 'Don del Imperio del Dragón', 
      count: 1,
      components: [
        { id: 96722, name: 'Piedra rúnica de jade', count: 100 },
        { id: 97102, name: 'Pedazo de jade puro', count: 200 },
        { id: 96347, name: 'Pedazo de ámbar gris antiguo', count: 100 },
        { id: 97829, name: 'Bendición de la Emperatriz de Jade', count: 5, type: 'account_bound' }
      ]
    },
    { id: 20797, name: 'Esquirla de hematites', count: 200 },
    { 
      id: 97096, 
      name: 'Don de Cantha',
      type: 'account_bound',
      count: 1,
      components: [
        { id: 96993, name: 'Don de la Provincia de Seitung', count: 1, type: 'account_bound' },
        { id: 95621, name: 'Don de la ciudad de Nueva Kaineng', count: 1, type: 'account_bound' },
        { id: 97232, name: 'Don del Bosque Echovald', count: 1, type: 'account_bound' },
        { id: 96083, name: 'Don de Muerte del Dragón', count: 1, type: 'account_bound' }
      ]
    },
    { id: 96978, name: 'Piedra de invocación vetusta', count: 100 }
  ]
};

// Tributo dracónico (reutilizable)
export const DRACONIC_TRIBUTE_TREE = {
  id: 96137,
  name: 'Tributo dracónico',
  type: 'crafting_material',
  count: 1,
  components: [
    { 
      id: 19675,
      name: 'Trébol místico',
      type: 'account_bound',
      count: 38,
      components: [
        { id: 19976, name: 'Moneda mística', count: 38 },
        { id: 19721, name: 'Pegote de ectoplasma', count: 38 },
        { id: 19925, name: 'Esquirla de obsidiana', count: 38 },
        { id: 20799, name: 'Cristal místico', count: 38 }
      ]
    },
    { id: 92687, name: 'Piedra imán dracónica amalgamada', count: 5 },
    { 
      id: 70867,
      name: 'Don de poder condensado',
      type: 'account_bound',
      count: 1,
      components: [
        {
          id: 70801,
          name: 'Don de garras',
          type: 'account_bound',
          count: 1,
          components: [
            { id: 24351, name: 'Garra despiadada', count: 50 },
            { id: 24350, name: 'Garra grande', count: 250 },
            { id: 24349, name: 'Garra afilada', count: 50 },
            { id: 24348, name: 'Garra', count: 50 }
          ]
        },
        {
          id: 75299,
          name: 'Don de escamas',
          type: 'account_bound',
          count: 1,
          components: [
            { id: 24289, name: 'Escama blindada', count: 50 },
            { id: 24288, name: 'Escama grande', count: 250 },
            { id: 24287, name: 'Escama suave', count: 50 },
            { id: 24286, name: 'Escama', count: 50 }
          ]
        },
        {
          id: 71123,
          name: 'Don de huesos',
          type: 'account_bound',
          count: 1,
          components: [
            { id: 24358, name: 'Hueso antiguo', count: 50 },
            { id: 24341, name: 'Hueso grande', count: 250 },
            { id: 24345, name: 'Hueso pesado', count: 50 },
            { id: 24344, name: 'Hueso', count: 50 }
          ]
        },
        {
          id: 75744,
          name: 'Don de colmillos',
          type: 'account_bound',
          count: 1,
          components: [
            { id: 24357, name: 'Colmillo feroz', count: 50 },
            { id: 24356, name: 'Colmillo grande', count: 250 },
            { id: 24355, name: 'Colmillo afilado', count: 50 },
            { id: 24354, name: 'Colmillo', count: 50 }
          ]
        }
      ]
    },
    { 
      id: 76530,
      name: 'Don de magia condensada',
      type: 'account_bound',
      count: 1,
      components: [
        {
          id: 71655,
          name: 'Don de sangre',
          type: 'account_bound',
          count: 1,
          components: [
            { id: 24295, name: 'Vial de sangre poderosa', count: 100 },
            { id: 24294, name: 'Vial de sangre potente', count: 250 },
            { id: 24293, name: 'Vial de sangre espesa', count: 50 },
            { id: 24292, name: 'Vial de sangre', count: 50 }
          ]
        },
        {
          id: 71787,
          name: 'Don de veneno',
          type: 'account_bound',
          count: 1,
          components: [
            { id: 24283, name: 'Vesícula de veneno poderoso', count: 100 },
            { id: 24282, name: 'Vesícula de veneno potente', count: 250 },
            { id: 24281, name: 'Vesícula de veneno llena', count: 50 },
            { id: 24280, name: 'Vesícula de veneno', count: 50 }
          ]
        },
        {
          id: 73236,
          name: 'Don de tótems',
          type: 'account_bound',
          count: 1,
          components: [
            { id: 24300, name: 'Tótem elaborado', count: 100 },
            { id: 24299, name: 'Tótem intrincado', count: 250 },
            { id: 24298, name: 'Tótem grabado', count: 50 },
            { id: 24297, name: 'Tótem', count: 50 }
          ]
        },
        {
          id: 73196,
          name: 'Don de polvo',
          type: 'account_bound',
          count: 1,
          components: [
            { id: 24277, name: 'Montón de polvo cristalino', count: 100 },
            { id: 24276, name: 'Montón de polvo incandescente', count: 250 },
            { id: 24275, name: 'Montón de polvo luminoso', count: 50 },
            { id: 24274, name: 'Montón de polvo radiante', count: 50 }
          ]
        }
      ]
    }
  ]
};

// Estructura base del Don de Aurene (compartida entre todas las armas)
const GIFT_OF_AURENE_BASE = {
  type: 'account_bound',
  count: 1,
  components: [
    // El poema se inyectará aquí
    { id: 79418, name: 'Piedra rúnica mística', count: 100, type: 'crafting_material' },
    { 
      id: 97655,
      name: 'Don de Investigación',
      type: 'account_bound',
      count: 1,
      components: [
        { id: 46747, name: 'Reactivo termocatalítico', count: 250, type: 'crafting_material' },
        { id: 95813, name: 'Reactivo hidrocatalítico', count: 250, type: 'crafting_material' },
        { id: 45178, name: 'Esencia de la suerte exótica', count: 250, type: 'currency' }
      ]
    },
    { 
      id: 76427,
      name: 'Don de la Niebla',
      type: 'account_bound',
      count: 1,
      components: [
        { 
  id: 70528, 
  name: 'Don de gloria', 
  count: 1, 
  type: 'account_bound',
  components: [
    { id: 70820, name: 'Esquirla de gloria', count: 250, type: 'crafting_material' }
  ]
},
        { id: 19678, name: 'Don de la batalla', count: 1, type: 'account_bound' },
        { 
  id: 71008, 
  name: 'Don de guerra', 
  count: 1, 
  type: 'account_bound',
  components: [
    { id: 71581, name: 'Memoria de batalla', count: 250, type: 'crafting_material' }
  ]
},
        { 
          id: 73137,
          name: 'Cubo de energía oscura estabilizada',
          type: 'crafting_material',
          count: 1,
          components: [
            { id: 71994, name: 'Bola de energía oscura', count: 1, type: 'crafting_material' },
            { id: 73248, name: 'Matriz estabilizadora', count: 75, type: 'crafting_material' }
          ]
        }
      ]
    }
  ]
};

// Función auxiliar para obtener el tipo de arma basado en su nombre
function getWeaponType(weaponName) {
  const weaponTypes = {
    'hacha': ['hacha', 'desgarro'],
    'daga': ['daga', 'garra'],
    'maza': ['maza', 'cola'],
    'pistola': ['pistola', 'razonamiento'],
    'cetro': ['cetro', 'sabiduría'],
    'espada': ['espada', 'colmillo'],
    'foco': ['foco', 'mirada'],
    'escudo': ['escudo', 'escama'],
    'antorcha': ['antorcha', 'aliento'],
    'cuerno': ['cuerno', 'voz'],
    'mandoble': ['mandoble', 'mordisco'],
    'martillo': ['martillo', 'peso'],
    'arco_largo': ['arco largo', 'vuelo'],
    'rifle': ['rifle', 'persuasión'],
    'arco_corto': ['arco corto', 'ala'],
    'baston': ['báculo', 'reflexión']
  };

  const lowerName = weaponName.toLowerCase();
  for (const [type, keywords] of Object.entries(weaponTypes)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return type;
    }
  }
  return 'desconocido';
}

// Función auxiliar para obtener el nombre del material por su ID
function getMaterialName(materialId) {
  return BASIC_MATERIALS_3GEN[materialId]?.name || `Material ${materialId}`;
}

// Función para crear el poema específico de cada arma
const createWeaponPoem = (weaponId, weaponName, weaponMaterialId) => {
  // Mapeo de tipos de arma a IDs de poema
  const POEM_IDS = {
    'hacha': 97160,
    'daga': 96187,
    'maza': 96035,
    'pistola': 95809,
    'cetro': 96173,
    'espada': 97335,
    'foco': 96951,
    'escudo': 95740,
    'antorcha': 97257,
    'cuerno': 96341,
    'mandoble': 96036,
    'martillo': 97082,
    'arco_largo': 97800,
    'rifle': 97201,
    'arco_corto': 96849,
    'baston': 95962
  };

  // Obtener el ID del poema basado en el tipo de arma
  const weaponType = getWeaponType(weaponName);
  const poemId = POEM_IDS[weaponType] || 0;

  return {
    id: poemId,
    name: `Poema sobre ${weaponName}`,
    type: 'account_bound',
    count: 1,
    components: [
      { id: 96151, name: 'Relato de aventura', count: 10, type: 'crafting_material' },
      { id: 97790, name: 'Insignia de farolero', count: 10, type: 'crafting_material' },
      { id: weaponMaterialId, name: getMaterialName(weaponMaterialId), count: 1, type: 'crafting_material' },
      { id: 71148, name: 'Hoja de papel supremo', count: 1, type: 'crafting_material' }
    ]
  };
};

// Función principal para crear el don de un arma específica
const createGiftOfAurenesRendering = (weaponId, weaponName, weaponMaterialId) => {
  // Crear una copia profunda del objeto base
  const gift = JSON.parse(JSON.stringify(GIFT_OF_AURENE_BASE));
  
  // Configurar propiedades específicas del arma
  gift.id = weaponId;
  gift.name = `Don de ${weaponName}`;
  
  // Insertar el poema específico del arma al inicio de los componentes
  gift.components.unshift(createWeaponPoem(weaponId, weaponName, weaponMaterialId));
  
  return gift;
};

// Mapeo de armas a sus IDs de material y precursora
const WEAPON_DATA = {
  // Hacha
  'Desgarro de Aurene': { id: 96937, materialId: 45845, precursorId: 97449 },
  // Daga
  'Garra de Aurene': { id: 96203, materialId: 45846, precursorId: 95967 },
  // Maza
  'Cola de Aurene': { id: 95612, materialId: 45852, precursorId: 96827 },
  // Pistola
  'Razonamiento de Aurene': { id: 95808, materialId: 45833, precursorId: 96915 },
  // Cetro
  'Sabiduría de Aurene': { id: 96221, materialId: 45885, precursorId: 96193 },
  // Espada
  'Colmillo de Aurene': { id: 95675, materialId: 45848, precursorId: 95994 },
  // Foco
  'Mirada de Aurene': { id: 97165, materialId: 45884, precursorId: 96303 },
  // Escudo
  'Escama de Aurene': { id: 96028, materialId: 45858, precursorId: 97691 },
  // Antorcha
  'Aliento de Aurene': { id: 97099, materialId: 45838, precursorId: 96925 },
  // Cuerno de guerra
  'Voz de Aurene': { id: 97783, materialId: 45839, precursorId: 97513 },
  // Mandoble
  'Mordisco de Aurene': { id: 96356, materialId: 45847, precursorId: 96357 },
  // Martillo
  'Peso de Aurene': { id: 95684, materialId: 45851, precursorId: 95920 },
  // Arco largo
  'Vuelo de Aurene': { id: 97590, materialId: 45841, precursorId: 95834 },
  // Rifle
  'Persuasión de Aurene': { id: 97377, materialId: 45834, precursorId: 97267 },
  // Arco corto
  'Ala de Aurene': { id: 97077, materialId: 45842, precursorId: 96330 },
  // Báculo
  'Reflexión de Aurene': { id: 96652, materialId: 45887, precursorId: 95814 }
};

// Función para crear la entrada de un arma legendaria
const createLegendaryWeapon = (weaponName) => {
  const data = WEAPON_DATA[weaponName];
  if (!data) return null;
  
  return {
    id: data.id,
    name: weaponName,
    type: 'legendary',
    components: [
      { ...GIFT_OF_JADE_MASTERY_TREE },
      { ...DRACONIC_TRIBUTE_TREE },
      createGiftOfAurenesRendering(data.id, weaponName, data.materialId),
      { 
        id: data.precursorId, 
        name: `${weaponName.replace(' de Aurene', ' Dracónic' + (weaponName.endsWith('a') ? 'a' : 'o'))} (precursora)`, 
        type: 'weapon' 
      }
    ]
  };
};

// Objeto principal de ítems legendarios de 3ra generación
export const LEGENDARY_ITEMS_3GEN = Object.fromEntries(
  Object.keys(WEAPON_DATA).map(weaponName => {
    const weapon = createLegendaryWeapon(weaponName);
    return [weapon.id, weapon];
  })
);

// Funciones de utilidad
export function getLegendary3GenItem(itemId) {
  return LEGENDARY_ITEMS_3GEN[itemId] || null;
}

export function isLegendary3GenItem(itemId) {
  return itemId in LEGENDARY_ITEMS_3GEN;
}

export function isBasic3GenMaterial(itemId) {
  // Depuración para Vial de sangre espesa
  if (itemId === 24293) {
    console.log('[DEBUG] isBasic3GenMaterial para 24293:', {
      exists: String(itemId) in BASIC_MATERIALS_3GEN,
      BASIC_MATERIALS_3GEN: BASIC_MATERIALS_3GEN[String(itemId)],
      keys: Object.keys(BASIC_MATERIALS_3GEN).filter(k => k === '24293')
    });
  }
  return String(itemId) in BASIC_MATERIALS_3GEN;
}
