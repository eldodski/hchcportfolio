// Social Queue Admin Logic
// Handles post creation, editing, approval workflow, and image uploads

let currentFilter = 'all';
let editingPostId = null;

// ============ INITIALIZATION ============

async function initSocialQueue() {
  const clerk = await initClerk();
  if (!clerk || !clerk.user) {
    document.getElementById('queue-content').innerHTML = `
      <div style="text-align:center; padding:80px 24px;">
        <h2 style="font-family:var(--heading); color:var(--navy); margin-bottom:12px;">Sign In Required</h2>
        <p style="color:var(--mocha); margin-bottom:24px;">You need to sign in to access the social queue.</p>
        <button class="btn btn-primary" onclick="openSignIn()">Sign In</button>
      </div>`;
    return;
  }

  const role = getUserRole();
  if (role !== 'admin' && role !== 'designer') {
    document.getElementById('queue-content').innerHTML = `
      <div style="text-align:center; padding:80px 24px;">
        <h2 style="font-family:var(--heading); color:var(--navy);">Access Denied</h2>
        <p style="color:var(--mocha);">You do not have permission to access the social queue.</p>
      </div>`;
    return;
  }

  const name = clerk.user.firstName || clerk.user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User';
  document.getElementById('user-display').textContent = name;
  document.getElementById('signout-btn').style.display = 'block';

  setupFilterTabs();
  await loadPosts();
}

// ============ FILTER TABS ============

function setupFilterTabs() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelector('.filter-tab.active')?.classList.remove('active');
      tab.classList.add('active');
      currentFilter = tab.dataset.status;
      loadPosts();
    });
  });
}

// ============ LOAD POSTS ============

async function loadPosts() {
  const container = document.getElementById('posts-list');
  container.innerHTML = '<div class="loading-state">Loading posts...</div>';

  const filters = {};
  if (currentFilter !== 'all') filters.status = currentFilter;

  const posts = await getSocialPosts(filters);

  if (posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Posts${currentFilter !== 'all' ? ` (${currentFilter})` : ''}</h3>
        <p>Tap the + button to create your first post.</p>
      </div>`;
    return;
  }

  container.innerHTML = posts.map(post => renderPostCard(post)).join('');
}

// ============ POST CARD ============

function renderPostCard(post) {
  const statusClass = `status-${post.status}`;
  const platformIcons = (post.platforms || []).map(p => {
    const icons = { instagram: 'IG', facebook: 'FB', pinterest: 'Pin' };
    return `<span class="platform-icon">${icons[p] || p}</span>`;
  }).join('');

  const caption = post.caption
    ? (post.caption.length > 80 ? post.caption.substring(0, 80) + '...' : post.caption)
    : 'No caption';

  const scheduledInfo = post.scheduled_at
    ? `<span class="post-schedule">Scheduled: ${new Date(post.scheduled_at).toLocaleDateString()}</span>`
    : '';

  let actions = '';
  switch (post.status) {
    case 'draft':
      actions = `
        <button class="action-btn action-submit" onclick="submitPost('${post.id}')">Submit</button>
        <button class="action-btn action-edit" onclick="openEditModal('${post.id}')">Edit</button>
        <button class="action-btn action-delete" onclick="confirmDelete('${post.id}')">Delete</button>`;
      break;
    case 'pending':
      actions = `
        <button class="action-btn action-approve" onclick="approvePost('${post.id}')">Approve</button>
        <button class="action-btn action-reject" onclick="rejectPost('${post.id}')">Reject</button>`;
      break;
    case 'approved':
      actions = `
        <button class="action-btn action-publish" onclick="markPublished('${post.id}')">Mark Published</button>`;
      break;
    case 'published':
      actions = `
        <span class="published-date">Published ${new Date(post.published_at).toLocaleDateString()}</span>`;
      break;
    case 'rejected':
      actions = `
        <button class="action-btn action-edit" onclick="openEditModal('${post.id}')">Edit & Resubmit</button>
        <button class="action-btn action-delete" onclick="confirmDelete('${post.id}')">Delete</button>`;
      break;
  }

  return `
    <div class="post-card" data-id="${post.id}">
      <div class="post-card-top">
        ${post.image_url
          ? `<img src="${post.image_url}" alt="${post.alt_text || 'Post image'}" class="post-thumb" loading="lazy">`
          : '<div class="post-thumb-empty">No Image</div>'}
        <div class="post-info">
          <p class="post-caption">${escapeHtml(caption)}</p>
          <div class="post-meta">
            <span class="status-badge ${statusClass}">${post.status}</span>
            ${platformIcons ? `<span class="post-platforms">${platformIcons}</span>` : ''}
            ${post.project_type ? `<span class="post-type">${post.project_type}</span>` : ''}
          </div>
          ${scheduledInfo}
          ${post.rejected_reason ? `<p class="rejected-reason">Reason: ${escapeHtml(post.rejected_reason)}</p>` : ''}
        </div>
      </div>
      <div class="post-actions">${actions}</div>
    </div>`;
}

// ============ POST ACTIONS ============

async function submitPost(id) {
  await updateSocialPost(id, { status: 'pending' });
  await loadPosts();
  showToast('Post submitted for review');
}

async function approvePost(id) {
  await updateSocialPost(id, { status: 'approved' });
  await loadPosts();
  showToast('Post approved');
}

async function rejectPost(id) {
  const reason = prompt('Rejection reason (optional):');
  await updateSocialPost(id, {
    status: 'rejected',
    rejected_reason: reason || null
  });
  await loadPosts();
  showToast('Post rejected');
}

async function markPublished(id) {
  // Get post data for publishing
  const posts = await getSocialPosts();
  const post = posts.find(p => p.id === id);
  if (!post) return;

  const platforms = post.platforms || [];
  const hasConnectedPlatforms = platforms.includes('pinterest');

  if (hasConnectedPlatforms) {
    showToast('Publishing to platforms...');
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: id,
          platforms,
          imageUrl: post.image_url,
          caption: post.caption,
          hashtags: post.hashtags,
          altText: post.alt_text,
          projectType: post.project_type
        })
      });
      const result = await res.json();
      const pinterestResult = result.results?.find(r => r.platform === 'pinterest');
      if (pinterestResult?.status === 'success') {
        showToast('Published to Pinterest!');
      } else if (pinterestResult?.status === 'error') {
        showToast('Pinterest error: ' + pinterestResult.message);
      }
      // Store publish results in meta
      await updateSocialPost(id, {
        status: 'published',
        published_at: new Date().toISOString(),
        meta: { publish_results: result.results }
      });
    } catch (err) {
      console.error('Publish error:', err);
      showToast('Error publishing. Marked as published locally.');
      await updateSocialPost(id, {
        status: 'published',
        published_at: new Date().toISOString()
      });
    }
  } else {
    await updateSocialPost(id, {
      status: 'published',
      published_at: new Date().toISOString()
    });
    showToast('Post marked as published (no connected platforms)');
  }

  await loadPosts();
}

async function confirmDelete(id) {
  if (!confirm('Delete this post? This cannot be undone.')) return;
  await deleteSocialPost(id);
  await loadPosts();
  showToast('Post deleted');
}

// ============ CREATE / EDIT MODAL ============

function openCreateModal() {
  editingPostId = null;
  document.getElementById('modal-title').textContent = 'New Post';
  document.getElementById('post-form').reset();
  document.getElementById('image-preview').innerHTML = '';
  document.getElementById('char-count').textContent = '0 / 2200';
  document.getElementById('post-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

async function openEditModal(id) {
  editingPostId = id;
  document.getElementById('modal-title').textContent = 'Edit Post';

  const posts = await getSocialPosts();
  const post = posts.find(p => p.id === id);
  if (!post) return;

  document.getElementById('post-caption').value = post.caption || '';
  document.getElementById('post-hashtags').value = (post.hashtags || []).join(', ');
  document.getElementById('post-alt-text').value = post.alt_text || '';
  document.getElementById('post-project-type').value = post.project_type || '';
  document.getElementById('post-schedule').value = post.scheduled_at
    ? new Date(post.scheduled_at).toISOString().slice(0, 16) : '';

  // Set platform checkboxes
  (post.platforms || []).forEach(p => {
    const cb = document.getElementById(`plat-${p}`);
    if (cb) cb.checked = true;
  });

  // Show existing image
  const preview = document.getElementById('image-preview');
  if (post.image_url) {
    preview.innerHTML = `<img src="${post.image_url}" alt="Current image">`;
  } else {
    preview.innerHTML = '';
  }

  updateCharCount();
  document.getElementById('post-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('post-modal').classList.remove('open');
  document.body.style.overflow = '';
  editingPostId = null;
}

// ============ FORM SUBMISSION ============

async function handlePostSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('save-btn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const caption = document.getElementById('post-caption').value.trim();
    const hashtagStr = document.getElementById('post-hashtags').value.trim();
    const hashtags = hashtagStr ? hashtagStr.split(',').map(h => h.trim().replace(/^#/, '')) : [];
    const altText = document.getElementById('post-alt-text').value.trim();
    const projectType = document.getElementById('post-project-type').value;
    const scheduleVal = document.getElementById('post-schedule').value;
    const scheduled_at = scheduleVal ? new Date(scheduleVal).toISOString() : null;

    const platforms = [];
    if (document.getElementById('plat-instagram')?.checked) platforms.push('instagram');
    if (document.getElementById('plat-facebook')?.checked) platforms.push('facebook');
    if (document.getElementById('plat-pinterest')?.checked) platforms.push('pinterest');

    // Handle image upload
    const fileInput = document.getElementById('post-image');
    let image_url = null;
    let image_path = null;

    if (fileInput.files.length > 0) {
      const result = await uploadSocialImage(fileInput.files[0]);
      image_url = result.url;
      image_path = result.path;
    }

    const postData = {
      caption: caption || null,
      hashtags,
      alt_text: altText || null,
      project_type: projectType || null,
      platforms,
      scheduled_at
    };

    if (image_url) {
      postData.image_url = image_url;
      postData.image_path = image_path;
    }

    if (editingPostId) {
      await updateSocialPost(editingPostId, postData);
      showToast('Post updated');
    } else {
      postData.created_by = getUserId();
      postData.status = 'draft';
      await createSocialPost(postData);
      showToast('Post created as draft');
    }

    closeModal();
    await loadPosts();
  } catch (err) {
    console.error('Save error:', err);
    showToast('Error saving post. Try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function saveDraft() {
  document.getElementById('post-form').requestSubmit();
}

async function submitForReview() {
  // Save first, then submit
  const form = document.getElementById('post-form');
  const formData = new FormData(form);

  const caption = document.getElementById('post-caption').value.trim();
  const hashtagStr = document.getElementById('post-hashtags').value.trim();
  const hashtags = hashtagStr ? hashtagStr.split(',').map(h => h.trim().replace(/^#/, '')) : [];
  const altText = document.getElementById('post-alt-text').value.trim();
  const projectType = document.getElementById('post-project-type').value;
  const scheduleVal = document.getElementById('post-schedule').value;

  const platforms = [];
  if (document.getElementById('plat-instagram')?.checked) platforms.push('instagram');
  if (document.getElementById('plat-facebook')?.checked) platforms.push('facebook');
  if (document.getElementById('plat-pinterest')?.checked) platforms.push('pinterest');

  const btn = document.getElementById('submit-review-btn');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  try {
    const fileInput = document.getElementById('post-image');
    let image_url = null;
    let image_path = null;

    if (fileInput.files.length > 0) {
      const result = await uploadSocialImage(fileInput.files[0]);
      image_url = result.url;
      image_path = result.path;
    }

    const postData = {
      caption: caption || null,
      hashtags,
      alt_text: altText || null,
      project_type: projectType || null,
      platforms,
      scheduled_at: scheduleVal ? new Date(scheduleVal).toISOString() : null,
      status: 'pending',
      created_by: getUserId()
    };

    if (image_url) {
      postData.image_url = image_url;
      postData.image_path = image_path;
    }

    if (editingPostId) {
      postData.status = 'pending';
      await updateSocialPost(editingPostId, postData);
    } else {
      await createSocialPost(postData);
    }

    showToast('Post submitted for review');
    closeModal();
    await loadPosts();
  } catch (err) {
    console.error('Submit error:', err);
    showToast('Error submitting post.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit for Review';
  }
}

// ============ IMAGE PREVIEW ============

function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('Image must be under 5MB');
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById('image-preview').innerHTML =
      `<img src="${ev.target.result}" alt="Preview">`;
  };
  reader.readAsDataURL(file);
}

// ============ CHAR COUNT ============

function updateCharCount() {
  const textarea = document.getElementById('post-caption');
  const count = textarea.value.length;
  document.getElementById('char-count').textContent = `${count} / 2200`;
}

// ============ HELPERS ============

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============ INIT ============

document.addEventListener('DOMContentLoaded', initSocialQueue);
