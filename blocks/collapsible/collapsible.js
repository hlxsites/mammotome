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

    const ontransitionend = () => {
      answerArea.className = 'answer';
      answerArea.removeEventListener('transitionend', ontransitionend);

      //answerArea.style.height = null;
      answerArea.style = null;
    }
    
    const ontransitionend2 = () => {
      answerArea.className = 'answer collapsed';
      answerArea.style = null;
      answerArea.removeEventListener('transitionend', ontransitionend2);
    }

    const collapseAnswer = () => {

      //answerArea.className = 'answer collapsed';

      
      //const answerAreaHeight = answerArea.scrollHeight;
      const answerAreaHeight = window.getComputedStyle(answerArea).height


      requestAnimationFrame(function() {
        answerArea.style.height = answerAreaHeight;
        answerArea.className = 'answer transition';
  
        requestAnimationFrame(function() {

          answerArea.style.height = 0 + 'px';
          answerArea.style.paddingTop = 0 + 'px';
          answerArea.style.paddingBottom = 0 + 'px';

          answerArea.addEventListener('transitionend', ontransitionend2);
          
        });
      });  

      answerArea.setAttribute('data-expanded', 'false');

      questionArea.classList.toggle('expanded');
    }  

    const expandAnswer = () => {
      answerArea.className = 'answer before-transition';
      // answerArea.classList.toggle('before-transition');
      // answerArea.classList.toggle('collapsed');
      
      
      const answerAreaHeight = answerArea.scrollHeight;

      answerArea.addEventListener('transitionend', ontransitionend);

      answerArea.style.height = answerAreaHeight + 'px';
      answerArea.style.height = answerAreaHeight + 'px';
      answerArea.className = 'answer transition';
      
      answerArea.setAttribute('data-expanded', 'true');

      questionArea.classList.toggle('expanded');
    } 

    const toggleAnswer = () => {

      const isExpanded = answerArea.getAttribute('data-expanded') === 'true';

      if(isExpanded) {
        collapseAnswer();
      } else {
        expandAnswer();
      }

      // answerArea.classList.toggle('collapsed');
      // answerArea.classList.toggle('expanded');
    }

    questionArea.addEventListener('click', toggleAnswer);
  };

  [...block.children].forEach(processRow);
}
