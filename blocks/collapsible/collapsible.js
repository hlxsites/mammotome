export default function decorate(block) {
  const processRow = (row) => {
    row.classList.add('collapsed');

    const rowContent = [...row.children];
    const questionArea = rowContent[0];
    const answerArea = rowContent[1];

    questionArea.className = 'question';
    answerArea.className = 'answer';

    const question = document.createElement('a');

    question.innerText = questionArea.innerText;

    questionArea.innerText = '';

    questionArea.appendChild(question);

    questionArea.addEventListener('click', () => {
      row.classList.toggle('collapsed');
      row.classList.toggle('expanded');
    });

    const answerBlock = document.createElement('p');
    answerBlock.innerText = answerArea.innerText;

    answerArea.innerText = '';
    answerArea.appendChild(answerBlock);
  };

  [...block.children].forEach(processRow);
}
