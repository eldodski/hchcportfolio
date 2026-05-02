// Social Feed — Public Page Logic
// Handles loading published posts, filtering, pagination, and lightbox

const POSTS_PER_PAGE = 12;
let currentOffset = 0;
let currentProjectType = '';
let totalPosts = 0;
let isLoading = false;

// ============ INITIALIZATION ============

async function initFeed() {
  setupFilters();
  await loadFeed(true);
}

// ============ FILTER PILLS ============

function setupFilters() {
  document.querySelectorAll('.feed-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('.feed-filter.active')?.classList.remove('active');
      btn.classList.add('active');
      currentProjectType = btn.dataset.type;
      currentOffset = 0;
      loadFeed(true);
    });
  });
}

// ============ LOAD FEED ============

async function loadFeed(reset) {
  if (isLoading) return;
  isLoading = true;

  const grid = document.getElementById('feed-grid');
  const loadMoreBtn = document.getElementById('load-more');

  if (reset) {
    grid.innerHTML = '<div class="feed-loading">Loading...</div>';
    currentOffset = 0;
  }

  const filters = {
    limit: POSTS_PER_PAGE,
    offset: currentOffset
  };
  if (currentProjectType) filters.project_type = currentProjectType;

  const [posts, count] = await Promise.all([
    getPublishedPosts(filters),
    reset ? getPublishedPostCount(currentProjectType ? { project_type: currentProjectType } : {}) : Promise.resolve(totalPosts)
  ]);

  if (reset) {
    totalPosts = count;
    grid.innerHTML = '';
  }

  if (posts.length === 0 && currentOffset === 0) {
    grid.innerHTML = `
      <div class="feed-empty">
        <p>No posts yet. Check back soon for updates on our latest projects.</p>
      </div>`;
    loadMoreBtn.style.display = 'none';
    isLoading = false;
    return;
  }

  const html = posts.map(post => renderFeedCard(post)).join('');
  grid.insertAdjacentHTML('beforeend', html);

  currentOffset += posts.length;
  loadMoreBtn.style.display = currentOffset < totalPosts ? 'block' : 'none';

  // Observe newly added images for lazy loading
  observeImages();
  isLoading = false;
}

// ============ FEED CARD ============

function renderFeedCard(post) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const caption = post.caption || '';
  const shortCaption = caption.length > 120 ? caption.substring(0, 120) + '...' : caption;
  const hashtags = (post.hashtags || []).map(h => `#${h}`).join(' ');

  const imgSrc = post.image_url || '';
  const altText = post.alt_text || 'Design project by Hill Country Home Concepts';

  return `
    <article class="feed-card" onclick="openLightbox(this)"
      data-image="${escapeAttr(imgSrc)}"
      data-caption="${escapeAttr(caption)}"
      data-hashtags="${escapeAttr(hashtags)}"
      data-date="${escapeAttr(date)}"
      data-alt="${escapeAttr(altText)}">
      ${imgSrc
        ? `<img data-src="${imgSrc}" alt="${escapeAttr(altText)}" class="feed-img lazy">`
        : `<div class="feed-img-empty"></div>`}
      <div class="feed-overlay">
        <p class="feed-overlay-caption">${escapeHtml(shortCaption)}</p>
        <span class="feed-overlay-date">${date}</span>
      </div>
    </article>`;
}

// ============ LIGHTBOX ============

function openLightbox(card) {
  const lb = document.getElementById('lightbox');
  const imgSrc = card.dataset.image;
  const caption = card.dataset.caption;
  const hashtags = card.dataset.hashtags;
  const date = card.dataset.date;
  const alt = card.dataset.alt;

  document.getElementById('lb-img').src = imgSrc;
  document.getElementById('lb-img').alt = alt;
  document.getElementById('lb-caption').textContent = caption;
  document.getElementById('lb-hashtags').textContent = hashtags;
  document.getElementById('lb-date').textContent = date;

  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('lb-img').src = '';
}

// Close on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.id === 'lightbox') closeLightbox();
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// ============ LAZY LOADING ============

let imgObserver;

function observeImages() {
  if (!imgObserver) {
    imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imgObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px 0px' });
  }

  document.querySelectorAll('.feed-img.lazy').forEach(img => {
    imgObserver.observe(img);
  });
}

// ============ HELPERS ============

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  return (text || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ============ INIT ============

document.addEventListener('DOMContentLoaded', initFeed);
