async function renderWidget() {
  const res = await fetch('https://taskboard-widget.onrender.com/api/widget-card');
  const cardJson = await res.json();
  const adaptiveCard = new AdaptiveCards.AdaptiveCard();
  adaptiveCard.parse(cardJson);
  const rendered = adaptiveCard.render();
  const container = document.getElementById('widget');
  container.innerHTML = '';
  container.appendChild(rendered);
}

document.addEventListener('DOMContentLoaded', renderWidget);
