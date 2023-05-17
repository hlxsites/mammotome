export default function decorate(block) {
  const processRow = (row) => {
    const rowContent = [...row.children];
    const questionArea = rowContent[0];
    const answerArea = rowContent[1];

    questionArea.className = 'question';
    answerArea.className = 'answer collapsed';

    const question = document.createElement('a');

    question.innerText = questionArea.innerText;
    questionArea.innerText = '';
    questionArea.appendChild(question);

    const answerBlock = document.createElement('p');
    answerBlock.innerText = answerArea.innerText;

    answerArea.innerText = '';
    answerArea.appendChild(answerBlock);

    const onTransitionendExpand = () => {
      answerArea.className = 'answer';
      answerArea.removeEventListener('transitionend', onTransitionendExpand);
      answerArea.style = null;
    };

    const onTransitionendCollpse = () => {
      answerArea.className = 'answer collapsed';
      answerArea.removeEventListener('transitionend', onTransitionendCollpse);
      answerArea.style = null;
    };

    const collapseAnswer = () => {
      const answerAreaHeight = window.getComputedStyle(answerArea).height;

      requestAnimationFrame(() => {
        answerArea.style.height = answerAreaHeight;
        answerArea.className = 'answer transition';

        requestAnimationFrame(() => {
          answerArea.style.height = '0px';
          answerArea.style.paddingTop = '0px';
          answerArea.style.paddingBottom = '0px';

          answerArea.addEventListener('transitionend', onTransitionendCollpse);
        });
      });

      answerArea.setAttribute('data-expanded', 'false');

      questionArea.classList.toggle('expanded');
    };

    const expandAnswer = () => {
      answerArea.className = 'answer before-transition';

      const answerAreaHeight = answerArea.scrollHeight;

      answerArea.addEventListener('transitionend', onTransitionendExpand);

      answerArea.style.height = `${answerAreaHeight}px`;
      answerArea.className = 'answer transition';

      answerArea.setAttribute('data-expanded', 'true');

      questionArea.classList.toggle('expanded');
    };

    const toggleAnswer = () => {
      const isExpanded = answerArea.getAttribute('data-expanded') === 'true';

      if (isExpanded) {
        collapseAnswer();
      } else {
        expandAnswer();
      }
    };
    questionArea.addEventListener('click', toggleAnswer);
  };

  [...block.children].forEach(processRow);
}
