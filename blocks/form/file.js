function isFileAllowed(file, allowedTypes = '') {
  if (!file) {
    throw new Error('File object is required.');
  }
  const extensionRegex = /(?:\.([^.]+))?$/;
  const fileExtension = extensionRegex.exec(file.name)[1];
  const fileType = file.type;
  return !allowedTypes || allowedTypes.includes(fileType) || allowedTypes.includes(fileExtension);
}

function getFileList(files) {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  return dataTransfer.files;
}

function updateMessage(messages, message) {
  const li = document.createElement('li');
  li.innerText = message;
  messages.append(li);
}

function clearMessages(messages) {
  messages.innerHTML = '';
}

function validateType(files, allowedTypes = '') {
  const allowedFiles = [];
  const disallowedFiles = [];
  files.forEach((file) => {
    (isFileAllowed(file, allowedTypes) ? allowedFiles : disallowedFiles).push(file);
  });
  return { allowedFiles, disallowedFiles };
}

function validateSize(files, maxSize = 200) {
  const withinSizeFiles = [];
  const exceedSizeFiles = [];
  files.forEach((file) => {
    const size = (file.size / (1024 * 1024)).toFixed(2); // in mb
    (size < maxSize ? withinSizeFiles : exceedSizeFiles).push(file);
  });
  return { withinSizeFiles, exceedSizeFiles };
}

function validateLimit(files, attachedFiles, multiple = false, max = -1) {
  let filesToAttach = [];
  let filesToReject = [];
  if (!multiple) {
    filesToAttach = files.splice(0, attachedFiles.length ? 0 : 1);
  } else {
    filesToAttach = files.splice(0, max === -1 ? Infinity : max - attachedFiles.length);
  }
  filesToReject = files;
  return { filesToAttach, filesToReject };
}

export default async function decorate(element) {
  const wrappers = element.querySelectorAll('.form-file-wrapper');
  [...wrappers].forEach((wrapper) => {
    const attachedFiles = [];
    const input = wrapper.querySelector('input');
    const max = (parseInt(input.max, 10) || -1);
    const multiple = input.hasAttribute('multiple');
    const messages = document.createElement('ul');
    const validate = (files = []) => {
      clearMessages(messages);
      const { allowedFiles, disallowedFiles } = validateType(files);
      disallowedFiles.forEach((file) => updateMessage(messages, `${file.name} - This type of file is not allowed.`));
      const { withinSizeFiles, exceedSizeFiles } = validateSize(allowedFiles);
      exceedSizeFiles.forEach((file) => updateMessage(messages, `${file.name} - File exceeds size limit.`));
      // eslint-disable-next-line max-len
      const { filesToAttach, filesToReject } = validateLimit(withinSizeFiles, attachedFiles, multiple, max);
      if (filesToReject.length > 0) {
        updateMessage(messages, 'Maximum number of files reached.');
      }
      return filesToAttach;
    };
    const attachFiles = (files = []) => {
      const filesToAttach = validate(files);
      filesToAttach.forEach((file) => {
        const index = attachedFiles.length;
        const div = document.createElement('div');
        div.className = 'field-attached-file-wrapper';
        const span = document.createElement('span');
        span.innerText = `${file.name} ${(file.size / (1024 * 1024)).toFixed(2)}mb`;
        const button = document.createElement('button');
        button.type = 'button';
        button.onclick = () => {
          div.remove();
          attachedFiles.splice(index, 1);
          input.files = getFileList(attachedFiles);
          clearMessages(messages);
        };
        div.append(span, button);
        wrapper.append(div);
        attachedFiles.push(file);
      });
      input.files = getFileList(attachedFiles);
    };
    const dropArea = document.createElement('div');
    dropArea.className = 'field-dropregion';
    dropArea.innerHTML = `<p>${input.getAttribute('placeholder')}</p>`;
    dropArea.ondragover = (event) => event.preventDefault();
    dropArea.ondrop = (event) => {
      attachFiles([...event.dataTransfer.files]);
      event.preventDefault();
    };
    const button = document.createElement('button');
    button.type = 'button';
    button.innerText = 'Select files';
    button.onclick = () => {
      const fileInput = input.cloneNode(true);
      fileInput.onchange = () => attachFiles([...fileInput.files]);
      fileInput.click();
    };
    dropArea.append(button);
    wrapper.insertBefore(dropArea, input);
    wrapper.append(messages); // for validation messages.
  });
}
