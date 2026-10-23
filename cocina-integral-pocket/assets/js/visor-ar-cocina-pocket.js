import '../vendor/model-viewer.min.js';

// Oculta el estado de carga cuando model-viewer informa que terminó de cargar el modelo.
const model = document.querySelector('model-viewer');
const loadingMessage = document.querySelector('.loading-message');
model.addEventListener('load', () => loadingMessage?.remove());
model.addEventListener('error', () => {
  if (loadingMessage) loadingMessage.textContent = 'No se pudo cargar el modelo. Revisá tu conexión e intentá nuevamente.';
});
