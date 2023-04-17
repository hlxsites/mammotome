import { getConfigValue, loadScript } from '../../scripts/lib-franklin.js';

/**
 * https://developer.adobe.com/document-services/docs/overview/pdf-embed-api/gettingstarted/
 */
const ADOBE_DC_VIEW_SDK_SRC = 'https://documentservices.adobe.com/view-sdk/viewer.js';
const ADOBE_DC_VIEW_SDK_READY_EVENT = 'adobe_dc_view_sdk.ready';
const FRANKLIN_DELAYED_COMPLETED_EVENT = 'franklin.delayed_completed';

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
const getApiKey = async () => {
  const { host } = window.location;

  if (host.startsWith('localhost')) {
    return getConfigValue('pdfApiKeyLocalhost');
  }

  if (host.endsWith('.page')) {
    return getConfigValue('pdfApiKeyPage');
  }

  if (host.endsWith('.live')) {
    return getConfigValue('pdfApiKeyLive;');
  }

  if (host.endsWith('mammotome.com')) {
    return getConfigValue('pdfApiKeyProduction');
  }

  return undefined;
};

// eslint-disable-next-line no-unused-vars
const createAdobeDCViewSDKReadyHandler = (config) => async (event) => {
  const apiKey = await getApiKey();
  if (apiKey === null) {
    // eslint-disable-next-line no-console
    console.warn('no PDF viewer API key provided');
  }

  // eslint-disable-next-line no-undef
  const adobeDCView = new AdobeDC.View({
    clientId: apiKey,
    divId: config.divId,
  });
  adobeDCView.previewFile(
    config.viewer.preview,
    config.viewer.options,
  );
};

const onEmbedPDFScriptLoaded = () => {
  sdkLoaded = true;
};

const loadAdobeDCViewSDK = async () => {
  if (!sdkLoaded) {
    loadScript(ADOBE_DC_VIEW_SDK_SRC, onEmbedPDFScriptLoaded);
  }
};

const addEventListeners = (config) => {
  document.addEventListener(
    ADOBE_DC_VIEW_SDK_READY_EVENT,
    createAdobeDCViewSDKReadyHandler(config),
  );
  document.addEventListener(
    FRANKLIN_DELAYED_COMPLETED_EVENT,
    loadAdobeDCViewSDK,
  );
};

const setupDOM = (block, divId) => {
  const div = document.createElement('div');
  div.setAttribute('class', 'pdf-embed');
  div.setAttribute('style', 'width: 100%; height: 800px;');
  div.setAttribute('id', divId);

  block.appendChild(div);
};

const embedPDF = async (block, href) => {
  if (!href) {
    return;
  }
  const divId = `pdf-viewer-${Math.random()
    .toString(36)
    .slice(2)}`;
  const fileName = href.slice(href.lastIndexOf('/') + 1);

  const config = {
    apiKey: null,
    divId,
    viewer: {
      // https://developer.adobe.com/document-services/docs/overview/pdf-embed-api/howtos/
      preview: {
        content: { location: { url: href } },
        metaData: {
          fileName,
          hasReadOnlyAccess: true,
        },
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
  addEventListeners(config);
};

export default async function decorate(block) {
  const pdfSource = block.querySelector('a');

  if (!pdfSource) {
    return;
  }

  await embedPDF(block, pdfSource.href);
}
