const STORAGE_KEY = 'casteluche-menu-generator-v18-edicao-imagem-pagina';
const PRESET_STORAGE_KEY = 'casteluche-menu-presets-v16';
const DEFAULT_MAX_PAGES = 9;
const MAX_ALLOWED_PAGES = 99;
let state = structuredClone(window.MENU_DATA || {});
let activeSection = 'Todos';
let searchTerm = '';
let isBound = false;
let fillImageDrag = null;

const PRINT_SECTION_ORDER = [
  'Embalagem', 'Prato Feito Individual', 'Comercial Individual', 'Cardápio Semanal',
  'Feijoada', 'Pratos Principais', 'Pratos Nordestinos', 'Pratos Feitos', 'Adicionais',
  'Porções', 'Lanches', 'Combo de Lanche', 'Sobremesas',
  'Drinks sem álcool', 'Drinks', 'Dose de Gin', 'Gin', 'Vodka', 'Whisky', 'Copão', 'Combos', 'Extra',
  'Cervejas Lata', 'Long Neck', 'Bebidas Quentes', 'Cachaça Casteluche', 'Licores Casteluche',
  'Vinhos Casteluche', 'Coquetéis Casteluche', 'Promoções / Baldes', 'Águas', 'Refrigerantes', 'Energéticos', 'Sucos', 'Sucos Naturais'
];


const WEEKLY_DAY_ORDER = [
  'SEGUNDA',
  'TERCA',
  'TERÇA',
  'QUARTA',
  'QUINTA',
  'SEXTA',
  'SABADO E DOMINGO',
  'SÁBADO E DOMINGO',
  'SABADO',
  'SÁBADO',
  'DOMINGO'
];

function normalizeDayText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
}

function weeklyDayRank(value = '') {
  const text = normalizeDayText(value);
  if (!text) return 999;
  if (text.includes('SEGUNDA')) return 1;
  if (text.includes('TERCA')) return 2;
  if (text.includes('QUARTA')) return 3;
  if (text.includes('QUINTA')) return 4;
  if (text.includes('SEXTA')) return 5;
  if (text.includes('SABADO') && text.includes('DOMINGO')) return 6;
  if (text.includes('SABADO')) return 6;
  if (text.includes('DOMINGO')) return 7;
  return 999;
}

const FORMAT_CONFIGS = {
  'folder-9-a4': {
    label: 'Pasta A4', css: 'format-folder-9-a4', widthPx: 794, heightPx: 1123, widthMm: 210, heightMm: 297,
    orientation: 'portrait', pdfFormat: 'a4', columns: 2, compactCapacity: 24, normalCapacity: 18
  },
  'duplex-a4-portrait': {
    label: 'Frente e verso A4 vertical', css: 'format-duplex-a4-portrait', widthPx: 794, heightPx: 1123, widthMm: 210, heightMm: 297,
    orientation: 'portrait', pdfFormat: 'a4', columns: 2, compactCapacity: 29, normalCapacity: 22, fixedMaxPages: 2, duplex: true
  },
  'duplex-a4-landscape': {
    label: 'Frente e verso A4 horizontal', css: 'format-duplex-a4-landscape', widthPx: 1123, heightPx: 794, widthMm: 297, heightMm: 210,
    orientation: 'landscape', pdfFormat: 'a4', columns: 3, compactCapacity: 27, normalCapacity: 20, fixedMaxPages: 2, duplex: true
  },
  'duplex-a3-landscape': {
    label: 'Frente e verso A3 horizontal', css: 'format-duplex-a3-landscape', widthPx: 1587, heightPx: 1123, widthMm: 420, heightMm: 297,
    orientation: 'landscape', pdfFormat: 'a3', columns: 4, compactCapacity: 44, normalCapacity: 34, fixedMaxPages: 2, duplex: true
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
  sanfona: { label: 'Sanfona', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><g fill="none" stroke="%238a6747" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"><path d="M150 930c70-110 160-180 300-180s230 70 300 180"/><rect x="170" y="420" width="120" height="180" rx="18"/><rect x="610" y="420" width="120" height="180" rx="18"/><path d="M290 445 610 575M290 480 610 610M290 515 610 645M290 550 610 680"/><path d="M220 505h20M220 535h20M680 505h20M680 535h20"/><path d="M350 790c30-18 55-22 95-22 45 0 75 6 105 24"/></g></svg>` },
  mandacaru: { label: 'Mandacaru', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><g fill="none" stroke="%238a6747" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"><circle cx="640" cy="250" r="95"/><path d="M640 95v-45M640 455v-45M485 250h-45M795 250h-45M530 140l-32-32M750 360l32 32M750 140l32-32M530 360l-32 32"/><path d="M450 1000V390"/><path d="M450 610c-96 0-126-74-126-172"/><path d="M450 720c118 0 160-92 160-212"/><path d="M450 805c-76 0-100 68-100 120"/><path d="M450 900c66 0 92-50 92-110"/><path d="M280 1000h360"/></g></svg>` },
  chapeu: { label: 'Chapéu de couro', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><g fill="none" stroke="%238a6747" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"><path d="M150 620c120-150 480-150 600 0"/><path d="M270 620c0-130 360-130 360 0"/><path d="M210 620c0 110 95 195 240 195s240-85 240-195"/><path d="M310 625c65 28 160 38 280 0"/><path d="M210 865c80-20 160-30 240-30s160 10 240 30"/></g></svg>` },
  zabumba: { label: 'Zabumba', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><g fill="none" stroke="%238a6747" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"><circle cx="450" cy="620" r="235"/><circle cx="450" cy="620" r="185"/><path d="M270 470 150 300"/><path d="M630 770 750 940"/><path d="M290 795c48 20 102 30 160 30 66 0 126-12 182-38"/><path d="M286 456c44-18 102-31 164-31 67 0 131 12 188 36"/></g></svg>` },
  sol: { label: 'Sol do sertão', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><g fill="none" stroke="%238a6747" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"><circle cx="450" cy="340" r="140"/><path d="M450 130V60M450 620v-70M170 340h-70M800 340h-70M250 140l-48-48M650 540l48 48M650 140l48-48M250 540l-48 48"/><path d="M150 840c120-90 210-130 300-130 84 0 172 36 300 130"/><path d="M210 940c85-38 160-54 240-54s155 14 240 54"/><path d="M330 810c28-10 78-18 120-18 48 0 95 8 125 18"/></g></svg>` },
  pimenta: { label: 'Pimenta', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><g fill="none" stroke="%238a6747" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"><path d="M512 292c30-70 92-104 150-90"/><path d="M478 350c192 12 190 392-28 468-234-70-194-392 28-468Z"/><path d="M406 768c54 36 113 48 160 34"/><path d="M350 865c68 28 150 34 218 16"/></g></svg>` },
  fita: { label: 'Fita junina', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><g fill="none" stroke="%238a6747" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"><path d="M80 180c140 0 170 90 370 90s230-90 370-90"/><path d="M80 350c140 0 170 90 370 90s230-90 370-90"/><path d="M80 520c140 0 170 90 370 90s230-90 370-90"/><path d="M150 180v88l56-34 56 34v-88M372 214v88l56-34 56 34v-88M594 180v88l56-34 56 34v-88"/></g></svg>` },
  casal: { label: 'Casal dançando', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><g fill="none" stroke="%238a6747" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"><circle cx="340" cy="360" r="38"/><circle cx="540" cy="342" r="38"/><path d="M340 398v230l-110 130"/><path d="M340 458 455 510 575 705"/><path d="M540 380v212l110 140"/><path d="M540 445 448 560 316 735"/><path d="M224 890c66-22 142-34 226-34 82 0 160 12 226 34"/></g></svg>` },
  bandeirolas: { label: 'Bandeirolas', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><g fill="none" stroke="%238a6747" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"><path d="M60 150c130 0 170 70 390 70s260-70 390-70"/><path d="M110 150v105l54-36 54 36V150M290 180v105l54-36 54 36V180M470 150v105l54-36 54 36V150M650 180v105l54-36 54 36V180"/><path d="M60 980c130 0 170-70 390-70s260 70 390 70"/><path d="M110 980v-105l54 36 54-36v105M290 950v-105l54 36 54-36v105M470 980v-105l54 36 54-36v105M650 950v-105l54 36 54-36v105"/></g></svg>` },
  xilogravura: { label: 'Xilogravura', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><g fill="none" stroke="%238a6747" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"><path d="M330 735c-25-120 20-214 118-214 102 0 162 112 128 222"/><path d="M406 530c0-66 30-108 86-132"/><path d="M390 760c42 20 92 24 146 10"/><path d="M352 850c60 26 142 34 212 20"/><path d="M258 914c60-34 126-52 192-52 68 0 136 16 194 50"/><path d="M300 320c30-30 64-46 102-46 40 0 80 16 116 48"/><path d="M348 272l-28-48M548 274l28-48"/></g></svg>` }
};

const FONT_SCALE_OPTIONS = [92, 96, 100, 104, 108];
const PAGE_LAYOUT_OPTIONS = ['auto', 'classic', 'compact', 'magazine', 'photo-left', 'photo-top', 'price-focus', 'list', 'grid-3', 'grid-4', 'poster'];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function cloneBaseData() {
  return structuredClone(window.MENU_DATA || { restaurant: {}, settings: {}, items: [] });
}

const MENU_TYPE_OPTIONS = {
  especial: { label: 'Cardápio Especial', tagline: 'Refeições, porções, lanches, drinks e bebidas' },
  semanal: { label: 'Cardápio Semanal', tagline: 'Pratos do dia, comerciais e pratos feitos' },
  lanches: { label: 'Menu de Lanches', tagline: 'Porções, lanches, combos e sobremesas' },
  bebidas: { label: 'Menu de Bebidas', tagline: 'Drinks, cervejas, sucos e bebidas' }
};

const ADDITIONAL_MENU_ITEMS = {
  semanal: [{"id": "001-embalagem-embalagem-p", "category": "Adicionais", "section": "Embalagem", "product": "Embalagem", "option": "P", "volume": "", "serve": "", "price": "R$ 2,00", "priceValue": 2.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "002-embalagem-embalagem-g", "category": "Adicionais", "section": "Embalagem", "product": "Embalagem", "option": "G", "volume": "", "serve": "", "price": "R$ 3,00", "priceValue": 3.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "003-prato-feito-individual-bife-3", "category": "Refeições", "section": "Prato Feito Individual", "product": "Bife", "option": "", "volume": "", "serve": "", "price": "R$ 35,00", "priceValue": 35.0, "description": "Gelatina 1 por pessoa", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "004-prato-feito-individual-picadinho-4", "category": "Refeições", "section": "Prato Feito Individual", "product": "Picadinho", "option": "", "volume": "", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "Gelatina 1 por pessoa", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "005-prato-feito-individual-calabresa-5", "category": "Refeições", "section": "Prato Feito Individual", "product": "Calabresa", "option": "", "volume": "", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "Gelatina 1 por pessoa", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "006-prato-feito-individual-bisteca-c-ovo-6", "category": "Refeições", "section": "Prato Feito Individual", "product": "Bisteca c/ Ovo", "option": "", "volume": "", "serve": "", "price": "R$ 23,00", "priceValue": 23.0, "description": "Gelatina 1 por pessoa", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "007-prato-feito-individual-file-de-frango-7", "category": "Refeições", "section": "Prato Feito Individual", "product": "Filé de Frango", "option": "", "volume": "", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "Gelatina 1 por pessoa", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "008-prato-feito-individual-chuletinha-8", "category": "Refeições", "section": "Prato Feito Individual", "product": "Chuletinha", "option": "", "volume": "", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "Gelatina 1 por pessoa", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "009-comercial-individual-costela-no-bafo-prato-da-casa-9", "category": "Refeições", "section": "Comercial Individual", "product": "Costela no Bafo (Prato da Casa)", "option": "", "volume": "", "serve": "", "price": "R$ 49,00", "priceValue": 49.0, "description": "Arroz, feijão, fritas e 1 salada", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "010-comercial-individual-bife-a-milanesa-carne-10", "category": "Refeições", "section": "Comercial Individual", "product": "Bife à Milanesa Carne", "option": "", "volume": "", "serve": "", "price": "R$ 40,00", "priceValue": 40.0, "description": "Arroz, feijão, fritas e 1 salada", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "011-comercial-individual-bife-a-milanesa-frango-11", "category": "Refeições", "section": "Comercial Individual", "product": "Bife à Milanesa Frango", "option": "", "volume": "", "serve": "", "price": "R$ 35,00", "priceValue": 35.0, "description": "Arroz, feijão, fritas e 1 salada", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "012-comercial-individual-contra-file-12", "category": "Refeições", "section": "Comercial Individual", "product": "Contra Filé", "option": "", "volume": "", "serve": "", "price": "R$ 60,00", "priceValue": 60.0, "description": "Arroz, feijão, fritas e 1 salada", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "013-comercial-individual-omelete-13", "category": "Refeições", "section": "Comercial Individual", "product": "Omelete", "option": "", "volume": "", "serve": "", "price": "R$ 30,00", "priceValue": 30.0, "description": "Arroz, feijão, fritas e 1 salada", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "014-comercial-individual-parmegiana-de-carne-14", "category": "Refeições", "section": "Comercial Individual", "product": "Parmegiana de Carne", "option": "", "volume": "", "serve": "", "price": "R$ 60,00", "priceValue": 60.0, "description": "Arroz, feijão, fritas e 1 salada", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "015-comercial-individual-parmegiana-de-frango-15", "category": "Refeições", "section": "Comercial Individual", "product": "Parmegiana de Frango", "option": "", "volume": "", "serve": "", "price": "R$ 45,00", "priceValue": 45.0, "description": "Arroz, feijão, fritas e 1 salada", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "016-comercial-individual-strogonoff-de-carne-16", "category": "Refeições", "section": "Comercial Individual", "product": "Strogonoff de Carne", "option": "", "volume": "", "serve": "", "price": "R$ 60,00", "priceValue": 60.0, "description": "Arroz, feijão, fritas e 1 salada", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "017-comercial-individual-strogonoff-de-frango-17", "category": "Refeições", "section": "Comercial Individual", "product": "Strogonoff de Frango", "option": "", "volume": "", "serve": "", "price": "R$ 45,00", "priceValue": 45.0, "description": "Arroz, feijão, fritas e 1 salada", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "018-cardapio-semanal-virado-paulista-18", "category": "Refeições", "section": "Cardápio Semanal", "product": "Virado Paulista", "option": "", "volume": "", "serve": "", "price": "R$ 45,00", "priceValue": 45.0, "description": "Bisteca, ovo, couve e torresmo", "availability": "Segunda", "notes": "", "highlight": false, "image": ""}, {"id": "019-cardapio-semanal-panqueca-19", "category": "Refeições", "section": "Cardápio Semanal", "product": "Panqueca", "option": "", "volume": "", "serve": "", "price": "R$ 35,00", "priceValue": 35.0, "description": "Recheio: carne, queijo, frango, presunto e queijo", "availability": "Segunda", "notes": "", "highlight": false, "image": ""}, {"id": "020-cardapio-semanal-baiao-de-dois-20", "category": "Refeições", "section": "Cardápio Semanal", "product": "Baião de Dois", "option": "", "volume": "", "serve": "", "price": "R$ 50,00", "priceValue": 50.0, "description": "Queijo, 1 bisteca e torresmo", "availability": "Terça", "notes": "", "highlight": false, "image": ""}, {"id": "021-cardapio-semanal-bife-a-role-c-pure-de-batata-21", "category": "Refeições", "section": "Cardápio Semanal", "product": "Bife à Rolê c/ Purê de Batata", "option": "", "volume": "", "serve": "", "price": "R$ 45,00", "priceValue": 45.0, "description": "", "availability": "Terça", "notes": "", "highlight": false, "image": ""}, {"id": "022-cardapio-semanal-feijoada-pequena-22", "category": "Refeições", "section": "Cardápio Semanal", "product": "Feijoada Pequena", "option": "", "volume": "", "serve": "", "price": "R$ 70,00", "priceValue": 70.0, "description": "Arroz, farofa, 1 bisteca, 2 bananas à milanesa, couve, torresmo e vinagrete", "availability": "Quarta e Sábado", "notes": "", "highlight": false, "image": ""}, {"id": "023-cardapio-semanal-feijoada-grande-23", "category": "Refeições", "section": "Cardápio Semanal", "product": "Feijoada Grande", "option": "", "volume": "", "serve": "", "price": "R$ 90,00", "priceValue": 90.0, "description": "Arroz, farofa, 2 bistecas, 3 bananas à milanesa, couve, torresmo e vinagrete", "availability": "Quarta e Sábado", "notes": "", "highlight": false, "image": ""}, {"id": "024-cardapio-semanal-macarrao-c-frango-24", "category": "Refeições", "section": "Cardápio Semanal", "product": "Macarrão c/ Frango", "option": "", "volume": "", "serve": "", "price": "R$ 35,00", "priceValue": 35.0, "description": "Salada", "availability": "Quinta", "notes": "", "highlight": false, "image": ""}, {"id": "025-cardapio-semanal-file-de-peixe-25", "category": "Refeições", "section": "Cardápio Semanal", "product": "Filé de Peixe", "option": "", "volume": "", "serve": "", "price": "R$ 38,00", "priceValue": 38.0, "description": "Arroz, feijão e purê de batata", "availability": "Sexta", "notes": "", "highlight": false, "image": ""}, {"id": "026-cardapio-semanal-baiao-de-dois-26", "category": "Refeições", "section": "Cardápio Semanal", "product": "Baião de Dois", "option": "", "volume": "", "serve": "", "price": "R$ 140,00", "priceValue": 140.0, "description": "Arroz, bacon, bisteca, torresmo, feijão fradinho e queijo coalho", "availability": "Sábado e Domingo", "notes": "", "highlight": false, "image": ""}, {"id": "027-cardapio-semanal-maria-bonita-27", "category": "Refeições", "section": "Cardápio Semanal", "product": "Maria Bonita", "option": "", "volume": "", "serve": "", "price": "Revisar", "priceValue": null, "description": "Carne seca acebolada, arroz, feijão, farofa e couve refogada", "availability": "Sábado e Domingo", "notes": "", "highlight": false, "image": ""}, {"id": "028-cardapio-semanal-trem-bom-28", "category": "Refeições", "section": "Cardápio Semanal", "product": "Trem Bom", "option": "", "volume": "", "serve": "", "price": "Revisar", "priceValue": null, "description": "Arroz, feijão, bisteca, linguiça, torresmo e vinagrete", "availability": "Sábado e Domingo", "notes": "", "highlight": false, "image": ""}, {"id": "029-cardapio-semanal-lampiao-29", "category": "Refeições", "section": "Cardápio Semanal", "product": "Lampião", "option": "", "volume": "", "serve": "", "price": "Revisar", "priceValue": null, "description": "Carne seca, arroz, mandioca acebolada, feijão e farofa", "availability": "Sábado e Domingo", "notes": "", "highlight": false, "image": ""}, {"id": "030-adicionais-1-salada-30", "category": "Adicionais", "section": "Adicionais", "product": "1 Salada", "option": "", "volume": "", "serve": "", "price": "R$ 3,00", "priceValue": 3.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "031-adicionais-2-saladas-31", "category": "Adicionais", "section": "Adicionais", "product": "2 Saladas", "option": "", "volume": "", "serve": "", "price": "R$ 5,00", "priceValue": 5.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "032-adicionais-gelatina-32", "category": "Adicionais", "section": "Adicionais", "product": "Gelatina", "option": "", "volume": "", "serve": "", "price": "R$ 2,00", "priceValue": 2.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "033-adicionais-1-porcao-de-arroz-33", "category": "Adicionais", "section": "Adicionais", "product": "1 Porção de Arroz", "option": "", "volume": "", "serve": "", "price": "R$ 10,00", "priceValue": 10.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "034-adicionais-1-porcao-de-batata-34", "category": "Adicionais", "section": "Adicionais", "product": "1 Porção de Batata", "option": "", "volume": "", "serve": "", "price": "R$ 10,00", "priceValue": 10.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "035-adicionais-1-banana-a-milanesa-35", "category": "Adicionais", "section": "Adicionais", "product": "1 Banana à Milanesa", "option": "", "volume": "", "serve": "", "price": "R$ 3,00", "priceValue": 3.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "036-adicionais-1-bisteca-36", "category": "Adicionais", "section": "Adicionais", "product": "1 Bisteca", "option": "", "volume": "", "serve": "", "price": "R$ 10,00", "priceValue": 10.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "037-adicionais-contra-37", "category": "Adicionais", "section": "Adicionais", "product": "Contra", "option": "", "volume": "", "serve": "", "price": "R$ 20,00", "priceValue": 20.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}],
  lanches: [{"id": "001-porcoes-caste-01-2-em-1-costela-m", "category": "Porções", "section": "Porções", "product": "Caste 01 — 2 em 1 Costela", "option": "M", "volume": "", "serve": "", "price": "R$ 90,00", "priceValue": 90.0, "description": "Acompanha 1 das 3 opções: mandioca, fritas ou polenta", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "002-porcoes-porcao-3-em-1-g", "category": "Porções", "section": "Porções", "product": "Porção 3 em 1", "option": "G", "volume": "", "serve": "", "price": "R$ 100,00", "priceValue": 100.0, "description": "Calabresa, costela e fritas", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "003-porcoes-frango-a-passarinho-p", "category": "Porções", "section": "Porções", "product": "Frango à Passarinho", "option": "P", "volume": "", "serve": "", "price": "R$ 50,00", "priceValue": 50.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "004-porcoes-frango-a-passarinho-m", "category": "Porções", "section": "Porções", "product": "Frango à Passarinho", "option": "M", "volume": "", "serve": "", "price": "R$ 70,00", "priceValue": 70.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "005-porcoes-salada-p", "category": "Porções", "section": "Porções", "product": "Salada", "option": "P", "volume": "", "serve": "", "price": "R$ 35,00", "priceValue": 35.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "006-porcoes-caste-02-2-em-1-calabresa-m", "category": "Porções", "section": "Porções", "product": "Caste 02 — 2 em 1 Calabresa", "option": "M", "volume": "", "serve": "", "price": "R$ 70,00", "priceValue": 70.0, "description": "Acompanha 1 das 3 opções: mandioca, fritas ou polenta", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "007-porcoes-linguica-artesanal-p", "category": "Porções", "section": "Porções", "product": "Linguiça Artesanal", "option": "P", "volume": "", "serve": "", "price": "R$ 50,00", "priceValue": 50.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "008-porcoes-linguica-artesanal-m", "category": "Porções", "section": "Porções", "product": "Linguiça Artesanal", "option": "M", "volume": "", "serve": "", "price": "R$ 70,00", "priceValue": 70.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "009-porcoes-torresmo-p", "category": "Porções", "section": "Porções", "product": "Torresmo", "option": "P", "volume": "", "serve": "", "price": "R$ 50,00", "priceValue": 50.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "010-porcoes-torresmo-m", "category": "Porções", "section": "Porções", "product": "Torresmo", "option": "M", "volume": "", "serve": "", "price": "R$ 70,00", "priceValue": 70.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "011-porcoes-salame-p", "category": "Porções", "section": "Porções", "product": "Salame", "option": "P", "volume": "", "serve": "", "price": "R$ 40,00", "priceValue": 40.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "012-porcoes-caste-03-2-em-1-frango-m", "category": "Porções", "section": "Porções", "product": "Caste 03 — 2 em 1 Frango", "option": "M", "volume": "", "serve": "", "price": "R$ 70,00", "priceValue": 70.0, "description": "Acompanha 1 das 3 opções: mandioca, fritas ou polenta", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "013-porcoes-mandioca-c-carne-seca-m", "category": "Porções", "section": "Porções", "product": "Mandioca c/ Carne Seca", "option": "M", "volume": "", "serve": "", "price": "R$ 100,00", "priceValue": 100.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "014-porcoes-mandioca-p", "category": "Porções", "section": "Porções", "product": "Mandioca", "option": "P", "volume": "", "serve": "", "price": "R$ 30,00", "priceValue": 30.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "015-porcoes-mandioca-g", "category": "Porções", "section": "Porções", "product": "Mandioca", "option": "G", "volume": "", "serve": "", "price": "R$ 40,00", "priceValue": 40.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "016-porcoes-frios-p", "category": "Porções", "section": "Porções", "product": "Frios", "option": "P", "volume": "", "serve": "", "price": "R$ 40,00", "priceValue": 40.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "017-porcoes-porcao-2-em-1-m", "category": "Porções", "section": "Porções", "product": "Porção 2 em 1", "option": "M", "volume": "", "serve": "", "price": "R$ 90,00", "priceValue": 90.0, "description": "Contra filé e tirinhas de frango", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "018-porcoes-costela-p", "category": "Porções", "section": "Porções", "product": "Costela", "option": "P", "volume": "", "serve": "", "price": "R$ 75,00", "priceValue": 75.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "019-porcoes-costela-m", "category": "Porções", "section": "Porções", "product": "Costela", "option": "M", "volume": "", "serve": "", "price": "R$ 90,00", "priceValue": 90.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "020-porcoes-polenta-p", "category": "Porções", "section": "Porções", "product": "Polenta", "option": "P", "volume": "", "serve": "", "price": "R$ 30,00", "priceValue": 30.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "021-porcoes-polenta-g", "category": "Porções", "section": "Porções", "product": "Polenta", "option": "G", "volume": "", "serve": "", "price": "R$ 40,00", "priceValue": 40.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "022-porcoes-provolone-p", "category": "Porções", "section": "Porções", "product": "Provolone", "option": "P", "volume": "", "serve": "", "price": "R$ 45,00", "priceValue": 45.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "023-porcoes-porcao-3-em-1-m", "category": "Porções", "section": "Porções", "product": "Porção 3 em 1", "option": "M", "volume": "", "serve": "", "price": "R$ 120,00", "priceValue": 120.0, "description": "Contra filé, tirinhas de frango e fritas", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "024-porcoes-contra-file-ou-file-de-frango-p", "category": "Porções", "section": "Porções", "product": "Contra filé ou Filé de Frango", "option": "P", "volume": "", "serve": "", "price": "R$ 70,00", "priceValue": 70.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "025-porcoes-contra-file-ou-file-de-frango-m", "category": "Porções", "section": "Porções", "product": "Contra filé ou Filé de Frango", "option": "M", "volume": "", "serve": "", "price": "R$ 90,00", "priceValue": 90.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "026-porcoes-batata-p", "category": "Porções", "section": "Porções", "product": "Batata", "option": "P", "volume": "", "serve": "", "price": "R$ 30,00", "priceValue": 30.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "027-porcoes-batata-g", "category": "Porções", "section": "Porções", "product": "Batata", "option": "G", "volume": "", "serve": "", "price": "R$ 40,00", "priceValue": 40.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "028-porcoes-batata-com-catupiry-cheddar-e-bacon-p", "category": "Porções", "section": "Porções", "product": "Batata com Catupiry, Cheddar e Bacon", "option": "P", "volume": "", "serve": "", "price": "R$ 40,00", "priceValue": 40.0, "description": "Fritas com catupiry, cheddar e bacon", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "029-porcoes-batata-com-catupiry-cheddar-e-bacon-g", "category": "Porções", "section": "Porções", "product": "Batata com Catupiry, Cheddar e Bacon", "option": "G", "volume": "", "serve": "", "price": "R$ 50,00", "priceValue": 50.0, "description": "Fritas com catupiry, cheddar e bacon", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "030-adicionais-porcao-de-pao-30", "category": "Adicionais", "section": "Adicionais", "product": "Porção de Pão", "option": "", "volume": "", "serve": "", "price": "R$ 2,00", "priceValue": 2.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "031-lanches-x-bacon-31", "category": "Lanches", "section": "Lanches", "product": "X-Bacon", "option": "", "volume": "", "serve": "", "price": "R$ 22,00", "priceValue": 22.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "032-lanches-x-tudo-32", "category": "Lanches", "section": "Lanches", "product": "X-Tudo", "option": "", "volume": "", "serve": "", "price": "R$ 30,00", "priceValue": 30.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "033-lanches-x-costela-33", "category": "Lanches", "section": "Lanches", "product": "X-Costela", "option": "", "volume": "", "serve": "", "price": "R$ 30,00", "priceValue": 30.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "034-lanches-x-contra-34", "category": "Lanches", "section": "Lanches", "product": "X-Contra", "option": "", "volume": "", "serve": "", "price": "R$ 30,00", "priceValue": 30.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "035-lanches-x-burguer-35", "category": "Lanches", "section": "Lanches", "product": "X-Burguer", "option": "", "volume": "", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "036-lanches-x-salada-36", "category": "Lanches", "section": "Lanches", "product": "X-Salada", "option": "", "volume": "", "serve": "", "price": "R$ 17,00", "priceValue": 17.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "037-lanches-x-frango-37", "category": "Lanches", "section": "Lanches", "product": "X-Frango", "option": "", "volume": "", "serve": "", "price": "R$ 20,00", "priceValue": 20.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "038-lanches-x-calabresa-38", "category": "Lanches", "section": "Lanches", "product": "X-Calabresa", "option": "", "volume": "", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "039-lanches-mortadela-39", "category": "Lanches", "section": "Lanches", "product": "Mortadela", "option": "", "volume": "", "serve": "", "price": "R$ 12,00", "priceValue": 12.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "040-lanches-bauru-40", "category": "Lanches", "section": "Lanches", "product": "Bauru", "option": "", "volume": "", "serve": "", "price": "R$ 14,00", "priceValue": 14.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "041-lanches-misto-quente-41", "category": "Lanches", "section": "Lanches", "product": "Misto Quente", "option": "", "volume": "", "serve": "", "price": "R$ 14,00", "priceValue": 14.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "042-lanches-x-salame-42", "category": "Lanches", "section": "Lanches", "product": "X-Salame", "option": "", "volume": "", "serve": "", "price": "R$ 20,00", "priceValue": 20.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "043-combo-de-lanche-combo-de-lanche-43", "category": "Lanches", "section": "Combo de Lanche", "product": "Combo de Lanche", "option": "", "volume": "", "serve": "", "price": "R$ 38,00", "priceValue": 38.0, "description": "1 lanche (X-Salada, X-Burguer ou Frango) + 1 batata + 1 refrigerante 269ml", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "044-sobremesas-banana-split-44", "category": "Sobremesas", "section": "Sobremesas", "product": "Banana Split", "option": "", "volume": "", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "045-sobremesas-taca-casteluche-45", "category": "Sobremesas", "section": "Sobremesas", "product": "Taça Casteluche", "option": "", "volume": "", "serve": "", "price": "R$ 20,00", "priceValue": 20.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "046-sobremesas-petit-gateau-46", "category": "Sobremesas", "section": "Sobremesas", "product": "Petit Gateau", "option": "", "volume": "", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "047-sobremesas-acai-47", "category": "Sobremesas", "section": "Sobremesas", "product": "Açaí", "option": "", "volume": "", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}],
  bebidas: [{"id": "001-cervejas-lata-skol-269ml", "category": "Bebidas", "section": "Cervejas Lata", "product": "Skol", "option": "", "volume": "269ml", "serve": "", "price": "R$ 7,00", "priceValue": 7.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "002-cervejas-lata-itaipava-269ml", "category": "Bebidas", "section": "Cervejas Lata", "product": "Itaipava", "option": "", "volume": "269ml", "serve": "", "price": "R$ 7,00", "priceValue": 7.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "003-cervejas-lata-imperio-269ml", "category": "Bebidas", "section": "Cervejas Lata", "product": "Império", "option": "", "volume": "269ml", "serve": "", "price": "R$ 8,00", "priceValue": 8.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "004-cervejas-lata-amstel-269ml", "category": "Bebidas", "section": "Cervejas Lata", "product": "Amstel", "option": "", "volume": "269ml", "serve": "", "price": "R$ 8,00", "priceValue": 8.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "005-cervejas-lata-original-269ml", "category": "Bebidas", "section": "Cervejas Lata", "product": "Original", "option": "", "volume": "269ml", "serve": "", "price": "R$ 8,00", "priceValue": 8.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "006-cervejas-lata-eisenbahn-269ml", "category": "Bebidas", "section": "Cervejas Lata", "product": "Eisenbahn", "option": "", "volume": "269ml", "serve": "", "price": "R$ 8,00", "priceValue": 8.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "007-cervejas-lata-brahma-zero-350ml", "category": "Bebidas", "section": "Cervejas Lata", "product": "Brahma Zero", "option": "", "volume": "350ml", "serve": "", "price": "R$ 9,00", "priceValue": 9.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "008-long-neck-stella-artois-275ml", "category": "Bebidas", "section": "Long Neck", "product": "Stella Artois", "option": "", "volume": "275ml", "serve": "", "price": "R$ 12,00", "priceValue": 12.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "009-long-neck-budweiser-330ml", "category": "Bebidas", "section": "Long Neck", "product": "Budweiser", "option": "", "volume": "330ml", "serve": "", "price": "R$ 12,00", "priceValue": 12.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "010-long-neck-heineken-330ml", "category": "Bebidas", "section": "Long Neck", "product": "Heineken", "option": "", "volume": "330ml", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "011-long-neck-heineken-s-alcool-330ml", "category": "Bebidas", "section": "Long Neck", "product": "Heineken S/Álcool", "option": "", "volume": "330ml", "serve": "", "price": "R$ 18,00", "priceValue": 18.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "012-long-neck-corona-330ml", "category": "Bebidas", "section": "Long Neck", "product": "Corona", "option": "", "volume": "330ml", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "013-long-neck-skol-beats-269ml", "category": "Bebidas", "section": "Long Neck", "product": "Skol Beats", "option": "", "volume": "269ml", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "014-long-neck-smirnoff-ice-279ml", "category": "Bebidas", "section": "Long Neck", "product": "Smirnoff Ice", "option": "", "volume": "279ml", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "015-long-neck-51-ice-sabores-275ml", "category": "Bebidas", "section": "Long Neck", "product": "51 Ice Sabores", "option": "", "volume": "275ml", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "016-bebidas-quentes-bacardi-16", "category": "Bebidas", "section": "Bebidas Quentes", "product": "Bacardi", "option": "", "volume": "", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "Cristal, ouro, prata ou Big Apple", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "017-bebidas-quentes-campari-17", "category": "Bebidas", "section": "Bebidas Quentes", "product": "Campari", "option": "", "volume": "", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "018-bebidas-quentes-conhaque-18", "category": "Bebidas", "section": "Bebidas Quentes", "product": "Conhaque", "option": "", "volume": "", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "Dreher, Domus ou Domeq", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "019-bebidas-quentes-contini-branco-19", "category": "Bebidas", "section": "Bebidas Quentes", "product": "Contini Branco", "option": "", "volume": "", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "020-bebidas-quentes-fogo-paulista-20", "category": "Bebidas", "section": "Bebidas Quentes", "product": "Fogo Paulista", "option": "", "volume": "", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "021-bebidas-quentes-maria-mole-21", "category": "Bebidas", "section": "Bebidas Quentes", "product": "Maria Mole", "option": "", "volume": "", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "022-bebidas-quentes-martini-branco-22", "category": "Bebidas", "section": "Bebidas Quentes", "product": "Martini Branco", "option": "", "volume": "", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "023-bebidas-quentes-rum-montilla-23", "category": "Bebidas", "section": "Bebidas Quentes", "product": "Rum Montilla", "option": "", "volume": "", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "024-bebidas-quentes-steinhaeger-24", "category": "Bebidas", "section": "Bebidas Quentes", "product": "Steinhaeger", "option": "", "volume": "", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "025-bebidas-quentes-tequila-jose-cuervo-pequena-25", "category": "Bebidas", "section": "Bebidas Quentes", "product": "Tequila Jose Cuervo Pequena", "option": "", "volume": "", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "026-bebidas-quentes-tequila-jose-cuervo-grande-26", "category": "Bebidas", "section": "Bebidas Quentes", "product": "Tequila Jose Cuervo Grande", "option": "", "volume": "", "serve": "", "price": "R$ 45,00", "priceValue": 45.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "027-bebidas-quentes-jurupinga-copo-27", "category": "Bebidas", "section": "Bebidas Quentes", "product": "Jurupinga Copo", "option": "", "volume": "", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "200ml", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "028-bebidas-quentes-groselha-28", "category": "Bebidas", "section": "Bebidas Quentes", "product": "Groselha", "option": "", "volume": "", "serve": "", "price": "R$ 5,00", "priceValue": 5.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "029-cachaca-casteluche-amarela-e-branca-100ml", "category": "Bebidas", "section": "Cachaça Casteluche", "product": "Amarela e Branca", "option": "", "volume": "100ml", "serve": "", "price": "R$ 10,00", "priceValue": 10.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "030-cachaca-casteluche-cambuci-100ml", "category": "Bebidas", "section": "Cachaça Casteluche", "product": "Cambuci", "option": "", "volume": "100ml", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "031-cachaca-casteluche-bananinha-100ml", "category": "Bebidas", "section": "Cachaça Casteluche", "product": "Bananinha", "option": "", "volume": "100ml", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "032-cachaca-casteluche-canela-100ml", "category": "Bebidas", "section": "Cachaça Casteluche", "product": "Canela", "option": "", "volume": "100ml", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "033-cachaca-casteluche-emburana-100ml", "category": "Bebidas", "section": "Cachaça Casteluche", "product": "Emburana", "option": "", "volume": "100ml", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "034-licores-casteluche-licores-casteluche-100ml", "category": "Bebidas", "section": "Licores Casteluche", "product": "Licores Casteluche", "option": "", "volume": "100ml", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "Amendoim c/ leite, anis, cacau, canelinha, chiclete c/ banana, coco c/ abacaxi, coco c/ leite, jenipapo e pêssego c/ leite", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "035-vinhos-casteluche-vinhos-casteluche-300ml", "category": "Bebidas", "section": "Vinhos Casteluche", "product": "Vinhos Casteluche", "option": "", "volume": "300ml", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "Vinho tinto suave, seco, vinho pêssego, morango, abacaxi e branco", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "036-coqueteis-casteluche-milho-e-karula-100ml", "category": "Bebidas", "section": "Coquetéis Casteluche", "product": "Milho e Karula", "option": "", "volume": "100ml", "serve": "", "price": "R$ 20,00", "priceValue": 20.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "037-promocoes-baldes-promocao-balde-c-10-cervejas-37", "category": "Bebidas", "section": "Promoções / Baldes", "product": "Promoção Balde c/ 10 Cervejas", "option": "", "volume": "", "serve": "", "price": "Revisar", "priceValue": null, "description": "Preço coberto/rasurado na imagem", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "038-promocoes-baldes-garrafa-de-vinho-38", "category": "Bebidas", "section": "Promoções / Baldes", "product": "Garrafa de Vinho", "option": "", "volume": "", "serve": "", "price": "R$ 60,00", "priceValue": 60.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "039-promocoes-baldes-balde-com-10-heineken-ou-corona-39", "category": "Bebidas", "section": "Promoções / Baldes", "product": "Balde com 10 Heineken ou Corona", "option": "", "volume": "", "serve": "", "price": "R$ 150,00", "priceValue": 150.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "040-aguas-agua-mineral-510ml", "category": "Bebidas", "section": "Águas", "product": "Água Mineral", "option": "", "volume": "510ml", "serve": "", "price": "R$ 7,00", "priceValue": 7.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "041-aguas-agua-com-gas-500ml", "category": "Bebidas", "section": "Águas", "product": "Água com Gás", "option": "", "volume": "500ml", "serve": "", "price": "R$ 7,00", "priceValue": 7.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "042-aguas-agua-de-coco-200ml", "category": "Bebidas", "section": "Águas", "product": "Água de Coco", "option": "", "volume": "200ml", "serve": "", "price": "R$ 8,00", "priceValue": 8.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "043-aguas-agua-tonica-350ml", "category": "Bebidas", "section": "Águas", "product": "Água Tônica", "option": "", "volume": "350ml", "serve": "", "price": "R$ 8,00", "priceValue": 8.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "044-refrigerantes-gatorade-sabores-500ml", "category": "Bebidas", "section": "Refrigerantes", "product": "Gatorade Sabores", "option": "", "volume": "500ml", "serve": "", "price": "R$ 10,00", "priceValue": 10.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "045-refrigerantes-sprite-lemon-510ml", "category": "Bebidas", "section": "Refrigerantes", "product": "Sprite Lemon", "option": "", "volume": "510ml", "serve": "", "price": "R$ 8,00", "priceValue": 8.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "046-refrigerantes-schweppes-citrus-350ml", "category": "Bebidas", "section": "Refrigerantes", "product": "Schweppes Citrus", "option": "", "volume": "350ml", "serve": "", "price": "R$ 8,00", "priceValue": 8.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "047-refrigerantes-refrigerante-350ml", "category": "Bebidas", "section": "Refrigerantes", "product": "Refrigerante", "option": "", "volume": "350ml", "serve": "", "price": "R$ 8,00", "priceValue": 8.0, "description": "Coca-Cola, Coca-Cola Zero, Guaraná, Guaraná Zero, Fanta sabores, Soda e Sprite", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "048-refrigerantes-refrigerante-600ml", "category": "Bebidas", "section": "Refrigerantes", "product": "Refrigerante", "option": "", "volume": "600ml", "serve": "", "price": "R$ 12,00", "priceValue": 12.0, "description": "Coca-Cola, Coca-Cola Zero, Guaraná Antarctica e Guaraná Zero", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "049-energeticos-red-bull-250ml", "category": "Bebidas", "section": "Energéticos", "product": "Red Bull", "option": "", "volume": "250ml", "serve": "", "price": "R$ 20,00", "priceValue": 20.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "050-energeticos-red-bull-sabores-250ml", "category": "Bebidas", "section": "Energéticos", "product": "Red Bull Sabores", "option": "", "volume": "250ml", "serve": "", "price": "R$ 20,00", "priceValue": 20.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "051-energeticos-gelo-de-coco-51", "category": "Bebidas", "section": "Energéticos", "product": "Gelo de Coco", "option": "", "volume": "", "serve": "", "price": "R$ 8,00", "priceValue": 8.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "052-sucos-uva-casteluche-52", "category": "Bebidas", "section": "Sucos", "product": "Uva Casteluche", "option": "", "volume": "", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "053-sucos-acai-53", "category": "Bebidas", "section": "Sucos", "product": "Açaí", "option": "", "volume": "", "serve": "", "price": "R$ 20,00", "priceValue": 20.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "054-sucos-suco-polpa-54", "category": "Bebidas", "section": "Sucos", "product": "Suco Polpa", "option": "", "volume": "", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "Água ou leite. Sabores: morango, maracujá, graviola, uva, cajá, abacaxi c/ hortelã, acerola, caju, pêssego, cupuaçu e coco", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "055-sucos-polpa-polpa-55", "category": "Bebidas", "section": "Sucos", "product": "Polpa + Polpa", "option": "", "volume": "", "serve": "", "price": "R$ 20,00", "priceValue": 20.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "056-sucos-polpa-suco-de-laranja-56", "category": "Bebidas", "section": "Sucos", "product": "Polpa + Suco de Laranja", "option": "", "volume": "", "serve": "", "price": "R$ 20,00", "priceValue": 20.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "057-sucos-sucos-naturais-57", "category": "Bebidas", "section": "Sucos", "product": "Sucos Naturais", "option": "", "volume": "", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "Laranja, limão, morango e kiwi", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "058-drinks-soda-italiana-58", "category": "Bebidas", "section": "Drinks", "product": "Soda Italiana", "option": "", "volume": "", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "Soda ou água com gás; sabores: morango, limão e laranja", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "059-drinks-coqueluche-59", "category": "Bebidas", "section": "Drinks", "product": "Coqueluche", "option": "", "volume": "", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "Suco de uva e leite moça; sabores: morango, pêssego, coco e abacaxi", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "060-drinks-yakultluche-60", "category": "Bebidas", "section": "Drinks", "product": "Yakultluche", "option": "", "volume": "", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "Yakult, morango, leite moça e água tônica", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "061-drinks-espanhola-casteluche-61", "category": "Bebidas", "section": "Drinks", "product": "Espanhola Casteluche", "option": "", "volume": "", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "Vinho tinto Casteluche e leite condensado; frutas: abacaxi, coco, morango ou açaí", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "062-drinks-caipirinha-de-62", "category": "Bebidas", "section": "Drinks", "product": "Caipirinha de", "option": "", "volume": "", "serve": "", "price": "R$ 27,00", "priceValue": 27.0, "description": "Velho Barreiro, vodka, saquê, vinho branco ou vinho tinto; frutas: limão, kiwi, morango ou maracujá", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "063-drinks-dedo-de-moca-63", "category": "Bebidas", "section": "Drinks", "product": "Dedo de Moça", "option": "", "volume": "", "serve": "", "price": "R$ 40,00", "priceValue": 40.0, "description": "Yakult, morango, leite condensado e Smirnoff Ice", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "064-drinks-oxente-64", "category": "Bebidas", "section": "Drinks", "product": "Oxente", "option": "", "volume": "", "serve": "", "price": "R$ 40,00", "priceValue": 40.0, "description": "Suco de limão, leite condensado e Skol Beats", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "065-drinks-arretado-65", "category": "Bebidas", "section": "Drinks", "product": "Arretado", "option": "", "volume": "", "serve": "", "price": "R$ 40,00", "priceValue": 40.0, "description": "Caipirinha de vodka, morango, limão e maracujá", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "066-drinks-coquetel-66", "category": "Bebidas", "section": "Drinks", "product": "Coquetel", "option": "", "volume": "", "serve": "", "price": "Revisar", "priceValue": null, "description": "Vinho branco ou vodka, leite condensado; frutas: morango, abacaxi, açaí, pêssego, coco e maracujá", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "067-drinks-trovao-azul-67", "category": "Bebidas", "section": "Drinks", "product": "Trovão Azul", "option": "", "volume": "", "serve": "", "price": "R$ 28,00", "priceValue": 28.0, "description": "Licor, Schweppes e gelo de coco", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "068-dose-de-gin-generalli-sabores-frutas-vermelhas-maracuja-ou-tropical-red-bull", "category": "Bebidas", "section": "Dose de Gin", "product": "Generalli sabores frutas vermelhas, maracujá ou tropical", "option": "Red Bull", "volume": "", "serve": "", "price": "Revisar", "priceValue": null, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "069-dose-de-gin-generalli-sabores-frutas-vermelhas-maracuja-ou-tropical-tonica", "category": "Bebidas", "section": "Dose de Gin", "product": "Generalli sabores frutas vermelhas, maracujá ou tropical", "option": "Tônica", "volume": "", "serve": "", "price": "Revisar", "priceValue": null, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "070-dose-de-gin-tanqueray-sabores-frutas-vermelhas-maracuja-ou-tropical-red-bull", "category": "Bebidas", "section": "Dose de Gin", "product": "Tanqueray sabores frutas vermelhas, maracujá ou tropical", "option": "Red Bull", "volume": "", "serve": "", "price": "Revisar", "priceValue": null, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "071-dose-de-gin-tanqueray-sabores-frutas-vermelhas-maracuja-ou-tropical-tonica", "category": "Bebidas", "section": "Dose de Gin", "product": "Tanqueray sabores frutas vermelhas, maracujá ou tropical", "option": "Tônica", "volume": "", "serve": "", "price": "Revisar", "priceValue": null, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "072-gin-generalli-100ml", "category": "Bebidas", "section": "Gin", "product": "Generalli", "option": "", "volume": "100ml", "serve": "", "price": "Revisar", "priceValue": null, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "073-gin-tanqueray-100ml", "category": "Bebidas", "section": "Gin", "product": "Tanqueray", "option": "", "volume": "100ml", "serve": "", "price": "Revisar", "priceValue": null, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "074-vodka-vodka-casteluche-100ml", "category": "Bebidas", "section": "Vodka", "product": "Vodka Casteluche", "option": "", "volume": "100ml", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "075-vodka-smirnoff-100ml", "category": "Bebidas", "section": "Vodka", "product": "Smirnoff", "option": "", "volume": "100ml", "serve": "", "price": "R$ 15,00", "priceValue": 15.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "076-vodka-absolut-100ml", "category": "Bebidas", "section": "Vodka", "product": "Absolut", "option": "", "volume": "100ml", "serve": "", "price": "R$ 20,00", "priceValue": 20.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "077-whisky-passaport-100ml", "category": "Bebidas", "section": "Whisky", "product": "Passaport", "option": "", "volume": "100ml", "serve": "", "price": "R$ 20,00", "priceValue": 20.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "078-whisky-cavalo-branco-100ml", "category": "Bebidas", "section": "Whisky", "product": "Cavalo Branco", "option": "", "volume": "100ml", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "079-whisky-red-label-100ml", "category": "Bebidas", "section": "Whisky", "product": "Red Label", "option": "", "volume": "100ml", "serve": "", "price": "R$ 28,00", "priceValue": 28.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "080-whisky-jack-daniels-100ml", "category": "Bebidas", "section": "Whisky", "product": "Jack Daniels", "option": "", "volume": "100ml", "serve": "", "price": "R$ 35,00", "priceValue": 35.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "081-whisky-black-label-100ml", "category": "Bebidas", "section": "Whisky", "product": "Black Label", "option": "", "volume": "100ml", "serve": "", "price": "R$ 40,00", "priceValue": 40.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "082-copao-copao-01-82", "category": "Bebidas", "section": "Copão", "product": "Copão 01", "option": "", "volume": "", "serve": "", "price": "R$ 50,00", "priceValue": 50.0, "description": "Whisky (Cavalo Branco, Red Label ou Passaport) + gelo de coco + Red Bull", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "083-copao-copao-02-83", "category": "Bebidas", "section": "Copão", "product": "Copão 02", "option": "", "volume": "", "serve": "", "price": "R$ 60,00", "priceValue": 60.0, "description": "Whisky (Jack Daniels ou Black Label) + gelo de coco + Red Bull", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "084-extra-bandeja-de-frutas-84", "category": "Bebidas", "section": "Extra", "product": "Bandeja de Frutas", "option": "", "volume": "", "serve": "", "price": "R$ 25,00", "priceValue": 25.0, "description": "", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "085-combos-cavalo-branco-85", "category": "Bebidas", "section": "Combos", "product": "Cavalo Branco", "option": "", "volume": "", "serve": "", "price": "R$ 300,00", "priceValue": 300.0, "description": "Garrafa + 4 Red Bull + 4 gelo de coco", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "086-combos-red-label-86", "category": "Bebidas", "section": "Combos", "product": "Red Label", "option": "", "volume": "", "serve": "", "price": "R$ 320,00", "priceValue": 320.0, "description": "Garrafa + 4 Red Bull + 4 gelo de coco", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "087-combos-jack-daniels-87", "category": "Bebidas", "section": "Combos", "product": "Jack Daniels", "option": "", "volume": "", "serve": "", "price": "R$ 400,00", "priceValue": 400.0, "description": "Garrafa + 4 Red Bull + 4 gelo de coco", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "088-combos-black-label-88", "category": "Bebidas", "section": "Combos", "product": "Black Label", "option": "", "volume": "", "serve": "", "price": "R$ 420,00", "priceValue": 420.0, "description": "Garrafa + 4 Red Bull + 4 gelo de coco", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "089-combos-smirnoff-89", "category": "Bebidas", "section": "Combos", "product": "Smirnoff", "option": "", "volume": "", "serve": "", "price": "R$ 220,00", "priceValue": 220.0, "description": "Garrafa + 4 Red Bull", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "090-combos-absolut-90", "category": "Bebidas", "section": "Combos", "product": "Absolut", "option": "", "volume": "", "serve": "", "price": "R$ 300,00", "priceValue": 300.0, "description": "Garrafa + 4 Red Bull", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "091-combos-tanqueray-91", "category": "Bebidas", "section": "Combos", "product": "Tanqueray", "option": "", "volume": "", "serve": "", "price": "R$ 300,00", "priceValue": 300.0, "description": "Garrafa + 4 Red Bull", "availability": "", "notes": "", "highlight": false, "image": ""}, {"id": "092-combos-generalli-92", "category": "Bebidas", "section": "Combos", "product": "Generalli", "option": "", "volume": "", "serve": "", "price": "R$ 220,00", "priceValue": 220.0, "description": "Garrafa + 4 Red Bull", "availability": "", "notes": "", "highlight": false, "image": ""}]
};

function getDefaultMenuItems(menuType = 'especial') {
  if (menuType === 'especial') return structuredClone(window.MENU_DATA?.items || []);
  return structuredClone(ADDITIONAL_MENU_ITEMS[menuType] || []);
}

function ensureMenuTypes() {
  const validTypes = Object.keys(MENU_TYPE_OPTIONS);
  if (!validTypes.includes(state.menuType)) state.menuType = 'especial';
  if (!state.menuBanks || typeof state.menuBanks !== 'object' || Array.isArray(state.menuBanks)) state.menuBanks = {};
  if (!state.menuBanksVersion) {
    const currentItems = Array.isArray(state.items) && state.items.length ? structuredClone(state.items) : getDefaultMenuItems('especial');
    state.menuBanks = {
      especial: currentItems,
      semanal: getDefaultMenuItems('semanal'),
      lanches: getDefaultMenuItems('lanches'),
      bebidas: getDefaultMenuItems('bebidas')
    };
    state.menuBanksVersion = 1;
  } else {
    validTypes.forEach(type => {
      if (!Array.isArray(state.menuBanks[type])) state.menuBanks[type] = getDefaultMenuItems(type);
    });
  }
  state.items = state.menuBanks[state.menuType];
}

function switchMenuType(nextType) {
  if (!MENU_TYPE_OPTIONS[nextType] || nextType === state.menuType) return;
  state.menuBanks[state.menuType] = state.items;
  state.menuType = nextType;
  state.items = state.menuBanks[nextType] || getDefaultMenuItems(nextType);
  activeSection = 'Todos';
  searchTerm = '';
  const search = $('#searchInput');
  if (search) search.value = '';
  state.restaurant.tagline = MENU_TYPE_OPTIONS[nextType].tagline || state.restaurant.tagline;
  renderAll();
  toast(`${MENU_TYPE_OPTIONS[nextType].label} carregado.`);
}


function normalizeSettings() {
  state.restaurant = state.restaurant || {};
  state.menuType = state.menuType || 'especial';
  state.settings = {
    theme: 'boteco',
    pageFormat: 'folder-9-a4',
    density: 'compact',
    showImages: false,
    showDescriptions: true,
    breakBySection: false,
    maxPages: DEFAULT_MAX_PAGES,
    headerBrandMode: 'text',
    showQrCode: false,
    logoScale: 100,
    imageScale: 100,
    showDigitalMenu: false,
    watermark: 'none',
    fontScale: 100,
    pageLayouts: {},
    pageFillImages: {},
    pageFillImagePositions: {},
    pageFillImageScales: {},
    editFillImageMode: false,
    manualSectionPages: {},
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
  state.settings.imageScale = clampImageScale(state.settings.imageScale);
  state.settings.showDigitalMenu = state.settings.showDigitalMenu === true;
  state.settings.pageLayouts = state.settings.pageLayouts && typeof state.settings.pageLayouts === 'object' ? state.settings.pageLayouts : {};
  state.settings.pageFillImages = state.settings.pageFillImages && typeof state.settings.pageFillImages === 'object' ? state.settings.pageFillImages : {};
  state.settings.pageFillImagePositions = state.settings.pageFillImagePositions && typeof state.settings.pageFillImagePositions === 'object' ? state.settings.pageFillImagePositions : {};
  state.settings.pageFillImageScales = state.settings.pageFillImageScales && typeof state.settings.pageFillImageScales === 'object' ? state.settings.pageFillImageScales : {};
  state.settings.editFillImageMode = state.settings.editFillImageMode === true;
  state.settings.manualSectionPages = state.settings.manualSectionPages && typeof state.settings.manualSectionPages === 'object' ? state.settings.manualSectionPages : {};
  const currentFormat = FORMAT_CONFIGS[state.settings.pageFormat] || FORMAT_CONFIGS['folder-9-a4'];
  if (currentFormat.fixedMaxPages) state.settings.maxPages = currentFormat.fixedMaxPages;
  state.items = Array.isArray(state.items) ? state.items : [];
  ensureMenuTypes();
}

function clampPages(value) {
  const parsed = Number(value || DEFAULT_MAX_PAGES);
  if (Number.isNaN(parsed)) return DEFAULT_MAX_PAGES;
  return Math.max(1, Math.min(MAX_ALLOWED_PAGES, Math.round(parsed)));
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

function clampImageScale(value) {
  const parsed = Number(value || 100);
  if (Number.isNaN(parsed)) return 100;
  return Math.max(60, Math.min(160, Math.round(parsed)));
}

function clampFillImageScale(value) {
  const parsed = Number(value || 100);
  if (Number.isNaN(parsed)) return 100;
  return Math.max(70, Math.min(220, Math.round(parsed)));
}

function clampPercent(value, fallback = 50) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(0, Math.min(100, parsed));
}

function getCurrentConfig() {
  return FORMAT_CONFIGS[state.settings.pageFormat] || FORMAT_CONFIGS['folder-9-a4'];
}

function getMaxPagesForCurrentFormat() {
  const config = getCurrentConfig();
  return config.fixedMaxPages ? config.fixedMaxPages : clampPages(state.settings.maxPages);
}

function getLayoutPageNumber() {
  const input = $('#layoutPageNumber');
  const value = Number(input?.value || 1);
  return Math.max(1, Math.min(MAX_ALLOWED_PAGES, Math.round(Number.isNaN(value) ? 1 : value)));
}

function getPageLayout(pageNumber) {
  const layout = state.settings.pageLayouts?.[String(pageNumber)] || state.settings.pageLayouts?.[pageNumber] || 'auto';
  return PAGE_LAYOUT_OPTIONS.includes(layout) ? layout : 'auto';
}

function getResolvedPageLayout(page, pageNumber) {
  const selected = getPageLayout(pageNumber);
  if (selected !== 'auto') return selected;
  const totalItems = (page.sections || []).reduce((sum, section) => sum + (section.items?.length || 0), 0);
  const hasImage = (page.sections || []).some(section => (section.items || []).some(item => item.image));
  if (state.settings.showImages && hasImage && totalItems <= 8) return 'photo-left';
  if (totalItems > 34) return 'grid-4';
  if (totalItems > 22) return 'grid-3';
  if (totalItems > 15) return 'compact';
  return 'classic';
}


function getSectionPageKey(sectionName) {
  return `${state.menuType || 'especial'}::${sectionName || 'Sem seção'}`;
}

function getManualSectionPage(sectionName) {
  const key = getSectionPageKey(sectionName);
  const value = Number(state.settings.manualSectionPages?.[key]);
  if (!value || Number.isNaN(value)) return null;
  return Math.max(1, Math.min(getMaxPagesForCurrentFormat(), Math.round(value)));
}

function setManualSectionPage(sectionName, pageNumber) {
  const key = getSectionPageKey(sectionName);
  const max = getMaxPagesForCurrentFormat();
  const page = Math.max(1, Math.min(max, Math.round(Number(pageNumber) || 1)));
  state.settings.manualSectionPages[key] = page;
}

function clearManualSectionPage(sectionName) {
  const key = getSectionPageKey(sectionName);
  delete state.settings.manualSectionPages[key];
}

function ensurePage(pages, index) {
  while (pages.length <= index) pages.push({ sections: [], weight: 0 });
  pages[index] = pages[index] || { sections: [], weight: 0 };
  return pages[index];
}

function applyManualSectionPageOverrides(pages, maxPages) {
  const moves = [];
  pages.forEach((page, pageIndex) => {
    page.sections = (page.sections || []).filter(section => {
      const target = getManualSectionPage(section.name);
      if (!target || target === pageIndex + 1) return true;
      moves.push({ section, target: Math.max(1, Math.min(maxPages, target)) });
      return false;
    });
  });

  moves.forEach(({ section, target }) => {
    const targetPage = ensurePage(pages, target - 1);
    targetPage.sections.push(section);
  });

  while (pages.length > 1 && !pages[pages.length - 1].sections.length) pages.pop();
  return pages;
}

function openSectionPageMenu(sectionName, currentPage, event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  $('.category-page-popover')?.remove();

  const max = getMaxPagesForCurrentFormat();
  const rect = event?.currentTarget?.getBoundingClientRect?.() || { left: 24, top: 120, bottom: 150 };
  const popover = document.createElement('div');
  popover.className = 'category-page-popover no-print';
  popover.style.left = `${Math.min(window.innerWidth - 280, Math.max(16, rect.left))}px`;
  popover.style.top = `${Math.min(window.innerHeight - 220, Math.max(16, rect.bottom + 8))}px`;
  popover.innerHTML = `
    <strong>${escapeHtml(sectionName)}</strong>
    <span>Escolha em qual página esta categoria deve ficar.</span>
    <div class="popover-actions">
      <button type="button" data-action="up" ${currentPage <= 1 ? 'disabled' : ''}>↑ Página de cima</button>
      <button type="button" data-action="down" ${currentPage >= max ? 'disabled' : ''}>↓ Página de baixo</button>
      <button type="button" data-action="choose">Escolher página</button>
      <button type="button" data-action="auto">Automático</button>
    </div>
  `;
  document.body.appendChild(popover);

  popover.addEventListener('click', e => {
    const button = e.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'up') setManualSectionPage(sectionName, currentPage - 1);
    if (action === 'down') setManualSectionPage(sectionName, currentPage + 1);
    if (action === 'choose') {
      const answer = prompt(`Enviar “${sectionName}” para qual página?\nDigite um número entre 1 e ${max}.`, String(currentPage));
      if (answer === null) return;
      setManualSectionPage(sectionName, answer);
    }
    if (action === 'auto') clearManualSectionPage(sectionName);
    popover.remove();
    renderPreview();
    toast('Posição da categoria atualizada.');
  });

  setTimeout(() => {
    const close = closeEvent => {
      if (!popover.contains(closeEvent.target)) {
        popover.remove();
        document.removeEventListener('click', close);
      }
    };
    document.addEventListener('click', close);
  }, 0);
}

function updatePageLayoutControls() {
  const page = String(getLayoutPageNumber());
  const select = $('#pageLayoutSelect');
  if (select) select.value = getPageLayout(page);
  const upload = $('#pageFillImageUpload');
  if (upload) upload.title = state.settings.pageFillImages?.[page] ? 'Esta página já possui foto de preenchimento.' : 'Nenhuma foto aplicada nesta página.';
  const editToggle = $('#editFillImageMode');
  if (editToggle) editToggle.checked = state.settings.editFillImageMode === true;
  const scaleInput = $('#pageFillScale');
  const pageScale = clampFillImageScale(state.settings.pageFillImageScales?.[page] || 100);
  if (scaleInput) scaleInput.value = pageScale;
  const scaleLabel = $('#pageFillScaleLabel');
  if (scaleLabel) scaleLabel.textContent = `${pageScale}%`;
}

function updateMaxPagesControlState() {
  const input = $('#maxPages');
  if (!input) return;
  const config = getCurrentConfig();
  if (config.fixedMaxPages) {
    input.value = config.fixedMaxPages;
    input.disabled = true;
    input.title = 'Este formato foi criado para frente e verso, então o limite fica travado em 2 páginas.';
  } else {
    input.disabled = false;
    input.title = '';
    input.value = clampPages(state.settings.maxPages);
  }
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

    if (state.menuType === 'semanal' && (a.section || '') === 'Cardápio Semanal' && (b.section || '') === 'Cardápio Semanal') {
      const dayDiff = weeklyDayRank(a.availability) - weeklyDayRank(b.availability);
      if (dayDiff !== 0) return dayDiff;
      return String(a.id || '').localeCompare(String(b.id || ''), 'pt-BR', { numeric: true });
    }

    return String(a.product || '').localeCompare(String(b.product || ''), 'pt-BR', { sensitivity: 'base' }) ||
      String(a.option || a.volume || '').localeCompare(String(b.option || b.volume || ''), 'pt-BR', { sensitivity: 'base' });
  });
}

function setControlValues() {
  const values = {
    menuTypeSelect: state.menuType || 'especial',
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
    imageScale: state.settings.imageScale,
    maxPages: state.settings.maxPages,
    headerBrandMode: state.settings.headerBrandMode,
    layoutPageNumber: getLayoutPageNumber()
  };
  Object.entries(values).forEach(([id, value]) => {
    const el = $('#' + id);
    if (el) el.value = value;
  });
  $('#showDescriptions').checked = state.settings.showDescriptions !== false;
  $('#showImages').checked = state.settings.showImages === true;
  $('#breakBySection').checked = state.settings.breakBySection === true;
  $('#showDigitalMenu').checked = state.settings.showDigitalMenu === true;
  $('#showQrCode').checked = state.settings.showQrCode === true;
  const fontScaleLabel = $('#fontScaleLabel');
  if (fontScaleLabel) fontScaleLabel.textContent = `${state.settings.fontScale}%`;
  const logoScaleLabel = $('#logoScaleLabel');
  if (logoScaleLabel) logoScaleLabel.textContent = `${state.settings.logoScale}%`;
  const imageScaleLabel = $('#imageScaleLabel');
  if (imageScaleLabel) imageScaleLabel.textContent = `${state.settings.imageScale}%`;
  updateMaxPagesControlState();
  updatePageLayoutControls();
}

function bindSettings() {
  setControlValues();

  const menuTypeSelect = $('#menuTypeSelect');
  if (menuTypeSelect) menuTypeSelect.addEventListener('change', event => switchMenuType(event.target.value));

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
    const config = getCurrentConfig();
    if (config.fixedMaxPages) state.settings.maxPages = config.fixedMaxPages;
    updateMaxPagesControlState();
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
  $('#imageScale').addEventListener('input', event => {
    state.settings.imageScale = clampImageScale(event.target.value);
    event.target.value = state.settings.imageScale;
    $('#imageScaleLabel').textContent = `${state.settings.imageScale}%`;
    renderPreview();
  });
  $('#maxPages').addEventListener('input', event => {
    const config = getCurrentConfig();
    if (config.fixedMaxPages) {
      state.settings.maxPages = config.fixedMaxPages;
      event.target.value = config.fixedMaxPages;
      return;
    }
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
  $('#showDigitalMenu').addEventListener('change', event => {
    state.settings.showDigitalMenu = event.target.checked;
    renderPreview();
  });
  $('#breakBySection').addEventListener('change', event => {
    state.settings.breakBySection = event.target.checked;
    renderPreview();
  });

  $('#layoutPageNumber').addEventListener('input', event => {
    event.target.value = getLayoutPageNumber();
    updatePageLayoutControls();
  });

  $('#pageLayoutSelect').addEventListener('change', event => {
    const page = String(getLayoutPageNumber());
    state.settings.pageLayouts[page] = event.target.value;
    renderPreview();
  });

  $('#btnApplyLayoutAll').addEventListener('click', () => {
    const layout = $('#pageLayoutSelect').value || 'auto';
    const max = getMaxPagesForCurrentFormat();
    for (let page = 1; page <= max; page += 1) state.settings.pageLayouts[String(page)] = layout;
    renderPreview();
    toast('Layout aplicado em todas as páginas.');
  });

  $('#btnClearPageLayout').addEventListener('click', () => {
    const page = String(getLayoutPageNumber());
    delete state.settings.pageLayouts[page];
    updatePageLayoutControls();
    renderPreview();
    toast('Layout personalizado removido desta página.');
  });

  $('#pageFillImageUpload').addEventListener('change', event => readImageFile(event.target.files?.[0], dataUrl => {
    const page = String(getLayoutPageNumber());
    state.settings.pageFillImages[page] = dataUrl;
    state.settings.pageFillImagePositions[page] = state.settings.pageFillImagePositions[page] || { x: 50, y: 50 };
    // Começa com leve zoom para permitir reposicionamento sem criar bordas vazias.
    state.settings.pageFillImageScales[page] = state.settings.pageFillImageScales[page] || 120;
    event.target.value = '';
    updatePageLayoutControls();
    renderPreview();
    toast(`Foto de preenchimento aplicada na página ${page}. Ative o modo editar e arraste no preview.`);
  }));

  $('#btnClearFillImage').addEventListener('click', () => {
    const page = String(getLayoutPageNumber());
    delete state.settings.pageFillImages[page];
    delete state.settings.pageFillImagePositions[page];
    delete state.settings.pageFillImageScales[page];
    updatePageLayoutControls();
    renderPreview();
    toast(`Foto de preenchimento removida da página ${page}.`);
  });

  $('#editFillImageMode')?.addEventListener('change', event => {
    state.settings.editFillImageMode = event.target.checked;
    renderPreview();
    toast(event.target.checked ? 'Modo edição de foto ativado. Clique e arraste a foto no preview.' : 'Modo edição de foto desativado.');
  });

  $('#pageFillScale')?.addEventListener('input', event => {
    const page = String(getLayoutPageNumber());
    const value = clampFillImageScale(event.target.value);
    state.settings.pageFillImageScales[page] = value;
    event.target.value = value;
    $('#pageFillScaleLabel').textContent = `${value}%`;
    applyFillImageVisual(page);
  });

  $('#btnResetFillPosition')?.addEventListener('click', () => {
    const page = String(getLayoutPageNumber());
    state.settings.pageFillImagePositions[page] = { x: 50, y: 50 };
    state.settings.pageFillImageScales[page] = 120;
    updatePageLayoutControls();
    applyFillImageVisual(page);
    toast(`Foto da página ${page} centralizada com zoom seguro para arrastar.`);
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
  const shouldUseWeeklyOrder = state.menuType === 'semanal' && items.some(item => (item.section || '') === 'Cardápio Semanal');

  items.forEach((item, index) => {
    const key = [item.product || 'Sem nome', item.description || '', item.notes || '', item.availability || ''].join('::');
    if (!map.has(key)) {
      map.set(key, {
        id: item.id,
        product: item.product || 'Sem nome',
        description: item.description || '',
        notes: item.notes || '',
        image: item.image || '',
        availability: item.availability || '',
        _order: index,
        _dayRank: weeklyDayRank(item.availability || ''),
        variants: []
      });
    }
    const group = map.get(key);
    if (!group.image && item.image) group.image = item.image;
    group._order = Math.min(group._order, index);
    group._dayRank = Math.min(group._dayRank, weeklyDayRank(item.availability || ''));
    group.variants.push({
      label: buildVariantLabel(item),
      price: item.price || '',
      blankPrice: item.priceBlank === true,
      review: item.priceBlank === true ? false : (!item.price || isReviewText(item.price))
    });
  });

  const groups = Array.from(map.values());
  if (shouldUseWeeklyOrder) {
    return groups.sort((a, b) => (a._dayRank - b._dayRank) || (a._order - b._order));
  }
  return groups.sort((a, b) => String(a.product).localeCompare(String(b.product), 'pt-BR', { sensitivity: 'base' }));
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
  if (state.settings.showImages && item.image) {
    weight += 0.28 + ((state.settings.imageScale - 100) / 100) * 0.9;
  }
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
  if (pageIndex === 0 && state.settings.showDigitalMenu) capacity -= 3.2;
  const fontImpact = (state.settings.fontScale - 100) / 4; // 104 => -1 capacity approximately
  capacity -= fontImpact;
  return Math.max(4.4, capacity);
}

function paginateSections(sections, maxPages, config) {
  const pages = [{ sections: [], weight: 0 }];
  let pageIndex = 0;
  let overflowCount = 0;
  const sectionHeaderWeight = 1.25;

  const goNextPage = () => {
    if (pageIndex + 1 >= maxPages) return false;
    pageIndex += 1;
    pages[pageIndex] = pages[pageIndex] || { sections: [], weight: 0 };
    return true;
  };

  function sectionWeight(section) {
    return sectionHeaderWeight + section.items.reduce((total, item) => total + itemWeight(item), 0);
  }

  sections.forEach(section => {
    const weight = sectionWeight(section);
    const current = pages[pageIndex];
    const capacity = pageCapacity(pageIndex, config);

    // Mantém a categoria inteira em uma página. Se não couber junto com a página atual,
    // ela começa na página seguinte. Não criamos mais "continuação de categoria".
    if (current.sections.length && current.weight + weight > capacity) {
      goNextPage();
    }

    if (pageIndex + 1 >= maxPages && pages[pageIndex].sections.length && pages[pageIndex].weight + weight > pageCapacity(pageIndex, config)) {
      overflowCount += section.items.length;
    }

    pages[pageIndex].sections.push({ name: section.name, items: section.items, continuation: false, forceFit: weight > pageCapacity(pageIndex, config) });
    pages[pageIndex].weight += weight;
  });

  const arrangedPages = applyManualSectionPageOverrides(pages, maxPages);
  return { pages: arrangedPages.length ? arrangedPages : [{ sections: [], weight: 0 }], overflowCount };
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
  paper.style.setProperty('--image-scale', `${state.settings.imageScale / 100}`);
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
  const maxPages = getMaxPagesForCurrentFormat();
  const sections = createPrintSections(filteredItems());
  const result = paginateSections(sections, maxPages, config);
  const pages = result.pages.length ? result.pages : [{ sections: [], weight: 0 }];
  const menuSections = sections.map(section => section.name);

  paper.innerHTML = pages.map((page, index) => renderMenuPage(page, index + 1, pages.length, result.overflowCount, config, menuSections)).join('');
  const pageInfo = $('#pageInfo');
  if (pageInfo) {
    pageInfo.textContent = `${pages.length} página(s) · ${config.label} · limite ${maxPages}`;
  }
}

function renderMenuPage(page, pageNumber, totalPages, overflowCount, config, menuSections) {
  // V20.1: o aviso de excesso não é mais renderizado dentro das páginas.
  // Ele atrapalhava o fechamento do PDF quando o operador já havia ajustado manualmente o layout.
  const overflowWarning = '';
  return `
    <article class="menu-page page-layout-${getResolvedPageLayout(page, pageNumber)}" id="${pageNumber === 1 ? 'menu-root' : `page-${pageNumber}`}" data-page="${pageNumber}">
      ${renderWatermark()}
      ${renderPageHeader(pageNumber, totalPages)}
      <main class="folder-body">
        ${state.settings.showDigitalMenu && pageNumber === 1 ? renderDigitalMenu(menuSections) : ''}
        ${overflowWarning}
        ${page.sections.length ? page.sections.map(section => renderFolderSection(section, pageNumber)).join('') : '<div class="empty-page">Espaço reservado para novos itens.</div>'}
        ${renderPageFiller(pageNumber)}
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
  const backButton = state.settings.showDigitalMenu && !isFirst ? '<a class="back-to-menu" href="#menu-root">↑ Menu</a>' : '';
  return `
    <header class="folder-header ${isFirst ? 'first' : ''}${state.settings.showQrCode && state.restaurant.qrImage ? ' has-qr' : ''}">
      <div class="folder-brand-wrap">
        ${renderHeaderBrand(isFirst)}
        ${isFirst && state.restaurant.tagline ? `<p class="folder-tagline">${escapeHtml(state.restaurant.tagline)}</p>` : ''}
      </div>
      <div class="folder-side">
        ${backButton}
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

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'secao';
}

function renderDigitalMenu(sectionNames = []) {
  const uniqueSections = [...new Set(sectionNames)].filter(Boolean);
  if (!uniqueSections.length) return '';
  return `
    <nav class="digital-menu" aria-label="Menu de categorias">
      <div class="digital-menu-title">
        <span>Menu rápido</span>
        <strong>Toque em uma categoria</strong>
      </div>
      <div class="digital-menu-buttons">
        ${uniqueSections.map(name => `<a href="#cat-${slugify(name)}">${escapeHtml(name)}</a>`).join('')}
      </div>
    </nav>
  `;
}

function renderFolderSection(section, pageNumber = 1) {
  const idAttr = ` id="cat-${slugify(section.name)}"`;
  const count = section.items?.length || 0;
  const sizeClass = count > 28 ? 'fit-xlarge' : count > 18 ? 'fit-large' : count > 10 ? 'fit-medium' : 'fit-small';
  const manualPage = getManualSectionPage(section.name);
  const manualBadge = manualPage ? `<span class="manual-page-badge">Pág. ${manualPage}</span>` : '';
  return `
    <section class="folder-section ${sizeClass}${section.forceFit ? ' force-fit' : ''}${manualPage ? ' manually-positioned' : ''}"${idAttr}>
      <h3 class="category-handle" data-section-name="${escapeHtml(section.name)}" data-current-page="${pageNumber}" title="Clique para mover esta categoria para a página de cima ou de baixo">
        <span>${escapeHtml(section.name)}</span>
        ${manualBadge}
      </h3>
      <div class="folder-grid">
        ${section.items.map(renderFolderItem).join('')}
      </div>
    </section>
  `;
}

function getFillImagePosition(pageNumber) {
  const saved = state.settings.pageFillImagePositions?.[String(pageNumber)] || {};
  return { x: clampPercent(saved.x, 50), y: clampPercent(saved.y, 50) };
}

function renderPageFiller(pageNumber) {
  const pageKey = String(pageNumber);
  const image = state.settings.pageFillImages?.[pageKey];
  if (!image) return '';
  const position = getFillImagePosition(pageKey);
  const scale = clampFillImageScale(state.settings.pageFillImageScales?.[pageKey] || 100) / 100;
  const editableClass = state.settings.editFillImageMode ? ' editable' : '';
  return `
    <div class="page-filler-photo${editableClass}" data-page="${pageKey}" aria-label="Foto para preencher espaço em branco" style="--fill-x:${position.x}%; --fill-y:${position.y}%; --fill-scale:${scale};">
      <img src="${image}" alt="Foto de preenchimento da página ${pageNumber}" />
      <span class="filler-caption">Imagem meramente ilustrativa</span>
    </div>
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
  const config = getCurrentConfig();
  if (config.fixedMaxPages) state.settings.maxPages = config.fixedMaxPages;
  state.settings.density = 'compact';
  state.settings.breakBySection = false;
  state.settings.showDescriptions = !['feed-4x5', 'story-9x16'].includes(selectedFormat);
  state.settings.fontScale = selectedFormat === 'folder-9-a4' ? 96 : 100;
  if (config.fixedMaxPages) state.settings.fontScale = 92;
  if (selectedFormat === 'a5-portrait') state.settings.fontScale = 96;
  if (selectedFormat === 'story-9x16') state.settings.fontScale = 92;
  if (selectedFormat === 'feed-4x5') state.settings.fontScale = 96;
  if (state.settings.showImages) state.settings.imageScale = selectedFormat === 'a4-landscape' ? 90 : 100;
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

function deleteCategory() {
  if (activeSection === 'Todos') {
    alert('Escolha uma categoria específica no filtro antes de eliminar. A opção “Todos” não pode ser eliminada de uma vez.');
    return;
  }

  const sectionToDelete = activeSection;
  const currentMenuType = state.menuType || 'especial';
  const targets = state.items.filter(item => (item.section || 'Sem seção') === sectionToDelete);

  if (!targets.length) {
    alert('Não encontrei itens nessa categoria.');
    return;
  }

  if (!confirm(`Eliminar a categoria “${sectionToDelete}” com ${targets.length} item(ns)? Essa ação remove os itens apenas do tipo de cardápio atual.`)) return;

  // Remove da lista em uso.
  state.items = state.items.filter(item => (item.section || 'Sem seção') !== sectionToDelete);

  // IMPORTANTE: também atualiza o banco do tipo de cardápio atual.
  // Sem isso, o normalizeSettings/ensureMenuTypes recarregava a categoria antiga.
  state.menuBanks = state.menuBanks && typeof state.menuBanks === 'object' ? state.menuBanks : {};
  state.menuBanks[currentMenuType] = state.items;

  // Limpa posicionamentos manuais ligados à categoria apagada.
  if (state.settings?.manualSectionPages) {
    delete state.settings.manualSectionPages[sectionToDelete];
  }

  activeSection = 'Todos';
  const sectionFilter = $('#sectionFilter');
  if (sectionFilter) sectionFilter.value = 'Todos';

  renderAll();
  saveData();
  toast(`Categoria “${sectionToDelete}” eliminada do cardápio atual.`);
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


function makeFileSlug(value) {
  return String(value || 'cardapio')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cardapio';
}

function collectPublicExportCss() {
  let css = '';
  try {
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        Array.from(sheet.cssRules || []).forEach(rule => {
          css += `${rule.cssText}\n`;
        });
      } catch (error) {
        // Algumas folhas externas podem bloquear leitura por CORS. O link para style.css segue no HTML exportado.
      }
    });
  } catch (error) {
    console.warn('Não foi possível coletar todo o CSS da página.', error);
  }

  css += `
    html { scroll-behavior: smooth; }
    body.public-cardapio-body {
      margin: 0;
      min-height: 100vh;
      background: #0c0b0a;
      color: #f6f0e5;
      overflow-x: hidden;
    }
    .public-export-shell {
      width: min(100%, 1180px);
      margin: 0 auto;
      padding: 24px 18px 48px;
    }
    .public-export-topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 18px;
      margin: 0 0 20px;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 0 0 22px 22px;
      background: rgba(10,10,10,.88);
      backdrop-filter: blur(14px);
      box-shadow: 0 16px 50px rgba(0,0,0,.25);
    }
    .public-export-topbar strong {
      display: block;
      color: var(--gold, #c9973f);
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 24px;
      line-height: 1;
    }
    .public-export-topbar span {
      display: block;
      margin-top: 3px;
      color: rgba(255,255,255,.68);
      font-size: 12px;
      font-weight: 800;
    }
    .public-export-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .public-export-actions a,
    .public-export-actions button {
      appearance: none;
      border: 1px solid rgba(201,151,63,.45);
      border-radius: 999px;
      background: rgba(201,151,63,.13);
      color: #ffe8b2;
      padding: 10px 13px;
      font: inherit;
      font-size: 12px;
      font-weight: 900;
      text-decoration: none;
      cursor: pointer;
    }
    .public-export-cardapio {
      margin: 0 auto !important;
    }
    .public-cardapio-body .menu-page {
      margin-left: auto;
      margin-right: auto;
    }
    @media (max-width: 860px) {
      .public-export-shell { padding: 12px 10px 36px; }
      .public-export-topbar {
        align-items: flex-start;
        border-radius: 0 0 18px 18px;
      }
      .public-export-topbar strong { font-size: 20px; }
      .public-export-actions { justify-content: flex-start; }
      .public-cardapio-body .paper.menu-book {
        width: 100% !important;
        gap: 16px !important;
      }
      .public-cardapio-body .menu-page {
        width: 100% !important;
        height: auto !important;
        min-height: auto !important;
        overflow: visible !important;
        border-radius: 18px !important;
      }
      .public-cardapio-body .folder-header {
        grid-template-columns: 1fr !important;
      }
      .public-cardapio-body .folder-side {
        justify-self: start !important;
        align-items: flex-start !important;
        flex-wrap: wrap;
      }
      .public-cardapio-body .folder-contact {
        text-align: left !important;
      }
      .public-cardapio-body .folder-body {
        overflow: visible !important;
        padding: 14px 14px 10px !important;
      }
      .public-cardapio-body .folder-grid {
        grid-template-columns: 1fr !important;
      }
      .public-cardapio-body .folder-item-top {
        grid-template-columns: 1fr auto !important;
      }
      .public-cardapio-body .digital-menu-buttons {
        grid-template-columns: 1fr !important;
      }
    }
    @media print {
      .public-export-topbar { display: none !important; }
      .public-export-shell { padding: 0 !important; }
    }
  `;

  return css;
}

function buildPublicCardapioHtml(cardapioMarkup, css) {
  const restaurantName = state.restaurant.name || 'Cardápio';
  const contactLine = [state.restaurant.whatsapp, state.restaurant.instagram, state.restaurant.address].filter(Boolean).join(' · ');
  const generatedAt = new Date().toLocaleString('pt-BR');
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(restaurantName)} | Cardápio Digital</title>
  <meta name="description" content="Cardápio digital ${escapeHtml(restaurantName)}" />
  <link rel="stylesheet" href="style.css" />
  <style>${css}</style>
</head>
<body class="public-cardapio-body">
  <header class="public-export-topbar">
    <div>
      <strong>${escapeHtml(restaurantName)}</strong>
      <span>${escapeHtml(contactLine || 'Cardápio digital')}</span>
    </div>
    <nav class="public-export-actions" aria-label="Ações rápidas">
      <a href="#menu-root">Menu</a>
      ${state.restaurant.whatsapp ? `<a href="https://wa.me/${String(state.restaurant.whatsapp).replace(/\D/g, '')}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
      <button type="button" onclick="window.print()">Imprimir</button>
    </nav>
  </header>
  <main class="public-export-shell">
    ${cardapioMarkup}
  </main>
  <script>
    document.documentElement.dataset.generatedAt = ${JSON.stringify(generatedAt)};
  </script>
</body>
</html>`;
}

function downloadTextFile(filename, content, mimeType = 'text/html;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportPublicCardapio() {
  normalizeSettings();
  const previous = {
    activeSection,
    searchTerm,
    showDigitalMenu: state.settings.showDigitalMenu,
    editFillImageMode: state.settings.editFillImageMode
  };

  try {
    activeSection = 'Todos';
    searchTerm = '';
    state.settings.showDigitalMenu = true;
    state.settings.editFillImageMode = false;
    renderPreview();

    const paper = $('#pdfArea');
    const clone = paper.cloneNode(true);
    clone.id = 'cardapio-publico';
    clone.classList.add('public-export-cardapio');

    const css = collectPublicExportCss();
    const html = buildPublicCardapioHtml(clone.outerHTML, css);
    const filename = `${makeFileSlug(state.restaurant.name || 'cardapio')}-cardapio-publico.html`;
    downloadTextFile(filename, html);
    toast('Cardápio público exportado em HTML. Suba esse arquivo no GitHub Pages junto com o projeto.');
  } catch (error) {
    console.error(error);
    alert('Não consegui exportar o cardápio público. Veja o console para detalhes.');
  } finally {
    activeSection = previous.activeSection;
    searchTerm = previous.searchTerm;
    state.settings.showDigitalMenu = previous.showDigitalMenu;
    state.settings.editFillImageMode = previous.editFillImageMode;
    renderAll();
  }
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
  const label = MENU_TYPE_OPTIONS[state.menuType]?.label || 'cardápio atual';
  if (!confirm(`Restaurar a base original de "${label}"? Isso apaga as alterações desse tipo de cardápio salvas no navegador.`)) return;
  state.menuBanks[state.menuType] = getDefaultMenuItems(state.menuType);
  state.items = state.menuBanks[state.menuType];
  activeSection = 'Todos';
  renderAll();
}

async function generatePdf() {
  normalizeSettings();
  document.body.classList.add('exporting-image-pdf');
  const previousEditMode = state.settings.editFillImageMode;
  state.settings.editFillImageMode = false;
  renderPreview();
  const area = $('#pdfArea');
  const pages = $$('.menu-page', area);
  const config = getCurrentConfig();
  const filename = `cardapio-${(state.restaurant.name || 'restaurante').toLowerCase().replace(/\s+/g, '-')}.pdf`;

  if (!pages.length) {
    state.settings.editFillImageMode = previousEditMode;
    document.body.classList.remove('exporting-image-pdf');
    renderPreview();
    alert('Nenhuma página encontrada para exportar.');
    return;
  }

  try {
    if (window.jspdf?.jsPDF && window.html2canvas) {
      await generateManualPdf(pages, config, filename);
      state.settings.editFillImageMode = previousEditMode;
      document.body.classList.remove('exporting-image-pdf');
      renderPreview();
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
    state.settings.editFillImageMode = previousEditMode;
    document.body.classList.remove('exporting-image-pdf');
    renderPreview();
    return;
  }

  window.print();
  state.settings.editFillImageMode = previousEditMode;
  document.body.classList.remove('exporting-image-pdf');
  renderPreview();
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


function getPrintPageSize(config) {
  const format = state.settings.pageFormat || 'folder-9-a4';
  if (format === 'a4-landscape' || format === 'duplex-a4-landscape') return 'A4 landscape';
  if (format === 'duplex-a3-landscape') return 'A3 landscape';
  if (format === 'a5-portrait') return 'A5 portrait';
  if (format === 'feed-4x5' || format === 'story-9x16') return `${config.widthMm}mm ${config.heightMm}mm`;
  return 'A4 portrait';
}

function updateDynamicPrintStyle() {
  const config = getCurrentConfig();
  let style = document.getElementById('dynamicPrintStyle');
  if (!style) {
    style = document.createElement('style');
    style.id = 'dynamicPrintStyle';
    document.head.appendChild(style);
  }
  style.textContent = `
    @media print {
      @page { size: ${getPrintPageSize(config)}; margin: 0; }
      html, body { width: ${config.widthMm}mm; margin: 0 !important; padding: 0 !important; background: #fff !important; }
      .no-print, .app-header, .sidebar, .preview-toolbar { display: none !important; }
      .workspace { display: block !important; padding: 0 !important; margin: 0 !important; }
      .preview-shell { overflow: visible !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }
      .paper.menu-book { width: ${config.widthMm}mm !important; display: block !important; gap: 0 !important; margin: 0 !important; box-shadow: none !important; background: transparent !important; }
      .menu-page { width: ${config.widthMm}mm !important; height: ${config.heightMm}mm !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; overflow: hidden !important; page-break-after: always !important; break-after: page !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .menu-page:last-child { page-break-after: auto !important; break-after: auto !important; }
      .folder-section h3, .folder-section h3 span, .header-text-brand h2, .folder-item-top strong, .folder-desc, .folder-meta, .price-balloon { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .folder-section h3 span:first-child { color: #fff !important; -webkit-text-fill-color: #fff !important; }
    }
  `;
}

function generateVectorPdf() {
  normalizeSettings();
  const previousEditMode = state.settings.editFillImageMode;
  state.settings.editFillImageMode = false;
  renderPreview();
  updateDynamicPrintStyle();

  document.body.classList.add('printing-vector-pdf');
  toast('Na janela que abrir, escolha “Salvar como PDF”. Esse modo preserva textos e vetores melhor do que o PDF imagem.');

  setTimeout(() => {
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-vector-pdf');
      state.settings.editFillImageMode = previousEditMode;
      renderPreview();
    }, 600);
  }, 120);
}

function bindCategoryMoveEditor() {
  const paper = $('#pdfArea');
  if (!paper || paper.dataset.categoryMoveBound === 'true') return;
  paper.dataset.categoryMoveBound = 'true';

  paper.addEventListener('click', event => {
    const handle = event.target.closest?.('.category-handle');
    if (!handle) return;
    const sectionName = handle.dataset.sectionName;
    const currentPage = Number(handle.dataset.currentPage || handle.closest('.menu-page')?.dataset.page || 1);
    if (!sectionName) return;
    openSectionPageMenu(sectionName, currentPage, event);
  }, true);
}


function setupCollapsiblePanels() {
  const panels = $$('.panel');
  panels.forEach((panel, index) => {
    if (panel.dataset.collapsibleReady === 'true') return;
    const title = $('.panel-title', panel);
    if (!title) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'panel-toggle';
    button.setAttribute('aria-label', 'Minimizar ou expandir painel');
    title.appendChild(button);

    const setCollapsed = collapsed => {
      panel.classList.toggle('is-collapsed', collapsed);
      button.textContent = collapsed ? '+' : '−';
      button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    };

    const toggle = event => {
      event.preventDefault();
      event.stopPropagation();
      setCollapsed(!panel.classList.contains('is-collapsed'));
    };

    button.addEventListener('click', toggle);
    title.addEventListener('dblclick', toggle);
    panel.dataset.collapsibleReady = 'true';

    // Por padrão, deixa apenas o primeiro painel aberto para reduzir poluição visual.
    setCollapsed(index > 0);
  });
}


function applyFillImageVisual(pageNumber) {
  const pageKey = String(pageNumber);
  const filler = $(`.page-filler-photo[data-page="${pageKey}"]`);
  if (!filler) return;
  const pos = getFillImagePosition(pageKey);
  const scale = clampFillImageScale(state.settings.pageFillImageScales?.[pageKey] || 100) / 100;
  filler.style.setProperty('--fill-x', `${pos.x}%`);
  filler.style.setProperty('--fill-y', `${pos.y}%`);
  filler.style.setProperty('--fill-scale', scale);
}

function setFillPositionFromPointer(event) {
  if (!fillImageDrag?.element) return;
  const rect = fillImageDrag.rect || fillImageDrag.element.getBoundingClientRect();
  const deltaX = ((event.clientX - fillImageDrag.startX) / Math.max(1, rect.width)) * 100;
  const deltaY = ((event.clientY - fillImageDrag.startY) / Math.max(1, rect.height)) * 100;

  // Movimento invertido para parecer que o usuário está puxando a foto, não o recorte.
  const x = clampPercent(fillImageDrag.startPos.x - deltaX, 50);
  const y = clampPercent(fillImageDrag.startPos.y - deltaY, 50);
  const page = fillImageDrag.page;

  state.settings.pageFillImagePositions[page] = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  fillImageDrag.element.style.setProperty('--fill-x', `${x}%`);
  fillImageDrag.element.style.setProperty('--fill-y', `${y}%`);
}

function beginFillImageDrag(event, filler) {
  if (!state.settings.editFillImageMode || !filler) return;
  event.preventDefault();
  event.stopPropagation();

  const page = filler.dataset.page || String(filler.closest('.menu-page')?.dataset.page || getLayoutPageNumber());
  state.settings.pageFillImagePositions[page] = state.settings.pageFillImagePositions[page] || { x: 50, y: 50 };

  // Se estiver sem zoom, o arraste pode não ser perceptível. Subimos para 120% automaticamente.
  const currentScale = clampFillImageScale(state.settings.pageFillImageScales?.[page] || 100);
  if (currentScale <= 100) {
    state.settings.pageFillImageScales[page] = 120;
    filler.style.setProperty('--fill-scale', 1.2);
    updatePageLayoutControls();
  }

  fillImageDrag = {
    element: filler,
    page,
    rect: filler.getBoundingClientRect(),
    startX: event.clientX,
    startY: event.clientY,
    startPos: getFillImagePosition(page),
    pointerId: event.pointerId
  };

  filler.classList.add('dragging');
  try { filler.setPointerCapture(event.pointerId); } catch (error) { /* Alguns navegadores não suportam em todos os elementos. */ }
}

function endFillImageDrag() {
  if (!fillImageDrag) return;
  fillImageDrag.element.classList.remove('dragging');
  fillImageDrag = null;
}

function bindFillImageEditor() {
  const paper = $('#pdfArea');
  if (!paper || paper.dataset.fillEditorBound === 'true') return;
  paper.dataset.fillEditorBound = 'true';

  // Delegação robusta: funciona mesmo quando o preview é recriado.
  paper.addEventListener('pointerdown', event => {
    const filler = event.target.closest?.('.page-filler-photo');
    beginFillImageDrag(event, filler);
  }, true);

  document.addEventListener('pointermove', event => {
    if (!fillImageDrag) return;
    event.preventDefault();
    setFillPositionFromPointer(event);
  }, { passive: false });

  document.addEventListener('pointerup', endFillImageDrag, true);
  document.addEventListener('pointercancel', endFillImageDrag, true);
}


function renderAll() {
  normalizeSettings();
  setupCollapsiblePanels();
  bindFillImageEditor();
  bindCategoryMoveEditor();
  if (!isBound) {
    bindSettings();
    $('#sectionFilter').addEventListener('change', event => { activeSection = event.target.value; renderEditor(); renderPreview(); });
    $('#searchInput').addEventListener('input', event => { searchTerm = event.target.value; renderEditor(); renderPreview(); });
    $('#btnAddItem').addEventListener('click', addItem);
    $('#btnAutoLayout').addEventListener('click', autoLayout);
    $('#btnZeroCategory').addEventListener('click', zeroCategoryPrices);
    $('#btnDeleteCategory').addEventListener('click', deleteCategory);
    $('#btnSave').addEventListener('click', saveData);
    $('#btnExport').addEventListener('click', exportJson);
    $('#btnPublicHtml').addEventListener('click', exportPublicCardapio);
    $('#btnSavePreset').addEventListener('click', savePreset);
    $('#btnApplyPreset').addEventListener('click', applySavedPreset);
    $('#btnDeletePreset').addEventListener('click', deleteSavedPreset);
    $('#btnExportPreset').addEventListener('click', exportPreset);
    $('#presetImport').addEventListener('change', event => { if (event.target.files?.[0]) importPreset(event.target.files[0]); event.target.value = ''; });
    $('#btnReset').addEventListener('click', resetData);
    $('#btnVectorPdf')?.addEventListener('click', generateVectorPdf);
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
