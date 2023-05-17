export default function decorate(block) {
  const processRow = (row) => {
    const [questionArea, answerArea] = Array.from(row.children);

    questionArea.classList.add('question');
    answerArea.classList.add('answer', 'collapsed');

    const question = document.createElement('a');

    question.innerText = questionArea.innerText;
    questionArea.innerText = '';
    questionArea.appendChild(question);

    const answerBlock = document.createElement('p');
    answerBlock.innerText = answerArea.innerText;

    answerArea.innerText = '';
    answerArea.appendChild(answerBlock);

    const onTransitionendExpand = () => {
      answerArea.classList.toggle('transition');
      answerArea.removeEventListener('transitionend', onTransitionendExpand);
      answerArea.style = null;
    };

    const onTransitionendCollapse = () => {
      answerArea.classList.toggle('transition');
      answerArea.classList.toggle('collapsed');
      answerArea.removeEventListener('transitionend', onTransitionendCollapse);
      answerArea.style = null;
    };

    const collapseAnswer = () => {
      const answerAreaHeight = window.getComputedStyle(answerArea).height;

      requestAnimationFrame(() => {
        answerArea.style.height = answerAreaHeight;
        answerArea.classList.add('transition');

        requestAnimationFrame(() => {
          answerArea.style.height = '0px';
          answerArea.style.paddingTop = '0px';
          answerArea.style.paddingBottom = '0px';

          answerArea.addEventListener('transitionend', onTransitionendCollapse);
        });
      });
      questionArea.classList.toggle('expanded');
    };

    const expandAnswer = () => {
      answerArea.classList.replace('collapsed', 'before-transition');

      const answerAreaHeight = answerArea.scrollHeight;

      answerArea.addEventListener('transitionend', onTransitionendExpand);

      answerArea.style.height = `${answerAreaHeight}px`;
      answerArea.classList.replace('before-transition', 'transition');
      questionArea.classList.toggle('expanded');
    };

    const toggleAnswer = () => {
      if (answerArea.classList.contains('collapsed')) {
        expandAnswer();
      } else {
        collapseAnswer();
      }
    };

    questionArea.addEventListener('click', toggleAnswer);
  };

  Array.from(block.children).forEach(processRow);
}
