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
      { x: 335, y: 784, width: 336, height: 16, type: "water" },
      { x: 866, y: 784, width: 672, height: 16, type: "water" },
      { x: 1554, y: 784, width: 864, height: 16, type: "water" },
      { x: 2831, y: 784, width: 177, height: 16, type: "water" },
      { x: 3343, y: 784, width: 177, height: 16, type: "water" },
      { x: 3862, y: 784, width: 177, height: 16, type: "water" },
    ],
    platforms: [
      { x: 554, y: 732, width: 32, height: 8 },
      { x: 413, y: 732, width: 32, height: 8 },
      { x: 494, y: 643, width: 32, height: 8 },
      { x: 370, y: 606, width: 32, height: 8 },
      { x: 238, y: 522, width: 32, height: 8 },
      { x: 342, y: 447, width: 32, height: 8 },
      { x: 485, y: 385, width: 32, height: 8 },
      { x: 797, y: 732, width: 32, height: 8 },
      { x: 721, y: 647, width: 32, height: 8 },
      { x: 800, y: 568, width: 32, height: 8 },
      { x: 850, y: 496, width: 16, height: 8 },
      { x: 700, y: 495, width: 32, height: 8 },
      { x: 936, y: 517, width: 32, height: 8 },
      { x: 793, y: 436, width: 32, height: 8 },
      { x: 936, y: 517, width: 32, height: 8 },
      { x: 1045, y: 586, width: 32, height: 8 },
      { x: 1161, y: 660, width: 32, height: 8 },
      { x: 882, y: 741, width: 32, height: 8 },
      { x: 998, y: 739, width: 32, height: 8 },
      { x: 1125, y: 738, width: 32, height: 8 },
      { x: 1247, y: 736, width: 32, height: 8 },
      { x: 1359, y: 697, width: 32, height: 8 },
      { x: 1457, y: 740, width: 32, height: 8 },
      { x: 1498, y: 664, width: 32, height: 8 },
      {x: 1506, y: 772, width: 32, height: 8 },
      { x: 1554, y: 772, width: 32, height: 8 },
      { x: 1645, y: 771, width: 32, height: 8 },
      { x: 1742, y: 771, width: 32, height: 8 },
      { x: 1842, y: 770, width: 32, height: 8 },
      { x: 1949, y: 770, width: 32, height: 8 },
      { x: 2074, y: 769, width: 32, height: 8 },
      { x: 2197, y: 767 , width: 32, height: 8 },
      { x: 2329, y: 764, width: 32, height: 8 },
      { x: 2421, y: 765, width: 32, height: 8 },
      { x: 2530, y: 733, width: 32, height: 8 },
      { x: 2629, y: 686, width: 32, height: 8 },
      { x: 2564, y: 618, width: 32, height: 8 },
      { x: 2657, y: 563, width: 32, height: 8 },
      { x: 2726, y: 512, width: 32, height: 8 },
      { x: 2861, y: 675, width: 32, height: 8 },
      { x: 2966, y: 694, width: 32, height: 8 },
      { x: 3356, y: 730, width: 32, height: 8 },
      { x: 3469, y: 735, width: 32, height: 8 },
      { x: 3868, y: 733, width: 32, height: 8 },
      { x: 3987, y: 734, width: 32, height: 8 },
      { x: 1538, y: 613, width: 864, height: 16},
      { x: 2769, y: 496, width: 32, height: 16},
      { x: 4096, y: 684, width: 32, height: 16},
      { x: 4189, y: 629, width: 32, height: 16},
      { x: 4258, y: 578, width: 32, height: 16},
      { x: 4153, y: 508, width: 32, height: 16},
      { x: 4060, y: 453, width: 32, height: 16},
      { x: 3991, y: 402, width: 32, height: 16},
    ],
    walls: [
      { x: 850, y: 496, width: 16, height: 288},
      { x: 1538, y: 613, width: 16, height: 171},
      {x: 2769, y: 496, width: 16, height: 288},
      // Example: { x: 600, y: 700, width: 32, height: 80 }
      // Add your wall objects here
    ],
    collectables: [
      // Example collectable objects for this level:
      { x: 485, y: 385, width: 32, height: 32 },
      { x: 1554, y: 772, width: 32, height: 32 },
      { x: 3991, y: 402, width: 32, height: 32 }
      // Add as many as needed per level
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

let sunImg = new Image();
sunImg.src = "assets/sun.png";
let cloudImg = new Image();
cloudImg.src = "assets/cloud.png";

function drawBackground() {
  // Draw blue sky first
  ctx.save();
  ctx.fillStyle = "#7ec8e3"; // Light blue sky color
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Draw sun in top-left corner, peeking out and larger (partially off-canvas)
  ctx.drawImage(sunImg, -40, -40, 180, 180);

  // Draw clouds: top center and top right
  ctx.drawImage(cloudImg, canvas.width / 2 , 40, 180, 180); // top center
  ctx.drawImage(cloudImg, canvas.width - 140, 40, 180, 180);    // top right
  ctx.drawImage(cloudImg, 40, 40, 180, 180);

  // Draw background image over the sky, sun, and clouds
  ctx.drawImage(
    background,
    camera.x, camera.y,
    camera.width, camera.height,
    0, 0,
    canvas.width, canvas.height
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

  // Wall collision (prevent horizontal movement through walls)
  // Only block if colliding from the side, not from above
  let blockedByWall = false;
  walls.forEach(wall => {
    // Check if player's next position would be inside a wall horizontally
    // Only block if player's feet are above the top of the wall (not jumping down through)
    if (
      player.x + player.width > wall.x &&
      player.x < wall.x + wall.width &&
      player.y + player.height > wall.y &&
      player.y < wall.y + wall.height
    ) {
      // If coming from left
      if (player.x + player.width - 4 <= wall.x && keys.right) {
        player.x = wall.x - player.width;
        blockedByWall = true;
      }
      // If coming from right
      if (player.x + 4 >= wall.x + wall.width && keys.left) {
        player.x = wall.x + wall.width;
        blockedByWall = true;
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
    if (difficulty === "hard") {
      lives -= 2;
    } else {
      lives--;
    }
    invincibleUntil = now + 3000; // 3 seconds in ms
  }

  // Horizontal movement
  let moveX = 0;
  if (keys.left) moveX -= 4;
  if (keys.right) moveX += 4;
  if (moveX !== 0 && !blockedByWall) {
    let newX = player.x + moveX;
    let newY = player.y;
    // Wall collision check for next position
    let willCollideWall = false;
    walls.forEach(wall => {
      if (
        newX + player.width > wall.x &&
        newX < wall.x + wall.width &&
        player.y + player.height > wall.y + 1 && // allow jumping over
        player.y < wall.y + wall.height
      ) {
        willCollideWall = true;
      }
    });
    if (!willCollideWall) {
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
    // else: blocked by wall, do not move
  }
  player.x = Math.max(0, Math.min(player.x, world.width - player.width));

  updateCamera();
  drawPlayer();
  drawCollectables(now);
  drawFinishLinePeople(now);
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
  if (level.collectables && Array.isArray(level.collectables)) {
    collectables = level.collectables.map((c, i) => {
      // Find the matching platform for this collectable's base coords
      const platform = level.platforms.find(
        p => p.x === c.x && p.y === c.y
      );
      let cx = c.x, cy = c.y;
      if (platform) {
        // Center horizontally above the platform, float above by 40px
        cx = platform.x + platform.width / 2 - (c.width || 32) / 2;
        cy = platform.y - 40;
      }
      return {
        ...c,
        x: cx,
        y: cy,
        bobOffset: Math.random() * Math.PI * 2 // randomize bob phase
      };
    });
    collectedFlags = collectables.map(() => false);
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

let finishLine = { x: 4532, y: world.height - GROUND_HEIGHT - 100, width: 32, height: 100 };
let levelComplete = false;

// Add finish line people sprites
let manImg = new Image();
manImg.src = "assets/man.png";
let womanImg = new Image();
womanImg.src = "assets/woman.png";

function showEndScreen(finalScore, breakdown) {
  totalScore += finalScore;
  const endScreen = document.getElementById("end-screen");
  // Only update the spans, do not overwrite innerHTML
  if (document.getElementById("finalTime")) document.getElementById("finalTime").textContent = breakdown.timeBonus;
  if (document.getElementById("finalCollectables")) document.getElementById("finalCollectables").textContent = breakdown.collected;
  if (document.getElementById("finalDelivered")) document.getElementById("finalDelivered").textContent = breakdown.livesBonus;
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

function drawFinishLinePeople(tick) {
  // Position people on either side of the finish line, with a little space
  const finishX = finishLine.x;
  const finishY = finishLine.y + finishLine.height - 96; // ground level for people (adjusted for 3/4 size)
  const personWidth = 72;   // 3/4 of 96
  const personHeight = 96;  // 3/4 of 128
  const jumpAmplitude = 27; // 3/4 of 36
  const jumpSpeed = 0.0125;

  // Left person (man)
  const manX = finishX - personWidth - 24;
  const manY = finishY - Math.abs(Math.sin(tick * jumpSpeed)) * jumpAmplitude;
  // Right person (woman)
  const womanX = finishX + finishLine.width + 24;
  const womanY = finishY - Math.abs(Math.sin(tick * jumpSpeed + Math.PI)) * jumpAmplitude;

  ctx.drawImage(manImg, manX - camera.x, manY - camera.y, personWidth, personHeight);
  ctx.drawImage(womanImg, womanX - camera.x, womanY - camera.y, personWidth, personHeight);
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
      let collectableMult = collected + 1;
      // Each remaining life adds 1000 points
      let livesBonus;
      if (difficulty === "hard") {
        livesBonus = 3 * 1000;
      } else {
        livesBonus = lives * 1000;
      }
      let baseScore = timeBonus;
      let finalScore = (baseScore + livesBonus) * collectableMult;
      if (difficulty === "hard") {
        finalScore *= 2;
      }
      showEndScreen(finalScore, { 
        timeBonus, 
        collectableMult, 
        livesBonus, 
        collected 
      });
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
  walls = JSON.parse(JSON.stringify(level.walls || [])); // Load walls for this level
  setupCollectablesForLevel();
  levelComplete = false;
  // Update finish line y in case world.height changes per level
  finishLine.y = world.height - GROUND_HEIGHT - 100;
}

let difficulty = "normal"; // "normal" or "hard"

function startGame() {
  // Do NOT reset currentLevel here, so restart only restarts the current level
  score = 0;
  if (currentLevel === 0) totalScore = 0;
  player.gravity = 0.5;
  // Set difficulty-dependent values
  if (difficulty === "hard") {
    lives = 1;
  } else {
    lives = 3;
    
  }

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
        player.dy = player.jumpForce / 1.5;
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

// --- Orientation and Mobile Controls Logic ---

function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

function updateOrientation() {
  const overlay = document.getElementById('orientation-overlay');
  const gameCanvas = document.getElementById('gameCanvas');
  const mobileControls = document.getElementById('mobile-controls');
  if (overlay && gameCanvas && mobileControls) {
    if (isPortrait()) {
      overlay.style.display = 'flex';
      gameCanvas.style.display = 'none';
      mobileControls.style.display = 'none';
    } else {
      overlay.style.display = 'none';
      gameCanvas.style.display = '';
      mobileControls.style.display = 'flex';
    }
  }
}

window.addEventListener('resize', updateOrientation);
window.addEventListener('orientationchange', updateOrientation);
document.addEventListener('DOMContentLoaded', updateOrientation);

// Mobile controls: simulate key events and direct state for touch
function triggerKey(code) {
  const event = new KeyboardEvent('keydown', { code, key: code, bubbles: true });
  document.dispatchEvent(event);
}

// Defensive: only add listeners if buttons exist
document.addEventListener('DOMContentLoaded', function() {
  // Mobile controls event listeners
  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');
  const jumpBtn = document.getElementById('jumpBtn');
  if (leftBtn && rightBtn && jumpBtn) {
    leftBtn.addEventListener('touchstart', e => { e.preventDefault(); keys.left = true; });
    rightBtn.addEventListener('touchstart', e => { e.preventDefault(); keys.right = true; });
    jumpBtn.addEventListener('touchstart', e => {
      e.preventDefault();
      if (player.onGround) {
        player.dy = player.jumpForce;
        player.onGround = false;
      }
    });
    leftBtn.addEventListener('touchend', e => { e.preventDefault(); keys.left = false; });
    rightBtn.addEventListener('touchend', e => { e.preventDefault(); keys.right = false; });

    // Optional: also support mouse for desktop testing
    leftBtn.addEventListener('mousedown', e => { e.preventDefault(); triggerKey('KeyA'); });
    rightBtn.addEventListener('mousedown', e => { e.preventDefault(); triggerKey('KeyD'); });
    jumpBtn.addEventListener('mousedown', e => { e.preventDefault(); triggerKey('Space'); });
  }
});

// --- End of Orientation and Mobile Controls Logic ---

document.getElementById("restartBtn").addEventListener("click", () => {
  document.getElementById("game-over").classList.add("hidden");
  startGame();
});

document.addEventListener("DOMContentLoaded", function() {
  renderLeaderboard();
  // Difficulty selection buttons
  const normalBtn = document.getElementById("startGameNormalBtn");
  const hardBtn = document.getElementById("startGameHardBtn");
  if (normalBtn && hardBtn) {
    normalBtn.addEventListener("click", () => {
      difficulty = "normal";
      document.getElementById("canvas-restart-overlay").classList.add("hidden");
      currentLevel = 0;
      startGame();
    });
    hardBtn.addEventListener("click", () => {
      difficulty = "hard";
      document.getElementById("canvas-restart-overlay").classList.add("hidden");
      currentLevel = 0;
      startGame();
    });
  }
});

function submitScore() {
  const submitBtn = document.getElementById("submitScoreBtn");
  submitBtn.disabled = true;
  const name = document.getElementById("playerNameInput").value.trim() || "Anonymous";
  const score = totalScore;
  // Store difficulty with score
  let leaderboard = JSON.parse(localStorage.getItem("cwLeaderboard") || "[]");
  // Prevent duplicate name/score/difficulty entries
  if (!leaderboard.some(entry => entry.name === name && entry.score === score && entry.difficulty === difficulty)) {
    leaderboard.push({ name, score, difficulty });
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
        leaderboard.map(entry =>
          `<li>${entry.name}: ${entry.score} <span style="font-size:0.9em;opacity:0.7;">(${entry.difficulty === "hard" ? "Hard" : "Normal"})</span></li>`
        ).join("") +
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
        leaderboard.map(entry =>
          `<li>${entry.name}: ${entry.score} <span style="font-size:0.9em;opacity:0.7;">(${entry.difficulty === "hard" ? "Hard" : "Normal"})</span></li>`
        ).join("") +
        `</ul>`;
    }
  }
}
