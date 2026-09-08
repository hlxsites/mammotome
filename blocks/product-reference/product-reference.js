import {
  decorateBlockImgs,
  getConfigValue,
  getInfo,
  getProduct,
  getProducts,
  toCamelCase,
  translate,
} from '../../scripts/lib-franklin.js';

function getPreviewPage() {
  const params = new URLSearchParams(window.location.search);
  return params.get('preview') || null;
}

async function createButtons(country, language, product) {
  return [
    [
      product.Information ? `${window.location.pathname}#${product.Information}` : `/${country}/${language}/${await getConfigValue(`${toCamelCase(`product Reference Information Url ${country}/${language}`)}`, 'contact/')}`,
      ['primary'],
      await translate('productReferenceInformation', 'Request Information'),
    ],
    [
      `/${country}/${language}/${await getConfigValue(`${toCamelCase(`product Reference Support Url ${country}/${language}`)}`, 'product-support')}`,
      ['secondary'],
      await translate('productReferenceSupport', 'Product Support'),
    ],
    [
      `/${country}/${language}/${await getConfigValue(`${toCamelCase(`product Reference Support Url ${country}/${language}`)}`, 'product-support')}/${product.Page}`,
      ['secondary'],
      await translate('productReferenceDocuments', 'Product Documents'),
    ],
  ].map(([href, className, textContent]) => ({ href, className, textContent }));
}

function parseFeatures(product) {
  const raw = product.Features || product.features || '';
  if (!raw) return [];
  const sep = raw.includes(';') ? ';' : '|';
  return raw.split(sep).map((f) => f.trim()).filter(Boolean);
}

function renderPreviewSelector(allProducts, currentPage) {
  const options = allProducts
    .map((p) => `<option value="${p.Page}"${p.Page === currentPage ? ' selected' : ''}>${p.Name || p.Page}</option>`)
    .join('');

  return `
    <div class="product-ref-preview-bar">
      <span>Preview mode</span>
      <select id="product-ref-preview-select">${options}</select>
    </div>`;
}

export default async function decorate(block) {
  const previewPage = getPreviewPage();
  const blockPage = block.querySelector('div > div')?.textContent?.trim();
  const page = previewPage || blockPage;

  block.innerHTML = '';

  if (!page) {
    return;
  }

  const { country, language } = getInfo();
  const product = await getProduct(page, country, language);

  if (!product) {
    block.innerHTML = '<p class="product-ref-error">Product not found</p>';
    return;
  }

  const features = parseFeatures(product);
  const buttons = await createButtons(country, language, product);

  let previewBarHtml = '';
  if (previewPage) {
    const allProducts = await getProducts(country, language);
    previewBarHtml = renderPreviewSelector(allProducts, page);
  }

  const buttonsHtml = buttons.map(({ href, className, textContent }) => `<a href="${href}"><button class="${className.join(' ')}">${textContent}</button></a>`).join('');

  block.innerHTML = `
    ${previewBarHtml}
    <div class="product-ref-layout">
      ${product.Name ? `<h2 class="product-ref-title">${product.Name}</h2>` : ''}

      <div class="product-ref-image-wrap">
        ${product.Image ? `<img src="${product.Image}" alt="${product.Name || ''}" />` : ''}
      </div>

      ${product.Description ? `<p class="product-ref-description">${product.Description}</p>` : ''}

      ${features.length > 0 ? `
        <ul class="product-ref-features">
          ${features.map((f) => `<li>${f}</li>`).join('')}
        </ul>
      ` : ''}

      <div class="product-ref-actions">
        ${buttonsHtml}
      </div>
    </div>`;

  decorateBlockImgs(block);

  if (previewPage) {
    block.querySelector('#product-ref-preview-select')?.addEventListener('change', (e) => {
      const url = new URL(window.location);
      url.searchParams.set('preview', e.target.value);
      window.location.href = url.toString();
    });
  }
}
