const userConfig = {
  buttons: {
    prev: {
      label: 'Back',
      disabled: false,
    },
    next: {
      label: 'Next',
    },
  },
  requiredFields: [
    {
      name: 'FirstName',
      message: 'This field is required.',
    },
    {
      name: 'LastName',
      message: 'This field is required.',
    },
    {
      name: 'Email',
      message: 'This field is required.',
    },
    {
      name: 'Unsubscribed',
      message: 'This field is required.',
    },
  ],
};

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
    const formEl = form.getFormElem()[0];
    const arrayify = getSelection.call.bind([].slice);

    const fieldRowStor = '.mktoForm > .mktoFormRow';
    const buttonRowStor = '.mktoForm > .mktoButtonRow';
    const buttonStor = '.mktoButtonRow .mktoButton';
    const fsaatPrefix = 'fsaat-';
    const localFragmentAttr = 'data-form-local-fragment';

    const CSSOM_RULEPOS_FIRST = 0;

    const fieldRows = formEl.querySelectorAll(fieldRowStor);
    const submitButtonRow = formEl.querySelector(buttonRowStor);
    const submitButton = submitButtonRow.querySelector(buttonStor);

    userConfig.requiredFields
      .map((fieldDesc) => {
        fieldDesc.label = formEl.querySelector(`[for='${fieldDesc.name}']`);
        fieldDesc.refEl = formEl.querySelector(`[name='${fieldDesc.name}']`);
        return fieldDesc;
      })
      .forEach((fieldDesc) => {
        if (fieldDesc.label && fieldDesc.label.parentNode) {
          fieldDesc.label.parentNode.classList.add('mktoRequiredField');
        }
      });

    const dynableSheet = arrayify(document.styleSheets)
      .filter((sheet) => sheet.ownerNode.nodeName === 'STYLE')[0];

    const fsaatSet = (current, dir) => {
      const FSAAT_DIR_PREV = 'prev';
      const FSAAT_DIR_NEXT = 'next';

      const direction = dir || FSAAT_DIR_NEXT;
      let currentIndex;

      if (current instanceof HTMLElement) {
        currentIndex = +current.id.split(fsaatPrefix)[1];
      } else if (!Number.isNaN(Number(current))) {
        currentIndex = current;
      } else {
        currentIndex = -1;
      }

      const newIndex = direction === FSAAT_DIR_NEXT ? currentIndex + 1 : currentIndex - 1;
      const newHash = `#${fsaatPrefix}${newIndex}`;

      formEl.setAttribute(localFragmentAttr, newHash);
    };

    const isCustomValid = (native, currentStep) => {
      const step = currentStep || formEl;

      form.submittable(false);

      const currentValues = form.getValues();

      const currentUnfilled = userConfig.requiredFields
        .filter((fieldDesc) => step.contains(fieldDesc.refEl) && (!currentValues[fieldDesc.name] || (fieldDesc.refEl.type === 'checkbox' && currentValues[fieldDesc.name] === 'no')));

      if (currentUnfilled.length) {
        form.showErrorMessage(currentUnfilled[0].message, MktoForms2.$(currentUnfilled[0].refEl));
        return false;
      }
      form.submittable(true);
      return true;
    };

    arrayify(fieldRows).forEach((row, rowIdx) => {
      const rowPos = {
        isFirst: rowIdx === 0,
        isLast: rowIdx === fieldRows.length - 1,
      };

      row.id = fsaatPrefix + rowIdx;

      const navButtonRow = rowPos.isLast
        ? submitButtonRow
        : submitButtonRow.cloneNode(true);
      const newRowAxis = row.nextSibling;
      const nextEnabled = !rowPos.isLast;
      const prevEnabled = !rowPos.isFirst && !userConfig.buttons.prev.disabled;
      let newButtonAxis;
      let newButtonTmpl;
      const navButtons = {};

      if (nextEnabled) {
        navButtons.next = navButtonRow.querySelector(buttonStor);
      }

      if (prevEnabled) {
        newButtonAxis = navButtons.next || submitButton;
        newButtonTmpl = newButtonAxis;
        navButtons.prev = newButtonTmpl.cloneNode();
      }

      Object.keys(navButtons).forEach((dir) => {
        navButtons[dir].type = 'button';
        navButtons[dir].setAttribute('data-dir', dir);
        navButtons[dir].innerHTML = userConfig.buttons[dir].label;
      });

      if (nextEnabled) {
        row.parentNode.insertBefore(navButtonRow, newRowAxis);
      }

      if (prevEnabled) {
        newButtonAxis.parentNode.insertBefore(navButtons.prev, newButtonAxis);
      }

      navButtonRow.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.type === 'button') {
          if (e.target.getAttribute('data-dir') === 'next' && !isCustomValid(true, row)) {
            return;
          }
          fsaatSet(row, e.target.getAttribute('data-dir'));
        }
      });

      dynableSheet.insertRule(
        [
          `.mktoForm[${localFragmentAttr}='#${row.id}'] .mktoFormRow#${row.id},`,
          `.mktoForm[${localFragmentAttr}='#${row.id}'] .mktoFormRow#${row.id} + .mktoButtonRow`,
          '{ display: block; }',
        ].join(' '),
        CSSOM_RULEPOS_FIRST,
      );
    });

    form.onValidate(isCustomValid);
    fsaatSet();

    form.onSuccess((values, followUpUrl) => {
      window.location.href = followUpUrl;
      return false;
    });
  });
};

export default async function decorate(block) {
  const formId = block.textContent.trim();
  block.textContent = '';
  await embedMarketoForm(block, formId);
}
