import { fetchPlaceholders, loadScript } from '../../scripts/lib-franklin.js';

/**
 * https://developer.adobe.com/document-services/docs/overview/pdf-embed-api/gettingstarted/
 */
const ADOBE_DC_VIEW_SDK_SRC = 'https://documentservices.adobe.com/view-sdk/viewer.js';
const ADOBE_DC_VIEW_SDK_READY_EVENT = 'adobe_dc_view_sdk.ready';

const siteConfig = (await fetchPlaceholders()).config || {};

let sdkLoaded = false;

/**
 * Obtain API keys here: https://documentservices.adobe.com/dc-integration-creation-app-cdn/main.html?api=pdf-embed-api#
 *
 * A key is domain-specific and convers all subdomains. As such the placeholders need to
 * feature a key per <domain>.<tld>. In this case a key each for:
 * - localhost
 * - hlx.page
 * - hlx.live
 * - mammotome.com
 *
 * This method checks the host from `window.location` and returns the respective placeholder
 * holding the api key.
 *
 * @returns {undefined|string} The key or undefined if no matching domain was found.
 */
const getApiKey = () => {
  const { host } = window.location;

  if (host.startsWith('localhost')) {
    return siteConfig.pdfApiKeyLocalhost;
  }

  if (host.endsWith('.page')) {
    return siteConfig.pdfApiKeyPage;
  }

  if (host.endsWith('.live')) {
    return siteConfig.pdfApiKeyLive;
  }

  if (host.endsWith('mammotome.com')) {
    return siteConfig.pdfApiKeyProduction;
  }

  return undefined;
};

// eslint-disable-next-line no-unused-vars
const createAdobeDCViewSDKReadyHandler = (config) => (event) => {
  // eslint-disable-next-line no-undef
  const adobeDCView = new AdobeDC.View({
    clientId: config.apiKey,
    divId: config.divId,
  });
  adobeDCView.previewFile(
    config.viewer.preview,
    config.viewer.options,
  );
};

const addEventListener = (config) => {
  document.addEventListener(
    ADOBE_DC_VIEW_SDK_READY_EVENT,
    createAdobeDCViewSDKReadyHandler(config),
  );
};

const onEmbedPDFScriptLoaded = () => {
  sdkLoaded = true;
};

const loadAdobeDCViewSDK = () => {
  if (!sdkLoaded) {
    loadScript(ADOBE_DC_VIEW_SDK_SRC, onEmbedPDFScriptLoaded);
  }
};

const setupDOM = (block, divId) => {
  const div = document.createElement('div');
  div.setAttribute('class', 'pdf-embed');
  div.setAttribute('style', 'width: 100%; height: 800px;');
  div.setAttribute('id', divId);

  block.appendChild(div);
};

const embedPDF = (block, href) => {
  if (!href) {
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return;
  }

  const divId = `pdf-viewer-${Math.random().toString(36).slice(2)}`;
  const fileName = href.slice(href.lastIndexOf('/') + 1);

  const config = {
    apiKey,
    divId,
    viewer: {
      // https://developer.adobe.com/document-services/docs/overview/pdf-embed-api/howtos/
      preview: {
        content: { location: { url: href } },
        metaData: { fileName, hasReadOnlyAccess: true },
      },
      // https://developer.adobe.com/document-services/docs/overview/pdf-embed-api/howtos_ui/
      options: {
        defaultViewMode: 'FIT_WIDTH',
        embedMode: 'FULL_WINDOW',
        showAnnotationTools: false,
        showBookmarks: true,
        showDownloadPDF: true,
        showFullScreen: true,
        showPrintPDF: true,
        showThumbnails: true,
        showZoomControl: true,
      },
    },
  };

  setupDOM(block, divId);
  addEventListener(config);
  loadAdobeDCViewSDK();
};

export default async function decorate(block) {
  const pdfSource = block.querySelector('a');

  if (!pdfSource) {
    return;
  }

  embedPDF(block, pdfSource.href);
}
