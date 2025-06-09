async function renderWidget() {
  const container = document.getElementById('widget');
  try {
    const res = await fetch('https://taskboard-widget.onrender.com/api/widget-card');
    if (!res.ok) {
      container.textContent = `Erreur HTTP ${res.status}`;
      return;
    }
    const cardJson = await res.json();
    console.log('Widget JSON:', cardJson);
    const adaptiveCard = new AdaptiveCards.AdaptiveCard();
    adaptiveCard.onExecuteAction = action => {
      if (action && action.getActionType() === 'Action.OpenUrl') {
        window.location = action.url;
      }
    };
    adaptiveCard.parse(cardJson);
    const rendered = adaptiveCard.render();
    container.innerHTML = '';
    container.appendChild(rendered);
  } catch (err) {
    console.error('Error rendering widget:', err);
    container.textContent = 'Erreur de chargement du widget';
  }
}

document.addEventListener('DOMContentLoaded', renderWidget);
