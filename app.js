const STORAGE_KEY = 'casteluche-menu-generator-v4-layout-pdf-logo-qr';
const MAX_FOLDER_PAGES = 9;
let state = structuredClone(window.MENU_DATA || {});
let activeSection = 'Todos';
let searchTerm = '';
let bound = false;

const PRINT_SECTION_ORDER = [
  'Feijoada', 'Pratos Principais', 'Pratos Nordestinos', 'Pratos Feitos', 'Adicionais',
  'Porções', 'Lanches', 'Combo de Lanche', 'Sobremesas',
  'Drinks sem álcool', 'Drinks', 'Dose de Gin', 'Gin', 'Vodka', 'Whisky', 'Copão', 'Combos', 'Extra',
  'Cervejas Lata', 'Long Neck', 'Bebidas Quentes', 'Cachaça Casteluche', 'Licores Casteluche',
  'Vinhos Casteluche', 'Coquetéis Casteluche', 'Águas', 'Refrigerantes', 'Energéticos', 'Sucos', 'Sucos Naturais'
];

const FORMAT_CONFIGS = {
  'folder-9-a4': {
    label: 'Pasta A4', css: 'format-folder-9-a4', widthPx: 794, heightPx: 1123, widthMm: 210, heightMm: 297,
    orientation: 'portrait', pdfFormat: 'a4', columns: 2, compactCapacity: 24, normalCapacity: 18, forceMaxPages: true
  },
  'a4-portrait': {
    label: 'A4 vertical', css: 'format-a4-portrait', widthPx: 794, heightPx: 1123, widthMm: 210, heightMm: 297,
    orientation: 'portrait', pdfFormat: 'a4', columns: 2, compactCapacity: 24, normalCapacity: 18
  },
  'a4-landscape': {
    label: 'A4 horizontal', css: 'format-a4-landscape', widthPx: 1123, heightPx: 794, widthMm: 297, heightMm: 210,
    orientation: 'landscape', pdfFormat: 'a4', columns: 3, compactCapacity: 18, normalCapacity: 14
  },
  'a5-portrait': {
    label: 'A5 vertical', css: 'format-a5-portrait', widthPx: 560, heightPx: 794, widthMm: 148, heightMm: 210,
    orientation: 'portrait', pdfFormat: 'a5', columns: 1, compactCapacity: 13, normalCapacity: 10
  },
  'feed-4x5': {
    label: 'Feed 4:5', css: 'format-feed-4x5', widthPx: 720, heightPx: 900, widthMm: 108, heightMm: 135,
    orientation: 'portrait', pdfFormat: [108, 135], columns: 1, compactCapacity: 10, normalCapacity: 7
  },
  'story-9x16': {
    label: 'Stories 9:16', css: 'format-story-9x16', widthPx: 720, heightPx: 1280, widthMm: 90, heightMm: 160,
    orientation: 'portrait', pdfFormat: [90, 160], columns: 1, compactCapacity: 12, normalCapacity: 8
  }
};

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
    headerBrandMode: 'text',
    showQrCode: false,
    ...(state.settings || {})
  };
  state.settings.maxPages = clampPages(state.settings.maxPages);
  if (!FORMAT_CONFIGS[state.settings.pageFormat]) state.settings.pageFormat = 'folder-9-a4';
  if (!['compact', 'normal'].includes(state.settings.density)) state.settings.density = 'compact';
  if (!['text', 'logo'].includes(state.settings.headerBrandMode)) state.settings.headerBrandMode = 'text';
  state.items = Array.isArray(state.items) ? state.items : [];
}

function clampPages(value) {
  const parsed = Number(value || MAX_FOLDER_PAGES);
  if (Number.isNaN(parsed)) return MAX_FOLDER_PAGES;
  return Math.max(1, Math.min(MAX_FOLDER_PAGES, Math.round(parsed)));
}

function getCurrentConfig() {
  return FORMAT_CONFIGS[state.settings.pageFormat] || FORMAT_CONFIGS['folder-9-a4'];
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
  setTimeout(() => el.remove(), 2800);
}

function onlyFilled(values) {
  return values.map(value => String(value || '').trim()).filter(Boolean).join(' · ');
}

function getSections() {
  const seen = new Set();
  const sections = [];
  state.items.forEach(item => {
    const name = item.section || 'Sem seção';
    if (!seen.has(name)) {
      seen.add(name);
      sections.push(name);
    }
  });
  return sections;
}

function filteredItems() {
  const term = searchTerm.trim().toLowerCase();
  return state.items.filter(item => {
    const matchSection = activeSection === 'Todos' || (item.section || 'Sem seção') === activeSection;
    const haystack = [item.category, item.section, item.product, item.price, item.description, item.notes, item.option, item.volume].join(' ').toLowerCase();
    const matchTerm = !term || haystack.includes(term);
    return matchSection && matchTerm;
  });
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

function bindSettings() {
  setControlValues();

  ['restaurantName','restaurantWhatsapp','restaurantInstagram','restaurantAddress','restaurantTagline','qrLabel'].forEach(id => {
    const el = $('#'+id);
    if (!el) return;
    el.addEventListener('input', event => {
      const map = {
        restaurantName: 'name', restaurantWhatsapp: 'whatsapp', restaurantInstagram: 'instagram',
        restaurantAddress: 'address', restaurantTagline: 'tagline', qrLabel: 'qrLabel'
      };
      state.restaurant[map[id]] = event.target.value;
      renderPreview();
    });
  });

  $('#headerBrandMode').addEventListener('change', event => {
    state.settings.headerBrandMode = event.target.value;
    renderPreview();
  });

  $('#showQrCode').addEventListener('change', event => {
    state.settings.showQrCode = event.target.checked;
    renderPreview();
  });

  $('#logoUpload').addEventListener('change', event => readImageFile(event.target.files?.[0], dataUrl => {
    state.restaurant.logo = dataUrl;
    state.settings.headerBrandMode = 'logo';
    $('#headerBrandMode').value = 'logo';
    renderPreview();
    toast('Logo aplicado no cabeçalho.');
  }));

  $('#qrUpload').addEventListener('change', event => readImageFile(event.target.files?.[0], dataUrl => {
    state.restaurant.qrImage = dataUrl;
    state.settings.showQrCode = true;
    $('#showQrCode').checked = true;
    renderPreview();
    toast('QR Code aplicado no cabeçalho.');
  }));

  $('#btnClearLogo').addEventListener('click', () => {
    state.restaurant.logo = '';
    state.settings.headerBrandMode = 'text';
    $('#headerBrandMode').value = 'text';
    $('#logoUpload').value = '';
    renderPreview();
    toast('Logo removido.');
  });

  $('#btnClearQr').addEventListener('click', () => {
    state.restaurant.qrImage = '';
    state.settings.showQrCode = false;
    $('#showQrCode').checked = false;
    $('#qrUpload').value = '';
    renderPreview();
    toast('QR Code removido.');
  });

  $('#pageFormat').addEventListener('change', event => {
    state.settings.pageFormat = event.target.value;
    state.settings.maxPages = clampPages(state.settings.maxPages || 9);
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

function setControlValues() {
  const values = {
    restaurantName: state.restaurant.name || '',
    restaurantWhatsapp: state.restaurant.whatsapp || '',
    restaurantInstagram: state.restaurant.instagram || '',
    restaurantAddress: state.restaurant.address || '',
    restaurantTagline: state.restaurant.tagline || '',
    qrLabel: state.restaurant.qrLabel || 'Cardápio virtual',
    pageFormat: state.settings.pageFormat || 'folder-9-a4',
    themeSelect: state.settings.theme || 'boteco',
    densitySelect: state.settings.density || 'compact',
    maxPages: clampPages(state.settings.maxPages || 9),
    headerBrandMode: state.settings.headerBrandMode || 'text'
  };
  Object.entries(values).forEach(([id, value]) => {
    const el = $('#'+id);
    if (el) el.value = value;
  });
  $('#showDescriptions').checked = state.settings.showDescriptions !== false;
  $('#showImages').checked = state.settings.showImages === true;
  $('#breakBySection').checked = state.settings.breakBySection === true;
  $('#showQrCode').checked = state.settings.showQrCode === true;
}

function readImageFile(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}

function renderSectionFilter() {
  const select = $('#sectionFilter');
  const sections = ['Todos', ...getSections()];
  select.innerHTML = sections.map(section => `<option value="${escapeHtml(section)}">${escapeHtml(section)}</option>`).join('');
  select.value = sections.includes(activeSection) ? activeSection : 'Todos';
  activeSection = select.value;
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
          readImageFile(event.target.files?.[0], dataUrl => {
            item.image = dataUrl;
            renderPreview();
            toast('Imagem aplicada ao item. Salve para manter no navegador.');
          });
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

function createPrintSections(items) {
  const bySection = groupBySection(items).sort((a, b) => sectionRank(a.name) - sectionRank(b.name));
  return bySection.map(section => ({
    name: section.name,
    items: groupItemsForLayout(section.items)
  }));
}

function groupItemsForLayout(items) {
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
  return onlyFilled([item.option, item.volume, item.serve, item.availability]);
}

function renderPreview() {
  normalizeSettings();
  const paper = $('#pdfArea');
  renderPagedPreview(paper);
}

function renderPagedPreview(paper) {
  const config = getCurrentConfig();
  const maxPages = clampPages(state.settings.maxPages || 9);
  paper.className = `paper menu-book ${config.css} theme-${state.settings.theme || 'boteco'} density-${state.settings.density || 'compact'} columns-${config.columns}`;
  paper.style.setProperty('--page-w', `${config.widthPx}px`);
  paper.style.setProperty('--page-h', `${config.heightPx}px`);
  paper.style.setProperty('--folder-columns', config.columns);

  const sections = createPrintSections(filteredItems());
  const result = paginateSections(sections, maxPages, config);
  const pages = result.pages.length ? result.pages : [{ sections: [], weight: 0 }];

  paper.innerHTML = pages.map((page, index) => renderMenuPage(page, index + 1, maxPages, result.overflowCount, config)).join('');
  const pageInfo = $('#pageInfo');
  if (pageInfo) {
    const overflow = result.overflowCount > 0 ? ` · Atenção: ${result.overflowCount} item(ns) concentrados na última página` : '';
    pageInfo.textContent = `${pages.length} página(s) · ${config.label} · limite ${maxPages}${overflow}`;
  }
}

function itemWeight(item) {
  const descLength = String(item.description || '').length + String(item.notes || '').length;
  const variantCount = Array.isArray(item.variants) ? item.variants.length : 1;
  let weight = 0.85;
  if (variantCount > 1) weight += Math.min(1.15, variantCount * 0.18);
  if (state.settings.showDescriptions !== false) {
    if (descLength > 45) weight += 0.16;
    if (descLength > 100) weight += 0.24;
    if (descLength > 180) weight += 0.22;
  }
  if (state.settings.showImages && item.image) weight += 0.38;
  return weight;
}

function pageCapacity(pageIndex, config) {
  const compact = (state.settings.density || 'compact') === 'compact';
  let capacity = compact ? config.compactCapacity : config.normalCapacity;
  if (state.settings.headerBrandMode === 'logo' && state.restaurant.logo) capacity -= 0.5;
  if (state.settings.showQrCode && state.restaurant.qrImage) capacity -= 0.8;
  if (pageIndex === 0 && state.restaurant.tagline) capacity -= 0.5;
  return Math.max(5, capacity);
}

function paginateSections(sections, maxPages, config) {
  const pages = [{ sections: [], weight: 0 }];
  let pageIndex = 0;
  let overflowCount = 0;

  const goNextPage = () => {
    if (pageIndex + 1 >= maxPages) return false;
    pageIndex += 1;
    pages[pageIndex] = pages[pageIndex] || { sections: [], weight: 0 };
    return true;
  };

  const sectionHeaderWeight = 1.35;
  const addChunk = (name, items, continuation = false) => {
    const chunkWeight = sectionHeaderWeight + items.reduce((total, item) => total + itemWeight(item), 0);
    pages[pageIndex].sections.push({ name, items, continuation });
    pages[pageIndex].weight += chunkWeight;
  };

  sections.forEach(section => {
    let remaining = [...section.items];
    let continuation = false;

    while (remaining.length) {
      const current = pages[pageIndex];
      const available = pageCapacity(pageIndex, config) - current.weight - sectionHeaderWeight;

      if (state.settings.breakBySection && current.sections.length && !continuation) {
        if (goNextPage()) continue;
      }

      if (available < 1.1 && current.sections.length && goNextPage()) continue;

      if (pageIndex + 1 >= maxPages && available < 1.1 && current.sections.length) {
        overflowCount += remaining.length;
        addChunk(section.name, remaining.splice(0), true);
        break;
      }

      let chunk = [];
      let weight = 0;
      while (remaining.length) {
        const nextWeight = itemWeight(remaining[0]);
        const limit = Math.max(1.1, pageCapacity(pageIndex, config) - pages[pageIndex].weight - sectionHeaderWeight);
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

function renderMenuPage(page, pageNumber, maxPages, overflowCount, config) {
  const overflowWarning = overflowCount > 0 && pageNumber === maxPages
    ? `<div class="folder-warning">Atenção: há itens extras concentrados nesta página. Para manter tudo legível, reduza descrições, desative imagens ou divida o cardápio.</div>`
    : '';
  return `
    <article class="menu-page" data-page="${pageNumber}">
      ${renderPageHeader(pageNumber, maxPages, config)}
      <main class="folder-body">
        ${overflowWarning}
        ${page.sections.length ? page.sections.map(renderFolderSection).join('') : '<div class="empty-page">Espaço reservado para novos itens.</div>'}
      </main>
      <footer class="folder-footer">
        <span>Valores sujeitos à alteração.</span>
        <span>${escapeHtml(config.label)} · Página ${pageNumber}/${maxPages}</span>
      </footer>
    </article>
  `;
}

function renderPageHeader(pageNumber, maxPages, config) {
  const isFirst = pageNumber === 1;
  const brand = renderHeaderBrand(isFirst);
  const qr = renderHeaderQr();
  const qrClass = qr ? ' has-qr' : '';
  return `
    <header class="folder-header ${isFirst ? 'first' : ''}${qrClass}">
      <div class="folder-brand-wrap">
        ${brand}
        ${isFirst && state.restaurant.tagline ? `<p class="folder-tagline">${escapeHtml(state.restaurant.tagline)}</p>` : ''}
      </div>
      <div class="folder-side">
        ${qr}
        <div class="folder-contact">
          <span>${escapeHtml(state.restaurant.whatsapp || '')}</span>
          <span>${escapeHtml(state.restaurant.instagram || '')}</span>
          <span>${escapeHtml(state.restaurant.address || '')}</span>
          <strong>Página ${pageNumber}/${maxPages}</strong>
        </div>
      </div>
    </header>
  `;
}

function renderHeaderBrand(isFirst) {
  const useLogo = state.settings.headerBrandMode === 'logo' && state.restaurant.logo;
  if (useLogo) {
    return `<img class="header-logo ${isFirst ? 'first' : ''}" src="${state.restaurant.logo}" alt="${escapeHtml(state.restaurant.name || 'Logo')}" />`;
  }
  return `
    <div class="header-text-brand">
      <p class="eyebrow">Menu oficial</p>
      <h2>${escapeHtml(state.restaurant.name || 'Casteluche')}</h2>
    </div>
  `;
}

function renderHeaderQr() {
  if (!state.settings.showQrCode || !state.restaurant.qrImage) return '';
  const label = state.restaurant.qrLabel || 'Cardápio virtual';
  return `
    <div class="folder-qr">
      <img src="${state.restaurant.qrImage}" alt="QR Code ${escapeHtml(label)}" />
      <span>${escapeHtml(label)}</span>
    </div>
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
  const desc = state.settings.showDescriptions !== false && item.description ? `<p class="folder-desc">${escapeHtml(item.description)}</p>` : '';
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
  const selectedFormat = state.settings.pageFormat || 'folder-9-a4';
  const config = FORMAT_CONFIGS[selectedFormat] || FORMAT_CONFIGS['folder-9-a4'];
  orderItemsForPrint();
  state.settings.pageFormat = selectedFormat;
  state.settings.maxPages = clampPages(state.settings.maxPages || 9);
  state.settings.density = 'compact';
  state.settings.showImages = false;
  state.settings.showDescriptions = !['feed-4x5', 'story-9x16'].includes(selectedFormat);
  state.settings.breakBySection = false;
  activeSection = 'Todos';
  searchTerm = '';
  $('#searchInput').value = '';
  renderAll();
  toast(`Layout organizado para ${config.label}, evitando quebras e páginas brancas.`);
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

async function generatePdf() {
  normalizeSettings();
  renderPreview();
  const area = $('#pdfArea');
  const pages = $$('.menu-page', area);
  const config = getCurrentConfig();
  const filename = `cardapio-${(state.restaurant.name || 'restaurante').toLowerCase().replace(/\s+/g, '-')}.pdf`;

  if (!pages.length) {
    alert('Nenhuma página encontrada para exportar.');
    return;
  }

  try {
    if (window.jspdf?.jsPDF && window.html2canvas) {
      await generateManualPdf(pages, config, filename);
      return;
    }
  } catch (error) {
    console.warn('Falha na exportação manual, tentando modo alternativo.', error);
  }

  if (window.html2pdf) {
    const clone = area.cloneNode(true);
    clone.classList.add('exporting-pdf');
    clone.style.gap = '0';
    clone.style.margin = '0';
    document.body.appendChild(clone);
    const options = {
      margin: 0,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: null, scrollY: 0 },
      pagebreak: { mode: ['css'], after: '.menu-page' },
      jsPDF: { unit: 'mm', format: config.pdfFormat, orientation: config.orientation }
    };
    await window.html2pdf().set(options).from(clone).save();
    clone.remove();
    return;
  }

  window.print();
}

async function generateManualPdf(pages, config, filename) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: config.pdfFormat, orientation: config.orientation, compress: true });
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const canvas = await window.html2canvas(page, {
      scale: 2.15,
      useCORS: true,
      backgroundColor: getComputedStyle(page).backgroundColor || '#f4ead2',
      scrollY: 0,
      windowWidth: page.scrollWidth,
      windowHeight: page.scrollHeight
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    if (index > 0) pdf.addPage(config.pdfFormat, config.orientation);
    pdf.addImage(imgData, 'JPEG', 0, 0, config.widthMm, config.heightMm, undefined, 'FAST');
  }
  pdf.save(filename);
}

function renderAll() {
  normalizeSettings();
  if (!bound) {
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
  } else {
    setControlValues();
  }
  renderEditor();
  renderPreview();
}

loadSavedData();
renderAll();
