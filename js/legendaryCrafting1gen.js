import { getLegendaryItem, LEGENDARY_ITEMS, isBasicMaterial } from './data/legendaryItems1gen.js';
import { createIngredientTree } from './utils/Ingredient1gen.js';
import { LegendaryCraftingBase } from './legendaryCraftingBase.js';

const quickLoadButtons = {
  btnTwilight: { id: 'btnTwilight', itemId: '30704', itemName: 'Crepúsculo' },
  btnFrostfang: { id: 'btnFrostfang', itemId: '30684', itemName: 'Colmillo escarcha' },
  btnIncineradora: { id: 'btnIncineradora', itemId: '30687', itemName: 'Incineradora' },
  btnFestin: { id: 'btnFestin', itemId: '30692', itemName: 'El Festín' },
  btnMeteorologico: { id: 'btnMeteorologico', itemId: '30695', itemName: 'Meteorológico' },
  btnHaz: { id: 'btnHaz', itemId: '30699', itemName: 'Haz' },
  btnJuglar: { id: 'btnJuglar', itemId: '30688', itemName: 'El Juglar' },
  btnKotaki: { id: 'btnKotaki', itemId: '30691', itemName: "Kamohoali'i Kotaki" },
  btnKraitkin: { id: 'btnKraitkin', itemId: '30701', itemName: 'Kraitkin' },
  btnProfecias: { id: 'btnProfecias', itemId: '30696', itemName: 'Las Profecías del Buscador de la Llama' },
  btnRodgort: { id: 'btnRodgort', itemId: '30700', itemName: 'Rodgort' },
  btnAullador: { id: 'btnAullador', itemId: '30702', itemName: 'Aullador' },
  btnAmanecer: { id: 'btnAmanecer', itemId: '30703', itemName: 'Amanecer' },
  btnJuggernaut: { id: 'btnJuggernaut', itemId: '30690', itemName: 'El Juggernaut' },
  btnKudzu: { id: 'btnKudzu', itemId: '30685', itemName: 'Kudzu' },
  btnDepredador: { id: 'btnDepredador', itemId: '30694', itemName: 'El Depredador' },
  btnSonador: { id: 'btnSonador', itemId: '30686', itemName: 'El Soñador' },
  btnBifrost: { id: 'btnBifrost', itemId: '30698', itemName: 'El Bifrost' },
  btnFrenesi: { id: 'btnFrenesi', itemId: '30697', itemName: 'Frenesí' }
};

// Mensajes personalizados para ítems sin precio en el mercado
const customPriceTexts = [
  { name: 'Don de la exploración', display: 'Recompensa por completar mapas', keywords: ['exploraci'] },
  { name: 'Don de la batalla', display: 'Se obtiene al completar la ruta del don de la batalla en WvW', keywords: ['batalla'] },
  { name: 'Esquirla de hematites', display: 'Se compra en la forja mística', keywords: ['hematites'] },
  { name: 'Esquirla de obsidiana', display: 'Se compra por karma con NPC', keywords: ['obsidiana'] }
];

window.appFirstGen = new LegendaryCraftingBase({
  getItemById: id => getLegendaryItem(parseInt(id)),
  items: Object.values(LEGENDARY_ITEMS),
  createIngredientTree,
  isBasicMaterial,
  quickLoadButtons,
  customPriceTexts,
  elementIds: {
    craftingTree: 'craftingTree',
    summary: 'summary',
    summaryContent: 'summaryContent',
    clearCache: 'clearCache'
  }
});
