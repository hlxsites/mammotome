const allowedUTMs = ['utm_campaign', 'utm_source', 'utm_medium', 'utm_content', 'utm_term', 'gclid'];
const paramFieldNameUTMMap = {
  utm_content: 'uTMContent',
  gclid: 'GCLID__c',
};

export default async function decorate(form) {
  const queryParams = new URLSearchParams(window.location.search);
  allowedUTMs.forEach((allowedUTM) => {
    const values = queryParams.getAll(allowedUTM);
    if (values.length) {
      const fieldName = paramFieldNameUTMMap[allowedUTM] || allowedUTM;
      const input = form.querySelector(`input[type=hidden][name="${fieldName}"]`);
      if (input) {
        input.value = values.join();
      }
    }
  });
}
