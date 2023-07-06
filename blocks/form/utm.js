const fieldNameParamUTMMap = {
  UTM_Campaign__c: 'utm_campaign',
  UTM_Source__c: 'utm_source',
  UTM_Medium__c: 'utm_medium',
  UTM_Content__c: 'utm_content',
  UTM_Term__c: 'utm_term',
  GCLID__c: 'gclid',
};

export default async function decorate(form) {
  const queryParams = new URLSearchParams(window.location.search);
  Object.entries(fieldNameParamUTMMap).forEach(([fieldName, param]) => {
    const values = queryParams.getAll(param);
    const input = form.querySelector(`input[type=hidden][name=${fieldName}]`);
    if (values.length > 0 && input) {
      input.value = values.join();
    }
  });
}
