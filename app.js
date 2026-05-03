const STORAGE_KEY = 'casteluche-menu-generator-v3-folder-9-organizado';
const MAX_FOLDER_PAGES = 9;
let state = structuredClone(window.MENU_DATA || {});
let activeSection = 'Todos';
let searchTerm = '';

const PRINT_SECTION_ORDER = [
  'Feijoada', 'Pratos Principais', 'Pratos Nordestinos', 'Pratos Feitos', 'Adicionais',
  'Porções', 'Lanches', 'Combo de Lanche', 'Sobremesas',
  'Drinks sem álcool', 'Drinks', 'Dose de Gin', 'Gin', 'Vodka', 'Whisky', 'Copão', 'Combos', 'Extra',
  'Cervejas Lata', 'Long Neck', 'Bebidas Quentes', 'Cachaça Casteluche', 'Licores Casteluche',
  'Vinhos Casteluche', 'Coquetéis Casteluche', 'Águas', 'Refrigerantes', 'Energéticos', 'Sucos', 'Sucos Naturais'
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function cloneBaseData() {
  return structuredClone(window.MENU_DATA || { restaurant: {}, settings: {}, items: [] });
}

function normalizeSettings() {
  state.restaurant = state.restaurant || {};
  state.settings = {
    theme: 'boteco',
    pageFormat: 'folder-9-a4',
    density: 'compact',
    showImages: false,
    showDescriptions: true,
    breakBySection: false,
    maxPages: 9,
    ...(state.settings || {})
  };
  state.settings.maxPages = clampPages(state.settings.maxPages);
  state.items = Array.isArray(state.items) ? state.items : [];
}

function clampPages(value) {
  const parsed = Number(value || MAX_FOLDER_PAGES);
  if (Number.isNaN(parsed)) return MAX_FOLDER_PAGES;
  return Math.max(1, Math.min(MAX_FOLDER_PAGES, Math.round(parsed)));
}

function loadSavedData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = JSON.parse(saved);
  } catch (error) {
    console.warn('Não foi possível carregar dados salvos.', error);
  }
  normalizeSettings();
}

function saveData() {
  normalizeSettings();
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
      sections.push(item.section || 'Sem seção');
    }
  });
  return sections;
}

function filteredItems() {
  const term = searchTerm.trim().toLowerCase();
  return state.items.filter(item => {
    const matchSection = activeSection === 'Todos' || (item.section || 'Sem seção') === activeSection;
    const haystack = [item.category, item.section, item.product, item.price, item.description, item.notes].join(' ').toLowerCase();
    const matchTerm = !term || haystack.includes(term);
    return matchSection && matchTerm;
  });
}

function bindSettings() {
  $('#restaurantName').value = state.restaurant.name || '';
  $('#restaurantWhatsapp').value = state.restaurant.whatsapp || '';
  $('#restaurantInstagram').value = state.restaurant.instagram || '';
  $('#restaurantAddress').value = state.restaurant.address || '';
  $('#restaurantTagline').value = state.restaurant.tagline || '';
  $('#pageFormat').value = state.settings.pageFormat || 'folder-9-a4';
  $('#themeSelect').value = state.settings.theme || 'boteco';
  $('#densitySelect').value = state.settings.density || 'compact';
  $('#maxPages').value = clampPages(state.settings.maxPages || 9);
  $('#showDescriptions').checked = state.settings.showDescriptions !== false;
  $('#showImages').checked = state.settings.showImages === true;
  $('#breakBySection').checked = state.settings.breakBySection === true;

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
    if (event.target.value === 'folder-9-a4') {
      state.settings.maxPages = 9;
      state.settings.density = 'compact';
      state.settings.breakBySection = false;
      $('#maxPages').value = 9;
      $('#densitySelect').value = 'compact';
      $('#breakBySection').checked = false;
    }
    renderPreview();
  });
  $('#themeSelect').addEventListener('change', event => {
    state.settings.theme = event.target.value;
    renderPreview();
  });
  $('#densitySelect').addEventListener('change', event => {
    state.settings.density = event.target.value;
    renderPreview();
  });
  $('#maxPages').addEventListener('input', event => {
    state.settings.maxPages = clampPages(event.target.value);
    event.target.value = state.settings.maxPages;
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

function sectionRank(sectionName) {
  const index = PRINT_SECTION_ORDER.indexOf(sectionName || 'Sem seção');
  return index === -1 ? 999 : index;
}

function orderItemsForPrint() {
  state.items.sort((a, b) => {
    const sectionDiff = sectionRank(a.section) - sectionRank(b.section);
    if (sectionDiff !== 0) return sectionDiff;
    return String(a.product || '').localeCompare(String(b.product || ''), 'pt-BR', { sensitivity: 'base' }) ||
      String(a.option || a.volume || '').localeCompare(String(b.option || b.volume || ''), 'pt-BR', { sensitivity: 'base' });
  });
}

function createFolderSections(items) {
  const bySection = groupBySection(items).sort((a, b) => sectionRank(a.name) - sectionRank(b.name));
  return bySection.map(section => ({
    name: section.name,
    items: groupItemsForFolder(section.items)
  }));
}

function groupItemsForFolder(items) {
  const map = new Map();
  items.forEach(item => {
    const key = [item.product || 'Sem nome', item.description || '', item.notes || ''].join('::');
    if (!map.has(key)) {
      map.set(key, {
        id: item.id,
        product: item.product || 'Sem nome',
        description: item.description || '',
        notes: item.notes || '',
        image: item.image || '',
        variants: [],
        rawItems: []
      });
    }
    const group = map.get(key);
    if (!group.image && item.image) group.image = item.image;
    group.rawItems.push(item);
    group.variants.push({
      label: buildVariantLabel(item),
      price: item.price || '',
      review: !item.price || String(item.price).toLowerCase().includes('revisar')
    });
  });
  return Array.from(map.values()).sort((a, b) => String(a.product).localeCompare(String(b.product), 'pt-BR', { sensitivity: 'base' }));
}

function buildVariantLabel(item) {
  const parts = [item.option, item.volume, item.serve, item.availability]
    .map(value => String(value || '').trim())
    .filter(Boolean);
  return parts.join(' · ');
}

function renderPreview() {
  normalizeSettings();
  const paper = $('#pdfArea');
  const format = state.settings.pageFormat || 'folder-9-a4';
  if (format === 'folder-9-a4') {
    renderFolderPreview(paper);
    return;
  }
  renderFreePreview(paper);
}

function renderFreePreview(paper) {
  const format = state.settings.pageFormat || 'a4-portrait';
  paper.className = `paper format-${format} theme-${state.settings.theme || 'boteco'}`;
  const sections = groupBySection(filteredItems());
  const pageInfo = $('#pageInfo');
  if (pageInfo) pageInfo.textContent = 'Formato livre';

  paper.innerHTML = `
    <div class="menu-cover">
      <div class="brand-block">
        <p class="eyebrow">Menu oficial</p>
        <h2>${escapeHtml(state.restaurant.name || 'Casteluche')}</h2>
        <p>${escapeHtml(state.restaurant.tagline || 'Refeições, porções, lanches, drinks e bebidas')}</p>
      </div>
      <div class="contact-block">
        <span>${escapeHtml(state.restaurant.whatsapp || '')}</span>
        <span>${escapeHtml(state.restaurant.instagram || '')}</span>
        <span>${escapeHtml(state.restaurant.address || '')}</span>
      </div>
    </div>
    <div id="menuPreview" class="menu-preview">
      ${sections.map((section, index) => renderSection(section, index)).join('')}
    </div>
    <footer class="menu-footer">
      <span>Valores sujeitos à alteração.</span>
      <span>Gerado no Gerador de Cardápio Casteluche.</span>
    </footer>
  `;
}

function renderFolderPreview(paper) {
  const maxPages = clampPages(state.settings.maxPages || 9);
  paper.className = `paper menu-book format-folder-9-a4 theme-${state.settings.theme || 'boteco'} density-${state.settings.density || 'compact'}`;
  const sections = createFolderSections(filteredItems());
  const result = paginateSections(sections, maxPages);
  const pages = result.pages.length ? result.pages : [{ sections: [], weight: 0 }];
  paper.innerHTML = pages.map((page, index) => renderFolderPage(page, index + 1, maxPages, result.overflowCount)).join('');
  const pageInfo = $('#pageInfo');
  if (pageInfo) {
    const overflow = result.overflowCount > 0 ? ` · Atenção: ${result.overflowCount} itens forçados na última página` : '';
    pageInfo.textContent = `${pages.length} página(s) geradas · limite ${maxPages}${overflow}`;
  }
}

function sectionWeight(section) {
  return 1.15 + section.items.reduce((total, item) => total + itemWeight(item), 0);
}

function itemWeight(item) {
  const descLength = String(item.description || '').length + String(item.notes || '').length;
  const variantCount = Array.isArray(item.variants) ? item.variants.length : 1;
  let weight = 0.85;
  if (variantCount > 1) weight += Math.min(1.15, variantCount * 0.18);
  if (descLength > 60) weight += 0.18;
  if (descLength > 120) weight += 0.22;
  if (descLength > 190) weight += 0.18;
  if (state.settings.showImages && item.image) weight += 0.35;
  return weight;
}

function pageCapacity(pageIndex) {
  const compact = (state.settings.density || 'compact') === 'compact';
  // Capacidade reduzida para evitar que a página visual caiba no preview mas quebre no PDF.
  if (compact) return 24;
  return pageIndex === 0 ? 18 : 20;
}

function paginateSections(sections, maxPages) {
  const pages = [{ sections: [], weight: 0 }];
  let pageIndex = 0;
  let overflowCount = 0;

  const goNextPage = () => {
    if (pageIndex + 1 >= maxPages) return false;
    pageIndex += 1;
    pages[pageIndex] = pages[pageIndex] || { sections: [], weight: 0 };
    return true;
  };

  const addChunk = (name, items, continuation = false) => {
    const chunkWeight = 1.4 + items.reduce((total, item) => total + itemWeight(item), 0);
    pages[pageIndex].sections.push({ name, items, continuation });
    pages[pageIndex].weight += chunkWeight;
  };

  sections.forEach(section => {
    let remaining = [...section.items];
    let continuation = false;

    while (remaining.length) {
      const current = pages[pageIndex];
      const available = pageCapacity(pageIndex) - current.weight - 1.4;

      if (available < 1.15 && current.sections.length && goNextPage()) continue;

      if (pageIndex + 1 >= maxPages && available < 1.15 && current.sections.length) {
        overflowCount += remaining.length;
        addChunk(section.name, remaining.splice(0), true);
        break;
      }

      let chunk = [];
      let weight = 0;
      while (remaining.length) {
        const nextWeight = itemWeight(remaining[0]);
        const limit = Math.max(1.15, pageCapacity(pageIndex) - pages[pageIndex].weight - 1.4);
        if (chunk.length && weight + nextWeight > limit) break;
        chunk.push(remaining.shift());
        weight += nextWeight;
        if (weight >= limit) break;
      }

      if (!chunk.length && remaining.length) chunk.push(remaining.shift());
      addChunk(section.name, chunk, continuation);
      continuation = true;

      if (remaining.length) {
        if (!goNextPage()) {
          overflowCount += remaining.length;
          addChunk(section.name, remaining.splice(0), true);
          break;
        }
      }
    }
  });

  return { pages: pages.filter(page => page.sections.length), overflowCount };
}

function renderFolderPage(page, pageNumber, maxPages, overflowCount = 0) {
  const isFirst = pageNumber === 1;
  const overflowWarning = overflowCount > 0 && pageNumber === maxPages ? `<div class="folder-warning">Atenção: há itens extras concentrados nesta página. Reduza descrições, desative imagens ou divida o cardápio.</div>` : '';
  return `
    <article class="menu-page">
      <header class="folder-header ${isFirst ? 'first' : ''}">
        <div>
          <p class="eyebrow">Menu oficial</p>
          <h2>${escapeHtml(state.restaurant.name || 'Casteluche')}</h2>
          ${isFirst ? `<p class="folder-tagline">${escapeHtml(state.restaurant.tagline || 'Refeições, porções, lanches, drinks e bebidas')}</p>` : ''}
        </div>
        <div class="folder-contact">
          <span>${escapeHtml(state.restaurant.whatsapp || '')}</span>
          <span>${escapeHtml(state.restaurant.instagram || '')}</span>
          <span>${escapeHtml(state.restaurant.address || '')}</span>
          <strong>Página ${pageNumber}/${maxPages}</strong>
        </div>
      </header>
      <main class="folder-body">
        ${overflowWarning}
        ${page.sections.length ? page.sections.map(renderFolderSection).join('') : '<div class="empty-page">Espaço reservado para novos itens.</div>'}
      </main>
      <footer class="folder-footer">
        <span>Valores sujeitos à alteração.</span>
        <span>Cardápio organizado para pasta A4 de até 9 páginas.</span>
      </footer>
    </article>
  `;
}

function renderFolderSection(section) {
  const title = section.continuation ? `${section.name} — continuação` : section.name;
  return `
    <section class="folder-section">
      <h3>${escapeHtml(title)}</h3>
      <div class="folder-grid">
        ${section.items.map(renderFolderItem).join('')}
      </div>
    </section>
  `;
}

function renderFolderItem(item) {
  const variants = Array.isArray(item.variants) && item.variants.length ? item.variants : [{ label: '', price: item.price || '', review: !item.price }];
  const singleVariant = variants.length === 1;
  const firstVariant = variants[0] || { label: '', price: '', review: true };
  const meta = singleVariant ? firstVariant.label : '';
  const desc = state.settings.showDescriptions && item.description ? `<p class="folder-desc">${escapeHtml(item.description)}</p>` : '';
  const note = item.notes ? `<span class="folder-note">${escapeHtml(item.notes)}</span>` : '';
  const image = state.settings.showImages && item.image ? `<img class="folder-thumb" src="${item.image}" alt="${escapeHtml(item.product)}" />` : '';
  const variantList = !singleVariant ? `
    <div class="folder-variants">
      ${variants.map(variant => `
        <span class="folder-variant ${variant.review ? 'review' : ''}">
          <span>${escapeHtml(variant.label || 'Opção')}</span>
          <b>${escapeHtml(variant.price || 'Revisar')}</b>
        </span>`).join('')}
    </div>` : '';
  return `
    <article class="folder-item ${image ? 'with-thumb' : ''}">
      ${image}
      <div class="folder-item-main">
        <div class="folder-item-top">
          <strong>${escapeHtml(item.product)}</strong>
          ${singleVariant ? `<span class="folder-price ${firstVariant.review ? 'review' : ''}">${escapeHtml(firstVariant.price || 'Revisar')}</span>` : ''}
        </div>
        ${meta ? `<div class="folder-meta">${escapeHtml(meta)}</div>` : ''}
        ${variantList}
        ${desc}
        ${note}
      </div>
    </article>
  `;
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

function autoLayout() {
  orderItemsForPrint();
  state.settings.pageFormat = 'folder-9-a4';
  state.settings.maxPages = 9;
  state.settings.density = 'compact';
  state.settings.showImages = false;
  state.settings.showDescriptions = true;
  state.settings.breakBySection = false;
  activeSection = 'Todos';
  searchTerm = '';
  $('#searchInput').value = '';
  renderAll();
  toast('Layout organizado para pasta A4 em até 9 páginas.');
}

function zeroCategoryPrices() {
  if (activeSection === 'Todos') {
    alert('Escolha primeiro uma categoria/seção no filtro. Depois clique em “Zerar valores da categoria”.');
    return;
  }
  const sectionName = activeSection;
  const targets = state.items.filter(item => (item.section || 'Sem seção') === sectionName);
  if (!targets.length) {
    alert('Não encontrei itens nessa categoria.');
    return;
  }
  if (!confirm(`Zerar os valores de ${targets.length} item(ns) em “${sectionName}”?`)) return;
  targets.forEach(item => {
    item.price = 'R$ 0,00';
    item.priceValue = 0;
  });
  renderAll();
  toast(`Valores zerados em “${sectionName}”.`);
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
  normalizeSettings();
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
      normalizeSettings();
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
  normalizeSettings();
  activeSection = 'Todos';
  renderAll();
}

function formatPdfOptions() {
  const format = state.settings.pageFormat || 'folder-9-a4';
  if (format === 'a4-landscape') return { jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } };
  if (format === 'a5-portrait') return { jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' } };
  return { jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
}

async function generatePdf() {
  normalizeSettings();
  const area = $('#pdfArea');
  const filename = `cardapio-${(state.restaurant.name || 'restaurante').toLowerCase().replace(/\s+/g, '-')}.pdf`;
  if (!window.html2pdf) {
    window.print();
    return;
  }
  const base = formatPdfOptions();
  const isFolder = state.settings.pageFormat === 'folder-9-a4';
  const options = {
    margin: 0,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: isFolder ? 2.2 : 2, useCORS: true, backgroundColor: null, scrollY: 0 },
    pagebreak: isFolder ? { mode: ['css'], before: '.menu-page:not(:first-child)' } : { mode: ['css', 'legacy'] },
    ...base
  };
  await window.html2pdf().set(options).from(area).save();
}

function renderAll() {
  normalizeSettings();
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
    $('#pageFormat').value = state.settings.pageFormat || 'folder-9-a4';
    $('#themeSelect').value = state.settings.theme || 'boteco';
    $('#densitySelect').value = state.settings.density || 'compact';
    $('#maxPages').value = clampPages(state.settings.maxPages || 9);
    $('#showDescriptions').checked = state.settings.showDescriptions !== false;
    $('#showImages').checked = state.settings.showImages === true;
    $('#breakBySection').checked = state.settings.breakBySection === true;
    return;
  }
  bindSettings();
  $('#sectionFilter').addEventListener('change', event => { activeSection = event.target.value; renderEditor(); renderPreview(); });
  $('#searchInput').addEventListener('input', event => { searchTerm = event.target.value; renderEditor(); renderPreview(); });
  $('#btnAddItem').addEventListener('click', addItem);
  $('#btnAutoLayout').addEventListener('click', autoLayout);
  $('#btnZeroCategory').addEventListener('click', zeroCategoryPrices);
  $('#btnSave').addEventListener('click', saveData);
  $('#btnExport').addEventListener('click', exportJson);
  $('#btnReset').addEventListener('click', resetData);
  $('#btnPdf').addEventListener('click', generatePdf);
  $('#jsonImport').addEventListener('change', event => { if (event.target.files?.[0]) importJson(event.target.files[0]); });
  bound = true;
}

loadSavedData();
renderAll();
