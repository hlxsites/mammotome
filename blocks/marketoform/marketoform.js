const loadScript = (src, block) => new Promise((resolve, reject) => {
  const marketoScript = document.createElement('script');
  marketoScript.src = src;
  marketoScript.onload = () => resolve();
  marketoScript.onerror = () => reject(new Error(`Failed to load script: ${src}`));
  block.appendChild(marketoScript);
});

const embedMarketoForm = async (block, formId) => {
  await loadScript('//www2.mammotome.com/js/forms2/js/forms2.min.js', block);

  const formElement = document.createElement('form');
  formElement.id = `mktoForm_${formId}`;
  block.appendChild(formElement);

  window.MktoForms2.loadForm('//www2.mammotome.com', '435-TDP-284', formId);

  window.MktoForms2.whenReady((form) => {
    form.onSuccess((values, followUpUrl) => {
      window.location.href = followUpUrl;
      const dataLayer = '';

      dataLayer.push({
        event: 'enhanced_conversion',
        user_data: {
          email: values.Email,
          phone_number: values.Phone,
          first_name: values.FirstName,
          last_name: values.LastName,
          postal_code: values.PostalCode,
          country: values.Country,
        },
        eventCallback() {
          form.getFormElem().hide();
          document.location.href = followUpUrl;
        },
      });
      return false;
    });
  });
};

export default async function decorate(block) {
  const formId = block.textContent.trim();
  block.textContent = '';
  embedMarketoForm(block, formId);
}
