const cellSize = 60;
const workspaceCols = 12;
const workspaceRows = 6;
const moduleRows = 2;
const moduleCols = 4;

const moduleDefs = {
  pot: { label: 'Potentiometer', cellClass: 'pot' },
  encoder: { label: 'Encoder', cellClass: 'encoder' },
  button: { label: 'Button', cellClass: 'button' },
  slider: { label: 'Slider', cellClass: 'slider' }
};

const occupancy = Array.from({ length: workspaceRows }, () => Array(workspaceCols).fill(null));
let moduleCounter = 0;

const palette = document.getElementById('palette');
const workspace = document.getElementById('workspace');

function createModuleElement(type) {
  const def = moduleDefs[type];
  const mod = document.createElement('div');
  mod.className = 'module';
  mod.dataset.type = type;
  for (let i = 0; i < moduleRows * moduleCols; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    const comp = document.createElement('div');
    comp.className = 'component ' + def.cellClass;
    cell.appendChild(comp);
    mod.appendChild(cell);
  }
  return mod;
}

function initPalette() {
  Object.keys(moduleDefs).forEach(type => {
    const tmpl = createModuleElement(type);
    tmpl.classList.add('template');
    tmpl.draggable = true;
    tmpl.addEventListener('dragstart', e => {
      e.dataTransfer.setData('type', type);
    });
    palette.appendChild(tmpl);
  });
}

function occupy(x, y, id) {
  for (let r = 0; r < moduleRows; r++) {
    for (let c = 0; c < moduleCols; c++) {
      occupancy[y + r][x + c] = id;
    }
  }
}

function clearOccupancy(id, x, y) {
  for (let r = 0; r < moduleRows; r++) {
    for (let c = 0; c < moduleCols; c++) {
      if (occupancy[y + r][x + c] === id) {
        occupancy[y + r][x + c] = null;
      }
    }
  }
}

function canPlace(x, y, ignoreId = null) {
  if (x < 0 || y < 0 || x + moduleCols > workspaceCols || y + moduleRows > workspaceRows) {
    return false;
  }
  for (let r = 0; r < moduleRows; r++) {
    for (let c = 0; c < moduleCols; c++) {
      const occ = occupancy[y + r][x + c];
      if (occ && occ !== ignoreId) {
        return false;
      }
    }
  }
  return true;
}

function addWorkspaceModule(type, x, y) {
  const mod = createModuleElement(type);
  mod.classList.add('placed');
  const id = 'm' + moduleCounter++;
  mod.dataset.id = id;
  mod.style.left = x * cellSize + 'px';
  mod.style.top = y * cellSize + 'px';
  mod.dataset.gridX = x;
  mod.dataset.gridY = y;

  const del = document.createElement('button');
  del.textContent = '×';
  del.className = 'delete';
  del.addEventListener('click', () => removeModule(mod));
  mod.appendChild(del);

  mod.draggable = true;
  mod.addEventListener('dragstart', e => {
    e.dataTransfer.setData('moduleId', id);
    const rect = mod.getBoundingClientRect();
    e.dataTransfer.setData('offsetX', e.clientX - rect.left);
    e.dataTransfer.setData('offsetY', e.clientY - rect.top);
  });

  workspace.appendChild(mod);
  occupy(x, y, id);
}

function removeModule(mod) {
  const id = mod.dataset.id;
  const x = parseInt(mod.dataset.gridX, 10);
  const y = parseInt(mod.dataset.gridY, 10);
  clearOccupancy(id, x, y);
  mod.remove();
}

workspace.addEventListener('dragover', e => e.preventDefault());

workspace.addEventListener('drop', e => {
  e.preventDefault();
  const rect = workspace.getBoundingClientRect();
  const offsetX = parseInt(e.dataTransfer.getData('offsetX')) || 0;
  const offsetY = parseInt(e.dataTransfer.getData('offsetY')) || 0;
  let x = Math.floor((e.clientX - rect.left - offsetX) / cellSize + 0.5);
  let y = Math.floor((e.clientY - rect.top - offsetY) / cellSize + 0.5);

  const moduleId = e.dataTransfer.getData('moduleId');
  if (moduleId) {
    const mod = document.querySelector(`[data-id="${moduleId}"]`);
    const oldX = parseInt(mod.dataset.gridX, 10);
    const oldY = parseInt(mod.dataset.gridY, 10);
    clearOccupancy(moduleId, oldX, oldY);
    if (canPlace(x, y, moduleId)) {
      mod.style.left = x * cellSize + 'px';
      mod.style.top = y * cellSize + 'px';
      mod.dataset.gridX = x;
      mod.dataset.gridY = y;
      occupy(x, y, moduleId);
    } else {
      occupy(oldX, oldY, moduleId);
    }
    return;
  }

  const type = e.dataTransfer.getData('type');
  if (type && canPlace(x, y)) {
    addWorkspaceModule(type, x, y);
  }
});

initPalette();
