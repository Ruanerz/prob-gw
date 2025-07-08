import { getLegendary3GenItem, LEGENDARY_ITEMS_3GEN, isBasic3GenMaterial } from './data/legendaryItems3gen.js';
import { createIngredientTree } from './utils/Ingredient3gen.js';
import { LegendaryCraftingBase } from './legendaryCraftingBase.js';

const quickLoadButtons = {
  btnDesgarro: { id: 'btnDesgarro', itemId: '96937', itemName: 'Desgarro de Aurene' },
  btnGarra: { id: 'btnGarra', itemId: '96203', itemName: 'Garra de Aurene' },
  btnCola: { id: 'btnCola', itemId: '95612', itemName: 'Cola de Aurene' },
  btnRazonamiento: { id: 'btnRazonamiento', itemId: '95808', itemName: 'Razonamiento de Aurene' },
  btnSabiduria: { id: 'btnSabiduria', itemId: '96221', itemName: 'Sabiduría de Aurene' },
  btnColmillo: { id: 'btnColmillo', itemId: '95675', itemName: 'Colmillo de Aurene' },
  btnMirada: { id: 'btnMirada', itemId: '97165', itemName: 'Mirada de Aurene' },
  btnEscama: { id: 'btnEscama', itemId: '96028', itemName: 'Escama de Aurene' },
  btnAliento: { id: 'btnAliento', itemId: '97099', itemName: 'Aliento de Aurene' },
  btnVoz: { id: 'btnVoz', itemId: '97783', itemName: 'Voz de Aurene' },
  btnMordisco: { id: 'btnMordisco', itemId: '96356', itemName: 'Mordisco de Aurene' },
  btnPeso: { id: 'btnPeso', itemId: '95684', itemName: 'Peso de Aurene' },
  btnVuelo: { id: 'btnVuelo', itemId: '97590', itemName: 'Vuelo de Aurene' },
  btnPersuasion: { id: 'btnPersuasion', itemId: '97377', itemName: 'Persuasión de Aurene' },
  btnAla: { id: 'btnAla', itemId: '97077', itemName: 'Ala de Aurene' },
  btnReflexion: { id: 'btnReflexion', itemId: '96652', itemName: 'Reflexión de Aurene' }
};

window.appThirdGen = new LegendaryCraftingBase({
  getItemById: id => getLegendary3GenItem(parseInt(id)),
  items: Object.values(LEGENDARY_ITEMS_3GEN),
  createIngredientTree,
  isBasicMaterial: isBasic3GenMaterial,
  quickLoadButtons,
  elementIds: {
    craftingTree: 'craftingTreeThird',
    summary: 'summaryThird',
    summaryContent: 'summaryContentThird',
    loadTree: 'loadTreeThird',
    clearCache: 'clearCacheThird',
    itemIdInput: 'itemIdThird',
    itemNameInput: 'itemNameThird'
  }
});
