function isFileAllowed(file, allowedTypes) {
  if (!file) {
    return false;
  }
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const fileType = file.type;
  return !allowedTypes || allowedTypes.includes(fileType) || allowedTypes.includes(fileExtension);
}

function getFileList(files) {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  return dataTransfer.files;
}

export default async function decorate(element) {
  const wrappers = element.querySelectorAll('.form-browse');
  [...wrappers].forEach((wrapper) => {
    const attachedFiles = [];
    const input = wrapper.querySelector('input');
    input.multiple = true;
    const attachFiles = (files = []) => {
      files.forEach((file) => {
        const index = attachedFiles.length;
        const div = document.createElement('div');
        div.className = 'field-attachment-wrapper';
        const span = document.createElement('span');
        span.innerText = `${file.name} ${(file.size / (1024 * 1024)).toFixed(2)}mb`;
        const button = document.createElement('button');
        button.type = 'button';
        button.onclick = () => {
          div.remove();
          attachedFiles.splice(index, 1);
          input.files = getFileList(attachedFiles);
        };
        div.append(span, button);
        wrapper.append(div);
        attachedFiles.push(file);
      });
      input.files = getFileList(attachedFiles);
    };
    const dropArea = document.createElement('div');
    dropArea.className = 'field-dropregion';
    dropArea.innerHTML = '<p>Drop files here or</p>';
    dropArea.ondragover = (event) => event.preventDefault();
    dropArea.ondrop = (event) => {
      const { files } = event.dataTransfer;
      const allowedFiles = [...files].filter((file) => isFileAllowed(file, input.accept));
      attachFiles(allowedFiles);
      event.preventDefault();
    };
    const button = document.createElement('button');
    button.type = 'button';
    button.innerText = 'Drop Here';
    button.onclick = () => {
      const fileInput = input.cloneNode(true);
      fileInput.onchange = () => attachFiles([...fileInput.files]);
      fileInput.click();
    };
    dropArea.append(button);
    wrapper.insertBefore(dropArea, input);
  });
}
