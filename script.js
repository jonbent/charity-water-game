// script.js
let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");

let player = {
  x: 50,
  y: 300,
  width: 30, // collision box width (less than sprite width)
  height: 50,
  color: "black",
  dy: 0,
  gravity: 0.5,
  jumpForce: -10,
  onGround: true,
};

let keys = {
  left: false,
  right: false,
  jump: false,
};

let score = 0;
let totalScore = 0;
let lives = 3;
let time = 18000; // 5 minutes at 60fps
let collected = 0;
let lastDisplayedSecond = Math.ceil(time / 60);

let camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height
};

// For a simple demo, let's assume the world is the same size as the canvas
// but you can expand this to a larger world later
let world = {
  width: 4800, // Example: twice the canvas width
  height: 800  // Example: twice the canvas height
};

let background = new Image();
const GROUND_HEIGHT = 16;

// Level data structure
const levels = [
  {
    background: "assets/charity-water-background.png",
    playerStart: { x: 50, y: 300 },
    obstacles: [
      { x: 335, y: 784, width: 336, height: 16, type: "water" }
    ],
    platforms: [
      { x: 554, y: 732, width: 32, height: 8 },
      { x: 413, y: 732, width: 32, height: 8 },
      { x: 494, y: 643, width: 32, height: 8 },
      { x: 370, y: 606, width: 32, height: 8 },
      { x: 238, y: 522, width: 32, height: 8 },
      { x: 342, y: 447, width: 32, height: 8 },
      { x: 485, y: 385, width: 32, height: 8 },
      

    ]
  },
  // {
  //   background: "assets/charity-water-background.png",
  //   playerStart: { x: 50, y: 300 },
  //   obstacles: [
  //     { x: 335, y: 784, width: 336, height: 16, type: "water" }
  //   ],
  //   platforms: [
  //     { x: 554, y: 732, width: 32, height: 8 },
  //     { x: 413, y: 732, width: 32, height: 8 },
  //     { x: 494, y: 643, width: 32, height: 8 },
  //     { x: 370, y: 606, width: 32, height: 8 },
  //     { x: 238, y: 522, width: 32, height: 8 },
  //     { x: 342, y: 447, width: 32, height: 8 },
  //     { x: 485, y: 385, width: 32, height: 8 },
      

  //   ]
  // },
  // Add more level objects here
];
let currentLevel = 0;

function updateScoreboard() {
  let seconds = Math.ceil(time / 60);
  if (seconds !== lastDisplayedSecond) {
    document.getElementById("time").textContent = seconds;
    lastDisplayedSecond = seconds;
  }
  document.getElementById("lives").textContent = lives;
  document.getElementById("collected").textContent = collected;
  if (document.getElementById("totalScore")) {
    document.getElementById("totalScore").textContent = totalScore;
  }
}

function updateCamera() {
  // Center camera on player
  camera.x = player.x + player.width / 2 - camera.width / 2;
  camera.y = player.y + player.height / 2 - camera.height / 2;

  // Clamp camera to world bounds
  camera.x = Math.max(0, Math.min(camera.x, world.width - camera.width));
  camera.y = Math.max(0, Math.min(camera.y, world.height - camera.height));
}

function drawBackground() {
  ctx.drawImage(
    background,
    camera.x, camera.y,                // Source x, y (from world)
    camera.width, camera.height,       // Source width, height (viewport)
    0, 0,                             // Destination x, y (canvas)
    canvas.width, canvas.height        // Destination width, height (canvas)
  );
}

let playerSprite = new Image();
playerSprite.src = "assets/charity-water-character-sprite.png";
const PLAYER_FRAME_WIDTH = 48;  // 48/2
const PLAYER_FRAME_HEIGHT = 48;
let walkFrame = 0;
let walkFrameTimer = 0;
let lastDirection = 1; // 1 for right, -1 for left

function drawPlayer() {
  let frame = 1; // idle by default
  if (keys.left || keys.right) {
    // Walking animation: alternate frames every 10 ticks
    walkFrameTimer++;
    if (walkFrameTimer > 10) {
      walkFrame = 1 - walkFrame;
      walkFrameTimer = 0;
    }
    frame = walkFrame;
    // Update lastDirection
    if (keys.left && !keys.right) lastDirection = -1;
    if (keys.right && !keys.left) lastDirection = 1;
  } else {
    walkFrame = 0;
    walkFrameTimer = 0;
    frame = 1; // idle frame
  }

  // Adjust y so feet touch the ground (sprite feet are 7px above bottom)
  const yOffset = 10;
  // Center the sprite horizontally over the collision box
  const xOffset = (player.width - PLAYER_FRAME_WIDTH) / 2;

  // Flip sprite if lastDirection is left
  if (lastDirection === -1) {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(
      playerSprite,
      frame * PLAYER_FRAME_WIDTH, 0,
      PLAYER_FRAME_WIDTH, PLAYER_FRAME_HEIGHT,
      -(player.x - camera.x + PLAYER_FRAME_WIDTH + xOffset), player.y - camera.y + yOffset,
      PLAYER_FRAME_WIDTH, PLAYER_FRAME_HEIGHT
    );
    ctx.restore();
  } else {
    ctx.drawImage(
      playerSprite,
      frame * PLAYER_FRAME_WIDTH, 0,
      PLAYER_FRAME_WIDTH, PLAYER_FRAME_HEIGHT,
      player.x - camera.x + xOffset, player.y - camera.y + yOffset,
      PLAYER_FRAME_WIDTH, PLAYER_FRAME_HEIGHT
    );
  }
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

let lastSafeX = player.x;
let lastSafeY = player.y;
// Use a timestamp for invincibility
let invincibleUntil = 0;

function canMoveTo(newX, newY) {
  // Check if the player would be standing on a platform or ground at newX, newY
  // Only allow if the new surface is at or below the player's current feet
  let playerBottom = player.y + player.height;
  let newBottom = newY + player.height;
  let allowed = false;

  // Check platforms
  platforms.forEach(platform => {
    if (
      newX + player.width > platform.x &&
      newX < platform.x + platform.width &&
      Math.abs(newBottom - platform.y) < 2 // standing on platform
    ) {
      if (platform.y >= playerBottom - 1) allowed = true;
    }
  });

  // Check ground (not above water)
  let aboveWater = false;
  let poolY = null;
  obstacles.forEach(obstacle => {
    if (
      obstacle.type === "water" &&
      newX + player.width > obstacle.x &&
      newX < obstacle.x + obstacle.width &&
      world.height - GROUND_HEIGHT === obstacle.y
    ) {
      aboveWater = true;
      poolY = world.height - (GROUND_HEIGHT - 16);
    }
  });
  if (!aboveWater) {
    let groundY = world.height - GROUND_HEIGHT;
    if (Math.abs(newBottom - groundY) < 2 && groundY >= playerBottom - 1) allowed = true;
  } else {
    // Water pool bottom
    if (poolY !== null && Math.abs(newBottom - poolY) < 2 && poolY >= playerBottom - 1) allowed = true;
    // Also allow walking off ground into water if pool is lower than current feet
    if (poolY !== null && poolY > playerBottom - 1) allowed = true;
  }

  return allowed;
}

let lastTimeUpdate = performance.now();
let lastFrameTime = 0;
function update(now) {
  if (levelComplete) return; // Stop update loop if level is complete
  if (!now) now = performance.now();
  if (now - lastFrameTime < 1000 / 60) {
    requestAnimationFrame(update);
    return;
  }
  lastFrameTime = now;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (lives <= 0 || time <= 0) {
    document.getElementById("game-over").classList.remove("hidden");
    return;
  }

  drawBackground();
  drawFinishLine();

  // Gravity
  player.dy += player.gravity;
  player.y += player.dy;

  // Platform collision
  player.onGround = false;
  let onPlatform = false;
  platforms.forEach(platform => {
    if (isColliding(player, platform)) {
      if (player.dy >= 0 && player.y + player.height - player.dy <= platform.y) {
        player.y = platform.y - player.height;
        player.dy = 0;
        player.onGround = true;
        onPlatform = true;
      }
    }
  });

  // Ground/water collision
  let onGround = false;
  let aboveWater = false;
  let atWaterBottom = false;
  let playerFoot = player.x + player.width / 2;
  obstacles.forEach(obstacle => {
    if (
      obstacle.type === "water" &&
      playerFoot >= obstacle.x &&
      playerFoot <= obstacle.x + obstacle.width &&
      world.height - GROUND_HEIGHT === obstacle.y
    ) {
      aboveWater = true;
      // Check if player is at the bottom of the pool
      if (player.y + player.height >= world.height - (GROUND_HEIGHT - 16)) {
        atWaterBottom = true;
      }
    }
  });
  if (atWaterBottom) {
    // Player is at the bottom of the pool, can jump, but can't walk out
    player.y = world.height - (GROUND_HEIGHT - 16) - player.height;
    player.dy = 0;
    player.onGround = true;
    onGround = false; // Do not allow walking out horizontally
  } else if (!aboveWater) {
    // Normal ground collision (only if not above water)
    if (player.y + player.height >= world.height - GROUND_HEIGHT) {
      player.y = world.height - GROUND_HEIGHT - player.height;
      player.dy = 0;
      player.onGround = true;
      onGround = true;
    }
  }

  // Check if player is in water
  let inWater = false;
  obstacles.forEach(obstacle => {
    if (isColliding(player, obstacle)) {
      if (obstacle.type === "water") {
        inWater = true;
      }
    }
  });

  // Only update last safe position if not in water and on ground or platform
  if ((onPlatform || onGround) && !inWater) {
    lastSafeX = player.x;
    lastSafeY = player.y;
  }

  // Obstacle collision (damage player, invincibility for 3 seconds)
  if (inWater && now > invincibleUntil) {
    lives--;
    invincibleUntil = now + 3000; // 3 seconds in ms
  }

  // Horizontal movement
  let moveX = 0;
  if (keys.left) moveX -= 4;
  if (keys.right) moveX += 4;
  if (moveX !== 0) {
    let newX = player.x + moveX;
    let newY = player.y;
    if (inWater) {
      // Only allow horizontal movement in water if jumping (moving up)
      if (player.dy < 0) {
        player.x = newX;
      }
    } else {
      let blockedByPlatform = false;
      if (player.onGround && !onPlatform) {
        // Prevent walking onto raised platforms from the side
        platforms.forEach(platform => {
          if (
            newX + player.width > platform.x &&
            newX < platform.x + platform.width &&
            platform.y + platform.height <= player.y + player.height - 1 &&
            platform.y + platform.height > player.y + player.height - 10
          ) {
            blockedByPlatform = true;
          }
        });
        if (!blockedByPlatform && canMoveTo(newX, newY)) {
          player.x = newX;
        }
      } else {
        // Allow air movement and platform movement freely
        player.x = newX;
      }
    }
  }
  player.x = Math.max(0, Math.min(player.x, world.width - player.width));

  updateCamera();
  drawPlayer();
  drawCollectables(now);
  updateScoreboard();

  // Timer: decrement every frame (60fps)
  time--;

  checkCollectableCollision();
  checkFinishLineCollision();

  requestAnimationFrame(update);
}

let collectableImg = new Image();
collectableImg.src = "assets/charity-water-logo.png";

// Collectables for each level
let collectables = [];
let collectedFlags = [];

function setupCollectablesForLevel() {
  collectables = [];
  collectedFlags = [];
  const level = levels[currentLevel];
  // Place one collectable above the last platform
  if (level.platforms.length > 0) {
    const lastPlat = level.platforms[level.platforms.length - 1];
    collectables.push({
      x: lastPlat.x + lastPlat.width / 2 - 16, // center, assuming 32x32 image
      y: lastPlat.y - 40, // above platform
      width: 32,
      height: 32,
      bobOffset: Math.random() * Math.PI * 2 // randomize bob phase
    });
    collectedFlags.push(false);
  }
}

function drawCollectables(tick) {
  collectables.forEach((c, i) => {
    if (collectedFlags[i]) return;
    // Bobbing animation (slower)
    let bobY = Math.sin(tick / 90 + c.bobOffset) * 8;
    ctx.drawImage(collectableImg, c.x - camera.x, c.y + bobY - camera.y, c.width, c.height);
  });
}

function checkCollectableCollision() {
  collectables.forEach((c, i) => {
    if (collectedFlags[i]) return;
    if (
      player.x + player.width > c.x &&
      player.x < c.x + c.width &&
      player.y + player.height > c.y &&
      player.y < c.y + c.height
    ) {
      collectedFlags[i] = true;
      collected++;
    }
  });
}

let finishLine = { x: 4649, y: world.height - GROUND_HEIGHT - 100, width: 32, height: 100 };
let levelComplete = false;

function drawFinishLine() {
  ctx.save();
  ctx.fillStyle = "yellow";
  ctx.fillRect(finishLine.x - camera.x, finishLine.y - camera.y, finishLine.width, finishLine.height);
  ctx.restore();
}

function showEndScreen(finalScore, breakdown) {
  totalScore += finalScore;
  const endScreen = document.getElementById("end-screen");
  // Only update the spans, do not overwrite innerHTML
  if (document.getElementById("finalTime")) document.getElementById("finalTime").textContent = breakdown.timeBonus;
  if (document.getElementById("finalCollectables")) document.getElementById("finalCollectables").textContent = collected;
  if (document.getElementById("finalDelivered")) document.getElementById("finalDelivered").textContent = breakdown.lives + 'x';
  if (document.getElementById("finalScore")) document.getElementById("finalScore").textContent = finalScore;
  if (document.getElementById("totalScoreEnd")) document.getElementById("totalScoreEnd").textContent = totalScore;

  if (currentLevel == levels.length - 1){
    document.getElementById("nextLevelBtn").classList.add("hidden");
    document.getElementById("playerNameInput").classList.remove("hidden");
    document.getElementById("submitScoreBtn").classList.remove("hidden");
    document.getElementById("closeEndScreenBtn").classList.remove("hidden");
  }
  endScreen.classList.remove("hidden");
  endScreen.style.display = "block";

}



function checkFinishLineCollision() {
  if (
    player.x + player.width > finishLine.x &&
    player.x < finishLine.x + finishLine.width &&
    player.y + player.height > finishLine.y &&
    player.y < finishLine.y + finishLine.height
  ) {
    if (!levelComplete) {
      console.log('Finish line collision!');
      levelComplete = true;
      // Calculate score
      let secondsLeft = Math.ceil(time / 60);
      let timeBonus = secondsLeft * 10;
      let livesMult = Math.max(1, lives); // 1x, 2x, or 3x
      let collectableBonus = collected * 1000;
      let finalScore = (timeBonus + collectableBonus) * livesMult;
      showEndScreen(finalScore, { timeBonus, lives: livesMult, collectableBonus });
    }
  }
}

function loadLevel(levelIdx) {
  const level = levels[levelIdx];
  background.src = level.background;
  player.x = level.playerStart.x;
  player.y = level.playerStart.y;
  player.dy = 0;
  obstacles = JSON.parse(JSON.stringify(level.obstacles));
  platforms = JSON.parse(JSON.stringify(level.platforms));
  setupCollectablesForLevel();
  levelComplete = false;
  // Update finish line y in case world.height changes per level
  finishLine.y = world.height - GROUND_HEIGHT - 100;
}

function startGame() {
  // Do NOT reset currentLevel here, so restart only restarts the current level
  score = 0;
  if (currentLevel === 0) totalScore = 0;
  lives = 3;
  time = 18000; // 5 minutes at 60fps
  collected = 0;
  lastDisplayedSecond = Math.ceil(time / 60);
  lastFrameTime = 0;
  // Reset keys to prevent stuck movement
  keys.left = false;
  keys.right = false;
  keys.jump = false;
  loadLevel(currentLevel);
  document.getElementById("time").textContent = Math.ceil(time / 60);
  document.getElementById("end-screen").classList.add("hidden");
  document.getElementById("game-over").classList.add("hidden");
  lastTimeUpdate = performance.now();
  updateScoreboard();
  update();
}

const startNextLevel = () => {
  currentLevel++;
  startGame();
}

window.addEventListener("keydown", (e) => {
  if (levelComplete || document.getElementById("end-screen").classList.contains("hidden") === false) return;
  if (e.code === "KeyA") keys.left = true;
  if (e.code === "KeyD") keys.right = true;
  if (e.code === "Space") {
    e.preventDefault(); // Always prevent scroll on Space
    if (player.onGround) {
      // Check if in water for reduced jump
      let inWater = false;
      obstacles.forEach(obstacle => {
        if (isColliding(player, obstacle) && obstacle.type === "water") {
          inWater = true;
        }
      });
      if (inWater) {
        player.dy = player.jumpForce / 2;
      } else {
        player.dy = player.jumpForce;
      }
      player.onGround = false;
    }
  }
});

window.addEventListener("keyup", (e) => {
  if (levelComplete || document.getElementById("end-screen").classList.contains("hidden") === false) return;
  if (e.code === "KeyA") keys.left = false;
  if (e.code === "KeyD") keys.right = false;
});

document.getElementById("leftBtn").addEventListener("touchstart", () => keys.left = true);
document.getElementById("rightBtn").addEventListener("touchstart", () => keys.right = true);
document.getElementById("jumpBtn").addEventListener("touchstart", () => {
  if (player.onGround) {
    player.dy = player.jumpForce;
    player.onGround = false;
  }
});

document.getElementById("leftBtn").addEventListener("touchend", () => keys.left = false);
document.getElementById("rightBtn").addEventListener("touchend", () => keys.right = false);

document.getElementById("restartBtn").addEventListener("click", () => {
  document.getElementById("game-over").classList.add("hidden");
  startGame();
});

document.addEventListener("DOMContentLoaded", function() {
  renderLeaderboard();
  document.getElementById("startGameBtn").addEventListener("click", () => {
    document.getElementById("startGameBtn").innerHTML = "Restart Game";
    document.getElementById("canvas-restart-overlay").classList.add("hidden");
    currentLevel = 0; // Reset to first level
    startGame();
  });
});

function submitScore() {
  const submitBtn = document.getElementById("submitScoreBtn");
  submitBtn.disabled = true;
  const name = document.getElementById("playerNameInput").value.trim() || "Anonymous";
  const score = totalScore;
  let leaderboard = JSON.parse(localStorage.getItem("cwLeaderboard") || "[]");
  // Prevent duplicate name/score entries
  if (!leaderboard.some(entry => entry.name === name && entry.score === score)) {
    leaderboard.push({ name, score });
  }
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 10); // Top 10
  localStorage.setItem("cwLeaderboard", JSON.stringify(leaderboard));
  renderLeaderboard();
  document.getElementById("playerNameInput").value = "";
  closeEndScreen();
  setTimeout(() => { submitBtn.disabled = false; }, 1000); // Re-enable for next time
}

function closeEndScreen() {
  const endScreen = document.getElementById("end-screen");
  document.getElementById("canvas-restart-overlay").classList.remove("hidden");
  endScreen.style.display = "none";
  endScreen.classList.add("hidden");
}

function renderLeaderboard() {
  // End screen leaderboard
  const leaderboardDiv = document.getElementById("leaderboard");
  let leaderboard = JSON.parse(localStorage.getItem("cwLeaderboard") || "[]");
  if (leaderboardDiv) {
    if (leaderboard.length === 0) {
      leaderboardDiv.innerHTML = "<h3>Leaderboard</h3><p>No scores yet.</p>";
    } else {
      leaderboardDiv.innerHTML = `<h3>Leaderboard</h3><ul>` +
        leaderboard.map(entry => `<li>${entry.name}: ${entry.score}</li>`).join("") +
        `</ul>`;
    }
  }
  // Global leaderboard
  const globalDiv = document.getElementById("leaderboard-global");
  if (globalDiv) {
    if (leaderboard.length === 0) {
      globalDiv.innerHTML = "<p>No scores yet.</p>";
    } else {
      globalDiv.innerHTML = `<ul>` +
        leaderboard.map(entry => `<li>${entry.name}: ${entry.score}</li>`).join("") +
        `</ul>`;
    }
  }
}
