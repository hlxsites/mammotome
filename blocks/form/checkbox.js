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
  const checkboxNameMap = [...checkboxes].reduce((map, checkbox) => {
    if (map.has(checkbox.name)) {
      map.get(checkbox.name).push(checkbox);
    } else {
      map.set(checkbox.name, [checkbox]);
    }
    return map;
  }, new Map());
  [...checkboxNameMap.values()]
    .filter((checkboxgroup) => checkboxgroup.length > 1)
    .forEach((checkboxgroup) => {
      checkboxgroup.forEach((checkbox) => {
        checkbox.onchange = () => update(checkboxgroup);
      });
    });
}
