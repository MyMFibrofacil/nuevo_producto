/* Agrega un control compacto para acercar el modelo sin salir del visor. */
(() => {
  const slide = document.querySelector('.mym3d-slide');
  if (!slide) return;

  const shell = document.querySelector('.mym3d-shell');
  if (!shell) return;

  const magnifier = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="m16 16 5 5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>';
  const observer = new MutationObserver(() => {
    const model = shell.querySelector('model-viewer');
    if (!model || shell.querySelector('.mym3d-zoom')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mym3d-zoom';
    button.setAttribute('aria-label', 'Acercar el modelo');
    button.innerHTML = magnifier;
    let originalOrbit = null;
    let zoomed = false;
    button.addEventListener('click', () => {
      if (!model.loaded) return;
      if (!zoomed) {
        const orbit = model.getCameraOrbit();
        originalOrbit = `${orbit.theta}rad ${orbit.phi}rad ${orbit.radius}m`;
        model.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${Math.max(orbit.radius * .72, .6)}m`;
        button.setAttribute('aria-label', 'Restablecer acercamiento');
      } else {
        model.cameraOrbit = originalOrbit;
        button.setAttribute('aria-label', 'Acercar el modelo');
      }
      zoomed = !zoomed;
    });
    shell.append(button);
  });
  observer.observe(shell, { childList: true, subtree: true });
})();
