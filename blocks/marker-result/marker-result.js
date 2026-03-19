import { getMarkerRecommendations } from '../../scripts/lib-franklin.js';

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbz-ohnFf3f48X4-bA8C4Cdt7wybi9bP1RLp_40BMc6DITxzVeAjG8FFAjffD0tV-MLX/exec';

export default async function decorate(block) {
  const params = new URLSearchParams(window.location.search);
  const uuid = params.get('uuid');
  const token = params.get('token');
  const tokenCreatedAt = params.get('tokenCreatedAt');

  if (!uuid || !token || !tokenCreatedAt) {
    block.innerHTML = '<p>Invalid or missing results link.</p>';
    return;
  }

  block.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading your results...</p></div>';

  try {
    const url = `${SHEET_URL}?uuid=${encodeURIComponent(uuid)}&token=${encodeURIComponent(token)}&tokenCreatedAt=${encodeURIComponent(tokenCreatedAt)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.success) {
      block.innerHTML = `<p>Unable to load results: ${data.error || 'Unknown error'}</p>`;
      return;
    }

    const { products } = await getMarkerRecommendations();
    const productId = data.recommendedProductId;
    const product = products[productId];

    if (!product) {
      block.innerHTML = '<p>Product recommendation not found.</p>';
      return;
    }

    block.innerHTML = `
      <div class="marker-results-container">
        <div class="results-hero">
          <img src="${product.cardImage || product.image}" alt="${product.name}" />
          <div class="results-content">
            <p class="results-label">Your recommended marker</p>
            <h1>${product.name}</h1>
            <p>${product.description}</p>
          </div>
        </div>
        <div class="results-features">
          <h2>Product Features</h2>
          <ul>
            ${(product.features || []).map((f) => `<li>${f}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  } catch (error) {
    block.innerHTML = '<p>Something went wrong loading your results. Please try again later.</p>';
  }
}