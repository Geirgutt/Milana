const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const restartButton = document.getElementById("restartButton");
const sniffButton = document.getElementById("sniffButton");
const soundButton = document.getElementById("soundButton");
const helpButton = document.getElementById("helpButton");
const helpDialog = document.getElementById("helpDialog");
const joystickBase = document.getElementById("joystickBase");
const joystickKnob = document.getElementById("joystickKnob");
const storyPanel = document.getElementById("storyPanel");
const storySpeaker = document.getElementById("storySpeaker");
const storyText = document.getElementById("storyText");
const storyNextButton = document.getElementById("storyNextButton");

const keys = new Set();
const pointer = {
  active: false,
  x: 0,
  y: 0,
  pointerId: null,
  touchId: null,
  usingTouchEvents: false
};
const joystick = {
  active: false,
  pointerId: null,
  touchId: null,
  dx: 0,
  dy: 0,
  maxRadius: 34
};
const audioState = {
  enabled: true,
  ctx: null
};

const houseFurniture = [
  { x: 120, y: 120, w: 250, h: 120, type: "sofa" },
  { x: 455, y: 145, w: 185, h: 115, type: "table" },
  { x: 465, y: 100, w: 52, h: 52, type: "chair" },
  { x: 575, y: 100, w: 52, h: 52, type: "chair" },
  { x: 760, y: 86, w: 185, h: 90, type: "bed" },
  { x: 1010, y: 110, w: 98, h: 185, type: "cabinet" },
  { x: 270, y: 365, w: 125, h: 210, type: "bookshelf" },
  { x: 470, y: 420, w: 220, h: 125, type: "desk" },
  { x: 805, y: 360, w: 88, h: 88, type: "plant" },
  { x: 930, y: 500, w: 120, h: 94, type: "laundry" },
  { x: 610, y: 605, w: 210, h: 74, type: "bench" }
];

const gardenObstacles = [
  { x: 115, y: 100, w: 160, h: 88, type: "bush" },
  { x: 940, y: 108, w: 160, h: 88, type: "bush" },
  { x: 820, y: 250, w: 140, h: 95, type: "pond" },
  { x: 300, y: 510, w: 170, h: 80, type: "flowers" },
  { x: 820, y: 585, w: 200, h: 72, type: "crate" },
  { x: 110, y: 620, w: 80, h: 110, type: "mailbox" }
];

const neighborhoodObstacles = [
  { x: 80, y: 120, w: 250, h: 78, type: "hedge" },
  { x: 865, y: 120, w: 250, h: 78, type: "hedge" },
  { x: 340, y: 245, w: 92, h: 210, type: "mailstack" },
  { x: 720, y: 255, w: 150, h: 86, type: "bike" },
  { x: 205, y: 560, w: 250, h: 74, type: "bench" },
  { x: 905, y: 560, w: 170, h: 92, type: "cart" }
];

const scareSpots = [
  { x: 735, y: 540, r: 26, type: "cat", triggered: false, timer: 0 },
  { x: 420, y: 655, r: 15, type: "mouse", triggered: false, timer: 0 },
  { x: 900, y: 245, r: 20, type: "duck", triggered: false, timer: 0 }
];

const storyScripts = {
  houseExit: [
    { speaker: "Hund", text: "Hæ?" },
    { speaker: "Hund", text: "Hvor er jeg nå?" },
    { speaker: "Hund", text: "Jeg vet at jeg er en hund..." },
    { speaker: "Hund", text: "Men jeg husker ikke hvem jeg er." },
    { speaker: "Hund", text: "Jeg må finne et spor." }
  ],
  collarFound: [
    { speaker: "Hund", text: "Vent litt... et halsbånd!" },
    { speaker: "Hund", text: "Dette lukter kjent." },
    { speaker: "Hund", text: "Betyr det at jeg bor i nærheten?" },
    { speaker: "Hund", text: "Kanskje noen her ute vet hvem jeg er." }
  ],
  catMeeting: [
    { speaker: "Katt", text: "Der er du jo." },
    { speaker: "Hund", text: "Kjenner du meg?" },
    { speaker: "Katt", text: "Kanskje. Du pleide å rote mindre enn dette." },
    { speaker: "Hund", text: "Jeg husker ingenting." },
    { speaker: "Katt", text: "Finn porten i hekken. Der ute ligger neste spor." }
  ],
  neighborhoodEnter: [
    { speaker: "Hund", text: "Dette stedet lukter enda mer kjent." },
    { speaker: "Hund", text: "Noen her må vite noe om meg." }
  ],
  tagFound: [
    { speaker: "Hund", text: "Oi! Det står noe her..." },
    { speaker: "Hund", text: "Milo? Er det meg?" },
    { speaker: "Hund", text: "Milo... ja. Det kjennes riktig!" }
  ],
  mouseMeeting: [
    { speaker: "Mus", text: "Du er Milo! Jeg så deg løpe forbi tidligere!" },
    { speaker: "Hund", text: "Vet du hvor jeg var på vei?" },
    { speaker: "Mus", text: "Mot parken, med noe rødt flagrende bak deg." },
    { speaker: "Hund", text: "Da må jeg til parken!" }
  ],
  parkIntro: [
    { speaker: "Hund", text: "Parken! Nå kommer jeg nærmere." },
    { speaker: "Hund", text: "Her lukter det både pølser, gress og... bursdag?" },
    { speaker: "Hund", text: "Jeg må lete etter flere spor." }
  ],
  ribbonFound: [
    { speaker: "Hund", text: "En rød sløyfe!" },
    { speaker: "Hund", text: "Var det dette musa mente?" },
    { speaker: "Hund", text: "Jeg husker glimt av ballonger og latter." }
  ],
  duckMeeting: [
    { speaker: "And", text: "Kvakk! Milo, endelig!" },
    { speaker: "Hund", text: "Du kjenner meg også?" },
    { speaker: "And", text: "Selvsagt. Følg stien til lysthuset." },
    { speaker: "And", text: "Noen venter på deg der." }
  ],
  gazeboIntro: [
    { speaker: "Hund", text: "Et lysthus... og masse pynt!" },
    { speaker: "Hund", text: "Vent... nå husker jeg!" },
    { speaker: "Hund", text: "Det er min bursdagsfest!" }
  ]
};
const state = {
  stage: "blanket",
  player: { x: 320, y: 320, r: 18, speed: 3.45 },
  blanketGap: { x: 650, y: 250, w: 95, h: 110 },
  houseGoal: { x: 1120, y: 270, w: 58, h: 180 },
  gardenGoal: { x: 1088, y: 310, w: 74, h: 152 },
  neighborhoodGoal: { x: 1108, y: 300, w: 64, h: 180 },
  parkGoal: { x: 1010, y: 96, w: 140, h: 96 },
  sniffPulse: 0,
  scarePulse: 0,
  dialog: { active: false, key: null, index: 0, onFinish: null },
  garden: {
    collar: { x: 270, y: 262, r: 24, found: false },
    cat: { x: 905, y: 508, r: 28, met: false },
    nextGateOpen: false
  },
  neighborhood: {
    tag: { x: 505, y: 175, r: 20, found: false },
    mouse: { x: 770, y: 470, r: 18, met: false },
    parkOpen: false
  },
  park: {
    ribbon: { x: 286, y: 540, r: 22, found: false },
    duck: { x: 808, y: 410, r: 24, met: false },
    gazeboOpen: false
  }
};
function updateSoundButton() {
  soundButton.textContent = audioState.enabled ? "Lyd: På" : "Lyd: Av";
}

function ensureAudioContext() {
  if (!audioState.enabled) return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioState.ctx) {
    audioState.ctx = new AudioCtx();
  }
  if (audioState.ctx.state === "suspended") {
    audioState.ctx.resume();
  }
  return audioState.ctx;
}

function playTone(freq, duration, volume, type, slideTo) {
  const audio = ensureAudioContext();
  if (!audio) return;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  }
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playSound(name) {
  if (!audioState.enabled) return;
  if (name === "sniff") {
    playTone(540, 0.08, 0.04, "triangle", 620);
    setTimeout(() => playTone(680, 0.07, 0.035, "triangle", 760), 50);
    return;
  }
  if (name === "scare") {
    playTone(180, 0.09, 0.05, "square", 130);
    setTimeout(() => playTone(260, 0.07, 0.04, "square", 210), 60);
    return;
  }
  if (name === "memory") {
    playTone(740, 0.12, 0.045, "triangle", 880);
    setTimeout(() => playTone(980, 0.16, 0.04, "triangle", 1170), 70);
    return;
  }
  if (name === "dialog") {
    playTone(420, 0.05, 0.025, "sine", 460);
    return;
  }
  if (name === "gate") {
    playTone(320, 0.1, 0.045, "sawtooth", 280);
    setTimeout(() => playTone(480, 0.11, 0.03, "triangle", 560), 90);
    return;
  }
  if (name === "name") {
    playTone(520, 0.1, 0.04, "triangle", 620);
    setTimeout(() => playTone(660, 0.12, 0.04, "triangle", 820), 90);
    return;
  }
  if (name === "win") {
    playTone(520, 0.12, 0.045, "triangle", 660);
    setTimeout(() => playTone(660, 0.12, 0.04, "triangle", 820), 120);
    setTimeout(() => playTone(880, 0.18, 0.04, "triangle", 1040), 240);
  }
}

function resetPointer() {
  pointer.active = false;
  pointer.pointerId = null;
  pointer.touchId = null;
  pointer.usingTouchEvents = false;
}

function renderJoystick() {
  joystickKnob.style.transform = `translate(calc(-50% + ${joystick.dx}px), calc(-50% + ${joystick.dy}px))`;
}

function resetJoystick() {
  joystick.active = false;
  joystick.pointerId = null;
  joystick.touchId = null;
  joystick.dx = 0;
  joystick.dy = 0;
  renderJoystick();
}

function resetInput() {
  resetPointer();
  resetJoystick();
}

function resetScares() {
  for (const scare of scareSpots) {
    scare.triggered = false;
    scare.timer = 0;
  }
}

function resetStory() {
  state.dialog.active = false;
  state.dialog.key = null;
  state.dialog.index = 0;
  state.dialog.onFinish = null;
  storyPanel.classList.add("hidden");
}

function beginStory(key, onFinish) {
  state.dialog.active = true;
  state.dialog.key = key;
  state.dialog.index = 0;
  state.dialog.onFinish = onFinish || null;
  playSound("dialog");
  renderStoryLine();
}

function renderStoryLine() {
  const script = storyScripts[state.dialog.key];
  if (!script) return;
  const line = script[state.dialog.index];
  storySpeaker.textContent = line.speaker;
  storyText.textContent = line.text;
  storyPanel.classList.remove("hidden");
}

function advanceStory() {
  if (!state.dialog.active) return;
  const script = storyScripts[state.dialog.key];
  state.dialog.index += 1;
  if (state.dialog.index >= script.length) {
    const onFinish = state.dialog.onFinish;
    resetStory();
    if (onFinish) onFinish();
    return;
  }
  playSound("dialog");
  renderStoryLine();
}

function resetGame() {
  state.stage = "blanket";
  state.player.x = 320;
  state.player.y = 320;
  state.sniffPulse = 0;
  state.scarePulse = 0;
  state.garden.collar.found = false;
  state.garden.cat.met = false;
  state.garden.nextGateOpen = false;
  state.neighborhood.tag.found = false;
  state.neighborhood.mouse.met = false;
  state.neighborhood.parkOpen = false;
  state.park.ribbon.found = false;
  state.park.duck.met = false;
  state.park.gazeboOpen = false;
  resetInput();
  resetScares();
  resetStory();
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function triggerSniff() {
  if (state.stage !== "blanket") {
    state.sniffPulse = 70;
    playSound("sniff");
  }
}

function getSniffTarget() {
  if (state.stage === "house") {
    return {
      x: state.houseGoal.x + state.houseGoal.w / 2,
      y: state.houseGoal.y + state.houseGoal.h / 2
    };
  }
  if (state.stage === "garden") {
    if (!state.garden.collar.found) {
      return { x: state.garden.collar.x, y: state.garden.collar.y };
    }
    if (!state.garden.cat.met) {
      return { x: state.garden.cat.x, y: state.garden.cat.y };
    }
    return {
      x: state.gardenGoal.x + state.gardenGoal.w / 2,
      y: state.gardenGoal.y + state.gardenGoal.h / 2
    };
  }
  if (state.stage === "neighborhood") {
    if (!state.neighborhood.tag.found) {
      return { x: state.neighborhood.tag.x, y: state.neighborhood.tag.y };
    }
    if (!state.neighborhood.mouse.met) {
      return { x: state.neighborhood.mouse.x, y: state.neighborhood.mouse.y };
    }
    return {
      x: state.neighborhoodGoal.x + state.neighborhoodGoal.w / 2,
      y: state.neighborhoodGoal.y + state.neighborhoodGoal.h / 2
    };
  }
  if (state.stage === "park") {
    if (!state.park.ribbon.found) {
      return { x: state.park.ribbon.x, y: state.park.ribbon.y };
    }
    if (!state.park.duck.met) {
      return { x: state.park.duck.x, y: state.park.duck.y };
    }
    return {
      x: state.parkGoal.x + state.parkGoal.w / 2,
      y: state.parkGoal.y + state.parkGoal.h / 2
    };
  }
  return null;
}
function getCanvasPosition(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function beginPointer(clientX, clientY) {
  const pos = getCanvasPosition(clientX, clientY);
  pointer.active = true;
  pointer.x = pos.x;
  pointer.y = pos.y;
}

function updatePointer(clientX, clientY) {
  const pos = getCanvasPosition(clientX, clientY);
  pointer.x = pos.x;
  pointer.y = pos.y;
}

function updateJoystickFromClient(clientX, clientY) {
  const rect = joystickBase.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  let dx = clientX - centerX;
  let dy = clientY - centerY;
  const length = Math.hypot(dx, dy);
  const maxRadius = Math.min(rect.width, rect.height) * 0.34;
  joystick.maxRadius = maxRadius;

  if (length > maxRadius && length > 0) {
    dx = (dx / length) * maxRadius;
    dy = (dy / length) * maxRadius;
  }

  joystick.dx = dx;
  joystick.dy = dy;
  renderJoystick();
}

function getMovementVector() {
  let dx = 0;
  let dy = 0;

  if (keys.has("arrowup") || keys.has("w")) dy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) dy += 1;
  if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d")) dx += 1;

  if (joystick.active && joystick.maxRadius > 0) {
    dx += joystick.dx / joystick.maxRadius;
    dy += joystick.dy / joystick.maxRadius;
  }

  if (pointer.active) {
    dx += (pointer.x - state.player.x) / 90;
    dy += (pointer.y - state.player.y) / 90;
  }

  return { dx, dy };
}

function getMovementSpeed() {
  let speed = state.player.speed;

  if (joystick.active && joystick.maxRadius > 0) {
    const power = Math.hypot(joystick.dx, joystick.dy) / joystick.maxRadius;
    speed *= Math.min(1.4, Math.max(0.38, power));
  } else if (pointer.active) {
    const distance = Math.hypot(pointer.x - state.player.x, pointer.y - state.player.y);
    speed *= Math.min(1.45, Math.max(0.3, distance / 70));
  }

  return speed;
}

function updateScares() {
  if (state.stage !== "house") return;

  for (const scare of scareSpots) {
    if (scare.timer > 0) scare.timer -= 1;

    const dx = state.player.x - scare.x;
    const dy = state.player.y - scare.y;
    const distance = Math.hypot(dx, dy);

    if (!scare.triggered && distance < scare.r + 42) {
      scare.triggered = true;
      scare.timer = 54;
      state.scarePulse = 10;
      playSound("scare");
      const length = distance || 1;
      state.player.x = clamp(state.player.x + (dx / length) * 28, 24, canvas.width - 24);
      state.player.y = clamp(state.player.y + (dy / length) * 28, 24, canvas.height - 24);
    }
  }

  if (state.scarePulse > 0) state.scarePulse -= 1;
}

function movePlayer() {
  if (state.dialog.active) return;

  const movement = getMovementVector();
  let dx = movement.dx;
  let dy = movement.dy;

  if (Math.abs(dx) < 0.04 && Math.abs(dy) < 0.04) {
    updateScares();
    return;
  }

  const length = Math.hypot(dx, dy) || 1;
  const speed = getMovementSpeed();
  dx = (dx / length) * speed;
  dy = (dy / length) * speed;

  const next = {
    x: clamp(state.player.x + dx, 24, canvas.width - 24),
    y: clamp(state.player.y + dy, 24, canvas.height - 24)
  };

  if (state.stage === "blanket") {
    const insideBlanket = Math.hypot(next.x - 450, next.y - 300) < 225;
    const insideGap =
      next.x > state.blanketGap.x &&
      next.x < state.blanketGap.x + state.blanketGap.w &&
      next.y > state.blanketGap.y &&
      next.y < state.blanketGap.y + state.blanketGap.h;
    const outsideAfterGap =
      next.x >= state.blanketGap.x + state.blanketGap.w &&
      next.y > state.blanketGap.y &&
      next.y < state.blanketGap.y + state.blanketGap.h;

    if (insideBlanket || insideGap || outsideAfterGap) {
      state.player.x = next.x;
      state.player.y = next.y;
    }

    if (state.player.x > 780) {
      state.stage = "house";
      state.player.x = 95;
      state.player.y = 705;
      resetScares();
      playSound("gate");
    }
    return;
  }

  if (state.stage === "house") {
    const playerRect = {
      x: next.x - state.player.r,
      y: next.y - state.player.r,
      w: state.player.r * 2,
      h: state.player.r * 2
    };

    const blocked = houseFurniture.some((item) => rectsOverlap(playerRect, item));
    if (!blocked) {
      state.player.x = next.x;
      state.player.y = next.y;
    }

    updateScares();

    if (rectsOverlap(playerRect, state.houseGoal)) {
      playSound("gate");
      beginStory("houseExit", () => {
        state.stage = "garden";
        state.player.x = 232;
        state.player.y = 700;
      });
    }
    return;
  }

  if (state.stage === "garden") {
    const playerRect = {
      x: next.x - state.player.r,
      y: next.y - state.player.r,
      w: state.player.r * 2,
      h: state.player.r * 2
    };

    const blocked = gardenObstacles.some((item) => rectsOverlap(playerRect, item));
    if (!blocked) {
      state.player.x = next.x;
      state.player.y = next.y;
    }

    const collarDistance = Math.hypot(state.player.x - state.garden.collar.x, state.player.y - state.garden.collar.y);
    if (!state.garden.collar.found && collarDistance < 34) {
      state.garden.collar.found = true;
      playSound("memory");
      beginStory("collarFound");
    }

    const catDistance = Math.hypot(state.player.x - state.garden.cat.x, state.player.y - state.garden.cat.y);
    if (state.garden.collar.found && !state.garden.cat.met && catDistance < 54) {
      state.garden.cat.met = true;
      playSound("dialog");
      beginStory("catMeeting", () => {
        state.garden.nextGateOpen = true;
      });
    }

    if (state.garden.nextGateOpen && rectsOverlap(playerRect, state.gardenGoal)) {
      playSound("gate");
      beginStory("neighborhoodEnter", () => {
        state.stage = "neighborhood";
        state.player.x = 118;
        state.player.y = 702;
      });
    }
    return;
  }

  if (state.stage === "neighborhood") {
    const playerRect = {
      x: next.x - state.player.r,
      y: next.y - state.player.r,
      w: state.player.r * 2,
      h: state.player.r * 2
    };

    const blocked = neighborhoodObstacles.some((item) => rectsOverlap(playerRect, item));
    if (!blocked) {
      state.player.x = next.x;
      state.player.y = next.y;
    }

    const tagDistance = Math.hypot(state.player.x - state.neighborhood.tag.x, state.player.y - state.neighborhood.tag.y);
    if (!state.neighborhood.tag.found && tagDistance < 34) {
      state.neighborhood.tag.found = true;
      playSound("name");
      beginStory("tagFound");
    }

    const mouseDistance = Math.hypot(state.player.x - state.neighborhood.mouse.x, state.player.y - state.neighborhood.mouse.y);
    if (state.neighborhood.tag.found && !state.neighborhood.mouse.met && mouseDistance < 38) {
      state.neighborhood.mouse.met = true;
      playSound("dialog");
      beginStory("mouseMeeting", () => {
        state.neighborhood.parkOpen = true;
      });
    }

    if (state.neighborhood.parkOpen && rectsOverlap(playerRect, state.neighborhoodGoal)) {
      playSound("gate");
      beginStory("parkIntro", () => {
        state.stage = "park";
        state.player.x = 122;
        state.player.y = 660;
      });
    }
    return;
  }

  if (state.stage === "park") {
    const playerRect = {
      x: next.x - state.player.r,
      y: next.y - state.player.r,
      w: state.player.r * 2,
      h: state.player.r * 2
    };

    const parkObstacles = [
      { x: 145, y: 112, w: 168, h: 118 },
      { x: 432, y: 220, w: 156, h: 74 },
      { x: 640, y: 130, w: 150, h: 110 },
      { x: 884, y: 470, w: 150, h: 94 }
    ];

    const blocked = parkObstacles.some((item) => rectsOverlap(playerRect, item));
    if (!blocked) {
      state.player.x = next.x;
      state.player.y = next.y;
    }

    const ribbonDistance = Math.hypot(state.player.x - state.park.ribbon.x, state.player.y - state.park.ribbon.y);
    if (!state.park.ribbon.found && ribbonDistance < 34) {
      state.park.ribbon.found = true;
      playSound("memory");
      beginStory("ribbonFound");
    }

    const duckDistance = Math.hypot(state.player.x - state.park.duck.x, state.player.y - state.park.duck.y);
    if (state.park.ribbon.found && !state.park.duck.met && duckDistance < 46) {
      state.park.duck.met = true;
      playSound("dialog");
      beginStory("duckMeeting", () => {
        state.park.gazeboOpen = true;
      });
    }

    if (state.park.gazeboOpen && rectsOverlap(playerRect, state.parkGoal)) {
      playSound("gate");
      beginStory("gazeboIntro", () => {
        state.stage = "win";
        playSound("win");
      });
    }
    return;
  }
}
function drawBlanketStage() {
  ctx.fillStyle = "#f6efe7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ebe2d2";
  ctx.fillRect(0, 545, canvas.width, 255);
  ctx.fillStyle = "#cf7b5c";
  ctx.beginPath();
  ctx.ellipse(480, 360, 300, 260, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e5ae8d";
  ctx.beginPath();
  ctx.ellipse(440, 360, 248, 215, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d98c69";
  ctx.beginPath();
  ctx.ellipse(575, 368, 176, 112, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff4df";
  ctx.fillRect(state.blanketGap.x, state.blanketGap.y, state.blanketGap.w, state.blanketGap.h);
}

function drawSofa(item) {
  ctx.fillStyle = "#cc7852";
  ctx.fillRect(item.x, item.y + 34, item.w, item.h - 34);
  ctx.fillStyle = "#dd9267";
  ctx.fillRect(item.x + 18, item.y + 16, item.w - 36, 44);
  ctx.fillRect(item.x + 30, item.y + 58, 58, 42);
  ctx.fillRect(item.x + 160, item.y + 58, 58, 42);
}

function drawTable(item) {
  ctx.fillStyle = "#93633d";
  ctx.fillRect(item.x + 12, item.y + 8, item.w - 24, item.h - 16);
  ctx.fillStyle = "#6f472b";
  ctx.fillRect(item.x + 24, item.y + 95, 14, 28);
  ctx.fillRect(item.x + item.w - 38, item.y + 95, 14, 28);
}

function drawChair(item) {
  ctx.fillStyle = "#8b5d3f";
  ctx.fillRect(item.x + 6, item.y + 12, item.w - 12, item.h - 12);
  ctx.fillRect(item.x + 12, item.y, item.w - 24, 16);
}

function drawBed(item) {
  ctx.fillStyle = "#b98453";
  ctx.fillRect(item.x, item.y + 18, item.w, item.h - 18);
  ctx.fillStyle = "#f0e7d4";
  ctx.fillRect(item.x + 20, item.y + 24, item.w - 40, item.h - 42);
  ctx.fillStyle = "#d6a1a1";
  ctx.fillRect(item.x + 20, item.y + 24, 60, 32);
}

function drawCabinet(item) {
  ctx.fillStyle = "#825736";
  ctx.fillRect(item.x, item.y, item.w, item.h);
  ctx.fillStyle = "#a2744c";
  ctx.fillRect(item.x + 10, item.y + 12, item.w - 20, item.h - 24);
  ctx.fillStyle = "#f0d4a0";
  ctx.fillRect(item.x + 20, item.y + 78, 8, 8);
  ctx.fillRect(item.x + item.w - 28, item.y + 78, 8, 8);
}

function drawBookshelf(item) {
  ctx.fillStyle = "#7b5335";
  ctx.fillRect(item.x, item.y, item.w, item.h);
  ctx.fillStyle = "#5c3a24";
  ctx.fillRect(item.x + 12, item.y + 56, item.w - 24, 8);
  ctx.fillRect(item.x + 12, item.y + 116, item.w - 24, 8);
  ctx.fillRect(item.x + 12, item.y + 176, item.w - 24, 8);
}

function drawDesk(item) {
  ctx.fillStyle = "#8e613e";
  ctx.fillRect(item.x, item.y + 16, item.w, item.h - 16);
  ctx.fillStyle = "#f0d9ad";
  ctx.fillRect(item.x + 24, item.y + 34, 76, 44);
  ctx.fillStyle = "#6b8cb3";
  ctx.fillRect(item.x + 126, item.y + 30, 48, 32);
}

function drawPlant(item) {
  ctx.fillStyle = "#92623e";
  ctx.fillRect(item.x + 18, item.y + 50, item.w - 36, item.h - 50);
  ctx.fillStyle = "#6e974e";
  ctx.beginPath();
  ctx.arc(item.x + item.w / 2, item.y + 36, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(item.x + 26, item.y + 44, 20, 0, Math.PI * 2);
  ctx.arc(item.x + item.w - 26, item.y + 44, 20, 0, Math.PI * 2);
  ctx.fill();
}

function drawLaundry(item) {
  ctx.fillStyle = "#b08a72";
  ctx.fillRect(item.x, item.y + 14, item.w, item.h - 14);
  ctx.fillStyle = "#e7d7bc";
  ctx.fillRect(item.x + 16, item.y, item.w - 32, 30);
}

function drawBench(item) {
  ctx.fillStyle = "#88613e";
  ctx.fillRect(item.x, item.y + 12, item.w, item.h - 12);
}

function drawFurniture(item) {
  if (item.type === "sofa") return drawSofa(item);
  if (item.type === "table") return drawTable(item);
  if (item.type === "chair") return drawChair(item);
  if (item.type === "bed") return drawBed(item);
  if (item.type === "cabinet") return drawCabinet(item);
  if (item.type === "bookshelf") return drawBookshelf(item);
  if (item.type === "desk") return drawDesk(item);
  if (item.type === "plant") return drawPlant(item);
  if (item.type === "laundry") return drawLaundry(item);
  if (item.type === "bench") return drawBench(item);
}

function drawCritter(scare) {
  ctx.save();
  ctx.translate(scare.x, scare.y);

  if (scare.type === "cat") {
    ctx.fillStyle = scare.timer > 0 ? "#2d2b33" : "#4b4954";
    ctx.beginPath();
    ctx.arc(0, 6, 23, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-18, -6);
    ctx.lineTo(-8, -26);
    ctx.lineTo(0, -8);
    ctx.moveTo(18, -6);
    ctx.lineTo(8, -26);
    ctx.lineTo(0, -8);
    ctx.fill();
  } else if (scare.type === "mouse") {
    ctx.fillStyle = scare.timer > 0 ? "#7f7f87" : "#94949b";
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c8898b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(12, 3);
    ctx.quadraticCurveTo(28, 8, 34, 18);
    ctx.stroke();
  } else if (scare.type === "duck") {
    ctx.fillStyle = scare.timer > 0 ? "#f2cc3f" : "#e8b832";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  if (scare.timer > 0) {
    ctx.strokeStyle = "rgba(255, 248, 190, 0.95)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-30, -34);
    ctx.lineTo(-18, -48);
    ctx.lineTo(-8, -34);
    ctx.moveTo(2, -36);
    ctx.lineTo(12, -50);
    ctx.lineTo(22, -36);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHouseStage() {
  ctx.fillStyle = "#e8d7bf";
  ctx.fillRect(0, 0, canvas.width, 610);
  ctx.fillStyle = "#c89568";
  ctx.fillRect(0, 610, canvas.width, 190);
  ctx.fillStyle = "#b75a37";
  ctx.fillRect(1090, 250, 92, 220);
  ctx.fillStyle = "#f1dcb8";
  ctx.fillRect(1106, 268, 58, 182);
  for (const item of houseFurniture) drawFurniture(item);
  for (const scare of scareSpots) drawCritter(scare);
}

function drawGardenObstacle(item) {
  if (item.type === "bush") {
    ctx.fillStyle = "#648e48";
    ctx.beginPath();
    ctx.arc(item.x + 28, item.y + 46, 34, 0, Math.PI * 2);
    ctx.arc(item.x + 80, item.y + 32, 36, 0, Math.PI * 2);
    ctx.arc(item.x + 124, item.y + 52, 30, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.type === "pond") {
    ctx.fillStyle = "#84c3d9";
    ctx.beginPath();
    ctx.ellipse(item.x + item.w / 2, item.y + item.h / 2, item.w / 2, item.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.type === "flowers") {
    ctx.fillStyle = "#7aa958";
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.fillStyle = "#e56d73";
    ctx.beginPath();
    ctx.arc(item.x + 34, item.y + 24, 10, 0, Math.PI * 2);
    ctx.arc(item.x + 74, item.y + 42, 10, 0, Math.PI * 2);
    ctx.arc(item.x + 122, item.y + 28, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.type === "crate") {
    ctx.fillStyle = "#9a6c45";
    ctx.fillRect(item.x, item.y, item.w, item.h);
  } else if (item.type === "mailbox") {
    ctx.fillStyle = "#8b5e3c";
    ctx.fillRect(item.x + 24, item.y + 20, 18, item.h - 20);
    ctx.fillStyle = "#d45545";
    ctx.fillRect(item.x, item.y, item.w, 52);
  }
}

function drawGardenStage() {
  ctx.fillStyle = "#a7d27f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#d9bf8c";
  ctx.fillRect(94, 628, 1020, 78);
  ctx.fillRect(286, 250, 104, 420);
  ctx.fillRect(286, 250, 452, 82);
  ctx.fillRect(736, 250, 74, 192);
  ctx.fillRect(810, 360, 272, 82);
  ctx.fillRect(1048, 360, 68, 140);

  ctx.fillStyle = "#5f8b42";
  ctx.fillRect(0, 0, canvas.width, 42);
  ctx.fillRect(0, 0, 42, canvas.height);
  ctx.fillRect(canvas.width - 42, 0, 42, canvas.height);
  ctx.fillRect(0, canvas.height - 42, canvas.width, 42);

  for (const item of gardenObstacles) drawGardenObstacle(item);

  if (!state.garden.collar.found) {
    ctx.save();
    ctx.translate(state.garden.collar.x, state.garden.collar.y);
    ctx.strokeStyle = "#d69239";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0.4, Math.PI * 2 - 0.4);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(state.garden.cat.x, state.garden.cat.y);
  ctx.fillStyle = state.garden.cat.met ? "#3a3a43" : "#565660";
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-18, -8);
  ctx.lineTo(-8, -26);
  ctx.lineTo(0, -8);
  ctx.moveTo(18, -8);
  ctx.lineTo(8, -26);
  ctx.lineTo(0, -8);
  ctx.fill();
  ctx.restore();

  if (state.garden.nextGateOpen) {
    ctx.fillStyle = "#8e4f2e";
    ctx.fillRect(state.gardenGoal.x, state.gardenGoal.y, state.gardenGoal.w, state.gardenGoal.h);
  }
}

function drawNeighborhoodObstacle(item) {
  if (item.type === "hedge") {
    ctx.fillStyle = "#5e8a44";
    ctx.fillRect(item.x, item.y, item.w, item.h);
  } else if (item.type === "mailstack") {
    ctx.fillStyle = "#c84f46";
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.fillStyle = "#8e3d37";
    ctx.fillRect(item.x + 22, item.y + 24, 16, item.h - 24);
    ctx.fillRect(item.x + 54, item.y + 24, 16, item.h - 24);
  } else if (item.type === "bike") {
    ctx.strokeStyle = "#375172";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(item.x + 28, item.y + 58, 24, 0, Math.PI * 2);
    ctx.arc(item.x + 112, item.y + 58, 24, 0, Math.PI * 2);
    ctx.moveTo(item.x + 28, item.y + 58);
    ctx.lineTo(item.x + 70, item.y + 20);
    ctx.lineTo(item.x + 112, item.y + 58);
    ctx.stroke();
  } else if (item.type === "bench") {
    ctx.fillStyle = "#8f623e";
    ctx.fillRect(item.x, item.y, item.w, item.h);
  } else if (item.type === "cart") {
    ctx.fillStyle = "#cc9a61";
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.fillStyle = "#9c6d44";
    ctx.fillRect(item.x + 22, item.y + item.h - 8, item.w - 44, 12);
  }
}

function drawNeighborhoodStage() {
  ctx.fillStyle = "#99c3ef";
  ctx.fillRect(0, 0, canvas.width, 220);
  ctx.fillStyle = "#d7d9dc";
  ctx.fillRect(0, 220, canvas.width, 580);
  ctx.fillStyle = "#4e6e3f";
  ctx.fillRect(0, 0, canvas.width, 38);
  ctx.fillStyle = "#b89d7a";
  ctx.fillRect(70, 615, 1060, 95);
  ctx.fillStyle = "#f0e5d2";
  ctx.fillRect(120, 80, 210, 120);
  ctx.fillRect(865, 80, 230, 130);
  ctx.fillStyle = "#c15942";
  ctx.fillRect(1130, 275, 52, 220);
  ctx.fillStyle = "#f5dec2";
  ctx.fillRect(1140, 290, 30, 190);

  for (const item of neighborhoodObstacles) drawNeighborhoodObstacle(item);

  if (!state.neighborhood.tag.found) {
    ctx.save();
    ctx.translate(state.neighborhood.tag.x, state.neighborhood.tag.y);
    ctx.fillStyle = "#e4c368";
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7f5f25";
    ctx.fillRect(-2, -6, 4, 12);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(state.neighborhood.mouse.x, state.neighborhood.mouse.y);
  ctx.fillStyle = state.neighborhood.mouse.met ? "#72757c" : "#8a8e95";
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (state.neighborhood.parkOpen) {
    ctx.fillStyle = "#7b4d2c";
    ctx.fillRect(state.neighborhoodGoal.x, state.neighborhoodGoal.y, state.neighborhoodGoal.w, state.neighborhoodGoal.h);
    ctx.fillStyle = "rgba(255, 238, 190, 0.45)";
    ctx.fillRect(state.neighborhoodGoal.x + 10, state.neighborhoodGoal.y + 16, state.neighborhoodGoal.w - 20, state.neighborhoodGoal.h - 32);
  }
}

function drawParkStage() {
  ctx.fillStyle = "#92c7f2";
  ctx.fillRect(0, 0, canvas.width, 230);
  ctx.fillStyle = "#90c86f";
  ctx.fillRect(0, 230, canvas.width, 570);

  ctx.fillStyle = "#d1b27b";
  ctx.fillRect(90, 650, 1020, 78);
  ctx.fillRect(240, 520, 240, 60);
  ctx.fillRect(480, 430, 210, 54);
  ctx.fillRect(690, 315, 210, 54);
  ctx.fillRect(900, 185, 160, 54);

  ctx.fillStyle = "#5d9141";
  ctx.beginPath();
  ctx.arc(220, 170, 76, 0, Math.PI * 2);
  ctx.arc(700, 160, 70, 0, Math.PI * 2);
  ctx.arc(980, 520, 66, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8f623e";
  ctx.fillRect(430, 220, 156, 74);
  ctx.fillRect(640, 130, 150, 110);
  ctx.fillRect(884, 470, 150, 94);

  if (!state.park.ribbon.found) {
    ctx.save();
    ctx.translate(state.park.ribbon.x, state.park.ribbon.y);
    ctx.fillStyle = "#df4343";
    ctx.beginPath();
    ctx.arc(-8, 0, 10, 0, Math.PI * 2);
    ctx.arc(8, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-3, 0, 6, 18);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(state.park.duck.x, state.park.duck.y);
  ctx.fillStyle = state.park.duck.met ? "#f1cf53" : "#e5bb2f";
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#de8a30";
  ctx.fillRect(12, -4, 12, 8);
  ctx.restore();

  if (state.park.gazeboOpen) {
    ctx.fillStyle = "#f5e6cc";
    ctx.fillRect(state.parkGoal.x, state.parkGoal.y, state.parkGoal.w, state.parkGoal.h);
    ctx.fillStyle = "#b15b45";
    ctx.beginPath();
    ctx.moveTo(state.parkGoal.x - 10, state.parkGoal.y + 18);
    ctx.lineTo(state.parkGoal.x + state.parkGoal.w / 2, state.parkGoal.y - 26);
    ctx.lineTo(state.parkGoal.x + state.parkGoal.w + 10, state.parkGoal.y + 18);
    ctx.closePath();
    ctx.fill();
  }
}
function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.stage === "blanket") return drawBlanketStage();
  if (state.stage === "house") return drawHouseStage();
  if (state.stage === "garden") return drawGardenStage();
  if (state.stage === "neighborhood") return drawNeighborhoodStage();
  if (state.stage === "park") return drawParkStage();
  return drawParkStage();
}
function drawDog() {
  const { x, y, r } = state.player;
  ctx.save();
  ctx.translate(x, y);
  if (state.scarePulse > 0) ctx.rotate(Math.sin(state.scarePulse * 0.9) * 0.12);
  ctx.fillStyle = "#b47647";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-11, -14, 6, 12, -0.5, 0, Math.PI * 2);
  ctx.ellipse(11, -14, 6, 12, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#24170e";
  ctx.beginPath();
  ctx.arc(-6, -4, 2.5, 0, Math.PI * 2);
  ctx.arc(6, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  if (state.stage === "blanket") {
    ctx.strokeStyle = "#f5dfca";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r + 8, 0.5, 5.4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSniffCue() {
  const target = getSniffTarget();
  if (!target || state.sniffPulse <= 0 || state.dialog.active) return;
  const dx = target.x - state.player.x;
  const dy = target.y - state.player.y;
  const angle = Math.atan2(dy, dx);
  ctx.save();
  ctx.translate(state.player.x, state.player.y);
  ctx.rotate(angle);
  ctx.strokeStyle = `rgba(255, 255, 210, ${Math.min(0.95, state.sniffPulse / 70)})`;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(110, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(110, 0);
  ctx.lineTo(88, -14);
  ctx.moveTo(110, 0);
  ctx.lineTo(88, 14);
  ctx.stroke();
  ctx.restore();
}

function drawFog() {
  if (state.stage !== "house") return;
  const visibleRadius = 210;
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.arc(state.player.x, state.player.y, visibleRadius, 0, Math.PI * 2, true);
  ctx.fill("evenodd");
  ctx.restore();
}

function drawWinOverlay() {
  if (state.stage !== "win") return;
  ctx.save();
  ctx.fillStyle = "rgba(255, 248, 224, 0.32)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff4dd";
  ctx.fillRect(340, 180, 520, 240);
  ctx.fillStyle = "#c75f45";
  ctx.font = "bold 46px Georgia";
  ctx.textAlign = "center";
  ctx.fillText("Milo husket alt!", canvas.width / 2, 250);
  ctx.fillStyle = "#5b432f";
  ctx.font = "28px Georgia";
  ctx.fillText("Vennene ventet på bursdagsfest i parken.", canvas.width / 2, 310);
  ctx.fillText("Trykk Start på nytt for å spille igjen.", canvas.width / 2, 355);
  ctx.restore();
}
function tick() {
  movePlayer();
  if (state.sniffPulse > 0) state.sniffPulse -= 1;
  drawBackground();
  drawFog();
  drawDog();
  drawSniffCue();
  drawWinOverlay();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " ", "enter"].includes(key)) {
    event.preventDefault();
  }
  if ((key === "enter" || key === " ") && state.dialog.active) {
    advanceStory();
    return;
  }
  if (key === " ") {
    triggerSniff();
    return;
  }
  keys.add(key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener("blur", () => {
  keys.clear();
  resetInput();
});

canvas.addEventListener("pointerdown", (event) => {
  if (state.dialog.active) return;
  ensureAudioContext();
  event.preventDefault();
  pointer.usingTouchEvents = false;
  pointer.pointerId = event.pointerId;
  beginPointer(event.clientX, event.clientY);
  if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!pointer.active || pointer.usingTouchEvents) return;
  if (pointer.pointerId !== event.pointerId) return;
  event.preventDefault();
  updatePointer(event.clientX, event.clientY);
});

function endPointer(event) {
  if (pointer.pointerId !== event.pointerId) return;
  resetPointer();
}

canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);
canvas.addEventListener("pointerleave", (event) => {
  if (event.pointerType !== "mouse") return;
  endPointer(event);
});

canvas.addEventListener("touchstart", (event) => {
  if (state.dialog.active) return;
  ensureAudioContext();
  event.preventDefault();
  const touch = event.changedTouches[0];
  pointer.usingTouchEvents = true;
  pointer.touchId = touch.identifier;
  beginPointer(touch.clientX, touch.clientY);
}, { passive: false });

canvas.addEventListener("touchmove", (event) => {
  if (!pointer.active || pointer.touchId === null) return;
  const touch = Array.from(event.touches).find((item) => item.identifier === pointer.touchId);
  if (!touch) return;
  event.preventDefault();
  updatePointer(touch.clientX, touch.clientY);
}, { passive: false });

function endTouch(event) {
  if (pointer.touchId === null) return;
  const touch = Array.from(event.changedTouches).find((item) => item.identifier === pointer.touchId);
  if (!touch) return;
  event.preventDefault();
  resetPointer();
}

canvas.addEventListener("touchend", endTouch, { passive: false });
canvas.addEventListener("touchcancel", endTouch, { passive: false });

joystickBase.addEventListener("pointerdown", (event) => {
  if (state.dialog.active) return;
  ensureAudioContext();
  event.preventDefault();
  event.stopPropagation();
  joystick.active = true;
  joystick.pointerId = event.pointerId;
  updateJoystickFromClient(event.clientX, event.clientY);
  if (joystickBase.setPointerCapture) joystickBase.setPointerCapture(event.pointerId);
});

joystickBase.addEventListener("pointermove", (event) => {
  if (!joystick.active || joystick.pointerId !== event.pointerId) return;
  event.preventDefault();
  updateJoystickFromClient(event.clientX, event.clientY);
});

function endJoystickPointer(event) {
  if (joystick.pointerId !== event.pointerId) return;
  resetJoystick();
}

joystickBase.addEventListener("pointerup", endJoystickPointer);
joystickBase.addEventListener("pointercancel", endJoystickPointer);

joystickBase.addEventListener("touchstart", (event) => {
  if (state.dialog.active) return;
  ensureAudioContext();
  event.preventDefault();
  event.stopPropagation();
  const touch = event.changedTouches[0];
  joystick.active = true;
  joystick.touchId = touch.identifier;
  updateJoystickFromClient(touch.clientX, touch.clientY);
}, { passive: false });

joystickBase.addEventListener("touchmove", (event) => {
  if (!joystick.active || joystick.touchId === null) return;
  const touch = Array.from(event.touches).find((item) => item.identifier === joystick.touchId);
  if (!touch) return;
  event.preventDefault();
  updateJoystickFromClient(touch.clientX, touch.clientY);
}, { passive: false });

function endJoystickTouch(event) {
  if (joystick.touchId === null) return;
  const touch = Array.from(event.changedTouches).find((item) => item.identifier === joystick.touchId);
  if (!touch) return;
  event.preventDefault();
  resetJoystick();
}

joystickBase.addEventListener("touchend", endJoystickTouch, { passive: false });
joystickBase.addEventListener("touchcancel", endJoystickTouch, { passive: false });

storyNextButton.addEventListener("click", () => {
  ensureAudioContext();
  advanceStory();
});

soundButton.addEventListener("click", () => {
  audioState.enabled = !audioState.enabled;
  if (audioState.enabled) {
    ensureAudioContext();
    playTone(520, 0.08, 0.03, "triangle", 620);
  }
  updateSoundButton();
});

helpButton.addEventListener("click", () => {
  if (helpDialog.showModal) helpDialog.showModal();
});

helpDialog.addEventListener("click", (event) => {
  const rect = helpDialog.getBoundingClientRect();
  const inside =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;
  if (!inside) helpDialog.close();
});

restartButton.addEventListener("click", () => {
  ensureAudioContext();
  playTone(360, 0.08, 0.03, "sine", 300);
  resetGame();
});

sniffButton.addEventListener("click", () => {
  ensureAudioContext();
  triggerSniff();
});

updateSoundButton();
renderJoystick();
resetGame();
tick();






