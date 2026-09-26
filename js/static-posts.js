// Built-in project posts for the public site.
// Used by supabase-client.js whenever the database cannot be reached,
// so the homepage Latest grid and /social always show project photos.
// To change what shows, edit this list. Images live in /pro_photos.

window.HCHC_STATIC_POSTS = [
  { slug: 'navy-kitchen', title: 'Navy and White Kitchen', image_url: '/pro_photos/navy-kitchen.webp', project_type: 'kitchen', content_tag: 'projects', pinned: true,
    caption: 'Navy lower cabinets, crisp white uppers, and warm undercabinet lighting bring balance to this kitchen.' },
  { slug: 'navy-backsplash-wall', title: 'Marble Backsplash Wall', image_url: '/pro_photos/navy-backsplash-wall.webp', project_type: 'kitchen', content_tag: 'projects', pinned: true,
    caption: 'A marble subway backsplash runs to the ceiling behind a stainless hood for a clean, finished look.' },
  { slug: 'master-bath-spa', title: 'Spa Primary Bath', image_url: '/pro_photos/master-bath-spa.webp', project_type: 'bathroom', content_tag: 'projects', pinned: true,
    caption: 'A calm primary bath designed to feel like a private spa.' },
  { slug: 'living-open-concept', title: 'Open Concept Living', image_url: '/pro_photos/living-open-concept.webp', project_type: 'living', content_tag: 'projects',
    caption: 'An open living space that connects family time, cooking, and entertaining.' },
  { slug: 'walnut-dining', title: 'Walnut Dining Room', image_url: '/pro_photos/walnut-dining.webp', project_type: 'living', content_tag: 'projects',
    caption: 'Rich walnut tones set a warm stage for gathering around the table.' },
  { slug: 'dual-vanity-bath', title: 'Dual Vanity Bath', image_url: '/pro_photos/dual-vanity-bath.webp', project_type: 'bathroom', content_tag: 'projects',
    caption: 'Two vanities and generous storage make busy mornings easier.' },
  { slug: 'sunroom-living', title: 'Sunroom Living', image_url: '/pro_photos/sunroom-living.webp', project_type: 'living', content_tag: 'projects',
    caption: 'A light-filled sunroom styled for relaxed Hill Country living.' },
  { slug: 'cozy-bedroom', title: 'Cozy Bedroom Retreat', image_url: '/pro_photos/cozy-bedroom.webp', project_type: 'bedroom', content_tag: 'projects',
    caption: 'Soft layers and warm textures create a restful bedroom retreat.' },
  { slug: 'guest-bath', title: 'Guest Bath', image_url: '/pro_photos/guest-bath.webp', project_type: 'bathroom', content_tag: 'projects',
    caption: 'A welcoming guest bath with thoughtful finishes.' },
  { slug: 'dark-library', title: 'Moody Library', image_url: '/pro_photos/dark-library.webp', project_type: 'living', content_tag: 'projects',
    caption: 'Deep tones and warm light turn this library into a place to linger.' },
  { slug: 'styled-office', title: 'Styled Home Office', image_url: '/pro_photos/styled-office.webp', project_type: 'living', content_tag: 'projects',
    caption: 'A home office that works hard and still feels like home.' },
  { slug: 'new-heartland', title: 'The New Heartland', image_url: '/pro_photos/new-heartland.webp', project_type: 'moodboard', content_tag: 'tips',
    caption: 'Rich textures, warm metals, and a culinary heart.' },
  { slug: 'modern-contrast', title: 'Modern Contrast Finish Board', image_url: '/pro_photos/modern-contrast.webp', project_type: 'moodboard', content_tag: 'tips',
    caption: 'Soft grays and marble paired with a dark stained cabinet door for modern contrast.' },
  { slug: 'urban-organic', title: 'Urban Organic', image_url: '/pro_photos/urban-organic.webp', project_type: 'moodboard', content_tag: 'tips',
    caption: 'Natural materials with a clean, modern edge.' },
  { slug: 'trad-residence', title: 'Traditional Residence', image_url: '/pro_photos/trad-residence.webp', project_type: 'moodboard', content_tag: 'tips',
    caption: 'Classic details and timeless finishes for a traditional home.' }
].map(function (post) {
  post.id = 'static-' + post.slug;
  post.status = 'published';
  post.alt_text = post.title + ' by Hill Country Home Concepts';
  post.hashtags = ['HillCountryHomeConcepts', 'WarmByDesign'];
  return post;
});
