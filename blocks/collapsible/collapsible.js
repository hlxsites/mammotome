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

      answerArea.style.height = null;
    }
    
    const collapseAnswer = () => {
      const answerAreaHeight = answerArea.scrollHeight;


      requestAnimationFrame(function() {
        answerBlock.style.height = answerAreaHeight + 'px';
        answerArea.className = 'answer transition';
  
        requestAnimationFrame(function() {
          answerBlock.style.height = 0 + 'px';

          answerArea.addEventListener('transitionend', function(){
            answerArea.className = 'answer collapsed';
          });
          
        });
      });  

      answerArea.setAttribute('data-expanded', 'false');
    }  

    const expandAnswer = () => {
      answerArea.className = 'answer before-transition';
      // answerArea.classList.toggle('before-transition');
      // answerArea.classList.toggle('collapsed');
      
      
      const answerAreaHeight = answerArea.scrollHeight;

      answerArea.addEventListener('transitionend', ontransitionend);

      answerArea.className = 'answer before-transition transition';

      answerBlock.style.height = answerAreaHeight + 'px';
      // answerArea.style.height = answerAreaHeight + 'px';
      
      answerArea.setAttribute('data-expanded', 'true');
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
