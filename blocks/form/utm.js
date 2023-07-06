const allowedUTMs = [
  'utm_campaign',
  'utm_source',
  'utm_medium',
  'utm_content',
  'utm_term',
  'gclid',
];

export default async function decorate(form) {
  const queryParams = new URLSearchParams(window.location.search);
  allowedUTMs.forEach((utm) => {
    const values = queryParams.getAll(utm);
    const input = form.querySelector(`input[type=hidden][name=${utm}]`);
    if (values.length > 0 && input) {
      input.value = values.join();
    }
  });
}
