/* Live PhoenixEffect heading. Glyph coordinates remain in Minecraft GUI units. */
(() => {
  'use strict';
  const glyphs = {"C":{"advance":6,"rows":[14,17,1,1,1,17,14,0]},"h":{"advance":6,"rows":[1,1,13,19,17,17,17,0]},"r":{"advance":6,"rows":[0,0,13,19,1,1,1,0]},"o":{"advance":6,"rows":[0,0,14,17,17,17,14,0]},"m":{"advance":6,"rows":[0,0,11,21,21,17,17,0]},"a":{"advance":6,"rows":[0,0,14,16,30,17,30,0]},"t":{"advance":4,"rows":[2,2,7,2,2,2,4,0]},"i":{"advance":2,"rows":[1,0,1,1,1,1,1,0]},"c":{"advance":6,"rows":[0,0,14,17,1,17,14,0]}," ":{"advance":4,"rows":[0,0,0,0,0,0,0,0]},"d":{"advance":6,"rows":[16,16,22,25,17,17,30,0]},"e":{"advance":6,"rows":[0,0,14,17,31,1,30,0]},"s":{"advance":6,"rows":[0,0,30,1,14,16,15,0]}};
  const title = document.querySelector('.av-phoenix-title');
  if (!title) return;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true'); title.append(canvas);
  const context = canvas.getContext('2d');
  if (!context) return;
  const text = 'Chromatic Codes', palette = [0xFF6A00, 0xFFCC00, 0xFF3B66];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const advance = [...text].reduce((sum, char) => sum + glyphs[char].advance, 0);
  let unit = 1, ratio = 0, width = 0, visible = true, frame = 0;
  title.classList.add('av-phoenix-ready');
  // The same rates and palette are used by GalleryPresets for PhoenixEffect.
  function color(seconds, x) {
    const phase = ((seconds * .625 + x * .02) % 1 + 1) % 1 * palette.length;
    const a = palette[Math.floor(phase)], b = palette[(Math.floor(phase) + 1) % palette.length];
    const mix = phase % 1;
    return [16, 8, 0].map(shift => Math.trunc(((a >> shift) & 255) + (((b >> shift) & 255) - ((a >> shift) & 255)) * mix));
  }
  function resize() {
    ratio = devicePixelRatio || 1;
    width = title.getBoundingClientRect().width;
    // Whole device-pixel cells prevent missing rows at fractional browser zoom.
    unit = Math.max(1, Math.floor(Math.min(width * ratio / (advance + 1), 12 * ratio)));
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = 12 * unit;
    canvas.style.height = (canvas.height / ratio) + 'px';
    draw(performance.now());
  }
  function draw(now) {
    const seconds = reduced.matches ? 0 : now / 1000;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    let x = 0;
    for (const char of text) {
      const glyph = glyphs[char];
      const y = Math.round((2 + Math.sin(seconds * Math.PI * 1.25 + x * .06)) * unit);
      for (const shadow of [true, false]) {
        const left = x * unit + (shadow ? unit : 0), top = y + (shadow ? unit : 0);
        const gradient = context.createLinearGradient(left, 0, left + glyph.advance * unit, 0);
        for (const [stop, sample] of [[0, x], [1, x + glyph.advance]]) {
          const rgb = color(seconds, sample).map(value => shadow ? (value & 252) >> 2 : value);
          gradient.addColorStop(stop, 'rgb(' + rgb.join(',') + ')');
        }
        context.fillStyle = gradient;
        glyph.rows.forEach((bits, row) => {
          for (let col = 0; col < 8; col++)
            if (bits & (1 << col)) context.fillRect(left + col * unit, top + row * unit, unit, unit);
        });
      }
      x += glyph.advance;
    }
    canvas.dataset.frame = String(now);
    canvas.dataset.pixelUnit = String(unit);
  }
  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || reduced.matches) return;
    if (ratio !== (devicePixelRatio || 1)) resize();
    draw(now); frame = requestAnimationFrame(tick);
  }
  function resume() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
    else draw(performance.now());
  }
  new ResizeObserver(resize).observe(title);
  new IntersectionObserver(entries => {visible = entries[0].isIntersecting; resume();}).observe(title);
  document.addEventListener('visibilitychange', resume);
  reduced.addEventListener('change', resume);
  window.addEventListener('resize', resize);
  resize(); resume();
})();
