// ---------- Global App State ----------
// This object will hold all data fetched from the server.
// It replaces the old `localStorage` logic.
let AppData = {
  brands: [],
  influencers: [],
  campaigns: [],
  collaborations: [],
  payments: [],
  posts: []
};

// Bootstrap Modal instances
let entityModal;
let confirmModal;

// Global ID for editing
let activeEditId = null; 

// ---------- API Wrapper Functions ----------

/**
 * Fetches all data from the backend /api/data route
 * and stores it in the global AppData cache.
 */
async function loadData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    AppData = await response.json(); // Store in our global cache
  } catch (error) {
    console.error('Error loading data:', error);
    showToast('Error', 'Could not load data from the server. Please refresh.', 'danger');
    // Keep AppData as an empty structure to prevent crashes
    AppData = { brands: [], influencers: [], campaigns: [], collaborations: [], payments: [], posts: [] };
  }
}

/**
 * Sends data to the backend to save (Create 'POST' or Update 'PUT').
 * @param {string} url - The API endpoint (e.g., '/api/brands')
 * @param {string} method - 'POST' or 'PUT'
 * @param {object} payload - The data object to send
 * @returns {boolean} - True if successful, false otherwise
 */
async function saveData(url, method, payload) {
  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to save data');
    }
    return true; // Success
  } catch (error) {
    console.error(`Error saving data (${method} ${url}):`, error);
    showToast('Error', error.message, 'danger');
    return false; // Failure
  }
}

/**
 * Sends a delete request to the backend.
 * @param {string} url - The API endpoint (e.g., '/api/brands/1')
 * @returns {boolean} - True if successful, false otherwise
 */
async function deleteData(url) {
  try {
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to delete item');
    }
    return true; // Success
  } catch (error) {
    console.error(`Error deleting data (${url}):`, error);
    showToast('Error', error.message, 'danger');
    return false; // Failure
  }
}

// ---------- Utilities ----------
function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
function formatCurrency(v) { return '$' + Number(v).toLocaleString(); }
function formatDate(d) { return d ? new Date(d).toLocaleDateString() : 'N/A'; }
function fullName(inf) { return (inf.first_name || '') + ' ' + (inf.last_name || ''); }

// Simple Toast Notification (replaces alerts)
function showToast(title, message, type = 'success') {
  const toastContainer = qs('#toast-container');
  if (!toastContainer) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style = 'position: fixed; top: 20px; right: 20px; z-index: 1080;';
    document.body.appendChild(container);
    return showToast(title, message, type);
  }
  
  const toastId = 'toast-' + Math.random().toString(36).substr(2, 9);
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0 fade show`;
  toast.id = toastId;
  toast.role = 'alert';
  toast.ariaLive = 'assertive';
  toast.ariaAtomic = 'true';

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <strong>${title}:</strong> ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();
  toast.addEventListener('hidden.bs.toast', () => toast.remove());
}


// ---------- Navigation & View Switching ----------
const views = qsa('.view');
/**
 * Main function to switch views.
 * Now loads data from the server *before* rendering.
 */
async function showView(name) {
  const currentView = name.split('?')[0]; // Allow for query params, e.g., view?id=1
  await loadData(); // <-- CRITICAL: Load fresh data from server
  views.forEach(v => v.classList.add('d-none'));
  const el = qs('#view-' + currentView);
  if (el) el.classList.remove('d-none');
  qsa('#mainNav .nav-link').forEach(a => a.classList.remove('active'));
  qs(`#mainNav .nav-link[data-view="${currentView}"]`)?.classList.add('active');
  renderAll(); // <-- Render using the new AppData
  showToast('View Loaded', `Displaying ${currentView}`, 'success');
}

// ---------- Renderers Master Function ----------
/**
 * Renders all components using the global AppData.
 */
function renderAll(opts = {}) {
  const data = AppData; // <-- Use the global cache
  
  // Dashboard
  renderKPIs(data);
  renderDeadlineList(data);
  renderCampaignChart(data);
  renderRecentPosts(data);
  renderTopInfluencers(data);
  renderRecentPayments(data);
  
  // Table Views
  renderBrandsTable(data);
  renderInfluencersTable(data);
  renderCampaignsTable(data);
  renderCollabsTable(data);
  renderPaymentsTable(data);
  renderPostsTable(data);
}

// ---------- Individual Renderers (Updated) ----------
// All `render...Table` functions are updated with Delete buttons.

function renderKPIs(data) {
  qs('#kpiBrands').innerText = data.brands.length;
  qs('#kpiActiveCampaigns').innerText = data.campaigns.filter(c => c.status === 'Active').length;
  const totalSpend = data.collaborations.reduce((s, c) => s + Number(c.agreed_amount || 0), 0);
  qs('#kpiTotalSpend').innerText = formatCurrency(totalSpend);
  const top = [...data.influencers].sort((a, b) => b.follower_count - a.follower_count)[0];
  qs('#kpiTopInfluencer').innerText = top ? fullName(top) : '—';
}

function renderDeadlineList(data) {
  const now = new Date();
  const upcoming = data.collaborations.filter(c => new Date(c.dead_line) >= now).sort((a, b) => new Date(a.dead_line) - new Date(b.dead_line)).slice(0, 5);
  const container = qs('#deadlineList'); container.innerHTML = '';
  if (upcoming.length === 0) { container.innerHTML = '<div class="small-muted">No upcoming deadlines</div>'; qs('#upcomingDeadlines').innerText = 'No deadlines'; return; }
  qs('#upcomingDeadlines').innerText = upcoming.length + ' upcoming';
  upcoming.forEach(c => {
    const inf = data.influencers.find(i => i.influencer_id === c.influencer_id) || { first_name: 'Unknown' };
    const camp = data.campaigns.find(x => x.campaign_id === c.campaign_id) || { campaign_id: '?', objective: '' };
    const el = document.createElement('div'); el.className = 'mb-2 small-muted';
    el.innerHTML = `<strong>${fullName(inf)}</strong> — ${camp.campaign_id ? (camp.objective || '').slice(0, 40) + '...' : ''} <div class='small-muted'>Due ${formatDate(c.dead_line)}</div>`;
    container.appendChild(el);
  });
}

let campaignChartInstance = null;
function renderCampaignChart(data) {
  const ctx = qs('#campaignChart');
  if (!ctx) return;
  const labels = data.campaigns.map(c => 'C#' + c.campaign_id);
  const budgets = data.campaigns.map(c => c.budget);
  if (campaignChartInstance) campaignChartInstance.destroy();
  campaignChartInstance = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Budget', data: budgets, backgroundColor: 'rgba(107,79,58,0.3)' }] }, options: { plugins: { legend: { display: false } }, responsive: true } });
}

function renderRecentPosts(data) {
  const container = qs('#recentPosts'); container.innerHTML = '';
  [...data.posts].sort((a, b) => new Date(b.post_date) - new Date(a.post_date)).slice(0, 5).forEach(p => {
    const inf = data.influencers.find(i => i.influencer_id === p.influencer_id) || {};
    const el = document.createElement('div'); el.className = 'd-flex gap-2 align-items-start mb-2';
    el.innerHTML = `<div style="width:56px;height:56px;border-radius:10px;background:linear-gradient(135deg,#fff,#efe1d6);display:grid;place-items:center"><i class="fa fa-play"></i></div>
      <div class="flex-grow-1">
        <div style="font-weight:700">${p.post_type} • ${fullName(inf)}</div>
        <div class="small-muted">${p.likes.toLocaleString()} likes • Reach ${p.reach.toLocaleString()}</div>
      </div>`;
    container.appendChild(el);
  });
}

function renderTopInfluencers(data) {
  const cont = qs('#topInfluencers'); cont.innerHTML = '';
  [...data.influencers].sort((a, b) => b.follower_count - a.follower_count).slice(0, 5).forEach(i => {
    const el = document.createElement('div'); el.className = 'd-flex justify-content-between align-items-center mb-2';
    el.innerHTML = `<div><strong>${fullName(i)}</strong><div class='small-muted'>${i.niche} • ${i.social_platform}</div></div><div class='text-end'><div style='font-weight:700'>${Number(i.follower_count).toLocaleString()}</div></div>`;
    cont.appendChild(el);
  });
}

function renderRecentPayments(data) {
  const cont = qs('#recentPayments'); cont.innerHTML = '';
  [...data.payments].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date)).slice(0, 5).forEach(p => {
    const collab = data.collaborations.find(c => c.collab_id === p.collab_id) || {};
    const inf = data.influencers.find(i => i.influencer_id === collab.influencer_id) || {};
    const el = document.createElement('div'); el.className = 'mb-2';
    el.innerHTML = `<div style='font-weight:700'>${fullName(inf)}</div><div class='small-muted'>${formatDate(p.payment_date)} • ${formatCurrency(p.amount_paid)} • ${p.mode}</div>`;
    cont.appendChild(el);
  });
}

// --- Table Renderers with Delete Buttons ---

function renderBrandsTable(data) {
  const tbody = qs('#brandsTable tbody'); tbody.innerHTML = '';
  data.brands.forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${b.brand_id}</td><td>${b.brand_name}</td><td>${b.industry}</td><td>${b.contact_person}<br><a href='mailto:${b.contact_email}'>${b.contact_email}</a></td><td><a href='${b.website}' target='_blank'>Website</a></td><td>${formatDate(b.created_at)}</td>
    <td>
      <button class='btn btn-sm btn-outline-primary btn-edit-brand' data-id='${b.brand_id}'>Edit</button>
      <button class='btn btn-sm btn-outline-danger btn-delete-brand' data-id='${b.brand_id}'>Del</button>
    </td>`;
    tbody.appendChild(tr);
  });
  // Add listeners for new buttons
  qsa('.btn-edit-brand').forEach(btn => btn.addEventListener('click', e => openBrandForm(btn.dataset.id)));
  qsa('.btn-delete-brand').forEach(btn => btn.addEventListener('click', e => openConfirmModal('brand', btn.dataset.id)));
}

function renderInfluencersTable(data) {
  const tbody = qs('#influencersTable tbody'); tbody.innerHTML = '';
  data.influencers.forEach(i => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i.influencer_id}</td><td>${fullName(i)}<div class='small-muted'>${i.email}</div></td><td>${i.social_platform}</td><td>${Number(i.follower_count).toLocaleString()}</td><td>${i.niche}</td><td>${i.phone}</td>
    <td>
      <button class='btn btn-sm btn-outline-primary btn-edit-influencer' data-id='${i.influencer_id}'>Edit</button>
      <button class='btn btn-sm btn-outline-danger btn-delete-influencer' data-id='${i.influencer_id}'>Del</button>
    </td>`;
    tbody.appendChild(tr);
  });
  qsa('.btn-edit-influencer').forEach(btn => btn.addEventListener('click', e => openInfluencerForm(btn.dataset.id)));
  qsa('.btn-delete-influencer').forEach(btn => btn.addEventListener('click', e => openConfirmModal('influencer', btn.dataset.id)));
}

function renderCampaignsTable(data) {
  const tbody = qs('#campaignsTable tbody'); tbody.innerHTML = '';
  data.campaigns.forEach(c => {
    const brand = data.brands.find(b => b.brand_id === c.brand_id) || { brand_name: 'Unknown' };
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.campaign_id}</td><td>${brand.brand_name}</td><td>${formatCurrency(c.budget)}</td><td><span class='badge badge-status-${c.status}'>${c.status}</span></td><td>${formatDate(c.start_date)} → ${formatDate(c.end_date)}</td><td>${(c.objective || '').slice(0, 50)}...</td>
    <td>
      <button class='btn btn-sm btn-outline-primary btn-edit-campaign' data-id='${c.campaign_id}'>Edit</button>
      <button class='btn btn-sm btn-outline-danger btn-delete-campaign' data-id='${c.campaign_id}'>Del</button>
    </td>`;
    tbody.appendChild(tr);
  });
  qsa('.btn-edit-campaign').forEach(btn => btn.addEventListener('click', e => openCampaignForm(btn.dataset.id)));
  qsa('.btn-delete-campaign').forEach(btn => btn.addEventListener('click', e => openConfirmModal('campaign', btn.dataset.id)));
}

function renderCollabsTable(data) {
  const tbody = qs('#collabsTable tbody'); tbody.innerHTML = '';
  data.collaborations.forEach(c => {
    const inf = data.influencers.find(i => i.influencer_id === c.influencer_id) || { first_name: 'Unknown' };
    const camp = data.campaigns.find(x => x.campaign_id === c.campaign_id) || { campaign_id: '?' };
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.collab_id}</td><td>${fullName(inf)}</td><td>Campaign #${camp.campaign_id}</td><td>${formatCurrency(c.agreed_amount)}</td><td>${c.approval_status}</td><td>${formatDate(c.dead_line)}</td>
    <td>
      <button class='btn btn-sm btn-outline-primary btn-edit-collab' data-id='${c.collab_id}'>Edit</button>
      <button class='btn btn-sm btn-outline-danger btn-delete-collab' data-id='${c.collab_id}'>Del</button>
    </td>`;
    tbody.appendChild(tr);
  });
  qsa('.btn-edit-collab').forEach(btn => btn.addEventListener('click', e => openCollabForm(btn.dataset.id)));
  qsa('.btn-delete-collab').forEach(btn => btn.addEventListener('click', e => openConfirmModal('collaboration', btn.dataset.id)));
}

function renderPaymentsTable(data) {
  const tbody = qs('#paymentsTable tbody'); tbody.innerHTML = '';
  data.payments.forEach(p => {
    const collab = data.collaborations.find(c => c.collab_id === p.collab_id) || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.payment_id}</td><td>${collab.collab_id || '—'}</td><td>${formatDate(p.payment_date)}</td><td>${formatCurrency(p.amount_paid)}</td><td>${p.status}</td><td>${p.mode}</td>
    <td>
      <button class='btn btn-sm btn-outline-primary btn-edit-payment' data-id='${p.payment_id}'>Edit</button>
      <button class='btn btn-sm btn-outline-danger btn-delete-payment' data-id='${p.payment_id}'>Del</button>
    </td>`;
    tbody.appendChild(tr);
  });
  qsa('.btn-edit-payment').forEach(btn => btn.addEventListener('click', e => openPaymentForm(btn.dataset.id)));
  qsa('.btn-delete-payment').forEach(btn => btn.addEventListener('click', e => openConfirmModal('payment', btn.dataset.id)));
}

function renderPostsTable(data) {
  const tbody = qs('#postsTable tbody'); tbody.innerHTML = '';
  data.posts.forEach(p => {
    const inf = data.influencers.find(i => i.influencer_id === p.influencer_id) || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.post_id}</td><td>${fullName(inf)}</td><td>${p.collab_id}</td><td>${formatDate(p.post_date)}</td><td>${p.post_type}</td><td>${p.likes.toLocaleString()}</td><td>${p.reach.toLocaleString()}</td><td>${(p.engagement_rate * 100).toFixed(2)}%</td>
    <td>
      <button class='btn btn-sm btn-outline-primary btn-edit-post' data-id='${p.post_id}'>Edit</button>
      <button class='btn btn-sm btn-outline-danger btn-delete-post' data-id='${p.post_id}'>Del</button>
    </td>`;
    tbody.appendChild(tr);
  });
  qsa('.btn-edit-post').forEach(btn => btn.addEventListener('click', e => openPostForm(btn.dataset.id)));
  qsa('.btn-delete-post').forEach(btn => btn.addEventListener('click', e => openConfirmModal('post', btn.dataset.id)));
}

// ---------- Forms & CRUD (modal driven) ----------

// --- Delete Confirmation ---
/**
 * Opens the confirmation modal and sets its 'Delete' button
 * to trigger the correct delete action.
 */
function openConfirmModal(entity, id) {
  if (!confirmModal) return;
  // Set the text
  qs('#confirmModalTitle').innerText = `Delete ${entity}`;
  qs('#confirmModalBody').innerHTML = `Are you sure you want to permanently delete this ${entity} (ID: ${id})? <br><br>This action cannot be undone.`;
  
  // Set the click event for the "Delete" button
  // *** THIS IS THE FIX ***
  qs('#confirmDeleteBtn').onclick = () => deleteRecord(entity, id);
  
  confirmModal.show();
}

/**
 * The actual delete function called by the modal.
 */
async function deleteRecord(entity, id) {
  const url = `/api/${entity}s/${id}`; // e.g., /api/brands/1
  const success = await deleteData(url);
  if (success) {
    confirmModal.hide();
    showToast('Deleted!', `Successfully deleted ${entity} ${id}.`, 'success');
    await showView(`${entity}s`); // Reload the view
  }
}

// --- Brand ---
qs('#addBrandBtn')?.addEventListener('click', () => openBrandForm());
qs('#openBrandForm')?.addEventListener('click', () => openBrandForm());
function openBrandForm(id = null) {
  const data = AppData; // Use global cache
  activeEditId = id;
  qs('#modalTitle').innerText = id ? 'Edit Brand' : 'New Brand';
  const b = id ? data.brands.find(x => x.brand_id == id) : { brand_name: '', website: '', industry: '', contact_person: '', contact_email: '' };
  
  qs('#modalBody').innerHTML = `
    <form id='brandForm'>
      <div class='mb-2 row'>
        <div class='col-md-6'><label class='form-label'>Name</label><input required class='form-control' name='brand_name' value="${b.brand_name || ''}"></div>
        <div class='col-md-6'><label class='form-label'>Industry</label><input class='form-control' name='industry' value="${b.industry || ''}"></div>
      </div>
      <div class='mb-2 row'>
        <div class='col-md-6'><label class='form-label'>Contact Person</label><input class='form-control' name='contact_person' value="${b.contact_person || ''}"></div>
        <div class='col-md-6'><label class='form-label'>Contact Email</label><input type="email" class='form-control' name='contact_email' value="${b.contact_email || ''}"></div>
      </div>
      <div class='mb-2'><label class='form-label'>Website</label><input type="url" class='form-control' name='website' value="${b.website || ''}"></div>
    </form>
  `;
  qs('#modalSaveBtn').onclick = () => saveBrand();
  entityModal.show();
}

async function saveBrand() {
  const form = qs('#brandForm');
  const payload = Object.fromEntries(new FormData(form).entries());
  
  let url = '/api/brands';
  let method = 'POST';
  if (activeEditId) {
    url = `/api/brands/${activeEditId}`;
    method = 'PUT';
  }

  const success = await saveData(url, method, payload);
  if (success) {
    entityModal.hide();
    showToast('Saved!', 'Brand saved successfully.', 'success');
    await showView('brands'); // Reload view and data
  }
}

// --- Influencer ---
qs('#addInfluencerBtn')?.addEventListener('click', () => openInfluencerForm());
qs('#openInfluencerForm')?.addEventListener('click', () => openInfluencerForm());
function openInfluencerForm(id = null) {
  const data = AppData; 
  activeEditId = id;
  qs('#modalTitle').innerText = id ? 'Edit Influencer' : 'New Influencer';
  const i = id ? data.influencers.find(x => x.influencer_id == id) : { first_name: '', last_name: '', email: '', phone: '', niche: '', social_platform: '', follower_count: 0 };
  
  qs('#modalBody').innerHTML = `
  <form id='influencerForm'>
    <div class='row mb-2'>
      <div class='col'><label class='form-label'>First name</label><input class='form-control' name='first_name' value="${i.first_name || ''}" required></div>
      <div class='col'><label class='form-label'>Last name</label><input class='form-control' name='last_name' value="${i.last_name || ''}" required></div>
    </div>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Email</label><input type="email" class='form-control' name='email' value="${i.email || ''}" required></div>
      <div class='col-md-6'><label class='form-label'>Phone</label><input type="tel" class='form-control' name='phone' value="${i.phone || ''}"></div>
    </div>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Niche</label><input class='form-control' name='niche' value="${i.niche || ''}"></div>
      <div class='col-md-6'><label class='form-label'>Platform</label><input class='form-control' name='social_platform' value="${i.social_platform || ''}"></div>
    </div>
    <div class='mb-2'><label class='form-label'>Followers</label><input type='number' min='0' class='form-control' name='follower_count' value="${i.follower_count || 0}"></div>
  </form>
`;
  qs('#modalSaveBtn').onclick = () => saveInfluencer();
  entityModal.show();
}

async function saveInfluencer() {
  const form = qs('#influencerForm');
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.follower_count = Number(payload.follower_count || 0);

  let url = '/api/influencers';
  let method = 'POST';
  if (activeEditId) {
    url = `/api/influencers/${activeEditId}`;
    method = 'PUT';
  }

  const success = await saveData(url, method, payload);
  if (success) {
    entityModal.hide();
    showToast('Saved!', 'Influencer saved successfully.', 'success');
    await showView('influencers');
  }
}

// --- Campaign ---
qs('#openCampaignForm')?.addEventListener('click', () => openCampaignForm());
function openCampaignForm(id = null) {
  const data = AppData;
  activeEditId = id;
  qs('#modalTitle').innerText = id ? 'Edit Campaign' : 'New Campaign';
  const c = id ? data.campaigns.find(x => x.campaign_id == id) : { brand_id: '', budget: 0, status: 'Planning', start_date: '', end_date: '', objective: '' };
  
  let brandOptions = data.brands.map(b => `<option value="${b.brand_id}" ${b.brand_id == c.brand_id ? 'selected' : ''}>${b.brand_name}</option>`).join('');
  
  qs('#modalBody').innerHTML = `
  <form id='campaignForm'>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Brand</label><select class='form-select' name='brand_id' required>${brandOptions}</select></div>
      <div class='col-md-6'><label class='form-label'>Budget</label><input type='number' min='0' step="0.01" class='form-control' name='budget' value="${c.budget || 0}" required></div>
    </div>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Start Date</label><input class='form-control datepicker' name='start_date' value="${c.start_date ? c.start_date.split('T')[0] : ''}" required></div>
      <div class='col-md-6'><label class='form-label'>End Date</label><input class='form-control datepicker' name='end_date' value="${c.end_date ? c.end_date.split('T')[0] : ''}" required></div>
    </div>
    <div class='mb-2'><label class='form-label'>Status</label><select class='form-select' name='status'><option ${c.status === 'Planning' ? 'selected' : ''}>Planning</option><option ${c.status === 'Active' ? 'selected' : ''}>Active</option><option ${c.status === 'Completed' ? 'selected' : ''}>Completed</option><option ${c.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option></select></div>
    <div class='mb-2'><label class='form-label'>Objective</label><textarea class='form-control' name='objective'>${c.objective || ''}</textarea></div>
  </form>
`;
  qs('#modalSaveBtn').onclick = () => saveCampaign();
  entityModal.show();
  setTimeout(() => flatpickr('.datepicker', { dateFormat: 'Y-m-d' }), 50);
}

async function saveCampaign() {
  const form = qs('#campaignForm');
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.budget = Number(payload.budget || 0);

  let url = '/api/campaigns';
  let method = 'POST';
  if (activeEditId) {
    url = `/api/campaigns/${activeEditId}`;
    method = 'PUT';
  }

  const success = await saveData(url, method, payload);
  if (success) {
    entityModal.hide();
    showToast('Saved!', 'Campaign saved successfully.', 'success');
    await showView('campaigns');
  }
}

// --- Collaboration ---
qs('#openCollabForm')?.addEventListener('click', () => openCollabForm());
function openCollabForm(id = null) {
  const data = AppData;
  activeEditId = id;
  qs('#modalTitle').innerText = id ? 'Edit Collaboration' : 'New Collaboration';
  const c = id ? data.collaborations.find(x => x.collab_id == id) : { influencer_id: '', campaign_id: '', agreed_amount: 0, approval_status: 'Pending', dead_line: '', deliverables: '' };
  
  let influencerOptions = data.influencers.map(i => `<option value="${i.influencer_id}" ${i.influencer_id == c.influencer_id ? 'selected' : ''}>${fullName(i)}</option>`).join('');
  let campaignOptions = data.campaigns.map(cp => `<option value="${cp.campaign_id}" ${cp.campaign_id == c.campaign_id ? 'selected' : ''}>#${cp.campaign_id} • ${(cp.objective || '').slice(0, 30)}</option>`).join('');
  
  qs('#modalBody').innerHTML = `
  <form id='collabForm'>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Influencer</label><select class='form-select' name='influencer_id' required>${influencerOptions}</select></div>
      <div class='col-md-6'><label class='form-label'>Campaign</label><select class='form-select' name='campaign_id' required>${campaignOptions}</select></div>
    </div>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Agreed Amount</label><input type='number' min='0' step="0.01" class='form-control' name='agreed_amount' value="${c.agreed_amount || 0}" required></div>
      <div class='col-md-6'><label class='form-label'>Status</label><select class='form-select' name='approval_status'><option ${c.approval_status === 'Pending' ? 'selected' : ''}>Pending</option><option ${c.approval_status === 'Approved' ? 'selected' : ''}>Approved</option><option ${c.approval_status === 'Rejected' ? 'selected' : ''}>Rejected</option></select></div>
    </div>
    <div class='mb-2'><label class='form-label'>Deadline</label><input class='form-control datepicker' name='dead_line' value="${c.dead_line ? c.dead_line.split('T')[0] : ''}"></div>
    <div class='mb-2'><label class='form-label'>Deliverables</label><textarea class='form-control' name='deliverables'>${c.deliverables || ''}</textarea></div>
  </form>
`;
  qs('#modalSaveBtn').onclick = () => saveCollab();
  entityModal.show();
  setTimeout(() => flatpickr('.datepicker', { dateFormat: 'Y-m-d' }), 50);
}

async function saveCollab() {
  const payload = Object.fromEntries(new FormData(qs('#collabForm')).entries());
  payload.agreed_amount = Number(payload.agreed_amount || 0);

  let url = '/api/collaborations';
  let method = 'POST';
  if (activeEditId) {
    url = `/api/collaborations/${activeEditId}`;
    method = 'PUT';
  }

  const success = await saveData(url, method, payload);
  if (success) {
    entityModal.hide();
    showToast('Saved!', 'Collaboration saved successfully.', 'success');
    await showView('collaborations');
  }
}

// --- Payment ---
qs('#openPaymentForm')?.addEventListener('click', () => openPaymentForm());
function openPaymentForm(id = null) {
  const data = AppData;
  activeEditId = id;
  qs('#modalTitle').innerText = id ? 'Edit Payment' : 'Record Payment';
  const p = id ? data.payments.find(x => x.payment_id == id) : { collab_id: '', payment_date: '', amount_paid: 0, status: 'Pending', mode: '' };
  
  let collabOptions = data.collaborations.map(c => `<option value="${c.collab_id}" ${c.collab_id == p.collab_id ? 'selected' : ''}>#${c.collab_id} • ${fullName(data.influencers.find(i => i.influencer_id === c.influencer_id) || {})}</option>`).join('');
  
  qs('#modalBody').innerHTML = `
  <form id='paymentForm'>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Collaboration</label><select class='form-select' name='collab_id' required>${collabOptions}</select></div>
      <div class='col-md-6'><label class='form-label'>Amount</label><input type='number' min='0' step="0.01" class='form-control' name='amount_paid' value="${p.amount_paid || 0}" required></div>
    </div>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Date</label><input class='form-control datepicker' name='payment_date' value="${p.payment_date ? p.payment_date.split('T')[0] : ''}" required></div>
      <div class='col-md-6'><label class='form-label'>Mode</label><input class='form-control' name='mode' value="${p.mode || ''}"></div>
    </div>
    <div class='mb-2'><label class='form-label'>Status</label><select class='form-select' name='status'><option ${p.status === 'Pending' ? 'selected' : ''}>Pending</option><option ${p.status === 'Completed' ? 'selected' : ''}>Completed</option><option ${p.status === 'Failed' ? 'selected' : ''}>Failed</option></select></div>
  </form>
`;
  qs('#modalSaveBtn').onclick = () => savePayment();
  entityModal.show();
  setTimeout(() => flatpickr('.datepicker', { dateFormat: 'Y-m-d' }), 50);
}

async function savePayment() {
  const payload = Object.fromEntries(new FormData(qs('#paymentForm')).entries());
  payload.amount_paid = Number(payload.amount_paid || 0);

  let url = '/api/payments';
  let method = 'POST';
  if (activeEditId) {
    url = `/api/payments/${activeEditId}`;
    method = 'PUT';
  }
  
  const success = await saveData(url, method, payload);
  if (success) {
    entityModal.hide();
    showToast('Saved!', 'Payment saved successfully.', 'success');
    await showView('payments');
  }
}

// --- Post ---
qs('#openPostForm')?.addEventListener('click', () => openPostForm());
function openPostForm(id = null) {
  const data = AppData;
  activeEditId = id;
  qs('#modalTitle').innerText = id ? 'Edit Post' : 'New Post';
  const p = id ? data.posts.find(x => x.post_id == id) : { influencer_id: '', collab_id: '', post_date: '', post_type: '', likes: 0, shares: 0, comments: 0, reach: 0, engagement_rate: 0 };
  
  let influencerOptions = data.influencers.map(i => `<option value="${i.influencer_id}" ${i.influencer_id == p.influencer_id ? 'selected' : ''}>${fullName(i)}</option>`).join('');
  let collabOptions = data.collaborations.map(c => `<option value="${c.collab_id}" ${c.collab_id == p.collab_id ? 'selected' : ''}>#${c.collab_id} • ${fullName(data.influencers.find(i => i.influencer_id === c.influencer_id) || {})}</option>`).join('');
  
  qs('#modalBody').innerHTML = `
  <form id='postForm'>
    <div class='row mb-2'>
      <div class='col-md-6'><label class='form-label'>Influencer</label><select class='form-select' name='influencer_id' required>${influencerOptions}</select></div>
      <div class='col-md-6'><label class='form-label'>Collaboration</label><select class='form-select' name='collab_id' required>${collabOptions}</select></div>
    </div>
    <div class='row mb-2'>
      <div class='col-md-4'><label class='form-label'>Post Date</label><input class='form-control datepicker' name='post_date' value="${p.post_date ? p.post_date.split('T')[0] : ''}" required></div>
      <div class='col-md-4'><label class='form-label'>Type</label><input class='form-control' name='post_type' value="${p.post_type || ''}"></div>
      <div class='col-md-4'><label class='form-label'>Likes</label><input type='number' min='0' class='form-control' name='likes' value="${p.likes || 0}"></div>
    </div>
    <div class='row mb-2'>
      <div class='col'><label class='form-label'>Shares</label><input type='number' min='0' class='form-control' name='shares' value="${p.shares || 0}"></div>
      <div class='col'><label class='form-label'>Comments</label><input type='number' min='0' class='form-control' name='comments' value="${p.comments || 0}"></div>
    </div>
    <div class='row mb-2'>
        <div class='col'><label class='form-label'>Reach</label><input type='number' min='0' class='form-control' name='reach' value="${p.reach || 0}"></div>
      <div class='col'><label class='form-label'>Engagement Rate (0-1)</label><input step='0.0001' type='number' min='0' max='1' class='form-control' name='engagement_rate' value="${p.engagement_rate || 0}"></div>
    </div>
  </form>
`;
  qs('#modalSaveBtn').onclick = () => savePost();
  entityModal.show();
  setTimeout(() => flatpickr('.datepicker', { dateFormat: 'Y-m-d' }), 50);
}

async function savePost() {
  const payload = Object.fromEntries(new FormData(qs('#postForm')).entries());
  // Number conversions
  payload.likes = Number(payload.likes || 0);
  payload.shares = Number(payload.shares || 0);
  payload.comments = Number(payload.comments || 0);
  payload.reach = Number(payload.reach || 0);
  payload.engagement_rate = Number(payload.engagement_rate || 0);

  let url = '/api/posts';
  let method = 'POST';
  if (activeEditId) {
    url = `/api/posts/${activeEditId}`;
    method = 'PUT';
  }

  const success = await saveData(url, method, payload);
  if (success) {
    entityModal.hide();
    showToast('Saved!', 'Post saved successfully.', 'success');
    await showView('posts');
  }
}

// ---------- App Initialization ----------
// This code runs once the entire page (DOM) is loaded.
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Bootstrap Modals
  entityModal = new bootstrap.Modal(qs('#entityModal'));
  confirmModal = new bootstrap.Modal(qs('#confirmModal'));

  // Hook up navigation
  qsa('#mainNav .nav-link').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    showView(a.dataset.view);
  }));

  // Sidebar toggle for mobile
  qs('#toggleSidebar').addEventListener('click', () => {
    qs('#sidebar').classList.toggle('d-none');
  });

  // Global search - *Simplified behavior: just re-renders*
  qs('#globalSearch').addEventListener('input', () => {
    // This is simple. A real search would filter AppData
    // and then call renderAll()
    console.log('Search not fully implemented yet');
  });

  // Reset data
  qs('#resetDataBtn').addEventListener('click', async () => {
    openConfirmModal('database', null);
    qs('#confirmModalTitle').innerText = 'Reset Database';
    qs('#confirmModalBody').innerHTML = 'Are you sure you want to reset the entire database to the original sample data? <br><br>All your changes will be lost.';
    
    // Set the delete button to call the reset API
    qs('#confirmDeleteBtn').onclick = async () => {
      try {
        const response = await fetch('/api/reset-data', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to reset data on server');
        showToast('Success!', 'Database has been reset.', 'success');
        confirmModal.hide();
        await showView('dashboard'); // Reload the view and data
      } catch (error) {
        console.error('Reset error:', error);
        showToast('Error', error.message, 'danger');
      }
    };
  });

  // Hook up modal close to clear activeEditId
  qs('#entityModal').addEventListener('hidden.bs.modal', () => {
    activeEditId = null;
    qs('#modalBody').innerHTML = '';
  });

  // Init initial view
  // This will now trigger the first data load
  showView('dashboard');
});

