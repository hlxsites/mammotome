function createButton(fd) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = fd.Label;
  button.className = 'form-wizard-step-button';
  return button;
}

const createTooltip = (() => {
  const tooltip = document.createElement('div');
  tooltip.className = 'field-tooltip';
  document.addEventListener('click', () => tooltip.remove(), true); // execute for next click
  return (fd) => {
    tooltip.textContent = fd.Label;
    return tooltip;
  };
})();

function moveToNext(current) {
  const invalid = current.querySelector(':invalid');
  if (invalid) {
    const tooltip = createTooltip({ Label: invalid.validationMessage });
    invalid.parentElement.insertBefore(tooltip, invalid.nextElementSibling);
  } else {
    current.classList.remove('current-wizard-step');
    current.nextElementSibling.classList.add('current-wizard-step');
  }
}

function moveToPrev(current) {
  current.classList.remove('current-wizard-step');
  current.previousElementSibling.classList.add('current-wizard-step');
}

export default async function decorate(form) {
  form.classList.add('form-layout-wizard');
  [...form.children].forEach((step) => {
    const current = form.getElementsByClassName('current-wizard-step');
    const wrapper = document.createElement('div');
    wrapper.className = 'form-wizard-step-button-wrapper';
    const prev = createButton({ Label: 'BACK' });
    prev.onclick = () => moveToPrev(current[0]);
    const next = createButton({ Label: 'NEXT' });
    next.onclick = () => moveToNext(current[0]);
    const submit = step.querySelector('.form-submit-wrapper');
    wrapper.append(...(submit ? [prev, next, submit] : [prev, next]));
    step.append(wrapper);
  });
  form.children[0]?.classList.add('current-wizard-step');
}
