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
      name: 'Email',
      message: 'This field is required.',
    },
    {
      name: 'FirstName',
      message: 'This field is required.',
    },
    {
      name: 'LastName',
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
      const direction = dir || 'next';
      let currentIndex;

      if (current instanceof HTMLElement) {
        currentIndex = +current.id.split(fsaatPrefix)[1];
      } else if (!Number.isNaN(Number(current))) {
        currentIndex = current;
      } else {
        currentIndex = -1;
      }

      const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      const newHash = `#${fsaatPrefix}${newIndex}`;
      formEl.setAttribute(localFragmentAttr, newHash);
    };

    const isCustomValid = (native, currentStep) => {
      const step = currentStep || formEl;
      form.submittable(false);

      const currentValues = form.getValues();
      const currentUnfilled = userConfig.requiredFields.filter((fieldDesc) => {
        const value = currentValues[fieldDesc.name] || '';
        const isInCurrentStep = step.contains(fieldDesc.refEl);

        if (fieldDesc.name === 'Email' && isInCurrentStep) {
          const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          if (fieldDesc.refEl) fieldDesc.refEl.setCustomValidity('');

          if (!value) {
            if (fieldDesc.refEl) {
              fieldDesc.refEl.setCustomValidity('This field is required.');
            }
            return true;
          }

          if (!valid) {
            if (fieldDesc.refEl) {
              fieldDesc.refEl.setCustomValidity('Please enter a valid email address.');
            }
            return true;
          }

          return false;
        }

        return isInCurrentStep
    && (!value || (fieldDesc.refEl.type === 'checkbox' && value === 'no'));
      });

      if (currentUnfilled.length) {
        const field = currentUnfilled[0];
        const message = field.refEl && field.refEl.validationMessage
          ? field.refEl.validationMessage
          : (field.message || 'This field is required.');
        form.showErrorMessage(message, MktoForms2.$(field.refEl));
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

      const nextEnabled = !rowPos.isLast;
      const prevEnabled = !rowPos.isFirst && !userConfig.buttons.prev.disabled;
      const newRowAxis = row.nextSibling;
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
        navButtons[dir].classList.add(`fsaat-${dir}-button`);
      });

      if (nextEnabled) {
        row.parentNode.insertBefore(navButtonRow, newRowAxis);
      }

      if (prevEnabled) {
        newButtonAxis.parentNode.insertBefore(navButtons.prev, newButtonAxis);
      }

      navButtonRow.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.type === 'button') {
          if (e.target.getAttribute('data-dir') === 'next' && !isCustomValid(true, row)) return;
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

      formEl.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach((input) => {
        input.addEventListener('change', (e) => {
          console.log('Selected input value:', e.target.value);
        });
      });
    });

    form.onValidate(() => {
      const isValid = isCustomValid();
      if (isValid) {
        const letterToResultMap = {
          A: 'HydroMARK',
          B: 'HydroMARK Plus',
          C: 'MammoMARK & CorMARK',
          D: 'MammoSTAR',
          E: 'BiomarC',
          F: 'LumiMARK',
        };

        const resultsMap = Object.fromEntries(
          Object.values(letterToResultMap).map((label) => [label, 0]),
        );

        const selectedInputs = formEl.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked');
        selectedInputs.forEach((input) => {
          const { value } = input;
          if (value) {
            value.split(';').forEach((letter) => {
              const key = letter.trim().toUpperCase();
              const resultName = letterToResultMap[key];
              if (resultName) {
                resultsMap[resultName] += resultsMap[resultName] + 1;
                console.log(`Tallying: ${resultName} now has ${resultsMap[resultName]}`);
              }
            });
          }
        });

        // update 'next steps' field to proper product result field once code is completed
        const topResult = Object.entries(resultsMap).sort((a, b) => b[1] - a[1])[0][0];
        const hiddenResultField = formEl.querySelector('[name="Next Steps"]');
        if (hiddenResultField) {
          hiddenResultField.value = topResult;
          console.log(`Top result "${topResult}" stored in hidden field`);
        }
      }

      return isValid;
    });

    fsaatSet();

    form.onSubmit(() => {
      document.querySelectorAll('.fsaat-prev-button').forEach((btn) => {
        btn.style.display = 'none';
        btn.disabled = true;
        btn.setAttribute('tabindex', '-1');
        btn.setAttribute('aria-hidden', 'true');
      });

      document.querySelectorAll('.fsaat-next-button').forEach((btn) => {
        btn.disabled = true;
      });
    });

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
