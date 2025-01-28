const loadScript = (src, block) => new Promise((resolve, reject) => {
  const marketoScript = document.createElement('script');
  marketoScript.src = src;
  marketoScript.onload = () => resolve();
  marketoScript.onerror = () => reject(new Error(`Failed to load script: ${src}`));
  block.appendChild(marketoScript);
});

const embedMarketoForm = async (block, formId) => {
  try {
    await loadScript('//www2.mammotome.com/js/forms2/js/forms2.min.js', block);
    const formElement = document.createElement('form');
    formElement.id = `mktoForm_${formId}`;
    block.appendChild(formElement);
    if (window.MktoForms2) {
      MktoForms2.loadForm('//www2.mammotome.com', '435-TDP-284', formId, (form) => {
        form.onSuccess((followUpUrl) => {
          window.location.href = followUpUrl;
          return false;
        });
      });
    }
  } catch (error) {
    console.error('Error embedding Marketo form:', error);
    block.textContent = 'Error: Unable to load the form. Please try again later.';
  }
};

export default async function decorate(block) {
  const formId = block.textContent.trim();
  block.textContent = '';
  await embedMarketoForm(block, formId);
}
