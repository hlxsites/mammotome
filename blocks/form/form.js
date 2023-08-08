import {
  decorateSupScriptInTextBelow, sampleRUM, readBlockConfig, getMetadata,
} from '../../scripts/lib-franklin.js';
import decorateFile from './file.js';
import decorateCheckbox from './checkbox.js';
import decorateUTM from './utm.js';

const SITE_KEY = '6Lc0qYoiAAAAADNOimWbvoSdn2YawNsa6Wbxejpp';
const FORM_SUBMIT_ENDPOINT = 'https://franklin-submit-wrapper.mammotome.workers.dev';

function getLocaleRegion() {
  return (getMetadata('locale') || 'en-US').split('-');
}

function loadScript(url) {
  const head = document.querySelector('head');
  let script = head.querySelector(`script[src="${url}"]`);
  if (!script) {
    script = document.createElement('script');
    script.src = url;
    script.async = true;
    head.append(script);
    return script;
  }
  return script;
}

function constructPayload(form) {
  const payload = {
    Last_Form_Date__c: (new Date()).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'EST',
    }),
  };
  const attachments = {};
  [...form.elements].filter((fe) => fe.name).forEach((fe) => {
    if (fe.type === 'radio') {
      if (fe.checked) payload[fe.name] = fe.value;
    } else if (fe.type === 'checkbox') {
      if (fe.checked) payload[fe.name] = payload[fe.name] ? `${payload[fe.name]}, ${fe.value}` : fe.value;
    } else if (fe.type === 'file' && fe.files?.length > 0) {
      attachments[fe.name] = fe.files;
    } else {
      payload[fe.name] = fe.value;
    }
  });
  return { payload, attachments };
}

function showError(form, error) {
  const errorMessage = document.createElement('div');
  errorMessage.className = 'form-submission-error';
  errorMessage.textContent = error;
  form.querySelector('.form-submit-wrapper').parentElement.append(errorMessage);
}

function clearError(form) {
  const errorMessage = form.querySelector('.form-submission-error');
  if (errorMessage) {
    errorMessage.remove();
  }
}

async function submissionFailure(error, form) {
  showError(form, error);
  form.setAttribute('data-submitting', 'false');
  const submitter = form.querySelector('button[type="submit"]');
  submitter.disabled = false;
  submitter.textContent = submitter.dataset.text || submitter.textContent;
}

function prepareRequest(form, token) {
  const { payload, attachments } = constructPayload(form);
  let headers = {
    'Content-Type': 'application/json',
  };
  let body = JSON.stringify({ data: payload, token });
  if (attachments && Object.keys(attachments).length > 0) {
    headers = {};
    body = new FormData();
    const fileNames = [];
    Object.entries(attachments).forEach(([dataRef, files]) => {
      fileNames.push(dataRef);
      [...files].forEach((file) => body.append(dataRef, file));
    });
    body.append('token', token);
    body.append('fileFields', JSON.stringify(fileNames));
    body.append('data', JSON.stringify(payload));
  }
  return { headers, body };
}

async function submitForm(form, token) {
  try {
    const url = `${FORM_SUBMIT_ENDPOINT}${form.dataset.action}`;
    const response = await fetch(url, {
      method: 'POST',
      ...prepareRequest(form, token),
    });
    if (response.ok) {
      sampleRUM('form:submit');
      window.location.href = form.dataset?.redirect || '/us/en/thank-you/';
    } else {
      const [locale] = getLocaleRegion();
      const dictionary = window.placeholders.default[`i18n-${locale}`];
      const error = dictionary[`formSubmissionError-${response.status}`] || dictionary.formSubmissionError;
      throw new Error(error);
    }
  } catch (error) {
    submissionFailure(error, form);
  }
}

function addGEC(form) {
  const email = form.querySelector('input[name=email]');
  if (email) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'form_complete',
      enhanced_conversion_data: { email: email.value },
    });
  }
}

async function handleSubmit(form) {
  if (form.getAttribute('data-submitting') !== 'true') {
    form.setAttribute('data-submitting', 'true');
    clearError(form);
    addGEC(form);
    const { grecaptcha } = window;
    if (grecaptcha) {
      grecaptcha.ready(() => {
        grecaptcha.execute(SITE_KEY, { action: 'submit' }).then(async (token) => {
          await submitForm(form, token);
        });
      });
    } else {
      await submitForm(form);
    }
  }
}

function setPlaceholder(element, fd) {
  if (fd.Placeholder) {
    element.setAttribute('placeholder', fd.Placeholder);
  }
}

function setNumberConstraints(element, fd) {
  if (fd.Max) {
    element.max = fd.Max;
  }
  if (fd.Min) {
    element.min = fd.Min;
  }
  if (fd.Step) {
    element.step = fd.Step || 1;
  }
}
function createLabel(fd, tagName = 'label') {
  const label = document.createElement(tagName);
  label.setAttribute('for', fd.Id);
  label.className = 'field-label';
  label.textContent = fd.Label || '';
  if (fd.Tooltip) {
    label.title = fd.Tooltip;
  }
  return label;
}

function createHelpText(fd) {
  const div = document.createElement('div');
  div.className = 'field-description';
  div.setAttribute('aria-live', 'polite');
  div.innerText = fd.Description;
  div.id = `${fd.Id}-description`;
  return div;
}

function createFieldWrapper(fd, tagName = 'div') {
  const fieldWrapper = document.createElement(tagName);
  const nameStyle = fd.Name ? ` form-${fd.Name}` : '';
  const fieldId = `form-${fd.Type}-wrapper${nameStyle}`;
  fieldWrapper.className = fieldId;
  fieldWrapper.dataset.fieldset = fd.Fieldset ? fd.Fieldset : '';
  fieldWrapper.classList.add('field-wrapper');
  fieldWrapper.append(createLabel(fd));
  return fieldWrapper;
}

function createButton(fd) {
  const wrapper = createFieldWrapper(fd);
  const button = document.createElement('button');
  button.textContent = fd.Label;
  button.type = fd.Type;
  button.classList.add('button', 'primary');
  button.dataset.redirect = fd.Extra || '';
  button.id = fd.Id;
  button.name = fd.Name;
  wrapper.replaceChildren(button);
  return wrapper;
}
function createSubmit(fd) {
  const wrapper = createButton(fd);
  if (fd.Placeholder) {
    wrapper.querySelector('button').dataset.submitText = fd.Placeholder;
  }
  if (SITE_KEY) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadScript(`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`);
          obs.disconnect();
        }
      });
    });
    obs.observe(wrapper);
  }
  return wrapper;
}

function createInput(fd) {
  const input = document.createElement('input');
  input.type = fd.Type;
  setPlaceholder(input, fd);
  setNumberConstraints(input, fd);
  if (!fd.Label && fd.Description) {
    input.setAttribute('aria-label', fd.Description);
  }
  return input;
}

const withFieldWrapper = (element) => (fd) => {
  const wrapper = createFieldWrapper(fd);
  wrapper.append(element(fd));
  return wrapper;
};

const createTextArea = withFieldWrapper((fd) => {
  const input = document.createElement('textarea');
  setPlaceholder(input, fd);
  return input;
});

function isDatasource(path) {
  return path && path.trim().split('?')[0].endsWith('.json');
}

const createSelect = withFieldWrapper((fd) => {
  const select = document.createElement('select');
  const addOption = (optionText, optionValue) => {
    const option = document.createElement('option');
    option.textContent = optionText.trim();
    option.value = optionValue.trim();
    if (fd.Value === option.value) {
      option.setAttribute('selected', '');
    }
    select.append(option);
    return option;
  };

  if (fd.Placeholder) {
    const ph = addOption(fd.Placeholder, '');
    ph.setAttribute('disabled', '');
  }

  const options = fd.Options.split(',');
  if (options.length === 1 && isDatasource(options[0])) {
    try {
      (async (path) => {
        const { data } = await (await fetch(path)).json();
        data.forEach((optionObj) => addOption(optionObj.Text || optionObj.Value, optionObj.Value));
      })(options[0]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Error: Failed to fetch options ${err}`);
    }
  } else {
    const optionsName = fd['Options Name'] ? fd['Options Name'].split(',') : options;
    options.forEach((optionValue, index) => addOption(optionsName[index], optionValue));
  }
  return select;
});

function createRadio(fd) {
  const wrapper = createFieldWrapper(fd);
  wrapper.insertAdjacentElement('afterbegin', createInput(fd));
  return wrapper;
}

const createOutput = withFieldWrapper((fd) => {
  const output = document.createElement('output');
  output.name = fd.Name;
  output.dataset.fieldset = fd.Fieldset ? fd.Fieldset : '';
  output.innerText = fd.Value;
  return output;
});

const createFile = withFieldWrapper((fd) => {
  const input = createInput(fd);
  input.accept = fd.Accept || '';
  if (fd.Multiple && fd.Multiple.toLowerCase() === 'true') {
    input.setAttribute('multiple', '');
  }
  return input;
});

function createHidden(fd) {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.id = fd.Id;
  input.name = fd.Name;
  input.value = fd.Value;
  return input;
}

function createLegend(fd) {
  return createLabel(fd, 'legend');
}

function createFieldSet(fd) {
  const wrapper = createFieldWrapper(fd, 'fieldset');
  wrapper.name = fd.Name;
  wrapper.replaceChildren(createLegend(fd));
  return wrapper;
}

function groupFieldsByFieldSet(form) {
  const fieldsets = form.querySelectorAll('fieldset');
  fieldsets?.forEach((fieldset) => {
    const fields = form.querySelectorAll(`[data-fieldset="${fieldset.name}"`);
    fields?.forEach((field) => {
      fieldset.append(field);
    });
  });
}

function createPlainText(fd) {
  const paragraph = document.createElement('p');
  const nameStyle = fd.Name ? `form-${fd.Name}` : '';
  paragraph.className = nameStyle;
  paragraph.dataset.fieldset = fd.Fieldset ? fd.Fieldset : '';
  paragraph.textContent = fd.Label;
  return paragraph;
}

const getId = (function getId() {
  const ids = {};
  return (name) => {
    ids[name] = ids[name] || 0;
    const idSuffix = ids[name] ? `-${ids[name]}` : '';
    ids[name] += 1;
    return `form-${name}${idSuffix}`;
  };
}());

const fieldRenderers = {
  radio: createRadio,
  checkbox: createRadio,
  textarea: createTextArea,
  select: createSelect,
  button: createButton,
  submit: createSubmit,
  output: createOutput,
  hidden: createHidden,
  fieldset: createFieldSet,
  plaintext: createPlainText,
  file: createFile,
};

function renderField(fd) {
  const renderer = fieldRenderers[fd.Type];
  let field;
  if (typeof renderer === 'function') {
    field = renderer(fd);
  } else {
    field = createFieldWrapper(fd);
    field.append(createInput(fd));
  }
  if (fd.Description) {
    field.append(createHelpText(fd));
  }
  return field;
}

function decorateFormFields(form) {
  decorateFile(form);
  decorateCheckbox(form);
  decorateUTM(form);
  decorateSupScriptInTextBelow(form);
}

async function decorateFormLayout(block, form) {
  if (block.classList.contains('wizard')) {
    try {
      (await import('./wizard.js')).default(form);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load wizard ${err}`);
    }
  }
}

async function fetchData(url) {
  const resp = await fetch(url);
  const json = await resp.json();
  return json.data.map((fd) => ({
    ...fd,
    Id: fd.Id || getId(fd.Name),
    Value: fd.Value || '',
  }));
}

async function createForm(formURL) {
  const { pathname, search } = new URL(formURL);
  const data = await fetchData(`${pathname}${search}`);
  const form = document.createElement('form');
  data.forEach((fd) => {
    const el = renderField(fd);
    const input = el.querySelector('input,textarea,select');
    if (input) {
      input.id = fd.Id;
      input.name = fd.Name;
      input.value = fd.Value;
      if (fd.Mandatory && fd.Mandatory.toLowerCase() === 'true') {
        input.setAttribute('required', '');
      }
      if (fd.Description) {
        input.setAttribute('aria-describedby', `${fd.Id}-description`);
      }
    }
    form.append(el);
  });
  groupFieldsByFieldSet(form);
  // eslint-disable-next-line prefer-destructuring
  form.dataset.action = pathname.split('.json')[0];
  form.addEventListener('submit', (e) => {
    const { submitter } = e;
    submitter.setAttribute('disabled', '');
    submitter.dataset.text = submitter.textContent;
    submitter.textContent = submitter.dataset.submitText || submitter.textContent;
    handleSubmit(form);
    e.preventDefault();
  });
  decorateFormFields(form);
  return form;
}

export default async function decorate(block) {
  const formLink = block.querySelector('a[href*=".json"]');
  if (formLink) {
    let formURL = formLink.href;
    const config = readBlockConfig(block);
    if (formURL.endsWith('contact.json')) {
      const [locale, region] = getLocaleRegion();
      if (locale === 'en' && region && region.toLowerCase() === 'gb') {
        formURL += '?sheet=uk';
      } else if (locale !== 'en') {
        formURL += `?sheet=${locale}`;
      }
    }
    const form = await createForm(formURL);
    Object.entries(config).forEach(([key, value]) => { form.dataset[key] = value; });
    await decorateFormLayout(block, form);
    formLink.replaceWith(form);
  }
}
