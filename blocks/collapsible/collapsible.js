export default function decorate(block) {
  const processRow = (row) => {
    const [questionArea, answerArea] = Array.from(row.children);

    questionArea.classList.add('question');
    answerArea.classList.add('answer');

    const question = document.createElement('a');

    const answerBlock = document.createElement('p');
    answerBlock.innerHTML = answerArea.innerHTML;

    answerArea.innerText = '';
    answerArea.appendChild(answerBlock);

    question.innerHTML = `<span>${questionArea.innerHTML}</span>`;
    questionArea.innerText = '';
    questionArea.appendChild(question);

    answerArea.classList.add('collapsed');

    questionArea.addEventListener('click', () => {
      questionArea.classList.toggle('expanded');

      if (questionArea.classList.contains('expanded')) {
        // Expand the answer
        answerArea.style.height = `${answerArea.scrollHeight}px`;
      } else {
        // Collapse the answer
        answerArea.style.height = '0';
      }

      answerArea.classList.toggle('collapsed');
    });
  };

  Array.from(block.children).forEach(processRow);
}
