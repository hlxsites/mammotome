export default function integrateMartech(parent, id) {
  // Google Tag Manager
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
  script.async = true;
  parent.appendChild(script);
}
