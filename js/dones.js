// js/dones.js

// Sección de "Dones Especiales" (ejemplo: Don de la Suerte)
// Puedes agregar más dones en el array DONES si lo deseas

var DONES = [
  {
    id: 19673, // ID real para Don de la Magia
    name: "Don de la Magia",
    mainIngredients: [
      { id: 19675, name: "Trébol místico", type: "account_bound", count: 77, components: [
  { id: 19976, name: "Moneda mística", count: 250 },
  { id: 19721, name: "Pegote de ectoplasma", count: 250 },
  { id: 19925, name: "Esquirla de obsidiana", count: 250 },
  { id: 20796, name: "Piedra filosofal", count: 1500 }
]},
      { id: 19721, name: "Pegote de ectoplasma", count: 250 }
    ],
    manualIngredients: [
      { id: 24295, name: "Vial de sangre poderosa", count: 250 },
      { id: 24283, name: "Vesícula de veneno poderoso", count: 250 },
      { id: 24300, name: "Tótem elaborado", count: 250 },
      { id: 24277, name: "Montón de polvo cristalino", count: 250 },
    ]
  },
  {
    id: 19672, // ID real para Don del Poder
    name: "Don del Poder",
    manualIngredients: [
      { id: 24357, name: "Colmillo feroz", count: 250 },
      { id: 24289, name: "Escama blindada", count: 250 },
      { id: 24351, name: "Garra despiadada", count: 250 },
      { id: 24358, name: "Hueso antiguo", count: 250 },
    ]
  },
  {
    id: 19626,
    name: "Don de la Suerte",
    mainIngredients: [
      { id: 19721, name: "Pegote de ectoplasma", count: 250 },
      {
        id: 19675,
        name: "Trébol místico",
        type: "account_bound",
        count: 77,
        components: [
          { id: 19976, name: "Moneda mística", count: 250 },
          { id: 19721, name: "Pegote de ectoplasma", count: 250 },
          { id: 19925, name: "Esquirla de obsidiana", count: 250 },
          { id: 20796, name: "Piedra filosofal", count: 1500 }
        ]
      },
      {
        id: 19673,
        name: "Don de la Magia",
        type: "crafting_material",
        count: 1,
        components: [
          { id: 24295, name: "Vial de sangre poderosa", count: 250 },
          { id: 24283, name: "Vesícula de veneno poderoso", count: 250 },
          { id: 24300, name: "Tótem elaborado", count: 250 },
          { id: 24277, name: "Montón de polvo cristalino", count: 250 }
        ]
      },
      {
        id: 19672,
        name: "Don del Poder",
        type: "crafting_material",
        count: 1,
        components: [
          { id: 24351, name: "Colmillo feroz", count: 250 },
          { id: 24289, name: "Escama blindada", count: 250 },
          { id: 24357, name: "Garra despiadada", count: 250 },
          { id: 24358, name: "Hueso antiguo", count: 250 }
        ]
      }
    ]
  }
];

const API_ITEM = "https://api.guildwars2.com/v2/items/";
const API_PRICES = "https://api.guildwars2.com/v2/commerce/prices/";

const donesContent = document.getElementById('dones-content');
const loader = document.getElementById('loader');
const errorMsg = document.getElementById('error-message');

// Cachés en memoria y en sessionStorage para ítems y precios
const itemCache = new Map();
const priceCache = new Map();


// --- Fin de formatGold ---

// IDs de ítems no comerciables o con precios especiales que deben saltarse
// Items con precio fijo manual
const FIXED_PRICE_ITEMS = {
  19676: 10000 // Piedra rúnica helada: 1 oro (10000 cobre)
};

const EXCLUDED_ITEM_IDS = [
  19675, // Trébol místico (account bound)
  19925, // Esquirla de obsidiana (precio especial)
  20796, // Piedra filosofal (precio especial)
  19665, // Don del noble (account bound)
  19674, // Don del dominio (account bound)
  19626, // Don de la suerte (crafting, sin precio directo)
  19672, // Don del poder
  19673, // Don de la magia
  19645, 19650, 19655, 19639, 19635, 19621 // Diversos "Don de ..." (account bound)
];

function isGiftName(name){
  if(!name) return false;
  const lower = name.toLowerCase();
  return lower.startsWith('don de ') || lower.startsWith('don del ') || lower.startsWith('don de la ');
}

function shouldSkipMarketCheck(id){
  return EXCLUDED_ITEM_IDS.includes(id);
}

async function fetchItemData(id) {
  if (itemCache.has(id)) return itemCache.get(id);
  const stored = sessionStorage.getItem('item:' + id);
  if (stored) {
    const data = JSON.parse(stored);
    itemCache.set(id, data);
    return data;
  }
  const res = await fetch(API_ITEM + id);
  if (!res.ok) throw new Error('No se pudo obtener info de item ' + id);
  const json = await res.json();
  itemCache.set(id, json);
  try { sessionStorage.setItem('item:' + id, JSON.stringify(json)); } catch(e) {}
  return json;
}

async function fetchPriceData(id) {
  if (FIXED_PRICE_ITEMS[id] !== undefined) {
    const value = FIXED_PRICE_ITEMS[id];
    return {buys:{unit_price:value}, sells:{unit_price:value}};
  }
  if(shouldSkipMarketCheck(id)) return null;
  if (priceCache.has(id)) return priceCache.get(id);
  const stored = sessionStorage.getItem('price:' + id);
  if (stored) {
    const data = JSON.parse(stored);
    priceCache.set(id, data);
    return data;
  }
  const res = await fetch(API_PRICES + id);
  if (!res.ok) return null;
  const json = await res.json();
  priceCache.set(id, json);
  try { sessionStorage.setItem('price:' + id, JSON.stringify(json)); } catch(e) {}
  return json;
}

async function renderDon(don, container) {
  // Si no se pasa un contenedor, se usa el global por defecto (comportamiento antiguo)
  const targetContainer = container || document.getElementById('dones-content');
  targetContainer.innerHTML = ''; // Limpiamos el contenedor específico para este don
  errorMsg.style.display = 'none';
  // No limpiar donesContent aquí, para permitir varios dones en la página (limpiaremos solo una vez afuera)
  try {
    // Si el id es ficticio (mayor a 90000) NO pedir a la API el don principal
    let donName = don.name;
    let donIcon = null;
    if (don.id < 90000) {
      // ID real: obtener datos de la API
      const donInfo = await fetchItemData(don.id);
      donName = donInfo.name;
      donIcon = donInfo.icon;
    } else {
      // ID ficticio: usar el ícono del primer ingrediente
      const primerIng = don.manualIngredients[0];
      const primerIngInfo = await fetchItemData(primerIng.id);
      donIcon = primerIngInfo.icon;
    }
    // Renderizar mainIngredients en tabla separada si existen
    let html = '';
    // Para Don de la Suerte/Magia/Poder, SOLO una tabla anidada del árbol principal, sin encabezado ni títulos
    const nombre = don.name ? don.name.toLowerCase() : '';
    const esDonSimple = nombre.includes('suerte') || nombre.includes('magia') || nombre.includes('poder');
    if (esDonSimple) {
      if (don.mainIngredients && don.mainIngredients.length > 0) {
        html += `<table class='table-modern-dones tabla-tarjetas'>
          <thead class='header-items'><tr><th>Ícono</th><th>Nombre</th><th>Cantidad</th><th>Precio Buy (u)</th><th>Precio Sell (u)</th><th>Total Buy</th><th>Total Sell</th></tr></thead><tbody>`;
        let totalBuy = 0;
        let totalSell = 0;
        for (const ing of don.mainIngredients) {
          const result = await renderIngredientRowWithComponents(ing, 0);
          html += result.html;
          totalBuy += result.totalBuy || 0;
          totalSell += result.totalSell || 0;
        }
        html += `</tbody></table>`;
        if (totalBuy > 0 || totalSell > 0) {
          html += `<div class='table-modern-totales' style='margin-bottom:50px;'>
            <div class='precio-totales-dones'>
              <div class='total-dones'><b>Total Buy estimado:</b> ${formatGoldColored(totalBuy)}</div>
              <div class='total-dones'><b>Total Sell estimado:</b> ${formatGoldColored(totalSell)}</div>
            </div>
          </div>`;
        }
      }
      targetContainer.innerHTML += html;
      return;
    }
    // Para otros dones, renderizado normal
    if (!esDonSimple) {
      html += `<h2 style='margin-top:18px;'><img src='${donIcon}' style='height:32px;vertical-align:middle;'> ${donName}</h2>`;
    }
    if (don.mainIngredients && don.mainIngredients.length > 0) {
      html += `<table class='table-modern-dones tabla-tarjetas'>
        <thead class='header-items'><tr><th>Ícono</th><th>Nombre</th><th>Cantidad</th><th>Precio Buy (u)</th><th>Precio Sell (u)</th><th>Total Buy</th><th>Total Sell</th></tr></thead><tbody>`;
      
      let totalBuy = 0;
      let totalSell = 0;
      
      for (const ing of don.mainIngredients) {
        const result = await renderIngredientRowWithComponents(ing, 0);
        html += result.html;
        totalBuy += result.totalBuy || 0;
        totalSell += result.totalSell || 0;
      }
      
      html += `</tbody></table>`;
      
      if (totalBuy > 0 || totalSell > 0) {
        html += `<div class='table-modern-totales' style='margin-bottom:50px;'>
          <div class='precio-totales-dones'>
            <div class='total-dones'><b>Total Buy estimado:</b> ${formatGoldColored(totalBuy)}</div>
            <div class='total-dones'><b>Total Sell estimado:</b> ${formatGoldColored(totalSell)}</div>
          </div>
        </div>`;
      }
    }
    // Para el Don de la Suerte, Don de la Magia y Don del Poder, NO renderizar tabla manualIngredients, solo el árbol completo
    // Ya manejado arriba para esDonSimple
    if (esDonSimple) return;
    // El renderizado de ingredientes manuales ha sido eliminado completamente.
    targetContainer.innerHTML += html;
  } catch (e) {
    errorMsg.innerText = e.message;
    errorMsg.style.display = 'block';
  }
}

// === Dones de armas legendarias Gen 1 ===
async function extractWeaponGifts() {
  const { LEGENDARY_ITEMS } = await import('./data/legendaryItems1gen.js');
  const gifts = [];
  const seen = new Set();
  for (const item of Object.values(LEGENDARY_ITEMS)) {
    if (!item.components) continue;
    const gift = item.components.find(c => {
      if (!c.name) return false;
      const lower = c.name.toLowerCase();
      return lower.startsWith('don de') && !lower.includes('la suerte') && !lower.includes('del dominio');
    });
    if (gift && !seen.has(gift.id)) {
      seen.add(gift.id);
      gifts.push({
        id: gift.id,
        name: gift.name,
        mainIngredients: gift.components || [],
        manualIngredients: []
      });
    }
  }
  // Orden alfabético por nombre
  gifts.sort((a,b)=>a.name.localeCompare(b.name,'es'));
  return gifts;
}

// Renderizar dones de armas legendarias de 1ra Gen
async function renderLegendaryWeaponGifts() {
  const container = document.getElementById('dones-1ra-gen-content');
  const loader = document.getElementById('loader-dones-1ra-gen');
  if (!container || !loader) return;

  loader.style.display = 'block';
  container.innerHTML = '';

  try {
    const gifts = await extractWeaponGifts();
    // Generar ids únicos y lista de botones
    const donIds = gifts.map(gift => {
      // id seguro para HTML
      return {
        id: 'don1gen-' + gift.name.toLowerCase().replace(/[^a-záéíóúüñ0-9]+/gi, '-').replace(/^-+|-+$/g, ''),
        name: gift.name
      };
    });
    // Crear el contenedor de botones
    const btnsDiv = document.createElement('div');
    btnsDiv.className = 'don1gen-nav-btns';
    btnsDiv.style = 'margin-bottom: 10%; display: flex; flex-wrap: wrap; gap: 10px;';
    donIds.forEach(don => {
      const btn = document.createElement('button');
      btn.className = 'item-tab-btn';
      btn.textContent = don.name;
      btn.onclick = () => scrollToDon1Gen(don.id);
      btnsDiv.appendChild(btn);
    });
    container.appendChild(btnsDiv);
    // Renderizar cada don en su propio div con id único
    for (let i = 0; i < gifts.length; ++i) {
      const don = gifts[i];
      const donDiv = document.createElement('div');
      donDiv.id = donIds[i].id;
      donDiv.style.scrollMarginTop = '90px'; // margen para que no quede tapado por header
      container.appendChild(donDiv);
      await renderDon(don, donDiv);
    }
  } catch (error) {
    console.error('Error al renderizar dones de 1ra Gen:', error);
    container.innerHTML = '<div class="error-message">Error al cargar los dones.</div>';
  } finally {
    loader.style.display = 'none';
  }
}

// Scroll suave a don de 1ra Gen
function scrollToDon1Gen(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}


// Renderizar dones especiales (los que no son de armas)
async function renderSpecialDons() {
  const container = document.getElementById('dones-content');
  const loader = document.getElementById('loader');
  loader.style.display = 'block';
  container.innerHTML = '';

  // Renderizamos únicamente el Don de la Suerte (evitamos Magia y Poder para no duplicar tablas)
  const specialDons = DONES.filter(d => d.name && d.name.toLowerCase().includes('suerte')); 

  for (const don of specialDons) {
    const donContainer = document.createElement('div');
    container.appendChild(donContainer);
    await renderDon(don, donContainer);
  }
  loader.style.display = 'none';
}

// === Tributo Dracónico (dinámico desde legendaryItems3gen) ===
async function getDraconicTribute() {
  // Carga perezosa para evitar coste inicial si el usuario no abre la pestaña
  const { LEGENDARY_ITEMS_3GEN } = await import('./data/legendaryItems3gen.js');
  for (const weapon of Object.values(LEGENDARY_ITEMS_3GEN)) {
    const tribute = weapon.components?.find(c => {
      const nm = c.name?.toLowerCase() || '';
      return nm.includes('tributo dracónico');
    });
    if (tribute) return tribute; // Es único, lo devolvemos
  }
  throw new Error('No se encontró el Tributo Dracónico en legendaryItems3gen');
}

async function renderDraconicTribute() {
  const container = document.getElementById('tributo-draconico-content');
  const loader = document.getElementById('loader-tributo-draconico');
  if (!container || !loader) return;

  loader.style.display = 'block';
  container.innerHTML = '';

  try {
    const tributoTree = await getDraconicTribute();
    let html = `<h2>${tributoTree.name}</h2>`;
    html += `<table class='table-modern-dones tabla-tarjetas'>
      <thead class='header-items'>
        <tr>
          <th>Ícono</th>
          <th>Nombre</th>
          <th>Cantidad</th>
          <th>Precio Buy (u)</th>
          <th>Precio Sell (u)</th>
          <th>Total Buy</th>
          <th>Total Sell</th>
        </tr>
      </thead>
      <tbody>`;

    let totalBuy = 0;
    let totalSell = 0;

    // Renderizar cada componente de nivel superior del tributo
    for (const component of tributoTree.components) {
      const result = await renderIngredientRowWithComponents(component, 0);
      html += result.html;
      totalBuy += result.totalBuy || 0;
      totalSell += result.totalSell || 0;
    }

    html += `</tbody></table>`;
    html += `<div class='table-modern-totales' style='margin-bottom:50px;'>
      <div class='precio-totales-dones'>
        <div class='total-dones'><b>Total Buy estimado:</b> ${formatGoldColored(totalBuy)}</div>
        <div class='total-dones'><b>Total Sell estimado:</b> ${formatGoldColored(totalSell)}</div>
      </div>
    </div>`;

    container.innerHTML = html;
  } catch (e) {
    console.error('Error al renderizar Tributo Dracónico:', e);
    container.innerHTML = '<div class="error-message">Error al cargar el Tributo Dracónico.</div>';
  } finally {
    loader.style.display = 'none';
  }
}

// Exponer funciones de carga perezosa para cada pestaña
const _loadedTabs = {
  special: false,
  tributo: false,
  draco: false,
  gen1: false
};

async function loadSpecialDons() {
  if (_loadedTabs.special) return;
  _loadedTabs.special = true;
  await renderSpecialDons();
}

async function loadTributo() {
  if (_loadedTabs.tributo) return;
  _loadedTabs.tributo = true;
  await renderTributo();
}

async function loadDraconicTribute() {
  if (_loadedTabs.draco) return;
  _loadedTabs.draco = true;
  await renderDraconicTribute();
}

async function loadDones1Gen() {
  if (_loadedTabs.gen1) return;
  _loadedTabs.gen1 = true;
  await renderLegendaryWeaponGifts();
}

window.DonesPages = {
  loadSpecialDons,
  loadTributo,
  loadDraconicTribute,
  loadDones1Gen
};

// === Tributo Dracónico ===
async function renderTributoDraconico() {
  const container = document.getElementById('tributo-draconico-content');
  const loaderTributo = document.getElementById('loader-tributo-draconico');
  loaderTributo.style.display = 'block';
  container.innerHTML = '';
  try {
    if (TRIBUTO_DRACONICO.mainIngredients && TRIBUTO_DRACONICO.mainIngredients.length > 0) {
      let html = `<h3>Ingredientes principales</h3>`;
      html += `<table class='table-modern-dones tabla-tarjetas'><thead class='header-items'><tr><th>Ícono</th><th>Nombre</th><th>Cantidad</th><th>Precio Buy (u)</th><th>Precio Sell (u)</th><th>Total Buy</th><th>Total Sell</th></tr></thead><tbody>`;
      
      // Variables para acumular totales
      let totalBuy = 0;
      let totalSell = 0;
      let trebolBuy = 0;
      let trebolSell = 0;
      let piedrasBuy = 0;
      let piedrasSell = 0;
      
      // Procesar cada ingrediente principal
      for (const ing of TRIBUTO_DRACONICO.mainIngredients) {
        const result = await renderIngredientRowWithComponents(ing, 0);
        html += result.html;
        
        // Solo sumar tréboles y piedras imán dracónicas
        if (ing.id === 19675) { // Trébol místico
          trebolBuy = result.totalBuy || 0;
          trebolSell = result.totalSell || 0;
        } else if (ing.id === 92687) { // Piedra imán dracónica amalgamada (ID corregido)
          piedrasBuy = result.totalBuy || 0;
          piedrasSell = result.totalSell || 0;
        } else {
        }
      }
      
      // Sumar solo los 38 tréboles y 5 piedras imán dracónicas
      totalBuy = trebolBuy + piedrasBuy;
      totalSell = trebolSell + piedrasSell;
      
      
      html += `</tbody></table>`;
      html += `<div class="table-modern-totales" style="margin-bottom:50px;">
        <div class="precio-totales-dones">
          <div class="total-dones"><b>Total Buy estimado:</b> ${formatGoldColored(totalBuy)}</div>
          <div class="total-dones"><b>Total Sell estimado:</b> ${formatGoldColored(totalSell)}</div>
        </div>
      </div>`;
      document.getElementById('tributo-draconico-content').insertAdjacentHTML('beforeend', html);
    }
    for (const don of TRIBUTO_DRACONICO.dons) {
      const donDiv = document.createElement('div');
      donDiv.className = 'don-section';
      const donTitle = document.createElement('h3');
      donTitle.textContent = don.name;
      donDiv.appendChild(donTitle);
      for (const subdon of don.subdons) {
        const subdonDiv = document.createElement('div');
        subdonDiv.className = 'subdon-section';
        const subdonTitle = document.createElement('h4');
        subdonTitle.textContent = subdon.name;
        subdonDiv.appendChild(subdonTitle);
        // Obtener datos de ingredientes
        const ingredientes = await Promise.all(subdon.ingredients.map(async ing => {
          const [info, price] = await Promise.all([
            fetchItemData(ing.id),
            fetchPriceData(ing.id)
          ]);
          return {
            id: ing.id,
            name: info.name,
            icon: info.icon,
            count: ing.count,
            priceBuy: price ? price.buys.unit_price : null,
            priceSell: price ? price.sells.unit_price : null
          };
        }));
        // Renderizar tabla
        let html = `<table class='table-modern-dones tabla-tarjetas'>`;
        html += `<thead class='header-items'><tr><th>Ícono</th><th>Nombre</th><th>Cantidad</th><th>Precio Buy (u)</th><th>Precio Sell (u)</th><th>Total Buy</th><th>Total Sell</th></tr></thead><tbody>`;
        let totalBuy = 0;
        let totalSell = 0;
        let rowIdx = 0;
        for (const ing of ingredientes) {
          const totalBuyIng = ing.priceBuy ? ing.priceBuy * ing.count : null;
          const totalSellIng = ing.priceSell ? ing.priceSell * ing.count : null;
          if (totalBuyIng) totalBuy += totalBuyIng;
          if (totalSellIng) totalSell += totalSellIng;
          const rowClass = rowIdx % 2 === 0 ? 'row-bg-a' : 'row-bg-b';
          html += `<tr class='${rowClass}'>
            <td><img src='${ing.icon}' style='height:28px;'></td>
            <td>${ing.name}</td>
            <td>${ing.count}</td>
            <td>${ing.priceBuy ? formatGoldColored(ing.priceBuy) : '-'}</td>
            <td>${ing.priceSell ? formatGoldColored(ing.priceSell) : '-'}</td>
            <td>${totalBuyIng ? formatGoldColored(totalBuyIng) : '-'}</td>
            <td>${totalSellIng ? formatGoldColored(totalSellIng) : '-'}</td>
          </tr>`;
          rowIdx++;
        }
        html += `</tbody></table>`;
        html += `<div class='table-modern-totales' style='margin-bottom:50px;'>
          <div class='precio-totales-dones'>
            <div class='total-dones'><b>Total Buy estimado:</b> ${formatGoldColored(totalBuy)}</div>
            <div class='total-dones'><b>Total Sell estimado:</b> ${formatGoldColored(totalSell)}</div>
          </div>
        </div>`;
        subdonDiv.innerHTML += html;
        donDiv.appendChild(subdonDiv);
      }
      container.appendChild(donDiv);
    }
  } catch (e) {
    container.innerHTML = '<div class="error-message">Error al cargar el Tributo Dracónico.</div>';
  } finally {
    loaderTributo.style.display = 'none';
  }
}



// === Tributo Místico ===
const TRIBUTO = {
  name: "Tributo Místico",
  mainIngredients: [
    { id: 19675, name: "Trébol místico", type: "account_bound", count: 77, components: [
  { id: 19976, name: "Moneda mística", count: 250 },
  { id: 19721, name: "Pegote de ectoplasma", count: 250 },
  { id: 19925, name: "Esquirla de obsidiana", count: 250 },
  { id: 20796, name: "Piedra filosofal", count: 1500 }
]},
    { id: 19976, name: "Moneda mística", count: 250 }
  ],
  dons: [
    {
      name: "Don de magia condensada",
      subdons: [
        {
          name: "Don de sangre",
          ingredients: [
            { id: 24295, name: "Vial de sangre poderosa", count: 100 },
            { id: 24294, name: "Vial de sangre potente", count: 250 },
            { id: 24293, name: "Vial de sangre espesa", count: 50 },
            { id: 24292, name: "Vial de sangre", count: 50 },
          ]
        },
        {
          name: "Don de veneno",
          ingredients: [
            { id: 24283, name: "Vesícula de veneno poderoso", count: 100 },
            { id: 24282, name: "Vesícula de veneno potente", count: 250 },
            { id: 24281, name: "Vesícula de veneno llena", count: 50 },
            { id: 24280, name: "Vesícula de veneno", count: 50 },
          ]
        },
        {
          name: "Don de tótems",
          ingredients: [
            { id: 24300, name: "Tótem elaborado", count: 100 },
            { id: 24299, name: "Tótem intrincado", count: 250 },
            { id: 24298, name: "Tótem grabado", count: 50 },
            { id: 24297, name: "Tótem", count: 50 },
          ]
        },
        {
          name: "Don de polvo",
          ingredients: [
            { id: 24277, name: "Montón de polvo cristalino", count: 100 },
            { id: 24276, name: "Montón de polvo incandescente", count: 250 },
            { id: 24275, name: "Montón de polvo luminoso", count: 50 },
            { id: 24274, name: "Montón de polvo radiante", count: 50 },
          ]
        },
      ]
    },
    {
      name: "Don de poder condensado",
      subdons: [
        {
          name: "Don de garras",
          ingredients: [
            { id: 24351, name: "Garra despiadada", count: 100 },
            { id: 24350, name: "Garra grande", count: 250 },
            { id: 24349, name: "Garra afilada", count: 50 },
            { id: 24348, name: "Garra", count: 50 },
          ]
        },
        {
          name: "Don de escamas",
          ingredients: [
            { id: 24289, name: "Escama blindada", count: 100 },
            { id: 24288, name: "Escama grande", count: 250 },
            { id: 24287, name: "Escama suave", count: 50 },
            { id: 24286, name: "Escama", count: 50 },
          ]
        },
        {
          name: "Don de huesos",
          ingredients: [
            { id: 24358, name: "Hueso antiguo", count: 100 },
            { id: 24341, name: "Hueso grande", count: 250 },
            { id: 24345, name: "Hueso pesado", count: 50 },
            { id: 24344, name: "Hueso", count: 50 },
          ]
        },
        {
          name: "Don de colmillos",
          ingredients: [
            { id: 24357, name: "Colmillo feroz", count: 100 },
            { id: 24356, name: "Colmillo grande", count: 250 },
            { id: 24355, name: "Colmillo afilado", count: 50 },
            { id: 24354, name: "Colmillo", count: 50 },
          ]
        },
      ]
    }
  ]
};

// === Tributo Dracónico ===
const TRIBUTO_DRACONICO = {
  name: "Tributo dracónico",
  mainIngredients: [
    { id: 19675, name: "Trébol místico", type: "account_bound", count: 38, components: [
  { id: 19976, name: "Moneda mística", count: 38 },
  { id: 19721, name: "Pegote de ectoplasma", count: 38 },
  { id: 19925, name: "Esquirla de obsidiana", count: 38 },
  { id: 20796, name: "Piedra filosofal", count: 228 }
]},
    { id: 92687, name: "Piedra imán dracónica amalgamada", count: 5 }
  ],
  dons: [
    {
      name: "Don de magia condensada",
      subdons: [
        {
          name: "Don de sangre",
          ingredients: [
            { id: 24295, name: "Vial de sangre poderosa", count: 100 },
            { id: 24294, name: "Vial de sangre potente", count: 250 },
            { id: 24293, name: "Vial de sangre espesa", count: 50 },
            { id: 24292, name: "Vial de sangre", count: 50 }
          ]
        },
        {
          name: "Don de veneno",
          ingredients: [
            { id: 24283, name: "Vesícula de veneno poderoso", count: 100 },
            { id: 24282, name: "Vesícula de veneno potente", count: 250 },
            { id: 24281, name: "Vesícula de veneno llena", count: 50 },
            { id: 24280, name: "Vesícula de veneno", count: 50 }
          ]
        },
        {
          name: "Don de tótems",
          ingredients: [
            { id: 24300, name: "Tótem elaborado", count: 100 },
            { id: 24299, name: "Tótem intrincado", count: 250 },
            { id: 24298, name: "Tótem grabado", count: 50 },
            { id: 24297, name: "Tótem", count: 50 }
          ]
        },
        {
          name: "Don de polvo",
          ingredients: [
            { id: 24277, name: "Montón de polvo cristalino", count: 100 },
            { id: 24276, name: "Montón de polvo incandescente", count: 250 },
            { id: 24275, name: "Montón de polvo luminoso", count: 50 },
            { id: 24274, name: "Montón de polvo radiante", count: 50 }
          ]
        }
      ]
    },
    {
      name: "Don de poder condensado",
      subdons: [
        {
          name: "Don de garras",
          ingredients: [
            { id: 24351, name: "Garra despiadada", count: 50 },
            { id: 24350, name: "Garra grande", count: 250 },
            { id: 24349, name: "Garra afilada", count: 50 },
            { id: 24348, name: "Garra", count: 50 }
          ]
        },
        {
          name: "Don de escamas",
          ingredients: [
            { id: 24289, name: "Escama blindada", count: 50 },
            { id: 24288, name: "Escama grande", count: 250 },
            { id: 24287, name: "Escama suave", count: 50 },
            { id: 24286, name: "Escama", count: 50 }
          ]
        },
        {
          name: "Don de huesos",
          ingredients: [
            { id: 24358, name: "Hueso antiguo", count: 50 },
            { id: 24341, name: "Hueso grande", count: 250 },
            { id: 24345, name: "Hueso pesado", count: 50 },
            { id: 24344, name: "Hueso", count: 50 }
          ]
        },
        {
          name: "Don de colmillos",
          ingredients: [
            { id: 24357, name: "Colmillo feroz", count: 50 },
            { id: 24356, name: "Colmillo grande", count: 250 },
            { id: 24355, name: "Colmillo afilado", count: 50 },
            { id: 24354, name: "Colmillo", count: 50 }
          ]
        }
      ]
    }
  ]
};

// Renderiza una fila y sus subcomponentes recursivamente
// Devuelve un objeto con {html, totalBuy, totalSell}
async function renderIngredientRowWithComponents(ing, level = 0) {
  // 1. Procesar hijos primero (si existen) para conocer sus totales.
  let childBuyTotal = 0;
  let childSellTotal = 0;
  let childHtml = '';
  if (ing.components && ing.components.length > 0) {
    for (const sub of ing.components) {
      const childRes = await renderIngredientRowWithComponents(sub, level + 1);
      childHtml += childRes.html;
      childBuyTotal += childRes.totalBuy || 0;
      childSellTotal += childRes.totalSell || 0;
    }
  }

  // 2. Obtener info y precio del ítem actual
  let info = null, price = null;
  const prelimName = ing.name?.toLowerCase() || '';
  let isGift = prelimName.startsWith('don de ') || prelimName.startsWith('don del ') || prelimName.startsWith('don de la ');

  // Obtener primero la información del ítem. El precio se consultará sólo
  // si no se aplica alguna exclusión.
  if (typeof ing.id === 'number' && ing.id < 1000000) {
    try { info = await fetchItemData(ing.id); } catch (e) {}
  }
  const rarityClass = typeof getRarityClass === 'function' ? getRarityClass(info?.rarity) : '';

  const finalName = (info && info.name) ? info.name : ing.name;
  if (!isGift) isGift = isGiftName(finalName);

  const lowerFinal = finalName.toLowerCase();
  const isNameExcluded = lowerFinal.includes('estatua de') || lowerFinal === 'caja de diversión' || lowerFinal === 'vial de llama líquida' || lowerFinal === 'vial de azogue';
  const hasComponents = ing.components && ing.components.length > 0;
  const isTrebolMistico = ing.id === 19675;

  // Un don con componentes se trata como el trébol: su precio deriva de los hijos.
  const isCalculatedFromChildren = isTrebolMistico || (isGift && hasComponents);
  const isSinPrecio = (isGift && !hasComponents) || shouldSkipMarketCheck(ing.id) || isNameExcluded;

  if (!isCalculatedFromChildren && !isSinPrecio) {
    try { price = await fetchPriceData(ing.id); } catch(e) {}
  }
  const icon = info && info.icon ? info.icon : '';
  const count = ing.count;

  // 3. Calcular precios
  let priceBuy = null, priceSell = null, totalBuyIng = 0, totalSellIng = 0;

  if (isCalculatedFromChildren) {
    // Usar totales de hijos (componentes)
    if (childBuyTotal > 0) priceBuy = Math.round(childBuyTotal / count);
    if (childSellTotal > 0) priceSell = Math.round(childSellTotal / count);
    totalBuyIng = childBuyTotal;
    totalSellIng = childSellTotal;
  } else {
    // Ítem normal
    priceBuy = (!isSinPrecio && price?.buys) ? price.buys.unit_price : null;
    priceSell = (!isSinPrecio && price?.sells) ? price.sells.unit_price : null;
    totalBuyIng = priceBuy ? priceBuy * count : 0;
    totalSellIng = priceSell ? priceSell * count : 0;
  }

  // 4. Construir fila HTML
  const indent = level > 0 ? `padding-left:${level*32}px;` : '';
  const displayName = isCalculatedFromChildren ? `${finalName} (componentes)` : finalName;
  let rowHtml = `<tr>
    <td style='${indent}'>${icon ? `<img src='${icon}' style='height:28px;'>` : '-'}</td>
    <td><span class="${rarityClass}">${displayName}</span></td>
    <td>${count}</td>
    <td>${priceBuy ? formatGoldColored(priceBuy) : (isSinPrecio ? 'sin precio' : '-')}</td>
    <td>${priceSell ? formatGoldColored(priceSell) : (isSinPrecio ? 'sin precio' : '-')}</td>
    <td>${totalBuyIng > 0 ? formatGoldColored(totalBuyIng) : (isSinPrecio ? 'sin precio' : '-')}</td>
    <td>${totalSellIng > 0 ? formatGoldColored(totalSellIng) : (isSinPrecio ? 'sin precio' : '-')}</td>
  </tr>`;

  // 5. HTML completo: fila padre + filas hijas
  const html = rowHtml + childHtml;

  // 6. Totales a devolver
  // Si el precio se calculó de los hijos, su total YA ES la suma de ellos.
  // Si es un ítem normal, su total es (precio * cant) + la suma de sus hijos.
  const returnBuy = isCalculatedFromChildren ? totalBuyIng : (totalBuyIng + childBuyTotal);
  const returnSell = isCalculatedFromChildren ? totalSellIng : (totalSellIng + childSellTotal);

  return { html, totalBuy: returnBuy, totalSell: returnSell };
}

// Construye un árbol de componentes completo y unificado para el Tributo Místico
function buildTributoTree() {
  const root = {
    id: 'TRIBUTO_MISTICO_ROOT',
    name: TRIBUTO.name,
    count: 1,
    components: []
  };

  // 1. Añadir ingredientes principales (Trébol Místico)
  // renderIngredientRowWithComponents se encargará de sus sub-componentes
  TRIBUTO.mainIngredients.forEach(ing => {
    root.components.push({ ...ing });
  });

  // 2. Procesar los dones principales (Magia y Poder Condensado)
  TRIBUTO.dons.forEach(don => {
        const donCount = (don.name.toLowerCase().includes('magia condensada') || don.name.toLowerCase().includes('poder condensado')) ? 2 : 1;
    const donNode = {
      id: don.name.replace(/\s+/g, '_').toUpperCase(), // ID único para el don
      name: don.name,
      count: donCount,
      components: []
    };

    // 3. Procesar los subdones (Sangre, Veneno, etc.)
    don.subdons.forEach(subdon => {
      const subdonNode = {
        id: subdon.name.replace(/\s+/g, '_').toUpperCase(), // ID único para el subdon
        name: subdon.name,
        count: 1,
        components: []
      };
      
      // 4. Añadir los ingredientes finales al subdon
      subdon.ingredients.forEach(ingredient => {
        subdonNode.components.push({ ...ingredient });
      });
      
      donNode.components.push(subdonNode);
    });
    
    root.components.push(donNode);
  });

  return root;
}


// Renderiza el Tributo Místico como un árbol único y anidado
async function renderTributo() {
  const container = document.getElementById('tributo-content');
  const loader = document.getElementById('loader-tributo');
  if (!container || !loader) return;

  loader.style.display = 'block';
  container.innerHTML = ''; // Limpiar contenido previo

  try {
    const tributoTree = buildTributoTree();

    let html = `<h2>${tributoTree.name}</h2>`;
    html += `<table class='table-modern-dones tabla-tarjetas'>
      <thead class='header-items'>
        <tr>
          <th>Ícono</th>
          <th>Nombre</th>
          <th>Cantidad</th>
          <th>Precio Buy (u)</th>
          <th>Precio Sell (u)</th>
          <th>Total Buy</th>
          <th>Total Sell</th>
        </tr>
      </thead>
      <tbody>`;

    let totalBuy = 0;
    let totalSell = 0;

    // Renderizar cada componente de nivel superior del árbol de forma recursiva
    for (const component of tributoTree.components) {
      const result = await renderIngredientRowWithComponents(component, 0); // Iniciar en nivel 0
      html += result.html;
      totalBuy += result.totalBuy || 0;
      totalSell += result.totalSell || 0;
    }

    html += `</tbody></table>`;

    // Mostrar los totales generales
    html += `<div class='table-modern-totales' style='margin-bottom:18px;'>
      <div class='precio-totales-dones'>
        <div class='total-dones'><b>Total Buy estimado:</b> ${formatGoldColored(totalBuy)}</div>
        <div class='total-dones'><b>Total Sell estimado:</b> ${formatGoldColored(totalSell)}</div>
      </div>
    </div>`;

    container.innerHTML = html;

  } catch (error) {
    console.error("Error al renderizar Tributo Místico:", error);
    container.innerHTML = '<div class="error-message">Error al cargar el Tributo Místico.</div>';
  } finally {
    loader.style.display = 'none';
  }
}


