/* ============================================================
   CANVAS.JS - Gestion du canvas Fabric.js
   ============================================================ */

// Instance Fabric.js
let canvas = null;

/* ===== INITIALISATION ===== */
function initCanvas() {
  canvas = new fabric.Canvas('mainCanvas', {
    selection: true,
    preserveObjectStacking: true
  });
  
  // Resize initial
  resizeCanvas();
  
  // Événement resize
  window.addEventListener('resize', resizeCanvas);
  
  // Événement zoom molette
  canvas.on('mouse:wheel', handleMouseWheel);
  
  return canvas;
}

/* ===== RESIZE ===== */
function resizeCanvas() {
  if (!canvas) return;
  
  canvas.setWidth(UI.wrapper.clientWidth);
  canvas.setHeight(UI.wrapper.clientHeight);
  clampViewportToBackground();
  canvas.requestRenderAll();
}

/* ===== VIEWPORT ===== */
function clampViewportToBackground() {
  const bg = canvas.backgroundImage;
  if (!bg) return;
  
  const zoom = canvas.getZoom();
  const contentW = bg.width * zoom;
  const contentH = bg.height * zoom;
  const vpt = canvas.viewportTransform;
  
  // Horizontal
  if (contentW <= canvas.width) {
    vpt[4] = (canvas.width - contentW) / 2;
  } else {
    const minX = canvas.width - contentW;
    const maxX = 0;
    vpt[4] = Math.min(maxX, Math.max(minX, vpt[4]));
  }
  
  // Vertical
  if (contentH <= canvas.height) {
    vpt[5] = (canvas.height - contentH) / 2;
  } else {
    const minY = canvas.height - contentH;
    const maxY = 0;
    vpt[5] = Math.min(maxY, Math.max(minY, vpt[5]));
  }
}

function resetViewToCenter() {
  if (!canvas) return;
  
  canvas.setZoom(State.initialZoom);
  const vpt = canvas.viewportTransform;
  vpt[0] = State.initialZoom;
  vpt[3] = State.initialZoom;
  
  const bg = canvas.backgroundImage;
  vpt[4] = (canvas.width - (bg?.width || 0) * State.initialZoom) / 2;
  vpt[5] = (canvas.height - (bg?.height || 0) * State.initialZoom) / 2;
  
  clampViewportToBackground();
  canvas.requestRenderAll();
}

/* ===== ZOOM ===== */
function clampZoom(z) {
  return Math.max(State.initialZoom, Math.min(CONFIG.MAX_ZOOM, z));
}

function applyZoom(factor) {
  if (!canvas) return;
  
  const zoom = clampZoom(canvas.getZoom() * factor);
  canvas.zoomToPoint({ x: canvas.width / 2, y: canvas.height / 2 }, zoom);
  clampViewportToBackground();
  canvas.requestRenderAll();
}

function handleMouseWheel(opt) {
  if (!State.pdfDoc) return;
  
  let zoom = canvas.getZoom();
  zoom *= 0.999 ** opt.e.deltaY;
  zoom = clampZoom(zoom);
  
  canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
  clampViewportToBackground();
  canvas.requestRenderAll();
  
  opt.e.preventDefault();
  opt.e.stopPropagation();
}

/* ===== BACKGROUND ===== */
function setCanvasBackground(img) {
  canvas.clear();
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  
  // Calculer le zoom initial
  const ratio = Math.min(
    canvas.width / img.width,
    canvas.height / img.height
  ) * CONFIG.MIN_ZOOM_FACTOR;
  
  State.initialZoom = ratio;
  
  canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
    originX: 'left',
    originY: 'top',
    left: 0,
    top: 0,
    selectable: false,
    evented: false
  });
  
  resetViewToCenter();
}

/* ===== COORDINATE CONVERSION ===== */
function clientToCanvasPoint(clientX, clientY) {
  const rect = UI.wrapper.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  
  // Convertir screen -> canvas (avec zoom/pan)
  const pt = new fabric.Point(x, y);
  const inv = fabric.util.invertTransform(canvas.viewportTransform);
  const p2 = fabric.util.transformPoint(pt, inv);
  
  return { x: p2.x, y: p2.y };
}

/* ===== SAVE / RESTORE ===== */
function saveCanvasState() {
  if (!canvas) return null;
  // FIX: utilise CONFIG.CUSTOM_PROPS pour sérialiser TOUTES les métadonnées
  return canvas.toDatalessJSON(CONFIG.CUSTOM_PROPS);
}

function restoreCanvasState(json) {
  if (!canvas || !json) return;
  
  // Supprimer tous les objets sauf le background
  canvas.getObjects().forEach(obj => {
    if (obj !== canvas.backgroundImage) {
      canvas.remove(obj);
    }
  });
  
  canvas.loadFromJSON(json, () => {
    if (State.mode !== MODES.PAN) {
      canvas.forEachObject(obj => obj.selectable = false);
    }
    canvas.requestRenderAll();
  });
}

/* ===== OBJECT MANAGEMENT ===== */
function removeActiveObjects() {
  const actives = canvas.getActiveObjects();
  if (!actives.length) return false;
  
  actives.forEach(obj => canvas.remove(obj));
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  return true;
}

function removeLastObject() {
  const objs = canvas.getObjects().filter(o => o !== canvas.backgroundImage);
  if (!objs.length) return false;
  
  canvas.remove(objs[objs.length - 1]);
  canvas.requestRenderAll();
  return true;
}

function clearAllObjects() {
  canvas.getObjects().forEach(obj => {
    if (obj !== canvas.backgroundImage) {
      canvas.remove(obj);
    }
  });
  canvas.discardActiveObject();
  canvas.requestRenderAll();
}

function addObject(obj) {
  canvas.add(obj);
  canvas.requestRenderAll();
}

function removeObject(obj) {
  if (obj) {
    canvas.remove(obj);
    canvas.requestRenderAll();
  }
}

function setActiveObject(obj) {
  canvas.setActiveObject(obj);
  canvas.requestRenderAll();
}

/* ===== SELECTION MODE ===== */
function setSelectionMode(enabled) {
  canvas.selection = enabled;
  canvas.forEachObject(obj => obj.selectable = enabled);
  
  if (!enabled) {
    canvas.discardActiveObject();
  }
  
  canvas.defaultCursor = enabled ? 'grab' : 'crosshair';
  canvas.requestRenderAll();
}

// Export (plus de exportToPNG ici — voir export.js)
window.canvas = null;
window.initCanvas = initCanvas;
window.resizeCanvas = resizeCanvas;
window.resetViewToCenter = resetViewToCenter;
window.applyZoom = applyZoom;
window.clampZoom = clampZoom;
window.setCanvasBackground = setCanvasBackground;
window.clientToCanvasPoint = clientToCanvasPoint;
window.saveCanvasState = saveCanvasState;
window.restoreCanvasState = restoreCanvasState;
window.removeActiveObjects = removeActiveObjects;
window.removeLastObject = removeLastObject;
window.clearAllObjects = clearAllObjects;
window.addObject = addObject;
window.removeObject = removeObject;
window.setActiveObject = setActiveObject;
window.setSelectionMode = setSelectionMode;
window.clampViewportToBackground = clampViewportToBackground;
