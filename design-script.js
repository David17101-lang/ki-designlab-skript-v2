// Skript für KI-DesignLab.de
document.addEventListener('DOMContentLoaded', function() {
  // Versuche, das Produktformular zu finden
  let productForm = document.querySelector('.product-form');
  if (!productForm) {
    // Fallback: Füge das Formular an einer anderen Stelle hinzu
    productForm = document.createElement('div');
    productForm.className = 'custom-design-form';
    const productSection = document.querySelector('.product');
    if (productSection) {
      productSection.appendChild(productForm);
    } else {
      console.error('Keine Produktsektion gefunden. Bitte überprüfe dein Shopify-Theme.');
      return;
    }
  }

  const inputField = document.createElement('input');
  inputField.type = 'text';
  inputField.placeholder = 'Gib deine Design-Idee ein (z. B. Cyberpunk, Katze, Neon)';
  inputField.id = 'design-prompt';
  inputField.style.margin = '10px 0';
  productForm.appendChild(inputField);

  const generateButton = document.createElement('button');
  generateButton.innerText = 'Design erstellen';
  generateButton.style.padding = '10px';
  generateButton.style.backgroundColor = '#00FFFF';
  generateButton.style.color = '#000';
  generateButton.style.border = 'none';
  generateButton.style.cursor = 'pointer';
  generateButton.onclick = generateDesign;
  productForm.appendChild(generateButton);
});

async function generateDesign() {
  const prompt = document.getElementById('design-prompt').value;
  if (!prompt) {
    alert('Bitte gib eine Design-Idee ein, bevor du fortfährst!');
    return;
  }

  const apiToken = 'DEIN_REPLICATE_API_TOKEN'; // Dein Replicate API-Token

  try {
    // Schritt 1: Erstelle eine Prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5',
        input: { prompt: prompt }
      })
    });

    const prediction = await response.json();
    if (!prediction.id) {
      alert('Die Replicate API hat keine Prediction-ID zurückgegeben. Überprüfe deinen API-Token.');
      return;
    }

    // Schritt 2: Warte auf das Ergebnis der Prediction
    let designUrl = null;
    for (let i = 0; i < 30; i++) { // Maximal 30 Sekunden warten
      const resultResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${apiToken}`
        }
      });
      const result = await resultResponse.json();
      if (result.status === 'succeeded' && result.output && result.output[0]) {
        designUrl = result.output[0];
        break;
      } else if (result.status === 'failed') {
        alert('Die Bildgenerierung ist fehlgeschlagen. Bitte versuche es später erneut.');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 Sekunde warten
    }

    if (!designUrl) {
      alert('Das Design konnte nicht generiert werden. Bitte versuche es nach 30 Sekunden erneut.');
      return;
    }

    applyDesignToProduct(designUrl);
  } catch (error) {
    console.error('Fehler bei der Bildgenerierung:', error);
    alert('Ein unerwarteter Fehler ist aufgetreten. Überprüfe die Browser-Konsole für Details.');
  }
}

async function applyDesignToProduct(designUrl) {
  const shopifyApiKey = 'f4cf2a47d78a216dd52b6699bec032b8'; // Dein Shopify API-Schlüssel
  const shopifyPassword = 'd504a56714d6f4a47e855385416dfd49'; // Dein Shopify Passwort
  const shopifyStore = '0v01zh-mz.myshopify.com'; // Dein Shopify-Store-Name
  const productId = '14992080503128'; // Deine Produkt-ID

  try {
    const response = await fetch(`https://${shopifyApiKey}:${shopifyPassword}@${shopifyStore}/admin/api/2023-10/products/${productId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product: {
          id: productId,
          images: [{ src: designUrl }]
        }
      })
    });

    if (response.ok) {
      alert('Design erfolgreich erstellt und angewendet! Du kannst es jetzt kaufen.');
    } else {
      const errorData = await response.json();
      console.error('Shopify API Fehler:', errorData);
      alert('Das Design konnte nicht auf das Produkt angewendet werden. Überprüfe die Konsole für Details.');
    }
  } catch (error) {
    console.error('Fehler beim Anwenden des Designs:', error);
    alert('Ein unerwarteter Fehler ist aufgetreten. Überprüfe die Browser-Konsole für Details.');
  }
}