function attachFiles(wrapper, fileList, fileTemplate) {
    for(let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const input = fileTemplate.cloneNode(true);
        input.id = input.name = 'attachment_' + Date.now() + '' + Math.floor((Math.random() * 1000));
        if (input.accept.includes(file.type)) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            const div = document.createElement('div');
            div.className = 'attached-file'
            const remove = document.createElement('button');
            remove.className = 'remove';
            div.innerHTML = `<span>${file.name} ${(file.size / (1024*1024)).toFixed(2)}mb</span>`;
            remove.onclick = () => {
                input.remove();
                div.remove();
            }
            div.append(remove, input);
            wrapper.append(div);
        } else {
            // error case droppped file not accepted.
        }
    }
}

export default async function decorate(el) {
    const browseWrapper = el.querySelectorAll('.form-browse');
    [...browseWrapper].forEach((wrapper) => {
        const fileInput = wrapper.querySelector('input');
        const dropArea = document.createElement('div');
        dropArea.className = 'form-browse-dropArea';
        const button = document.createElement('button');
        button.type = 'button';
        button.innerText = 'Drop Here';
        dropArea.innerHTML = '<p>Drop files here or</p>';
        button.onclick = () => {
            const input = fileInput.cloneNode(true);
            input.multiple = true;
            input.onchange = () => {
                attachFiles(wrapper, input.files, fileInput);
                input.remove();
            }
            input.click();
        }
        dropArea.addEventListener("drop", (event) => {
            attachFiles(wrapper, event.dataTransfer.files, fileInput);
            event.preventDefault();
        });
        dropArea.addEventListener('dragover', (event) => {
            event.preventDefault();
        });
        dropArea.append(button);
        fileInput.replaceWith(dropArea);
    });
  }