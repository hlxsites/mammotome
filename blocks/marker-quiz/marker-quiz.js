import { readBlockConfig } from '../../scripts/lib-franklin.js';

const FORM_SUBMIT_ENDPOINT = 'https://franklin-submit-wrapper.mammotome.workers.dev';

async function fetchSurveyData(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch survey data: ${resp.status} ${resp.statusText}`);
      return null;
    }
    const text = await resp.text();
    if (!text || text.trim().length === 0) {
      // eslint-disable-next-line no-console
      console.error('Empty response received from survey data URL');
      return null;
    }
    const json = JSON.parse(text);
    return json.data || json;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch survey data:', error);
    return null;
  }
}

function parseSurveyDataFromExcel(data) {
  if (!data || !Array.isArray(data)) {
    return null;
  }
  const surveyData = {
    questions: [],
    products: {},
    thankYouYes: '',
    thankYouNo: '',
  };
  const [questions, products, options, config, otherOptions] = [
    'question',
    'product',
    'option',
    'config',
    'other',
  ].map((type) => data.filter((row) => row.Type === type));

  questions.forEach((question) => {
    // Combine regular options and "other" options
    const questionOptions = options.filter(
      (opt) => opt.QuestionId === question.Id,
    );
    const questionOtherOptions = otherOptions.filter(
      (opt) => opt.QuestionId === question.Id,
    );
    const allQuestionOptions = [...questionOptions, ...questionOtherOptions];

    const processedOptions = allQuestionOptions.map((opt) => {
      const scores = {};
      opt.Scores?.split(',').forEach((score) => {
        const [product, value] = score.split(':');
        if (product && value) {
          scores[product.trim()] = parseInt(value.trim(), 10);
        }
      });
      return {
        text: opt.Text,
        scores,
        isOther: opt.Type === 'other',
      };
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
    this.surveyJsonUrl = null; // Store the survey JSON URL for submission
    this.currentQuestion = 0;
    this.answers = [];
    this.selectedOption = null;
    this.selectedOptions = []; // For multi-choice questions
    this.otherText = null; // For single-choice "Other" responses
    this.otherTexts = {}; // For multi-choice "Other" responses (keyed by option text)
    this.loading = true;
    this.showStartScreen = true;
    this.submissionSent = false; // Track if quiz submission has been sent
    this.init();
  }

  async loadSurveyData() {
    // Look for any link with .json extension in the block
    const surveyLink = this.block.querySelector('a[href$=".json"], a[href*=".json"]');
    if (surveyLink && surveyLink.href) {
      this.surveyJsonUrl = surveyLink.href;
      const rawData = await fetchSurveyData(surveyLink.href);
      if (rawData) {
        const parsedData = parseSurveyDataFromExcel(rawData);
        if (parsedData && parsedData.questions && parsedData.questions.length > 0) {
          this.surveyData = parsedData;
          return;
        }
      }
    }

    // Try config.surveyData as fallback
    if (this.config.surveyData) {
      try {
        const configData = typeof this.config.surveyData === 'string'
          ? JSON.parse(this.config.surveyData)
          : this.config.surveyData;
        if (configData && configData.questions && configData.questions.length > 0) {
          this.surveyData = configData;
          return;
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to parse survey data from config:', e);
      }
    }

    // eslint-disable-next-line no-console
    console.error('No valid survey data found. Please provide a JSON file link in the block.');
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

    if (!this.surveyData || !this.surveyData.questions || this.surveyData.questions.length === 0) {
      this.block.innerHTML = `
        <div class="product-survey-container">
          <div class="survey-card">
            <div class="error-message">
              <p>Survey data not available. Please check the JSON file configuration.</p>
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

    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) {
      this.block.innerHTML = `
        <div class="product-survey-container">
          <div class="survey-card">
            <div class="error-message">
              <p>Invalid question index. Please restart the survey.</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Restore previous answer if it exists
    const previousAnswer = this.answers.find(
      (answer) => answer.questionId === currentQuestion.id,
    );
    if (previousAnswer) {
      if (currentQuestion.type === 'multi') {
        // Restore multi-choice selections
        const answerArray = Array.isArray(previousAnswer.answer)
          ? previousAnswer.answer
          : [previousAnswer.answer];
        this.selectedOptions = currentQuestion.options.filter((opt) => answerArray.some((ans) => {
          if (typeof ans === 'string' && ans.includes(': ')) {
            const [optionText] = ans.split(': ');
            return optionText === opt.text;
          }
          return ans === opt.text;
        }));
        // Restore "Other" text values
        answerArray.forEach((ans) => {
          if (typeof ans === 'string' && ans.includes(': ')) {
            const [optionText, otherText] = ans.split(': ');
            const matchingOption = currentQuestion.options.find(
              (opt) => opt.text === optionText && opt.isOther,
            );
            if (matchingOption) {
              this.otherTexts[optionText] = otherText;
            }
          }
        });
      } else {
        // Restore single-choice selection
        const answerValue = previousAnswer.answer;
        if (typeof answerValue === 'string' && answerValue.includes(': ')) {
          const [optionText, otherText] = answerValue.split(': ');
          this.selectedOption = currentQuestion.options.find(
            (opt) => opt.text === optionText,
          );
          if (this.selectedOption?.isOther) {
            this.otherText = otherText;
          }
        } else {
          this.selectedOption = currentQuestion.options.find(
            (opt) => opt.text === answerValue,
          );
        }
      }
    }

    this.block.innerHTML = `
      <div class="product-survey-container">
        <div class="survey-card">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.getProgress()}%"></div>
          </div>
          
          <div class="question-container">
            <div class="question-text">
              ${currentQuestion.text}
            </div>
            
            <div class="options-container ${currentQuestion.type === 'multi'
    ? 'multi-choice'
    : 'single-choice'}">
              ${currentQuestion
    .options.map((option, index) => {
      const isMulti = currentQuestion.type === 'multi';
      const isSelected = isMulti
        ? this.selectedOptions.some(
          (opt) => opt.text === option.text,
        )
        : this.selectedOption?.text === option.text;
      const isOther = option.isOther === true;
      const showOtherInput = isOther && isSelected;
      const otherValue = isMulti
        ? (this.otherTexts[option.text] || '')
        : (this.otherText || '');
      return `<div class="option ${isSelected ? 'selected' : ''}" data-option-index="${index}">
                  <span class="${isMulti ? 'checkbox' : 'radio'} ${isSelected ? 'checked' : ''}"></span>
                  <span class="option-text">${option.text}</span>
                  ${showOtherInput ? `<input type="text" class="other-input" data-option-text="${option.text}" placeholder="Please specify..." value="${otherValue}" />` : ''}
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
            
            <button class="btn" id="next-btn" disabled>
              ${this.currentQuestion === this.surveyData.questions.length - 1 ? 'Get Results' : 'Next'} →
            </button>
          </div>
        </div>
      </div>
    `;

    // Update next button state after rendering
    setTimeout(() => {
      this.updateNextButtonState();
    }, 0);
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

    const startBtn = this.block.querySelector('#start-survey-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.showStartScreen = false;
        this.render();
        this.attachEventListeners();
        // Update next button state after initial render
        this.updateNextButtonState();
      });
    }
  }

  getCurrentQuestion() {
    if (!this.surveyData || !this.surveyData.questions) {
      return null;
    }
    return this.surveyData.questions[this.currentQuestion] || null;
  }

  getProgress() {
    if (!this.surveyData || !this.surveyData.questions || this.surveyData.questions.length === 0) {
      return 0;
    }
    return (
      ((this.currentQuestion + 1) / this.surveyData.questions.length) * 100
    );
  }

  attachEventListeners() {
    this.block.querySelectorAll('.option').forEach((option) => {
      option.addEventListener('click', (e) => {
        // Don't trigger option selection when clicking on the text input
        if (e.target.classList.contains('other-input')) {
          return;
        }
        this.selectOption(parseInt(option.dataset.optionIndex, 10));
      });
    });

    // Add event listeners for "Other" text inputs
    this.block.querySelectorAll('.other-input').forEach((input) => {
      input.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent option selection when clicking input
      });
      input.addEventListener('input', (e) => {
        const { optionText } = e.target.dataset;
        const { value } = e.target;
        const currentQuestion = this.getCurrentQuestion();
        const isMulti = currentQuestion.type === 'multi';
        if (isMulti) {
          this.otherTexts[optionText] = value;
        } else {
          this.otherText = value;
        }
        // Update next button state based on whether "Other" text is filled
        this.updateNextButtonState();
      });
    });

    const prevBtn = this.block.querySelector('#prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.previousQuestion();
      });
    }

    const nextBtn = this.block.querySelector('#next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', async () => {
        await this.nextQuestion();
      });
    }
  }

  selectOption(optionIndex) {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion || !currentQuestion.options || !currentQuestion.options[optionIndex]) {
      return;
    }
    const option = currentQuestion.options[optionIndex];
    const isMulti = currentQuestion.type === 'multi';
    const isOther = option.isOther === true;

    if (isMulti) {
      const existingIndex = this.selectedOptions.findIndex(
        (opt) => opt.text === option.text,
      );
      if (existingIndex >= 0) {
        this.selectedOptions.splice(existingIndex, 1);
        // Clear "Other" text if deselecting
        if (isOther) {
          delete this.otherTexts[option.text];
        }
      } else {
        this.selectedOptions.push(option);
      }
    } else {
      const wasOther = this.selectedOption?.isOther === true;
      this.selectedOption = option;
      this.selectedOptions = [];
      // Clear "Other" text if switching away from "Other"
      if (!isOther && wasOther) {
        this.otherText = null;
      }
    }

    // Re-render to show/hide "Other" input field
    this.render();
    this.attachEventListeners();
    // Update next button state after re-render
    setTimeout(() => {
      this.updateNextButtonState();
    }, 0);
  }

  updateNextButtonState() {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return;

    const nextButton = this.block.querySelector('#next-btn');
    if (!nextButton) return;

    const isMulti = currentQuestion.type === 'multi';
    let isValid = false;

    if (isMulti) {
      isValid = this.selectedOptions.length > 0;
      // Check if any selected option is "Other" and has text
      const hasOtherWithoutText = this.selectedOptions.some(
        (opt) => opt.isOther === true && (!this.otherTexts[opt.text] || this.otherTexts[opt.text].trim() === ''),
      );
      if (hasOtherWithoutText) {
        isValid = false;
      }
    } else {
      isValid = !!this.selectedOption;
      // If "Other" is selected, require text input
      if (this.selectedOption?.isOther === true) {
        isValid = !!(this.otherText && this.otherText.trim() !== '');
      }
    }

    nextButton.disabled = !isValid;
  }

  previousQuestion() {
    if (this.currentQuestion > 0) {
      this.currentQuestion -= 1;
      this.selectedOption = null;
      this.selectedOptions = [];
      this.otherText = null;
      this.otherTexts = {};
      this.render();
      this.attachEventListeners();
    }
  }

  async nextQuestion() {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return;

    const isMulti = currentQuestion.type === 'multi';
    const isValidSelection = isMulti
      ? this.selectedOptions.length > 0
      : this.selectedOption;
    if (!isValidSelection) return;

    // Validate "Other" options have text
    if (isMulti) {
      const hasOtherWithoutText = this.selectedOptions.some(
        (opt) => opt.isOther === true && (!this.otherTexts[opt.text] || this.otherTexts[opt.text].trim() === ''),
      );
      if (hasOtherWithoutText) return;
    } else if (this.selectedOption?.isOther === true && (!this.otherText || this.otherText.trim() === '')) {
      return;
    }

    // Build answer data with "Other" text if applicable
    let answerValue;
    if (isMulti) {
      answerValue = this.selectedOptions.map((opt) => {
        if (opt.isOther === true && this.otherTexts[opt.text]) {
          return `${opt.text}: ${this.otherTexts[opt.text]}`;
        }
        return opt.text;
      });
    } else if (this.selectedOption.isOther === true && this.otherText) {
      answerValue = `${this.selectedOption.text}: ${this.otherText}`;
    } else {
      answerValue = this.selectedOption.text;
    }

    const answerData = {
      questionId: currentQuestion.id,
      answer: answerValue,
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
      // Last question - submit and show results
      // Submit quiz data immediately when "Get Results" is clicked
      if (!this.submissionSent) {
        await this.submitQuizData();
      }
      this.showResults();
    } else {
      this.currentQuestion += 1;
      this.selectedOption = null;
      this.selectedOptions = [];
      this.otherText = null;
      this.otherTexts = {};
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
        if (selectedOption && selectedOption.scores) {
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
    if (!results.productDetails) {
      this.block.innerHTML = `
        <div class="product-survey-container">
          <div class="survey-card">
            <div class="error-message">
              <p>Unable to calculate results. Please try again.</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

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

    const contactYesBtn = this.block.querySelector('#contact-yes-btn');
    if (contactYesBtn) {
      contactYesBtn.addEventListener('click', () => {
        this.showContactForm();
      });
    }

    const contactNoBtn = this.block.querySelector('#contact-no-btn');
    if (contactNoBtn) {
      contactNoBtn.addEventListener('click', () => {
        this.showThankYouNo();
      });
    }
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

    const contactForm = this.block.querySelector('#contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitContactForm();
      });
    }

    const backBtn = this.block.querySelector('#back-to-results');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.showResults();
      });
    }
  }

  constructQuizPayload(contactData = {}) {
    const results = this.calculateResults();
    const payload = {
      Last_Form_Date__c: (new Date()).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'EST',
      }),
      Recommended_Product: results.recommendedProduct,
      Product_Name: results.productDetails?.name || '',
      Product_Description: results.productDetails?.description || '',
      Survey_Answers: JSON.stringify(this.answers),
      ...contactData,
    };
    return payload;
  }

  async submitQuizData(contactData = {}) {
    if (!this.surveyJsonUrl) {
      // eslint-disable-next-line no-console
      console.warn('No survey JSON URL available for submission');
      return false;
    }

    try {
      const payload = this.constructQuizPayload(contactData);
      const { pathname } = new URL(this.surveyJsonUrl);
      // Extract the base path similar to form.js: /forms/marker-quiz.json -> /forms/marker-quiz
      const basePath = pathname.split('.json')[0];
      // Submit to the 'incoming' sheet
      const url = `${FORM_SUBMIT_ENDPOINT}${basePath}?sheet=incoming`;

      // eslint-disable-next-line no-console
      console.log('Submitting quiz data to:', url);
      // eslint-disable-next-line no-console
      console.log('Payload:', payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: payload }),
      });

      if (response.ok) {
        this.submissionSent = true;
        const responseText = await response.text();
        // eslint-disable-next-line no-console
        console.log('Quiz data submitted successfully', responseText);
        return true;
      }
      const errorText = await response.text();
      // eslint-disable-next-line no-console
      console.error(`Failed to submit quiz data: ${response.status} ${response.statusText}`, errorText);
      return false;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error submitting quiz data:', error);
      return false;
    }
  }

  async submitContactForm() {
    const form = this.block.querySelector('#contact-form');
    if (!form) return;

    const formData = new FormData(form);
    const contactData = Object.fromEntries(formData.entries());

    try {
      // Submit quiz data with contact information
      await this.submitQuizData(contactData);

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

    const restartBtn = this.block.querySelector('#restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restart());
    }
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
      otherText: null,
      otherTexts: {},
      showStartScreen: true,
    });
    this.render();
  }
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  return new ProductSurvey(block, config);
}
