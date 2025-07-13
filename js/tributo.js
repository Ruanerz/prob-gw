// js/tributo.js
// Renderiza el Tributo Místico y sus dones compuestos

const TRIBUTO = {
  name: "Tributo Místico",
  mainIngredients: [
    { id: 19675, name: "Trébol místico", type: "account_bound", count: 77, components: [
      { id: 19976, name: "Moneda mística", count: 250 },
      { id: 19721, name: "Pegote de ectoplasma", count: 250 },
      { id: 19925, name: "Esquirla de obsidiana", count: 250 },
      { id: 20796, name: "Piedra filosofal", count: 1500 }
    ]}
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
            { id: 24357, name: "Hueso grande", count: 250 },
            { id: 24356, name: "Hueso pesado", count: 50 },
            { id: 24355, name: "Hueso", count: 50 },
          ]
        },
        {
          name: "Don de colmillos",
          ingredients: [
            { id: 24363, name: "Colmillo feroz", count: 100 },
            { id: 24362, name: "Colmillo grande", count: 250 },
            { id: 24361, name: "Colmillo afilado", count: 50 },
            { id: 24360, name: "Colmillo", count: 50 },
          ]
        },
      ]
    }
  ]
};

const API_ITEM = "https://api.guildwars2.com/v2/items/";
const API_PRICES = "https://api.guildwars2.com/v2/commerce/prices/";



async function fetchItemData(id) {
  const res = await fetch(API_ITEM + id);
  if (!res.ok) throw new Error('No se pudo obtener info de item ' + id);
  return res.json();
}
async function fetchPriceData(id) {
  const res = await fetch(API_PRICES + id);
  if (!res.ok) return null;
  return res.json();
}

async function renderIngredientRowWithComponents(ing, level) {
  const info = await fetchItemData(ing.id);
  const price = await fetchPriceData(ing.id);
  const totalBuyIng = price ? price.buys.unit_price * ing.count : null;
  const totalSellIng = price ? price.sells.unit_price * ing.count : null;
  return `<tr>
    <td><img src='${info.icon}' style='height:28px;'></td>
    <td>${info.name}</td>
    <td>${ing.count}</td>
    <td>${price ? formatGoldColored(price.buys.unit_price) : '-'}</td>
    <td>${price ? formatGoldColored(price.sells.unit_price) : '-'}</td>
    <td>${totalBuyIng ? formatGoldColored(totalBuyIng) : '-'}</td>
    <td>${totalSellIng ? formatGoldColored(totalSellIng) : '-'}</td>
  </tr>`;
}

async function renderTributo() {
  const container = document.getElementById('tributo-content');
  let html = `<h2>${TRIBUTO.name}</h2>`;
  // Mostrar ingredientes principales (Trébol místico) arriba
  if (TRIBUTO.mainIngredients && TRIBUTO.mainIngredients.length > 0) {
    html += `<h3>Ingredientes principales</h3>`;
    html += `<table class='table-modern-dones tabla-tarjetas'><thead class='header-items'><tr><th>Ícono</th><th>Nombre</th><th>Cantidad</th><th>Precio Buy (u)</th><th>Precio Sell (u)</th><th>Total Buy</th><th>Total Sell</th></tr></thead><tbody>`;
    for (const ing of TRIBUTO.mainIngredients) {
      html += await renderIngredientRowWithComponents(ing, 0);
    }
    html += `</tbody></table>`;
    html += `<div class='table-modern-totales' style='margin-bottom:18px;'>
      <b>Total Buy estimado:</b> —<br>
      <b>Total Sell estimado:</b> —
    </div>`;
  }
  // --- Render dons y subdons ---
  for (const don of TRIBUTO.dons) {
    html += `<h3>${don.name}</h3>`;
    for (const subdon of don.subdons) {
      html += `<h4>${subdon.name}</h4>`;
      html += `<table class='table-modern tabla-tarjetas'><thead><tr><th>Ícono</th><th>Nombre</th><th>Cantidad</th><th>Precio Buy (u)</th><th>Precio Sell (u)</th><th>Total Buy</th><th>Total Sell</th></tr></thead><tbody>`;
      let totalBuy = 0;
      let totalSell = 0;
      const ingredientes = await Promise.all(subdon.ingredients.map(async ing => {
        const info = await fetchItemData(ing.id);
        const price = await fetchPriceData(ing.id);
        return {
          id: ing.id,
          name: info.name,
          icon: info.icon,
          count: ing.count,
          priceBuy: price ? price.buys.unit_price : null,
          priceSell: price ? price.sells.unit_price : null
        };
      }));
      for (const ing of ingredientes) {
        const totalBuyIng = ing.priceBuy ? ing.priceBuy * ing.count : null;
        const totalSellIng = ing.priceSell ? ing.priceSell * ing.count : null;
        if (totalBuyIng) totalBuy += totalBuyIng;
        if (totalSellIng) totalSell += totalSellIng;
        html += `<tr>
          <td><img src='${ing.icon}' style='height:28px;'></td>
          <td>${ing.name}</td>
          <td>${ing.count}</td>
          <td>${ing.priceBuy ? formatGoldColored(ing.priceBuy) : '-'}</td>
          <td>${ing.priceSell ? formatGoldColored(ing.priceSell) : '-'}</td>
          <td>${totalBuyIng ? formatGoldColored(totalBuyIng) : '-'}</td>
          <td>${totalSellIng ? formatGoldColored(totalSellIng) : '-'}</td>
        </tr>`;
      }
      html += `</tbody></table>`;
      html += `<div class='table-modern-totales' style='margin-bottom:18px;'>
        <b>Total Buy estimado:</b> ${formatGoldColored(totalBuy)}<br>
        <b>Total Sell estimado:</b> ${formatGoldColored(totalSell)}
      </div>`;
    }
  }
  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', renderTributo);
