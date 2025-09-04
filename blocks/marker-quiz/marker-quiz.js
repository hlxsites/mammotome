import { readBlockConfig } from '../../scripts/lib-franklin.js';

async function fetchSurveyData(url) {
  try {
    const resp = await fetch(url);
    const json = await resp.json();
    return json.data || json;
  } catch (error) {
    console.error('Failed to fetch survey data:', error);
    return null;
  }
}

function parseSurveyDataFromExcel(data) {
  const surveyData = {
    questions: [],
    products: {},
    thankYouYes: '',
    thankYouNo: ''
  };

  const questions = data.filter(row => row.Type === 'question');
  const products = data.filter(row => row.Type === 'product');
  const options = data.filter(row => row.Type === 'option');
  const config = data.filter(row => row.Type === 'config');

  questions.forEach(question => {
    const questionOptions = options.filter(opt => opt.QuestionId === question.Id);
    const processedOptions = questionOptions.map(opt => {
      const scores = {};
      if (opt.Scores) {
        opt.Scores.split(',').forEach(score => {
          const [product, value] = score.split(':');
          scores[product.trim()] = parseInt(value.trim());
        });
      }
      return {
        text: opt.Text,
        scores: scores
      };
    });

    surveyData.questions.push({
      id: parseInt(question.Id),
      text: question.Text,
      type: question.QuestionType || 'single',
      options: processedOptions
    });
  });

  products.forEach(product => {
    const features = product.Features ? product.Features.split(',').map(f => f.trim()) : [];
    surveyData.products[product.Id] = {
      name: product.Name,
      description: product.Description,
      image: product.Image,
      features: features,
      bestFor: product.BestFor
    };
  });

  config.forEach(configItem => {
    if (configItem.Name === 'ThankYouYes') {
      surveyData.thankYouYes = configItem.Text;
    } else if (configItem.Name === 'ThankYouNo') {
      surveyData.thankYouNo = configItem.Text;
    }
  });

  return surveyData;
}
class ProductSurvey {
  constructor(block, config) {
    this.block = block;
    this.config = config;
    this.surveyData = null;
    this.currentQuestion = 0;
    this.answers = [];
    this.selectedOption = null;
    this.loading = true;
    this.init();
  }

  async loadSurveyData() {
    const surveyLink = this.block.querySelector('a[href*=".json"]');
    if (surveyLink) {
      const surveyURL = surveyLink.href;
      const rawData = await fetchSurveyData(surveyURL);
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
            
            <div class="options-container">
              ${this.getCurrentQuestion().options.map((option, index) => `
                <div class="option ${this.selectedOption?.text === option.text ? 'selected' : ''}" 
                     data-option-index="${index}">
                  ${option.text}
                </div>
              `).join('')}
            </div>
          </div>

          <div class="navigation">
            <button class="btn btn-secondary" id="prev-btn" ${this.currentQuestion === 0 ? 'disabled' : ''}>
              ← Previous
            </button>
            
            <div class="question-counter">
              Question ${this.currentQuestion + 1} of ${this.surveyData.questions.length}
            </div>
            
            <button class="btn" id="next-btn" ${!this.selectedOption ? 'disabled' : ''}>
              ${this.currentQuestion === this.surveyData.questions.length - 1 ? 'Get Results' : 'Next'} →
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getCurrentQuestion() {
    return this.surveyData.questions[this.currentQuestion];
  }

  getProgress() {
    return ((this.currentQuestion + 1) / this.surveyData.questions.length) * 100;
  }

  attachEventListeners() {
    this.block.querySelectorAll('.option').forEach(option => {
      option.addEventListener('click', () => {
        this.selectOption(parseInt(option.dataset.optionIndex));
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
    this.selectedOption = option;
    
    this.block.querySelectorAll('.option').forEach((opt, index) => {
      opt.classList.toggle('selected', index === optionIndex);
    });
    
    this.block.querySelector('#next-btn').disabled = false;
  }

  previousQuestion() {
    if (this.currentQuestion > 0) {
      this.currentQuestion--;
      this.selectedOption = null;
      this.render();
      this.attachEventListeners();
    }
  }

  nextQuestion() {
    if (!this.selectedOption) return;

    const newAnswers = [...this.answers];
    const existingAnswerIndex = newAnswers.findIndex(
      answer => answer.questionId === this.getCurrentQuestion().id
    );

    if (existingAnswerIndex >= 0) {
      newAnswers[existingAnswerIndex] = {
        questionId: this.getCurrentQuestion().id,
        answer: this.selectedOption.text
      };
    } else {
      newAnswers.push({
        questionId: this.getCurrentQuestion().id,
        answer: this.selectedOption.text
      });
    }

    this.answers = newAnswers;

    if (this.currentQuestion === this.surveyData.questions.length - 1) {
      this.showResults();
    } else {
      this.currentQuestion++;
      this.selectedOption = null;
      this.render();
      this.attachEventListeners();
    }
  }

  calculateResults() {
    const scores = {};
    
    Object.keys(this.surveyData.products).forEach(product => {
      scores[product] = 0;
    });

    this.answers.forEach(answer => {
      const question = this.surveyData.questions.find(q => q.id === answer.questionId);
      if (question) {
        const selectedOption = question.options.find(opt => opt.text === answer.answer);
        if (selectedOption) {
          Object.keys(selectedOption.scores).forEach(product => {
            scores[product] += selectedOption.scores[product];
          });
        }
      }
    });

    const maxScore = Math.max(...Object.values(scores));
    const recommendedProduct = Object.keys(scores).find(product => scores[product] === maxScore);

    return {
      scores,
      recommendedProduct,
      productDetails: this.surveyData.products[recommendedProduct]
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
              ${results.productDetails.features.map(feature => `<li>${feature}</li>`).join('')}
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

    this.block.querySelector('#contact-yes-btn').addEventListener('click', () => {
      this.showContactForm();
    });

    this.block.querySelector('#contact-no-btn').addEventListener('click', () => {
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

    this.block.querySelector('#contact-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitContactForm();
    });

    this.block.querySelector('#back-to-results').addEventListener('click', () => {
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
      console.log('Contact form submitted:', data);
      
      this.showThankYouYes();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your information. Please try again.');
    }
  }

  showThankYouYes() {
    const thankYouMessage = this.surveyData.thankYouYes || 'Thank you for your interest! A sales representative will contact you within 24 hours.';
    
    this.block.innerHTML = `
      <div class="product-survey-container">
        <div class="survey-card">
          <div class="thank-you-container">
            <h2>Thank You!</h2>
            <p>${thankYouMessage}</p>
            <button class="btn" id="restart-btn">Take Survey Again</button>
          </div>
        </div>
      </div>
    `;

    this.block.querySelector('#restart-btn').addEventListener('click', () => {
      this.restart();
    });
  }

  showThankYouNo() {
    const thankYouMessage = this.surveyData.thankYouNo || 'Thank you for taking our survey! We hope you found the product recommendation helpful.';
    
    this.block.innerHTML = `
      <div class="product-survey-container">
        <div class="survey-card">
          <div class="thank-you-container">
            <h2>Thank You!</h2>
            <p>${thankYouMessage}</p>
            <button class="btn" id="restart-btn">Take Survey Again</button>
          </div>
        </div>
      </div>
    `;

    this.block.querySelector('#restart-btn').addEventListener('click', () => {
      this.restart();
    });
  }

  restart() {
    this.currentQuestion = 0;
    this.answers = [];
    this.selectedOption = null;
    this.render();
    this.attachEventListeners();
  }
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
    new ProductSurvey(block, config);
}
