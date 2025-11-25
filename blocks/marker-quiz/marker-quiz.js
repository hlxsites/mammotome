import { readBlockConfig } from '../../scripts/lib-franklin.js';

async function fetchSurveyData(url) {
  try {
    const resp = await fetch(url);
    const json = await resp.json();
    return json.data || json;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch survey data:', error);
    return null;
  }
}

function parseSurveyDataFromExcel(data) {
  const surveyData = {
    questions: [],
    products: {},
    thankYouYes: '',
    thankYouNo: '',
  };
  const [questions, products, options, config] = [
    'question',
    'product',
    'option',
    'config',
  ].map((type) => data.filter((row) => row.Type === type));

  questions.forEach((question) => {
    const questionOptions = options.filter(
      (opt) => opt.QuestionId === question.Id,
    );
    const processedOptions = questionOptions.map((opt) => {
      const scores = {};
      opt.Scores?.split(',').forEach((score) => {
        const [product, value] = score.split(':');
        scores[product.trim()] = parseInt(value.trim(), 10);
      });
      return { text: opt.Text, scores };
    });

    surveyData.questions.push({
      id: parseInt(question.Id, 10),
      text: question.Text,
      type: question.QuestionType || 'single',
      options: processedOptions,
    });
  });

  products.forEach((product) => {
    surveyData.products[product.Id] = {
      name: product.Name,
      description: product.Description,
      image: product.Image,
      features: product.Features?.split(',').map((f) => f.trim()) || [],
      bestFor: product.BestFor,
    };
  });

  config.forEach((item) => {
    if (item.Name === 'ThankYouYes') surveyData.thankYouYes = item.Text;
    else if (item.Name === 'ThankYouNo') surveyData.thankYouNo = item.Text;
  });

  return surveyData;
}

const defaultSurveyData = {
  questions: [],
  products: {},
  thankYouYes: 'Thank you for your interest!',
  thankYouNo: 'Thank you for taking our survey!',
};

class ProductSurvey {
  constructor(block, config) {
    this.block = block;
    this.config = config;
    this.surveyData = null;
    this.currentQuestion = 0;
    this.answers = [];
    this.selectedOption = null;
    this.selectedOptions = []; // For multi-choice questions
    this.loading = true;
    this.showStartScreen = true;
    this.init();
  }

  async loadSurveyData() {
    const surveyLink = this.block.querySelector('a[href*=".json"]');
    if (surveyLink) {
      const rawData = await fetchSurveyData(surveyLink.href);
      if (rawData) {
        this.surveyData = parseSurveyDataFromExcel(rawData);
        return;
      }
    }

    if (this.config.surveyData) {
      try {
        this.surveyData = typeof this.config.surveyData === 'string'
          ? JSON.parse(this.config.surveyData)
          : this.config.surveyData;
        return;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to parse survey data from config:', e);
      }
    }

    this.surveyData = defaultSurveyData;
  }

  async init() {
    await this.loadSurveyData();
    this.loading = false;
    this.render();
    this.attachEventListeners();
  }

  render() {
    if (this.loading) {
      this.block.innerHTML = `
        <div class="product-survey-container">
          <div class="survey-card">
            <div class="loading">
              <div class="spinner"></div>
              <p>Loading survey...</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    if (this.showStartScreen) {
      this.renderStartScreen();
      return;
    }

    this.block.innerHTML = `
      <div class="product-survey-container">
        <div class="survey-card">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.getProgress()}%"></div>
          </div>
          
          <div class="question-container">
            <div class="question-text">
              ${this.getCurrentQuestion().text}
            </div>
            
            <div class="options-container ${this.getCurrentQuestion().type === 'multi'
    ? 'multi-choice'
    : 'single-choice'}">
              ${this.getCurrentQuestion()
    .options.map((option, index) => {
      const isMulti = this.getCurrentQuestion().type === 'multi';
      const isSelected = isMulti
        ? this.selectedOptions.some(
          (opt) => opt.text === option.text,
        )
        : this.selectedOption?.text === option.text;
      return `<div class="option ${isSelected ? 'selected' : ''}" data-option-index="${index}">
                  <span class="${isMulti ? 'checkbox' : 'radio'} ${isSelected ? 'checked' : ''}"></span>
                  <span class="option-text">${option.text}</span>
                </div>`;
    })
    .join('')}
            </div>
          </div>

          <div class="navigation">
            <button class="btn btn-secondary" id="prev-btn" ${this.currentQuestion === 0 ? 'disabled' : ''}>
              ← Previous
            </button>
            
            <div class="question-counter">
              Question ${this.currentQuestion + 1} of ${this.surveyData.questions.length}
            </div>
            
            <button class="btn" id="next-btn" ${this.getCurrentQuestion().type === 'multi' && this.selectedOptions.length === 0 ? 'disabled' : ''}${this.getCurrentQuestion().type !== 'multi' && !this.selectedOption ? 'disabled' : ''}>
              ${this.currentQuestion === this.surveyData.questions.length - 1 ? 'Get Results' : 'Next'} →
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderStartScreen() {
    this.block.innerHTML = `
      <div class="product-survey-container">
        <div class="survey-card">
          <div class="start-screen">
            <h1>What Mammotome Marker is right for your patient?</h1>
            <p>Take our quick assessment to find the perfect marker solution for your specific needs.</p>
            <button class="btn btn-primary" id="start-survey-btn">Start Assessment</button>
          </div>
        </div>
      </div>
    `;

    this.block
      .querySelector('#start-survey-btn')
      .addEventListener('click', () => {
        this.showStartScreen = false;
        this.render();
        this.attachEventListeners();
      });
  }

  getCurrentQuestion() {
    return this.surveyData.questions[this.currentQuestion];
  }

  getProgress() {
    return (
      ((this.currentQuestion + 1) / this.surveyData.questions.length) * 100
    );
  }

  attachEventListeners() {
    this.block.querySelectorAll('.option').forEach((option) => {
      option.addEventListener('click', () => {
        this.selectOption(parseInt(option.dataset.optionIndex, 10));
      });
    });

    this.block.querySelector('#prev-btn').addEventListener('click', () => {
      this.previousQuestion();
    });

    this.block.querySelector('#next-btn').addEventListener('click', () => {
      this.nextQuestion();
    });
  }

  selectOption(optionIndex) {
    const option = this.getCurrentQuestion().options[optionIndex];
    const currentQuestion = this.getCurrentQuestion();
    const isMulti = currentQuestion.type === 'multi';

    if (isMulti) {
      const existingIndex = this.selectedOptions.findIndex(
        (opt) => opt.text === option.text,
      );
      if (existingIndex >= 0) {
        this.selectedOptions.splice(existingIndex, 1);
      } else {
        this.selectedOptions.push(option);
      }
    } else {
      this.selectedOption = option;
      this.selectedOptions = [];
    }

    // Update UI for all options
    this.block.querySelectorAll('.option').forEach((opt, index) => {
      const isSelected = isMulti
        ? this.selectedOptions.some(
          (selectedOpt) => selectedOpt.text === currentQuestion.options[index].text,
        )
        : index === optionIndex;

      opt.classList.toggle('selected', isSelected);
      const indicator = opt.querySelector(isMulti ? '.checkbox' : '.radio');
      if (indicator) indicator.classList.toggle('checked', isSelected);
    });

    // Update next button state
    this.block.querySelector('#next-btn').disabled = isMulti
      ? this.selectedOptions.length === 0
      : !this.selectedOption;
  }

  previousQuestion() {
    if (this.currentQuestion > 0) {
      this.currentQuestion -= 1;
      this.selectedOption = null;
      this.selectedOptions = [];
      this.render();
      this.attachEventListeners();
    }
  }

  nextQuestion() {
    const currentQuestion = this.getCurrentQuestion();
    const isValidSelection = currentQuestion.type === 'multi'
      ? this.selectedOptions.length > 0
      : this.selectedOption;
    if (!isValidSelection) return;

    const answerData = {
      questionId: currentQuestion.id,
      answer: currentQuestion.type === 'multi'
        ? this.selectedOptions.map((opt) => opt.text)
        : this.selectedOption.text,
      type: currentQuestion.type,
    };

    const existingIndex = this.answers.findIndex(
      (answer) => answer.questionId === currentQuestion.id,
    );
    if (existingIndex >= 0) {
      this.answers[existingIndex] = answerData;
    } else {
      this.answers.push(answerData);
    }

    if (this.currentQuestion === this.surveyData.questions.length - 1) {
      this.showResults();
    } else {
      this.currentQuestion += 1;
      this.selectedOption = null;
      this.selectedOptions = [];
      this.render();
      this.attachEventListeners();
    }
  }

  calculateResults() {
    const scores = Object.fromEntries(
      Object.keys(this.surveyData.products).map((product) => [product, 0]),
    );

    this.answers.forEach((answer) => {
      const question = this.surveyData.questions.find(
        (q) => q.id === answer.questionId,
      );
      if (!question) return;

      const answerTexts = Array.isArray(answer.answer)
        ? answer.answer
        : [answer.answer];
      answerTexts.forEach((answerText) => {
        const selectedOption = question.options.find(
          (opt) => opt.text === answerText,
        );
        if (selectedOption) {
          Object.entries(selectedOption.scores).forEach(([product, score]) => {
            scores[product] += score;
          });
        }
      });
    });

    const maxScore = Math.max(...Object.values(scores));
    const recommendedProduct = Object.keys(scores).find(
      (product) => scores[product] === maxScore,
    );

    return {
      scores,
      recommendedProduct,
      productDetails: this.surveyData.products[recommendedProduct],
    };
  }

  showResults() {
    const results = this.calculateResults();

    this.block.innerHTML = `
      <div class="product-survey-container">
        <div class="survey-card">
          <div class="result-container">
            <h2 class="product-title">${results.productDetails.name}</h2>
            
            <img src="${results.productDetails.image}" alt="${results.productDetails.name}" class="product-image">
            
            <p class="product-description">${results.productDetails.description}</p>
            
            <ul class="product-features">
              ${results.productDetails.features
    .map((feature) => `<li>${feature}</li>`)
    .join('')}
            </ul>
            
            <div class="product-best-for">Best for: ${results.productDetails.bestFor}</div>
            
            <div class="contact-question">
              <h3>Would you like to be contacted by a sales rep to learn more?</h3>
              <div class="contact-buttons">
                <button class="btn" id="contact-yes-btn">Yes, contact me</button>
                <button class="btn btn-secondary" id="contact-no-btn">No, thank you</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.block
      .querySelector('#contact-yes-btn')
      .addEventListener('click', () => {
        this.showContactForm();
      });

    this.block
      .querySelector('#contact-no-btn')
      .addEventListener('click', () => {
        this.showThankYouNo();
      });
  }

  // placeholder form. need to add marketo form here instead.
  showContactForm() {
    this.block.innerHTML = `
      <div class="product-survey-container">
        <div class="survey-card">
          <div class="contact-form-container">
            <h2>Contact Information</h2>
            <p>Please provide your contact information and we'll have a sales representative reach out to you.</p>
            
            <form id="contact-form" class="contact-form">
              <div class="form-group">
                <label for="firstName">First Name *</label>
                <input type="text" id="firstName" name="firstName" required>
              </div>
              
              <div class="form-group">
                <label for="lastName">Last Name *</label>
                <input type="text" id="lastName" name="lastName" required>
              </div>
              
              <div class="form-group">
                <label for="email">Email Address *</label>
                <input type="email" id="email" name="email" required>
              </div>
              
              <div class="form-group">
                <label for="phone">Phone Number</label>
                <input type="tel" id="phone" name="phone">
              </div>
              
              <div class="form-group">
                <label for="company">Company</label>
                <input type="text" id="company" name="company">
              </div>
              
              <div class="form-group">
                <label for="message">Additional Information</label>
                <textarea id="message" name="message" rows="4" placeholder="Tell us more about your needs..."></textarea>
              </div>
              
              <div class="form-actions">
                <button type="submit" class="btn">Submit</button>
                <button type="button" class="btn btn-secondary" id="back-to-results">Back to Results</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.block
      .querySelector('#contact-form')
      .addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitContactForm();
      });

    this.block
      .querySelector('#back-to-results')
      .addEventListener('click', () => {
        this.showResults();
      });
  }

  async submitContactForm() {
    const form = this.block.querySelector('#contact-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const results = this.calculateResults();
    data.recommendedProduct = results.recommendedProduct;
    data.surveyAnswers = JSON.stringify(this.answers);

    try {
      // simulated submission. need to update it with actual submission.
      // eslint-disable-next-line no-console
      console.log('Contact form submitted:', data);

      this.showThankYouYes();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error submitting form:', error);
      // eslint-disable-next-line no-alert
      alert(
        'There was an error submitting your information. Please try again.',
      );
    }
  }

  showThankYou(isYes = true) {
    const message = isYes
      ? this.surveyData.thankYouYes
        || 'Thank you! A sales representative will contact you within 24 hours.'
      : this.surveyData.thankYouNo || 'Thank you for taking our survey!';

    this.block.innerHTML = `<div class="product-survey-container">
      <div class="survey-card">
        <div class="thank-you-container">
          <h2>Thank You!</h2>
          <p>${message}</p>
          <button class="btn" id="restart-btn">Take Survey Again</button>
        </div>
      </div>
    </div>`;

    this.block
      .querySelector('#restart-btn')
      .addEventListener('click', () => this.restart());
  }

  showThankYouYes() {
    this.showThankYou(true);
  }

  showThankYouNo() {
    this.showThankYou(false);
  }

  restart() {
    Object.assign(this, {
      currentQuestion: 0,
      answers: [],
      selectedOption: null,
      selectedOptions: [],
      showStartScreen: true,
    });
    this.render();
  }
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  return new ProductSurvey(block, config);
}
