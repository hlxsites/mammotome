import {
  readBlockConfig,
  loadScript,
  getMarkerRecommendations,
  toClassName,
} from '../../scripts/lib-franklin.js';

// GOOGLE SHEETS CONFIGURATION & SECURITY
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzhlsHkta-gTlzlb7yA95X2QmgaXci7olEZZZJ9DhSb9s-WZtyBzKO-iNfg9wYiA0UT/exec';

const CLIENT_SECRET = '82e499ca-32c2-4e6c-a983-12f4f7ea7a36';

const ALLOWED_ORIGINS = [
  'https://www.mammotome.com',
  'https://mammotome.com',
  'https://*--mammotome--hlxsites.aem.page',
  'http://localhost:3000',
];

// SECURITY UTILITY FUNCTIONS
/**
   * Validate current page origin (client-side CORS check)
   */
const isOriginAllowed = () => {
    if (typeof window === 'undefined') return false;
    const currentOrigin = window.location.origin;
  
    return ALLOWED_ORIGINS.some((allowed) => {
      if (allowed.includes('*')) {
        const pattern = allowed
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(currentOrigin);
      }
      try {
        return currentOrigin === new URL(allowed).origin;
      } catch {
        return false;
      }
    });
  }

/**
   * Validate response data structure before sending
   */
const validateGoogleSheetsPayload = (payload) => {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('Payload must be a JSON object');
  }

  if (!payload.date_time) errors.push('Missing date_time');
  if (!payload.current_bx_markers) errors.push('Missing current_bx_markers');
  if (!payload.top_product_id) errors.push('Missing top_product_id');

  return { valid: errors.length === 0, errors };
}

/**
   * Sanitize user agent to prevent injection attacks
   */
const sanitizeUserAgent = (ua) => {
  if (!ua || typeof ua !== 'string') return '';
  return ua.substring(0, 500);
};

// ENHANCED GOOGLE SHEETS SUBMISSION FUNCTION
/**
   * Send quiz response to Google Sheets via Apps Script
   * Enhanced with security layers while maintaining compatibility with existing code
   *
   * @param {object} payload - Response data from buildSheetPayload()
   * @param {object} userInfo - Optional {name, email, facility} from lead form
   * @param {object} options - Optional {includeUserAgent, timeout}
   */
async function sendToSheet(payload, userInfo = {}, options = {}) {
  // Validate origin
  if (!isOriginAllowed()) {
    // eslint-disable-next-line no-console
    console.warn('[Marker Quiz] Request origin not allowed');
    return;
  }

  // Validate payload structure
  const validation = validateGoogleSheetsPayload(payload);
  if (!validation.valid) {
    // eslint-disable-next-line no-console
    console.error('[Marker Quiz] Invalid payload:', validation.errors);
    return;
  }

  const controller = new AbortController();
  const timeout = options.timeout || 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Build Google Sheets request body
    // Convert buildSheetPayload() output to Google Sheets format
    const requestBody = {
      // Authentication
      clientSecret: CLIENT_SECRET,

      // Quiz responses (from buildSheetPayload())
      responses: {
        q1_current_markers: payload.current_bx_markers || '',
        q2_modalities: [payload.modality || ''],
        q3_ranked_priorities: [
          payload.priority_1 || '',
          payload.priority_2 || '',
          payload.priority_3 || '',
          payload.priority_4 || '',
        ],
        q4_patient_cases: (payload.patient_cases || '').split(', ').filter(Boolean),
        q5_migration_frequency_text: payload.migration_concern || '',
        q6_bleeding_frequency_text: payload.bleeding_concern || '',
        q7_natural_rating: payload.natural_rating || 0,
        q7_nick_rating: payload.nickel_rating || 0,
      },

      // Product scores
      scores: {
        hydromark: payload.all_scores?.hm || 0,
        hydromark_plus: payload.all_scores?.hmplus || 0,
        mammomark: payload.all_scores?.mammomark || 0,
        mammostar: payload.all_scores?.mammostar || 0,
        biomarc: payload.all_scores?.biomarc || 0,
        lumimark: payload.all_scores?.lumimark || 0,
      },

      // Recommendation
      recommendedProductId: payload.top_product_id || '',

      // User info
      email: userInfo.email || '',

      // Browser info
      userAgent: sanitizeUserAgent(navigator.userAgent),
      clientIp: options.clientIp || '',

      // Timestamp
      timestamp: payload.date_time || new Date().toISOString(),
    };

    // Send POST request
    const response = await fetch(SHEET_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    // Handle response
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.warn(`[Marker Quiz] Server returned ${response.status}`);
      return;
    }

    const data = await response.json();

    if (data.success && data.uuid) {
      // eslint-disable-next-line no-console
      console.log('[Marker Quiz] Response saved with UUID:', data.uuid);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('markerQuizUuid', data.uuid);
      }
    } else if (data.error) {
      // eslint-disable-next-line no-console
      console.warn('[Marker Quiz] Server error:', data.error);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      // eslint-disable-next-line no-console
      console.warn('[Marker Quiz] Request timeout after', timeout, 'ms');
    } else {
      // eslint-disable-next-line no-console
      console.warn('[Marker Quiz] Sheet submission failed (non-blocking):', error?.message);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

const CLOSE_BTN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="8.5 8.5 7 7" width="24" height="24">
      <line stroke="currentColor" x1="14.1213" y1="9.87866" x2="9.8787" y2="14.1213" stroke-width="1.7" stroke-linecap="square"/>
      <line stroke="currentColor" x1="9.87866" y1="9.87866" x2="14.1213" y2="14.1213" stroke-width="1.7" stroke-linecap="square"/>
    </svg>`;

const CLOSE_BTN_HTML = `<button class="survey-close-btn" id="close-survey-btn" aria-label="Close survey">${CLOSE_BTN_SVG}</button>`;

const START_LOGO_URL = 'https://main--mammotome--hlxsites.aem.page/assets/images/mammotome-markers-logo-transparent.png';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e0e0e0' width='400' height='300'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16'%3EPlaceholder%3C/text%3E%3C/svg%3E";

const ICON_PLAYVIDEO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="99.2px" height="99.2px">'
      + '    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>'
      + '    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>'
      + '</svg>';

const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
const VIMEO_REGEX = /(?:vimeo\.com\/)(?:video\/)?(\d+)/;

/** Drag threshold (px) — higher = less accidental drag. */
const DRAG_THRESHOLD_DEFAULT = 3;
/** QMB-T Tizen: larger threshold for big touch displays. */
const DRAG_THRESHOLD_QMB_T = 10;

const isQmbTDisplay = () => {
  return typeof window !== 'undefined'
          && window.innerWidth >= 2160
          && window.innerHeight >= 3840;
}

const getDragThreshold = () => {
  return isQmbTDisplay() ? DRAG_THRESHOLD_QMB_T : DRAG_THRESHOLD_DEFAULT;
}

const escapeHtml = (str) => {
  if (str == null || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const getVideoEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const youtubeMatch = trimmed.match(YOUTUBE_REGEX);
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
  const vimeoMatch = trimmed.match(VIMEO_REGEX);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return trimmed;
}

const getVideoThumbnailUrl = (product) => {
  if (product.videoThumbnail) return product.videoThumbnail;
  const match = (product.video || '').trim().match(YOUTUBE_REGEX);
  if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  return product.cardImage || product.image || '';
}

const isVimeoVideo = (url) => {
  return url && typeof url === 'string' && VIMEO_REGEX.test(url.trim());
}

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
}

/**
   * Strips HTML for use in alt attributes (plain text only).
   */
const stripHtmlForAlt = (str) => {
  if (str == null || typeof str !== 'string') return '';
  return str.replace(/<[^>]+>/g, '').trim();
};

/**
   * Escapes HTML but allows safe markup (<sup>TM</sup>, <sup>®</sup>, <sup>1,2,3</sup>, etc.)
   * from authoring. Use for authoring-sourced text with trademark symbols or reference numbers.
   */
const allowTrademarkHtml = (str) => {
  const escaped = escapeHtml(str);
  return escaped.replace(
    /&lt;sup&gt;(.*?)&lt;\/sup&gt;/gs,
    (_, content) => `<sup>${content}</sup>`,
  );
}

/**
   * Reads block config like readBlockConfig but uses innerHTML for text cells
   * so authoring markup like <sup>TM</sup> is preserved.
   */
const loadScriptAsync = (src) => new Promise((resolve, reject) => {
  loadScript(src, (type) => {
    if (type === 'error') reject(new Error(`Failed to load script: ${src}`));
    else resolve();
  });
});

const embedMarketoForm = async (container, formId) => {
  await loadScriptAsync('//www2.mammotome.com/js/forms2/js/forms2.min.js');
  const formElement = document.createElement('form');
  formElement.id = `mktoForm_${formId}`;
  container.appendChild(formElement);
  window.MktoForms2.loadForm('//www2.mammotome.com', '435-TDP-284', formId);
  return new Promise((resolve) => {
    window.MktoForms2.whenReady(resolve);
  });
};

const readBlockConfigWithHtml = (block) => {
  const config = readBlockConfig(block);
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2 || !cols[1]) return;
    const col = cols[1];
    if (col.querySelector('a') || col.querySelector('img')) return;
    const name = toClassName(cols[0].textContent);
    const p = col.querySelector('p:only-child');
    const html = (p ? p.innerHTML : col.innerHTML)?.trim?.() ?? '';
    if (html) config[name] = html;
  });
  return config;
}

const RANK_SCORES = {
  type: 'ranked_capability',
  label_to_capability: {
    'Long-term ultrasound visibility': 'long_term_us_visibility',
    'Migration from Deployment Site': 'anti_migration',
    'Ease of Locating': 'locating',
    Affordability: 'affordability',
  },
  rank_weights: {
    1: 6, 2: 4, 3: 2, 4: 1,
  },
  q3_capability_ratings: {
    hm: {
      long_term_us_visibility: 4,
      anti_migration: 2,
      locating: 5,
      affordability: 2,
    },
    hmplus: {
      long_term_us_visibility: 4,
      anti_migration: 4,
      locating: 5,
      affordability: 1,
    },
    mammomark: {
      long_term_us_visibility: 2,
      anti_migration: 5,
      locating: 1,
      affordability: 5,
    },
    mammostar: {
      long_term_us_visibility: 4,
      anti_migration: 3,
      locating: 2,
      affordability: 3,
    },
    lumimark: {
      long_term_us_visibility: 3,
      anti_migration: 3,
      locating: 3,
      affordability: 4,
    },
    biomarc: {
      long_term_us_visibility: 1,
      anti_migration: 1,
      locating: 1,
      affordability: 5,
    },
  },
};

const SORTABLE_OPTIONS = Object.entries(RANK_SCORES.label_to_capability).map(([text, key]) => ({
  text,
  key,
}));

/** MRI-specific sortable options when user selects MRI in modality (Q1). */
const RANK_SCORES_MRI = {
  type: 'ranked_capability',
  label_to_capability: {
    'Accurate Placement': 'accurate_placement',
    'MRI Artifact Size': 'mri_artifact_size',
    'Migration from Deployment Site': 'migration_from_deployment_site',
    'Duration of Ultrasound Visibility': 'duration_of_ultrasound_visibility',
  },
  rank_weights: {
    1: 6, 2: 4, 3: 2, 4: 1,
  },
  q3_capability_ratings: {
    hm: {
      accurate_placement: 3,
      mri_artifact_size: 2,
      migration_from_deployment_site: 1,
      duration_of_ultrasound_visibility: 5,
    },
    hmplus: {
      accurate_placement: 5,
      mri_artifact_size: 5,
      migration_from_deployment_site: 5,
      duration_of_ultrasound_visibility: 5,
    },
    mammomark: {
      accurate_placement: 4,
      mri_artifact_size: 5,
      migration_from_deployment_site: 5,
      duration_of_ultrasound_visibility: 2,
    },
    mammostar: {
      accurate_placement: 0,
      mri_artifact_size: 0,
      migration_from_deployment_site: 0,
      duration_of_ultrasound_visibility: 0,
    },
    lumimark: {
      accurate_placement: 0,
      mri_artifact_size: 0,
      migration_from_deployment_site: 0,
      duration_of_ultrasound_visibility: 0,
    },
    biomarc: {
      accurate_placement: 0,
      mri_artifact_size: 0,
      migration_from_deployment_site: 0,
      duration_of_ultrasound_visibility: 0,
    },
  },
};

const SORTABLE_OPTIONS_MRI = Object.entries(
  RANK_SCORES_MRI.label_to_capability,
).map(([text, key]) => ({
  text,
  key,
}));

const RATING_ITEMS = [
  { text: 'Preference for natural markers', key: 'natural' },
  { text: 'Concerns about nickel allergies or metal sensitivities', key: 'nickel_free' },
];

/** Bonus markers for natural preference (rating 3+): mammostar, biomarc */
const NATURAL_BONUS_KEYS = ['mammostar', 'biomarc'];
/** Bonus markers for nickel concerns (rating 3+): mammostar, biomarc, mammomark, hm, hmplus */
const NICKEL_BONUS_KEYS = ['mammostar', 'biomarc', 'mammomark', 'hm', 'hmplus'];

const RATING_SCALE = [
  { value: 1, label: 'Never' },
  { value: 2, label: '' },
  { value: 3, label: 'Sometimes' },
  { value: 4, label: '' },
  { value: 5, label: 'Very frequently' },
];

const PRODUCT_ID_ALIASES = {
  hm: ['hm', 'hydromark', 'hydro-mark', 'hydro mark'],
  hmplus: ['hmplus', 'hydromark-plus', 'hydromarkplus', 'hydro-mark-plus'],
  mammomark: ['mammomark', 'mammomark-cormark', 'mammomark-cormark', 'cormark'],
  mammostar: ['mammostar', 'mammo-star'],
  lumimark: ['lumimark', 'lumi-mark'],
  biomarc: ['biomarc', 'biomar', 'biomar-c'],
};

const CHEVRON_SVG = `<svg class="checkbox-group-chevron" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
    </svg>`;

/**
   * Parses the block for sortable option image rows. Expects rows where:
   * - Column 1: "Question N - Keyword" (e.g. "Question 3 - Ultrasound")
 *   — keyword matches option text
   * - Column 1 (legacy): "Question N Option M" (e.g. "Question 3 Option 1")
   * - Column 2: Up to 4 images
   * @param {Element} block The marker-quiz block
   * @returns {Object} question number -> { byKeyword, byIndex }
   */
const parseSortableOptionImagesFromBlock = (block) => {
  const result = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;
    const label = cols[0].textContent.trim();
    const imgs = [...cols[1].querySelectorAll('img')]
      .slice(0, 4)
      .map((img) => img.src)
      .filter(Boolean);
    if (imgs.length === 0) return;

    const keywordMatch = label.match(/^Question\s*(\d+)\s*-\s*(.+)$/i);
    const optionMatch = label.match(/^Question\s*(\d+)\s+Option\s*(\d+)$/i);

    const questionNum = parseInt(keywordMatch?.[1] || optionMatch?.[1], 10);
    if (!result[questionNum]) result[questionNum] = { byKeyword: {}, byIndex: {} };

    if (keywordMatch) {
      const keyword = keywordMatch[2].trim();
      if (keyword) result[questionNum].byKeyword[keyword] = imgs;
    } else if (optionMatch) {
      const optionIdx = parseInt(optionMatch[2], 10) - 1;
      if (optionIdx >= 0) result[questionNum].byIndex[optionIdx] = imgs;
    }
  });
  return result;
}

/**
   * Finds images for an option by matching keyword to option text, or by index (legacy).
   * @param {Object} optionImages Parsed option images for a question
   * @param {Object} opt Option with .text
   * @param {number} fallbackIndex Legacy option index
   * @returns {string[]} Image URLs
   */
const getOptionImages = (optionImages, opt, fallbackIndex) => {
  if (!optionImages) return (opt.images || []).slice(0, 4);
  const text = (opt.text || '').toLowerCase();
  const byKeyword = optionImages.byKeyword || {};
  const keywords = Object.keys(byKeyword)
    .filter((k) => text.includes(k.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  if (keywords.length > 0) return (byKeyword[keywords[0]] || []).slice(0, 4);
  const byIndex = optionImages.byIndex || {};
  return (byIndex[fallbackIndex] ?? optionImages[fallbackIndex] ?? opt.images ?? []).slice(0, 4);
}

/**
   * Parses the block for question image rows. Expects rows where:
   * - Column 1: "Question N" (e.g. "Question 1", "Question 7")
   * - Column 2: An image and placement text ("left" or "right") underneath
   * @param {Element} block The marker-quiz block
   * @returns {Object} Map of question number -> { image, placement }
   */
const parseQuestionImagesFromBlock = (block) => {
  const result = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;
    const label = cols[0].textContent.trim();
    const match = label.match(/^Question\s*(\d+)$/i);
    if (!match) return;
    const questionNum = parseInt(match[1], 10);
    const col = cols[1];

    const img = col.querySelector('img');
    if (!img || !img.src) return;

    let placement = 'left';
    const ps = [...col.querySelectorAll('p')];
    const placementP = ps.find((p) => !p.querySelector('img'));
    if (placementP) {
      const pl = placementP.textContent.trim().toLowerCase();
      if (pl === 'right') placement = 'right';
      else if (pl === 'left') placement = 'left';
    } else {
      const directText = col.childNodes && [...col.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
        .map((n) => n.textContent.trim().toLowerCase())
        .join(' ');
      if (directText.includes('right')) placement = 'right';
    }

    result[questionNum] = { image: img.src, placement };
  });
  return result;
}

/**
   * Parses a "Sub-header" row from the block, extracting both image and text.
   * @param {Element} block
   * @returns {{ image: string, text: string } | null}
   */
const parseSubHeaderFromBlock = (block) => {
  let image = '';
  let text = '';
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;
    const label = toClassName(cols[0].textContent);
    if (label !== 'sub-header' && label !== 'subheader') return;
    const col = cols[1];
    const img = col.querySelector('img');
    if (img) image = img.src;
    const ps = [...col.querySelectorAll('p')];
    const textP = ps.find((p) => !p.querySelector('img') && !p.querySelector('picture'));
    if (textP) {
      text = textP.innerHTML.trim();
    }
  });
  return image || text ? { image, text } : null;
}

class MarkerQuiz {
  constructor(block, config, products) {
    this.block = block;
    this.config = config;
    this.products = products;
    this.loading = true;
    this.showStartScreen = true;
    this.emailResultsFormId = config['email-results-form-id'] || config.emailresultsformid || null;
    this.questionImages = config.questionImages || {};
    this.questions = [];
    this.currentStep = 0;
    this.selections = {};
    this.scores = {};
  }

  bindCloseBtn() {
    this.block.querySelector('#close-survey-btn')
      ?.addEventListener('click', () => this.exitFullscreen());
  }

  async init() {
    this.loading = false;
    this.render();
  }

  render() {
    if (this.loading) {
      this.block.innerHTML = `
            <div class="product-survey-container">
              <div class="survey-card">
                <div class="loading"><div class="spinner"></div><p>Loading survey...</p></div>
              </div>
            </div>`;
      return;
    }

    if (this.showStartScreen) {
      this.renderStartScreen();
      return;
    }

    this.showQuizForm();
  }

  renderStartScreen() {
    const startTitle = this.config['start-title'] ?? this.config.startTitle ?? this.config.title ?? 'Ready to Explore Your Marker Options?';
    const startDescription = this.config['start-description'] ?? this.config.startDescription ?? this.config.description ?? 'Answer a few questions and we\'ll suggest markers worth discussing. Our team can help continue the conversation to help you find what fits your practice.';
    const startButton = this.config['start-button'] ?? this.config.startButton ?? this.config.button ?? 'Start Assessment';
    const subHeader = this.config.subHeader || {};
    const titleSafe = allowTrademarkHtml(startTitle);
    const descSafe = allowTrademarkHtml(startDescription);
    const btnSafe = allowTrademarkHtml(startButton);

    const subHeaderImageHtml = subHeader.image
      ? `<div class="start-sub-header-image"><img src="${escapeHtml(subHeader.image)}" alt="Mammotome markers" /></div>`
      : '';
    const subHeaderTextHtml = subHeader.text
      ? `<h2 class="start-sub-header-text">${allowTrademarkHtml(subHeader.text)}</h2>`
      : '';

    this.block.innerHTML = `
          <div class="product-survey-container">
            <div class="survey-card">
              <div class="start-logo-banner">
                <img src="${START_LOGO_URL}" alt="Mammotome Markers" />
              </div>
              <div class="start-screen">
                <h1>${titleSafe}</h1>
                ${subHeaderImageHtml}
                ${subHeaderTextHtml}
                <p>${descSafe}</p>
                <button class="btn btn-primary" id="start-survey-btn">${btnSafe}</button>
              </div>
            </div>
          </div>`;

    this.block.querySelector('#start-survey-btn')?.addEventListener('click', () => {
      this.showStartScreen = false;
      this.showQuizForm();
    });
  }

  showQuizForm() {
    document.body.classList.add('survey-fullscreen-active');

    this.block.innerHTML = `
          <div class="product-survey-container survey-fullscreen">
            ${CLOSE_BTN_HTML}
            <div class="progress-bar-container">
              <div class="progress-bar" id="quiz-progress-bar"></div>
            </div>
            <div class="survey-card">
              <div id="quiz-question-display"></div>
              <div class="navigation" id="quiz-nav"></div>
            </div>
          </div>`;

    this.bindCloseBtn();
    this.questions = MarkerQuiz.buildQuestions();
    this.currentStep = 0;
    this.selections = {};
    this.renderStep();
  }

  /**
       * Builds native question definitions — no Marketo DOM parsing required.
       * Mirrors the structure previously extracted from Marketo fieldsets.
       */
  static buildQuestions() {
    return [
      {
        index: 0,
        text: 'Which biopsy site markers do you currently use?',
        type: 'grouped-multi',
        options: [
          { text: 'BiomarC® (Barbell, Tribell)', group: 'Mammotome' },
          { text: 'HydroMARK™ (Barrel, Butterfly)', group: 'Mammotome' },
          { text: 'HydroMARK™ Plus (Dragonfly, Hummingbird)', group: 'Mammotome' },
          { text: 'LumiMARK™ (Tulip, Lotus, Rose)', group: 'Mammotome' },
          { text: 'MammoMARK® (Bowtie, Triple Twist, U-Shape)', group: 'Mammotome' },
          { text: 'MammoSTAR®  (Barbell, Tribell)', group: 'Mammotome' },
          { text: 'Hologic SecurMark® (Buckle, Infinity, Stoplight, Mini Cork, Top Hat)', group: 'Hologic' },
          { text: 'Hologic TriMark® and CelerMark™ (Cork, Hourglass)', group: 'Hologic' },
          { text: 'Hologic TuMark® (Q, X, Vision, Eye, U, Conic)', group: 'Hologic' },
          { text: 'BD Gel Mark UltraCor™ (S, Omega)', group: 'BD' },
          { text: 'BD UltraClip™ (Wing, Ribbon, Coil, Heart, Venus)', group: 'BD' },
          { text: 'BD UltraCor™ Twirl™ (Curls, Clover, Ring)', group: 'BD' },
          { text: 'BD Senomark™ (O, X, M)', group: 'BD' },
          { text: 'Other' },
        ],
        groups: [
          { brand: 'Mammotome', items: [] },
          { brand: 'Hologic', items: [] },
          { brand: 'BD', items: [] },
        ],
        otherOption: { text: 'Other' },
        otherTextInput: { value: '' },
        ungrouped: [],
      },
      {
        index: 1,
        text: 'What modality would you like to explore first?',
        type: 'single',
        options: [
          { text: 'Ultrasound' },
          { text: 'Stereotactic' },
          { text: 'MRI' },
        ],
      },
      {
        index: 2,
        text: 'Rank these features by importance to your practice (drag to reorder, 1 = most important):',
        type: 'sortable',
        options: SORTABLE_OPTIONS.map((o) => ({ ...o })),
        optionsMri: SORTABLE_OPTIONS_MRI.map((o) => ({ ...o })),
      },
      {
        index: 3,
        text: 'Do specific patient case considerations impact your biopsy marker choice? Select all that apply.',
        type: 'multi',
        options: [
          { text: 'Yes, I prefer a less-premium marker for suspected benign lesion.' },
          { text: 'Yes, dense breast tissue impacts my ability to visualize, so I prefer a larger clip or one with ultrasound enhancements.' },
          { text: 'Yes, I prefer smaller markers for superficial lesions, or those in the axilla or near breast implants.' },
          { text: 'Yes, I prefer to use a specific marker brand or shape for each biopsy modality, so I easily know how the biopsy was performed.' },
        ],
      },
      {
        index: 4,
        text: 'How often do you experience marker migration?',
        type: 'single',
        options: [
          { text: 'Often' },
          { text: 'Occasionally' },
          { text: 'Rarely' },
          { text: 'Never' },
        ],
      },
      {
        index: 5,
        text: 'How often do your patients experience excessive bleeding/hematoma?',
        type: 'single',
        options: [
          { text: 'Often' },
          { text: 'Occasionally' },
          { text: 'Rarely' },
          { text: 'Never' },
        ],
      },
      {
        index: 6,
        text: 'How frequently do your patients express the following preferences or needs? Rate each on a scale of 1-5 (1 = Never, 5 = Very frequently)',
        type: 'rating',
        items: RATING_ITEMS.map((item) => ({ ...item })),
      },
    ].map((q) => {
      if (q.type === 'grouped-multi') {
        q.options.forEach((opt) => {
          if (/^other$/i.test(opt.text.trim()) || !opt.group) return;
          const g = q.groups.find((grp) => grp.brand === opt.group);
          if (g) g.items.push(opt);
        });
        q.groups = q.groups.filter((g) => g.items.length > 0);
      }
      return q;
    });
  }

  calculateScores() {
    Object.keys(this.products).forEach((id) => {
      this.scores[id] = 0;
    });

    // Modalities (multi-select) — find by question text since form order may vary
    const modalitiesIdx = this.questions.findIndex(
      (q) => q?.text && /modalit/i.test(q.text),
    );
    if (modalitiesIdx >= 0 && modalitiesIdx in this.selections) {
      const modalitiesQuestion = this.questions[modalitiesIdx];
      const sel = this.selections[modalitiesIdx];
      const modalities = Array.isArray(sel) ? sel : [sel];
      modalities.forEach((optIdx) => {
        const optionText = modalitiesQuestion?.options?.[optIdx]?.text;
        const modalityIndex = MarkerQuiz.getModalityIndexFromOption(optionText, optIdx);
        const modalityScores = MarkerQuiz.getModalityScores(modalityIndex);
        Object.entries(modalityScores).forEach(([productId, points]) => {
          const resolvedId = this.resolveProductId(productId);
          if (resolvedId) {
            this.scores[resolvedId] += points;
          }
        });
      });
    }

    // Q3: Priority ranking (sortable) — branch by modality (MRI vs default)
    const sortableIdx = this.questions.findIndex((q) => q?.type === 'sortable');
    if (sortableIdx >= 0 && this.selections[sortableIdx]) {
      const sortableQuestion = this.questions[sortableIdx];
      const rankOrder = this.selections[sortableIdx];
      const options = this.isMriSelected()
        ? (sortableQuestion.optionsMri ?? SORTABLE_OPTIONS_MRI)
        : (sortableQuestion.options ?? SORTABLE_OPTIONS);
      const rankScores = this.isMriSelected() ? RANK_SCORES_MRI : RANK_SCORES;
      const {
        rank_weights: rankWeights,
        q3_capability_ratings: capRatings,
      } = rankScores;

      rankOrder.forEach((optIdx, rank) => {
        const capability = options[optIdx]?.key;
        if (!capability) return;
        const weight = rankWeights[rank + 1] ?? 1;

        Object.entries(capRatings).forEach(([productId, caps]) => {
          const resolvedId = this.resolveProductId(productId) ?? productId;
          if (resolvedId in this.products) {
            const rating = caps[capability] ?? 0;
            this.scores[resolvedId] += rating * weight;
          }
        });
      });
    }

    // Q4: Patient case considerations (multi-select) — scores vary by modality
    if (this.selections[3]) {
      const sel4 = this.selections[3];
      const cases = Array.isArray(sel4) ? sel4 : [sel4];
      const modalityIndex = this.getPrimaryModalityIndex();
      cases.forEach((optIdx) => {
        const caseScores = MarkerQuiz.getPatientCaseScores(optIdx, modalityIndex);
        Object.entries(caseScores).forEach(([productId, points]) => {
          const resolvedId = this.resolveProductId(productId);
          if (resolvedId) this.scores[resolvedId] += points;
        });
      });
    }

    // Q5: Migration frequency (single-select)
    if (this.selections[4] != null) {
      const migrationScores = MarkerQuiz.getMigrationScores(this.selections[4]);
      Object.entries(migrationScores).forEach(([productId, points]) => {
        const resolvedId = this.resolveProductId(productId);
        if (resolvedId) this.scores[resolvedId] += points;
      });
    }

    // Q6: Bleeding/hematoma frequency (single-select)
    if (this.selections[5] != null) {
      const bleedingScores = MarkerQuiz.getBleedingScores(this.selections[5]);
      Object.entries(bleedingScores).forEach(([productId, points]) => {
        const resolvedId = this.resolveProductId(productId);
        if (resolvedId) this.scores[resolvedId] += points;
      });
    }

    // Q7: Patient preferences (rating 1-5) — nickel allergy excluded when MRI selected
    if (this.selections[6]) {
      const naturalRating = this.selections[6][0] || 1;
      const naturalScores = MarkerQuiz.getAllNatural(naturalRating);
      Object.entries(naturalScores).forEach(([productId, points]) => {
        const resolvedId = this.resolveProductId(productId);
        if (resolvedId) this.scores[resolvedId] += points;
      });

      if (!this.isMriSelected()) {
        const nickelRating = this.selections[6][1] || 1;
        const nickelScores = MarkerQuiz.getNickelScores(nickelRating);
        Object.entries(nickelScores).forEach(([productId, points]) => {
          const resolvedId = this.resolveProductId(productId);
          if (resolvedId) this.scores[resolvedId] += points;
        });
      }
    }
  }

  logCurrentScores(trigger) {
    const saved = { ...this.scores };
    this.calculateScores();
    const sorted = Object.keys(this.scores)
      .map((id) => ({ id, name: this.products[id]?.shortName || id, score: this.scores[id] }))
      .sort((a, b) => b.score - a.score);
      // eslint-disable-next-line no-console
    console.log(
      `%c[Marker Quiz] Scores after: ${trigger}`,
      'color: #84329b; font-weight: bold;',
    );
    // eslint-disable-next-line no-console
    console.table(sorted.map((p, i) => ({ Rank: i + 1, Product: p.name, Score: p.score })));
    this.scores = saved;
  }

  /** Returns primary modality index (0=Ultrasound, 1=Stereotactic, 2=MRI) for scoring. */
  getPrimaryModalityIndex() {
    const modalitiesIdx = this.questions.findIndex(
      (q) => q?.text && /modalit/i.test(q.text),
    );
    if (modalitiesIdx < 0 || !(modalitiesIdx in this.selections)) return 0;
    const modalitiesQuestion = this.questions[modalitiesIdx];
    const sel = this.selections[modalitiesIdx];
    const modalities = Array.isArray(sel) ? sel : [sel];
    let hasMri = false;
    let hasStereotactic = false;
    let hasUltrasound = false;
    modalities.forEach((optIdx) => {
      const optionText = modalitiesQuestion?.options?.[optIdx]?.text;
      const idx = MarkerQuiz.getModalityIndexFromOption(optionText, optIdx);
      if (idx === 2) hasMri = true;
      else if (idx === 1) hasStereotactic = true;
      else if (idx === 0) hasUltrasound = true;
    });
    if (hasMri) return 2;
    if (hasStereotactic) return 1;
    if (hasUltrasound) return 0;
    return 0;
  }

  /** Returns true if user selected MRI in the modality question (Q1). */
  isMriSelected() {
    const modalitiesIdx = this.questions.findIndex(
      (q) => q?.text && /modalit/i.test(q.text),
    );
    if (modalitiesIdx < 0 || !(modalitiesIdx in this.selections)) return false;
    const modalitiesQuestion = this.questions[modalitiesIdx];
    const sel = this.selections[modalitiesIdx];
    const modalities = Array.isArray(sel) ? sel : [sel];
    return modalities.some((optIdx) => {
      const optionText = modalitiesQuestion?.options?.[optIdx]?.text;
      return MarkerQuiz.getModalityIndexFromOption(optionText, optIdx) === 2;
    });
  }

  /** Returns the sortable options to use for the current modality selection (default vs MRI). */
  getSortableOptionsForQuestion(question) {
    if (!question?.optionsMri) return question?.options ?? SORTABLE_OPTIONS;
    return this.isMriSelected() ? question.optionsMri : (question.options ?? SORTABLE_OPTIONS);
  }

  /** Returns rating items for the current modality (excludes nickel allergy when MRI selected). */
  getRatingItemsForQuestion(question) {
    if (question?.type !== 'rating' || !question?.items) return question?.items ?? RATING_ITEMS;
    if (!this.isMriSelected()) return question.items;
    return question.items.filter((item) => item.key !== 'nickel_free');
  }

  /**
       * When natural or nickel rating is 3+, returns the second recommendation as a relevant bonus
       * marker (non-negative score), with contextual language.
       * @returns {{ product: object, reasonLabel: string } | null}
       */
  // eslint-disable-next-line no-unused-vars
  getSecondRecommendationWithContext(topProductId, sortedProducts) {
    const ratingSel = this.selections[6];
    if (!ratingSel || typeof ratingSel !== 'object') return null;

    const naturalRating = ratingSel[0] || 1;
    const nickelRating = this.isMriSelected() ? 0 : (ratingSel[1] || 1);

    const naturalHigh = naturalRating >= 3;
    const nickelHigh = nickelRating >= 3;

    if (!naturalHigh && !nickelHigh) return null;

    let bonusKeys;
    let reasonLabel;
    if (naturalHigh && nickelHigh) {
      bonusKeys = naturalRating >= nickelRating ? NATURAL_BONUS_KEYS : NICKEL_BONUS_KEYS;
      reasonLabel = naturalRating >= nickelRating
        ? 'preference for natural markers'
        : 'concerns about nickel allergies or metal sensitivities';
    } else if (naturalHigh) {
      bonusKeys = NATURAL_BONUS_KEYS;
      reasonLabel = 'preference for natural markers';
    } else {
      bonusKeys = NICKEL_BONUS_KEYS;
      reasonLabel = 'concerns about nickel allergies or metal sensitivities';
    }

    const eligible = bonusKeys
      .map((key) => this.resolveProductId(key))
      .filter((id) => id && id !== topProductId && this.scores[id] >= 0 && id in this.products);

    if (eligible.length === 0) return null;

    const byScore = eligible
      .map((id) => ({ id, score: this.scores[id], ...this.products[id] }))
      .sort((a, b) => b.score - a.score);
    const product = byScore[0];

    return { product, reasonLabel };
  }

  /**
   * When bleeding is "Often" or "Occasionally" and MammoMARK is not already
   * in the top 2 recommendations, returns a bleeding-based recommendation
   * for MammoMARK with contextual language.
   * @param {string} topProductId
   * @param {string[]} alternativeProductIds
   * @returns {{ product: object, reasonLabel: string } | null}
   */
  getBleedingRecommendationContext(topProductId, alternativeProductIds) {
    const bleedingIdx = this.questions.findIndex(
      (q) => q?.text && /bleeding|hematoma/i.test(q.text),
    );
    if (bleedingIdx < 0) return null;

    const bleedingSel = this.selections[bleedingIdx];
    if (bleedingSel !== 0 && bleedingSel !== 1) return null;

    const mammomarkId = this.resolveProductId('mammomark');
    if (!mammomarkId || !(mammomarkId in this.products)) return null;

    if (mammomarkId === topProductId || alternativeProductIds.includes(mammomarkId)) return null;

    const frequencyLabel = bleedingSel === 0 ? 'often' : 'occasionally';
    const product = { id: mammomarkId, ...this.products[mammomarkId] };

    const ratingSel = this.selections[6];
    const nickelRating = (!this.isMriSelected() && ratingSel && typeof ratingSel === 'object')
      ? (ratingSel[1] || 1)
      : 1;
    const nickelHigh = nickelRating >= 3;

    const reasonLabel = nickelHigh
      ? `Because you have patients that ${frequencyLabel} experience bleeding and patients have expressed concerns about nickel allergies or metal sensitivities, we recommend ${allowTrademarkHtml(product.name)}.`
      : `Because your patients ${frequencyLabel} experience excessive bleeding, we recommend ${allowTrademarkHtml(product.name)}.`;

    return { product, reasonLabel };
  }

  /** Maps modality option text to score index (0=Ultrasound, 1=Stereotactic, 2=MRI). */
  static getModalityIndexFromOption(optionText, fallbackIndex) {
    if (!optionText) return fallbackIndex;
    const t = String(optionText).toLowerCase();
    if (/ultrasound/i.test(t)) return 0;
    if (/stereotactic/i.test(t)) return 1;
    if (/\bmri\b/i.test(t)) return 2;
    return fallbackIndex;
  }

  /** Resolves scoring key to actual product ID (handles aliases like hm→hydromark). */
  resolveProductId(scoringKey) {
    if (scoringKey in this.products) return scoringKey;
    const aliases = MarkerQuiz.PRODUCT_ID_ALIASES[scoringKey];
    if (aliases) {
      const byId = aliases.find((id) => id in this.products);
      if (byId) return byId;
      const byName = this.findProductIdByName(scoringKey);
      if (byName) return byName;
    }
    return null;
  }

  findProductIdByName(scoringKey) {
    const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const patterns = {
      hm: (nameNorm) => (nameNorm.includes('hydromark') || nameNorm.includes('hydro mark'))
                  && !nameNorm.includes('plus'),
      hmplus: (nameNorm) => (nameNorm.includes('hydromark') || nameNorm.includes('hydro mark'))
                  && nameNorm.includes('plus'),
      mammomark: (nameNorm) => nameNorm.includes('mammomark') || nameNorm.includes('cormark'),
      mammostar: (nameNorm) => nameNorm.includes('mammostar') || nameNorm.includes('mammo star'),
      lumimark: (nameNorm) => nameNorm.includes('lumimark') || nameNorm.includes('lumi mark'),
      biomarc: (nameNorm) => nameNorm.includes('biomarc') || nameNorm.includes('biomar'),
    };
    const match = patterns[scoringKey];
    if (!match) return null;
    return Object.keys(this.products).find((id) => {
      const prod = this.products[id];
      const nameNorm = norm(prod?.shortName || prod?.name || id);
      return match(nameNorm);
    }) || null;
  }

  static getModalityScores(optionIndex) {
    const scores = [
      // Ultrasound
      {
        hm: 5, hmplus: 5, mammomark: 1, mammostar: 4, biomarc: 1, lumimark: 1,
      },
      // Stereotactic
      // May need to update this in a 2027 because hmplus will be available in ST
      {
        hm: 2, hmplus: -90, mammomark: 5, mammostar: 2, lumimark: -90, biomarc: 2,
      },
      // MRI
      {
        hm: 5, hmplus: 5, mammomark: 5, mammostar: -60, lumimark: -70, biomarc: -60,
      },
    ];
    return scores[optionIndex] || {};
  }

  /**
       * Patient case scores by modality. modalityIndex: 0=Ultrasound, 1=Stereotactic, 2=MRI.
       * @param {number} optionIndex Case option index (0-4)
       * @param {number} modalityIndex 0=Ultrasound, 1=Stereotactic, 2=MRI
       * Order of Options: Benign lesion, dense tissue, small marker, specific marker
       */
  static getPatientCaseScores(optionIndex, modalityIndex = 2) {
    const byModality = [
      // Ultrasound
      [
        {
          hm: 2, hmplus: 0, mammomark: 4, mammostar: 3, lumimark: 5, biomarc: 5,
        },
        {
          hm: 5, hmplus: 5, mammomark: 2, mammostar: 4, lumimark: 2, biomarc: 1,
        },
        {
          hm: 5, hmplus: 4, mammomark: 4, mammostar: 3, lumimark: 1, biomarc: 3,
        },
        {
          hm: 5, hmplus: 1, mammomark: 4, mammostar: 2, lumimark: 1, biomarc: 2,
        },
      ],
      // Stereotactic
      [
        {
          hm: 2, hmplus: 0, mammomark: 4, mammostar: 3, lumimark: 0, biomarc: 5,
        },
        {
          hm: 5, hmplus: 5, mammomark: 2, mammostar: 4, lumimark: 2, biomarc: 1,
        },
        {
          hm: 5, hmplus: 0, mammomark: 4, mammostar: 3, lumimark: 0, biomarc: 3,
        },
        {
          hm: 5, hmplus: 1, mammomark: 4, mammostar: 2, lumimark: 1, biomarc: 2,
        },
      ],
      // MRI ()
      [
        {
          hm: 1, hmplus: 0, mammomark: 2, mammostar: 2, lumimark: 3, biomarc: 4,
        },
        {
          hm: 4, hmplus: 4, mammomark: 2, mammostar: 2, lumimark: 3, biomarc: 2,
        },
        {
          hm: 4, hmplus: 0, mammomark: 2, mammostar: 4, lumimark: 1, biomarc: 4,
        },
        {
          hm: 3, hmplus: 2, mammomark: 3, mammostar: 1, lumimark: 1, biomarc: 1,
        },
      ],
    ];
    const modalityScores = byModality[modalityIndex] ?? byModality[2];
    return modalityScores[optionIndex] || {};
  }

  static getMigrationScores(optionIndex) {
    const scores = [
      // Often
      {
        hm: 1, hmplus: 5, mammomark: 5, mammostar: 1, lumimark: 5, biomarc: 1,
      },
      // Occasionally
      {
        hm: 1, hmplus: 5, mammomark: 5, mammostar: 1, lumimark: 5, biomarc: 1,
      },
      // Rarely
      {
        hm: 0, hmplus: 1, mammomark: 1, mammostar: 0, lumimark: 1, biomarc: 0,
      },
      // Never
      {
        hm: 0, hmplus: 0, mammomark: 0, mammostar: 0, lumimark: 0, biomarc: 0,
      },
    ];
    return scores[optionIndex] || {};
  }

  static getBleedingScores(optionIndex) {
    const scores = [
      // Often
      {
        hm: 0, hmplus: 1, mammomark: 5, mammostar: 0, lumimark: 3, biomarc: 0,
      },
      // Occasionally
      {
        hm: 0, hmplus: 1, mammomark: 5, mammostar: 0, lumimark: 3, biomarc: 0,
      },
      // Rarely
      {
        hm: 0, hmplus: 1, mammomark: 1, mammostar: 0, lumimark: 1, biomarc: 0,
      },
      // Never
      {
        hm: 0, hmplus: 0, mammomark: 0, mammostar: 0, lumimark: 0, biomarc: 0,
      },
    ];
    return scores[optionIndex] || {};
  }

  static getAllNatural(rating) {
    // Rating 1-5, where 5 = Very frequently prefer natural
    const bonusMap = {
      1: 0, 2: 1, 3: 2, 4: 4, 5: 6,
    };
    const penaltyMap = {
      1: 0, 2: 0, 3: -1, 4: -2, 5: -3,
    };

    const bonus = bonusMap[rating] || 0;
    const penalty = penaltyMap[rating] || 0;

    return {
      mammostar: bonus,
      biomarc: bonus,
      hm: penalty,
      hmplus: penalty,
      mammomark: penalty,
      lumimark: penalty,
    };
  }

  static getNickelScores(rating) {
    // Rating 1-5, where 5 = Very frequently have nickel concerns
    const bonusMap = {
      1: 0, 2: 1, 3: 2, 4: 4, 5: 6,
    };
    const penaltyMap = {
      1: 0, 2: 0, 3: -1, 4: -2, 5: -3,
    };

    const bonus = bonusMap[rating] || 0;
    const penalty = penaltyMap[rating] || 0;

    return {
      mammostar: bonus,
      biomarc: bonus,
      mammomark: bonus,
      hm: bonus,
      hmplus: bonus,
      lumimark: penalty,
    };
  }

  buildSheetPayload() {
    const sortedProducts = Object.keys(this.scores)
      .map((id) => ({ id, score: this.scores[id], ...this.products[id] }))
      .sort((a, b) => b.score - a.score);
    const top = sortedProducts[0];

    // ── Current Bx Markers (Q1)
    const markersIdx = this.questions.findIndex(
      (q) => q?.type === 'grouped-multi',
    );
    const markersSel = markersIdx >= 0 ? this.selections[markersIdx] : null;
    let markerIndices = [];
    if (Array.isArray(markersSel)) markerIndices = markersSel;
    else if (markersSel != null) markerIndices = [markersSel];
    const currentBxMarkers = markerIndices
      .map((i) => this.questions[markersIdx]?.options?.[i]?.text || `option ${i}`)
      .join(', ');

    // ── Modality (Q2)
    const modalityIdx = this.questions.findIndex(
      (q) => q?.text && /modalit/i.test(q.text),
    );
    const modalityQ = this.questions[modalityIdx];
    const modalitySel = modalityIdx >= 0 ? this.selections[modalityIdx] : null;
    let modalities = [];
    if (Array.isArray(modalitySel)) modalities = modalitySel;
    else if (modalitySel != null) modalities = [modalitySel];
    const modalityLabels = modalities
      .map((i) => modalityQ?.options?.[i]?.text || `option ${i}`)
      .join(', ');

    // ── Priority ranking (Q3)
    const rankIdx = this.questions.findIndex((q) => q?.type === 'sortable');
    const rankQ = this.questions[rankIdx];
    const rankSel = (rankIdx >= 0 ? this.selections[rankIdx] : null)
        || rankQ?.options?.map((_, i) => i) || [];
    const rankOptions = this.isMriSelected()
      ? (rankQ?.optionsMri ?? SORTABLE_OPTIONS_MRI)
      : (rankQ?.options ?? SORTABLE_OPTIONS);
    const priorities = rankSel.map(
      (origIdx) => rankOptions[origIdx]?.text || `option ${origIdx}`,
    );

    // ── Rating (Q7)
    const ratingIdx = this.questions.findIndex((q) => q?.type === 'rating');
    const ratingSel = (ratingIdx >= 0 ? this.selections[ratingIdx] : null) || {};
    const isMri = this.isMriSelected();
    const bio = Number(ratingSel[0] ?? 0);
    const nick = isMri ? undefined : Number(ratingSel[1] ?? 0);

    // ── Patient cases (Q4)
    const casesIdx = this.questions.findIndex(
      (q) => q?.text && /patient case/i.test(q.text),
    );
    const casesSel = casesIdx >= 0 ? this.selections[casesIdx] : null;
    let cases = [];
    if (Array.isArray(casesSel)) cases = casesSel;
    else if (casesSel != null) cases = [casesSel];
    const patientCases = cases
      .map((i) => this.questions[casesIdx]?.options?.[i]?.text || `option ${i}`)
      .join(', ');

    // ── Migration (Q5)
    const migrationIdx = this.questions.findIndex(
      (q) => q?.text && /migration/i.test(q.text),
    );
    const migrationSel = migrationIdx >= 0 ? this.selections[migrationIdx] : null;
    const migrationConcern = migrationSel != null
      ? (this.questions[migrationIdx]?.options?.[migrationSel]?.text || `option ${migrationSel}`)
      : '';

    // ── Bleeding (Q6)
    const bleedingIdx = this.questions.findIndex(
      (q) => q?.text && /bleeding|hematoma/i.test(q.text),
    );
    const bleedingSel = bleedingIdx >= 0 ? this.selections[bleedingIdx] : null;
    const bleedingConcern = bleedingSel != null
      ? (this.questions[bleedingIdx]?.options?.[bleedingSel]?.text || `option ${bleedingSel}`)
      : '';

    return {
      date_time: new Date().toISOString(),
      top_product_id: top?.id || '',
      top_product_name: top?.name || '',
      top_score: top?.score ?? 0,
      current_bx_markers: currentBxMarkers,
      modality: modalityLabels,
      priority_1: priorities[0] || '',
      priority_2: priorities[1] || '',
      priority_3: priorities[2] || '',
      priority_4: priorities[3] || '',
      patient_cases: patientCases,
      migration_concern: migrationConcern,
      bleeding_concern: bleedingConcern,
      natural_rating: bio,
      ...(nick !== undefined ? { nickel_rating: nick } : {}),
      all_scores: { ...this.scores },
    };
  }

  showResults() {
    const sortedProducts = Object.keys(this.scores)
      .map((id) => ({ id, score: this.scores[id], ...this.products[id] }))
      .sort((a, b) => b.score - a.score);

    const topProduct = sortedProducts[0];
    const bonusContext = this.getSecondRecommendationWithContext(topProduct?.id, sortedProducts);
    const alternativeProducts = bonusContext
      ? [bonusContext.product]
      : sortedProducts.slice(1, 2);
    const alternativeReason = bonusContext
      ? `Because you have patients that have expressed ${bonusContext.reasonLabel}, we recommend ${allowTrademarkHtml(bonusContext.product.name)}.`
      : null;

    const bleedingContext = this.getBleedingRecommendationContext(
      topProduct?.id,
      alternativeProducts.map((p) => p.id),
    );

    this.block.innerHTML = `
          <div class="product-survey-container survey-fullscreen">
            ${CLOSE_BTN_HTML}
            <div class="survey-card results-card">
              <div class="results-container">
                <div class="top-recommendation-hero">
                  <div class="top-recommendation-image">
                    <img src="${escapeHtml(topProduct.cardImage || topProduct.image)}" alt="${stripHtmlForAlt(topProduct.name)}" />
                  </div>
                  <div class="top-recommendation-content">
                    <p class="top-recommendation-label">Your top recommended marker</p>
                    <h1 class="top-recommendation-name">${allowTrademarkHtml(topProduct.name)}</h1>
                    <div class="top-recommendation-description">${allowTrademarkHtml(topProduct.description)}</div>
                  </div>
                </div>
    
                <div class="features-video-section ${(topProduct.video || topProduct.featuredPhoto) ? 'has-video' : 'no-video'}">
                  <div class="features-section-inner">
                    <h2 class="features-section-title">Product Features</h2>
                    <div class="features-section-content">
                      <div class="features-container">
                        <ul class="top-recommendation-features product-features">
                          ${(topProduct.features || []).map((f) => `<li>${allowTrademarkHtml(f)}</li>`).join('')}
                        </ul>
                      </div>
                      ${(topProduct.video || topProduct.featuredPhoto) ? `
                      <div class="features-media-column">
                        ${topProduct.featuredPhoto ? `
                          <div class="product-featured-photo">
                            <img src="${escapeHtml(topProduct.featuredPhoto)}" alt="Featured" />
                          </div>
                        ` : ''}
                        ${topProduct.video ? `
                          <button type="button" class="product-video-thumbnail" data-video-url="${escapeHtml(getVideoEmbedUrl(topProduct.video))}" ${isVimeoVideo(topProduct.video) ? `data-vimeo-url="${escapeHtml(topProduct.video.trim())}"` : ''} aria-label="Play video">
                            <img src="${escapeHtml(getVideoThumbnailUrl(topProduct))}" alt="Play video" />
                            <span class="icon-playvideo">${ICON_PLAYVIDEO_SVG}</span>
                          </button>
                        ` : ''}
                      </div>
                    ` : ''}
                    </div>
                  </div>
                </div>
    
                <div class="quiz-actions-section">
                  <div class="quiz-actions-buttons">
                    <button class="btn btn-quiz-primary" id="request-results-btn">Email My Results</button>
                    <button class="btn btn-quiz-secondary" id="restart-btn">Take Quiz Again</button>
                  </div>
                  ${this.emailResultsFormId ? '<div id="email-results-form-wrapper" class="email-results-form-wrapper" style="display:none;"></div>' : `
                  <div id="lead-capture-form" class="lead-capture-form" style="display:none;">
                    <div class="lead-capture-fields">
                      <input class="lead-input" id="lead-name" type="text" placeholder="Full name" autocomplete="name" />
                      <input class="lead-input" id="lead-email" type="email" placeholder="Work email" autocomplete="email" />
                      <input class="lead-input" id="lead-facility" type="text" placeholder="Facility / institution" autocomplete="organization" />
                    </div>
                    <div class="lead-capture-actions">
                      <button class="btn btn-quiz-primary" id="lead-submit-btn">Submit</button>
                      <button class="btn btn-quiz-secondary" id="lead-cancel-btn">Cancel</button>
                    </div>
                    <p class="lead-capture-error" style="display:none;">Please enter your name and a valid email.</p>
                  </div>
                  <p id="lead-capture-confirmation" class="lead-capture-confirmation" style="display:none;">
                    ✓ Thanks! Your results have been recorded.
                  </p>`}
                </div>
    
                <div class="alternatives-section">
                  <h3>You Should Also Consider</h3>
                  <div class="alternatives-grid">
                    ${alternativeProducts.map((prod) => `
                      <div class="product-card">
                        <div class="product-image">
                          <img src="${escapeHtml(prod.recommendationImage || prod.cardImage || prod.image)}" alt="${stripHtmlForAlt(prod.name)}" />
                        </div>
                        <h4>${allowTrademarkHtml(prod.name)}</h4>
                        ${alternativeReason ? `<p class="card-reason">${alternativeReason}</p>` : ''}
                      </div>
                    `).join('')}
                    ${bleedingContext ? `
                      <div class="product-card">
                        <div class="product-image">
                          <img src="${escapeHtml(bleedingContext.product.recommendationImage || bleedingContext.product.cardImage || bleedingContext.product.image)}" alt="${stripHtmlForAlt(bleedingContext.product.name)}" />
                        </div>
                        <h4>${allowTrademarkHtml(bleedingContext.product.name)}</h4>
                        <p class="card-reason">${bleedingContext.reasonLabel}</p>
                      </div>
                    ` : ''}
                  </div>
                </div>
    
    
                <div class="contact-section">
                  <h3>Would you like to be contacted by a sales rep to learn more?</h3>
                  <div class="contact-buttons">
                    <button class="btn btn-contact-primary" id="contact-yes-btn">Yes, Contact Me</button>
                    <button class="btn btn-contact-secondary" id="contact-no-btn">No, Thank You</button>
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
          </div>`;

    this.bindCloseBtn();
    this.block.querySelector('#restart-btn')?.addEventListener('click', () => this.restart());
    this.block.querySelectorAll('.product-video-thumbnail').forEach((btn) => {
      btn.addEventListener('click', () => openProductVideo(btn.dataset.videoUrl));
    });

    this.block.querySelector('#contact-yes-btn')?.addEventListener('click', () => {
      // eslint-disable-next-line no-alert
      alert('Thank you! A specialist will contact you soon.');
    });

    this.block.querySelector('#contact-no-btn')?.addEventListener('click', () => {
      // eslint-disable-next-line no-alert
      alert('Thank you for taking the quiz!');
    });

    const requestResultsBtn = this.block.querySelector('#request-results-btn');
    const emailFormWrapper = this.block.querySelector('#email-results-form-wrapper');
    
    if (this.emailResultsFormId && requestResultsBtn && emailFormWrapper) {
      requestResultsBtn.addEventListener('click', async () => {
        requestResultsBtn.style.display = 'none';
        emailFormWrapper.style.display = 'block';
        try {
          const form = await embedMarketoForm(emailFormWrapper, this.emailResultsFormId);
          const uuid = sessionStorage.getItem('markerQuizUuid') || '';
    
          // Pre-generate the authenticated results URL
          let resultsUrl = `https://www.mammotome.com/marker-results?uuid=${uuid}`;
          try {
            const linkResponse = await fetch(SHEET_URL, {
              method: 'POST',
              redirect: 'follow',
              body: JSON.stringify({
                clientSecret: CLIENT_SECRET,
                action: 'createEmailLink',
                uuid,
              }),
            });
            const linkData = await linkResponse.json();
            if (linkData.success && linkData.token) {
              resultsUrl += `&token=${linkData.token}&tokenCreatedAt=${Date.now()}`;
            }
          } catch (err) {
            console.warn('[Marker Quiz] Failed to pre-generate link:', err);
          }
    
          form.addHiddenFields({
            Quiz_Results_URL__c: resultsUrl,
          });
    
          form.onSuccess((values) => {
            sendToSheet(this.buildSheetPayload(), { email: values.Email || '' });
            return true;
          });
        } catch (e) {
          console.error('Error loading email results form:', e);
          emailFormWrapper.innerHTML = '<p class="error">Unable to load form. Please try again later.</p>';
        }
      });
    } else if (requestResultsBtn) {
      const leadForm = this.block.querySelector('#lead-capture-form');
      const leadConfirmation = this.block.querySelector('#lead-capture-confirmation');
      const leadError = this.block.querySelector('.lead-capture-error');

      requestResultsBtn.addEventListener('click', () => {
        requestResultsBtn.style.display = 'none';
        leadForm.style.display = 'block';
        this.block.querySelector('#lead-name')?.focus();
      });

      this.block.querySelector('#lead-cancel-btn')?.addEventListener('click', () => {
        leadForm.style.display = 'none';
        requestResultsBtn.style.display = '';
      });

      this.block.querySelector('#lead-submit-btn')?.addEventListener('click', () => {
        const name = this.block.querySelector('#lead-name')?.value?.trim() || '';
        const email = this.block.querySelector('#lead-email')?.value?.trim() || '';
        const facility = this.block.querySelector('#lead-facility')?.value?.trim() || '';
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!name || !emailValid) {
          if (leadError) leadError.style.display = 'block';
          return;
        }

        if (leadError) leadError.style.display = 'none';
        leadForm.style.display = 'none';
        if (leadConfirmation) leadConfirmation.style.display = 'block';

        sendToSheet({
          ...this.buildSheetPayload(), name, email, facility,
        });
      });
    }

    applyVimeoThumbnails(this.block);
  }

  renderStep() {
    const step = this.currentStep;
    const question = this.questions[step];
    if (!question) return;

    const total = this.questions.length;
    const isLast = step === total - 1;
    const isMulti = question.type === 'multi';
    const isGroupedMulti = question.type === 'grouped-multi';
    const isSortable = question.type === 'sortable';
    const isRating = question.type === 'rating';

    const progressBar = this.block.querySelector('#quiz-progress-bar');
    if (progressBar) {
      progressBar.innerHTML = this.questions.map((_, i) => {
        const classes = ['progress-segment'];
        if (i < step) classes.push('completed');
        if (i === step) classes.push('active');
        return `<div class="${classes.join(' ')}"></div>`;
      }).join('');
    }

    const display = this.block.querySelector('#quiz-question-display');
    if (display) {
      if (isSortable) {
        this.renderSortableQuestion(display, question);
      } else if (isRating) {
        this.renderRatingQuestion(display, question);
      } else if (isGroupedMulti) {
        this.renderGroupedMultiQuestion(display, question);
      } else {
        const optionsHtml = question.options.map((opt, i) => {
          const selected = this.isOptionSelected(step, i);
          const indicator = isMulti ? 'checkbox' : 'radio';
          return `<div class="option${selected ? ' selected' : ''}" data-option-index="${i}">
                <div class="option-content">
                  <span class="${indicator}${selected ? ' checked' : ''}"></span>
                  <span class="option-text">${allowTrademarkHtml(opt.text)}</span>
                </div>
              </div>`;
        }).join('');

        const qImage = this.questionImages[step + 1];
        const imageHtml = qImage
          ? `<div class="question-image"><img src="${escapeHtml(qImage.image)}" alt="" /></div>`
          : '';
        const imageLayoutClass = qImage ? ` has-image image-${qImage.placement}` : '';
        const optionsBlock = `<div class="options-container ${isMulti ? 'multi-choice' : 'single-choice'} layout-vertical">${optionsHtml}</div>`;
        const contentOrder = qImage?.placement === 'right'
          ? `${optionsBlock}${imageHtml}`
          : `${imageHtml}${optionsBlock}`;

        display.innerHTML = `
              <div class="question-text">${allowTrademarkHtml(question.text)}</div>
              <div class="question-container${imageLayoutClass}">
                ${contentOrder}
              </div>`;

        display.querySelectorAll('.option').forEach((optEl) => {
          optEl.addEventListener('click', () => {
            this.selectOption(
              step,
              parseInt(optEl.dataset.optionIndex, 10),
            );
          });
        });
      }
    }

    const nav = this.block.querySelector('#quiz-nav');
    if (nav) {
      const hasSelection = this.hasSelection(step);
      nav.innerHTML = `
            <button class="btn btn-secondary" id="quiz-prev-btn" ${step === 0 ? 'disabled' : ''}>← Previous</button>
            <div class="question-counter">Question ${step + 1} of ${total}</div>
            <button class="btn" id="quiz-next-btn" ${!hasSelection ? 'disabled' : ''}>${isLast ? 'Get Results' : 'Next'} →</button>`;

      nav.querySelector('#quiz-prev-btn')?.addEventListener('click', () => {
        if (this.currentStep > 0) {
          this.currentStep -= 1;
          this.renderStep();
        }
      });

      nav.querySelector('#quiz-next-btn')?.addEventListener('click', () => {
        if (isLast) {
          this.calculateScores();
          this.showResults();
          sendToSheet(this.buildSheetPayload());
        } else {
          this.currentStep += 1;
          this.renderStep();
        }
      });
    }
  }

  /* ===== GROUPED MULTI-SELECT (Accordion Checkboxes) ===== */

  renderGroupedMultiQuestion(display, question) {
    const step = question.index;

    const groupsHtml = question.groups.map((group) => {
      const itemsHtml = group.items.map((opt) => {
        const optIndex = question.options.indexOf(opt);
        const selected = this.isOptionSelected(step, optIndex);
        return `
              <div class="grouped-checkbox-row${selected ? ' selected' : ''}"
                   data-option-index="${optIndex}">
                <span class="checkbox${selected ? ' checked' : ''}"></span>
                <span class="option-text">${allowTrademarkHtml(opt.text)}</span>
              </div>`;
      }).join('');

      return `
            <div class="checkbox-group">
              <div class="checkbox-group-header">
                <span>${allowTrademarkHtml(group.brand)}</span>
                <div class="header-right">
                  ${CHEVRON_SVG}
                </div>
              </div>
              <div class="checkbox-group-body">
                ${itemsHtml}
              </div>
            </div>`;
    }).join('');

    const ungroupedHtml = question.ungrouped.map((opt) => {
      const optIndex = question.options.indexOf(opt);
      const selected = this.isOptionSelected(step, optIndex);
      return `
            <div class="grouped-checkbox-row standalone${selected ? ' selected' : ''}"
                 data-option-index="${optIndex}">
              <span class="checkbox${selected ? ' checked' : ''}"></span>
              <span class="option-text">${allowTrademarkHtml(opt.text)}</span>
            </div>`;
    }).join('');

    let otherHtml = '';
    if (question.otherOption) {
      const otherIndex = question.options.indexOf(question.otherOption);
      const otherSelected = this.isOptionSelected(step, otherIndex);
      const otherTextValue = otherSelected && question.otherTextInput
        ? (this.otherTextValue || question.otherTextInput.value || '')
        : '';
      const textFieldHtml = otherSelected && question.otherTextInput
        ? `<div class="other-text-field">
                 <input type="text" class="other-text-input"
                        placeholder="Please specify..."
                        value="${allowTrademarkHtml(otherTextValue)}" />
                 <div class="other-text-error">This field is required</div>
               </div>`
        : '';
      otherHtml = `
            <div class="checkbox-group-other${otherSelected ? ' active' : ''}"
                 data-option-index="${otherIndex}">
              <div class="other-check-row">
                <span class="checkbox${otherSelected ? ' checked' : ''}"></span>
                <span class="option-text">Other</span>
              </div>
              ${textFieldHtml}
            </div>`;
    }

    const qImage = this.questionImages[step + 1];
    const imageHtml = qImage
      ? `<div class="question-image"><img src="${escapeHtml(qImage.image)}" alt="" /></div>`
      : '';
    const imageLayoutClass = qImage ? ` has-image image-${qImage.placement}` : '';
    const optionsBlock = `<div class="grouped-checkboxes-container">${groupsHtml}${ungroupedHtml}${otherHtml}</div>`;
    const contentOrder = qImage?.placement === 'right'
      ? `${optionsBlock}${imageHtml}`
      : `${imageHtml}${optionsBlock}`;

    display.innerHTML = `
          <div class="question-text">${allowTrademarkHtml(question.text)}</div>
          <div class="question-container${imageLayoutClass}">
            ${contentOrder}
          </div>`;

    display.querySelectorAll('.checkbox-group-header').forEach((header) => {
      header.addEventListener('click', () => {
        header.parentElement.classList.toggle('open');
      });
    });

    display.querySelectorAll('.grouped-checkbox-row').forEach((row) => {
      row.addEventListener('click', () => {
        const optIndex = parseInt(row.dataset.optionIndex, 10);
        this.selectGroupedOption(step, optIndex, question);
      });
    });

    const otherEl = display.querySelector('.checkbox-group-other');
    if (otherEl) {
      otherEl.querySelector('.other-check-row')?.addEventListener('click', () => {
        const optIndex = parseInt(otherEl.dataset.optionIndex, 10);
        this.selectGroupedOption(step, optIndex, question);
      });
    }

    const otherInput = display.querySelector('.other-text-input');
    if (otherInput && question.otherTextInput) {
      otherInput.addEventListener('input', () => {
        this.otherTextValue = otherInput.value;
        question.otherTextInput.value = otherInput.value;
        const btn = this.block.querySelector('#quiz-next-btn');
        if (btn) btn.disabled = !this.hasSelection(step);
      });
      otherInput.addEventListener('click', (e) => e.stopPropagation());
    }
  }

  selectGroupedOption(stepIndex, optionIndex, question) {
    if (!Array.isArray(this.selections[stepIndex])) {
      this.selections[stepIndex] = [];
    }
    const arr = this.selections[stepIndex];
    const pos = arr.indexOf(optionIndex);
    if (pos >= 0) {
      arr.splice(pos, 1);
    } else {
      arr.push(optionIndex);
    }

    const otherIndex = question.otherOption
      ? question.options.indexOf(question.otherOption) : -1;
    if (optionIndex === otherIndex && pos >= 0 && question.otherTextInput) {
      this.otherTextValue = '';
      question.otherTextInput.value = '';
    }

    const currentOtherInput = this.block.querySelector('.other-text-input');
    if (currentOtherInput) {
      this.otherTextValue = currentOtherInput.value;
    }

    const display = this.block.querySelector('#quiz-question-display');
    if (display) {
      const openGroups = new Set();
      display.querySelectorAll('.checkbox-group.open').forEach((g) => {
        const brand = g.querySelector('.checkbox-group-header span')?.textContent;
        if (brand) openGroups.add(brand);
      });

      this.renderGroupedMultiQuestion(display, question);

      display.querySelectorAll('.checkbox-group').forEach((g) => {
        const brand = g.querySelector('.checkbox-group-header span')?.textContent;
        if (openGroups.has(brand)) g.classList.add('open');
      });
    }

    const optText = question.options[optionIndex]?.text || `option ${optionIndex}`;
    this.logCurrentScores(`Q${stepIndex + 1} grouped — "${optText}"`);

    const btn = this.block.querySelector('#quiz-next-btn');
    if (btn) btn.disabled = !this.hasSelection(stepIndex);
  }

  /* ===== END GROUPED MULTI-SELECT ===== */

  renderRatingQuestion(display, question) {
    const step = question.index;
    const items = this.getRatingItemsForQuestion(question);
    const isMri = this.isMriSelected();
    if (this.lastRatingWasMri !== isMri) {
      delete this.selections[step];
      this.lastRatingWasMri = isMri;
    }
    const selections = this.selections[step] || {};

    const itemsHtml = items.map((item, itemIdx) => {
      const scaleHtml = RATING_SCALE.map((s) => {
        const selected = selections[itemIdx] === s.value;
        return `
              <div class="rating-scale-point${selected ? ' selected' : ''}"
                   data-item-index="${itemIdx}" data-value="${s.value}">
                <span class="rating-radio${selected ? ' checked' : ''}"></span>
                <span class="rating-value">${s.value}</span>
                ${s.label ? `<span class="rating-label">${allowTrademarkHtml(s.label)}</span>` : ''}
              </div>`;
      }).join('');

      return `
            <div class="rating-item">
              <div class="rating-item-text">${allowTrademarkHtml(item.text)}</div>
              <div class="rating-scale">${scaleHtml}</div>
            </div>`;
    }).join('');

    const qImage = this.questionImages[step + 1];
    const imageHtml = qImage
      ? `<div class="question-image"><img src="${escapeHtml(qImage.image)}" alt="" /></div>`
      : '';
    const imageLayoutClass = qImage ? ` has-image image-${qImage.placement}` : '';
    const optionsBlock = `<div class="rating-container">${itemsHtml}</div>`;
    const contentOrder = qImage?.placement === 'right'
      ? `${optionsBlock}${imageHtml}`
      : `${imageHtml}${optionsBlock}`;

    display.innerHTML = `
          <div class="question-text">${allowTrademarkHtml(question.text)}</div>
          <div class="question-container${imageLayoutClass}">
            ${contentOrder}
          </div>`;

    display.querySelectorAll('.rating-scale-point').forEach((el) => {
      el.addEventListener('click', () => {
        this.selectRating(
          question,
          parseInt(el.dataset.itemIndex, 10),
          parseInt(el.dataset.value, 10),
        );
      });
    });
  }

  selectRating(question, itemIndex, value) {
    const step = question.index;
    if (!this.selections[step]) this.selections[step] = {};
    this.selections[step][itemIndex] = value;

    const container = this.block.querySelector('.rating-container');
    if (!container) return;

    const itemEl = container.querySelectorAll('.rating-item')[itemIndex];
    if (itemEl) {
      itemEl.querySelectorAll('.rating-scale-point').forEach((pt) => {
        const v = parseInt(pt.dataset.value, 10);
        const isSelected = v === value;
        pt.classList.toggle('selected', isSelected);
        pt.querySelector('.rating-radio')?.classList.toggle('checked', isSelected);
      });
    }

    const items = this.getRatingItemsForQuestion(question);
    const itemLabel = items[itemIndex]?.text || `item ${itemIndex}`;
    this.logCurrentScores(`Q${step + 1} rating — "${itemLabel}" = ${value}`);

    const btn = this.block.querySelector('#quiz-next-btn');
    if (btn) btn.disabled = !this.hasSelection(step);
  }

  renderSortableQuestion(display, question) {
    const step = question.index;
    const optionImages = this.config?.sortableOptionImages?.[step + 1];

    // Resolve options based on modality branch (MRI vs default)
    const options = this.getSortableOptionsForQuestion(question);
    const isMri = this.isMriSelected();
    if (this.lastSortableWasMri !== isMri) {
      delete this.selections[step];
      this.lastSortableWasMri = isMri;
    }

    // Use saved order if available, otherwise default order — persist so
    // scores are calculated even when the user accepts the default ranking.
    const order = this.selections[step]
              || options.map((_, i) => i);
    this.selections[step] = order;

    const optionParts = order.map((origIdx) => {
      const opt = options[origIdx];
      const images = getOptionImages(optionImages, opt, origIdx);
      const imagesHtml = images.length > 0
        ? `<div class="sortable-option-images">${images.map((src) => `<img src="${escapeHtml(src)}" alt="" class="sortable-option-img" />`).join('')}</div>`
        : '';
      return `<div class="sortable-drop-zone" data-drop-zone="true"></div><div class="option sortable" data-option-index="${origIdx}">
            <div class="option-content">
              ${imagesHtml}
              <span class="option-text">${allowTrademarkHtml(opt.text)}</span>
            </div>
            <span class="drag-handle" title="Drag to sort">⋮⋮</span>
          </div>`;
    }).join('');

    const trailingDropZone = '<div class="sortable-drop-zone" data-drop-zone="true"></div>';

    const qImage = this.questionImages[step + 1];
    const imageHtml = qImage
      ? `<div class="question-image"><img src="${escapeHtml(qImage.image)}" alt="" /></div>`
      : '';
    const imageLayoutClass = qImage ? ` has-image image-${qImage.placement}` : '';
    const optionsBlock = `<div class="options-container layout-vertical sortable-with-drop-zones">${optionParts}${trailingDropZone}</div>`;
    const contentOrder = qImage?.placement === 'right'
      ? `${optionsBlock}${imageHtml}`
      : `${imageHtml}${optionsBlock}`;

    display.innerHTML = `
          <div class="question-text">${allowTrademarkHtml(question.text)}</div>
          <div class="question-container question-sortable${imageLayoutClass}">
            ${contentOrder}
          </div>`;

    display.querySelectorAll('.option.sortable').forEach((el) => {
      this.attachSortableDragListeners(el);
    });
  }

  attachSortableDragListeners(option) {
    let threshold;
    let lastHighlighted = null;

    option.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      option.setPointerCapture(e.pointerId);

      threshold = getDragThreshold();
      lastHighlighted = null;
      this.draggedElement = option;
      this.pointerStartX = e.clientX;
      this.pointerStartY = e.clientY;
      this.pointerDragStarted = false;
      this.touchDropTarget = null;
    });

    option.addEventListener('pointermove', (e) => {
      if (this.draggedElement !== option) return;
      if (!this.pointerDragStarted) {
        if (Math.abs(e.clientX - this.pointerStartX) > threshold
            || Math.abs(e.clientY - this.pointerStartY) > threshold) {
          this.pointerDragStarted = true;
          option.classList.add('dragging');
          option.style.pointerEvents = 'none';
        } else return;
      }

      option.style.transform = `translate(${e.clientX - this.pointerStartX}px, ${e.clientY - this.pointerStartY}px)`;

      const under = document.elementFromPoint(e.clientX, e.clientY);
      const dropZone = under?.closest?.('.sortable-drop-zone');
      const validZone = dropZone?.closest('.options-container') ? dropZone : null;

      if (validZone !== lastHighlighted) {
        if (lastHighlighted) lastHighlighted.classList.remove('drag-over');
        if (validZone) validZone.classList.add('drag-over');
        lastHighlighted = validZone;
      }
      this.touchDropTarget = validZone;
    });

    const cleanup = () => {
      const wasDragging = this.pointerDragStarted;
      option.classList.remove('dragging');
      option.style.pointerEvents = '';
      option.style.transform = '';
      this.pointerDragStarted = false;

      if (lastHighlighted) {
        lastHighlighted.classList.remove('drag-over');
        lastHighlighted = null;
      }

      if (wasDragging && this.touchDropTarget) {
        this.touchDropTarget.parentNode.insertBefore(option, this.touchDropTarget);
        this.captureSortedOrder();
        this.touchDropTarget = null;
      }
      this.clearDragState();
      this.draggedElement = null;
    };

    option.addEventListener('pointerup', cleanup);
    option.addEventListener('pointercancel', cleanup);
  }


  clearDragOver() {
    this.block.querySelectorAll('.option.drag-over').forEach(
      (el) => el.classList.remove('drag-over'),
    );
    this.block.querySelectorAll('.sortable-drop-zone.drag-over').forEach(
      (el) => el.classList.remove('drag-over'),
    );
  }

  clearDragState() {
    if (this.draggedElement) {
      this.draggedElement.classList.remove('dragging');
      this.draggedElement = null;
    }
    this.clearDragOver();
  }

  swapSortableOptions(el1, el2) {
    const container = el1.parentNode;
    const allOpts = [...container.querySelectorAll('.option')];

    if (allOpts.indexOf(el1) < allOpts.indexOf(el2)) {
      container.insertBefore(el2, el1);
    } else {
      container.insertBefore(el1, el2);
    }
    this.captureSortedOrder();
  }

  captureSortedOrder() {
    const step = this.currentStep;
    const question = this.questions[step];
    if (!question || question.type !== 'sortable') return;

    const container = this.block.querySelector('.options-container');
    if (!container) return;

    const indices = [...container.querySelectorAll('.option.sortable')]
      .map((el) => parseInt(el.dataset.optionIndex, 10));
    this.selections[step] = indices;

    const options = this.getSortableOptionsForQuestion(question);

    const rankList = indices.map((i, rank) => `${rank + 1}. ${options[i].text}`).join(', ');
    this.logCurrentScores(`Q${step + 1} reorder — ${rankList}`);

    this.fixDropZonePairing(container);
  }

  fixDropZonePairing(container) {
    container.querySelectorAll('.sortable-drop-zone').forEach((dz) => dz.remove());
    const opts = container.querySelectorAll('.option.sortable');
    opts.forEach((opt) => {
      const dz = document.createElement('div');
      dz.className = 'sortable-drop-zone';
      dz.dataset.dropZone = 'true';
      container.insertBefore(dz, opt);
    });
    const trailing = document.createElement('div');
    trailing.className = 'sortable-drop-zone';
    trailing.dataset.dropZone = 'true';
    container.appendChild(trailing);
  }

  selectOption(stepIndex, optionIndex) {
    const question = this.questions[stepIndex];
    if (!question) return;
    const isMulti = question.type === 'multi';

    if (isMulti) {
      if (!Array.isArray(this.selections[stepIndex])) {
        this.selections[stepIndex] = [];
      }
      const arr = this.selections[stepIndex];
      const pos = arr.indexOf(optionIndex);
      if (pos >= 0) arr.splice(pos, 1);
      else arr.push(optionIndex);

      const optEl = this.block.querySelector(
        `#quiz-question-display .option[data-option-index="${optionIndex}"]`,
      );
      if (optEl) {
        const checkbox = optEl.querySelector('.checkbox');
        const isSelected = arr.includes(optionIndex);
        optEl.classList.toggle('selected', isSelected);
        checkbox?.classList.toggle('checked', isSelected);
      }
    } else {
      this.selections[stepIndex] = optionIndex;

      this.block.querySelectorAll('#quiz-question-display .option').forEach((el) => {
        const radio = el.querySelector('.radio');
        const idx = parseInt(el.dataset.optionIndex, 10);
        const isSelected = idx === optionIndex;
        el.classList.toggle('selected', isSelected);
        radio?.classList.toggle('checked', isSelected);
      });
    }

    const optText = question.options[optionIndex]?.text || `option ${optionIndex}`;
    this.logCurrentScores(`Q${stepIndex + 1} — "${optText}"`);

    const btn = this.block.querySelector('#quiz-next-btn');
    if (btn) btn.disabled = !this.hasSelection(stepIndex);
  }

  isOptionSelected(stepIndex, optionIndex) {
    const sel = this.selections[stepIndex];
    if (sel == null) return false;
    if (Array.isArray(sel)) return sel.includes(optionIndex);
    return sel === optionIndex;
  }

  hasSelection(stepIndex) {
    const question = this.questions[stepIndex];
    if (question?.type === 'sortable') return true;
    if (question?.type === 'grouped-multi') {
      const sel = this.selections[stepIndex];
      if (!Array.isArray(sel) || sel.length === 0) return false;
      if (question.otherOption && question.otherTextInput) {
        const otherIndex = question.options.indexOf(question.otherOption);
        if (sel.includes(otherIndex)) {
          const otherText = (this.otherTextValue ?? question.otherTextInput.value ?? '').trim();
          if (!otherText) return false;
        }
      }
      return true;
    }
    if (question?.type === 'rating') {
      const sel = this.selections[stepIndex];
      if (!sel || typeof sel !== 'object') return false;
      const items = this.getRatingItemsForQuestion(question);
      return items.every((_, i) => sel[i] != null);
    }
    const sel = this.selections[stepIndex];
    if (sel == null) return false;
    if (Array.isArray(sel)) return sel.length > 0;
    return true;
  }

  showThankYou() {
    const message = 'Thank you! Someone will connect with you within 3 business days or less to discuss more.';

    this.block.innerHTML = `
          <div class="product-survey-container survey-fullscreen">
            ${CLOSE_BTN_HTML}
            <div class="survey-card">
              <div class="thank-you-container">
                <h2>Thank You!</h2>
                <p>${message}</p>
                <button class="btn btn-quiz-secondary" id="restart-btn">Take Quiz Again</button>
              </div>
            </div>
          </div>`;

    this.bindCloseBtn();
    this.block.querySelector('#restart-btn')
      ?.addEventListener('click', () => this.restart());
  }

  restart() {
    this.currentStep = 0;
    this.selections = {};
    this.scores = {};
    this.lastSortableWasMri = undefined;
    this.lastRatingWasMri = undefined;
    this.showStartScreen = true;
    this.exitFullscreen();
  }

  exitFullscreen() {
    document.body.classList.remove('survey-fullscreen-active');
    this.showStartScreen = true;
    this.render();
  }
}

MarkerQuiz.PRODUCT_ID_ALIASES = PRODUCT_ID_ALIASES;

const applyStartScreenContentFromBlock = (block, config) => {
  const rows = [...block.querySelectorAll(':scope > div')];
  const singleColTexts = rows
    .filter((row) => row.children.length === 1)
    .map((row) => row.children[0]?.innerHTML?.trim() || row.textContent?.trim())
    .filter((t) => t && t.length > 0);
  if (singleColTexts.length === 0) return;
  const isBlockName = (t) => t.toLowerCase()
    .replace(/[^0-9a-z]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') === 'marker-quiz';
  const contentTexts = singleColTexts[0] && isBlockName(singleColTexts[0])
    ? singleColTexts.slice(1)
    : singleColTexts;
  const [title, description] = contentTexts;
  if (title && (config['start-title'] == null || config['start-title'] === '')) {
    config['start-title'] = title;
  }
  if (description && (config['start-description'] == null || config['start-description'] === '')) {
    config['start-description'] = description;
  }
}

const getPreviewSlug = () => {
  const params = new URLSearchParams(window.location.search);
  let slug = params.get('preview') || null;
  // Handle malformed URLs like ?preview=biomarc?preview=biomarc (strip accidental duplicate)
  if (slug && slug.includes('?preview=')) {
    slug = slug.split('?preview=')[0].trim() || null;
  }
  return slug;
}

const findProductBySlug = (products, slug) => {
  if (!slug) return null;
  const slugNorm = String(slug).toLowerCase().trim();
  return Object.values(products).find(
    (p) => p.slug === slugNorm || p.id === slugNorm,
  ) || null;
}

const renderPreview = (block, product, products) => {
  const allProducts = Object.values(products);
  const options = allProducts
    .map((p) => `<option value="${p.slug}"${p.slug === product.slug ? ' selected' : ''}>${p.name}</option>`)
    .join('');

  document.body.classList.add('survey-fullscreen-active');

  block.innerHTML = `
        <div class="product-survey-container survey-fullscreen">
          ${CLOSE_BTN_HTML}
          <div class="preview-bar">
            <span>Preview mode</span>
            <select id="preview-product-select">${options}</select>
          </div>
          <div class="survey-card results-card preview-results">
            <div class="results-container">
              <div class="top-recommendation-hero">
                <div class="top-recommendation-image">
                  <img src="${escapeHtml(product.cardImage || product.image)}" alt="${stripHtmlForAlt(product.name)}" />
                </div>
                <div class="top-recommendation-content">
                  <p class="top-recommendation-label">Your top recommended marker</p>
                  <h1 class="top-recommendation-name">${allowTrademarkHtml(product.name)}</h1>
                  <div class="top-recommendation-description">${allowTrademarkHtml(product.description)}</div>
                </div>
              </div>
    
              <div class="features-video-section ${(product.video || product.featuredPhoto) ? 'has-video' : 'no-video'}">
                <div class="features-section-inner">
                  <h2 class="features-section-title">Product Features</h2>
                  <div class="features-section-content">
                    <div class="features-container">
                      <ul class="top-recommendation-features product-features">
                        ${(product.features || []).map((f) => `<li>${allowTrademarkHtml(f)}</li>`).join('')}
                      </ul>
                    </div>
                    ${(product.video || product.featuredPhoto) ? `
                      <div class="features-media-column">
                        ${product.featuredPhoto ? `
                          <div class="product-featured-photo">
                            <img src="${escapeHtml(product.featuredPhoto)}" alt="Featured" />
                          </div>
                        ` : ''}
                    ${product.video ? `
                        <button type="button" class="product-video-thumbnail" data-video-url="${escapeHtml(getVideoEmbedUrl(product.video))}" ${isVimeoVideo(product.video) ? `data-vimeo-url="${escapeHtml(product.video.trim())}"` : ''} aria-label="Play video">
                          <img src="${escapeHtml(getVideoThumbnailUrl(product))}" alt="Play video" />
                          <span class="icon-playvideo">${ICON_PLAYVIDEO_SVG}</span>
                        </button>
                      ` : ''}
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
    
              <div class="quiz-actions-section">
                <div class="quiz-actions-buttons">
                  <button class="btn btn-quiz-primary" disabled>Email My Results</button>
                  <button class="btn btn-quiz-secondary" id="preview-restart-btn">Take Quiz Again</button>
                </div>
              </div>
    
              <div class="alternatives-section">
                <h3>You Should Also Consider</h3>
                <div class="alternatives-grid">
                  <div class="product-card">
                    <div class="product-image">
                      <img src="${PLACEHOLDER_IMAGE}" alt="Placeholder" />
                    </div>
                    <h4>Alternative Product Placeholder</h4>
                  </div>
                </div>
              </div>
    
              <div class="contact-section">
                <h3>Would you like to be contacted by a sales rep to learn more?</h3>
                <div class="contact-buttons">
                  <button class="btn btn-contact-primary">Yes, Contact Me</button>
                  <button class="btn btn-contact-secondary">No, Thank You</button>
                </div>
              </div>
    
              ${(product.footnotes || []).length ? `
                <div class="product-footnotes">
                  <ol class="footnotes-list">
                    ${(product.footnotes || []).map((fn) => `<li class="footnote">${allowTrademarkHtml(fn)}</li>`).join('')}
                  </ol>
                </div>
              ` : ''}
            
            </div>
          </div>
        </div>`;

  block.querySelector('#close-survey-btn')?.addEventListener('click', () => {
    document.body.classList.remove('survey-fullscreen-active');
    const url = new URL(window.location);
    url.searchParams.delete('preview');
    window.location.href = url.toString();
  });

  block.querySelectorAll('.product-video-thumbnail').forEach((btn) => {
    btn.addEventListener('click', () => openProductVideo(btn.dataset.videoUrl));
  });

  block.querySelector('#preview-restart-btn')?.addEventListener('click', () => {
    document.body.classList.remove('survey-fullscreen-active');
    const url = new URL(window.location);
    url.searchParams.delete('preview');
    window.location.href = url.toString();
  });

  block.querySelector('#preview-product-select')?.addEventListener('change', (e) => {
    const url = new URL(window.location);
    url.searchParams.set('preview', e.target.value);
    window.location.href = url.toString();
  });

  applyVimeoThumbnails(block);
}

export default async function decorate(block) {
  const { products } = await getMarkerRecommendations();
  const config = readBlockConfigWithHtml(block);

  const previewSlug = getPreviewSlug();
  if (previewSlug) {
    const product = findProductBySlug(products, previewSlug);
    if (product) {
      renderPreview(block, product, products, config);
      return null;
    }
  }
  applyStartScreenContentFromBlock(block, config);
  config.subHeader = parseSubHeaderFromBlock(block);
  config.questionImages = parseQuestionImagesFromBlock(block);
  config.sortableOptionImages = parseSortableOptionImagesFromBlock(block);
  const quiz = new MarkerQuiz(block, config, products);
  await quiz.init();
  return quiz;
}
