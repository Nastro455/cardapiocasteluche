const STORAGE_KEY = 'casteluche-menu-generator-v1';
let state = structuredClone(window.MENU_DATA || {});
let activeSection = 'Todos';
let searchTerm = '';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function cloneBaseData() {
  return structuredClone(window.MENU_DATA || { restaurant: {}, settings: {}, items: [] });
}

function loadSavedData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = JSON.parse(saved);
  } catch (error) {
    console.warn('Não foi possível carregar dados salvos.', error);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  toast('Cardápio salvo no navegador.');
}

function toast(message) {
  const existing = $('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast no-print';
  el.textContent = message;
  Object.assign(el.style, {
    position: 'fixed', right: '20px', bottom: '20px', padding: '14px 18px', borderRadius: '999px',
    background: '#c9973f', color: '#1b1207', fontWeight: '900', zIndex: 9999,
    boxShadow: '0 18px 50px rgba(0,0,0,.32)'
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function onlyFilled(values) {
  return values.filter(Boolean).join(' · ');
}

function getSections() {
  const seen = new Set();
  const sections = [];
  state.items.forEach(item => {
    if (!seen.has(item.section)) {
      seen.add(item.section);
      sections.push(item.section);
    }
  });
  return sections;
}

function filteredItems() {
  const term = searchTerm.trim().toLowerCase();
  return state.items.filter(item => {
    const matchesSection = activeSection === 'Todos' || item.section === activeSection;
    const haystack = [item.category, item.section, item.product, item.option, item.volume, item.serve, item.price, item.description, item.availability, item.notes].join(' ').toLowerCase();
    return matchesSection && (!term || haystack.includes(term));
  });
}

function bindSettings() {
  const r = state.restaurant;
  $('#restaurantName').value = r.name || '';
  $('#restaurantWhatsapp').value = r.whatsapp || '';
  $('#restaurantInstagram').value = r.instagram || '';
  $('#restaurantAddress').value = r.address || '';
  $('#restaurantTagline').value = r.tagline || '';
  $('#pageFormat').value = state.settings.pageFormat || 'a4-portrait';
  $('#themeSelect').value = state.settings.theme || 'boteco';
  $('#showDescriptions').checked = state.settings.showDescriptions !== false;
  $('#showImages').checked = state.settings.showImages !== false;
  $('#breakBySection').checked = state.settings.breakBySection !== false;

  ['restaurantName','restaurantWhatsapp','restaurantInstagram','restaurantAddress','restaurantTagline'].forEach(id => {
    $('#'+id).addEventListener('input', event => {
      const map = {
        restaurantName: 'name', restaurantWhatsapp: 'whatsapp', restaurantInstagram: 'instagram',
        restaurantAddress: 'address', restaurantTagline: 'tagline'
      };
      state.restaurant[map[id]] = event.target.value;
      renderPreview();
    });
  });

  $('#pageFormat').addEventListener('change', event => {
    state.settings.pageFormat = event.target.value;
    renderPreview();
  });
  $('#themeSelect').addEventListener('change', event => {
    state.settings.theme = event.target.value;
    renderPreview();
  });
  $('#showDescriptions').addEventListener('change', event => {
    state.settings.showDescriptions = event.target.checked;
    renderPreview();
  });
  $('#showImages').addEventListener('change', event => {
    state.settings.showImages = event.target.checked;
    renderPreview();
  });
  $('#breakBySection').addEventListener('change', event => {
    state.settings.breakBySection = event.target.checked;
    renderPreview();
  });
}

function renderSectionFilter() {
  const select = $('#sectionFilter');
  const sections = ['Todos', ...getSections()];
  select.innerHTML = sections.map(section => `<option value="${escapeHtml(section)}">${escapeHtml(section)}</option>`).join('');
  select.value = activeSection;
}

function renderEditor() {
  renderSectionFilter();
  const list = $('#editorList');
  const template = $('#editorItemTemplate');
  const items = filteredItems();
  $('#itemCount').textContent = `${items.length} itens no filtro · ${state.items.length} itens totais`;
  list.innerHTML = '';

  items.forEach(item => {
    const node = template.content.cloneNode(true);
    const card = $('.editor-card', node);
    card.dataset.id = item.id;
    $('[data-field="product"]', card).textContent = item.product || 'Novo item';

    $$('[data-input]', card).forEach(input => {
      const key = input.dataset.input;
      if (input.type !== 'file') input.value = item[key] || '';
      input.addEventListener('input', event => {
        item[key] = event.target.value;
        if (key === 'product') $('[data-field="product"]', card).textContent = item.product || 'Novo item';
        renderPreview();
      });
      if (input.type === 'file') {
        input.addEventListener('change', event => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            item.image = reader.result;
            renderPreview();
            toast('Imagem aplicada ao item. Salve para manter no navegador.');
          };
          reader.readAsDataURL(file);
        });
      }
    });

    $('[data-action="delete"]', card).addEventListener('click', () => {
      if (!confirm(`Excluir "${item.product}"?`)) return;
      state.items = state.items.filter(i => i.id !== item.id);
      renderAll();
    });
    list.appendChild(node);
  });
}

function groupBySection(items) {
  const sections = [];
  const map = new Map();
  items.forEach(item => {
    const name = item.section || 'Sem seção';
    if (!map.has(name)) {
      map.set(name, []);
      sections.push(name);
    }
    map.get(name).push(item);
  });
  return sections.map(name => ({ name, items: map.get(name) }));
}

function renderPreview() {
  const paper = $('#pdfArea');
  paper.className = `paper format-${state.settings.pageFormat || 'a4-portrait'} theme-${state.settings.theme || 'boteco'}`;
  $('#previewRestaurantName').textContent = state.restaurant.name || 'Casteluche';
  $('#previewWhatsapp').textContent = state.restaurant.whatsapp || '';
  $('#previewInstagram').textContent = state.restaurant.instagram || '';
  $('#previewAddress').textContent = state.restaurant.address || '';
  $('#previewTagline').textContent = state.restaurant.tagline || '';

  const menu = $('#menuPreview');
  const sections = groupBySection(filteredItems());
  menu.innerHTML = sections.map((section, index) => renderSection(section, index)).join('');
}

function renderSection(section, index) {
  const pageBreak = state.settings.breakBySection && index > 0 ? ' page-break' : '';
  return `
    <section class="section${pageBreak}">
      <header class="section-header">
        <h3 class="section-title">${escapeHtml(section.name)}</h3>
        <span class="section-count">${section.items.length} itens</span>
      </header>
      <div class="menu-grid">
        ${section.items.map(renderMenuItem).join('')}
      </div>
    </section>
  `;
}

function renderMenuItem(item) {
  const meta = onlyFilled([item.option, item.volume, item.serve, item.availability]);
  const hasImage = state.settings.showImages && item.image;
  const imageHtml = state.settings.showImages ? `<div class="item-image">${hasImage ? `<img src="${item.image}" alt="${escapeHtml(item.product)}" />` : initials(item.product)}</div>` : '';
  const desc = state.settings.showDescriptions && item.description ? `<p class="item-desc">${escapeHtml(item.description)}</p>` : '';
  const note = item.notes ? `<span class="item-note">${escapeHtml(item.notes)}</span>` : '';
  const review = !item.price || String(item.price).toLowerCase().includes('revisar');
  return `
    <article class="menu-item">
      ${imageHtml}
      <div class="item-main">
        <h4 class="item-name">${escapeHtml(item.product)}</h4>
        ${meta ? `<div class="item-meta">${escapeHtml(meta)}</div>` : ''}
        ${desc}
        ${note}
      </div>
      <div class="item-price ${review ? 'review' : ''}">${escapeHtml(item.price || 'Revisar')}</div>
    </article>
  `;
}

function initials(text = '') {
  const parts = text.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]).join('').toUpperCase() || 'C';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[char]));
}

function addItem() {
  const section = activeSection === 'Todos' ? 'Nova seção' : activeSection;
  state.items.unshift({
    id: `${Date.now()}-novo-item`, category: 'Cardápio', section, product: 'Novo item', option: '', volume: '', serve: '',
    price: 'R$ 0,00', priceValue: 0, description: '', availability: '', notes: '', image: ''
  });
  activeSection = section;
  renderAll();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cardapio-${(state.restaurant.name || 'restaurante').toLowerCase().replace(/\s+/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported.items || !Array.isArray(imported.items)) throw new Error('JSON sem lista de itens.');
      state = imported;
      activeSection = 'Todos';
      renderAll();
      toast('JSON importado com sucesso.');
    } catch (error) {
      alert('Não consegui importar esse JSON. Confira o arquivo.');
      console.error(error);
    }
  };
  reader.readAsText(file);
}

function resetData() {
  if (!confirm('Restaurar a base original da planilha? Isso apaga alterações salvas no navegador.')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = cloneBaseData();
  activeSection = 'Todos';
  renderAll();
}

function formatPdfOptions() {
  const format = state.settings.pageFormat || 'a4-portrait';
  if (format === 'a4-landscape') return { jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } };
  if (format === 'a5-portrait') return { jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' } };
  return { jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
}

async function generatePdf() {
  const area = $('#pdfArea');
  const filename = `cardapio-${(state.restaurant.name || 'restaurante').toLowerCase().replace(/\s+/g, '-')}.pdf`;
  if (!window.html2pdf) {
    window.print();
    return;
  }
  const base = formatPdfOptions();
  const options = {
    margin: 0,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: null },
    pagebreak: { mode: ['css', 'legacy'] },
    ...base
  };
  await window.html2pdf().set(options).from(area).save();
}

function renderAll() {
  bindValuesNoDuplicate();
  renderEditor();
  renderPreview();
}

let bound = false;
function bindValuesNoDuplicate() {
  if (bound) {
    $('#restaurantName').value = state.restaurant.name || '';
    $('#restaurantWhatsapp').value = state.restaurant.whatsapp || '';
    $('#restaurantInstagram').value = state.restaurant.instagram || '';
    $('#restaurantAddress').value = state.restaurant.address || '';
    $('#restaurantTagline').value = state.restaurant.tagline || '';
    $('#pageFormat').value = state.settings.pageFormat || 'a4-portrait';
    $('#themeSelect').value = state.settings.theme || 'boteco';
    $('#showDescriptions').checked = state.settings.showDescriptions !== false;
    $('#showImages').checked = state.settings.showImages !== false;
    $('#breakBySection').checked = state.settings.breakBySection !== false;
    return;
  }
  bindSettings();
  $('#sectionFilter').addEventListener('change', event => { activeSection = event.target.value; renderEditor(); renderPreview(); });
  $('#searchInput').addEventListener('input', event => { searchTerm = event.target.value; renderEditor(); renderPreview(); });
  $('#btnAddItem').addEventListener('click', addItem);
  $('#btnSave').addEventListener('click', saveData);
  $('#btnExport').addEventListener('click', exportJson);
  $('#btnReset').addEventListener('click', resetData);
  $('#btnPdf').addEventListener('click', generatePdf);
  $('#jsonImport').addEventListener('change', event => { if (event.target.files?.[0]) importJson(event.target.files[0]); });
  bound = true;
}

loadSavedData();
renderAll();
