const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const stageLabel = document.getElementById("stageLabel");
const message = document.getElementById("message");
const restartButton = document.getElementById("restartButton");
const sniffButton = document.getElementById("sniffButton");
const helpButton = document.getElementById("helpButton");
const helpDialog = document.getElementById("helpDialog");
const joystickBase = document.getElementById("joystickBase");
const joystickKnob = document.getElementById("joystickKnob");

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

const state = {
  stage: "blanket",
  player: { x: 320, y: 320, r: 18, speed: 3.2 },
  blanketGap: { x: 650, y: 250, w: 95, h: 110 },
  houseGoal: { x: 812, y: 250, w: 60, h: 120 },
  sniffPulse: 0,
  blanketSlowZones: [
    { x: 250, y: 190, w: 110, h: 120 },
    { x: 390, y: 120, w: 130, h: 90 },
    { x: 455, y: 340, w: 125, h: 100 }
  ],
  blanketBumpers: [
    { x: 360, y: 255, w: 130, h: 34 },
    { x: 505, y: 205, w: 32, h: 120 },
    { x: 560, y: 330, w: 95, h: 30 }
  ],
  obstacles: [
    { x: 180, y: 120, w: 90, h: 220, type: "chair" },
    { x: 420, y: 80, w: 160, h: 70, type: "table" },
    { x: 345, y: 250, w: 70, h: 200, type: "boots" },
    { x: 610, y: 360, w: 140, h: 75, type: "toy" },
    { x: 560, y: 190, w: 80, h: 90, type: "plant" }
  ]
};

function updateText(title, body) {
  stageLabel.textContent = title;
  message.textContent = body;
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

function resetGame() {
  state.stage = "blanket";
  state.player.x = 320;
  state.player.y = 320;
  state.sniffPulse = 0;
  resetInput();
  updateText(
    "Nivå 1: Kom deg ut av teppet",
    "Rull gjennom foldene, finn åpningen og kom deg løs."
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function triggerSniff() {
  if (state.stage === "house") state.sniffPulse = 70;
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

  if (state.stage === "blanket") {
    const slowZone = state.blanketSlowZones.some(
      (zone) =>
        state.player.x > zone.x &&
        state.player.x < zone.x + zone.w &&
        state.player.y > zone.y &&
        state.player.y < zone.y + zone.h
    );
    if (slowZone) speed *= 0.62;
  }

  if (joystick.active && joystick.maxRadius > 0) {
    const power = Math.hypot(joystick.dx, joystick.dy) / joystick.maxRadius;
    speed *= Math.min(1.4, Math.max(0.38, power));
  } else if (pointer.active) {
    const distance = Math.hypot(pointer.x - state.player.x, pointer.y - state.player.y);
    speed *= Math.min(1.45, Math.max(0.3, distance / 70));
  }

  return speed;
}

function movePlayer() {
  const movement = getMovementVector();
  let dx = movement.dx;
  let dy = movement.dy;

  if (Math.abs(dx) < 0.04 && Math.abs(dy) < 0.04) return;

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

    const nextRect = {
      x: next.x - state.player.r,
      y: next.y - state.player.r,
      w: state.player.r * 2,
      h: state.player.r * 2
    };

    const bumped = state.blanketBumpers.some((bumper) => rectsOverlap(nextRect, bumper));
    if ((insideBlanket || insideGap || outsideAfterGap) && !bumped) {
      state.player.x = next.x;
      state.player.y = next.y;
    }

    if (state.player.x > 780) {
      state.stage = "house";
      state.player.x = 100;
      state.player.y = 500;
      updateText(
        "Nivå 2: Tåkete hus",
        "Bruk joysticken eller dra på spillflaten. Det nære er synlig, og kanten fader ut i svart fog of war."
      );
    }

    return;
  }

  if (state.stage === "win") return;

  const playerRect = {
    x: next.x - state.player.r,
    y: next.y - state.player.r,
    w: state.player.r * 2,
    h: state.player.r * 2
  };

  const blocked = state.obstacles.some((obstacle) => rectsOverlap(playerRect, obstacle));
  if (!blocked) {
    state.player.x = next.x;
    state.player.y = next.y;
  }

  if (rectsOverlap(playerRect, state.houseGoal)) {
    state.stage = "win";
    updateText(
      "Du klarte det!",
      "Hunden fant veien ut av huset. Trykk Start på nytt for å spille igjen."
    );
  }
}

function drawBlanketStage() {
  ctx.fillStyle = "#f6efe7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ebe2d2";
  ctx.fillRect(0, 415, canvas.width, 185);

  ctx.fillStyle = "#cf7b5c";
  ctx.beginPath();
  ctx.ellipse(450, 300, 260, 220, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e5ae8d";
  ctx.beginPath();
  ctx.ellipse(420, 300, 215, 180, -0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d98c69";
  ctx.beginPath();
  ctx.ellipse(515, 305, 145, 95, 0.4, 0, Math.PI * 2);
  ctx.fill();

  for (const zone of state.blanketSlowZones) {
    ctx.fillStyle = "rgba(255, 244, 223, 0.42)";
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  }

  for (const bumper of state.blanketBumpers) {
    ctx.fillStyle = "#b05f42";
    ctx.fillRect(bumper.x, bumper.y, bumper.w, bumper.h);
  }

  ctx.fillStyle = "#fff4df";
  ctx.fillRect(state.blanketGap.x, state.blanketGap.y, state.blanketGap.w, state.blanketGap.h);

  ctx.fillStyle = "#8d3a22";
  ctx.font = "24px Georgia";
  ctx.fillText("Finn åpningen i teppet", 45, 52);
  ctx.font = "20px Georgia";
  ctx.fillText("Rull gjennom foldene uten å sette deg fast", 45, 82);
}

function drawHouseStage() {
  ctx.fillStyle = "#f3e6d4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#d9b892";
  ctx.fillRect(0, 470, canvas.width, 130);

  for (const obstacle of state.obstacles) {
    ctx.fillStyle = obstacle.type === "toy" ? "#d56f3e" : "#9b6a42";
    if (obstacle.type === "plant") ctx.fillStyle = "#7c9b52";
    if (obstacle.type === "boots") ctx.fillStyle = "#54413a";
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
  }

  ctx.fillStyle = "#9fd1cf";
  ctx.fillRect(state.houseGoal.x, state.houseGoal.y, state.houseGoal.w, state.houseGoal.h);
  ctx.fillStyle = "#295d66";
  ctx.font = "22px Georgia";
  ctx.fillText("Ut", state.houseGoal.x + 17, state.houseGoal.y + 68);

  ctx.fillStyle = "#8d3a22";
  ctx.fillText("Følg lukten og lydene mot døren", 36, 48);
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.stage === "blanket") {
    drawBlanketStage();
    return;
  }
  drawHouseStage();
}

function drawDog() {
  const { x, y, r } = state.player;
  ctx.save();
  ctx.translate(x, y);

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
  if (state.stage !== "house" || state.sniffPulse <= 0) return;

  const dx = state.houseGoal.x + state.houseGoal.w / 2 - state.player.x;
  const dy = state.houseGoal.y + state.houseGoal.h / 2 - state.player.y;
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(state.player.x, state.player.y);
  ctx.rotate(angle);
  ctx.strokeStyle = `rgba(255, 255, 210, ${Math.min(0.95, state.sniffPulse / 70)})`;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(94, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(94, 0);
  ctx.lineTo(76, -12);
  ctx.moveTo(94, 0);
  ctx.lineTo(76, 12);
  ctx.stroke();
  ctx.restore();
}

function drawFog() {
  if (state.stage !== "house") return;

  const clearRadius = 150;
  const fadeRadius = 280;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.96)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = "destination-out";
  const gradient = ctx.createRadialGradient(
    state.player.x,
    state.player.y,
    clearRadius,
    state.player.x,
    state.player.y,
    fadeRadius
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.72, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, fadeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPointerHint() {
  if (!pointer.active) return;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(state.player.x, state.player.y);
  ctx.lineTo(pointer.x, pointer.y);
  ctx.stroke();
  ctx.restore();
}

function drawWinOverlay() {
  if (state.stage !== "win") return;
  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 240, 0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#8d3a22";
  ctx.font = "bold 42px Georgia";
  ctx.textAlign = "center";
  ctx.fillText("Voff! Du fant veien ut!", canvas.width / 2, 190);
  ctx.font = "28px Georgia";
  ctx.fillText("Trykk Start på nytt for en ny runde.", canvas.width / 2, 242);
  ctx.restore();
}

function tick() {
  movePlayer();
  if (state.sniffPulse > 0) state.sniffPulse -= 1;

  drawBackground();
  drawFog();
  drawPointerHint();
  drawDog();
  drawSniffCue();
  drawWinOverlay();

  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(key)) {
    event.preventDefault();
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
  event.preventDefault();
  pointer.usingTouchEvents = false;
  pointer.pointerId = event.pointerId;
  beginPointer(event.clientX, event.clientY);
  if (canvas.setPointerCapture) {
    canvas.setPointerCapture(event.pointerId);
  }
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
  event.preventDefault();
  event.stopPropagation();
  joystick.active = true;
  joystick.pointerId = event.pointerId;
  updateJoystickFromClient(event.clientX, event.clientY);
  if (joystickBase.setPointerCapture) {
    joystickBase.setPointerCapture(event.pointerId);
  }
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

helpButton.addEventListener("click", () => {
  if (helpDialog.showModal) {
    helpDialog.showModal();
  }
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

restartButton.addEventListener("click", resetGame);
sniffButton.addEventListener("click", triggerSniff);

renderJoystick();
resetGame();
tick();
