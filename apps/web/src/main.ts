import './styles.css';
import { clear, h } from './dom';
import { parseHash } from './router';
import { NAV, resolve } from './routes';
import { Machine } from '../../../packages/engine/src';
import { APP_BOOT, NETWORK } from '../../../packages/curriculum/src';
import { icon } from './icons';
import { register, runDisposers } from './machine-dom';
import { state } from './state';
import { t } from '../../../packages/curriculum/src/i18n';
import { getProfile, ready, setProfile, storage } from './store';
import { labById } from './labs';
import { homePage } from './pages/home';
import { classPage, labsIndex } from './pages/classpage';
import { labPage } from './pages/lab';
import { ledgerPage } from './pages/ledger';
import { practicePage } from './pages/practice';
import { progressPage } from './pages/progress';
import { hudElement, initRewards } from './rewards-ui';
import { notesPage } from './pages/notes';
import { teacherPage } from './pages/teacher';
import { tutorPage } from './pages/tutor';
import { cardPage, cardsIndex } from './pages/cards';
import { trainerPage } from './pages/trainer';
import { crisisPage } from './pages/crisis';
import { casPage } from './pages/cas';
import { projectPage } from './pages/project';
import { rescuePage } from './pages/rescue';
import { assignmentPage } from './pages/assignment';
import { CARDS } from '../../../packages/curriculum/src';

const main = h('main', { id: 'main', tabindex: -1 });
const nav = h('nav', { id: 'nav', 'aria-label': 'Main' });
const net = h('span', { class: 'net', role: 'status' });
const langBtn = h('button', { type: 'button', class: 'lang', 'data-lang-toggle': '', onclick: () => { void setLang(state.lang === 'hi' ? 'en' : 'hi'); } });
function drawLang() {
  langBtn.textContent = t(state.lang, 'lang.toggle');
  langBtn.setAttribute('lang', state.lang === 'hi' ? 'en' : 'hi');
  langBtn.setAttribute('aria-label', t(state.lang, 'lang.toggle.aria'));
  root.setAttribute('data-lang', state.lang);
}
async function setLang(l: 'en' | 'hi') { state.lang = l; state.profile = { ...state.profile, lang: l }; drawLang(); render(); await setProfile(state.profile); }

function drawNav(active: string | null) {
  clear(nav);
  for (const n of NAV) nav.appendChild(h('a', { href: n.hash, ...(n.key === active ? { 'aria-current': 'page' } : {}) }, n.key));
}

// --- Display menu: projector mode (high contrast, larger type) lives here, out of the way of the main header ---
function initDisplayMenu(): HTMLElement {
  const saved = (() => { try { return localStorage.getItem('au-projector') === '1'; } catch { return false; } })();
  const panelId = 'display-panel';
  const toggle = h('button', { type: 'button', class: 'projector-toggle', role: 'switch', 'aria-checked': String(saved) }, h('span', { class: 'switch-track', 'aria-hidden': 'true' }, h('span', { class: 'switch-knob' })), h('span', {}, h('b', {}, 'Projector mode'), h('small', {}, 'High contrast and larger text for a classroom screen')));
  const panel = h('div', { id: panelId, class: 'display-panel', role: 'group', 'aria-label': 'Display settings', hidden: true }, toggle);
  const btn = h('button', { type: 'button', class: 'display-btn', 'aria-expanded': 'false', 'aria-controls': panelId, 'aria-label': 'Display settings' }, icon('display', 16), h('span', {}, 'Display'));
  const wrap = h('div', { class: 'display-menu' }, btn, panel);
  const apply = (on: boolean) => {
    document.documentElement.classList.toggle('projector', on);
    toggle.setAttribute('aria-checked', String(on));
    try { localStorage.setItem('au-projector', on ? '1' : '0'); } catch { /* storage may be blocked */ }
  };
  const isOpen = () => !panel.hasAttribute('hidden');
  const setOpen = (open: boolean) => { panel.toggleAttribute('hidden', !open); btn.setAttribute('aria-expanded', String(open)); };
  if (saved) document.documentElement.classList.add('projector');
  toggle.onclick = () => apply(!document.documentElement.classList.contains('projector'));
  btn.onclick = () => setOpen(!isOpen());
  document.addEventListener('click', e => { if (isOpen() && !wrap.contains(e.target as Node)) setOpen(false); });
  wrap.addEventListener('keydown', e => { if ((e as KeyboardEvent).key === 'Escape' && isOpen()) { setOpen(false); btn.focus(); } });
  return wrap;
}
const boot_ = new Machine(APP_BOOT), network = new Machine(NETWORK);
register(boot_); register(network);
const root = document.documentElement;
root.setAttribute('data-app', boot_.state.toLowerCase()); root.setAttribute('data-net', network.state.toLowerCase());
boot_.subscribe(m => root.setAttribute('data-app', m.state.toLowerCase())); network.subscribe(m => root.setAttribute('data-net', m.state.toLowerCase()));
const banner = h('div', { class: 'banner', role: 'alert', hidden: true });
function drawBanner() {
  const memory = storage.is('MEMORY'), degraded = storage.is('DEGRADED');
  banner.hidden = !(memory || degraded);
  if (banner.hidden) return;
  banner.replaceChildren(h('b', {}, memory ? 'Progress cannot be saved on this device right now. ' : 'Saving to this device just failed. '),
    memory ? 'Your browser is blocking storage (private mode?). Everything still works, but your progress will be lost when you close this tab. ' : 'Recent progress is only held in memory. ', h('a', { href: '#/progress' }, 'Export a copy on My Progress'), '.');
}
function drawNet() {
  const online = navigator.onLine; network.send(online ? 'WENT_ONLINE' : 'WENT_OFFLINE');
  net.textContent = online ? 'Online' : 'Offline — everything still works'; net.className = 'net ' + (online ? 'on' : 'off');
}

function render() {
  runDisposers();                                         // stop timers / ignore late results of the page we are leaving
  const { path } = parseHash(), r = resolve(path);
  drawNav(r.nav);
  clear(main); main.setAttribute('data-route', r.id);
  let page: HTMLElement;
  try {
    const [a, b, c] = r.rest;
    switch (r.id) {
      case 'home': page = homePage(render); break;
      case 'class': page = classPage(a === 'XII' ? 'XII' : 'XI'); break;
      case 'labs': page = labsIndex(); break;
      case 'lab': { const lab = a ? labById(a) : undefined; page = lab ? labPage(lab, 'learn', b) : notFound(); break; }
      case 'ledger': page = ledgerPage(); break;
      case 'practice': page = practicePage(a, b, c); break;
      case 'cards': { const card = a ? CARDS.find(x => x.id === a) : undefined; page = card ? cardPage(card) : cardsIndex(); break; }
      case 'trainer': page = trainerPage(); break;
      case 'crisis': page = crisisPage(a); break;
      case 'cas': page = casPage(); break;
      case 'project': page = projectPage(a === 'XII' ? 'XII' : 'XI', state.profile.route); break;
      case 'rescue': page = rescuePage(a); break;
      case 'assignment': page = assignmentPage(a!); break;
      case 'tutor': page = tutorPage(); break;
      case 'progress': page = progressPage(); break;
      case 'teacher': page = teacherPage(); break;
      case 'notes': page = notesPage(a); break;
      default: page = notFound();
    }
  } catch (e) {
    page = h('div', { class: 'panel' }, h('h2', {}, 'Something went wrong'), h('p', { class: 'note bad', role: 'alert' }, e instanceof Error ? e.message : String(e)), h('a', { href: '#/' }, 'Go home'));
    console.error(e);
  }
  main.appendChild(page);
  document.title = (path.length ? (document.querySelector('main h2')?.textContent ?? 'Accounting Universe') + ' · ' : '') + 'Accounting Universe';
  window.scrollTo(0, 0);
}
const notFound = () => h('div', { class: 'panel' }, h('h2', {}, 'Page not found'), h('p', {}, 'That address does not exist. '), h('a', { href: '#/' }, 'Go home'));

async function boot() {
  const app = document.getElementById('app')!;
  const menu = h('button', { type: 'button', class: 'menu', 'aria-expanded': 'false', 'aria-controls': 'nav', onclick: () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); } }, '☰ Menu');
  const displayMenu = initDisplayMenu();
  app.append(
    h('a', { class: 'skip', href: '#main', onclick: (e: Event) => { e.preventDefault(); main.focus(); } }, 'Skip to content'),
    h('header', { class: 'top' }, h('div', { class: 'brand' }, h('b', {}, 'Accounting Universe'), h('span', {}, 'Learn Accounting by Doing Accounting.')), net, hudElement(), displayMenu, langBtn, menu),
    banner, nav, main);
  await ready();
  drawBanner(); storage.subscribe(drawBanner);
  const p = await getProfile();
  if (p) { state.profile = p; state.lang = p.lang ?? 'en'; } else await setProfile(state.profile);
  drawLang();
  window.addEventListener('hashchange', () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); render(); });
  window.addEventListener('online', drawNet); window.addEventListener('offline', drawNet);
  drawNet(); render(); initRewards();
  boot_.send('BOOTED');
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => { /* offline support is optional */ });
}
boot().catch(e => { boot_.send('CRASHED'); main.replaceChildren(h('div', { class: 'panel', role: 'alert' }, h('h2', {}, 'The app could not start'), h('p', {}, e instanceof Error ? e.message : String(e)), h('button', { type: 'button', class: 'primary', onclick: () => location.reload() }, 'Reload'))); });
