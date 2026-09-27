const people = [
  { name:'Zendaya', meta:'ACTOR · USA', query:'Zendaya' },
  { name:'Margot Robbie', meta:'ACTOR · AUSTRALIA', query:'Margot Robbie' },
  { name:'Ana de Armas', meta:'ACTOR · CUBA', query:'Ana de Armas' },
  { name:'Rihanna', meta:'MUSICIAN · BARBADOS', query:'Rihanna' },
  { name:'Sydney Sweeney', meta:'ACTOR · USA', query:'Sydney Sweeney' },
  { name:'Dua Lipa', meta:'MUSICIAN · UK', query:'Dua Lipa' }
];
const metrics = ['Face','Eyes','Body shape','Ass','Boobs','Sex appeal','Perceived personality'];
let current = 0;
let scores = Object.fromEntries(metrics.map(m => [m, 7]));
let imageCache = {};
const $ = (s) => document.querySelector(s);

function renderMetrics(){
  $('#metrics').innerHTML = metrics.map((metric, i) => `<div class="metric"><div class="metric-name"><span>${String(i+1).padStart(2,'0')}</span>${metric}</div><div class="score-options" role="group" aria-label="Rate ${metric} from 1 to 10">${Array.from({length:10},(_,x)=>x+1).map(n=>`<button class="score-option ${scores[metric]===n?'selected':''}" data-metric="${metric}" data-score="${n}" aria-label="${metric}: ${n} out of 10" aria-pressed="${scores[metric]===n}">${n}</button>`).join('')}</div></div>`).join('');
  document.querySelectorAll('.score-option').forEach(button => button.addEventListener('click', e => {
    scores[e.currentTarget.dataset.metric] = Number(e.currentTarget.dataset.score);
    renderMetrics(); updatePreview();
  }));
  updatePreview();
}
function average(){ return metrics.reduce((sum, m) => sum + scores[m], 0) / metrics.length; }
function updatePreview(){ $('#scorePreview').textContent = average().toFixed(1); }
function fallbackImage(){ return 'linear-gradient(135deg,#bdb9af 0%,#ece9df 45%,#9d998e 45%,#d9d5ca 100%)'; }
async function getCommonsImage(query){
  if(imageCache[query]) return imageCache[query];
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json&origin=*`;
  try{
    const response = await fetch(url);
    const data = await response.json();
    const pages = Object.values(data.query?.pages || {});
    const image = pages.map(p => p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url).find(Boolean);
    if(image){ imageCache[query] = image; return image; }
  } catch(error){ console.warn('Commons image unavailable', error); }
  return null;
}
async function renderPerson(){
  const person = people[current];
  const image = $('#portraitImage');
  image.style.opacity = 0;
  $('#rateTitle').textContent = person.name;
  $('#celebrityMeta').textContent = person.meta;
  $('#progressText').textContent = `${String(current + 1).padStart(2,'0')}/${String(people.length).padStart(2,'0')}`;
  scores = Object.fromEntries(metrics.map(m => [m, 7]));
  renderMetrics();
  const src = await getCommonsImage(person.query);
  if (people[current] !== person) return;
  image.style.backgroundImage = src ? `url("${src}")` : fallbackImage();
  $('#imageSource').textContent = src ? 'WIKIMEDIA COMMONS IMAGE' : 'IMAGE UNAVAILABLE';
  image.style.opacity = 1;
  person.image = src || '';
}
function getRatings(){ return JSON.parse(localStorage.getItem('velvet-score-ratings') || '[]'); }
function setRatings(ratings){ localStorage.setItem('velvet-score-ratings', JSON.stringify(ratings)); }
function saveCurrent(){
  const p = people[current];
  const ratings = getRatings().filter(r => r.name !== p.name);
  ratings.push({ name:p.name, meta:p.meta, image:p.image || '', score:Number(average().toFixed(1)), metrics:scores, updatedAt:new Date().toISOString() });
  setRatings(ratings); toast(`${p.name.toUpperCase()} FILED`); current = (current + 1) % people.length; setTimeout(renderPerson, 200);
}
function renderBoard(){
  const ratings = getRatings().sort((a,b) => b.score - a.score);
  $('#ratedCount').textContent = ratings.length;
  $('#averageScore').textContent = ratings.length ? (ratings.reduce((sum,r) => sum + r.score,0) / ratings.length).toFixed(1) : '—';
  $('#emptyBoard').style.display = ratings.length ? 'none' : 'block';
  $('#leaderboard').innerHTML = ratings.map((r,i) => `<article class="leader-row"><span class="rank">${String(i+1).padStart(2,'0')}</span><div class="thumb" style="${r.image ? `background-image:url('${r.image}')` : 'background:linear-gradient(135deg,#bdb9af,#e7e4dd)'}"></div><div><div class="leader-name">${r.name}</div><div class="leader-meta">FILED ${new Date(r.updatedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}).toUpperCase()}</div></div><strong class="leader-score">${r.score}</strong></article>`).join('');
}
function showView(name){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(`#${name}View`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active',n.dataset.go === name));
  if(name === 'board') renderBoard();
  window.scrollTo({top:0,behavior:'smooth'});
}
function toast(text){ const t=$('#toast'); t.textContent=text; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }

$('#saveRating').addEventListener('click',saveCurrent);
$('#nextPortrait').addEventListener('click',()=>{ current=(current+1)%people.length; renderPerson(); });
$('#infoButton').addEventListener('click',()=>showView('about'));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
$('#clearBoard').addEventListener('click',()=>{ if(confirm('Clear your private index from this device?')){ localStorage.removeItem('velvet-score-ratings'); renderBoard(); toast('PRIVATE INDEX CLEARED'); } });
renderPerson();
