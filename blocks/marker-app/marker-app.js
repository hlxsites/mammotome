import {
  readBlockConfig,
  getMarkerRecommendations,
  toClassName,
} from '../../scripts/lib-franklin.js';
import { embedMultistepMarketoForm } from '../multistep-form/multistep-form.js';

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwZYd5rhFtYLc0SaBDvq_lz_m5CzEG4PmPcsJBYMWbkSKEP4UNgObFh1XrxMs-vn5ME/exec';

const CLIENT_SECRET = '82e499ca-32c2-4e6c-a983-12f4f7ea7a36';

const DEFAULT_CONTACT_SALES_FORM_ID = 2695;

const getEmailResultsFormIdFromConfig = (config) => config['email-results-form-id'] || config.emailresultsformid || null;

const getContactSalesFormIdFromConfig = (config) => {
  const contactFormRaw = config['contact-sales-form-id'] || config.contactsalesformid;
  if (contactFormRaw != null && String(contactFormRaw).trim() !== '') {
    const n = parseInt(String(contactFormRaw).trim(), 10);
    return Number.isNaN(n) ? DEFAULT_CONTACT_SALES_FORM_ID : n;
  }
  return DEFAULT_CONTACT_SALES_FORM_ID;
};

const ALLOWED_ORIGINS = [
  'https://www.mammotome.com',
  'https://mammotome.com',
  'https://*--mammotome--hlxsites.aem.page',
  'http://localhost:3000',
];

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
};

const validateGoogleSheetsPayload = (payload) => {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('Payload must be a JSON object');
  }

  if (!payload.date_time) errors.push('Missing date_time');
  if (!payload.current_bx_markers) errors.push('Missing current_bx_markers');
  if (!payload.top_product_id) errors.push('Missing top_product_id');

  return { valid: errors.length === 0, errors };
};

/**
   * Sanitize user agent to prevent injection attacks
   */
const sanitizeUserAgent = (ua) => {
  if (!ua || typeof ua !== 'string') return '';
  return ua.substring(0, 500);
};

// ENHANCED GOOGLE SHEETS SUBMISSION FUNCTION
/**
   * @param {object} payload
   * @param {object} userInfo
   * @param {object} options
   */
async function sendToSheet(payload, userInfo = {}, options = {}) {
  // Validate origin
  if (!isOriginAllowed()) {
    return;
  }

  const validation = validateGoogleSheetsPayload(payload);
  if (!validation.valid) {
    return;
  }

  const controller = new AbortController();
  const timeout = options.timeout || 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const existingUuid = (typeof sessionStorage !== 'undefined'
      && !options.forceNewUuid
      && sessionStorage.getItem('markerQuizUuid'))
      ? sessionStorage.getItem('markerQuizUuid')
      : '';

    const requestBody = {
      clientSecret: CLIENT_SECRET,
      uuid: existingUuid || '',
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
        q5_followup_concern: payload.followup_concern || '',
        q5_bleeding_frequency_text: payload.bleeding_concern || '',
        q6_case_mix: payload.case_mix || '',
        q7_natural_rating: payload.natural_rating || 0,
        q7_nick_rating: payload.nickel_rating || 0,
        q7_permanent_visibility_rating: payload.permanent_visibility_rating || 0,
      },

      scores: {
        hydromark: payload.all_scores?.hm || 0,
        hydromark_plus: payload.all_scores?.hmplus || 0,
        mammomark: payload.all_scores?.mammomark || 0,
        mammostar: payload.all_scores?.mammostar || 0,
        biomarc: payload.all_scores?.biomarc || 0,
        lumimark: payload.all_scores?.lumimark || 0,
      },

      recommendedProductId: payload.top_product_id || '',
      secondProductId: payload.second_product_id || '',
      secondProductName: payload.second_product_name || '',
      thirdProductId: payload.third_product_id || '',
      thirdProductName: payload.third_product_name || '',

      email: userInfo.email || '',
      userAgent: sanitizeUserAgent(navigator.userAgent),
      clientIp: options.clientIp || '',
      timestamp: payload.date_time || new Date().toISOString(),
    };

    const response = await fetch(SHEET_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    if (data.success && data.uuid) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('markerQuizUuid', data.uuid);
      }
    } else if (data.error) {
      // server returned an error – no action needed
    }
  } catch (err) {
    console.warn('[Marker Quiz] sendToSheet error:', err);
  } finally {
    clearTimeout(timeoutId);
  }
}

const extractEmailFromMarketoSuccessValues = (values) => {
  if (!values || typeof values !== 'object') return '';
  if (typeof values.Email === 'string' && values.Email.includes('@')) return values.Email.trim();
  if (typeof values.email === 'string' && values.email.includes('@')) return values.email.trim();
  if (typeof values.WorkEmail === 'string' && values.WorkEmail.includes('@')) return values.WorkEmail.trim();
  if (typeof values.workEmail === 'string' && values.workEmail.includes('@')) return values.workEmail.trim();

  const emailEntry = Object.entries(values).find(([key, val]) => {
    if (typeof val !== 'string') return false;
    if (!/@/.test(val)) return false;
    return /email/i.test(key) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val.trim());
  });
  return emailEntry ? String(emailEntry[1]).trim() : '';
};

const CLOSE_BTN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="8.5 8.5 7 7" width="24" height="24">
      <line stroke="currentColor" x1="14.1213" y1="9.87866" x2="9.8787" y2="14.1213" stroke-width="1.7" stroke-linecap="square"/>
      <line stroke="currentColor" x1="9.87866" y1="9.87866" x2="14.1213" y2="14.1213" stroke-width="1.7" stroke-linecap="square"/>
    </svg>`;

const CLOSE_BTN_HTML = `<button class="survey-close-btn" id="close-survey-btn" aria-label="Close survey">${CLOSE_BTN_SVG}</button>`;

/** Leave the quiz to the markers hub (only after closing from Meet Your Match welcome). */
const MARKER_QUIZ_EXIT_URL = 'https://www.mammotome.com/us/en/products/breast-biopsy-markers/';

const START_HEADER_LOGO_URL = 'https://main--mammotome--hlxsites.aem.page/assets/images/mammotome-markers-logo-transparent.png';

const START_FOOTER_LOGO_URL = 'https://main--mammotome--hlxsites.aem.page/assets/images/circle-m-symbol-logo-white.png';

const DEFAULT_START_TITLE_HTML = '<h1 class="start-screen-title-heading"><span class="start-screen-title-line">Meet Your</span><span class="start-screen-title-line start-screen-title-line--emphasis">Match</span></h1>';

const DEFAULT_START_DESCRIPTION = 'Take our quick quiz to discover the solution that best aligns with your patient and clinical needs.';

const DEFAULT_START_BUTTON = 'Start Quiz';

const DEFAULT_SUB_HEADER_TEXT = 'Not sure which marker is right for you?';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e0e0e0' width='400' height='300'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16'%3EPlaceholder%3C/text%3E%3C/svg%3E";

const ICON_PLAYVIDEO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="99.2px" height="99.2px">'
      + '    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>'
      + '    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>'
      + '</svg>';

const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
const VIMEO_REGEX = /(?:vimeo\.com\/)(?:video\/)?(\d+)/;

const DRAG_THRESHOLD_DEFAULT = 3;
const DRAG_THRESHOLD_QMB_T = 10;

const isQmbTDisplay = () => typeof window !== 'undefined'
          && window.innerWidth >= 2160
          && window.innerHeight >= 3840;

const getDragThreshold = () => (isQmbTDisplay() ? DRAG_THRESHOLD_QMB_T : DRAG_THRESHOLD_DEFAULT);

const escapeHtml = (str) => {
  if (str == null || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

const isAllowedBackgroundVideoHost = (hostname) => {
  const h = (hostname || '').replace(/^www\./, '').toLowerCase();
  return h === 'player.vimeo.com' || h === 'youtube.com' || h === 'youtube-nocookie.com';
};

/**
 * Mute/loop/background params for Vimeo or YouTube embeds used as full-screen backdrops.
 */
const appendBackgroundEmbedParams = (embedUrl) => {
  if (!embedUrl || typeof embedUrl !== 'string') return '';
  try {
    const u = new URL(embedUrl);
    if (!isAllowedBackgroundVideoHost(u.hostname)) return '';
    if (u.hostname.replace(/^www\./, '').includes('vimeo')) {
      u.searchParams.set('autoplay', '1');
      u.searchParams.set('muted', '1');
      u.searchParams.set('loop', '1');
      u.searchParams.set('background', '1');
      return u.toString();
    }
    const pathMatch = u.pathname.match(/\/embed\/([^/?]+)/);
    const videoId = pathMatch ? pathMatch[1] : '';
    u.searchParams.set('autoplay', '1');
    u.searchParams.set('mute', '1');
    u.searchParams.set('controls', '0');
    u.searchParams.set('modestbranding', '1');
    u.searchParams.set('playsinline', '1');
    if (videoId) {
      u.searchParams.set('loop', '1');
      u.searchParams.set('playlist', videoId);
    }
    return u.toString();
  } catch {
    return '';
  }
};

const resolveStartWindowBackgroundUrl = async (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const tryFromEmbedUrl = (candidate) => {
    const withParams = appendBackgroundEmbedParams(candidate);
    if (!withParams) return '';
    try {
      const u = new URL(withParams);
      return isAllowedBackgroundVideoHost(u.hostname) ? withParams : '';
    } catch {
      return '';
    }
  };

  const direct = getVideoEmbedUrl(trimmed);
  const isDirectEmbed = direct.includes('player.vimeo.com')
    || direct.includes('youtube.com/embed');
  if (isDirectEmbed) {
    const resolved = tryFromEmbedUrl(direct);
    if (resolved) return resolved;
  }

  if (!/vimeo\.com/i.test(trimmed)) {
    return '';
  }

  try {
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(trimmed)}`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return '';
    const data = await res.json();
    const html = data?.html || '';
    const m = html.match(/src=["']([^"']+)["']/);
    if (!m) return '';
    let src = m[1].replace(/&amp;/g, '&');
    if (src.startsWith('//')) src = `https:${src}`;
    return tryFromEmbedUrl(src);
  } catch {
    return '';
  }
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

const MARKETO_FORMS2_SRC = 'https://www2.mammotome.com/js/forms2/js/forms2.min.js';

let marketoForms2LoadPromise = null;

/**
 * Resolves when `window.MktoForms2` is available. Uses one shared script tag + optional preload.
 * Call early (decorate / results) so the library is ready before the user opens the contact form.
 */
const ensureMarketoForms2Ready = () => {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.MktoForms2) return Promise.resolve();
  if (marketoForms2LoadPromise) return marketoForms2LoadPromise;

  marketoForms2LoadPromise = new Promise((resolve, reject) => {
    const succeed = () => {
      if (window.MktoForms2) resolve();
      else reject(new Error('MktoForms2 not available'));
    };
    const fail = () => reject(new Error('Marketo script load failed'));

    let script = document.querySelector('script[src*="forms2.min.js"]');
    if (!script) {
      if (!document.head.querySelector(`link[rel="preload"][href="${MARKETO_FORMS2_SRC}"]`)) {
        const preload = document.createElement('link');
        preload.rel = 'preload';
        preload.as = 'script';
        preload.href = MARKETO_FORMS2_SRC;
        document.head.appendChild(preload);
      }
      script = document.createElement('script');
      script.src = MARKETO_FORMS2_SRC;
      script.async = true;
      document.head.appendChild(script);
    }

    if (window.MktoForms2) {
      succeed();
      return;
    }

    script.addEventListener('load', succeed, { once: true });
    script.addEventListener('error', fail, { once: true });
  }).catch((err) => {
    marketoForms2LoadPromise = null;
    return Promise.reject(err);
  });

  return marketoForms2LoadPromise;
};

const prefetchMarketoForms2 = () => {
  ensureMarketoForms2Ready().catch(() => {});
};

const EMAIL_RESULTS_LOADING_HTML = '<p class="email-results-form-loading" role="status" aria-live="polite">Loading...</p>';

const CONTACT_SALES_LOADING_HTML = '<p class="contact-sales-form-loading" role="status" aria-live="polite">Loading...</p>';

const CONTACT_SALES_THANK_YOU_HTML = `
  <div class="thank-you-container contact-sales-thank-you" role="status" aria-live="polite">
    <p>Thank you for your submission. We'll be in touch within 2-3 business days.</p>
  </div>`;

const CONTACT_SALES_MARKETO_OVERLAY_ID = 'contact-sales-marketo-overlay';

const CONTACT_SALES_OVERLAY_CLOSE_HTML = CLOSE_BTN_HTML
  .replace('id="close-survey-btn"', 'id="contact-sales-overlay-close"')
  .replace('aria-label="Close survey"', 'aria-label="Close"');

const removeContactSalesMarketoOverlay = () => {
  document.getElementById(CONTACT_SALES_MARKETO_OVERLAY_ID)?.remove();
};

let contactSalesOverlayEscapeHandler = null;

const openContactSalesMarketoOverlay = async ({
  contactSalesFormId,
  extendHiddenFields,
  getSheetPayload,
  contactSectionEl,
  contactButtonsEl,
  overlayHost,
  onFinishClose,
}) => {
  removeContactSalesMarketoOverlay();
  if (contactSalesOverlayEscapeHandler) {
    document.removeEventListener('keydown', contactSalesOverlayEscapeHandler);
    contactSalesOverlayEscapeHandler = null;
  }

  const host = overlayHost
    || contactSectionEl?.closest('.survey-fullscreen')
    || contactSectionEl?.closest('main')
    || document.body;

  const root = document.createElement('div');
  root.id = CONTACT_SALES_MARKETO_OVERLAY_ID;
  root.className = 'contact-sales-marketo-overlay';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.innerHTML = `
    <div class="contact-sales-marketo-overlay-inner">
      ${CONTACT_SALES_OVERLAY_CLOSE_HTML}
      <div class="survey-card contact-sales-marketo-card">
        <h1 class="contact-sales-marketo-heading">Connect with a Rep to Learn More</h1>
        <div id="contact-sales-form-mount" class="contact-sales-form-wrapper"></div>
      </div>
      <div class="contact-sales-marketo-overlay-footer" id="contact-sales-overlay-footer" hidden>
        <button type="button" class="btn btn-quiz-secondary" id="contact-sales-overlay-back-btn">Done</button>
      </div>
    </div>
  `;
  host.appendChild(root);

  const mount = root.querySelector('#contact-sales-form-mount');
  const footer = root.querySelector('#contact-sales-overlay-footer');

  const finishClose = () => {
    const submitted = root.dataset.submitted === 'true';
    if (contactSalesOverlayEscapeHandler) {
      document.removeEventListener('keydown', contactSalesOverlayEscapeHandler);
      contactSalesOverlayEscapeHandler = null;
    }
    removeContactSalesMarketoOverlay();
    if (submitted && contactSectionEl) {
      contactSectionEl.querySelector('.contact-sales-inline-thank-you')?.remove();
      const area = document.createElement('div');
      area.className = 'contact-sales-inline-thank-you';
      area.innerHTML = CONTACT_SALES_THANK_YOU_HTML;
      contactSectionEl.appendChild(area);
    } else if (contactButtonsEl) {
      contactButtonsEl.style.display = '';
    }
    try {
      onFinishClose?.();
    } catch (err) {
      /* ignore: close navigation is best-effort */
    }
  };

  root.querySelector('#contact-sales-overlay-close')?.addEventListener('click', finishClose);
  root.querySelector('#contact-sales-overlay-back-btn')?.addEventListener('click', finishClose);
  contactSalesOverlayEscapeHandler = (e) => {
    if (e.key === 'Escape') {
      finishClose();
    }
  };
  document.addEventListener('keydown', contactSalesOverlayEscapeHandler);

  const hooks = {
    clearContainer: true,
    extendHiddenFields,
    onSuccess: (values) => {
      const m = document.querySelector(`#${CONTACT_SALES_MARKETO_OVERLAY_ID} #contact-sales-form-mount`);
      if (m) {
        m.innerHTML = CONTACT_SALES_THANK_YOU_HTML;
        m.classList.remove('multistep-form', 'multistep-form-embedded');
        delete m.dataset.mktoLoaded;
      }
      document
        .querySelector(`#${CONTACT_SALES_MARKETO_OVERLAY_ID} .contact-sales-marketo-heading`)
        ?.setAttribute('hidden', '');
      root.dataset.submitted = 'true';
      if (footer) footer.hidden = false;
      return false;
    },
  };

  mount.innerHTML = CONTACT_SALES_LOADING_HTML;
  await ensureMarketoForms2Ready();
  try {
    const form = await embedMultistepMarketoForm(mount, contactSalesFormId, hooks);
    if (form) mount.dataset.mktoLoaded = 'true';
  } catch {
    mount.innerHTML = '<p class="contact-sales-form-error">Unable to load form. Please try again later.</p>';
  }
};

const EMAIL_RESULTS_THANK_YOU_HTML = `
  <div class="thank-you-container email-results-thank-you" role="status" aria-live="polite">
    <p>Thank you for participating in Mammotome's "Meet Your Match". Your results will be emailed to you shortly.</p>
  </div>`;

const embedMarketoForm = async (container, formId) => {
  await ensureMarketoForms2Ready();
  const formElement = document.createElement('form');
  formElement.id = `mktoForm_${formId}`;
  container.appendChild(formElement);
  window.MktoForms2.loadForm('//www2.mammotome.com', '435-TDP-284', formId);
  const expectedFormDomId = `mktoForm_${formId}`;
  return new Promise((resolve) => {
    window.MktoForms2.whenReady((form) => {
      const domForm = form.getFormElem()[0];
      if (!domForm || domForm.id !== expectedFormDomId) {
        return;
      }
      container.querySelector('.email-results-form-loading')?.remove();
      resolve(form);
    });
  });
};

const prepareQuizResultsUrlForMarketo = async () => {
  const uuid = sessionStorage.getItem('markerQuizUuid') || '';
  const baseUrl = window.location.origin;
  let resultsUrl = `${baseUrl}/us/en/marker-results?uuid=${uuid}`;
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
      resultsUrl += `&token=${linkData.token}&tokenCreatedAt=${linkData.tokenCreatedAt}`;
    }
  } catch (err) {
    /* ignore: results URL still valid without email link token */
  }
  return resultsUrl;
};

const MARKETO_QUIZ_PRODUCT_ID_TO_LABEL = {
  biomarc: 'BiomarC',
  hm: 'HydroMARK',
  hmplus: 'HydroMARK Plus',
  lumimark: 'LumiMARK',
  mammomark: 'MammoMARK & CorMARK',
  mammostar: 'MammoSTAR',
};

const buildMarketoEmailResultsProductFieldValue = (payload) => {
  const ids = [
    payload.top_product_id,
    payload.second_product_id,
    payload.third_product_id,
  ]
    .map((id) => (id != null ? String(id).trim() : ''))
    .filter(Boolean);
  const labels = ids
    .map((id) => MARKETO_QUIZ_PRODUCT_ID_TO_LABEL[id.toLowerCase()] || '')
    .filter(Boolean);
  return labels.join(';');
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
};

const MARKER_APP_HIDE_CHROME_KEYS = new Set(['nav', 'footer']);

/** Map curly/smart quotes from Word/Excel to ASCII so quoted phrases parse reliably. */
const normalizeAuthoringQuotes = (str) => String(str || '')
  .replace(/\u201C|\u201D/g, '"')
  .replace(/\u2018|\u2019/g, "'");

const stripSurroundingQuotes = (token) => {
  let t = token.trim();
  if (t.length >= 2) {
    if (t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1).trim();
    else if (t.startsWith("'") && t.endsWith("'")) t = t.slice(1, -1).trim();
    else if (t.startsWith('\u201C') && t.endsWith('\u201D')) t = t.slice(1, -1).trim();
  }
  return t;
};

/**
 * Splits a hide-row value into tokens: quoted phrases become one token each;
 * the remainder is split on whitespace, commas, semicolons, or pipes.
 * @param {string} raw
 * @returns {string[]}
 */
const extractHideRowTokens = (raw) => {
  const tokens = [];
  let s = normalizeAuthoringQuotes(raw).trim();
  if (!s) return tokens;
  s = s.replace(/["']([^"']*)["']/gu, (_, inner) => {
    const t = inner.trim();
    if (t) tokens.push(t);
    return ' ';
  });
  s.split(/[\s,;|]+/u).forEach((piece) => {
    const t = stripSurroundingQuotes(piece);
    if (t) tokens.push(t);
  });
  return tokens;
};

const parseHideChromeFromBlock = (block) => {
  const chromeTargets = new Set();
  const scoreKeywords = [];
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;
    const rowKey = toClassName(cols[0].textContent);
    if (rowKey !== 'hide') return;
    const col = cols[1];
    const raw = (col.innerText || col.textContent || '').trim();
    if (!raw) return;
    extractHideRowTokens(raw).forEach((token) => {
      const tLower = token.toLowerCase();
      if (MARKER_APP_HIDE_CHROME_KEYS.has(tLower)) {
        chromeTargets.add(tLower);
      } else if (token.trim()) {
        scoreKeywords.push(token.trim());
      }
    });
  });
  const scoreExcludeKeywords = [...new Set(scoreKeywords)];
  return {
    hideNav: chromeTargets.has('nav'),
    hideFooter: chromeTargets.has('footer'),
    scoreExcludeKeywords,
  };
};

const applyMarkerAppHideChrome = ({ hideNav, hideFooter }) => {
  document.body.classList.toggle('marker-app-hide-chrome-nav', Boolean(hideNav));
  document.body.classList.toggle('marker-app-hide-chrome-footer', Boolean(hideFooter));
};

const RANK_SCORES = {
  type: 'ranked_capability',
  label_to_capability: {
    'Long-term Ultrasound Visibility': 'long_term_us_visibility',
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
      cross_modal_visibility: 4,
      shape_distinction: 1,
      low_artifact: 2,
      or_anti_displacement: 3,
    },
    hmplus: {
      long_term_us_visibility: 5,
      anti_migration: 3,
      locating: 5,
      affordability: 1,
      cross_modal_visibility: 5,
      shape_distinction: 1,
      low_artifact: 2,
      or_anti_displacement: 4,
    },
    mammomark: {
      long_term_us_visibility: 2,
      anti_migration: 5,
      locating: 1,
      affordability: 5,
      cross_modal_visibility: 3,
      shape_distinction: 3,
      low_artifact: 2,
      or_anti_displacement: 5,
    },
    mammostar: {
      long_term_us_visibility: 4,
      anti_migration: 3,
      locating: 2,
      affordability: 3,
      cross_modal_visibility: 2,
      shape_distinction: 2,
      low_artifact: 5,
      or_anti_displacement: 3,
    },
    lumimark: {
      long_term_us_visibility: 4,
      anti_migration: 3,
      locating: 3,
      affordability: 4,
      cross_modal_visibility: 4,
      shape_distinction: 5,
      low_artifact: 3,
      or_anti_displacement: 3,
    },
    biomarc: {
      long_term_us_visibility: 2,
      anti_migration: 1,
      locating: 1,
      affordability: 5,
      cross_modal_visibility: 2,
      shape_distinction: 1,
      low_artifact: 5,
      or_anti_displacement: 2,
    },
  },
};

const SORTABLE_OPTIONS = Object.entries(RANK_SCORES.label_to_capability).map(([text, key]) => ({
  text,
  key,
}));

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
      duration_of_ultrasound_visibility: 3,
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

const RATING_ITEM_NATURAL = 'Preference for natural markers';
/**
 * Same 1–5 scale as natural row; MRI scoring uses `getNonAnimalPreferenceScores`
 * (MammoMARK penalty for 3+).
 */
const RATING_ITEM_NON_ANIMAL = 'Preference for non-animal origin markers';

const RATING_ITEMS = [
  { text: RATING_ITEM_NATURAL, key: 'natural' },
  { text: 'Concerns about nickel allergies or metal sensitivities', key: 'nickel_free' },
];

/** Bonus markers for natural preference (rating 3+): mammostar, biomarc */
const NATURAL_BONUS_KEYS = ['mammostar', 'biomarc'];
/** Bonus markers for nickel concerns (rating 3+): mammostar, biomarc, mammomark, hm, hmplus */
const NICKEL_BONUS_KEYS = ['mammostar', 'biomarc', 'mammomark', 'hm', 'hmplus'];
/** Bonus markers for permanent visibility preference: lumimark, biomarc only */
const PERMANENT_VISIBILITY_BONUS_KEYS = ['lumimark', 'biomarc'];

const RATING_SCALE = [
  { value: 1, label: 'Never' },
  { value: 2, label: '' },
  { value: 3, label: 'Sometimes' },
  { value: 4, label: '' },
  { value: 5, label: 'Very frequently' },
];

/** Scale for long-term ultrasound visibility / resorbable preference (rating-single only). */
const PERMANENT_VISIBILITY_RATING_SCALE = [
  { value: 1, label: 'Not Important' },
  { value: 2, label: '' },
  { value: 3, label: 'Somewhat Important' },
  { value: 4, label: '' },
  { value: 5, label: 'Very Important' },
];

function getRatingSliderSummaryLabel(value, scale) {
  const v = Number(value);
  const labelFor = (val) => {
    const entry = scale.find((s) => s.value === val);
    const t = entry?.label != null ? String(entry.label).trim() : '';
    return t;
  };
  if (v <= 2) return labelFor(1) || 'Not Important';
  if (v === 3) return labelFor(3) || 'Somewhat Important';
  return labelFor(5) || 'Very Important';
}

function syncRatingSliderScaleNums(wrap, value) {
  const v = Number(value);
  if (v < 1 || v > 5 || Number.isNaN(v)) return;
  wrap.querySelectorAll('.rating-slider-scale-num').forEach((el) => {
    const n = parseInt(el.dataset.value, 10);
    el.classList.toggle('rating-slider-scale-num--active', n === v);
  });
}

function buildRatingMobileSliderHtml(itemIndex, selectedValue) {
  const idxAttr = typeof itemIndex === 'number'
    ? ` data-item-index="${itemIndex}"`
    : '';
  const hasSel = selectedValue != null && selectedValue >= 1 && selectedValue <= 5;
  const val = hasSel ? selectedValue : 3;
  const scaleNums = [1, 2, 3, 4, 5].map(
    (n) => `<span class="rating-slider-scale-num" data-value="${n}">${n}</span>`,
  ).join('');
  return `
    <div class="rating-slider-mobile"${idxAttr}>
      <div class="rating-slider-scale-labels" aria-hidden="true">${scaleNums}</div>
      <input type="range" class="rating-range-input" min="1" max="5" step="1" value="${val}"
        aria-valuemin="1" aria-valuemax="5" aria-valuenow="${val}"
        aria-label="Select rating from 1 to 5" />
      <p class="rating-slider-summary" aria-live="polite"></p>
    </div>`;
}

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
   * @param {Element}
   * @returns {Object}
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
};

/**
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
};

/**
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
};

/**
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
    } else if (!img) {
      const colClone = col.cloneNode(true);
      colClone.querySelectorAll('img, picture, source').forEach((n) => n.remove());
      const plain = colClone.textContent.replace(/\s+/g, ' ').trim();
      if (plain) {
        text = colClone.innerHTML.trim();
      }
    }
  });
  return image || text ? { image, text } : null;
};

const isRichStartTitleContent = (str) => {
  if (str == null || typeof str !== 'string') return false;
  return /<[a-z][\s\S]*>/i.test(str.trim());
};

const MEET_YOUR_MATCH_TITLE_TEXT = /^meet your match$/i;

const normalizeMeetYourMatchStartTitle = (startTitle) => {
  const raw = String(startTitle ?? '').trim();
  if (!raw) return startTitle;

  if (!isRichStartTitleContent(raw)) {
    const plain = raw.replace(/\s+/g, ' ').trim();
    return MEET_YOUR_MATCH_TITLE_TEXT.test(plain) ? DEFAULT_START_TITLE_HTML : startTitle;
  }

  try {
    const doc = new DOMParser().parseFromString(`<div>${raw}</div>`, 'text/html');
    const wrapper = doc.querySelector('div');
    if (!wrapper) return startTitle;

    const buildMeetYourMatchH1Markup = (h1) => {
      const idAttr = h1.id ? ` id="${escapeHtml(h1.id)}"` : '';
      const extra = (h1.className || '').trim().replace(/\s+/g, ' ');
      const classValue = extra
        ? `start-screen-title-heading ${extra}`.trim()
        : 'start-screen-title-heading';
      const classAttr = ` class="${escapeHtml(classValue)}"`;
      return `<h1${classAttr}${idAttr}><span class="start-screen-title-line">Meet Your</span><span class="start-screen-title-line start-screen-title-line--emphasis">Match</span></h1>`;
    };

    let changed = false;
    wrapper.querySelectorAll('h1').forEach((h1) => {
      if (h1.querySelector('.start-screen-title-line')) return;
      const text = h1.textContent.replace(/\s+/g, ' ').trim();
      if (!MEET_YOUR_MATCH_TITLE_TEXT.test(text)) return;
      const tpl = doc.createElement('template');
      tpl.innerHTML = buildMeetYourMatchH1Markup(h1).trim();
      const next = tpl.content.firstElementChild;
      if (next) {
        h1.replaceWith(next);
        changed = true;
      }
    });

    return changed ? wrapper.innerHTML : startTitle;
  } catch {
    return startTitle;
  }
};

const mergeStartTitleFromBlock = (block, config) => {
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;
    const label = toClassName(cols[0].textContent);
    if (label !== 'start-title' && label !== 'starttitle') return;
    const html = cols[1].innerHTML.trim();
    if (html) config['start-title'] = html;
  });
};

class MarkerQuiz {
  constructor(block, config, products) {
    this.block = block;
    this.config = config;
    this.products = products;
    this.loading = true;
    this.showStartScreen = true;
    this.emailResultsFormId = getEmailResultsFormIdFromConfig(config);
    this.contactSalesFormId = getContactSalesFormIdFromConfig(config);
    this.questionImages = config.questionImages || {};
    this.scoreExcludeKeywords = config.scoreExcludeKeywords || [];
    this.questions = [];
    /** Canonical question indices shown in the quiz (authoring keywords omit others). */
    this.visibleQuestionIndices = [];
    this.currentStep = 0;
    this.selections = {};
    this.scores = {};
    this.startScreenInline = false;
    this.startWindowBackgroundUrl = String(config.startWindowBackgroundUrl || '').trim();
    this.showVideoIntroScreen = Boolean(this.startWindowBackgroundUrl);
    /** Warmed in showResults for contact-sales Marketo hidden field (parallel with form load). */
    this._marketoResultsUrlPromise = null;
  }

  /**
   * Close (X): from quiz/results/thank-you, go to Meet Your Match welcome (skips video).
   */
  goToWelcomeScreenFromClose() {
    this.currentStep = 0;
    this.selections = {};
    this.scores = {};
    this.caseMixQ3Floors = undefined;
    this.lastSortableWasMri = undefined;
    this.lastRatingWasMri = undefined;
    this.prevMriForStepRecompute = undefined;
    this.startScreenInline = false;
    this.showStartScreen = true;
    this.showVideoIntroScreen = false;
    document.body.classList.remove('survey-fullscreen-active');
    this.render();
  }

  handleSurveyCloseClick() {
    if (this.showStartScreen && !this.showVideoIntroScreen) {
      if (this.startWindowBackgroundUrl) {
        this.showVideoIntroScreen = true;
        document.body.classList.remove('survey-fullscreen-active');
        this.render();
        return;
      }
      window.location.assign(MARKER_QUIZ_EXIT_URL);
      return;
    }
    const isResultsOrThankYouView = Boolean(
      this.block.querySelector('.results-card, .thank-you-container'),
    );
    if (isResultsOrThankYouView) {
      this.restart();
      return;
    }
    this.goToWelcomeScreenFromClose();
  }

  bindCloseBtn() {
    this.block.querySelector('#close-survey-btn')
      ?.addEventListener('click', () => {
        this.handleSurveyCloseClick();
      });
  }

  clearQuizSelectionRequiredHint() {
    const el = this.block.querySelector('#quiz-selection-required');
    if (!el) return;
    el.textContent = '';
    el.setAttribute('hidden', '');
  }

  showQuizSelectionRequiredHint() {
    const el = this.block.querySelector('#quiz-selection-required');
    if (!el) return;
    el.textContent = 'A selection is required';
    el.removeAttribute('hidden');
  }

  syncQuizSelectionHint(stepIndex) {
    if (this.questions[stepIndex]?.type === 'sortable') return;
    if (this.hasSelection(stepIndex)) this.clearQuizSelectionRequiredHint();
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
      if (this.showVideoIntroScreen) {
        this.renderVideoIntroScreen();
        return;
      }
      this.renderStartScreen();
      return;
    }

    this.showQuizForm();
  }

  renderVideoIntroScreen() {
    const iframeSrc = this.startWindowBackgroundUrl;
    if (!iframeSrc) {
      this.showVideoIntroScreen = false;
      this.renderStartScreen();
      return;
    }

    document.body.classList.add('survey-fullscreen-active');
    this.block.innerHTML = `
          <div class="product-survey-container survey-fullscreen survey-fullscreen-video-intro">
            <div class="start-video-intro-media" aria-hidden="true">
              <iframe
                class="start-video-intro-iframe"
                src="${escapeHtml(iframeSrc)}"
                title=""
                tabindex="-1"
                allow="autoplay; fullscreen; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
            <div class="start-video-intro-scrim" aria-hidden="true"></div>
            <div class="start-video-intro-footer">
              <button type="button" class="start-video-intro-cta">Tap to Begin</button>
            </div>
          </div>`;

    const videoIntroRoot = this.block.querySelector(
      '.product-survey-container.survey-fullscreen-video-intro',
    );
    videoIntroRoot?.addEventListener('click', () => {
      this.showVideoIntroScreen = false;
      this.renderStartScreen();
    });
  }

  renderStartScreen() {
    const startTitle = this.config['start-title'] ?? this.config.startTitle ?? this.config.title ?? DEFAULT_START_TITLE_HTML;
    const startDescription = this.config['start-description'] ?? this.config.startDescription ?? this.config.description ?? DEFAULT_START_DESCRIPTION;
    const startButtonRaw = this.config['start-button'] ?? this.config.startButton ?? this.config.button ?? DEFAULT_START_BUTTON;
    const startButton = typeof startButtonRaw === 'string' ? startButtonRaw.trim() : String(startButtonRaw ?? '').trim();
    const { subHeader } = this.config;
    const descSafe = allowTrademarkHtml(startDescription);
    const btnSafe = allowTrademarkHtml(startButton || DEFAULT_START_BUTTON);

    const subHeaderImageHtml = subHeader?.image
      ? `<div class="start-sub-header-image"><img src="${escapeHtml(subHeader.image)}" alt="" /></div>`
      : '';
    let subHeaderTextHtml = '';
    if (subHeader?.text) {
      const raw = String(subHeader.text).trim();
      subHeaderTextHtml = isRichStartTitleContent(raw)
        ? `<div class="start-sub-header">${raw}</div>`
        : `<div class="start-sub-header">${allowTrademarkHtml(raw)}</div>`;
    } else if (!subHeader?.image) {
      subHeaderTextHtml = `<div class="start-sub-header">${allowTrademarkHtml(DEFAULT_SUB_HEADER_TEXT)}</div>`;
    }

    const startCardInner = `
              <div class="start-screen">
                <div class="start-screen-title-block"></div>
                ${subHeaderImageHtml}
                ${subHeaderTextHtml}
                <p class="start-screen-description">${descSafe}</p>
                <button type="button" class="btn btn-primary" id="start-survey-btn">${btnSafe}</button>
              </div>`;

    if (this.startScreenInline) {
      this.block.innerHTML = `
          <div class="product-survey-container survey-inline-welcome">
            <div class="survey-card start-welcome-card">
              ${startCardInner}
            </div>
          </div>`;
    } else {
      this.block.innerHTML = `
          <div class="product-survey-container survey-fullscreen survey-fullscreen-welcome">
            ${CLOSE_BTN_HTML}
            <div class="start-screen-page-heading">
              <img class="start-screen-page-heading-logo" src="${escapeHtml(START_HEADER_LOGO_URL)}" alt="Mammotome Markers" width="320" height="56" />
            </div>
            <div class="survey-fullscreen-welcome-body">
              <div class="survey-card start-welcome-card">
                ${startCardInner}
              </div>
            </div>
            <div class="start-screen-footer-logo">
              <img src="${escapeHtml(START_FOOTER_LOGO_URL)}" alt="" width="89" height="89" />
            </div>
          </div>`;
      document.body.classList.add('survey-fullscreen-active');
      this.bindCloseBtn();
    }

    const titleRoot = this.block.querySelector('.start-screen-title-block');
    if (titleRoot) {
      const resolvedTitle = normalizeMeetYourMatchStartTitle(startTitle);
      if (isRichStartTitleContent(resolvedTitle)) {
        titleRoot.innerHTML = resolvedTitle;
      } else {
        const plain = String(resolvedTitle).trim();
        titleRoot.innerHTML = `<h1>${allowTrademarkHtml(plain)}</h1>`;
      }
    }

    const startWelcomeRoot = this.block.querySelector(
      '.product-survey-container.survey-fullscreen-welcome, .product-survey-container.survey-inline-welcome',
    );
    const activateWelcomeStart = () => {
      this.showStartScreen = false;
      this.showQuizForm();
    };
    startWelcomeRoot?.addEventListener('click', (e) => {
      if (e.target.closest('.survey-close-btn')) return;
      if (e.target.closest('a[href]')) return;
      activateWelcomeStart();
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
              <div class="quiz-navigation-stack">
                <div class="navigation" id="quiz-nav"></div>
                <p class="quiz-selection-required" id="quiz-selection-required" hidden aria-live="polite"></p>
              </div>
            </div>
          </div>`;

    this.bindCloseBtn();
    this.questions = MarkerQuiz.buildQuestions();
    this.prevMriForStepRecompute = undefined;
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
          { text: 'BiomarC® (Barbell, Petite Barbell, Tribell)', group: 'Mammotome' },
          { text: 'HydroMARK™ (Barrel, Butterfly, Open Coil)', group: 'Mammotome' },
          { text: 'HydroMARK™ Plus (Dragonfly, Hummingbird)', group: 'Mammotome' },
          { text: 'LumiMARK™ (Tulip, Lotus, Rose)', group: 'Mammotome' },
          { text: 'MammoMARK® (Bowtie, Triple Twist, U-Shape)', group: 'Mammotome' },
          { text: 'MammoSTAR®  (Barbell, Tribell)', group: 'Mammotome' },
          { text: 'Hologic SecurMark® (Buckle, Infinity, Stoplight, Mini Cork, Top Hat)', group: 'Hologic' },
          { text: 'Hologic TriMark® and CelerMark™ (Cork, Hourglass)', group: 'Hologic' },
          { text: 'Hologic TuMark® (Q, X, Vision, Eye, U, Conic)', group: 'Hologic' },
          { text: 'BD Gel Mark UltraCor™ or Ultra™ (S, Omega)', group: 'BD' },
          { text: 'BD SenoMark™ (O, X, M, S, Omega)', group: 'BD' },
          { text: 'BD SenoMark™ UltraCor™ MRI (M, X)', group: 'BD' },
          { text: 'BD SenoMark™ Ultra (Ribbon, Coil)', group: 'BD' },
          { text: 'BD UltraClip™ II or UltraClip™ Dual Trigger (Wing, Ribbon, Coil, Heart, Venus)', group: 'BD' },
          { text: 'BD UltraCor™ Twirl™ (Curls, Clover, Ring)', group: 'BD' },
          { text: 'BD UltraCor™ (Spring)', group: 'BD' },
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
        text: 'What specific patient case considerations impact your biopsy marker choice? Select all that apply.',
        type: 'multi',
        options: [
          { text: 'I prefer a cost-effective marker for suspected benign lesions, institutional restrictions, contract limitations, etc.' },
          { text: 'Dense breast tissue impacts my ability to visualize, so I prefer a larger clip or one with ultrasound enhancements.' },
          { text: 'I prefer smaller markers for superficial lesions, or those in the axilla or near breast implants.' },
          { text: 'I prefer to use a specific marker brand or shape for each biopsy modality, so I easily know how the biopsy was performed.' },
        ],
      },
      {
        index: 4,
        text: 'At follow-up imaging, what is your biggest concern about a previously placed marker?',
        type: 'single',
        options: [
          { text: 'Marker migration away from biopsy site', capability: 'anti_migration' },
          { text: 'Poor visibility or no longer visible', capability: 'long_term_us_visibility' },
          { text: 'Inconsistent visibility across different imaging modalities', capability: 'cross_modal_visibility' },
          { text: 'Unable to distinguish marker shape or identify which modality was used', capability: 'shape_distinction' },
          { text: 'Artifact obscuring adjacent tissue on follow-up imaging', capability: 'low_artifact', modalityGated: true },
          { text: 'Marker displaced from site during surgical excision (OR anti-displacement)', capability: 'or_anti_displacement' },
        ],
      },
      {
        index: 5,
        text: 'How often would you use a marker with hemostatic properties?',
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
        text: 'Which best describes your biopsy case mix?',
        type: 'single',
        options: [
          {
            text: 'Diagnostic-Focused',
            capWeights: {
              long_term_us_visibility: 1,
              anti_migration: 1,
              locating: 1,
              affordability: 3,
              cross_modal_visibility: 0,
              shape_distinction: 1,
              low_artifact: 1,
              or_anti_displacement: 0,
            },
            q3Floors: {
              long_term_us_visibility: 1,
              anti_migration: 1,
              locating: 1,
              affordability: 3,
            },
          },
          {
            text: 'Pre-Surgical',
            capWeights: {
              long_term_us_visibility: 3,
              anti_migration: 2,
              locating: 2,
              affordability: 0,
              cross_modal_visibility: 2,
              shape_distinction: 1,
              low_artifact: 1,
              or_anti_displacement: 3,
            },
            q3Floors: {
              long_term_us_visibility: 3,
              anti_migration: 2,
              locating: 2,
              affordability: 0,
            },
          },
          {
            text: 'Oncology-Integrated',
            capWeights: {
              long_term_us_visibility: 3,
              anti_migration: 2,
              locating: 1,
              affordability: 0,
              cross_modal_visibility: 3,
              shape_distinction: 2,
              low_artifact: 1,
              or_anti_displacement: 2,
            },
            q3Floors: {
              long_term_us_visibility: 3,
              anti_migration: 2,
              locating: 1,
              affordability: 0,
            },
          },
          {
            text: 'High-Risk',
            capWeights: {
              long_term_us_visibility: 3,
              anti_migration: 1,
              locating: 2,
              affordability: 0,
              cross_modal_visibility: 2,
              shape_distinction: 3,
              low_artifact: 1,
              or_anti_displacement: 1,
            },
            q3Floors: {
              long_term_us_visibility: 3,
              anti_migration: 1,
              locating: 2,
              affordability: 0,
            },
          },
          {
            text: 'Community Center: Broad Patient Mix',
            capWeights: {
              long_term_us_visibility: 2,
              anti_migration: 1,
              locating: 2,
              affordability: 2,
              cross_modal_visibility: 1,
              shape_distinction: 3,
              low_artifact: 1,
              or_anti_displacement: 1,
            },
            q3Floors: {
              long_term_us_visibility: 2,
              anti_migration: 1,
              locating: 2,
              affordability: 2,
            },
          },
          {
            text: 'Academic / Teaching Hospital',
            capWeights: {
              long_term_us_visibility: 2,
              anti_migration: 1,
              locating: 2,
              affordability: 0,
              cross_modal_visibility: 3,
              shape_distinction: 2,
              low_artifact: 1,
              or_anti_displacement: 1,
            },
            q3Floors: {
              long_term_us_visibility: 2,
              anti_migration: 1,
              locating: 2,
              affordability: 0,
            },
          },
        ],
      },
      {
        index: 7,
        text: 'Do you prefer a marker with long-term ultrasound visibility and without a resorbable component?',
        type: 'rating-single',
        ratingScale: PERMANENT_VISIBILITY_RATING_SCALE,
        /**
         * Omitted when MRI is selected (LumiMARK/BioMaRC vetoed; question has no scoring effect).
         */
        skipWhenMri: true,
      },
      {
        index: 8,
        text: 'How frequently do your patients express the following preferences or needs? '
          + 'Rate each on a scale of 1-5 (1 = Never, 5 = Very frequently)',
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

  /**
   * Authoring "hide" keywords: substring match on question prompt (case-insensitive).
   * Excludes the question from scoring and omits it from the quiz DOM (steps/progress).
   */
  questionExcludedFromScore(question) {
    const text = typeof question === 'string' ? question : question?.text;
    if (!text || !this.scoreExcludeKeywords?.length) return false;
    const hay = text.toLowerCase();
    return this.scoreExcludeKeywords.some((kw) => {
      const k = String(kw).trim().toLowerCase();
      return k && hay.includes(k);
    });
  }

  /** Authoring exclusions + modality-only skips (e.g. permanent-visibility step when MRI). */
  isQuestionVisibleInQuiz(question) {
    if (!question) return false;
    if (this.questionExcludedFromScore(question)) return false;
    if (question.skipWhenMri && this.isMriSelected()) return false;
    return true;
  }

  computeVisibleQuestionIndices() {
    const allIdx = this.questions.map((_, i) => i);
    const visible = allIdx.filter((i) => this.isQuestionVisibleInQuiz(this.questions[i]));
    this.visibleQuestionIndices = visible.length > 0 ? visible : allIdx;
  }

  getPermanentVisibilityQuestionIndex() {
    return this.questions.findIndex((q) => q?.type === 'rating-single');
  }

  getPreferencesRatingQuestionIndex() {
    return this.questions.findIndex((q) => q?.type === 'rating');
  }

  getCurrentQuestionIndex() {
    return this.visibleQuestionIndices[this.currentStep];
  }

  calculateScores() {
    Object.keys(this.products).forEach((id) => {
      this.scores[id] = 0;
    });

    const modalitiesIdx = this.questions.findIndex(
      (q) => q?.text && /modalit/i.test(q.text),
    );
    if (
      modalitiesIdx >= 0
      && modalitiesIdx in this.selections
      && !this.questionExcludedFromScore(this.questions[modalitiesIdx])
    ) {
      const modalitiesQuestion = this.questions[modalitiesIdx];
      const sel = this.selections[modalitiesIdx];
      const modalities = Array.isArray(sel) ? sel : [sel];

      const severityRank = { incompatible: 2, partial: 1, full: 0 };
      const worstCompat = {};

      modalities.forEach((optIdx) => {
        const optionText = modalitiesQuestion?.options?.[optIdx]?.text;
        const modalityIndex = MarkerQuiz.getModalityIndexFromOption(optionText, optIdx);
        const compat = MarkerQuiz.getModalityCompatibility(modalityIndex);

        Object.entries(compat).forEach(([productId, level]) => {
          const resolvedId = this.resolveProductId(productId);
          if (!resolvedId) return;
          const current = worstCompat[resolvedId];
          if (!current || severityRank[level] > severityRank[current]) {
            worstCompat[resolvedId] = level;
          }
        });
      });

      const { ELECTRE_SCORES } = MarkerQuiz;
      Object.entries(worstCompat).forEach(([resolvedId, level]) => {
        if (resolvedId in this.scores) {
          this.scores[resolvedId] += ELECTRE_SCORES[level] ?? 0;
        }
      });
    }

    // Q3: Priority ranking (sortable) — branch by modality (MRI vs default)
    const sortableIdx = this.questions.findIndex((q) => q?.type === 'sortable');
    if (
      sortableIdx >= 0
      && this.selections[sortableIdx]
      && !this.questionExcludedFromScore(this.questions[sortableIdx])
    ) {
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
    if (this.selections[3] && !this.questionExcludedFromScore(this.questions[3])) {
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

    if (this.selections[4] != null && !this.questionExcludedFromScore(this.questions[4])) {
      const { q3_capability_ratings: capRatings } = RANK_SCORES;
      const followupScores = MarkerQuiz.getFollowupConcernScores(
        this.selections[4],
        this.isMriSelected(),
        capRatings,
      );
      Object.entries(followupScores).forEach(([productId, points]) => {
        const resolvedId = this.resolveProductId(productId) ?? productId;
        if (resolvedId in this.scores) this.scores[resolvedId] += points;
      });
    }

    if (this.selections[5] != null && !this.questionExcludedFromScore(this.questions[5])) {
      const bleedingScores = MarkerQuiz.getBleedingScores(this.selections[5]);
      Object.entries(bleedingScores).forEach(([productId, points]) => {
        const resolvedId = this.resolveProductId(productId);
        if (resolvedId) this.scores[resolvedId] += points;
      });
    }

    if (this.selections[6] != null && !this.questionExcludedFromScore(this.questions[6])) {
      const { q3_capability_ratings: capRatings } = RANK_SCORES;
      const { scores: caseMixScores, q3Floors } = MarkerQuiz.getCaseMixScores(
        this.selections[6],
        capRatings,
      );

      Object.entries(caseMixScores).forEach(([productId, points]) => {
        const resolvedId = this.resolveProductId(productId) ?? productId;
        if (resolvedId in this.scores) this.scores[resolvedId] += points;
      });

      if (q3Floors && Object.keys(q3Floors).length > 0) {
        this.caseMixQ3Floors = q3Floors;
      }
    }

    const prefIdx = this.getPreferencesRatingQuestionIndex();
    if (
      prefIdx >= 0
      && this.selections[prefIdx]
      && !this.questionExcludedFromScore(this.questions[prefIdx])
    ) {
      const prefSel = this.selections[prefIdx];
      const naturalRating = prefSel[0] || 1;
      const naturalScores = this.isMriSelected()
        ? MarkerQuiz.getNonAnimalPreferenceScores(naturalRating)
        : MarkerQuiz.getAllNatural(naturalRating);
      Object.entries(naturalScores).forEach(([productId, points]) => {
        const resolvedId = this.resolveProductId(productId);
        if (resolvedId) this.scores[resolvedId] += points;
      });

      if (this.isMriSelected() && naturalRating >= 4) {
        const mammoId = this.resolveProductId('mammomark');
        if (mammoId && mammoId in this.scores) {
          this.scores[mammoId] += MarkerQuiz.ELECTRE_SCORES.incompatible;
        }
      }

      if (!this.isMriSelected()) {
        const nickelRating = prefSel[1] || 1;
        const nickelScores = MarkerQuiz.getNickelScores(nickelRating);
        Object.entries(nickelScores).forEach(([productId, points]) => {
          const resolvedId = this.resolveProductId(productId);
          if (resolvedId) this.scores[resolvedId] += points;
        });
      }
    }

    const permVisIdx = this.getPermanentVisibilityQuestionIndex();
    if (
      permVisIdx >= 0
      && this.selections[permVisIdx] != null
      && !this.isMriSelected()
      && !this.questionExcludedFromScore(this.questions[permVisIdx])
    ) {
      const permVisRating = Number(this.selections[permVisIdx]) || 1;
      const permVisScores = MarkerQuiz.getPermanentVisibilityScores(permVisRating);
      Object.entries(permVisScores).forEach(([productId, points]) => {
        const resolvedId = this.resolveProductId(productId);
        if (resolvedId) this.scores[resolvedId] += points;
      });
    }
  }

  logCurrentScores(trigger) {
    /* eslint-disable no-console -- dev/debug score inspection */
    const saved = { ...this.scores };
    this.calculateScores();
    const sorted = Object.keys(this.scores)
      .map((id) => ({ id, name: this.products[id]?.shortName || id, score: this.scores[id] }))
      .sort((a, b) => b.score - a.score);
    console.log(
      `%c[Marker Quiz] Scores after: ${trigger}`,
      'color: #84329b; font-weight: bold;',
    );
    console.table(sorted.map((p) => {
      const vetoed = p.score <= MarkerQuiz.ELECTRE_VETO_THRESHOLD;
      return {
        Product: p.name,
        Score: vetoed ? 'ELECTRE vetoed' : p.score,
      };
    }));
    this.scores = saved;
    /* eslint-enable no-console */
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

  /**
   * Returns rating items for the current modality (excludes nickel when MRI;
   * natural row label → non-animal for MRI).
   */
  getRatingItemsForQuestion(question) {
    if (question?.type !== 'rating' || !question?.items) return question?.items ?? RATING_ITEMS;
    let items = !this.isMriSelected()
      ? question.items
      : question.items.filter((item) => item.key !== 'nickel_free');
    if (this.isMriSelected()) {
      items = items.map((item) => (item.key === 'natural'
        ? { ...item, text: RATING_ITEM_NON_ANIMAL }
        : item));
    }
    return items;
  }

  /**
   * When natural, nickel, or permanent-visibility rating is 3+, returns the best-scoring
   * marker from the contextual bonus pool, excluding all ids in `excludeIds`
   * (e.g. top pick and strict second-by-score).
   * @param {Set<string>|Iterable<string>} excludeIds
   * @returns {object | null} Product row { id, score, ...catalog fields }
   */
  getRatingBonusProduct(excludeIds) {
    const exclude = excludeIds instanceof Set ? excludeIds : new Set(excludeIds);

    const prefIdx = this.getPreferencesRatingQuestionIndex();
    const ratingSel = prefIdx >= 0 ? this.selections[prefIdx] : null;
    if (!ratingSel || typeof ratingSel !== 'object') return null;

    const naturalRating = ratingSel[0] || 1;
    const nickelRating = this.isMriSelected() ? 0 : (ratingSel[1] || 1);
    const permVisIdx = this.getPermanentVisibilityQuestionIndex();
    const permVisRaw = (permVisIdx >= 0 && !this.isMriSelected())
      ? this.selections[permVisIdx]
      : undefined;
    const permVisRating = (permVisRaw != null) ? (Number(permVisRaw) || 1) : 0;

    const naturalHigh = naturalRating >= 3;
    const nickelHigh = nickelRating >= 3;
    const permVisHigh = permVisRating >= 3;

    if (!naturalHigh && !nickelHigh && !permVisHigh) return null;

    let bonusKeys;

    if (permVisHigh && permVisRating >= naturalRating && permVisRating >= nickelRating) {
      bonusKeys = PERMANENT_VISIBILITY_BONUS_KEYS;
    } else if (naturalHigh && nickelHigh) {
      bonusKeys = naturalRating >= nickelRating ? NATURAL_BONUS_KEYS : NICKEL_BONUS_KEYS;
    } else if (naturalHigh) {
      bonusKeys = NATURAL_BONUS_KEYS;
    } else if (nickelHigh) {
      bonusKeys = NICKEL_BONUS_KEYS;
    } else {
      bonusKeys = PERMANENT_VISIBILITY_BONUS_KEYS;
    }

    const eligible = bonusKeys
      .map((key) => this.resolveProductId(key))
      .filter((id) => id && !exclude.has(id) && this.scores[id] >= 0 && id in this.products);

    if (eligible.length === 0) return null;

    const byScore = eligible
      .map((id) => ({ id, score: this.scores[id], ...this.products[id] }))
      .sort((a, b) => b.score - a.score);
    return byScore[0];
  }

  /**
   * When bleeding is "Often" or "Occasionally" and MammoMARK is not already
   * among the primary and "You Should Also Consider" picks, returns a
   * bleeding-based recommendation for MammoMARK.
   * @param {string} topProductId
   * @param {string[]} alternativeProductIds
   * @returns {{ product: object } | null}
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

    const product = { id: mammomarkId, ...this.products[mammomarkId] };

    return { product };
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

  /**
   * ELECTRE modality compatibility table.
   * @param {number} optionIndex 0=Ultrasound, 1=Stereotactic, 2=MRI
   * @returns {{ [productKey: string]: 'full'|'partial'|'incompatible' }}
   */
  static getModalityCompatibility(optionIndex) {
    const compatibility = [
      {
        hm: 'full',
        hmplus: 'full',
        mammomark: 'full',
        mammostar: 'full',
        lumimark: 'full',
        biomarc: 'full',
      },
      {
        hm: 'full',
        hmplus: 'incompatible',
        mammomark: 'full',
        mammostar: 'full',
        lumimark: 'incompatible',
        biomarc: 'partial',
      },
      {
        hm: 'full',
        hmplus: 'full',
        mammomark: 'full',
        mammostar: 'incompatible',
        lumimark: 'incompatible',
        biomarc: 'incompatible',
      },
    ];
    return compatibility[optionIndex] || {};
  }

  static get ELECTRE_VETO_THRESHOLD() { return -9000; }

  static get ELECTRE_SCORES() {
    return { full: 15, partial: -20, incompatible: -9999 };
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
          hm: 5, hmplus: 4, mammomark: 4, mammostar: 3, lumimark: 0, biomarc: 3,
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

  static getFollowupConcernScores(optionIndex, isMriContext, capRatings) {
    const OPTION_CAPABILITY_MAP = [
      'anti_migration',
      'long_term_us_visibility',
      'cross_modal_visibility',
      'shape_distinction',
      'low_artifact',
      'or_anti_displacement',
    ];
    const PREFERENCE_THRESHOLD = 4;
    const ARTIFACT_US_WEIGHT = 0.4;

    const capability = OPTION_CAPABILITY_MAP[optionIndex];
    if (!capability) return {};

    const products = Object.keys(capRatings);
    const scores = {};

    products.forEach((p) => {
      let flow = 0;
      const ratingP = capRatings[p]?.[capability] ?? 0;
      products.forEach((q) => {
        if (p === q) return;
        const ratingQ = capRatings[q]?.[capability] ?? 0;
        const diff = ratingP - ratingQ;
        flow += Math.max(0, Math.min(diff, PREFERENCE_THRESHOLD)) / PREFERENCE_THRESHOLD
              - Math.max(0, Math.min(-diff, PREFERENCE_THRESHOLD)) / PREFERENCE_THRESHOLD;
      });
      const rawFlow = flow / (products.length - 1);
      const weight = (optionIndex === 4 && !isMriContext) ? ARTIFACT_US_WEIGHT : 1.0;
      scores[p] = parseFloat((rawFlow * weight * 10).toFixed(2));
    });

    return scores;
  }

  static getCaseMixScores(optionIndex, capRatings) {
    const BUCKET_WEIGHTS = [
      {
        long_term_us_visibility: 1,
        anti_migration: 1,
        locating: 1,
        affordability: 3,
        cross_modal_visibility: 0,
        shape_distinction: 1,
        low_artifact: 1,
        or_anti_displacement: 0,
      },
      {
        long_term_us_visibility: 3,
        anti_migration: 2,
        locating: 2,
        affordability: 0,
        cross_modal_visibility: 2,
        shape_distinction: 1,
        low_artifact: 1,
        or_anti_displacement: 3,
      },
      {
        long_term_us_visibility: 3,
        anti_migration: 2,
        locating: 1,
        affordability: 0,
        cross_modal_visibility: 3,
        shape_distinction: 2,
        low_artifact: 1,
        or_anti_displacement: 2,
      },
      {
        long_term_us_visibility: 3,
        anti_migration: 1,
        locating: 2,
        affordability: 0,
        cross_modal_visibility: 2,
        shape_distinction: 3,
        low_artifact: 1,
        or_anti_displacement: 1,
      },
      {
        long_term_us_visibility: 2,
        anti_migration: 1,
        locating: 2,
        affordability: 2,
        cross_modal_visibility: 1,
        shape_distinction: 3,
        low_artifact: 1,
        or_anti_displacement: 1,
      },
      {
        long_term_us_visibility: 2,
        anti_migration: 1,
        locating: 2,
        affordability: 0,
        cross_modal_visibility: 3,
        shape_distinction: 2,
        low_artifact: 1,
        or_anti_displacement: 1,
      },
    ];

    const Q3_FLOORS = [
      {
        long_term_us_visibility: 1, anti_migration: 1, locating: 1, affordability: 3,
      },
      {
        long_term_us_visibility: 3, anti_migration: 2, locating: 2, affordability: 0,
      },
      {
        long_term_us_visibility: 3, anti_migration: 2, locating: 1, affordability: 0,
      },
      {
        long_term_us_visibility: 3, anti_migration: 1, locating: 2, affordability: 0,
      },
      {
        long_term_us_visibility: 2, anti_migration: 1, locating: 2, affordability: 2,
      },
      {
        long_term_us_visibility: 2, anti_migration: 1, locating: 2, affordability: 0,
      },
    ];

    const weights = BUCKET_WEIGHTS[optionIndex];
    const q3Floors = Q3_FLOORS[optionIndex];
    if (!weights) return { scores: {}, q3Floors: {} };

    const scores = {};
    Object.entries(capRatings).forEach(([productId, caps]) => {
      let total = 0;
      Object.entries(weights).forEach(([cap, w]) => {
        total += (caps[cap] ?? 0) * w;
      });
      const maxRaw = Object.values(weights).reduce((a, b) => a + b, 0) * 5;
      scores[productId] = maxRaw > 0 ? parseFloat(((total / maxRaw) * 15).toFixed(2)) : 0;
    });

    return { scores, q3Floors };
  }

  static getBleedingScores(optionIndex) {
    const scores = [
      // Often
      {
        hm: 0, hmplus: 1, mammomark: 5, mammostar: 0, lumimark: 0, biomarc: 0,
      },
      // Occasionally
      {
        hm: 0, hmplus: 1, mammomark: 5, mammostar: 0, lumimark: 0, biomarc: 0,
      },
      // Rarely
      {
        hm: 0, hmplus: 1, mammomark: 1, mammostar: 0, lumimark: 0, biomarc: 0,
      },
      // Never
      {
        hm: 0, hmplus: 0, mammomark: 0, mammostar: 0, lumimark: 0, biomarc: 0,
      },
    ];
    return scores[optionIndex] || {};
  }

  static getAllNatural(rating) {
    // Rating 1-5; Ultrasound/Stereotactic “natural markers” row.
    // MRI uses getNonAnimalPreferenceScores.
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

  /**
   * MRI “non-animal markers” row: same bonus curve as natural for mammostar/biomarc;
   * rating 3 → small MammoMARK penalty only; ratings 4–5 → hard veto applied in calculateScores.
   */
  static getNonAnimalPreferenceScores(rating) {
    const bonusMap = {
      1: 0, 2: 1, 3: 2, 4: 4, 5: 6,
    };
    const bonus = bonusMap[rating] || 0;
    const mammoPenalty = rating === 3 ? -1 : 0;

    return {
      mammostar: bonus,
      biomarc: bonus,
      hm: 0,
      hmplus: 0,
      mammomark: mammoPenalty,
      lumimark: 0,
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

  static getPermanentVisibilityScores(rating) {
    const bonusMap = {
      1: 0, 2: 1, 3: 2, 4: 4, 5: 6,
    };
    const bonus = bonusMap[rating] || 0;

    return {
      lumimark: bonus,
      biomarc: bonus,
      hm: 0,
      hmplus: 0,
      mammomark: 0,
      mammostar: 0,
    };
  }

  buildSheetPayload() {
    const sortedProducts = Object.keys(this.scores)
      .map((id) => ({ id, score: this.scores[id], ...this.products[id] }))
      .sort((a, b) => b.score - a.score);
    const eligibleForPayload = sortedProducts.filter(
      (p) => p.score > MarkerQuiz.ELECTRE_VETO_THRESHOLD,
    );
    const top = eligibleForPayload[0] ?? sortedProducts[0];

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

    const ratingIdx = this.questions.findIndex((q) => q?.type === 'rating');
    const ratingSel = (ratingIdx >= 0 ? this.selections[ratingIdx] : null) || {};
    const isMri = this.isMriSelected();
    const bio = Number(ratingSel[0] ?? 0);
    const nick = isMri ? undefined : Number(ratingSel[1] ?? 0);
    const permVisIdx = this.getPermanentVisibilityQuestionIndex();
    const permVis = (permVisIdx >= 0 && !isMri)
      ? Number(this.selections[permVisIdx] ?? 0)
      : undefined;

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

    const followupIdx = this.questions.findIndex(
      (q) => q?.text && /follow.?up imaging/i.test(q.text),
    );
    const followupSel = followupIdx >= 0 ? this.selections[followupIdx] : null;
    const followupConcern = followupSel != null
      ? (this.questions[followupIdx]?.options?.[followupSel]?.text || `option ${followupSel}`)
      : '';

    const caseMixIdx = this.questions.findIndex(
      (q) => q?.text && /biopsy case mix/i.test(q.text),
    );
    const caseMixSel = caseMixIdx >= 0 ? this.selections[caseMixIdx] : null;
    const caseMix = caseMixSel != null
      ? (this.questions[caseMixIdx]?.options?.[caseMixSel]?.text || `option ${caseMixSel}`)
      : '';

    const bleedingIdx = this.questions.findIndex(
      (q) => q?.text && /bleeding|hematoma/i.test(q.text),
    );
    const bleedingSel = bleedingIdx >= 0 ? this.selections[bleedingIdx] : null;
    const bleedingConcern = bleedingSel != null
      ? (this.questions[bleedingIdx]?.options?.[bleedingSel]?.text || `option ${bleedingSel}`)
      : '';

    const sheetSecond = eligibleForPayload[1];
    const sheetRatingBonus = sheetSecond
      ? this.getRatingBonusProduct(new Set([top?.id, sheetSecond.id].filter(Boolean)))
      : null;

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
      followup_concern: followupConcern,
      case_mix: caseMix,
      bleeding_concern: bleedingConcern,
      natural_rating: bio,
      ...(nick !== undefined ? { nickel_rating: nick } : {}),
      ...(permVis !== undefined ? { permanent_visibility_rating: permVis } : {}),
      all_scores: { ...this.scores },
      second_product_id: sheetSecond?.id || '',
      second_product_name: sheetSecond?.name || '',
      third_product_id: sheetRatingBonus?.id || '',
      third_product_name: sheetRatingBonus?.name || '',
    };
  }

  showResults() {
    prefetchMarketoForms2();
    this._marketoResultsUrlPromise = prepareQuizResultsUrlForMarketo();
    const sortedProducts = Object.keys(this.scores)
      .map((id) => ({ id, score: this.scores[id], ...this.products[id] }))
      .sort((a, b) => b.score - a.score);

    const eligibleProducts = sortedProducts.filter(
      (p) => p.score > MarkerQuiz.ELECTRE_VETO_THRESHOLD,
    );

    const topProduct = eligibleProducts[0] ?? sortedProducts[0];
    const secondByScore = eligibleProducts[1];
    const alternativeProducts = [];
    if (secondByScore) {
      alternativeProducts.push(secondByScore);
      const ratingBonusProduct = this.getRatingBonusProduct(
        new Set([topProduct?.id, secondByScore.id].filter(Boolean)),
      );
      if (ratingBonusProduct && ratingBonusProduct.id !== secondByScore.id) {
        alternativeProducts.push(ratingBonusProduct);
      }
    }

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
                    <div class="top-recommendation-heading">
                      <p class="top-recommendation-label">Your top recommended marker</p>
                      <h1 class="top-recommendation-name">${allowTrademarkHtml(topProduct.name)}</h1>
                    </div>
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

                <hr class="divider primary">
                <div class="alternatives-section">
                  <h3>You Should Also Consider</h3>
                  <div class="alternatives-grid">
                    ${alternativeProducts.map((prod) => `
                      <div class="product-card">
                        <div class="product-image">
                          <img src="${escapeHtml(prod.recommendationImage || prod.cardImage || prod.image)}" alt="${stripHtmlForAlt(prod.name)}" />
                        </div>
                        <h4>${allowTrademarkHtml(prod.name)}</h4>
                      </div>
                    `).join('')}
                    ${bleedingContext ? `
                      <div class="product-card">
                        <div class="product-image">
                          <img src="${escapeHtml(bleedingContext.product.recommendationImage || bleedingContext.product.cardImage || bleedingContext.product.image)}" alt="${stripHtmlForAlt(bleedingContext.product.name)}" />
                        </div>
                        <h4>${allowTrademarkHtml(bleedingContext.product.name)}</h4>
                      </div>
                    ` : ''}
                  </div>
                </div>
    
    
                <hr class="divider primary">
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

    this.block.querySelector('#contact-yes-btn')?.addEventListener('click', async () => {
      if (!this.contactSalesFormId) return;
      const contactButtons = this.block.querySelector('.contact-section .contact-buttons');
      const contactSection = this.block.querySelector('.contact-section');
      if (contactButtons) contactButtons.style.display = 'none';
      await openContactSalesMarketoOverlay({
        contactSalesFormId: this.contactSalesFormId,
        extendHiddenFields: async (f) => {
          const resultsUrl = await (this._marketoResultsUrlPromise || prepareQuizResultsUrlForMarketo());
          try {
            f.addHiddenFields({
              quizResultsURL: resultsUrl,
              Products__c: buildMarketoEmailResultsProductFieldValue(this.buildSheetPayload()),
            });
          } catch (err) {
            /* ignore: hidden field optional */
          }
        },
        getSheetPayload: () => ({}),
        contactSectionEl: contactSection,
        contactButtonsEl: contactButtons,
        overlayHost: this.block.querySelector('.product-survey-container.survey-fullscreen'),
        onFinishClose: () => this.restart(),
      });
    });

    this.block.querySelector('#contact-no-btn')?.addEventListener('click', () => {
      this.restart();
    });

    const requestResultsBtn = this.block.querySelector('#request-results-btn');
    const emailFormWrapper = this.block.querySelector('#email-results-form-wrapper');

    if (this.emailResultsFormId && requestResultsBtn && emailFormWrapper) {
      requestResultsBtn.addEventListener('click', async () => {
        requestResultsBtn.style.display = 'none';
        emailFormWrapper.innerHTML = EMAIL_RESULTS_LOADING_HTML;
        emailFormWrapper.style.display = 'block';
        try {
          const form = await embedMarketoForm(emailFormWrapper, this.emailResultsFormId);

          const submitBtn = emailFormWrapper.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.disabled = true;

          const resultsUrl = await prepareQuizResultsUrlForMarketo();
          const sheetPayload = this.buildSheetPayload();

          form.addHiddenFields({
            quizResultsURL: resultsUrl,
            Product__c: buildMarketoEmailResultsProductFieldValue(sheetPayload),
          });

          if (submitBtn) submitBtn.disabled = false;

          form.onSuccess((values) => {
            sendToSheet(this.buildSheetPayload(), { email: extractEmailFromMarketoSuccessValues(values) });
            emailFormWrapper.innerHTML = EMAIL_RESULTS_THANK_YOU_HTML;
            return false;
          });
        } catch (e) {
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
    const mriNow = this.isMriSelected();
    if (this.prevMriForStepRecompute !== undefined && this.prevMriForStepRecompute !== mriNow) {
      const pIdx = this.getPermanentVisibilityQuestionIndex();
      if (pIdx >= 0) delete this.selections[pIdx];
    }
    this.prevMriForStepRecompute = mriNow;

    this.computeVisibleQuestionIndices();
    if (this.currentStep >= this.visibleQuestionIndices.length) {
      this.currentStep = Math.max(0, this.visibleQuestionIndices.length - 1);
    }

    const qIdx = this.getCurrentQuestionIndex();
    const question = this.questions[qIdx];
    if (!question) return;

    const visibleCount = this.visibleQuestionIndices.length;
    const stepPos = this.currentStep;
    const isLast = stepPos === visibleCount - 1;
    const isMulti = question.type === 'multi';
    const isGroupedMulti = question.type === 'grouped-multi';
    const isSortable = question.type === 'sortable';
    const isRating = question.type === 'rating';
    const isRatingSingle = question.type === 'rating-single';

    const progressBar = this.block.querySelector('#quiz-progress-bar');
    if (progressBar) {
      progressBar.innerHTML = this.visibleQuestionIndices.map((_, vi) => {
        const classes = ['progress-segment'];
        if (vi < stepPos) classes.push('completed');
        if (vi === stepPos) classes.push('active');
        return `<div class="${classes.join(' ')}"></div>`;
      }).join('');
    }

    const display = this.block.querySelector('#quiz-question-display');
    if (display) {
      if (isSortable) {
        this.renderSortableQuestion(display, question);
      } else if (isRatingSingle) {
        this.renderRatingSingleQuestion(display, question);
      } else if (isRating) {
        this.renderRatingQuestion(display, question);
      } else if (isGroupedMulti) {
        this.renderGroupedMultiQuestion(display, question);
      } else {
        const optionsHtml = question.options.map((opt, i) => {
          const selected = this.isOptionSelected(qIdx, i);
          const indicator = isMulti ? 'checkbox' : 'radio';
          return `<div class="option${selected ? ' selected' : ''}" data-option-index="${i}">
                <div class="option-content">
                  <span class="${indicator}${selected ? ' checked' : ''}"></span>
                  <span class="option-text">${allowTrademarkHtml(opt.text)}</span>
                </div>
              </div>`;
        }).join('');

        const qImage = this.questionImages[qIdx + 1];
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
              qIdx,
              parseInt(optEl.dataset.optionIndex, 10),
            );
          });
        });
      }
    }

    const nav = this.block.querySelector('#quiz-nav');
    if (nav) {
      this.clearQuizSelectionRequiredHint();
      nav.innerHTML = `
            <button class="btn btn-secondary" id="quiz-prev-btn" ${stepPos === 0 ? 'disabled' : ''}>← Previous</button>
            <div class="question-counter">Question ${stepPos + 1} of ${visibleCount}</div>
            <button class="btn" id="quiz-next-btn">${isLast ? 'Get Results' : 'Next'} →</button>`;

      nav.querySelector('#quiz-prev-btn')?.addEventListener('click', () => {
        if (this.currentStep > 0) {
          this.currentStep -= 1;
          this.renderStep();
        }
      });

      nav.querySelector('#quiz-next-btn')?.addEventListener('click', () => {
        if (!isSortable && !this.hasSelection(qIdx)) {
          this.showQuizSelectionRequiredHint();
          return;
        }
        this.clearQuizSelectionRequiredHint();
        if (isLast) {
          prefetchMarketoForms2();
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
        this.syncQuizSelectionHint(step);
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

    this.syncQuizSelectionHint(stepIndex);
  }

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
      const pointsHtml = RATING_SCALE.map((s) => {
        const selected = selections[itemIdx] === s.value;
        return `
              <div class="rating-scale-point${selected ? ' selected' : ''}"
                   data-item-index="${itemIdx}" data-value="${s.value}">
                <span class="rating-radio${selected ? ' checked' : ''}"></span>
                <span class="rating-value">${s.value}</span>
                ${s.label ? `<span class="rating-label">${allowTrademarkHtml(s.label)}</span>` : ''}
              </div>`;
      }).join('');
      const scaleHtml = `${pointsHtml}${buildRatingMobileSliderHtml(itemIdx, selections[itemIdx])}`;

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
    this.bindRatingRangeSliders(display, question, 'multi');
  }

  renderRatingSingleQuestion(display, question) {
    const step = question.index;
    const selected = this.selections[step];
    const scale = question.ratingScale || RATING_SCALE;

    const pointsHtml = scale.map((s) => {
      const isSelected = selected === s.value;
      return `
            <div class="rating-scale-point${isSelected ? ' selected' : ''}"
                 data-value="${s.value}">
              <span class="rating-radio${isSelected ? ' checked' : ''}"></span>
              <span class="rating-value">${s.value}</span>
              ${s.label ? `<span class="rating-label">${allowTrademarkHtml(s.label)}</span>` : ''}
            </div>`;
    }).join('');
    const scaleHtml = `${pointsHtml}${buildRatingMobileSliderHtml(undefined, selected)}`;

    const qImage = this.questionImages[step + 1];
    const imageHtml = qImage
      ? `<div class="question-image"><img src="${escapeHtml(qImage.image)}" alt="" /></div>`
      : '';
    const imageLayoutClass = qImage ? ` has-image image-${qImage.placement}` : '';
    const optionsBlock = `
          <div class="rating-container rating-single-page">
            <div class="rating-item rating-item--single-scale">
              <div class="rating-scale">${scaleHtml}</div>
            </div>
          </div>`;
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
        this.selectRatingSingle(question, parseInt(el.dataset.value, 10));
      });
    });
    this.bindRatingRangeSliders(display, question, 'single');
  }

  bindRatingRangeSliders(display, question, mode) {
    const scale = mode === 'single'
      ? (question.ratingScale || RATING_SCALE)
      : RATING_SCALE;
    const step = question.index;
    display.querySelectorAll('.rating-slider-mobile').forEach((wrap) => {
      const input = wrap.querySelector('.rating-range-input');
      const summary = wrap.querySelector('.rating-slider-summary');
      if (!input || !summary) return;
      const itemIdx = wrap.dataset.itemIndex !== undefined && wrap.dataset.itemIndex !== ''
        ? parseInt(wrap.dataset.itemIndex, 10)
        : null;
      let initialSelected;
      if (mode === 'single') {
        initialSelected = this.selections[step];
      } else if (itemIdx != null) {
        initialSelected = this.selections[step]?.[itemIdx];
      } else {
        initialSelected = undefined;
      }
      let committed = initialSelected != null && initialSelected >= 1 && initialSelected <= 5;
      if (committed) input.value = String(initialSelected);
      const applySummary = () => {
        const v = parseInt(input.value, 10);
        summary.textContent = committed
          ? getRatingSliderSummaryLabel(v, scale)
          : 'Drag the slider to rate';
        input.setAttribute('aria-valuenow', String(v));
        syncRatingSliderScaleNums(wrap, v);
      };
      applySummary();
      input.addEventListener('input', () => {
        committed = true;
        const v = parseInt(input.value, 10);
        summary.textContent = getRatingSliderSummaryLabel(v, scale);
        input.setAttribute('aria-valuenow', String(v));
        syncRatingSliderScaleNums(wrap, v);
        if (mode === 'single') {
          this.selectRatingSingle(question, v);
        } else if (itemIdx != null) {
          this.selectRating(question, itemIdx, v);
        }
      });
    });
  }

  selectRatingSingle(question, value) {
    const step = question.index;
    this.selections[step] = value;

    const container = this.block.querySelector('.rating-single-page');
    if (container) {
      container.querySelectorAll('.rating-scale-point').forEach((pt) => {
        const v = parseInt(pt.dataset.value, 10);
        const isSelected = v === value;
        pt.classList.toggle('selected', isSelected);
        pt.querySelector('.rating-radio')?.classList.toggle('checked', isSelected);
      });
      const scaleEl = container.querySelector('.rating-scale');
      const range = scaleEl?.querySelector('.rating-range-input');
      const summary = scaleEl?.querySelector('.rating-slider-summary');
      const sc = question.ratingScale || RATING_SCALE;
      if (range && summary) {
        range.value = String(value);
        range.setAttribute('aria-valuenow', String(value));
        summary.textContent = getRatingSliderSummaryLabel(value, sc);
        const mobileWrap = range.closest('.rating-slider-mobile');
        if (mobileWrap) syncRatingSliderScaleNums(mobileWrap, value);
      }
    }

    this.logCurrentScores(`Q${step + 1} rating-single — permanent visibility = ${value}`);

    this.syncQuizSelectionHint(step);
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
      const scaleEl = itemEl.querySelector('.rating-scale');
      const range = scaleEl?.querySelector('.rating-range-input');
      const summary = scaleEl?.querySelector('.rating-slider-summary');
      if (range && summary) {
        range.value = String(value);
        range.setAttribute('aria-valuenow', String(value));
        summary.textContent = getRatingSliderSummaryLabel(value, RATING_SCALE);
        const mobileWrap = range.closest('.rating-slider-mobile');
        if (mobileWrap) syncRatingSliderScaleNums(mobileWrap, value);
      }
    }

    const items = this.getRatingItemsForQuestion(question);
    const itemLabel = items[itemIndex]?.text || `item ${itemIndex}`;
    this.logCurrentScores(`Q${step + 1} rating — "${itemLabel}" = ${value}`);

    this.syncQuizSelectionHint(step);
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
    const qIdx = this.getCurrentQuestionIndex();
    const question = this.questions[qIdx];
    if (!question || question.type !== 'sortable') return;

    const container = this.block.querySelector('.options-container');
    if (!container) return;

    const indices = [...container.querySelectorAll('.option.sortable')]
      .map((el) => parseInt(el.dataset.optionIndex, 10));
    this.selections[qIdx] = indices;

    const options = this.getSortableOptionsForQuestion(question);

    const rankList = indices.map((i, rank) => `${rank + 1}. ${options[i].text}`).join(', ');
    this.logCurrentScores(`Q${qIdx + 1} reorder — ${rankList}`);

    MarkerQuiz.fixDropZonePairing(container);
  }

  static fixDropZonePairing(container) {
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

    this.syncQuizSelectionHint(stepIndex);
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
    if (question?.type === 'rating-single') {
      const v = this.selections[stepIndex];
      return v != null && v >= 1 && v <= 5;
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
    this.caseMixQ3Floors = undefined;
    this.lastSortableWasMri = undefined;
    this.lastRatingWasMri = undefined;
    this.prevMriForStepRecompute = undefined;
    this.startScreenInline = false;
    this.showStartScreen = true;
    this.showVideoIntroScreen = Boolean(this.startWindowBackgroundUrl);
    this._marketoResultsUrlPromise = null;
    document.body.classList.remove('survey-fullscreen-active');
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
};

/*
 * ?=preview helps develop the layout without going through the quiz. Also for MAPSS purposes.
 */

const getPreviewParams = () => {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('preview')) {
    return { active: false, slug: null };
  }
  let slug = params.get('preview');
  if (slug && slug.includes('?preview=')) {
    slug = slug.split('?preview=')[0].trim() || null;
  }
  if (slug == null || String(slug).trim() === '') {
    return { active: true, slug: null };
  }
  return { active: true, slug: String(slug).trim() };
};

const findProductBySlug = (products, slug) => {
  if (!slug) return null;
  const slugNorm = String(slug).toLowerCase().trim();
  return Object.values(products).find(
    (p) => p.slug === slugNorm || p.id === slugNorm,
  ) || null;
};

const getDefaultPreviewProduct = (products) => {
  const list = Object.values(products || {}).filter(Boolean);
  if (list.length === 0) return null;
  return [...list].sort((a, b) => a.slug.localeCompare(b.slug))[0];
};

const buildPreviewSheetPayload = (topProduct, products) => {
  const others = Object.values(products || {})
    .filter((p) => p.id !== topProduct.id)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const second = others[0] || {};
  const third = others[1] || {};
  return {
    date_time: new Date().toISOString(),
    top_product_id: topProduct.id || '',
    top_product_name: topProduct.name || '',
    top_score: 0,
    current_bx_markers: '(preview mode)',
    modality: '',
    priority_1: '',
    priority_2: '',
    priority_3: '',
    priority_4: '',
    patient_cases: '',
    followup_concern: '',
    case_mix: '',
    bleeding_concern: '',
    natural_rating: 0,
    all_scores: {
      hm: 0, hmplus: 0, mammomark: 0, mammostar: 0, biomarc: 0, lumimark: 0,
    },
    second_product_id: second.id || '',
    second_product_name: second.name || '',
    third_product_id: third.id || '',
    third_product_name: third.name || '',
  };
};

const pickPreviewAlternativeProducts = (topProduct, products, limit = 2) => (
  Object.values(products || {})
    .filter((p) => p.id !== topProduct.id)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .slice(0, limit)
);

const wirePreviewResultsPage = (block, product, products, config) => {
  const emailResultsFormId = getEmailResultsFormIdFromConfig(config);
  const contactSalesFormId = getContactSalesFormIdFromConfig(config);
  const sheetPayload = () => buildPreviewSheetPayload(product, products);
  const previewResultsUrlPromise = prepareQuizResultsUrlForMarketo();

  /** Leave preview mode and load the real quiz from the start (same as Take Quiz Again). */
  const exitPreviewToQuizStart = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('preview');
    window.location.assign(url.toString());
  };

  block.querySelector('#close-survey-btn')?.addEventListener('click', () => {
    exitPreviewToQuizStart();
  });

  block.querySelectorAll('.product-video-thumbnail').forEach((btn) => {
    btn.addEventListener('click', () => openProductVideo(btn.dataset.videoUrl));
  });

  block.querySelector('#restart-btn')?.addEventListener('click', () => {
    exitPreviewToQuizStart();
  });

  block.querySelector('#preview-product-select')?.addEventListener('change', (e) => {
    const url = new URL(window.location);
    url.searchParams.set('preview', e.target.value);
    window.location.href = url.toString();
  });

  block.querySelector('#contact-yes-btn')?.addEventListener('click', async () => {
    if (!contactSalesFormId) return;
    const contactButtons = block.querySelector('.contact-section .contact-buttons');
    const contactSection = block.querySelector('.contact-section');
    if (contactButtons) contactButtons.style.display = 'none';
    await openContactSalesMarketoOverlay({
      contactSalesFormId,
      extendHiddenFields: async (f) => {
        const resultsUrl = await previewResultsUrlPromise;
        try {
          f.addHiddenFields({
            quizResultsURL: resultsUrl,
            Products__c: buildMarketoEmailResultsProductFieldValue(sheetPayload()),
          });
        } catch (err) {
          /* ignore: hidden field optional */
        }
      },
      getSheetPayload: sheetPayload,
      contactSectionEl: contactSection,
      contactButtonsEl: contactButtons,
      overlayHost: block.querySelector('.product-survey-container.survey-fullscreen'),
      onFinishClose: () => exitPreviewToQuizStart(),
    });
  });

  block.querySelector('#contact-no-btn')?.addEventListener('click', () => {
    exitPreviewToQuizStart();
  });

  const requestResultsBtn = block.querySelector('#request-results-btn');
  const emailFormWrapper = block.querySelector('#email-results-form-wrapper');

  if (emailResultsFormId && requestResultsBtn && emailFormWrapper) {
    requestResultsBtn.addEventListener('click', async () => {
      requestResultsBtn.style.display = 'none';
      emailFormWrapper.innerHTML = EMAIL_RESULTS_LOADING_HTML;
      emailFormWrapper.style.display = 'block';
      try {
        const form = await embedMarketoForm(emailFormWrapper, emailResultsFormId);
        const submitBtn = emailFormWrapper.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        const resultsUrl = await prepareQuizResultsUrlForMarketo();
        const previewPayload = sheetPayload();
        form.addHiddenFields({
          quizResultsURL: resultsUrl,
          Product__c: buildMarketoEmailResultsProductFieldValue(previewPayload),
        });
        if (submitBtn) submitBtn.disabled = false;
        form.onSuccess((values) => {
          sendToSheet(sheetPayload(), { email: extractEmailFromMarketoSuccessValues(values) });
          emailFormWrapper.innerHTML = EMAIL_RESULTS_THANK_YOU_HTML;
          return false;
        });
      } catch (e) {
        emailFormWrapper.innerHTML = '<p class="contact-sales-form-error">Unable to load form.</p>';
      }
    });
  } else if (requestResultsBtn) {
    const leadForm = block.querySelector('#lead-capture-form');
    const leadConfirmation = block.querySelector('#lead-capture-confirmation');
    const leadError = block.querySelector('.lead-capture-error');

    requestResultsBtn.addEventListener('click', () => {
      requestResultsBtn.style.display = 'none';
      if (leadForm) leadForm.style.display = 'block';
      block.querySelector('#lead-name')?.focus();
    });

    block.querySelector('#lead-cancel-btn')?.addEventListener('click', () => {
      if (leadForm) leadForm.style.display = 'none';
      requestResultsBtn.style.display = '';
    });

    block.querySelector('#lead-submit-btn')?.addEventListener('click', () => {
      const name = block.querySelector('#lead-name')?.value?.trim() || '';
      const email = block.querySelector('#lead-email')?.value?.trim() || '';
      const facility = block.querySelector('#lead-facility')?.value?.trim() || '';
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!name || !emailValid) {
        if (leadError) leadError.style.display = 'block';
        return;
      }
      if (leadError) leadError.style.display = 'none';
      if (leadForm) leadForm.style.display = 'none';
      if (leadConfirmation) leadConfirmation.style.display = 'block';
      sendToSheet({
        ...sheetPayload(), name, email, facility,
      });
    });
  }

  applyVimeoThumbnails(block);
};

const renderPreview = (block, product, products, config) => {
  prefetchMarketoForms2();
  const allProducts = Object.values(products);
  const options = allProducts
    .map((p) => `<option value="${p.slug}"${p.slug === product.slug ? ' selected' : ''}>${p.name}</option>`)
    .join('');
  const emailResultsFormId = getEmailResultsFormIdFromConfig(config);
  const alternativeProducts = pickPreviewAlternativeProducts(product, products, 2);
  const alternativesHtml = alternativeProducts.length
    ? alternativeProducts.map((prod) => `
                      <div class="product-card">
                        <div class="product-image">
                          <img src="${escapeHtml(prod.recommendationImage || prod.cardImage || prod.image)}" alt="${stripHtmlForAlt(prod.name)}" />
                        </div>
                        <h4>${allowTrademarkHtml(prod.name)}</h4>
                      </div>`).join('')
    : `
                      <div class="product-card preview-alternative-fallback">
                        <div class="product-image">
                          <img src="${PLACEHOLDER_IMAGE}" alt="" />
                        </div>
                        <h4>No other products in feed</h4>
                      </div>`;
  const emailOrLeadBlock = emailResultsFormId
    ? '<div id="email-results-form-wrapper" class="email-results-form-wrapper" style="display:none;"></div>'
    : `
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
                  </p>`;

  document.body.classList.add('survey-fullscreen-active');

  block.innerHTML = `
        <div class="product-survey-container survey-fullscreen">
          ${CLOSE_BTN_HTML}
          <div class="preview-bar">
            <span class="preview-bar-label">Results preview — add <code>?preview</code> or <code>?preview=slug</code> to the URL</span>
            <select id="preview-product-select" aria-label="Preview product">${options}</select>
          </div>
          <div class="survey-card results-card preview-results">
            <div class="results-container">
              <div class="top-recommendation-hero">
                <div class="top-recommendation-image">
                  <img src="${escapeHtml(product.cardImage || product.image)}" alt="${stripHtmlForAlt(product.name)}" />
                </div>
                <div class="top-recommendation-content">
                  <div class="top-recommendation-heading">
                    <p class="top-recommendation-label">Your top recommended marker</p>
                    <h1 class="top-recommendation-name">${allowTrademarkHtml(product.name)}</h1>
                  </div>
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
                  <button type="button" class="btn btn-quiz-primary" id="request-results-btn">Email My Results</button>
                  <button type="button" class="btn btn-quiz-secondary" id="restart-btn">Take Quiz Again</button>
                </div>
                  ${emailOrLeadBlock}
              </div>
    
              <hr class="divider primary">
              <div class="alternatives-section">
                <h3>You Should Also Consider</h3>
                <div class="alternatives-grid">
                  ${alternativesHtml}
                </div>
              </div>
    
              <hr class="divider primary">
              <div class="contact-section">
                <h3>Would you like to be contacted by a sales rep to learn more?</h3>
                <div class="contact-buttons">
                  <button type="button" class="btn btn-contact-primary" id="contact-yes-btn">Yes, Contact Me</button>
                  <button type="button" class="btn btn-contact-secondary" id="contact-no-btn">No, Thank You</button>
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

  wirePreviewResultsPage(block, product, products, config);
};

export default async function decorate(block) {
  const { products } = await getMarkerRecommendations();
  const hideChrome = parseHideChromeFromBlock(block);
  applyMarkerAppHideChrome(hideChrome);
  const config = readBlockConfigWithHtml(block);
  config.scoreExcludeKeywords = hideChrome.scoreExcludeKeywords;
  mergeStartTitleFromBlock(block, config);

  const previewParams = getPreviewParams();
  if (previewParams.active) {
    const fromSlug = previewParams.slug ? findProductBySlug(products, previewParams.slug) : null;
    const product = fromSlug || getDefaultPreviewProduct(products);
    if (product) {
      renderPreview(block, product, products, config);
      return null;
    }
  }
  applyStartScreenContentFromBlock(block, config);
  config.subHeader = parseSubHeaderFromBlock(block);
  config.questionImages = parseQuestionImagesFromBlock(block);
  config.sortableOptionImages = parseSortableOptionImagesFromBlock(block);

  const startWindowRaw = config['start-window'] ?? config.startwindow ?? '';
  const startWindowStr = Array.isArray(startWindowRaw)
    ? String(startWindowRaw[0] || '')
    : String(startWindowRaw || '');
  config.startWindowBackgroundUrl = await resolveStartWindowBackgroundUrl(startWindowStr);

  prefetchMarketoForms2();
  const quiz = new MarkerQuiz(block, config, products);
  await quiz.init();
  return quiz;
}
