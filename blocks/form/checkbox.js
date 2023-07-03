function update(checkboxgroup) {
  const allUnchecked = checkboxgroup.every((checkbox) => !checkbox.checked);
  checkboxgroup.forEach((checkbox) => {
    if (allUnchecked) {
      checkbox.setAttribute('required', '');
    } else {
      checkbox.removeAttribute('required');
    }
  });
}

export default async function decorate(form) {
  const checkboxes = form.querySelectorAll('input[type=checkbox][required]');
  const checkboxNameMap = [...checkboxes].reduce((map, checkbox) => ({
    ...map,
    [checkbox.name]: [checkbox, ...(map[checkbox.name] || [])],
  }), {});

  Object.values(checkboxNameMap).filter((checkboxgroup) => checkboxgroup.length > 1)
    .forEach((checkboxgroup) => {
      checkboxgroup.forEach((checkbox) => checkbox.addEventListener('change', () => update(checkboxgroup)));
    });
}
