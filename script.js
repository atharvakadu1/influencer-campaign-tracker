// ---------- Initial sample data (converted from your SQL inserts) ----------
const SAMPLE = {
  brands: [
    {brand_id:1, brand_name:'TechNova Solutions', website:'http://www.technovasolutions.com', industry:'Technology', contact_person:'Jane Doe', contact_email:'jane.doe@technovasolutions.com', created_at:'2025-01-01'},
    {brand_id:2, brand_name:'Green Living Co.', website:'http://www.greenlivingco.com', industry:'Lifestyle', contact_person:'John Smith', contact_email:'john.smith@greenlivingco.com', created_at:'2025-03-02'},
    {brand_id:3, brand_name:'Gourmet Eats Inc.', website:'http://www.gourmeteats.com', industry:'Food & Beverage', contact_person:'Emily White', contact_email:'emily.white@gourmeteats.com', created_at:'2025-06-05'}
  ],
  influencers: [
    {influencer_id:1, first_name:'Alex', last_name:'Chen', email:'alex.chen@example.com', phone:'555-1234', niche:'Technology', social_platform:'YouTube', follower_count:500000, created_at:'2025-01-02'},
    {influencer_id:2, first_name:'Maria', last_name:'Garcia', email:'maria.garcia@example.com', phone:'555-5678', niche:'Lifestyle', social_platform:'Instagram', follower_count:120000, created_at:'2025-02-05'},
    {influencer_id:3, first_name:'Tom', last_name:'Wilson', email:'tom.wilson@example.com', phone:'555-8765', niche:'Food', social_platform:'TikTok', follower_count:75000, created_at:'2025-03-12'}
  ],
  campaigns: [
    {campaign_id:1, brand_id:1, budget:15000.00, status:'Active', start_date:'2025-10-01', end_date:'2025-11-30', objective:'Promote new software product to tech enthusiasts.', created_at:'2025-09-01'},
    {campaign_id:2, brand_id:2, budget:5000.00, status:'Planning', start_date:'2025-11-15', end_date:'2025-12-31', objective:'Increase brand awareness for eco-friendly products.', created_at:'2025-10-01'},
    {campaign_id:3, brand_id:3, budget:8000.00, status:'Completed', start_date:'2025-09-01', end_date:'2025-09-30', objective:'Drive sales for a new line of gourmet snacks.', created_at:'2025-08-01'}
  ],
  collaborations: [
    {collab_id:1, influencer_id:1, campaign_id:1, agreed_amount:1200.00, approval_status:'Approved', dead_line:'2025-10-25', deliverables:'One dedicated YouTube video and three Instagram stories.', created_at:'2025-09-10'},
    {collab_id:2, influencer_id:2, campaign_id:2, agreed_amount:400.00, approval_status:'Pending', dead_line:'2025-11-20', deliverables:'Five high-quality Instagram posts with product placement.', created_at:'2025-10-15'},
 {collab_id:3, influencer_id:3, campaign_id:3, agreed_amount:750.00, approval_status:'Approved', dead_line:'2025-09-15', deliverables:'Two TikTok videos showcasing the new snacks.', created_at:'2025-08-20'}
  ],
  payments: [
    {payment_id:1, collab_id:1, payment_date:'2025-10-25', amount_paid:1200.00, status:'Completed', mode:'Bank Transfer', created_at:'2025-10-25'},
    {payment_id:2, collab_id:3, payment_date:'2025-09-15', amount_paid:750.00, status:'Completed', mode:'PayPal', created_at:'2025-09-15'}
  ],
  posts: [
    {post_id:1, influencer_id:1, collab_id:1, post_date:'2025-10-20', post_type:'YouTube Video', likes:25000, shares:500, comments:1200, reach:150000, engagement_rate:0.08, created_at:'2025-10-20'},
    {post_id:2, influencer_id:3, collab_id:3, post_date:'2025-09-10', post_type:'TikTok Video', likes:8000, shares:200, comments:300, reach:50000, engagement_rate:0.06, created_at:'2025-09-10'}
  ]
};

// Use localStorage as a mock DB; initialize if empty
function initData(){
  if(!localStorage.getItem('influencer_data')){
    localStorage.setItem('influencer_data', JSON.stringify(SAMPLE));
  }
}

function readData(){ return JSON.parse(localStorage.getItem('influencer_data')); }
function writeData(d){ localStorage.setItem('influencer_data', JSON.stringify(d)); }

initData();

// ---------- Utilities ----------
function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function formatCurrency(v){ return '$' + Number(v).toLocaleString(); }
function fullName(inf){ return (inf.first_name||'') + ' ' + (inf.last_name||''); }

// ---------- Navigation & view switching ----------
const views = qsa('.view');
function showView(name){ views.forEach(v=>v.classList.add('d-none')); const el = qs('#view-'+name); if(el) el.classList.remove('d-none'); qsa('#mainNav .nav-link').forEach(a=>a.classList.remove('active')); qs(`#mainNav .nav-link[data-view="${name}"]`)?.classList.add('active'); renderAll(); }
qsa('#mainNav .nav-link').forEach(a=>a.addEventListener('click', e=>{ e.preventDefault(); showView(a.dataset.view); }));

// Sidebar toggle for mobile
qs('#toggleSidebar').addEventListener('click', ()=>{
  const sb = qs('#sidebar'); sb.classList.toggle('d-none');
});

// Global search - *Simplified behavior: just re-renders the current view*
qs('#globalSearch').addEventListener('input', ()=>{ 
    const q = qs('#globalSearch').value.trim().toLowerCase(); 
    if(!q) return renderAll(); 
    const currentView = qsa('#mainNav .nav-link.active')[0].dataset.view; 
    // Note: Advanced search/filter logic would go here
    renderAll(); // simple re-render
});

// Reset data
qs('#resetDataBtn').addEventListener('click', ()=>{ if(confirm('Reset all sample data? This will overwrite local changes.')){ localStorage.removeItem('influencer_data'); initData(); renderAll(); alert('Data reset to sample dataset.'); }});

// ---------- Renderers Master Function ----------
function renderAll(opts={}){
  const data = readData();
  renderKPIs(data);
  renderDeadlineList(data);
  renderCampaignChart(data);
  renderRecentPosts(data);
  renderTopInfluencers(data);
  renderRecentPayments(data);
  // Render tables for all views
  renderBrandsTable(data);
  renderInfluencersTable(data);
  renderCampaignsTable(data);
  renderCollabsTable(data);
  renderPaymentsTable(data);
  renderPostsTable(data);
}

// ---------- Individual Renderers ----------
function renderKPIs(data){
  qs('#kpiBrands').innerText = data.brands.length;
  qs('#kpiActiveCampaigns').innerText = data.campaigns.filter(c=>c.status==='Active').length;
  const totalSpend = data.collaborations.reduce((s,c)=>s + Number(c.agreed_amount || 0), 0);
  qs('#kpiTotalSpend').innerText = formatCurrency(totalSpend);
  const top = data.influencers.sort((a,b)=>b.follower_count - a.follower_count)[0];
  qs('#kpiTopInfluencer').innerText = top ? fullName(top) : '—';
}

function renderDeadlineList(data){
  const now = new Date();
  const upcoming = data.collaborations.filter(c=> new Date(c.dead_line) >= now).sort((a,b)=> new Date(a.dead_line) - new Date(b.dead_line)).slice(0,5);
  const container = qs('#deadlineList'); container.innerHTML='';
  if(upcoming.length===0){ container.innerHTML = '<div class="small-muted">No upcoming deadlines</div>'; qs('#upcomingDeadlines').innerText='No deadlines'; return; }
  qs('#upcomingDeadlines').innerText = upcoming.length + ' upcoming';
  upcoming.forEach(c=>{
    const inf = data.influencers.find(i=>i.influencer_id===c.influencer_id) || {first_name:'Unknown'};
    const camp = data.campaigns.find(x=>x.campaign_id===c.campaign_id) || {campaign_id:'?', objective: ''};
    const el = document.createElement('div'); el.className='mb-2 small-muted';
    el.innerHTML = `<strong>${fullName(inf)}</strong> — ${camp.campaign_id ? camp.objective.slice(0,40) + '...' : ''} <div class='small-muted'>Due ${c.dead_line}</div>`;
    container.appendChild(el);
  });
}

let campaignChartInstance = null;
function renderCampaignChart(data){
  const ctx = qs('#campaignChart');
  const labels = data.campaigns.map(c=> 'C#'+c.campaign_id);
  const budgets = data.campaigns.map(c=> c.budget);
  if(campaignChartInstance) campaignChartInstance.destroy();
  campaignChartInstance = new Chart(ctx, {type:'bar', data:{labels, datasets:[{label:'Budget', data:budgets, backgroundColor: 'rgba(107,79,58,0.3)'}]}, options:{ plugins:{legend:{display:false}}}});
}

function renderRecentPosts(data){
  const container = qs('#recentPosts'); container.innerHTML='';
  data.posts.slice().sort((a,b)=> new Date(b.post_date)-new Date(a.post_date)).slice(0,5).forEach(p=>{
    const inf = data.influencers.find(i=>i.influencer_id===p.influencer_id) || {};
    const el = document.createElement('div'); el.className='d-flex gap-2 align-items-start mb-2';
    el.innerHTML = `<div style="width:56px;height:56px;border-radius:10px;background:linear-gradient(135deg,#fff,#efe1d6);display:grid;place-items:center"><i class="fa fa-play"></i></div>
      <div class="flex-grow-1">
        <div style="font-weight:700">${p.post_type} • ${fullName(inf)}</div>
        <div class="small-muted">${p.likes.toLocaleString()} likes • Reach ${p.reach.toLocaleString()}</div>
      </div>`;
    container.appendChild(el);
  });
}

function renderTopInfluencers(data){
  const cont = qs('#topInfluencers'); cont.innerHTML='';
  data.influencers.slice().sort((a,b)=>b.follower_count - a.follower_count).slice(0,5).forEach(i=>{
    const el = document.createElement('div'); el.className='d-flex justify-content-between align-items-center mb-2';
    el.innerHTML = `<div><strong>${fullName(i)}</strong><div class='small-muted'>${i.niche} • ${i.social_platform}</div></div><div class='text-end'><div style='font-weight:700'>${Number(i.follower_count).toLocaleString()}</div></div>`;
    cont.appendChild(el);
  });
}

function renderRecentPayments(data){
  const cont = qs('#recentPayments'); cont.innerHTML='';
  data.payments.slice().sort((a,b)=> new Date(b.payment_date)-new Date(a.payment_date)).slice(0,5).forEach(p=>{
    const collab = data.collaborations.find(c=>c.collab_id===p.collab_id) || {};
    const inf = data.influencers.find(i=>i.influencer_id===collab.influencer_id) || {};
    const el = document.createElement('div'); el.className='mb-2'; 
    el.innerHTML = `<div style='font-weight:700'>${fullName(inf)}</div><div class='small-muted'>${p.payment_date} • ${formatCurrency(p.amount_paid)} • ${p.mode}</div>`;
    cont.appendChild(el);
  });
}

function renderBrandsTable(data){
  const tbody = qs('#brandsTable tbody'); tbody.innerHTML='';
  data.brands.forEach(b=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${b.brand_id}</td><td>${b.brand_name}</td><td>${b.industry}</td><td>${b.contact_person}<br><a href='mailto:${b.contact_email}'>${b.contact_email}</a></td><td><a href='${b.website}' target='_blank'>Website</a></td><td>${b.created_at}</td><td><button class='btn btn-sm btn-outline-primary btn-edit-brand' data-id='${b.brand_id}'>Edit</button></td>`;
    tbody.appendChild(tr);
  });
  qsa('.btn-edit-brand').forEach(btn=> btn.addEventListener('click', e=> openBrandForm(btn.dataset.id)) );
}

function renderInfluencersTable(data){
  const tbody = qs('#influencersTable tbody'); tbody.innerHTML='';
  data.influencers.forEach(i=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i.influencer_id}</td><td>${fullName(i)}<div class='small-muted'>${i.email}</div></td><td>${i.social_platform}</td><td>${Number(i.follower_count).toLocaleString()}</td><td>${i.niche}</td><td>${i.phone}</td><td><button class='btn btn-sm btn-outline-primary btn-edit-influencer' data-id='${i.influencer_id}'>Edit</button></td>`;
    tbody.appendChild(tr);
  });
  qsa('.btn-edit-influencer').forEach(btn=> btn.addEventListener('click', e=> openInfluencerForm(btn.dataset.id)) );
}

function renderCampaignsTable(data){
  const tbody = qs('#campaignsTable tbody'); tbody.innerHTML='';
  data.campaigns.forEach(c=>{
    const brand = data.brands.find(b=>b.brand_id===c.brand_id) || {brand_name:'Unknown'};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.campaign_id}</td><td>${brand.brand_name}</td><td>${formatCurrency(c.budget)}</td><td><span class='badge badge-status-${c.status}'>${c.status}</span></td><td>${c.start_date} → ${c.end_date}</td><td>${c.objective.slice(0,50)}...</td><td><button class='btn btn-sm btn-outline-primary btn-edit-campaign' data-id='${c.campaign_id}'>Edit</button></td>`;
    tbody.appendChild(tr);
  });
  qsa('.btn-edit-campaign').forEach(btn=> btn.addEventListener('click', e=> openCampaignForm(btn.dataset.id)) );
}

function renderCollabsTable(data){
  const tbody = qs('#collabsTable tbody'); tbody.innerHTML='';
  data.collaborations.forEach(c=>{
    const inf = data.influencers.find(i=>i.influencer_id===c.influencer_id) || {first_name:'Unknown'};
    const camp = data.campaigns.find(x=>x.campaign_id===c.campaign_id) || {campaign_id:'?'};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.collab_id}</td><td>${fullName(inf)}</td><td>Campaign #${camp.campaign_id}</td><td>${formatCurrency(c.agreed_amount)}</td><td>${c.approval_status}</td><td>${c.dead_line}</td><td><button class='btn btn-sm btn-outline-primary btn-edit-collab' data-id='${c.collab_id}'>Edit</button></td>`;
    tbody.appendChild(tr);
  });
  qsa('.btn-edit-collab').forEach(btn=> btn.addEventListener('click', e=> openCollabForm(btn.dataset.id)) );
}

function renderPaymentsTable(data){
  const tbody = qs('#paymentsTable tbody'); tbody.innerHTML='';
  data.payments.forEach(p=>{
    const collab = data.collaborations.find(c=>c.collab_id===p.collab_id) || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.payment_id}</td><td>${collab.collab_id||'—'}</td><td>${p.payment_date}</td><td>${formatCurrency(p.amount_paid)}</td><td>${p.status}</td><td>${p.mode}</td><td><button class='btn btn-sm btn-outline-primary btn-edit-payment' data-id='${p.payment_id}'>Edit</button></td>`;
    tbody.appendChild(tr);
  });
  qsa('.btn-edit-payment').forEach(btn=> btn.addEventListener('click', e=> openPaymentForm(btn.dataset.id)) );
}

function renderPostsTable(data){
  const tbody = qs('#postsTable tbody'); tbody.innerHTML='';
  data.posts.forEach(p=>{
    const inf = data.influencers.find(i=>i.influencer_id===p.influencer_id) || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.post_id}</td><td>${fullName(inf)}</td><td>${p.collab_id}</td><td>${p.post_date}</td><td>${p.post_type}</td><td>${p.likes.toLocaleString()}</td><td>${p.reach.toLocaleString()}</td><td>${(p.engagement_rate*100).toFixed(2)}%</td><td><button class='btn btn-sm btn-outline-primary btn-edit-post' data-id='${p.post_id}'>Edit</button></td>`;
    tbody.appendChild(tr);
  });
  qsa('.btn-edit-post').forEach(btn=> btn.addEventListener('click', e=> openPostForm(btn.dataset.id)) );
}

// ---------- Forms & CRUD (modal driven) ----------
const entityModal = new bootstrap.Modal(document.getElementById('entityModal'));
let activeEditId = null;

// Brand
qs('#addBrandBtn')?.addEventListener('click', ()=> openBrandForm());
qs('#openBrandForm')?.addEventListener('click', ()=> openBrandForm());
function openBrandForm(id=null){
  const data = readData(); activeEditId = id;
  qs('#modalTitle').innerText = id ? 'Edit Brand' : 'New Brand';
  const b = id ? data.brands.find(x=>x.brand_id==id) : {brand_name:'', website:'', industry:'', contact_person:'', contact_email:''};
  // **FIX #1:** Changed single quotes for attribute values to double quotes inside the template literal.
  qs('#modalBody').innerHTML = `
    <form id='brandForm'>
      <div class='mb-2 row'>
        <div class='col-md-6'><label class='form-label'>Name</label><input required class='form-control' name='brand_name' value="${b.brand_name||''}"></div>
        <div class='col-md-6'><label class='form-label'>Industry</label><input class='form-control' name='industry' value="${b.industry||''}"></div>
      </div>
      <div class='mb-2 row'>
        <div class='col-md-6'><label class='form-label'>Contact Person</label><input class='form-control' name='contact_person' value="${b.contact_person||''}"></div>
        <div class='col-md-6'><label class='form-label'>Contact Email</label><input class='form-control' name='contact_email' value="${b.contact_email||''}"></div>
      </div>
      <div class='mb-2'><label class='form-label'>Website</label><input class='form-control' name='website' value="${b.website||''}"></div>
    </form>
  `;
  qs('#modalSaveBtn').onclick = ()=> saveBrand();
  entityModal.show();
}
function saveBrand(){
  const form = qs('#brandForm'); const fd = new FormData(form); const payload = Object.fromEntries(fd.entries()); const data = readData();
  if(activeEditId){
    const idx = data.brands.findIndex(b=>b.brand_id==activeEditId); data.brands[idx] = {...data.brands[idx], ...payload};
  }else{
    const newId = Math.max(0,...data.brands.map(b=>b.brand_id))+1;
    data.brands.push({...payload, brand_id:newId, created_at: new Date().toISOString().slice(0,10)});
  }
  writeData(data); entityModal.hide(); renderAll();
}

// Influencer
qs('#addInfluencerBtn')?.addEventListener('click', ()=> openInfluencerForm());
qs('#openInfluencerForm')?.addEventListener('click', ()=> openInfluencerForm());
function openInfluencerForm(id=null){ const data = readData(); activeEditId = id; qs('#modalTitle').innerText = id ? 'Edit Influencer' : 'New Influencer'; const i = id ? data.influencers.find(x=>x.influencer_id==id) : {first_name:'', last_name:'', email:'', phone:'', niche:'', social_platform:'', follower_count:0}; 
  // **FIX #2:** Changed single quotes for attribute values to double quotes inside the template literal.
  qs('#modalBody').innerHTML = `
  <form id='influencerForm'>
    <div class='row mb-2'>
      <div class='col'><label class='form-label'>First name</label><input class='form-control' name='first_name' value="${i.first_name||''}" required></div>
      <div class='col'><label class='form-label'>Last name</label><input class='form-control' name='last_name' value="${i.last_name||''}" required></div>
    </div>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Email</label><input class='form-control' name='email' value="${i.email||''}" required></div>
      <div class='col-md-6'><label class='form-label'>Phone</label><input class='form-control' name='phone' value="${i.phone||''}"></div>
    </div>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Niche</label><input class='form-control' name='niche' value="${i.niche||''}"></div>
      <div class='col-md-6'><label class='form-label'>Platform</label><input class='form-control' name='social_platform' value="${i.social_platform||''}"></div>
    </div>
    <div class='mb-2'><label class='form-label'>Followers</label><input type='number' min='0' class='form-control' name='follower_count' value="${i.follower_count||0}"></div>
  </form>
`; qs('#modalSaveBtn').onclick = ()=> saveInfluencer(); entityModal.show(); }
function saveInfluencer(){ const form = qs('#influencerForm'); const fd = new FormData(form); const payload = Object.fromEntries(fd.entries()); const data = readData(); payload.follower_count = Number(payload.follower_count || 0);
  if(activeEditId){ const idx = data.influencers.findIndex(x=>x.influencer_id==activeEditId); data.influencers[idx] = {...data.influencers[idx], ...payload}; }
  else{ const newId = Math.max(0,...data.influencers.map(i=>i.influencer_id))+1; data.influencers.push({...payload, influencer_id:newId, created_at:new Date().toISOString().slice(0,10)});} writeData(data); entityModal.hide(); renderAll(); }

// Campaign
qs('#openCampaignForm')?.addEventListener('click', ()=> openCampaignForm());
function openCampaignForm(id=null){ const data = readData(); activeEditId = id; qs('#modalTitle').innerText = id ? 'Edit Campaign' : 'New Campaign'; const c = id ? data.campaigns.find(x=>x.campaign_id==id) : {brand_id:'', budget:0, status:'Planning', start_date:'', end_date:'', objective:''}; 
  // **FIX #3:** Changed single quotes for attribute values to double quotes inside the template literal.
  let brandOptions = data.brands.map(b=>`<option value="${b.brand_id}" ${b.brand_id==c.brand_id ? 'selected' : ''}>${b.brand_name}</option>`).join(''); 
  qs('#modalBody').innerHTML = `
  <form id='campaignForm'>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Brand</label><select class='form-control' name='brand_id' required>${brandOptions}</select></div>
      <div class='col-md-6'><label class='form-label'>Budget</label><input type='number' min='0' class='form-control' name='budget' value="${c.budget||0}" required></div>
    </div>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Start Date</label><input class='form-control datepicker' name='start_date' value="${c.start_date||''}" required></div>
      <div class='col-md-6'><label class='form-label'>End Date</label><input class='form-control datepicker' name='end_date' value="${c.end_date||''}" required></div>
    </div>
    <div class='mb-2'><label class='form-label'>Status</label><select class='form-control' name='status'><option ${c.status==='Planning'?'selected':''}>Planning</option><option ${c.status==='Active'?'selected':''}>Active</option><option ${c.status==='Completed'?'selected':''}>Completed</option><option ${c.status==='Cancelled'?'selected':''}>Cancelled</option></select></div>
    <div class='mb-2'><label class='form-label'>Objective</label><textarea class='form-control' name='objective'>${c.objective||''}</textarea></div>
  </form>
`;
  qs('#modalSaveBtn').onclick = ()=> saveCampaign(); entityModal.show(); setTimeout(()=> flatpickr('.datepicker', {dateFormat:'Y-m-d'}),50);
}
function saveCampaign(){ const data = readData(); const form = qs('#campaignForm'); const payload = Object.fromEntries(new FormData(form).entries()); payload.budget = Number(payload.budget||0);
  if(activeEditId){ const idx = data.campaigns.findIndex(x=>x.campaign_id==activeEditId); data.campaigns[idx] = {...data.campaigns[idx], ...payload}; }
  else{ const newId = Math.max(0,...data.campaigns.map(c=>c.campaign_id))+1; data.campaigns.push({...payload, campaign_id:newId, created_at:new Date().toISOString().slice(0,10)}); }
  writeData(data); entityModal.hide(); renderAll(); }

// Collaboration
qs('#openCollabForm')?.addEventListener('click', ()=> openCollabForm());
function openCollabForm(id=null){ const data = readData(); activeEditId = id; qs('#modalTitle').innerText = id ? 'Edit Collaboration' : 'New Collaboration'; const c = id ? data.collaborations.find(x=>x.collab_id==id) : {influencer_id:'', campaign_id:'', agreed_amount:0, approval_status:'Pending', dead_line:'', deliverables:''}; 
  // **FIX #4:** Changed single quotes for attribute values to double quotes inside the template literal.
  let influencerOptions = data.influencers.map(i=>`<option value="${i.influencer_id}" ${i.influencer_id==c.influencer_id ? 'selected' : ''}>${fullName(i)}</option>`).join(''); 
  let campaignOptions = data.campaigns.map(cp=>`<option value="${cp.campaign_id}" ${cp.campaign_id==c.campaign_id ? 'selected':''}>#${cp.campaign_id} • ${cp.objective.slice(0,30)}</option>`).join(''); 
  qs('#modalBody').innerHTML = `
  <form id='collabForm'>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Influencer</label><select class='form-control' name='influencer_id' required>${influencerOptions}</select></div>
      <div class='col-md-6'><label class='form-label'>Campaign</label><select class='form-control' name='campaign_id' required>${campaignOptions}</select></div>
    </div>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Agreed Amount</label><input type='number' min='0' class='form-control' name='agreed_amount' value="${c.agreed_amount||0}" required></div>
      <div class='col-md-6'><label class='form-label'>Status</label><select class='form-control' name='approval_status'><option ${c.approval_status==='Pending'?'selected':''}>Pending</option><option ${c.approval_status==='Approved'?'selected':''}>Approved</option><option ${c.approval_status==='Rejected'?'selected':''}>Rejected</option></select></div>
    </div>
    <div class='mb-2'><label class='form-label'>Deadline</label><input class='form-control datepicker' name='dead_line' value="${c.dead_line||''}"></div>
    <div class='mb-2'><label class='form-label'>Deliverables</label><textarea class='form-control' name='deliverables'>${c.deliverables||''}</textarea></div>
  </form>
`;
  qs('#modalSaveBtn').onclick = ()=> saveCollab(); entityModal.show(); setTimeout(()=> flatpickr('.datepicker', {dateFormat:'Y-m-d'}),50);
}
function saveCollab(){ const data = readData(); const payload = Object.fromEntries(new FormData(qs('#collabForm')).entries()); payload.agreed_amount = Number(payload.agreed_amount||0);
  if(activeEditId){ const idx = data.collaborations.findIndex(x=>x.collab_id==activeEditId); data.collaborations[idx] = {...data.collaborations[idx], ...payload}; }
  else{ const newId = Math.max(0,...data.collaborations.map(c=>c.collab_id))+1; data.collaborations.push({...payload, collab_id:newId, created_at:new Date().toISOString().slice(0,10)}); }
  writeData(data); entityModal.hide(); renderAll(); }

// Payment
qs('#openPaymentForm')?.addEventListener('click', ()=> openPaymentForm());
function openPaymentForm(id=null){ const data = readData(); activeEditId = id; qs('#modalTitle').innerText = id ? 'Edit Payment' : 'Record Payment'; const p = id ? data.payments.find(x=>x.payment_id==id) : {collab_id:'', payment_date:'', amount_paid:0, status:'Pending', mode:''}; 
  // **FIX #5:** Changed single quotes for attribute values to double quotes inside the template literal.
  let collabOptions = data.collaborations.map(c=>`<option value="${c.collab_id}" ${c.collab_id==p.collab_id? 'selected':''}>#${c.collab_id} • ${fullName(data.influencers.find(i=>i.influencer_id===c.influencer_id)||{})}</option>`).join(''); 
  qs('#modalBody').innerHTML = `
  <form id='paymentForm'>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Collaboration</label><select class='form-control' name='collab_id' required>${collabOptions}</select></div>
      <div class='col-md-6'><label class='form-label'>Amount</label><input type='number' min='0' class='form-control' name='amount_paid' value="${p.amount_paid||0}" required></div>
    </div>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Date</label><input class='form-control datepicker' name='payment_date' value="${p.payment_date||''}" required></div>
      <div class='col-md-6'><label class='form-label'>Mode</label><input class='form-control' name='mode' value="${p.mode||''}"></div>
    </div>
    <div class='mb-2'><label class='form-label'>Status</label><select class='form-control' name='status'><option ${p.status==='Pending'?'selected':''}>Pending</option><option ${p.status==='Completed'?'selected':''}>Completed</option><option ${p.status==='Failed'?'selected':''}>Failed</option></select></div>
  </form>
`;
  qs('#modalSaveBtn').onclick = ()=> savePayment(); entityModal.show(); setTimeout(()=> flatpickr('.datepicker', {dateFormat:'Y-m-d'}),50);
}
function savePayment(){ const data = readData(); const payload = Object.fromEntries(new FormData(qs('#paymentForm')).entries()); payload.amount_paid = Number(payload.amount_paid||0);
  if(activeEditId){ const idx = data.payments.findIndex(x=>x.payment_id==activeEditId); data.payments[idx] = {...data.payments[idx], ...payload}; }
  else{ const newId = Math.max(0,...data.payments.map(p=>p.payment_id))+1; data.payments.push({...payload, payment_id:newId, created_at:new Date().toISOString().slice(0,10)}); }
  writeData(data); entityModal.hide(); renderAll(); }

// Post
qs('#openPostForm')?.addEventListener('click', ()=> openPostForm());
function openPostForm(id=null){ const data = readData(); activeEditId = id; qs('#modalTitle').innerText = id ? 'Edit Post' : 'New Post'; const p = id ? data.posts.find(x=>x.post_id==id) : {influencer_id:'', collab_id:'', post_date:'', post_type:'', likes:0, shares:0, comments:0, reach:0, engagement_rate:0}; 
  let influencerOptions = data.influencers.map(i=>`<option value="${i.influencer_id}" ${i.influencer_id==p.influencer_id ? 'selected' : ''}>${fullName(i)}</option>`).join(''); 
  let collabOptions = data.collaborations.map(c=>`<option value="${c.collab_id}" ${c.collab_id==p.collab_id ? 'selected' : ''}>#${c.collab_id} • ${fullName(data.influencers.find(i=>i.influencer_id===c.influencer_id)||{})}</option>`).join(''); 
  // **FIX #6:** Restored the missing input fields for Shares and Comments, and changed single quotes for attribute values to double quotes inside the template literal.
  qs('#modalBody').innerHTML = `
  <form id='postForm'>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Influencer</label><select class='form-control' name='influencer_id' required>${influencerOptions}</select></div>
      <div class='col-md-6'><label class='form-label'>Collaboration</label><select class='form-control' name='collab_id' required>${collabOptions}</select></div>
    </div>
    <div class='row mb-2'>
      <div class='col-md-4'><label class='form-label'>Post Date</label><input class='form-control datepicker' name='post_date' value="${p.post_date||''}" required></div>
      <div class='col-md-4'><label class='form-label'>Type</label><input class='form-control' name='post_type' value="${p.post_type||''}"></div>
      <div class='col-md-4'><label class='form-label'>Likes</label><input type='number' min='0' class='form-control' name='likes' value="${p.likes||0}"></div>
    </div>
    <div class='row mb-2'>
      <div class='col'><label class='form-label'>Shares</label><input type='number' min='0' class='form-control' name='shares' value="${p.shares||0}"></div>
      <div class='col'><label class='form-label'>Comments</label><input type='number' min='0' class='form-control' name='comments' value="${p.comments||0}"></div>
    </div>
    <div class='row mb-2'>
          <div class='col'><label class='form-label'>Reach</label><input type='number' min='0' class='form-control' name='reach' value="${p.reach||0}"></div>
      <div class='col'><label class='form-label'>Engagement Rate (0-1)</label><input step='0.0001' type='number' min='0' max='1' class='form-control' name='engagement_rate' value="${p.engagement_rate||0}"></div>
    </div>
  </form>
`;
  qs('#modalSaveBtn').onclick = ()=> savePost();
  entityModal.show();
  setTimeout(()=> flatpickr('.datepicker', {dateFormat:'Y-m-d'}),50);
}
function savePost(){ 
  const data = readData(); 
  const payload = Object.fromEntries(new FormData(qs('#postForm')).entries()); 
  payload.likes = Number(payload.likes||0); 
  payload.shares = Number(payload.shares||0); 
  payload.comments = Number(payload.comments||0); 
  payload.reach = Number(payload.reach||0); 
  payload.engagement_rate = Number(payload.engagement_rate||0);

  if(activeEditId){ 
    const idx = data.posts.findIndex(x=>x.post_id==activeEditId); 
    data.posts[idx] = {...data.posts[idx], ...payload}; 
  } else { 
    const newId = (data.posts.length ? Math.max(...data.posts.map(p=>p.post_id)) : 0) + 1; 
    data.posts.push({...payload, post_id:newId, created_at:new Date().toISOString().slice(0,10)}); 
  }
  writeData(data); 
  entityModal.hide(); 
  renderAll(); 
}

// Hook up modal close to clear activeEditId
document.getElementById('entityModal').addEventListener('hidden.bs.modal', ()=>{
  activeEditId = null; 
  qs('#modalBody').innerHTML='';
});

// Init initial view and render
showView('dashboard');
renderAll();

// (Optional) Simple JSON export/import functions (uncomment if needed)
/*
function exportJSON(){ 
  const data = readData(); 
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'}); 
  const url = URL.createObjectURL(blob); 
  const a=document.createElement('a'); 
  a.href=url; a.download='influencer_data.json'; a.click(); 
  URL.revokeObjectURL(url); 
}
function importJSON(file){ 
  const reader=new FileReader(); 
  reader.onload = e=>{ 
    try{ 
      const parsed=JSON.parse(e.target.result); 
      writeData(parsed); renderAll(); alert('Imported successfully'); 
    }catch(err){ 
      alert('Invalid file'); 
    } 
  }; 
  reader.readAsText(file); 
}
*/