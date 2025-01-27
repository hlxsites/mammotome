const embedMarketoForm = (block, formId) => {
  const marketoScript = document.createElement('script');
  marketoScript.src = 'https://www2.mammotome.com/js/forms2/js/forms2.min.js';

  marketoScript.onload = () => {
    const formElement = document.createElement('form');
    formElement.id = `mktoForm_${formId}`;
    block.appendChild(formElement);
    if (window.MktoForms2) {
      console.log('MktoForms2 is loading...');
      MktoForms2.loadForm('https://www2.mammotome.com', '435-TDP-284', formId, (form) => {
        form.onSuccess((values, followUpUrl) => {
          console.log('Form submitted: ', values);
          if (followUpUrl) {
            window.location.href = followUpUrl;
          } else {
            // testing redirect only
            window.location.href = 'https://mammotome.com/us/en/';
          }
          return false;
        });
      });
    } else {
      console.error('MktoForms2 is not available.');
    }
  };
  marketoScript.onerror = () => {
    console.error('Failed to load the Marketo script.');
    block.textContent = 'Error: Unable to load the Marketo form. Please try again later.';
  };
  block.appendChild(marketoScript);
};

export default async function decorate(block) {
  const formId = block.textContent.trim();
  if (!formId) {
    console.error('Error: No form ID provided.');
    block.textContent = 'Error: Form ID is required to display the form.';
    return;
  }
  block.textContent = '';
  embedMarketoForm(block, formId);
}
