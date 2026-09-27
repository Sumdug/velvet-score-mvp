const people = [
  { name:'Zendaya', meta:'ACTOR · USA', image:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85' },
  { name:'Margot Robbie', meta:'ACTOR · AUSTRALIA', image:'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1000&q=85' },
  { name:'Ana de Armas', meta:'ACTOR · CUBA', image:'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=85' },
  { name:'Rihanna', meta:'MUSICIAN · BARBADOS', image:'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=1000&q=85' },
  { name:'Sydney Sweeney', meta:'ACTOR · USA', image:'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85' },
  { name:'Dua Lipa', meta:'MUSICIAN · UK', image:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=85' }
];
const metrics = ['Face','Eyes','Body shape','Ass','Boobs','Sex appeal','Perceived personality'];
let current = 0;
let scores = Object.fromEntries(metrics.map(m => [m, 7]));
const $ = (s) => document.querySelector(s);

function renderMetrics(){
  $('#metrics').innerHTML = metrics.map((metric, i) => `<div class="metric"><label for="metric-${i}"><span>${metric}</span><span id="value-${i}">${scores[metric]}</span></label><input id="metric-${i}" data-metric="${metric}" type="range" min="1" max="10" value="${scores[metric]}" aria-label="${metric}: ${scores[metric]} out of 10"></div>`).join('');
  document.querySelectorAll('.metric input').forEach(input => input.addEventListener('input', e => {
    scores[e.target.dataset.metric] = Number(e.target.value);
    $(`#value-${e.target.id.split('-')[1]}`).textContent = e.target.value;
    e.target.setAttribute('aria-label', `${e.target.dataset.metric}: ${e.target.value} out of 10`);
    updatePreview();
  }));
  updatePreview();
}
function average(){ return metrics.reduce((sum, m) => sum + scores[m], 0) / metrics.length; }
function updatePreview(){ $('#scorePreview').textContent = average().toFixed(1); }
function renderPerson(){
  const person = people[current];
  const image = $('#portraitImage');
  image.style.opacity = 0;
  setTimeout(() => { image.style.backgroundImage = `url('${person.image}')`; image.style.opacity = 1; }, 140);
  $('#rateTitle').textContent = person.name;
  $('#celebrityMeta').textContent = person.meta;
  $('#progressText').textContent = `${String(current + 1).padStart(2,'0')} / ${String(people.length).padStart(2,'0')}`;
  scores = Object.fromEntries(metrics.map(m => [m, 7]));
  renderMetrics();
}
function getRatings(){ return JSON.parse(localStorage.getItem('velvet-score-ratings') || '[]'); }
function setRatings(ratings){ localStorage.setItem('velvet-score-ratings', JSON.stringify(ratings)); }
function saveCurrent(){
  const p = people[current];
  const ratings = getRatings().filter(r => r.name !== p.name);
  ratings.push({ ...p, score:Number(average().toFixed(1)), metrics:scores, updatedAt:new Date().toISOString() });
  setRatings(ratings); toast(`${p.name} added to your scoreboard`); current = (current + 1) % people.length; setTimeout(renderPerson, 320);
}
function renderBoard(){
  const ratings = getRatings().sort((a,b) => b.score - a.score);
  $('#ratedCount').textContent = ratings.length;
  $('#averageScore').textContent = ratings.length ? (ratings.reduce((sum,r) => sum + r.score,0) / ratings.length).toFixed(1) : '—';
  $('#emptyBoard').style.display = ratings.length ? 'none' : 'block';
  $('#leaderboard').innerHTML = ratings.map((r,i) => `<article class="leader-row"><span class="rank">${String(i+1).padStart(2,'0')}</span><div class="thumb" style="background-image:url('${r.image}')"></div><div><div class="leader-name">${r.name}</div><div class="leader-meta">UPDATED ${new Date(r.updatedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}).toUpperCase()}</div></div><strong class="leader-score">${r.score}</strong></article>`).join('');
}
function showView(name){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(`#${name}View`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active',n.dataset.go === name));
  if(name === 'board') renderBoard();
  window.scrollTo({top:0,behavior:'smooth'});
}
function toast(text){ const t=$('#toast'); t.textContent=text; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }

$('#saveRating').addEventListener('click',saveCurrent);
$('#nextPortrait').addEventListener('click',()=>{ current=(current+1)%people.length; renderPerson(); });
$('#infoButton').addEventListener('click',()=>showView('about'));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
$('#clearBoard').addEventListener('click',()=>{ if(confirm('Clear your private scoreboard from this device?')){ localStorage.removeItem('velvet-score-ratings'); renderBoard(); toast('Scoreboard cleared'); } });
renderPerson();
