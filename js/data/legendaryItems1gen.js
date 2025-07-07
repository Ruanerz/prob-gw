/**
 * Mapeo de ítems legendarios y sus componentes
 * Fuente: https://wiki-es.guildwars2.com/wiki/Crep%C3%BUsculo
 */

// Árbol reutilizable: Don del dominio
export const GIFT_OF_MASTERY_TREE = {
  id: 19674,
  name: 'Don del dominio',
  type: 'account_bound',
  count: 1,
  components: [
    { id: 19925, name: 'Esquirla de obsidiana', count: 250 },
    { id: 20797, name: 'Esquirla de hematites', count: 1 },
    { id: 19677, name: 'Don de la exploración', count: 1 },
    { id: 19678, name: 'Don de la batalla', count: 1 }
  ]
};

// Árbol reutilizable: Don de la suerte
export const GIFT_OF_FORTUNE_TREE = {
  id: 19626,
  name: 'Don de la suerte',
  type: 'crafting_material',
  count: 1,
  components: [
    { id: 19721, name: 'Pegote de ectoplasma', count: 250 },
    {
      id: 19675,
      name: 'Trébol místico',
      type: 'account_bound',
      count: 77,
      components: [
        { id: 19976, name: 'Moneda mística', count: 250 },
        { id: 19721, name: 'Pegote de ectoplasma', count: 250 },
        { id: 19925, name: 'Esquirla de obsidiana', count: 250 },
        { id: 20796, name: 'Piedra filosofal', count: 1500 }
      ]
    },
    {
      id: 19673,
      name: 'Don de la magia',
      type: 'crafting_material',
      count: 1,
      components: [
        { id: 24295, name: 'Vial de sangre poderosa', count: 250 },
        { id: 24283, name: 'Vesícula de veneno poderoso', count: 250 },
        { id: 24300, name: 'Tótem elaborado', count: 250 },
        { id: 24277, name: 'Montón de polvo cristalino', count: 250 }
      ]
    },
    {
      id: 19672,
      name: 'Don del poder',
      type: 'crafting_material',
      count: 1,
      components: [
        { id: 24351, name: 'Colmillo feroz', count: 250 },
        { id: 24289, name: 'Escama blindada', count: 250 },
        { id: 24357, name: 'Garra despiadada', count: 250 },
        { id: 24358, name: 'Hueso antiguo', count: 250 }
      ]
    }
  ]
};

// Incineradora - Daga legendaria Gen 1
const INCINERATOR_TREE = {
  id: 30687, // ID de la Incineradora
  name: 'Incineradora',
  type: 'legendary',
  components: [
    GIFT_OF_MASTERY_TREE,
    GIFT_OF_FORTUNE_TREE,
    {
      id: 19645, // Don de Incineradora
      name: 'Don de Incineradora',
      type: 'crafting_material',
      count: 1,
      components: [
        { id: 19676, name: 'Piedra rúnica helada', count: 100 },
        { id: 24548, name: 'Sello superior de fuego', count: 1 },
        {
          id: 19621, // Don del metal
          name: 'Don del metal',
          type: 'crafting_material',
          count: 1,
          components: [
            { id: 19685, name: 'Lingote de oricalco', count: 250 },
            { id: 19684, name: 'Lingote de mithril', count: 250 },
            { id: 19681, name: 'Lingote de aceroscuro', count: 250 },
            { id: 19686, name: 'Lingote de platino', count: 250 }
          ]
        },
        {
          id: 19634, // Vial de llama líquida 
          name: 'Vial de llama líquida',
          type: 'crafting_material',
          count: 1,
          components: [
            { id: 19633, name: 'Vial de azogue', count: 1 },
            { id: 12544, name: 'Chile fantasma', count: 250 },
            { id: 24315, name: 'Piedra imán fundida', count: 100 },
            { id: 24325, name: 'Piedra imán de destructor', count: 100 }
          ]
        }
      ]
    },
    {
      id: 29167, // Precursor - Chispa 
      name: 'Chispa',
      type: 'weapon',
      count: 1
    }
  ]
};

export const LEGENDARY_ITEMS = {
  // El Festín - Maza legendaria Gen 1
  30692: {
    id: 30692,
    name: 'El Festín',
    type: 'legendary_mace',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19650,  // Don de El Festín
        name: 'Don de El Festín',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24607, name: 'Sello superior de energía', count: 1 },
          {
            id: 19621,  // Don del metal
            name: 'Don del metal',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 19684, name: 'Lingote de mithril', count: 250 },
              { id: 19681, name: 'Lingote de aceroscuro', count: 250 },
              { id: 19686, name: 'Lingote de platino', count: 250 }
            ]
          },
          {
            id: 19635,  // Don del entretenimiento
            name: 'Don del entretenimiento',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19665, name: 'Don del noble', count: 1 },
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 19746, name: 'Haz de gasa', count: 250 },
              { id: 20000, name: 'Caja de diversión', count: 5 }
            ]
          }
        ]
      },
      {
        id: 29173,  // Precursor - El Energizador
        name: 'El Energizador (precursora)',
        type: 'weapon',
        count: 1
      }
    ]
  },
  
  // Haz - Bastón legendario Gen 1
  30699: {
    id: 30699,
    name: 'Haz',
    type: 'legendary_staff',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19655,  // Don de Haz
        name: 'Don de Haz',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24554, name: 'Sello superior de aire', count: 1 },
          {
            id: 19621,  // Don del metal
            name: 'Don del metal',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 19684, name: 'Lingote de mithril', count: 250 },
              { id: 19681, name: 'Lingote de aceroscuro', count: 250 },
              { id: 19686, name: 'Lingote de platino', count: 250 }
            ]
          },
          {
            id: 19639,  // Don del relámpago
            name: 'Don del relámpago',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19664, name: 'Don de Ascalon', count: 1 },
              { id: 24305, name: 'Piedra imán cargada', count: 100 },
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 19746, name: 'Haz de gasa', count: 250 }
            ]
          }
        ]
      },
      {
        id: 29181,  // Precursor - Zas
        name: 'Zas (precursora)',
        type: 'weapon',
        count: 1
      }
    ]
  },
  
  // Las Profecías del Buscador de la Llama - Foco legendario Gen 1
  30696: {
    id: 30696,
    name: 'Las Profecías del Buscador de la Llama',
    type: 'legendary_focus',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19653,  // Don de Las Profecías del Buscador de la Llama
        name: 'Don de Las Profecías del Buscador de la Llama',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24601, name: 'Sello superior de batalla', count: 1 },
          {
            id: 19621,  // Don del metal
            name: 'Don del metal',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 19684, name: 'Lingote de mithril', count: 250 },
              { id: 19681, name: 'Lingote de aceroscuro', count: 250 },
              { id: 19686, name: 'Lingote de platino', count: 250 }
            ]
          },
          {
            id: 19629,  // Don de la historia
            name: 'Don de la historia',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19664, name: 'Don de Ascalon', count: 1 },
              { id: 24277, name: 'Montón de polvo cristalino', count: 250 },
              { id: 19732, name: 'Retal de cuero curado endurecido', count: 250 },
              { id: 24310, name: 'Piedra imán de ónice', count: 100 }
            ]
          }
        ]
      },
      {
        id: 29177,  // Precursor - El Elegido
        name: 'El Elegido (precursora)',
        type: 'weapon',
        count: 1
      }
    ]
  },
  
  // El Juglar - Arco corto legendario Gen 1
  30688: {
    id: 30688,
    name: 'El Juglar',
    type: 'legendary_shortbow',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19646,  // Don del Juglar
        name: 'Don del Juglar',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24607, name: 'Sello superior de energía', count: 1 },
          {
            id: 19623,  // Don de la energía
            name: 'Don de la energía',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 24277, name: 'Montón de polvo cristalino', count: 250 },
              { id: 24295, name: 'Montón de polvo incandescente', count: 250 },
              { id: 24283, name: 'Montón de polvo luminoso', count: 250 },
              { id: 24289, name: 'Montón de polvo radiante', count: 250 }
            ]
          },
          {
            id: 19630,  // Don de la música
            name: 'Don de la música',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19665, name: 'Don del noble', count: 1 },
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 19746, name: 'Haz de gasa', count: 250 },
              { id: 24502, name: 'Orbe de ópalo', count: 100 }
            ]
          }
        ]
      },
      {
        id: 29184,  // Precursor - El Bardo
        name: 'El Bardo (precursora)',
        type: 'weapon',
        count: 1
      }
    ]
  },
  
  // El Meteorológico - Cetro legendario Gen 1
  30695: {
    id: 30695,
    name: 'Meteorológico',
    type: 'legendary_scepter',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19652,  // Don del Meteorológico
        name: 'Don del Meteorológico',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24554, name: 'Sello superior de aire', count: 1 },
          {
            id: 19623,  // Don de la energía
            name: 'Don de la energía',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 24277, name: 'Montón de polvo cristalino', count: 250 },
              { id: 24295, name: 'Montón de polvo incandescente', count: 250 },
              { id: 24283, name: 'Montón de polvo luminoso', count: 250 },
              { id: 24289, name: 'Montón de polvo radiante', count: 250 }
            ]
          },
          {
            id: 19637,  // Don del clima
            name: 'Don del clima',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19671, name: 'Don del conocimiento', count: 1 },
              { id: 24305, name: 'Piedra imán cargada', count: 100 },
              { id: 19732, name: 'Trozos de cuero endurecido', count: 250 },
              { id: 19685, name: 'Lingote de oricalco', count: 250 }
            ]
          }
        ]
      },
      {
        id: 29176,  // Precursor - Tormenta
        name: 'Tormenta (precursora)',
        type: 'weapon',
        count: 1
      }
    ]
  },
  
  // Colmilloescarcha - Hacha legendaria Gen 1
  30684: {
    id: 30684,
    name: 'Colmilloescarcha',
    type: 'legendary_axe',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19625,
        name: 'Don de Colmilloescarcha',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24555, name: 'Sello superior de hielo', count: 1 },
          {
            id: 19621,
            name: 'Don del metal',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 19684, name: 'Lingote de mithril', count: 250 },
              { id: 19681, name: 'Lingote de aceroscuro', count: 250 },
              { id: 19686, name: 'Lingote de platino', count: 250 }
            ]
          },
          {
            id: 19624,
            name: 'Don del hielo',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19670, name: 'Don del santuario', count: 1 },
              { id: 24340, name: 'Piedra imán corrupta', count: 100 },
              { id: 24320, name: 'Piedra imán glacial', count: 100 },
              { id: 19685, name: 'Fragmento de oricalco', count: 250 },
            ]
          }
        ]
      },
      {
        id: 29166,
        name: 'Diente de colmillo escarcha (precursora)',
        type: 'precursor',
        count: 1
      }
    ]
  },
  // Incineradora - Daga legendaria Gen 1
  30687: INCINERATOR_TREE,

  // El Bifrost - Bastón mágico legendario Gen 1
  30698: {
    id: 30698,
    name: 'El Bifrost',
    type: 'legendary',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19654, // Don del Bifrost
        name: 'Don del Bifrost',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24572, name: 'Sello superior de invalidación', count: 1 },
          {
            id: 19623, // Don de la energía
            name: 'Don de la energía',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 24274, name: 'Montón de polvo radiante', count: 250 },
              { id: 24275, name: 'Montón de polvo luminoso', count: 250 },
              { id: 24276, name: 'Montón de polvo incandescente', count: 250 },
              { id: 24277, name: 'Montón de polvo cristalino', count: 250 }
            ]
          },
          {
            id: 19638, // Don del color
            name: 'Don del color',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19669, name: 'Don de Zhaitan', count: 1 },
              { id: 24522, name: 'Orbe de ópalo', count: 100 },
              { id: 24277, name: 'Montón de polvo cristalino', count: 250 },
              { id: 20323, name: 'Tinte sin identificar', count: 100 }
            ]
          }
        ]
      },
      {
        id: 29180, // La Leyenda (precursora)
        name: 'La Leyenda (precursora)',
        type: 'weapon',
        count: 1
      }
    ]
  },

  // El Soñador - Arco corto legendario Gen 1
  30686: {
    id: 30686,
    name: 'El Soñador',
    type: 'legendary',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19660, // Don del Soñador
        name: 'Don del Soñador',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24571, name: 'Sello superior de pureza', count: 1 },
          {
            id: 19622, // Don de la madera
            name: 'Don de la madera',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19712, name: 'Tabla de madera antigua', count: 250 },
              { id: 19709, name: 'Tabla de madera ancestral', count: 250 },
              { id: 19711, name: 'Tabla de madera sólida', count: 250 },
              { id: 19714, name: 'Tabla de madera curtida', count: 250 }
            ]
          },
          {
            id: 19628, // Estatua de unicornio
            name: 'Estatua de unicornio',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19667, name: 'Don de las espinas', count: 1 },
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 24522, name: 'Orbe de ópalo', count: 100 },
              { id: 24512, name: 'Orbe de crisocola', count: 100 }
            ]
          }
        ]
      },
      {
        id: 29172, // El Amante (precursora)
        name: 'El Amante (precursora)',
        type: 'weapon',
        count: 1
      }
    ]
  },

  // El Depredador - Rifle legendario Gen 1
  30694: {
    id: 30694,
    name: 'El Depredador',
    type: 'legendary',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19661, // Don del Depredador
        name: 'Don del Depredador',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24615, name: 'Sello superior de fuerza', count: 1 },
          {
            id: 19622, // Don de la madera
            name: 'Don de la madera',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19712, name: 'Tabla de madera antigua', count: 250 },
              { id: 19709, name: 'Tabla de madera ancestral', count: 250 },
              { id: 19711, name: 'Tabla de madera sólida', count: 250 },
              { id: 19714, name: 'Tabla de madera curtida', count: 250 }
            ]
          },
          {
            id: 19636, // Don del sigilo
            name: 'Don del sigilo',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19671, name: 'Don del conocimiento', count: 1 },
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 12512, name: 'Trufa orriana', count: 250 },
              { id: 24310, name: 'Piedra imán de ónice', count: 100 }
            ]
          }
        ]
      },
      {
        id: 29175, // El Cazador (precursora)
        name: 'El Cazador (precursora)',
        type: 'weapon',
        count: 1
      }
    ]
  },

  // Kraitkin - Arpón legendario Gen 1
  30701: {
    id: 30701,
    name: 'Kraitkin',
    type: 'legendary',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      // Don de Kraitkin
      {
        id: 19658,
        name: 'Don de Kraitkin',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24632, name: 'Sello superior de veneno', count: 1 },
          {
            id: 19623,
            name: 'Don de la energía',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 24277, name: 'Montón de polvo cristalino', count: 250 },
              { id: 24276, name: 'Montón de polvo incandescente', count: 250 },
              { id: 24275, name: 'Montón de polvo luminoso', count: 250 },
              { id: 24274, name: 'Montón de polvo radiante', count: 250 }
            ]
          },
          // Estatua de anguila
          {
            id: 19642,
            name: 'Estatua de anguila',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19666, name: 'Don del herrador', count: 1 },
              { id: 24289, name: 'Escama blindada', count: 250 },
              { id: 19737, name: 'Retal de cuero curado endurecido', count: 250 },
              { id: 19685, name: 'Lingote de oricalco', count: 250 }
            ]
          }
        ]
      },
      // Precursor: Veneno
      { 
        id: 29183, 
        name: 'Veneno (precursora)',
        type: 'weapon',
        count: 1 
      }
    ]
  },

  // Kamohoali'i Kotaki - Arpón legendario Gen 1
  30691: {
    id: 30691,
    name: 'Kamohoali\'i Kotaki',
    type: 'legendary',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      // Don de Kamohoali'i Kotaki
      {
        id: 19657,
        name: 'Don de Kamohoali\'i Kotaki',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24612, name: 'Sello superior de agonía', count: 1 },
          {
            id: 19621,
            name: 'Don del metal',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 19684, name: 'Lingote de mithril', count: 250 },
              { id: 19681, name: 'Lingote de aceroscuro', count: 250 },
              { id: 19686, name: 'Lingote de platino', count: 250 }
            ]
          },
          // Estatua de tiburón
          {
            id: 19641,
            name: 'Estatua de tiburón',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19669, name: 'Don de Zhaitan', count: 1 },
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 24289, name: 'Escama blindada', count: 250 },
              { id: 24295, name: 'Vial de sangre poderosa', count: 250 }
            ]
          }
        ]
      },
      // Precursor: Carcharias
      { 
        id: 29171, 
        name: 'Carcharias (precursora)',
        type: 'weapon',
        count: 1 
      }
    ]
  },

  // Frenesí - Daga legendaria Gen 1
  30697: {
    id: 30697,
    name: 'Frenesí',
    type: 'legendary',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      // Don del Frenesí
      {
        id: 19659,
        name: 'Don del Frenesí',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24561, name: 'Sello superior de rabia', count: 1 },
          {
            id: 19622,
            name: 'Don de la madera',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19712, name: 'Tabla de madera antigua', count: 250 },
              { id: 19709, name: 'Tabla de madera ancestral', count: 250 },
              { id: 19711, name: 'Tabla de madera sólida', count: 250 },
              { id: 19714, name: 'Tabla de madera curtida', count: 250 }
            ]
          },
          {
            id: 19643,
            name: 'Don del agua',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19670, name: 'Don del Santuario', count: 1 },
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 24315, name: 'Piedra imán fundida', count: 250 },
              { id: 24320, name: 'Piedra imán glacial', count: 100 }
            ]
          }
        ]
      },
      // Precursor: Rabia
      { id: 29183, name: 'Veneno (precursora)',
        type: 'weapon',
        count: 1 }
    ]
  },
  
  // Kudzu - Arco largo legendario Gen 1
  30685: {
    id: 30685,
    name: 'Kudzu',
    type: 'legendary',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19644, // Don de Kudzu
        name: 'Don de Kudzu',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24865, name: 'Sello superior de celeridad', count: 1 },
          {
            id: 19622, // Don de la madera
            name: 'Don de la madera',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19712, name: 'Tabla de madera antigua', count: 250 },
              { id: 19709, name: 'Tabla de madera ancestral', count: 250 },
              { id: 19711, name: 'Tabla de madera sólida', count: 250 },
              { id: 19714, name: 'Tabla de madera curtida', count: 250 }
            ]
          },
          {
            id: 19627, // Don de la naturaleza
            name: 'Don de la naturaleza',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19667, name: 'Don de las espinas', count: 1 },
              { id: 12128, name: 'Baya omnom', count: 250 },
              { id: 19737, name: 'Retal de cuero curado endurecido', count: 250 },
              { id: 19712, name: 'Tabla de madera antigua', count: 250 }
            ]
          }
        ]
      },
      {
        id: 29171, // Hoja de Kudzu (precursora)
        name: 'Hoja de Kudzu (precursora)',
        type: 'weapon',
        count: 1
      }
    ]
  },

  // El Juggernaut - Martillo legendario Gen 1
  30690: {
    id: 30690,
    name: 'El Juggernaut',
    type: 'legendary',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19649, // Don del Juggernaut
        name: 'Don del Juggernaut',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24584, name: 'Sello superior de benevolencia', count: 1 },
          {
            id: 19621, // Don del metal
            name: 'Don del metal',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 19684, name: 'Lingote de mithril', count: 250 },
              { id: 19681, name: 'Lingote de aceroscuro', count: 250 },
              { id: 19686, name: 'Lingote de platino', count: 250 }
            ]
          },
          {
            id: 19633, // Vial de azogue
            name: 'Vial de azogue',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19666, name: 'Don del herrador', count: 1 },
              { id: 19688, name: 'Lingote de acero', count: 250 },
              { id: 24315, name: 'Piedra imán fundida', count: 150 },
              { id: 24502, name: 'Doblón de plata', count: 250 }
            ]
          }
        ]
      },
      {
        id: 29170, // El Coloso (precursora)
        name: 'El Coloso (precursora)',
        type: 'weapon',
        count: 1
      }
    ]
  },

  // Amanecer - Espada legendaria Gen 1
  30703: {
    id: 30703,
    name: 'Amanecer',
    type: 'legendary',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19647, // Don del Amanecer
        name: 'Don del Amanecer',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24562, name: 'Sello superior de fortaleza', count: 1 },
          {
            id: 19621, // Don del metal
            name: 'Don del metal',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 19684, name: 'Lingote de mithril', count: 250 },
              { id: 19681, name: 'Lingote de aceroscuro', count: 250 },
              { id: 19686, name: 'Lingote de platino', count: 250 }
            ]
          },
          {
            id: 19632, // Don de la luz
            name: 'Don de la luz',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19664, name: 'Don de Ascalon', count: 1 },
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 19737, name: 'Retal de cuero curado endurecido', count: 250 },
              { id: 24305, name: 'Piedra imán cargada', count: 100 }
            ]
          }
        ]
      },
      {
        id: 29169, // Alba (precursora)
        name: 'Alba (precursora)',
        type: 'weapon',
        count: 1
      }
    ]
  },

  // Aullador - Cuerno de guerra legendario Gen 1
  30702: {
    id: 30702,
    name: 'Aullador',
    type: 'legendary',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19662, // Don de Aullador
        name: 'Don de Aullador',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24618, name: 'Sello superior de precisión', count: 1 },
          {
            id: 19622, // Don de la madera
            name: 'Don de la madera',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19712, name: 'Tabla de madera antigua', count: 250 },
              { id: 19709, name: 'Tabla de madera ancestral', count: 250 },
              { id: 19711, name: 'Tabla de madera sólida', count: 250 },
              { id: 19714, name: 'Tabla de madera curtida', count: 250 }
            ]
          },
          {
            id: 19640, // Estatua de lobo
            name: 'Estatua de lobo',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19667, name: 'Don de las espinas', count: 1 },
              { id: 19737, name: 'Retal de cuero curado endurecido', count: 250 },
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 24351, name: 'Colmillo feroz', count: 250 }
            ]
          }
        ]
      },
      {
        id: 29184, // Aullido (precursora)
        name: 'Aullido (precursora)',
        type: 'weapon',
        count: 1
      }
    ]
  },

  // Rodgort - Báculo legendario Gen 1
  30700: {
    id: 30700,
    name: 'Rodgort',
    type: 'legendary',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19656, // Don de Rodgort
        name: 'Don de Rodgort',
        type: 'crafting_material',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24548, name: 'Sello superior de fuego', count: 1 },
          {
            id: 19622, // Don de la madera
            name: 'Don de la madera',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19712, name: 'Tabla de madera antigua', count: 250 },
              { id: 19709, name: 'Tabla de madera ancestral', count: 250 },
              { id: 19711, name: 'Tabla de madera sólida', count: 250 },
              { id: 19714, name: 'Tabla de madera curtida', count: 250 }
            ]
          },
          {
            id: 19634, // Vial de llama líquida
            name: 'Vial de llama líquida',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19629, name: 'Don de la historia', count: 1 },
              { id: 12544, name: 'Chile fantasma', count: 250 },
              { id: 24315, name: 'Piedra imán fundida', count: 100 },
              { id: 24325, name: 'Piedra imán de destructor', count: 100 }
            ]
          }
        ]
      },
      {
        id: 29182, // Llama de Rodgort (precursora)
        name: 'Llama de Rodgort (precursora)',
        type: 'weapon',
        count: 1
      }
    ]
  },

  // Crepúsculo - Gran espada legendaria Gen 1
  30704: {
    id: 30704,
    name: 'Crepúsculo',
    type: 'legendary',
    components: [
      GIFT_OF_MASTERY_TREE,
      GIFT_OF_FORTUNE_TREE,
      {
        id: 19648,
        name: 'Don del Crepúsculo',
        type: 'gift',
        count: 1,
        components: [
          { id: 19676, name: 'Piedra rúnica helada', count: 100 },
          { id: 24651, name: 'Sello superior de sangre', count: 1 },
          {
            id: 19621,
            name: 'Don del metal',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 19684, name: 'Lingote de mithril', count: 250 },
              { id: 19681, name: 'Lingote de aceroscuro', count: 250 },
              { id: 19686, name: 'Lingote de platino', count: 250 },
            ]
          },
          {
            id: 19631,
            name: 'Don de la oscuridad',
            type: 'crafting_material',
            count: 1,
            components: [
              { id: 19664, name: 'Don de Ascalon', count: 1 },
              { id: 19685, name: 'Lingote de oricalco', count: 250 },
              { id: 19737, name: 'Retal de cuero curado endurecido', count: 250 },
              { id: 24310, name: 'Piedra imán de ónice', count: 100 }
            ]
          }
        ]
      },
      {
        id: 29185,
        name: 'Anochecer (precursora)',
        type: 'precursor',
        count: 1
      }
    ]
  }
};

import { BASIC_MATERIALS } from './basicMaterials1gen.js';

/**
 * Obtiene los datos de un ítem legendario
 */
export function getLegendaryItem(itemId) {
  return LEGENDARY_ITEMS[itemId] || BASIC_MATERIALS[itemId] || null;
}

/**
 * Verifica si un ítem es legendario
 */
export function isLegendaryItem(itemId) {
  return !!LEGENDARY_ITEMS[itemId];
}

/**
 * Verifica si un ítem es un material básico
 */
export function isBasicMaterial(itemId) {
  return !!BASIC_MATERIALS[itemId];
}
