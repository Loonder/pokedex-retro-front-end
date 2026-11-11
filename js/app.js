/* Pokédex Retrô: todos os cards abaixo são criados a partir de respostas da PokéAPI. */
const API_URL = 'https://pokeapi.co/api/v2';
const CACHE_PREFIX = 'pokedex-retro-v1:';
const CACHE_LIFETIME = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 12;

const cards = document.querySelector('#cards');
const statusBox = document.querySelector('#status');
const countLabel = document.querySelector('#result-count');
const pagination = document.querySelector('#pagination');
const pageLabel = document.querySelector('#page-label');
const previousButton = document.querySelector('#prev-page');
const nextButton = document.querySelector('#next-page');
const searchInput = document.querySelector('#search-input');
const refreshButton = document.querySelector('#refresh-button');
const regionButtons = [...document.querySelectorAll('[data-region]')];

const typeNames = {
  normal: 'Normal', fire: 'Fogo', water: 'Água', electric: 'Elétrico', grass: 'Planta',
  ice: 'Gelo', fighting: 'Lutador', poison: 'Venenoso', ground: 'Terra', flying: 'Voador',
  psychic: 'Psíquico', bug: 'Inseto', rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão',
  dark: 'Sombrio', steel: 'Aço', fairy: 'Fada'
};

let pokemonList = [];
let region = 'all';
let page = 1;
let requestVersion = 0;

function readCache(url) {
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_PREFIX + url));
    return saved && Date.now() - saved.savedAt < CACHE_LIFETIME ? saved.data : null;
  } catch { return null; }
}

function writeCache(url, data) {
  try { localStorage.setItem(CACHE_PREFIX + url, JSON.stringify({ savedAt: Date.now(), data })); }
  catch { /* A página continua funcional se o navegador bloquear o armazenamento. */ }
}

async function fetchJson(url) {
  const cached = readCache(url);
  if (cached) return cached;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`A PokéAPI respondeu com o código ${response.status}.`);
  const data = await response.json();
  writeCache(url, data);
  return data;
}

function showStatus(message) {
  statusBox.textContent = message;
  statusBox.hidden = false;
}

function capitalize(name) {
  return name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createCard(pokemon) {
  const card = createElement('article', 'pokemon-card');
  const imageArea = createElement('div', 'card-image');
  imageArea.appendChild(createElement('span', 'card-number', `#${String(pokemon.id).padStart(3, '0')}`));

  const image = document.createElement('img');
  image.src = pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default || '';
  image.alt = `Imagem de ${capitalize(pokemon.name)}`;
  image.loading = 'lazy';
  image.width = 170;
  image.height = 170;
  imageArea.appendChild(image);
  card.appendChild(imageArea);

  const body = createElement('div', 'card-body');
  body.appendChild(createElement('span', 'card-region', pokemon.id <= 151 ? 'Kanto · 1ª geração' : 'Johto · 2ª geração'));
  body.appendChild(createElement('h3', '', capitalize(pokemon.name)));

  const types = createElement('div', 'type-list');
  types.setAttribute('aria-label', 'Tipos');
  pokemon.types.forEach(({ type }) => types.appendChild(createElement('span', `type-pill type-${type.name}`, typeNames[type.name] || capitalize(type.name))));
  body.appendChild(types);

  const metadata = createElement('div', 'card-meta');
  const height = createElement('span', '', 'ALTURA');
  height.appendChild(createElement('strong', '', `${(pokemon.height / 10).toFixed(1).replace('.', ',')} m`));
  const weight = createElement('span', '', 'PESO');
  weight.appendChild(createElement('strong', '', `${(pokemon.weight / 10).toFixed(1).replace('.', ',')} kg`));
  metadata.appendChild(height);
  metadata.appendChild(weight);
  body.appendChild(metadata);
  card.appendChild(body);
  return card;
}

function filteredList() {
  const term = searchInput.value.trim().toLowerCase();
  return pokemonList.filter((item, index) => {
    const number = index + 1;
    const belongsToRegion = region === 'all' || (region === 'kanto' ? number <= 151 : number > 151);
    return belongsToRegion && (!term || item.name.includes(term) || String(number) === term || String(number).padStart(3, '0') === term);
  });
}

async function renderCards() {
  const currentRequest = ++requestVersion;
  const matches = filteredList();
  const totalPages = Math.ceil(matches.length / PAGE_SIZE);
  page = Math.min(page, Math.max(totalPages, 1));
  const currentItems = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  countLabel.textContent = `${matches.length} Pokémon ${matches.length === 1 ? 'encontrado' : 'encontrados'}`;
  cards.replaceChildren();

  if (!matches.length) {
    showStatus('Nenhum Pokémon encontrado. Tente outro nome ou selecione outra região.');
    pagination.hidden = true;
    return;
  }

  showStatus('Buscando personagens na PokéAPI...');
  pagination.hidden = true;
  const responses = await Promise.allSettled(currentItems.map(item => fetchJson(item.url)));
  if (currentRequest !== requestVersion) return;

  const fragment = document.createDocumentFragment();
  let successful = 0;
  responses.forEach(result => {
    if (result.status === 'fulfilled') {
      fragment.appendChild(createCard(result.value));
      successful += 1;
    }
  });
  cards.appendChild(fragment);

  if (!successful) {
    showStatus('Não foi possível carregar os personagens. Verifique sua conexão e clique em “Atualizar dados”.');
    return;
  }
  statusBox.hidden = successful === currentItems.length;
  if (!statusBox.hidden) showStatus('Alguns personagens não carregaram. Atualize os dados para tentar novamente.');
  pagination.hidden = totalPages <= 1;
  pageLabel.textContent = `Página ${page} de ${totalPages}`;
  previousButton.disabled = page === 1;
  nextButton.disabled = page === totalPages;
}

async function loadPokedex() {
  const currentRequest = ++requestVersion;
  cards.replaceChildren();
  pagination.hidden = true;
  showStatus('Carregando dados da PokéAPI...');
  countLabel.textContent = 'Preparando a Pokédex...';
  try {
    // O endpoint de listagem traz Kanto (1–151) e Johto (152–251).
    const data = await fetchJson(`${API_URL}/pokemon?limit=251&offset=0`);
    if (currentRequest !== requestVersion) return;
    pokemonList = data.results;
    await renderCards();
  } catch (error) {
    if (currentRequest !== requestVersion) return;
    console.error('Falha ao consultar a PokéAPI:', error);
    showStatus('Não foi possível acessar a PokéAPI. Verifique sua conexão e clique em “Atualizar dados”.');
    countLabel.textContent = 'Dados indisponíveis';
  }
}

regionButtons.forEach(button => button.addEventListener('click', () => {
  region = button.dataset.region;
  page = 1;
  regionButtons.forEach(tab => {
    const active = tab === button;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', String(active));
  });
  if (pokemonList.length) renderCards();
}));

searchInput.addEventListener('input', () => { page = 1; if (pokemonList.length) renderCards(); });
previousButton.addEventListener('click', () => { if (page > 1) { page -= 1; renderCards(); document.querySelector('#explorar').scrollIntoView(); } });
nextButton.addEventListener('click', () => { page += 1; renderCards(); document.querySelector('#explorar').scrollIntoView(); });
refreshButton.addEventListener('click', () => {
  try { Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX)).forEach(key => localStorage.removeItem(key)); }
  catch { /* Nova tentativa de rede funciona mesmo sem acesso ao armazenamento. */ }
  loadPokedex();
});

loadPokedex();
