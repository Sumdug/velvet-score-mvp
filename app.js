const people=[
  {name:'Zendaya',meta:'ACTOR · USA',query:'Zendaya'},
  {name:'Margot Robbie',meta:'ACTOR · AUSTRALIA',query:'Margot Robbie'},
  {name:'Ana de Armas',meta:'ACTOR · CUBA',query:'Ana de Armas'},
  {name:'Rihanna',meta:'MUSICIAN · BARBADOS',query:'Rihanna'},
  {name:'Sydney Sweeney',meta:'ACTOR · USA',query:'Sydney Sweeney'},
  {name:'Dua Lipa',meta:'MUSICIAN · UK',query:'Dua Lipa'}
];
const metrics=['Face','Eyes','Body shape','Ass','Boobs','Sex appeal','Perceived personality'];
let personIndex=0, metricIndex=0, scores=Object.fromEntries(metrics.map(m=>[m,7]));
let imageCache={};
const $=s=>document.querySelector(s);
const ordinal=n=>String(n+1).padStart(2,'0');
function average(){return metrics.reduce((sum,m)=>sum+scores[m],0)/metrics.length}
function fallback(){return 'linear-gradient(140deg,#56544d,#171714 49%,#77746d 50%,#292824)'}
function renderMetric(){
  const metric=metrics[metricIndex];
  $('#stepCount').textContent=`${ordinal(metricIndex)} / ${String(metrics.length).padStart(2,'0')}`;
  $('#metricLabel').textContent=metric.toUpperCase();
  $('#metricTitle').textContent=metric.toUpperCase();
  $('#instruction').textContent=`How would you rate her ${metric.toLowerCase()}?`;
  $('#markValue').textContent=scores[metric];
  $('#progressBar').style.width=`${((metricIndex+1)/metrics.length)*100}%`;
  $('#continueText').textContent=metricIndex===metrics.length-1?'REVIEW YOUR SCORE':`NEXT: ${metrics[metricIndex+1].toUpperCase()}`;
}
async function getImage(query){
  if(imageCache[query])return imageCache[query];
  try{const r=await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json&origin=*`);const d=await r.json();const src=Object.values(d.query?.pages||{}).map(p=>p.imageinfo?.[0]?.thumburl||p.imageinfo?.[0]?.url).find(Boolean);if(src){imageCache[query]=src;return src}}catch(e){console.warn(e)}return '';
}
async function renderPerson(){
  const person=people[personIndex], image=$('#portraitImage');
  image.style.opacity=0;
  $('#celebrityName').textContent=person.name;$('#celebrityMeta').textContent=person.meta;
  renderMetric();
  const src=await getImage(person.query);if(people[personIndex]!==person)return;
  person.image=src;image.style.backgroundImage=src?`url("${src}")`:fallback();image.style.opacity=1;
}
function changeScore(delta){const key=metrics[metricIndex];scores[key]=Math.max(1,Math.min(10,scores[key]+delta));renderMetric()}
function getRatings(){return JSON.parse(localStorage.getItem('velvet-score-ratings')||'[]')}
function setRatings(items){localStorage.setItem('velvet-score-ratings',JSON.stringify(items))}
function renderReview(){
 const person=people[personIndex];$('#reviewName').textContent=person.name;$('#reviewOverall').textContent=average().toFixed(1);
 $('#reviewList').innerHTML=metrics.map((m,i)=>`<div class="review-row"><button data-edit="${i}"><span>${ordinal(i)}</span>${m}</button><strong>${scores[m]}</strong></div>`).join('');
 document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{metricIndex=Number(b.dataset.edit);showView('rate');renderMetric()}));
}
function fileScore(){const p=people[personIndex];const list=getRatings().filter(x=>x.name!==p.name);list.push({name:p.name,meta:p.meta,image:p.image||'',score:Number(average().toFixed(1)),metrics:{...scores},updatedAt:new Date().toISOString()});setRatings(list);toast('SCORE FILED');personIndex=(personIndex+1)%people.length;metricIndex=0;scores=Object.fromEntries(metrics.map(m=>[m,7]));showView('rate');renderPerson()}
function renderBoard(){const list=getRatings().sort((a,b)=>b.score-a.score);$('#ratedCount').textContent=list.length;$('#averageScore').textContent=list.length?(list.reduce((s,r)=>s+r.score,0)/list.length).toFixed(1):'—';$('#emptyBoard').style.display=list.length?'none':'block';$('#leaderboard').innerHTML=list.map((r,i)=>`<article class="leader-row"><span class="rank">${ordinal(i)}</span><div class="thumb" style="${r.image?`background-image:url('${r.image}')`:'background:linear-gradient(140deg,#56544d,#171714)'}"></div><div><div class="leader-name">${r.name}</div><div class="leader-meta">FILED ${new Date(r.updatedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}).toUpperCase()}</div></div><strong class="leader-score">${r.score}</strong></article>`).join('')}
function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(`#${name}View`).classList.add('active');if(name==='board')renderBoard();if(name==='review')renderReview();window.scrollTo({top:0,behavior:'instant'})}
function toast(text){const t=$('#toast');t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1900)}
$('#decrease').addEventListener('click',()=>changeScore(-1));$('#increase').addEventListener('click',()=>changeScore(1));
$('#continueButton').addEventListener('click',()=>{if(metricIndex===metrics.length-1)showView('review');else{metricIndex++;renderMetric()}});
$('#skipSubject').addEventListener('click',()=>{personIndex=(personIndex+1)%people.length;metricIndex=0;scores=Object.fromEntries(metrics.map(m=>[m,7]));renderPerson()});
$('#fileScore').addEventListener('click',fileScore);$('#infoButton').addEventListener('click',()=>showView('about'));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
$('#clearBoard').addEventListener('click',()=>{if(confirm('Clear your private index from this device?')){localStorage.removeItem('velvet-score-ratings');renderBoard();toast('INDEX CLEARED')}});
renderPerson();
