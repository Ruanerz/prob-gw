// --- UI dinámico para fractales-gold.html ---
// Variables globales para precios de fractales (se deben actualizar con fetch/cálculo real)
export let valorCompra75919 = 0;
export let valorVenta75919 = 0;
export let valorCompra73248 = 0;
export let valorVenta73248 = 0;

export function setValoresFractales({ compra75919, venta75919, compra73248, venta73248 }) {
  valorCompra75919 = compra75919;
  valorVenta75919 = venta75919;
  valorCompra73248 = compra73248;
  valorVenta73248 = venta73248;
}
import { FRACTALES_ITEMS, FRACTAL_STACKS, getItemsConMercado, keyToNombre } from './fractales-gold-logic.js';

let contribucionesChart = null;
let abrirVenderChart = null;
// --- Helper para obtener precios de múltiples ítems en una sola llamada ---
export async function fetchItemPrices(ids = []) {
  if (!ids || ids.length === 0) return {};
  const url = `https://api.datawars2.ie/gw2/v1/items/csv?fields=id,buy_price,sell_price&ids=${ids.join(',')}`;
  try {
    const csv = await fetch(url).then(r => r.text());
    const [header, ...rows] = csv.trim().split('\n');
    const headers = header.split(',');
    const idIdx = headers.indexOf('id');
    const buyIdx = headers.indexOf('buy_price');
    const sellIdx = headers.indexOf('sell_price');
    const result = {};
    rows.forEach(row => {
      const cols = row.split(',');
      const id = parseInt(cols[idIdx], 10);
      if (!isNaN(id)) {
        result[id] = {
          buy_price: parseInt(cols[buyIdx], 10) || 0,
          sell_price: parseInt(cols[sellIdx], 10) || 0
        };
      }
    });
    return result;
  } catch (e) {
    return {};
  }
}

// --- Renderiza la tabla de promedios por stack ---
export async function renderTablaPromedios(containerId = 'tabla-promedios') {
  try {
    const sets = FRACTAL_STACKS;
    const claves = [
      { key: 'oro_de_basura', nombre: 'Oro crudo' },
      { key: 'garra', nombre: 'Garra potente' },
      { key: 'totem', nombre: 'Tótem intrincado' },
      { key: 'sangre', nombre: 'Vial de sangre potente' },
      { key: 'veneno', nombre: 'Vesícula de veneno potente' },
    { key: 'hueso', nombre: 'Hueso grande' },
    { key: 'escama', nombre: 'Escama blindada' },
    { key: 'colmillo', nombre: 'Colmillo afilado' },
    { key: 'polvo', nombre: 'Montón de polvo incandescente' },
    { key: 'infusion_mas1', nombre: 'Infusión +1' },
    { key: 'llaves_encriptacion', nombre: 'Llaves de encriptación' },
    { key: 'empíreos', nombre: 'Empíreos' },
    { key: 'recetas_ascendentes', nombre: 'Recetas ascendentes' },
    { key: 'hematites', nombre: 'Hematites' },
    { key: 'dragonita', nombre: 'Dragonita' },
    { key: 'sacos_reliquias', nombre: 'Sacos de reliquias' },
    { key: 'saco_equipamiento', nombre: 'Saco de equipamiento' },
    { key: 'miniatura', nombre: 'Miniatura' }
  ];
    const promedios = {};
    claves.forEach(({ key }) => {
      let suma = 0, sumaStacks = 0, apariciones = 0;
      sets.forEach(set => {
        if (set.data[key] !== undefined) {
          suma += set.data[key];
          sumaStacks += set.stacks;
        apariciones++;
      }
    });
    if (apariciones === 1) {
      const set = sets.find(s => s.data[key] !== undefined);
      promedios[key] = set.data[key] / set.stacks;
    } else if (apariciones > 1) {
      promedios[key] = suma / sumaStacks;
    } else {
      promedios[key] = undefined;
    }
    });
    const html = `
      <table class="table-modern">
        <thead>
          <tr>
            <th><div class="dato-item">Recompensa</div></th>
            <th><div class="dato-item">Promedio por stack</div></th>
        </tr>
      </thead>
      <tbody>
        ${claves.map(({ key, nombre }) => `
          <tr>
            <td><div class="dato-item">${nombre}</div></td>
            <td><div class="dato-item-info">${promedios[key] !== undefined ? (key === 'oro_de_basura' ? window.formatGold(promedios[key]) : promedios[key].toFixed(2)) : '-'}</div></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
    document.getElementById(containerId).innerHTML = html;
  } catch (err) {
    console.error('Error en renderTablaPromedios:', err);
  }
}

// --- Renderiza la tabla de precios unitarios de materiales ---
export async function renderTablaPrecios(containerId = 'tabla-precios-fractales') {
  try {
    const items = getItemsConMercado();
    let itemsMostrar = [...items];
    if (!itemsMostrar.find(i => i.key === 'infusion_mas1')) {
      const infusion = FRACTALES_ITEMS.find(i => i.key === 'infusion_mas1');
      if (infusion) itemsMostrar.push(infusion);
    }
    // Calcular promedios ponderados por material (igual que en renderTablaPromedios)
    const sets = FRACTAL_STACKS;
    const promedios = {};
    itemsMostrar.forEach(item => {
      let suma = 0, sumaStacks = 0, apariciones = 0;
      sets.forEach(set => {
        if (set.data[item.key] !== undefined) {
          suma += set.data[item.key];
          sumaStacks += set.stacks;
        apariciones++;
      }
    });
    if (apariciones === 1) {
      const set = sets.find(s => s.data[item.key] !== undefined);
      promedios[item.key] = set.data[item.key] / set.stacks;
    } else if (apariciones > 1) {
      promedios[item.key] = suma / sumaStacks;
    } else {
      promedios[item.key] = undefined;
    }
    });
    const priceMap = await fetchItemPrices(itemsMostrar.map(i => i.id));
    const precios = itemsMostrar.map(item => ({
      ...item,
      buy_price: priceMap[item.id]?.buy_price || 0,
      sell_price: priceMap[item.id]?.sell_price || 0
    }));
    const html = `
      <table class="table-modern">
        <thead>
          <tr>
            <th><div class="dato-item">Material</div></th>
          <th><div class="dato-item">Precio compra</div></th>
          <th><div class="dato-item">Precio venta</div></th>
          <th><div class="dato-item">Total compra (prom)</div></th>
          <th><div class="dato-item">Total venta (prom)</div></th>
        </tr>
      </thead>
      <tbody>
        ${precios.map(item => {
          const promedio = promedios[item.key];
          const totalCompra = (promedio !== undefined) ? window.formatGold(Math.round(item.buy_price * promedio)) : '-';
          const totalVenta = (promedio !== undefined) ? window.formatGold(Math.round(item.sell_price * promedio)) : '-';
          return `
            <tr>
              <td><div class="dato-item">${keyToNombre(item.key)}</div></td>
              <td><div class="dato-item-info">${window.formatGold(item.buy_price)}</div></td>
              <td><div class="dato-item-info">${window.formatGold(item.sell_price)}</div></td>
              <td><div class="dato-item-info">${totalCompra}</div></td>
              <td><div class="dato-item-info">${totalVenta}</div></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
    document.getElementById(containerId).innerHTML = html;
  } catch (err) {
    console.error('Error en renderTablaPrecios:', err);
  }
}

// --- Renderiza la tabla resumen de oro crudo + materiales × 0.85 ---
export async function renderTablaResumenOro(containerId = 'tabla-resumen-oro', preciosFractales = {}) {
  try {
    // 1. Promedio de oro crudo
    const sets = FRACTAL_STACKS;
    let suma = 0, sumaStacks = 0;
    sets.forEach(set => {
      if (set.data["oro_de_basura"] !== undefined) {
        suma += set.data["oro_de_basura"];
        sumaStacks += set.stacks;
      }
    });
    const promedioOro = sumaStacks > 0 ? suma / sumaStacks : 0;

  // 2. Precios de materiales comerciables
    const items = getItemsConMercado();
    // Incluye la infusión si no está
    let itemsMostrar = [...items];
    if (!itemsMostrar.find(i => i.key === 'infusion_mas1')) {
      const infusion = FRACTALES_ITEMS.find(i => i.key === 'infusion_mas1');
      if (infusion) itemsMostrar.push(infusion);
    }
    // Fetch precios
    const priceMap = await fetchItemPrices(itemsMostrar.map(i => i.id));
    const precios = itemsMostrar.map(item => ({
      ...item,
      buy_price: priceMap[item.id]?.buy_price || 0,
      sell_price: priceMap[item.id]?.sell_price || 0
    }));

  // 3. Promedios por material (solo los comerciables)
    const setsPromedios = FRACTAL_STACKS;
    const promedios = {};
    precios.forEach(item => {
      let suma = 0, sumaStacks = 0, apariciones = 0;
      setsPromedios.forEach(set => {
        if (set.data[item.key] !== undefined) {
          suma += set.data[item.key];
          sumaStacks += set.stacks;
          apariciones++;
        }
      });
      if (apariciones === 1) {
        const set = setsPromedios.find(s => s.data[item.key] !== undefined);
        promedios[item.key] = set.data[item.key] / set.stacks;
      } else if (apariciones > 1) {
        promedios[item.key] = suma / sumaStacks;
      } else {
        promedios[item.key] = undefined;
      }
    });

  // 4. Sumar totales de compra/venta
    let totalCompra = 0, totalVenta = 0;
    precios.forEach(item => {
      const promedio = promedios[item.key];
      if (promedio !== undefined) {
        totalCompra += item.buy_price * promedio;
        totalVenta += item.sell_price * promedio;
      }
    });

  // 5. Aplicar 0.85 y sumar oro crudo
    const sumaCompra = promedioOro + (totalCompra * 0.85);
    const sumaVenta = promedioOro + (totalVenta * 0.85);
    const contribuciones = [{ nombre: "Oro crudo", valor: promedioOro }];
    precios.forEach(item => {
      const promedio = promedios[item.key];
      if (promedio !== undefined) {
        contribuciones.push({ nombre: keyToNombre(item.key), valor: item.sell_price * promedio * 0.85 });
      }
    });


  // 7. Render tabla
    const htmlResumen = `
      <table class="table-modern" style="margin-top:12px;">
        <thead>
          <tr>
            <th><div class="dato-item">Resumen</div></th>
          <th><div class="dato-item">Valor total</div></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><div class="dato-item">Oro crudo + (Total compra × 0.85)</div></td>
          <td><div class="dato-item-info">${window.formatGold(Math.round(sumaCompra))}</div></td>
        </tr>
        <tr>
          <td><div class="dato-item">Oro crudo + (Total venta × 0.85)</div></td>
          <td><div class="dato-item-info">${window.formatGold(Math.round(sumaVenta))}</div></td>
        </tr>
      </tbody>
    </table>
  `;
    document.getElementById(containerId).innerHTML = htmlResumen;
    return { sumaCompra, sumaVenta, contribuciones };
  } catch (err) {
    console.error('Error en renderTablaResumenOro:', err);
  }
}



export function renderTablaReferenciasProfit(containerId = 'tabla-referencias-profit', preciosFractales = {}, resumen = {}) {
  const {
    compra75919 = 0,
    venta75919 = 0,
    compra73248 = 0,
    venta73248 = 0
  } = preciosFractales;
  const { sumaVenta = 0 } = resumen;
  const costoAbrir = (compra75919 + compra73248) * 250;
  const roi = costoAbrir > 0 ? ((sumaVenta - costoAbrir) / costoAbrir) * 100 : 0;
  const htmlFractales = `
    <table class="table-modern" style="margin-top:0;">
      <thead>
        <tr>
          <th><div class="dato-item">Resumen</div></th>
          <th><div class="dato-item">Valor total</div></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><div class="dato-item">Encriptación fractal (compra ×250)</div></td>
          <td><div class="dato-item-info">${window.formatGold(compra75919 * 250)}</div></td>
        </tr>
        <tr>
          <td><div class="dato-item">Encriptación fractal (venta ×250)</div></td>
          <td><div class="dato-item-info">${window.formatGold(venta75919 * 250)}</div></td>
        </tr>
        <tr>
          <td><div class="dato-item">Matriz estabilizadora (compra ×250)</div></td>
          <td><div class="dato-item-info">${window.formatGold(compra73248 * 250)}</div></td>
        </tr>
        <tr>
          <td><div class="dato-item">Matriz estabilizadora (venta ×250)</div></td>
          <td><div class="dato-item-info">${window.formatGold(venta73248 * 250)}</div></td>
        </tr>
        <tr>
          <td><div class="dato-item">Suma Encriptación + Matriz (compra) - 15% de comisión</div></td>
          <td><div class="dato-item-info">${window.formatGold(((compra75919 + compra73248) * 250) * 0.85)}</div></td>
        </tr>
        <tr>
          <td><div class="dato-item">Suma Encriptación + Matriz (venta) - 15% de comisión</div></td>
          <td><div class="dato-item-info">${window.formatGold(((venta75919 + venta73248) * 250) * 0.85)}</div></td>
        </tr>
        <tr>
          <td><div class="dato-item"><strong>ROI abrir stack</strong></div></td>
          <td><div class="dato-item-info" style="color:${roi>=0 ? 'green' : 'red'};">${roi.toFixed(2)} %</div></td>
        </tr>
      </tbody>
    </table>
  `;
  document.getElementById(containerId).innerHTML = htmlFractales;
}

export function renderGraficoContribuciones(contribuciones = [], containerId = 'contribuciones-chart') {
  const ctx = document.getElementById(containerId)?.getContext('2d');
  if (!ctx) return;
  if (contribucionesChart) contribucionesChart.destroy();
  const labels = contribuciones.map(c => c.nombre);
  const data = contribuciones.map(c => c.valor / 10000);
  contribucionesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Oro',
        data,
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Oro' } } }
    }
  });
}

export function renderGraficoAbrirVsVender(containerId = 'abrir-vs-vender-chart', preciosFractales = {}, resumen = {}) {
  const ctx = document.getElementById(containerId)?.getContext('2d');
  if (!ctx) return;
  if (abrirVenderChart) abrirVenderChart.destroy();

  const {
    venta75919 = 0,
    compra75919 = 0,
    compra73248 = 0
  } = preciosFractales;
  const { sumaVenta = 0 } = resumen;

  const venderStack = venta75919 * 250 * 0.85;
  const abrirConLlaves = sumaVenta;
  const abrirComprandoMatrices = abrirConLlaves - compra73248 * 250;
  const abrirComprandoAmbos = abrirConLlaves - (compra75919 + compra73248) * 250;

  abrirVenderChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [
        'Vender stack de encriptación',
        'Abrir con llaves',
        'Abrir comprando matrices',
        'Abrir comprando matrices y encriptaciones'
      ],
      datasets: [{
        label: 'Oro',
        data: [
          venderStack / 10000,
          abrirConLlaves / 10000,
          abrirComprandoMatrices / 10000,
          abrirComprandoAmbos / 10000
        ],
        backgroundColor: [
          'rgba(255,99,132,0.6)',
          'rgba(75,192,192,0.6)',
          'rgba(255,206,86,0.6)',
          'rgba(153,102,255,0.6)'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Oro' }
        }
      }
    }
  });
}
