function update(checkboxgroup, isChecked) {
  if (isChecked) { // remove required if any of them is checked
    checkboxgroup.forEach((checkbox) => checkbox.removeAttribute('required'));
  } else if (checkboxgroup.every((checkbox) => !checkbox.checked)) {
    // set required if none of them is checked
    checkboxgroup.forEach((checkbox) => checkbox.setAttribute('required', ''));
  }
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
        checkbox.onchange = (event) => update(checkboxgroup, event.target.checked);
      });
    });
}
