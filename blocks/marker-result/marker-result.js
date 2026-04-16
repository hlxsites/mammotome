import { getMarkerRecommendations } from '../../scripts/lib-franklin.js';

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwZYd5rhFtYLc0SaBDvq_lz_m5CzEG4PmPcsJBYMWbkSKEP4UNgObFh1XrxMs-vn5ME/exec';

const CLOSE_BTN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="8.5 8.5 7 7" width="24" height="24">
      <line stroke="currentColor" x1="14.1213" y1="9.87866" x2="9.8787" y2="14.1213" stroke-width="1.7" stroke-linecap="square"/>
      <line stroke="currentColor" x1="9.87866" y1="9.87866" x2="14.1213" y2="14.1213" stroke-width="1.7" stroke-linecap="square"/>
    </svg>`;

const ICON_PLAYVIDEO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="99.2px" height="99.2px">'
  + '    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>'
  + '    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>'
  + '</svg>';

const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
const VIMEO_REGEX = /(?:vimeo\.com\/)(?:video\/)?(\d+)/;

const escapeHtml = (str) => {
  if (str == null || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const stripHtmlForAlt = (str) => {
  if (str == null || typeof str !== 'string') return '';
  return str.replace(/<[^>]+>/g, '').trim();
};

const allowTrademarkHtml = (str) => {
  const escaped = escapeHtml(str);
  return escaped.replace(
    /&lt;sup&gt;(.*?)&lt;\/sup&gt;/gs,
    (_, content) => `<sup>${content}</sup>`,
  );
};

const getVideoEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const youtubeMatch = trimmed.match(YOUTUBE_REGEX);
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
  const vimeoMatch = trimmed.match(VIMEO_REGEX);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return trimmed;
};

const getVideoThumbnailUrl = (product) => {
  if (product.videoThumbnail) return product.videoThumbnail;
  const match = (product.video || '').trim().match(YOUTUBE_REGEX);
  if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  return product.cardImage || product.image || '';
};

const isVimeoVideo = (url) => url && typeof url === 'string' && VIMEO_REGEX.test(url.trim());

const vimeoThumbnailCache = new Map();

async function fetchVimeoThumbnail(videoUrl) {
  const trimmed = (videoUrl || '').trim();
  if (!trimmed) return null;
  const cached = vimeoThumbnailCache.get(trimmed);
  if (cached !== undefined) return cached;
  try {
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(trimmed)}&maxwidth=640`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();
    const thumb = data?.thumbnail_url || null;
    vimeoThumbnailCache.set(trimmed, thumb);
    return thumb;
  } catch {
    vimeoThumbnailCache.set(trimmed, null);
    return null;
  }
}

async function applyVimeoThumbnails(container) {
  if (!container) return;
  const buttons = container.querySelectorAll('.product-video-thumbnail[data-vimeo-url]');
  await Promise.all([...buttons].map(async (btn) => {
    const url = btn.dataset.vimeoUrl;
    const img = btn.querySelector('img');
    if (!url || !img) return;
    const thumb = await fetchVimeoThumbnail(url);
    if (thumb) img.src = thumb;
  }));
}

/**
 * Look up a product by id from getMarkerRecommendations().
 *
 * The products map is keyed by lowercase id (see lib-franklin.js);
 * sheet/API values may be any case.
 */
function getProductById(products, rawId) {
  if (rawId == null) return null;
  const key = String(rawId).trim().toLowerCase();
  if (!key) return null;
  return products[key] ?? null;
}

/**
 * Sheet / Apps Script GET responses may nest the row or use different header casings.
 * Merge known wrapper objects so column names like second_product_id resolve reliably.
 */
function flattenSheetPayload(data) {
  const merged = { ...(data && typeof data === 'object' ? data : {}) };
  ['row', 'record', 'payload', 'data'].forEach((wrapKey) => {
    const inner = data?.[wrapKey];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      Object.assign(merged, inner);
    }
  });
  return merged;
}

/**
 * First non-empty string for any key.
 *
 * Quiz POST uses camelCase; sheet columns may be snake_case.
 */
function firstSheetString(obj, keys) {
  if (!obj) return '';
  const hit = keys.map((key) => {
    if (!(key in obj)) return '';
    const v = obj[key];
    if (v == null) return '';
    return String(v).trim();
  }).find((s) => s !== '');
  return hit || '';
}

const openProductVideo = (embedUrl) => {
  if (!embedUrl) return;
  const overlay = document.createElement('div');
  overlay.className = 'product-video-overlay';
  overlay.innerHTML = `
        <div class="product-video-backdrop" aria-hidden="true"></div>
        <div class="product-video-lightbox">
          <button type="button" class="product-video-close" aria-label="Close video">${CLOSE_BTN_SVG}</button>
          <iframe class="product-video-iframe" src="${escapeHtml(embedUrl)}" title="Product video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
      `;
  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
  };
  overlay.querySelector('.product-video-backdrop').addEventListener('click', close);
  overlay.querySelector('.product-video-close').addEventListener('click', close);
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  document.body.style.overflow = 'hidden';
  document.body.appendChild(overlay);
};

export default async function decorate(block) {
  const params = new URLSearchParams(window.location.search);
  const uuid = params.get('uuid');
  const token = params.get('token');
  const tokenCreatedAt = params.get('tokenCreatedAt');
  const debug = params.get('debug') === '1';

  if (!uuid || !token || !tokenCreatedAt) {
    block.innerHTML = '<p>Invalid or missing results link.</p>';
    return;
  }

  block.innerHTML = `
      <div class="product-survey-container">
        <div class="survey-card results-card">
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading your results...</p>
          </div>
        </div>
      </div>`;

  try {
    const url = `${SHEET_URL}?uuid=${encodeURIComponent(uuid)}&token=${encodeURIComponent(token)}&tokenCreatedAt=${encodeURIComponent(tokenCreatedAt)}`;
    const [data, { products }] = await Promise.all([
      fetch(url, { redirect: 'follow' }).then((res) => res.json()),
      getMarkerRecommendations(),
    ]);

    if (!data || !data.success) {
      block.innerHTML = `<p>Unable to load results: ${escapeHtml((data && data.error) || 'Unknown error')}</p>`;
      return;
    }

    const sheet = flattenSheetPayload(data);

    const topProductId = firstSheetString(sheet, [
      'recommendedProductId',
      'recommended_product_id',
      'top_product_id',
      'topProductId',
    ]);
    const secondProductId = firstSheetString(sheet, [
      'secondProductId',
      'second_product_id',
      'Second_Product_Id',
    ]);
    const thirdProductId = firstSheetString(sheet, [
      'thirdProductId',
      'third_product_id',
      'Third_Product_Id',
    ]);

    const topProduct = getProductById(products, topProductId);
    const secondProduct = getProductById(products, secondProductId);
    const thirdProduct = getProductById(products, thirdProductId);

    if (!topProduct) {
      block.innerHTML = '<p>Product recommendation not found.</p>';
      return;
    }

    const alternativeEntries = [secondProduct, thirdProduct].filter(Boolean);

    const hasProductVideo = Boolean(topProduct.video);

    block.innerHTML = `
        <div class="section marker-result-header-container">
          <div class="marker-result-header-wrapper">
            <div class="marker-result-header block">
              <div class="marker-result-hero-spacer" aria-hidden="true"></div>
              <div class="marker-result-hero-media" aria-hidden="true">
                <img src="${escapeHtml(topProduct.cardImage || topProduct.image)}" alt="" />
              </div>
              <div class="marker-result-hero-content">
                <div class="marker-result-hero-text-inner">
                  <p class="top-recommendation-label">Your top recommended marker</p>
                  <h1 class="top-recommendation-name">${allowTrademarkHtml(topProduct.name)}</h1>
                  <div class="top-recommendation-description">${allowTrademarkHtml(topProduct.description)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section marker-result-features-container">
          <div class="marker-result-features-wrapper">
            <div class="marker-result-features block">
              <div class="product-survey-container">
                <div class="features-video-section ${hasProductVideo ? 'has-video' : 'no-video'}">
                  <div class="features-section-inner">
                    <h2 class="features-section-title">Product Features</h2>
                    ${topProduct.featuredPhoto ? `
                    <div class="features-section-featured-row">
                      <div class="product-featured-photo">
                        <img src="${escapeHtml(topProduct.featuredPhoto)}" alt="Featured" />
                      </div>
                    </div>
                    ` : ''}
                    <div class="features-section-content">
                      <div class="features-container">
                        <ul class="top-recommendation-features">
                          ${(topProduct.features || []).map((f) => `<li>${allowTrademarkHtml(f)}</li>`).join('')}
                        </ul>
                      </div>
                      ${hasProductVideo ? `
                      <div class="features-media-column">
                        <button type="button" class="product-video-thumbnail" data-video-url="${escapeHtml(getVideoEmbedUrl(topProduct.video))}" ${isVimeoVideo(topProduct.video) ? `data-vimeo-url="${escapeHtml(topProduct.video.trim())}"` : ''} aria-label="Play video">
                          <img src="${escapeHtml(getVideoThumbnailUrl(topProduct))}" alt="Play video" />
                          <span class="icon-playvideo">${ICON_PLAYVIDEO_SVG}</span>
                        </button>
                      </div>
                      ` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="product-survey-container">
          <div class="survey-card results-card marker-result-body-card">
            <div class="results-container">
              ${alternativeEntries.length > 0 ? `
              <div class="alternatives-section">
                <h3>You Should Also Consider</h3>
                <div class="alternatives-grid">
                  ${alternativeEntries.map((prod) => `
                    <div class="product-card">
                      <div class="product-image">
                        <img src="${escapeHtml(prod.recommendationImage || prod.cardImage || prod.image)}" alt="${stripHtmlForAlt(prod.name)}" />
                      </div>
                      <h4>${allowTrademarkHtml(prod.name)}</h4>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}


              <hr class="divider primary">
                  <div class="contact-section">
                <h2>Would you like more information about these markers?</h2>
                <div class="contact-buttons">
                  <button type="button" class="btn btn-contact-primary" id="contact-yes-btn" onclick="window.location.href='/contact/';">Learn More</button>
                </div>
              </div>

              ${(topProduct.footnotes || []).length ? `
              <div class="product-footnotes">
                <ol class="footnotes-list">
                  ${(topProduct.footnotes || []).map((fn) => `<li class="footnote">${allowTrademarkHtml(fn)}</li>`).join('')}
                </ol>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
    `;

    block.querySelectorAll('.product-video-thumbnail').forEach((btn) => {
      btn.addEventListener('click', () => openProductVideo(btn.dataset.videoUrl));
    });

    block.querySelector('#marker-result-copy-link')?.addEventListener('click', async () => {
      const confirmation = block.querySelector('#marker-result-copy-confirmation');
      try {
        await navigator.clipboard.writeText(window.location.href);
        if (confirmation) {
          confirmation.style.display = 'block';
          setTimeout(() => { confirmation.style.display = 'none'; }, 4000);
        }
      } catch (e) {
        // eslint-disable-next-line no-alert
        window.prompt('Copy this link to share your results:', window.location.href);
      }
    });

    block.querySelector('#contact-no-btn')?.addEventListener('click', () => {
      // eslint-disable-next-line no-alert
      alert('Thank you for reviewing your results!');
    });

    applyVimeoThumbnails(block).catch(() => {});
  } catch (err) {
    if (debug) {
      const message = err?.message ? String(err.message) : String(err);
      block.innerHTML = `<p>Something went wrong loading your results: ${escapeHtml(message)}</p>`;
      return;
    }
    block.innerHTML = '<p>Something went wrong loading your results. Please try again later.</p>';
  }
}
