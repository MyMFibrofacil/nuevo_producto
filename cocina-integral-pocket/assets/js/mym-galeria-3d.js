(() => {
  const slide = document.querySelector('.mym3d-slide');
  if (!slide) return;
  const cfg = JSON.parse(slide.dataset.mym3d);
  const shell = slide.querySelector('.mym3d-shell');
  let started = false;
  slide.addEventListener('click', event => event.stopPropagation());
  shell.querySelector('.mym3d-start').addEventListener('click', async () => {
    if (started) return;
    started = true;
    const start = shell.querySelector('.mym3d-start');
    start.textContent = 'Cargando 3D…';
    try {
      await import(new URL('../vendor/model-viewer.min.js', location.href));
      const model = document.createElement('model-viewer');
      model.className = 'mym3d-viewer';
      model.setAttribute('camera-controls', '');
      model.setAttribute('touch-action', 'none');
      model.setAttribute('ar', '');
      model.setAttribute('ar-modes', cfg.arModes);
      model.setAttribute('camera-orbit', (matchMedia('(max-width: 767px)').matches && cfg.mobileOrbit) || cfg.camera.orbita || 'auto auto auto');
      model.setAttribute('camera-target', cfg.camera.objetivo || 'auto auto auto');
      model.setAttribute('field-of-view', cfg.camera.campo || 'auto');
      if (cfg.camera.minimo) model.setAttribute('min-camera-orbit', cfg.camera.minimo);
      if (cfg.camera.maximo) model.setAttribute('max-camera-orbit', cfg.camera.maximo);
      model.setAttribute('ios-src', cfg.usdz);
      model.setAttribute('src', cfg.glb);
      shell.replaceChildren(model);
      shell.classList.add('mym3d-active');
      shell.classList.toggle('mym3d-has-movements', Boolean(cfg.movements.length || cfg.levelMovement || cfg.chairMovement));
      for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
        shell.addEventListener(type, event => {
          // FlexSlider escucha estos gestos en la galería. Los iniciados en
          // la vista 3D deben quedar dentro del visor y de sus controles.
          event.stopPropagation();
          if (type === 'touchmove' && event.target === model && event.cancelable) {
            event.preventDefault();
          }
        }, { passive: false });
      }
      if (cfg.movements.length) addMovements(shell, model, cfg.movements);
      if (cfg.levelMovement) addLevelMovement(shell, model, cfg.levelMovement);
      if (cfg.chairMovement) addChairMovement(shell, model, cfg.chairMovement);
      addAR(shell, model, cfg);
    } catch (error) {
      start.textContent = 'Reintentar vista 3D';
      started = false;
      console.error('MYM 3D:', error);
    }
  });

  function addMovements(shell, model, movements) {
    const bar = document.createElement('div');
    bar.className = 'mym3d-controls';
    const label = document.createElement('label');
    label.textContent = 'Mover pieza';
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Elegir pieza');
    const range = document.createElement('input');
    range.type = 'range'; range.min = '0'; range.max = '100'; range.value = '0';
    range.setAttribute('aria-label', 'Mover pieza seleccionada');
    const value = document.createElement('output'); value.textContent = '0%';
    for (const movement of movements) select.add(new Option(movement.name, movement.name));
    const update = () => {
      const movement = movements.find(item => item.name === select.value);
      if (!movement || !model.loaded) return;
      model.pause();
      const animation = model.availableAnimations.includes(movement.name)
        ? movement.name
        : model.availableAnimations.find(name => name.startsWith('Grifo') && movement.name.startsWith('Grifo'));
      if (!animation) return;
      model.animationName = animation;
      model.currentTime = Math.min(Number(range.value) * movement.duration / 100, movement.duration - 0.001);
      value.textContent = range.value + '%';
    };
    model.addEventListener('load', update);
    select.addEventListener('change', () => { range.value = '0'; update(); });
    range.addEventListener('input', update);
    bar.append(label, select, range, value);
    shell.append(bar);
  }

  function addLevelMovement(shell, model, movement) {
    const bar = document.createElement('div');
    bar.className = 'mym3d-controls';
    const label = document.createElement('label');
    label.textContent = 'Altura de la plataforma';
    const range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.max = String(movement.levels - 1);
    range.step = '1';
    range.value = '0';
    range.setAttribute('aria-label', 'Posición de la plataforma');
    const value = document.createElement('output');
    const update = () => {
      value.textContent = `Nivel ${Number(range.value) + 1} de ${movement.levels}`;
      if (!model.loaded || !model.availableAnimations.includes(movement.name)) return;
      model.animationName = movement.name;
      model.pause();
      model.currentTime = Number(range.value) * movement.secondsPerLevel;
    };
    model.addEventListener('load', update);
    range.addEventListener('input', update);
    bar.append(label, range, value);
    shell.append(bar);
    update();
  }

  function addChairMovement(shell, model, movement) {
    const names = movement.names;
    if (names.length !== 2) return;
    const positions = [0, 0];
    const bar = document.createElement('div');
    bar.className = 'mym3d-controls';
    const label = document.createElement('label');
    label.textContent = 'Silla para mover';
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Silla para mover');
    names.forEach((name, index) => select.add(new Option(name, String(index))));
    const range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.max = '100';
    range.value = '0';
    range.setAttribute('aria-label', 'Mover silla seleccionada');
    const value = document.createElement('output');
    const showPosition = () => {
      const position = positions[Number(select.value)];
      range.value = String(Math.round(position * 100));
      value.textContent = position === 0 ? 'Adentro' : position === 1 ? 'Afuera' : `${Math.round(position * 100)}% afuera`;
    };
    const apply = () => {
      if (!model.loaded || !names.every(name => model.availableAnimations.includes(name))) return;
      const selected = Number(select.value);
      const other = 1 - selected;
      model.pause();
      if (model.animationName !== names[selected]) model.animationName = names[selected];
      if (model.appendedAnimations.includes(names[other])) {
        model.detachAnimation(names[other], { fade: false });
      }
      model.pause();
      model.currentTime = positions[selected] * movement.duration;
      model.appendAnimation(names[other], {
        time: positions[other] * movement.duration,
        timeScale: 0,
        repetitions: 1,
        fade: 0,
      });
      model.pause();
    };
    model.addEventListener('load', apply);
    select.addEventListener('change', () => { showPosition(); apply(); });
    range.addEventListener('input', () => {
      positions[Number(select.value)] = Number(range.value) / 100;
      showPosition();
      apply();
      model.cameraOrbit = `35deg 65deg ${(2.1 + 0.9 * Math.max(...positions)).toFixed(2)}m`;
    });
    bar.append(label, select, range, value);
    shell.append(bar);
    showPosition();
  }

  function addAR(shell, model, cfg) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'mym3d-ar';
    button.textContent = 'Ver en mi habitación';
    shell.append(button);
    const originalGlb = cfg.glb;
    let arStarted = false;
    model.addEventListener('ar-status', event => {
      if (event.detail.status === 'session-started') arStarted = true;
      if ((event.detail.status === 'not-presenting' && arStarted) || event.detail.status === 'failed') {
        arStarted = false;
        if (model.getAttribute('src') !== originalGlb) model.setAttribute('src', originalGlb);
      }
    });
    model.addEventListener('load', () => {
      if (model.canActivateAR) button.classList.add('mym3d-ar-ready');
    });
    button.addEventListener('click', async () => {
      if (!model.canActivateAR) {
        button.textContent = model.loaded ? 'AR no disponible en este celular' : 'Esperá a que cargue el modelo';
        setTimeout(() => { button.textContent = 'Ver en mi espacio'; }, 2500);
        return;
      }
      if (cfg.arGlb) {
        button.disabled = true;
        button.textContent = 'Preparando cámara…';
        model.setAttribute('src', cfg.arGlb);
        model.addEventListener('load', async () => {
          button.disabled = false;
          button.textContent = 'Ver en mi habitación';
          await model.activateAR();
        }, {once:true});
      } else await model.activateAR();
    });
  }
})();
