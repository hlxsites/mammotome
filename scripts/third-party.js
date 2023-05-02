function createInlineScript(parent, id) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });

  // Google Tag Manager
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
  script.async = true;
  parent.appendChild(script);
}

export default function integrateMartech() {
  createInlineScript(document.body, 'GTM-KNBZTHP');
}
