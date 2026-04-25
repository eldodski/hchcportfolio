// HC Finishing — Review UI Logic
// Load, edit, and approve parsed order form data (Sanity Gate)

let originalData = null;
let currentFormId = null;

async function initReview() {
  const params = new URLSearchParams(window.location.search);
  currentFormId = params.get('id');

  if (!currentFormId) {
    showReviewList();
    return;
  }

  try {
    const orderForm = await getOrderForm(currentFormId);
    originalData = JSON.parse(JSON.stringify(orderForm.parsed_json));
    renderReviewForm(orderForm);
  } catch (err) {
    document.getElementById('reviewContent').innerHTML =
      `<div class="review-error">Could not load order form: ${err.message}</div>`;
  }
}

// ============ REVIEW LIST (no ID param) ============

async function showReviewList() {
  const container = document.getElementById('reviewContent');

  try {
    const forms = await getOrderForms();

    if (forms.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No order forms uploaded yet.</p>
          <a href="upload.html" class="btn btn-primary">Upload Order Form</a>
        </div>`;
      return;
    }

    container.innerHTML = `
      <h2>Order Forms</h2>
      <div class="form-list">
        ${forms.map(f => `
          <a href="review.html?id=${f.id}" class="form-list-item">
            <div class="form-info">
              <span class="form-name">${f.original_filename}</span>
              <span class="form-date">${new Date(f.created_at).toLocaleDateString()}</span>
            </div>
            <div class="form-status">
              ${f.reviewed
                ? '<span class="badge badge-approved">Reviewed</span>'
                : `<span class="badge badge-${f.parse_status}">${f.parse_status}</span>`
              }
            </div>
          </a>
        `).join('')}
      </div>`;
  } catch (err) {
    container.innerHTML = `<div class="review-error">Could not load order forms: ${err.message}</div>`;
  }
}

// ============ RENDER REVIEW FORM ============

function renderReviewForm(orderForm) {
  const parsed = orderForm.parsed_json;
  const container = document.getElementById('reviewContent');

  const isReviewed = orderForm.reviewed;

  container.innerHTML = `
    <div class="review-header">
      <div>
        <h2>Review Order Form</h2>
        <p class="file-name">${orderForm.original_filename}</p>
      </div>
      <div>
        <span class="confidence confidence-${parsed.parse_confidence}">
          ${parsed.parse_confidence} confidence
        </span>
        ${isReviewed ? '<span class="badge badge-approved" style="margin-left: 0.5rem;">Approved</span>' : ''}
      </div>
    </div>

    ${parsed.parse_warnings && parsed.parse_warnings.length > 0 ? `
      <div class="warnings-section">
        ${parsed.parse_warnings.map(w => `<div class="warning-item">${w}</div>`).join('')}
      </div>
    ` : ''}

    <div class="review-section">
      <h3>Builder Information</h3>
      <div class="edit-grid">
        <div class="edit-field">
          <label for="builder_name">Builder Name</label>
          <input type="text" id="builder_name" value="${escapeHtml(parsed.builder_name || '')}" ${isReviewed ? 'disabled' : ''}>
        </div>
        <div class="edit-field">
          <label for="buyer_name">Buyer / Homeowner</label>
          <input type="text" id="buyer_name" value="${escapeHtml(parsed.buyer_name || '')}" ${isReviewed ? 'disabled' : ''}>
        </div>
        <div class="edit-field">
          <label for="project_name">Project / Subdivision</label>
          <input type="text" id="project_name" value="${escapeHtml(parsed.project_name || '')}" ${isReviewed ? 'disabled' : ''}>
        </div>
        <div class="edit-field">
          <label for="lot_number">Lot Number</label>
          <input type="text" id="lot_number" value="${escapeHtml(parsed.lot_number || '')}" ${isReviewed ? 'disabled' : ''}>
        </div>
        <div class="edit-field">
          <label for="address">Address</label>
          <input type="text" id="address" value="${escapeHtml(parsed.address || '')}" ${isReviewed ? 'disabled' : ''}>
        </div>
      </div>
    </div>

    <div class="review-section">
      <h3>Rooms and Materials</h3>
      <div id="roomsEditor">
        ${(parsed.rooms || []).map((room, ri) => renderRoomEditor(room, ri, isReviewed)).join('')}
      </div>
      ${!isReviewed ? `
        <button class="btn btn-add" onclick="addRoom()">+ Add Room</button>
      ` : ''}
    </div>

    <div class="raw-section">
      <span class="raw-toggle" onclick="this.nextElementSibling.classList.toggle('active')">
        Show raw extracted text
      </span>
      <div class="raw-text">${escapeHtml(parsed.raw_text || '')}</div>
    </div>
  `;

  // Track changes for diff highlighting
  if (!isReviewed) {
    container.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        input.classList.add('modified');
      });
    });
  }
}

function renderRoomEditor(room, roomIndex, disabled) {
  return `
    <div class="room-editor" data-room="${roomIndex}">
      <div class="room-editor-header">
        <input type="text" class="room-name-input" value="${escapeHtml(room.name)}"
               data-field="room-name" data-room="${roomIndex}" ${disabled ? 'disabled' : ''}>
        ${!disabled ? `<button class="btn-remove" onclick="removeRoom(${roomIndex})">Remove Room</button>` : ''}
      </div>
      <div class="materials-grid">
        <div class="materials-header">
          <span>Category</span><span>Product</span><span>Color</span><span>Qty</span><span></span>
        </div>
        ${(room.materials || []).map((m, mi) => `
          <div class="material-edit-row" data-room="${roomIndex}" data-material="${mi}">
            <input type="text" value="${escapeHtml(m.category)}" data-field="category" ${disabled ? 'disabled' : ''}>
            <input type="text" value="${escapeHtml(m.product)}" data-field="product" ${disabled ? 'disabled' : ''}>
            <input type="text" value="${escapeHtml(m.color)}" data-field="color" ${disabled ? 'disabled' : ''}>
            <input type="text" value="${escapeHtml(m.quantity)}" data-field="quantity" ${disabled ? 'disabled' : ''}>
            ${!disabled ? `<button class="btn-remove-sm" onclick="removeMaterial(${roomIndex}, ${mi})">x</button>` : '<span></span>'}
          </div>
        `).join('')}
      </div>
      ${!disabled ? `
        <button class="btn-add-sm" onclick="addMaterial(${roomIndex})">+ Add Material</button>
      ` : ''}
    </div>
  `;
}

// ============ EDIT OPERATIONS ============

function addRoom() {
  const editor = document.getElementById('roomsEditor');
  const roomIndex = editor.querySelectorAll('.room-editor').length;
  const html = renderRoomEditor({ name: 'New Room', materials: [] }, roomIndex, false);
  editor.insertAdjacentHTML('beforeend', html);
}

function removeRoom(roomIndex) {
  const room = document.querySelector(`.room-editor[data-room="${roomIndex}"]`);
  if (room) room.remove();
}

function addMaterial(roomIndex) {
  const room = document.querySelector(`.room-editor[data-room="${roomIndex}"] .materials-grid`);
  const mi = room.querySelectorAll('.material-edit-row').length;
  const html = `
    <div class="material-edit-row" data-room="${roomIndex}" data-material="${mi}">
      <input type="text" value="" data-field="category" placeholder="Category">
      <input type="text" value="" data-field="product" placeholder="Product">
      <input type="text" value="" data-field="color" placeholder="Color">
      <input type="text" value="" data-field="quantity" placeholder="Qty">
      <button class="btn-remove-sm" onclick="removeMaterial(${roomIndex}, ${mi})">x</button>
    </div>
  `;
  room.insertAdjacentHTML('beforeend', html);
}

function removeMaterial(roomIndex, materialIndex) {
  const row = document.querySelector(
    `.material-edit-row[data-room="${roomIndex}"][data-material="${materialIndex}"]`
  );
  if (row) row.remove();
}

// ============ COLLECT EDITS ============

function collectEdits() {
  const data = {
    builder_name: document.getElementById('builder_name')?.value || '',
    buyer_name: document.getElementById('buyer_name')?.value || '',
    project_name: document.getElementById('project_name')?.value || '',
    lot_number: document.getElementById('lot_number')?.value || '',
    address: document.getElementById('address')?.value || '',
    rooms: [],
    raw_text: originalData?.raw_text || '',
    parse_confidence: originalData?.parse_confidence || 'low',
    parse_warnings: originalData?.parse_warnings || []
  };

  document.querySelectorAll('.room-editor').forEach(roomEl => {
    const roomName = roomEl.querySelector('.room-name-input')?.value || 'Unknown';
    const materials = [];

    roomEl.querySelectorAll('.material-edit-row').forEach(matRow => {
      materials.push({
        category: matRow.querySelector('[data-field="category"]')?.value || '',
        product: matRow.querySelector('[data-field="product"]')?.value || '',
        color: matRow.querySelector('[data-field="color"]')?.value || '',
        quantity: matRow.querySelector('[data-field="quantity"]')?.value || '',
        notes: ''
      });
    });

    data.rooms.push({ name: roomName, materials });
  });

  return data;
}

// ============ SAVE / APPROVE ============

async function saveDraft() {
  if (!currentFormId) return;

  const btn = document.getElementById('saveDraftBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const edited = collectEdits();
    await updateOrderForm(currentFormId, { parsed_json: edited });
    showToast('Draft saved successfully.');
    btn.textContent = 'Save Draft';
    btn.disabled = false;
  } catch (err) {
    showToast('Failed to save: ' + err.message);
    btn.textContent = 'Save Draft';
    btn.disabled = false;
  }
}

async function approveAndSignOff() {
  if (!currentFormId) return;

  // Show confirmation modal
  document.getElementById('approveModal').classList.add('active');
}

async function confirmApproval() {
  const btn = document.getElementById('approveBtn');
  btn.disabled = true;
  btn.textContent = 'Approving...';

  document.getElementById('approveModal').classList.remove('active');

  try {
    const edited = collectEdits();
    await updateOrderForm(currentFormId, { parsed_json: edited });
    await approveOrderForm(currentFormId, 'designer');

    // Reload to show approved state
    const orderForm = await getOrderForm(currentFormId);
    originalData = JSON.parse(JSON.stringify(orderForm.parsed_json));
    renderReviewForm(orderForm);

    // Update action bar
    document.getElementById('actionBar').innerHTML = `
      <div class="approved-state">
        <span class="approved-check">&#10003;</span>
        <span>This order form has been reviewed and approved.</span>
        <a href="upload.html" class="btn btn-secondary">Upload Another</a>
      </div>
    `;

    showToast('Order form approved and signed off.');
  } catch (err) {
    showToast('Failed to approve: ' + err.message);
    btn.textContent = 'Approve and Sign Off';
    btn.disabled = false;
  }
}

function cancelApproval() {
  document.getElementById('approveModal').classList.remove('active');
}

// ============ HELPERS ============

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('active');
  setTimeout(() => toast.classList.remove('active'), 5000);
}

// Init on load
document.addEventListener('DOMContentLoaded', initReview);
