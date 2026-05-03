const STORAGE_KEY = 'casteluche-menu-generator-v7-presets-completos';
const PRESET_STORAGE_KEY = 'casteluche-menu-presets-v7';
const MAX_PAGES = 9;
let state = structuredClone(window.MENU_DATA || {});
let activeSection = 'Todos';
let searchTerm = '';
let isBound = false;

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
    orientation: 'portrait', pdfFormat: 'a4', columns: 2, compactCapacity: 24, normalCapacity: 18
  },
  'a4-portrait': {
    label: 'A4 vertical', css: 'format-a4-portrait', widthPx: 794, heightPx: 1123, widthMm: 210, heightMm: 297,
    orientation: 'portrait', pdfFormat: 'a4', columns: 2, compactCapacity: 24, normalCapacity: 18
  },
  'a4-landscape': {
    label: 'A4 horizontal', css: 'format-a4-landscape', widthPx: 1123, heightPx: 794, widthMm: 297, heightMm: 210,
    orientation: 'landscape', pdfFormat: 'a4', columns: 3, compactCapacity: 19, normalCapacity: 14
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

const PALETTES = {
  boteco: { label: 'Boteco Ouro', paper: '#f1e5ca', ink: '#1b1916', muted: '#6a5843', gold: '#c28b35', goldSoft: '#ead5a6', line: 'rgba(64,45,24,.18)', headStart: '#111111', headEnd: '#2a1d10', pageGlow1: 'rgba(255,255,255,.42)', pageGlow2: 'rgba(201,151,63,.18)', noteBg: '#ead5a6', bodyBg: '#0d0d0d', bodyGlow: '#333333' },
  barro: { label: 'Barro Quente', paper: '#f4e4d4', ink: '#25150f', muted: '#7c5546', gold: '#c56b45', goldSoft: '#f0cdb4', line: 'rgba(88,44,28,.18)', headStart: '#2e120d', headEnd: '#6b2f1d', pageGlow1: 'rgba(255,255,255,.40)', pageGlow2: 'rgba(197,107,69,.18)', noteBg: '#f0cdb4', bodyBg: '#120b08', bodyGlow: '#4b1d14' },
  caju: { label: 'Caju & Sol', paper: '#f7e7cf', ink: '#2b1a0f', muted: '#7b603b', gold: '#d28a2e', goldSoft: '#f7ddb1', line: 'rgba(102,73,26,.16)', headStart: '#4a2208', headEnd: '#9b4d11', pageGlow1: 'rgba(255,255,255,.38)', pageGlow2: 'rgba(210,138,46,.18)', noteBg: '#f7ddb1', bodyBg: '#120d09', bodyGlow: '#6b3510' },
  mandacaru: { label: 'Mandacaru', paper: '#eef0dc', ink: '#1e2417', muted: '#60684d', gold: '#9e9a3f', goldSoft: '#dfe4b2', line: 'rgba(57,69,38,.16)', headStart: '#1e2918', headEnd: '#4d5f2a', pageGlow1: 'rgba(255,255,255,.36)', pageGlow2: 'rgba(158,154,63,.18)', noteBg: '#dfe4b2', bodyBg: '#10140c', bodyGlow: '#32451f' },
  coqueiro: { label: 'Coqueiro Marrom', paper: '#efe6d8', ink: '#1f1a15', muted: '#6f6255', gold: '#b47b46', goldSoft: '#e8cfb4', line: 'rgba(71,52,34,.15)', headStart: '#302015', headEnd: '#6a4526', pageGlow1: 'rgba(255,255,255,.40)', pageGlow2: 'rgba(180,123,70,.16)', noteBg: '#e8cfb4', bodyBg: '#0f0e0d', bodyGlow: '#3c2919' },
  areia: { label: 'Areia Clara', paper: '#fbf5e8', ink: '#23201b', muted: '#7b7165', gold: '#c9a46b', goldSoft: '#f2e2c2', line: 'rgba(99,84,60,.15)', headStart: '#57472d', headEnd: '#8d7250', pageGlow1: 'rgba(255,255,255,.42)', pageGlow2: 'rgba(201,164,107,.15)', noteBg: '#f2e2c2', bodyBg: '#11100f', bodyGlow: '#6c5631' },
  forro: { label: 'Forró Vinho', paper: '#f3e0dd', ink: '#251617', muted: '#7a5659', gold: '#b6646d', goldSoft: '#efc3ca', line: 'rgba(86,46,50,.15)', headStart: '#36161a', headEnd: '#6b2a38', pageGlow1: 'rgba(255,255,255,.40)', pageGlow2: 'rgba(182,100,109,.16)', noteBg: '#efc3ca', bodyBg: '#130d0e', bodyGlow: '#50212b' },
  lampiao: { label: 'Lampião Cobre', paper: '#f4e1d2', ink: '#2a1810', muted: '#775444', gold: '#bf7047', goldSoft: '#edc8b3', line: 'rgba(92,52,32,.16)', headStart: '#35160f', headEnd: '#6c2f1d', pageGlow1: 'rgba(255,255,255,.40)', pageGlow2: 'rgba(191,112,71,.16)', noteBg: '#edc8b3', bodyBg: '#120c0a', bodyGlow: '#522212' },
  sertao: { label: 'Sertão Azul', paper: '#e5ecf0', ink: '#162028', muted: '#51626f', gold: '#547f96', goldSoft: '#c7d8e2', line: 'rgba(39,61,76,.15)', headStart: '#0f1b24', headEnd: '#2c495c', pageGlow1: 'rgba(255,255,255,.42)', pageGlow2: 'rgba(84,127,150,.15)', noteBg: '#c7d8e2', bodyBg: '#0c1013', bodyGlow: '#213442' },
  noite: { label: 'Noite Premium', paper: '#191714', ink: '#f7ecdf', muted: '#d8c1a3', gold: '#d7a24a', goldSoft: '#322a1d', line: 'rgba(255,255,255,.11)', headStart: '#080808', headEnd: '#20160d', pageGlow1: 'rgba(255,255,255,.08)', pageGlow2: 'rgba(215,162,74,.12)', noteBg: '#322a1d', bodyBg: '#080808', bodyGlow: '#302112' }
};

const WATERMARKS = {
  none: { label: 'Sem marca d\'água', svg: '' },
  sanfona: { label: 'Sanfona', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100"><g fill="none" stroke="%23ad8a5a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"><rect x="80" y="100" width="150" height="120" rx="18"/><rect x="570" y="100" width="150" height="120" rx="18"/><path d="M230 115 570 205M230 140 570 230M230 165 570 255M230 190 570 280"/></g></svg>` },
  mandacaru: { label: 'Mandacaru', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100"><g fill="none" stroke="%23ad8a5a" stroke-width="8" stroke-linecap="round" opacity="0.5"><path d="M400 920V360"/><path d="M400 600c-70 0-92-60-92-132"/><path d="M400 700c82 0 112-66 112-150"/><path d="M400 770c-58 0-74 54-74 96"/><path d="M400 845c46 0 66-38 66-78"/></g></svg>` },
  chapeu: { label: 'Chapéu de couro', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100"><g fill="none" stroke="%23ad8a5a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"><path d="M180 520c70-120 370-120 440 0"/><path d="M280 520c0-100 240-100 240 0"/><path d="M220 520c0 76 70 138 180 138s180-62 180-138"/></g></svg>` },
  zabumba: { label: 'Zabumba', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100"><g fill="none" stroke="%23ad8a5a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.52"><circle cx="400" cy="540" r="185"/><circle cx="400" cy="540" r="145"/><path d="M190 350 120 250"/><path d="M610 730 680 830"/></g></svg>` },
  sol: { label: 'Sol do sertão', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100"><g fill="none" stroke="%23ad8a5a" stroke-width="8" stroke-linecap="round" opacity="0.5"><circle cx="400" cy="420" r="120"/><path d="M400 210v-90M400 720v-90M190 420h-90M700 420h-90M250 270l-70-70M550 570l70 70M550 270l70-70M250 570l-70 70"/></g></svg>` },
  pimenta: { label: 'Pimenta', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100"><g fill="none" stroke="%23ad8a5a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.52"><path d="M430 320c22-42 68-66 110-56"/><path d="M420 350c180 10 170 305 0 375-190-55-160-345 0-375Z"/></g></svg>` },
  fita: { label: 'Fita junina', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100"><g fill="none" stroke="%23ad8a5a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"><path d="M130 180c130 0 130 120 260 120s130-120 260-120"/><path d="M130 340c130 0 130 120 260 120s130-120 260-120"/><path d="M130 500c130 0 130 120 260 120s130-120 260-120"/></g></svg>` },
  casal: { label: 'Casal dançando', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100"><g fill="none" stroke="%23ad8a5a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.48"><circle cx="320" cy="360" r="36"/><circle cx="470" cy="350" r="36"/><path d="M320 396v180l-95 110"/><path d="M320 450 430 490 520 650"/><path d="M470 386v170l95 110"/><path d="M470 450 390 520 280 650"/></g></svg>` },
  bandeirolas: { label: 'Bandeirolas', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100"><g fill="none" stroke="%23ad8a5a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.48"><path d="M70 160c140 0 180 60 330 60s190-60 330-60"/><path d="M120 162v70l50-28 50 28v-70M310 192v70l50-28 50 28v-70M500 192v70l50-28 50 28v-70"/></g></svg>` },
  xilogravura: { label: 'Xilogravura', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100"><g fill="none" stroke="%23ad8a5a" stroke-width="8" stroke-linecap="round" opacity="0.46"><path d="M210 790c130-320 250-320 380 0"/><path d="M250 720c120-220 180-220 300 0"/><path d="M260 260c40-40 90-60 140-60 110 0 190 80 190 190 0 68-30 110-84 164"/><path d="M400 230v224"/></g></svg>` }
};

const FONT_SCALE_OPTIONS = [92, 96, 100, 104, 108];
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
    logoScale: 100,
    watermark: 'none',
    fontScale: 100,
    ...(state.settings || {})
  };
  if (!FORMAT_CONFIGS[state.settings.pageFormat]) state.settings.pageFormat = 'folder-9-a4';
  if (!PALETTES[state.settings.theme]) state.settings.theme = 'boteco';
  if (!WATERMARKS[state.settings.watermark]) state.settings.watermark = 'none';
  if (!['compact', 'normal'].includes(state.settings.density)) state.settings.density = 'compact';
  if (!['text', 'logo'].includes(state.settings.headerBrandMode)) state.settings.headerBrandMode = 'text';
  state.settings.maxPages = clampPages(state.settings.maxPages);
  state.settings.fontScale = clampFontScale(state.settings.fontScale);
  state.settings.logoScale = clampLogoScale(state.settings.logoScale);
  state.items = Array.isArray(state.items) ? state.items : [];
}

function clampPages(value) {
  const parsed = Number(value || MAX_PAGES);
  if (Number.isNaN(parsed)) return MAX_PAGES;
  return Math.max(1, Math.min(MAX_PAGES, Math.round(parsed)));
}

function clampFontScale(value) {
  const parsed = Number(value || 100);
  const nearest = FONT_SCALE_OPTIONS.reduce((prev, current) => Math.abs(current - parsed) < Math.abs(prev - parsed) ? current : prev, 100);
  return nearest;
}

function clampLogoScale(value) {
  const parsed = Number(value || 100);
  if (Number.isNaN(parsed)) return 100;
  return Math.max(60, Math.min(170, Math.round(parsed)));
}

function getCurrentConfig() {
  return FORMAT_CONFIGS[state.settings.pageFormat] || FORMAT_CONFIGS['folder-9-a4'];
}

function getPalette() {
  return PALETTES[state.settings.theme] || PALETTES.boteco;
}

function getWatermarkDataUrl() {
  const entry = WATERMARKS[state.settings.watermark] || WATERMARKS.none;
  return entry.svg ? `url("data:image/svg+xml;utf8,${entry.svg}")` : 'none';
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

function makePresetPayload(name = '') {
  normalizeSettings();
  return {
    presetVersion: 1,
    type: 'casteluche-menu-preset',
    name: name || `Preset ${new Date().toLocaleString('pt-BR')}`,
    createdAt: new Date().toISOString(),
    data: structuredClone(state)
  };
}

function readSavedPresets() {
  try {
    const saved = localStorage.getItem(PRESET_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Não foi possível ler os presets salvos.', error);
    return [];
  }
}

function writeSavedPresets(presets) {
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
}

function renderPresetSelect() {
  const select = $('#presetSelect');
  if (!select) return;
  const presets = readSavedPresets();
  select.innerHTML = presets.length
    ? presets.map(preset => `<option value="${escapeHtml(preset.id)}">${escapeHtml(preset.name || 'Preset sem nome')}</option>`).join('')
    : '<option value="">Nenhum preset salvo</option>';
}

function savePreset() {
  const defaultName = `${state.restaurant?.name || 'Cardápio'} - ${new Date().toLocaleDateString('pt-BR')}`;
  const name = prompt('Nome do preset:', defaultName);
  if (!name) return;

  const presets = readSavedPresets();
  const payload = makePresetPayload(name.trim());
  const existingIndex = presets.findIndex(preset => (preset.name || '').toLowerCase() === name.trim().toLowerCase());
  const record = {
    id: existingIndex >= 0 ? presets[existingIndex].id : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: payload.name,
    updatedAt: payload.createdAt,
    payload
  };

  if (existingIndex >= 0) {
    if (!confirm(`Já existe um preset chamado “${name}”. Deseja substituir?`)) return;
    presets[existingIndex] = record;
  } else {
    presets.unshift(record);
  }

  writeSavedPresets(presets);
  renderPresetSelect();
  toast('Preset salvo com configurações, produtos e imagens anexadas.');
}

function getSelectedPreset() {
  const select = $('#presetSelect');
  const id = select?.value;
  if (!id) return null;
  return readSavedPresets().find(preset => preset.id === id) || null;
}

function applyPresetPayload(payload) {
  const data = payload?.data || payload;
  if (!data || !Array.isArray(data.items)) throw new Error('Preset inválido: lista de itens ausente.');
  state = data;
  normalizeSettings();
  activeSection = 'Todos';
  searchTerm = '';
  const search = $('#searchInput');
  if (search) search.value = '';
  renderAll();
}

function applySavedPreset() {
  const preset = getSelectedPreset();
  if (!preset) {
    alert('Nenhum preset salvo selecionado.');
    return;
  }
  if (!confirm(`Aplicar o preset “${preset.name}”? Isso substitui o cardápio atual na tela.`)) return;
  try {
    applyPresetPayload(preset.payload);
    toast(`Preset “${preset.name}” aplicado.`);
  } catch (error) {
    console.error(error);
    alert('Não consegui aplicar esse preset.');
  }
}

function deleteSavedPreset() {
  const preset = getSelectedPreset();
  if (!preset) {
    alert('Nenhum preset salvo selecionado.');
    return;
  }
  if (!confirm(`Excluir o preset “${preset.name}”?`)) return;
  writeSavedPresets(readSavedPresets().filter(item => item.id !== preset.id));
  renderPresetSelect();
  toast('Preset excluído.');
}

function exportPreset() {
  const payload = makePresetPayload(state.restaurant?.name || 'Preset Casteluche');
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (payload.name || 'preset-cardapio').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  a.href = url;
  a.download = `${safeName || 'preset-cardapio'}.casteluche-preset.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Preset exportado com configurações e imagens anexadas.');
}

function importPreset(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      applyPresetPayload(imported);
      toast('Preset importado com configurações e imagens anexadas.');
    } catch (error) {
      console.error(error);
      alert('Não consegui importar esse preset. Confira se o arquivo é um preset exportado pela ferramenta.');
    }
  };
  reader.readAsText(file);
}

function toast(message) {
  const existing = $('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast no-print';
  el.textContent = message;
  Object.assign(el.style, {
    position: 'fixed', right: '20px', bottom: '20px', padding: '14px 18px', borderRadius: '999px',
    background: '#c9973f', color: '#1b1207', fontWeight: '900', zIndex: 9999, boxShadow: '0 18px 50px rgba(0,0,0,.32)'
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function readImageFile(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}

function onlyFilled(values) {
  return values.map(value => String(value || '').trim()).filter(Boolean).join(' · ');
}

function sectionRank(sectionName) {
  const index = PRINT_SECTION_ORDER.indexOf(sectionName || 'Sem seção');
  return index === -1 ? 999 : index;
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
  return sections.sort((a, b) => sectionRank(a) - sectionRank(b) || a.localeCompare(b, 'pt-BR'));
}

function filteredItems() {
  const term = searchTerm.trim().toLowerCase();
  return state.items.filter(item => {
    const matchSection = activeSection === 'Todos' || (item.section || 'Sem seção') === activeSection;
    const haystack = [item.category, item.section, item.product, item.price, item.description, item.notes, item.option, item.volume, item.serve, item.availability].join(' ').toLowerCase();
    const matchTerm = !term || haystack.includes(term);
    return matchSection && matchTerm;
  });
}

function orderItemsForPrint() {
  state.items.sort((a, b) => {
    const sectionDiff = sectionRank(a.section) - sectionRank(b.section);
    if (sectionDiff !== 0) return sectionDiff;
    return String(a.product || '').localeCompare(String(b.product || ''), 'pt-BR', { sensitivity: 'base' }) ||
      String(a.option || a.volume || '').localeCompare(String(b.option || b.volume || ''), 'pt-BR', { sensitivity: 'base' });
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
    pageFormat: state.settings.pageFormat,
    themeSelect: state.settings.theme,
    densitySelect: state.settings.density,
    watermarkSelect: state.settings.watermark,
    fontScale: state.settings.fontScale,
    logoScale: state.settings.logoScale,
    maxPages: state.settings.maxPages,
    headerBrandMode: state.settings.headerBrandMode
  };
  Object.entries(values).forEach(([id, value]) => {
    const el = $('#' + id);
    if (el) el.value = value;
  });
  $('#showDescriptions').checked = state.settings.showDescriptions !== false;
  $('#showImages').checked = state.settings.showImages === true;
  $('#breakBySection').checked = state.settings.breakBySection === true;
  $('#showQrCode').checked = state.settings.showQrCode === true;
  const fontScaleLabel = $('#fontScaleLabel');
  if (fontScaleLabel) fontScaleLabel.textContent = `${state.settings.fontScale}%`;
  const logoScaleLabel = $('#logoScaleLabel');
  if (logoScaleLabel) logoScaleLabel.textContent = `${state.settings.logoScale}%`;
}

function bindSettings() {
  setControlValues();

  const mappedFields = {
    restaurantName: 'name', restaurantWhatsapp: 'whatsapp', restaurantInstagram: 'instagram',
    restaurantAddress: 'address', restaurantTagline: 'tagline', qrLabel: 'qrLabel'
  };
  Object.keys(mappedFields).forEach(id => {
    const el = $('#' + id);
    if (!el) return;
    el.addEventListener('input', event => {
      state.restaurant[mappedFields[id]] = event.target.value;
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
  $('#watermarkSelect').addEventListener('change', event => {
    state.settings.watermark = event.target.value;
    renderPreview();
  });
  $('#fontScale').addEventListener('input', event => {
    state.settings.fontScale = clampFontScale(event.target.value);
    event.target.value = state.settings.fontScale;
    $('#fontScaleLabel').textContent = `${state.settings.fontScale}%`;
    renderPreview();
  });
  $('#logoScale').addEventListener('input', event => {
    state.settings.logoScale = clampLogoScale(event.target.value);
    event.target.value = state.settings.logoScale;
    $('#logoScaleLabel').textContent = `${state.settings.logoScale}%`;
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
  const options = ['Todos', ...getSections()];
  select.innerHTML = options.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
  select.value = options.includes(activeSection) ? activeSection : 'Todos';
  activeSection = select.value;
}

function updatePriceValue(item, value) {
  const normalized = String(value || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const parsed = Number(normalized);
  item.priceValue = Number.isNaN(parsed) ? null : parsed;
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
        if (key === 'price') {
          item.priceBlank = !String(event.target.value || '').trim();
          updatePriceValue(item, event.target.value);
        }
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
  return sections.map(name => ({ name, items: map.get(name) })).sort((a, b) => sectionRank(a.name) - sectionRank(b.name) || a.name.localeCompare(b.name, 'pt-BR'));
}

function buildVariantLabel(item) {
  return onlyFilled([item.option, item.volume, item.serve, item.availability]);
}

function isReviewText(value) {
  return String(value || '').trim().toLowerCase().includes('revis');
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
        variants: []
      });
    }
    const group = map.get(key);
    if (!group.image && item.image) group.image = item.image;
    group.variants.push({
      label: buildVariantLabel(item),
      price: item.price || '',
      blankPrice: item.priceBlank === true,
      review: item.priceBlank === true ? false : (!item.price || isReviewText(item.price))
    });
  });
  return Array.from(map.values()).sort((a, b) => String(a.product).localeCompare(String(b.product), 'pt-BR', { sensitivity: 'base' }));
}

function createPrintSections(items) {
  return groupBySection(items).map(section => ({ name: section.name, items: groupItemsForLayout(section.items) }));
}

function itemWeight(item) {
  const descLength = String(item.description || '').length + String(item.notes || '').length;
  const variantCount = Array.isArray(item.variants) ? item.variants.length : 1;
  let weight = 0.85;
  if (variantCount > 1) weight += Math.min(1.15, variantCount * 0.18);
  if (state.settings.showDescriptions !== false) {
    if (descLength > 45) weight += 0.16;
    if (descLength > 100) weight += 0.22;
    if (descLength > 180) weight += 0.20;
  }
  if (state.settings.showImages && item.image) weight += 0.36;
  const fontImpact = (state.settings.fontScale - 100) / 100;
  weight += fontImpact * 1.4;
  return Math.max(0.6, weight);
}

function pageCapacity(pageIndex, config) {
  const compact = state.settings.density === 'compact';
  let capacity = compact ? config.compactCapacity : config.normalCapacity;
  if (state.settings.headerBrandMode === 'logo' && state.restaurant.logo) capacity -= 0.5;
  if (state.settings.showQrCode && state.restaurant.qrImage) capacity -= 0.8;
  if (pageIndex === 0 && state.restaurant.tagline) capacity -= 0.4;
  const fontImpact = (state.settings.fontScale - 100) / 4; // 104 => -1 capacity approximately
  capacity -= fontImpact;
  return Math.max(4.4, capacity);
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

  const sectionHeaderWeight = 1.25;

  function addChunk(name, items, continuation = false) {
    const chunkWeight = sectionHeaderWeight + items.reduce((total, item) => total + itemWeight(item), 0);
    pages[pageIndex].sections.push({ name, items, continuation });
    pages[pageIndex].weight += chunkWeight;
  }

  sections.forEach(section => {
    let remaining = [...section.items];
    let continuation = false;
    while (remaining.length) {
      const currentPage = pages[pageIndex];
      const available = pageCapacity(pageIndex, config) - currentPage.weight - sectionHeaderWeight;

      if (state.settings.breakBySection && currentPage.sections.length && !continuation) {
        if (goNextPage()) continue;
      }

      if (available < 1 && currentPage.sections.length) {
        if (goNextPage()) continue;
      }

      if (pageIndex + 1 >= maxPages && available < 1 && currentPage.sections.length) {
        overflowCount += remaining.length;
        addChunk(section.name, remaining.splice(0), true);
        break;
      }

      let chunk = [];
      let chunkWeight = 0;
      while (remaining.length) {
        const next = remaining[0];
        const nextWeight = itemWeight(next);
        const limit = Math.max(1.05, pageCapacity(pageIndex, config) - pages[pageIndex].weight - sectionHeaderWeight);
        if (chunk.length && chunkWeight + nextWeight > limit) break;
        chunk.push(remaining.shift());
        chunkWeight += nextWeight;
        if (chunkWeight >= limit) break;
      }

      if (!chunk.length && remaining.length) chunk.push(remaining.shift());
      addChunk(section.name, chunk, continuation);
      continuation = true;

      if (remaining.length && !goNextPage()) {
        overflowCount += remaining.length;
        addChunk(section.name, remaining.splice(0), true);
        break;
      }
    }
  });

  return { pages: pages.filter(page => page.sections.length), overflowCount };
}

function applyPaperVariables(paper) {
  const config = getCurrentConfig();
  const palette = getPalette();
  paper.className = `paper menu-book ${config.css} density-${state.settings.density}`;
  paper.style.setProperty('--page-w', `${config.widthPx}px`);
  paper.style.setProperty('--page-h', `${config.heightPx}px`);
  paper.style.setProperty('--folder-columns', config.columns);
  paper.style.setProperty('--font-scale', `${state.settings.fontScale / 100}`);
  paper.style.setProperty('--logo-scale', `${state.settings.logoScale / 100}`);
  paper.style.setProperty('--paper-bg', palette.paper);
  paper.style.setProperty('--ink', palette.ink);
  paper.style.setProperty('--muted', palette.muted);
  paper.style.setProperty('--gold', palette.gold);
  paper.style.setProperty('--gold-soft', palette.goldSoft);
  paper.style.setProperty('--line', palette.line);
  paper.style.setProperty('--note-bg', palette.noteBg);
  paper.style.setProperty('--header-start', palette.headStart);
  paper.style.setProperty('--header-end', palette.headEnd);
  paper.style.setProperty('--page-glow-1', palette.pageGlow1);
  paper.style.setProperty('--page-glow-2', palette.pageGlow2);
  document.body.style.background = `radial-gradient(circle at top left, ${palette.bodyGlow}, ${palette.bodyBg} 42%, #050505)`;
  paper.style.setProperty('--wm-svg', getWatermarkDataUrl());
}

function renderPreview() {
  normalizeSettings();
  const paper = $('#pdfArea');
  applyPaperVariables(paper);
  const config = getCurrentConfig();
  const maxPages = clampPages(state.settings.maxPages);
  const sections = createPrintSections(filteredItems());
  const result = paginateSections(sections, maxPages, config);
  const pages = result.pages.length ? result.pages : [{ sections: [], weight: 0 }];

  paper.innerHTML = pages.map((page, index) => renderMenuPage(page, index + 1, pages.length, result.overflowCount, config)).join('');
  const pageInfo = $('#pageInfo');
  if (pageInfo) {
    const overflow = result.overflowCount > 0 ? ` · ${result.overflowCount} item(ns) concentrados na última página` : '';
    pageInfo.textContent = `${pages.length} página(s) · ${config.label} · limite ${maxPages}${overflow}`;
  }
}

function renderMenuPage(page, pageNumber, totalPages, overflowCount, config) {
  const overflowWarning = overflowCount > 0 && pageNumber === totalPages
    ? `<div class="folder-warning">Há conteúdo demais na última página. Tente reduzir descrições, diminuir a fonte, trocar para densidade compacta ou organizar o layout novamente.</div>`
    : '';
  return `
    <article class="menu-page" data-page="${pageNumber}">
      ${renderWatermark()}
      ${renderPageHeader(pageNumber, totalPages)}
      <main class="folder-body">
        ${overflowWarning}
        ${page.sections.length ? page.sections.map(renderFolderSection).join('') : '<div class="empty-page">Espaço reservado para novos itens.</div>'}
      </main>
      <footer class="folder-footer">
        <span>Valores sujeitos à alteração.</span>
        <span>${escapeHtml(config.label)} · Página ${pageNumber}/${totalPages}</span>
      </footer>
    </article>
  `;
}

function renderWatermark() {
  const entry = WATERMARKS[state.settings.watermark] || WATERMARKS.none;
  if (!entry.svg) return '';
  return `<div class="page-watermark" aria-hidden="true">${entry.svg.replaceAll('%23', '#')}</div>`;
}

function renderPageHeader(pageNumber, totalPages) {
  const isFirst = pageNumber === 1;
  return `
    <header class="folder-header ${isFirst ? 'first' : ''}${state.settings.showQrCode && state.restaurant.qrImage ? ' has-qr' : ''}">
      <div class="folder-brand-wrap">
        ${renderHeaderBrand(isFirst)}
        ${isFirst && state.restaurant.tagline ? `<p class="folder-tagline">${escapeHtml(state.restaurant.tagline)}</p>` : ''}
      </div>
      <div class="folder-side">
        ${renderHeaderQr()}
        <div class="folder-contact">
          <span>${escapeHtml(state.restaurant.whatsapp || '')}</span>
          <span>${escapeHtml(state.restaurant.instagram || '')}</span>
          <span>${escapeHtml(state.restaurant.address || '')}</span>
          <strong>Página ${pageNumber}/${totalPages}</strong>
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

function renderPriceBalloon(variant) {
  if (variant.blankPrice) return `<span class="price-balloon empty"></span>`;
  if (variant.review) return `<span class="price-balloon review">Revisar</span>`;
  return `<span class="price-balloon">${escapeHtml(variant.price || '')}</span>`;
}

function renderFolderItem(item) {
  const variants = Array.isArray(item.variants) && item.variants.length ? item.variants : [{ label: '', price: item.price || '', blankPrice: item.blankPrice === true, review: !item.price }];
  const singleVariant = variants.length === 1;
  const firstVariant = variants[0] || { label: '', price: '', blankPrice: false, review: true };
  const meta = singleVariant ? firstVariant.label : '';
  const desc = state.settings.showDescriptions !== false && item.description ? `<p class="folder-desc">${escapeHtml(item.description)}</p>` : '';
  const note = item.notes ? `<span class="folder-note">${escapeHtml(item.notes)}</span>` : '';
  const image = state.settings.showImages && item.image ? `<img class="folder-thumb" src="${item.image}" alt="${escapeHtml(item.product)}" />` : '';
  const variantList = !singleVariant ? `
    <div class="folder-variants">
      ${variants.map(variant => `
        <span class="folder-variant ${variant.review ? 'review' : ''}${variant.blankPrice ? ' empty' : ''}">
          <span>${escapeHtml(variant.label || 'Opção')}</span>
          ${renderPriceBalloon(variant)}
        </span>`).join('')}
    </div>` : '';

  return `
    <article class="folder-item ${image ? 'with-thumb' : ''}">
      ${image}
      <div class="folder-item-main">
        <div class="folder-item-top">
          <strong>${escapeHtml(item.product)}</strong>
          ${singleVariant ? renderPriceBalloon(firstVariant) : ''}
        </div>
        ${meta ? `<div class="folder-meta">${escapeHtml(meta)}</div>` : ''}
        ${variantList}
        ${desc}
        ${note}
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function autoLayout() {
  const selectedFormat = state.settings.pageFormat;
  state.settings.density = 'compact';
  state.settings.showImages = false;
  state.settings.breakBySection = false;
  state.settings.showDescriptions = !['feed-4x5', 'story-9x16'].includes(selectedFormat);
  state.settings.fontScale = selectedFormat === 'folder-9-a4' ? 96 : 100;
  if (selectedFormat === 'a5-portrait') state.settings.fontScale = 96;
  if (selectedFormat === 'story-9x16') state.settings.fontScale = 92;
  if (selectedFormat === 'feed-4x5') state.settings.fontScale = 96;
  setControlValues();
  activeSection = 'Todos';
  searchTerm = '';
  $('#searchInput').value = '';
  orderItemsForPrint();
  renderAll();
  toast(`Layout reorganizado para ${getCurrentConfig().label}.`);
}

function zeroCategoryPrices() {
  const isAll = activeSection === 'Todos';
  const targets = isAll
    ? state.items
    : state.items.filter(item => (item.section || 'Sem seção') === activeSection);

  if (!targets.length) {
    alert('Não encontrei itens para limpar.');
    return;
  }

  const message = isAll
    ? `Você está em “Todos”. Tem certeza que deseja limpar os preços de TODOS os ${targets.length} itens do cardápio?`
    : `Limpar os preços de ${targets.length} item(ns) em “${activeSection}”?`;

  if (!confirm(message)) return;

  targets.forEach(item => {
    item.price = '';
    item.priceValue = null;
    item.priceBlank = true;
  });

  renderAll();
  toast(isAll ? 'Todos os preços foram limpos. Os balões ficaram vazios.' : `Preços limpos em “${activeSection}”. O balão continua branco e vazio.`);
}

function addItem() {
  const section = activeSection === 'Todos' ? 'Nova seção' : activeSection;
  state.items.unshift({
    id: `${Date.now()}-novo-item`,
    category: 'Cardápio', section, product: 'Novo item', option: '', volume: '', serve: '', availability: '',
    price: '', priceValue: null, priceBlank: true, description: '', notes: '', image: ''
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
      if (!Array.isArray(imported.items)) throw new Error('JSON sem lista de itens.');
      state = imported;
      normalizeSettings();
      activeSection = 'Todos';
      renderAll();
      toast('JSON importado com sucesso.');
    } catch (error) {
      console.error(error);
      alert('Não consegui importar esse JSON. Confira o arquivo.');
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
  if (!isBound) {
    bindSettings();
    $('#sectionFilter').addEventListener('change', event => { activeSection = event.target.value; renderEditor(); renderPreview(); });
    $('#searchInput').addEventListener('input', event => { searchTerm = event.target.value; renderEditor(); renderPreview(); });
    $('#btnAddItem').addEventListener('click', addItem);
    $('#btnAutoLayout').addEventListener('click', autoLayout);
    $('#btnZeroCategory').addEventListener('click', zeroCategoryPrices);
    $('#btnSave').addEventListener('click', saveData);
    $('#btnExport').addEventListener('click', exportJson);
    $('#btnSavePreset').addEventListener('click', savePreset);
    $('#btnApplyPreset').addEventListener('click', applySavedPreset);
    $('#btnDeletePreset').addEventListener('click', deleteSavedPreset);
    $('#btnExportPreset').addEventListener('click', exportPreset);
    $('#presetImport').addEventListener('change', event => { if (event.target.files?.[0]) importPreset(event.target.files[0]); event.target.value = ''; });
    $('#btnReset').addEventListener('click', resetData);
    $('#btnPdf').addEventListener('click', generatePdf);
    $('#jsonImport').addEventListener('change', event => { if (event.target.files?.[0]) importJson(event.target.files[0]); event.target.value = ''; });
    isBound = true;
  } else {
    setControlValues();
  }
  renderPresetSelect();
  renderEditor();
  renderPreview();
}

loadSavedData();
renderAll();
