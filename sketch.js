"use strict";

console.debug(
  "Press Shift + D to enable debug mode controls, and see checkDebugMode() for details."
);
console.info("Have fun!");

class Monkey {
  // JSHint in editor.p5js.org doesn't support static here yet.
  // jshint ignore:start
  static spritesheet;
  static throwSound;
  static throwSoundSprites = {
    1: [0, 277],
    2: [277, 383],
  };
  static crySound;
  static spriteWidth = 200; // width of a sprite in monkey.png
  static spriteHeight = 230; // height of a sprite in monkey.png
  static width = Monkey.spriteWidth * 0.35;
  static height = Monkey.spriteHeight * 0.35;
  static maxHp = 10;
  // jshint ignore:end

  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.spriteX = 0;
    this.spriteY = 0;
    this.facingLeft = true;
    this.lastDungThrownAtMs = 0;
    this.dungs = [];
    this.hp = Monkey.maxHp;
    this.healthBar = new HealthBar(false, greenColor);
    this.wasThrown = false;
    this.throwDirection = null;
    this.rotationRad = 0;
  }

  throwDung() {
    if (this.wasThrown) {
      return;
    }

    const cooldownMs = 100;
    if (gameTimeMs - this.lastDungThrownAtMs < cooldownMs) {
      return;
    }

    this.dungs.push(new Dung(this));
    this.lastDungThrownAtMs = gameTimeMs;
    Monkey.throwSound.play(random(Object.keys(Monkey.throwSoundSprites)));
  }

  update() {
    this.move();

    if (this.wasThrown) {
      const translationSpeed = 1;
      this.x += this.throwDirection * gameDeltaTimeMs * translationSpeed;
      this.y -= gameDeltaTimeMs * translationSpeed;

      const rotationSpeed = 0.05;
      this.rotationRad += gameDeltaTimeMs * rotationSpeed;

      if (abs(this.x) > width * 1.5) {
        this.hp = 0;
      }
    }

    this.dungs = Dung.cleanupInstances(this.dungs);
  }

  move() {
    if (this.wasThrown) {
      return;
    }

    const speed = 0.5;
    if (keyIsDown(LEFT_ARROW)) {
      this.x -= speed * gameDeltaTimeMs;
    } else if (keyIsDown(RIGHT_ARROW)) {
      this.x += speed * gameDeltaTimeMs;
    }
    if (keyIsDown(UP_ARROW)) {
      this.y -= speed * gameDeltaTimeMs;
    } else if (keyIsDown(DOWN_ARROW)) {
      this.y += speed * gameDeltaTimeMs;
    }

    // Make sure the monkey doesn't go out of the canvas.
    this.x = constrain(this.x, 0, width - Monkey.width);
    this.y = constrain(
      this.y,
      safeYMargin,
      height - Monkey.height - safeYMargin
    );

    // Change the sprite of monkey so the monkey faces the direction it's moving towards.
    if (keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW)) {
      this.facingLeft = keyIsDown(LEFT_ARROW);
      this.spriteX = this.facingLeft ? 0 : Monkey.spriteWidth;
    }
  }

  draw() {
    this.healthBar.draw(this.hp, Monkey.maxHp);

    push();
    translate(this.x + Monkey.width / 2, this.y + Monkey.height / 2);
    imageMode(CENTER);
    rotate(this.rotationRad);
    image(
      Monkey.spritesheet,
      0,
      0,
      Monkey.width,
      Monkey.height,
      this.spriteX,
      this.spriteY,
      Monkey.spriteWidth,
      Monkey.spriteHeight
    );
    pop();
  }

  takeHit() {
    // Prevent game ending too soon if monkey gets hit by something other than
    // lemonke.
    if (!this.wasThrown) {
      this.hp = max(this.hp - 1, 0);
    }
    shakeEffect.shake();
  }

  takeThrow() {
    this.wasThrown = true;
    // Throw monkey towards opp. side of the screen.
    this.throwDirection = this.x + (Monkey.width / 2) > width / 2 ? -1 : 1;
    shakeEffect.shake();
    Monkey.crySound.play();
  }
}

class Dung {
  // jshint ignore:start
  static spritesheet;
  static hitSound;
  static spriteWidth = 32; // width of a sprite in dung.png
  static spriteHeight = 32; // height of a sprite in dung.png
  static width = Dung.spriteWidth * 0.75;
  static height = Dung.spriteHeight * 0.75;
  static numSprites = 4;
  // jshint ignore:end

  constructor(monkey) {
    const xPadding = 5;
    const relativePos =
      -(Dung.width / 2) +
      (monkey.facingLeft ? xPadding : Monkey.width - xPadding);
    this.x = constrain(monkey.x + relativePos, 0, width - Dung.width);

    this.y = monkey.y - Dung.height;
    this.spriteNum = Math.floor(random(Dung.numSprites));
    this.hit = false;
  }

  update() {
    this.y -= gameDeltaTimeMs;
  }

  draw() {
    image(
      Dung.spritesheet,
      this.x,
      this.y,
      Dung.width,
      Dung.height,
      this.spriteNum * Dung.spriteWidth,
      0,
      Dung.spriteWidth,
      Dung.spriteHeight
    );
  }

  takeHit() {
    this.hit = true;
    Dung.hitSound.play();
  }

  static cleanupInstances(dungs) {
    return dungs.filter((dung) => !dung.hit && dung.y + Dung.height > 0);
  }
}

class Lemonke {
  // jshint ignore:start
  static image;
  static width = 252 * 0.5;
  static height = 236 * 0.5;
  static movementCooldownMs = 2000;
  static linesSound;
  static linesSoundSprite = {
    fart: [1100, 403], // fart
    uhOh: [2402, 960], // uh oh
    stinky: [3824, 1508], // stinky~
    poopAhah: [5448, 2232], // poop ahahah
    funnyPoop: [12874, 1192], // funny poop!
    uhOh2: [33872, 591], // uh oh
    madePoopie: [35039, 1479], // i think I made a poopie!
    oopsie: [41779, 513], // oopsie!
    evilHahah: [32125, 1765], // hah hahah
    pooEch: [55796, 2201], // poo echeh *dies*
  };
  static randomSoundSprites = ["fart", "stinky", "poopAhah", "madePoopie"];
  static hitSoundSprites = ["uhOh", "uhOh2", "oopsie"];
  static maxHp = 100;
  // jshint ignore:end

  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.lastMovedAtMs = 0;
    this.moveProgress = 0;
    this.playNextSoundAtMs = gameTimeMs + random(4000, 8000);
    this.lastHitAtMs = null;
    this.hp = Lemonke.maxHp;
    this.lastSpokeAtMs = 0;
    this.shakeEffect = new ShakeEffect();
    this.healthBar = new HealthBar(true, redColor);
    this.hasWon = false;

    this.moveTowardsNewPosition();
  }

  moveTowardsNewPosition() {
    const xPadding = Lemonke.width * 0.3;
    const topPadding = 30;
    this.moveTowards = {
      x: random(xPadding, width - Lemonke.width - xPadding),
      y: random(safeYMargin + topPadding, height * 0.3 - safeYMargin),
    };

    this.lastMovedAtMs = gameTimeMs;
    this.moveProgress = 0;
  }

  update() {
    if (
      gameTimeMs - this.lastMovedAtMs > Lemonke.movementCooldownMs &&
      !this.hasWon
    ) {
      this.moveTowardsNewPosition();
    }

    if (gameTimeMs > this.playNextSoundAtMs && !this.hasWon) {
      if (this.moveProgress === 1) {
        Lemonke.linesSound.play(random(Lemonke.randomSoundSprites));
        this.playNextSoundAtMs = gameTimeMs + random(4000, 8000);
        this.lastSpokeAtMs = gameTimeMs;
      }
    }

    this.x = lerp(this.x, this.moveTowards.x, this.moveProgress);
    this.y = lerp(this.y, this.moveTowards.y, this.moveProgress);

    this.moveProgress = Math.min(1, this.moveProgress + gameDeltaTimeMs / 1000);
  }

  draw() {
    push();
    this.shakeEffect.applyMatrix();

    this.healthBar.draw(this.hp, Lemonke.maxHp);

    const tintAmount =
      this.lastHitAtMs !== null
        ? constrain(gameTimeMs - this.lastHitAtMs, 0, 255)
        : 255;
    tint(255, tintAmount, tintAmount);
    image(Lemonke.image, this.x, this.y, Lemonke.width, Lemonke.height);

    pop();
  }

  takeHit() {
    this.hp = max(this.hp - 1, 0);
    this.lastHitAtMs = gameTimeMs;

    const chancePct = 75;
    const cooldownMs = 1000;
    if (random(100) > chancePct && gameTimeMs - this.lastSpokeAtMs > cooldownMs) {
      this.lastSpokeAtMs = gameTimeMs;
      Lemonke.linesSound.play(random(Lemonke.hitSoundSprites));
    }

    this.shakeEffect.shake();
  }

  lost() {
    Lemonke.linesSound.stop();
    Lemonke.linesSound.play("pooEch");
  }

  won() {
    // This function might get called twice before the battle stage ends and
    // evilHahah should only be played once.
    if (!this.hasWon) {
      Lemonke.linesSound.stop();
      Lemonke.linesSound.play("evilHahah");
    }
    this.hasWon = true;
  }
}

class Thing {
  // jshint ignore:start
  static image;
  static hitSound;
  static spawnNextAtMs = 0;
  static spawnCounter = 0;
  // jshint ignore:end

  constructor(i) {
    this.x = (width / 4) * i;
    this.y = -32;
    this.rotationRad = random(TWO_PI);
    this.speed = 0.05;
    this.rotationSpeed = random(0.005, 0.0005);
    this.rotationDirection = random(-1, 1);
    this.hit = false;
  }

  update() {
    this.y += gameDeltaTimeMs * this.speed;
    this.rotationRad +=
      this.rotationDirection * gameDeltaTimeMs * this.rotationSpeed;
  }

  draw() {
    push();
    translate(this.x + Thing.image.width / 2, this.y + Thing.image.width / 2);
    imageMode(CENTER);
    rotate(this.rotationRad);
    image(Thing.image, 0, 0);
    pop();
  }

  takeHit() {
    this.hit = true;
    Thing.hitSound.play();
  }

  static spawn(things) {
    if (Thing.spawnNextAtMs < gameTimeMs) {
      let i = pingPong(Thing.spawnCounter, 4);
      things.push(new Thing(i));
      if (i === 4) {
        Thing.spawnNextAtMs = gameTimeMs + 500;
      } else {
        Thing.spawnNextAtMs = gameTimeMs + 2000;
      }
      Thing.spawnCounter += 1;
    }
  }

  static cleanupInstances(things) {
    return things.filter((thing) => !thing.hit || thing.y > height + Thing.image.height);
  }
}

class ShakeEffect {
  constructor(durationMs = 100, speed = 0.06, magnitude = 10) {
    this.durationMs = durationMs;
    this.speed = speed;
    this.magnitude = magnitude;
    this.shakeUntilMs = 0;
    // this.decreaseFactor = 1;
  }

  shake() {
    this.shakeUntilMs = gameTimeMs + this.durationMs;
  }

  applyMatrix() {
    if (this.shakeUntilMs > gameTimeMs) {
      applyMatrix(
        1,
        0,
        0,
        1,
        (cos(gameTimeMs * this.speed) / PI) * this.magnitude,
        (sin(gameTimeMs * this.speed) / PI) * this.magnitude
      );
    }
  }
}

class HealthBar {
  // jshint ignore:start
  static height = 15;
  // jshint ignore:end

  constructor(top, barColor) {
    this.y = top ? 0 : height - HealthBar.height;

    this.foreColor = barColor;
    this.backColor = lerpColor(
      color(this.foreColor),
      color(backgroundColor),
      0.5
    );
  }

  draw(hp, maxHp) {
    fill(this.backColor);
    rect(0, this.y, width, HealthBar.height);

    fill(this.foreColor);
    rect(0, this.y, width * (hp / maxHp), HealthBar.height);
  }
}

const healthBarHeight = 15;
const safeYMargin = healthBarHeight;
const backgroundColor = [250, 245, 240];
const fontColor1 = [143, 116, 96];
const fontColor2 = [199, 145, 103];
const fontColor3 = [230, 145, 103];
const redColor = [191, 101, 101];
const greenColor = [122, 191, 101];
let isDebugModeOn = false;
let startGameCounter = 0;
let centerX;
let centerY;
let customFont;
let fartSound;
let winSound;
let loseSound;
let rockImage;

// Set in startGame().
let isGamePaused;
let isGameMuted;
let isGameWon;
let gameTimeMs;
let gameDeltaTimeMs;
let gameStage;
let monkey;
let lemonke;
let shakeEffect;
let rocks;

function preload() {
  customFont = loadFont("media/fredokaOne.otf");

  Monkey.spritesheet = loadImage("media/monkey.png");
  Dung.spritesheet = loadImage("media/dung.png");
  Lemonke.image = loadImage("media/lemonke.png");
  Thing.image = loadImage("media/coconut.png");

  // I wish I could've used the p5.sound library but I couldn't work around
  // https://github.com/processing/p5.js-sound/issues/284.
  Howler.volume(0.1);

  Monkey.throwSound = new Howl({
    src: "media/swooshes.ogg",
    sprite: Monkey.throwSoundSprites,
  });
  Monkey.crySound = new Howl({ src: "media/monkeyCry.ogg" });
  Dung.hitSound = new Howl({ src: "media/splat.ogg" });
  Lemonke.linesSound = new Howl({
    src: "media/uhOh.ogg",
    sprite: Lemonke.linesSoundSprite,
  });
  Thing.hitSound = new Howl({ src: "media/bonk.ogg" });

  fartSound = new Howl({ src: "media/fart.ogg" });
  winSound = new Howl({ src: "media/yay.ogg" });
  loseSound = new Howl({ src: "media/sadTrombone.ogg" });
}

function setup() {
  createCanvas(456, 608);

  centerX = width / 2;
  centerY = height / 2;

  textFont(customFont);
  textAlign(CENTER, CENTER);

  noStroke(); // for rect().

  startGame();
}

function startGame() {
  Howler.stop(); // for when starting over

  startGameCounter += 1;
  if (startGameCounter === 5) {
    console.info("＼(＾▽＾)／");
  }

  isGamePaused = false;
  isGameMuted = false;
  isGameWon = false;
  gameTimeMs = 0;
  gameDeltaTimeMs = 0;
  gameStage = "start";
  shakeEffect = new ShakeEffect();
  rocks = [];

  const yPadding = 40;
  monkey = new Monkey(
    (width - Monkey.width) / 2,
    height - Monkey.height - yPadding
  );
  lemonke = new Lemonke((width - Lemonke.width) / 2, yPadding);
}

function keyPressed() {
  switch (keyCode) {
    case ENTER:
      if (gameStage == "start") {
        gameStage = "beforeBattle";
      } else if (gameStage == "beforeBattle") {
        gameStage = "battle";
      } else if (gameStage == "end") {
        startGame();
      } else {
        return;
      }
      fartSound.play();
      break;
    case 88: // X key
      if (gameStage == "battle") {
        monkey.throwDung();
      }
      break;
    case 77: // M key
      isGameMuted = !isGameMuted;
      Howler.mute(isGameMuted);
      break;
    case 80: // P key
      isGamePaused = !isGamePaused;
      if (isGamePaused) {
        noLoop();
        Howler.mute(true);
      } else {
        loop();
        if (!isGameMuted) {
          Howler.mute(false);
        }
      }
      break;
    case 68: // letter D
      if (keyIsDown(SHIFT)) {
        isDebugModeOn = !isDebugModeOn;
        console.debug("isDebugModeOn:", isDebugModeOn);
      }
  }
}

function draw() {
  if (!isGamePaused) {
    // gameTimeMs and gameDeltaTimeMs allow the game to be paused, and slowed
    // down if it cannot run above 30 FPS.
    gameDeltaTimeMs = Math.min(deltaTime, (1 / 30) * 1000);
    gameTimeMs += gameDeltaTimeMs;
  }

  checkDebugMode();

  switch (gameStage) {
    case "start":
      drawStart();
      break;
    case "beforeBattle":
      drawBeforeBattle();
      break;
    case "battle":
      drawBattle();
      break;
    case "end":
      drawEnd();
      break;
  }
}

function checkDebugMode() {
  if (!isDebugModeOn) {
    return;
  }

  // letter K for kill
  if (keyIsDown(75)) {
    if (keyIsDown(SHIFT)) {
      monkey.hp = 1;
      monkey.takeHit();
    } else {
      lemonke.hp = 1;
      lemonke.takeHit();
    }
  }

  // letter R for restart
  if (keyIsDown(82)) {
    startGame();
  }

  // letter S for shake
  if (keyIsDown(83)) {
    shakeEffect.shake();
  }
}

function drawStart() {
  background(backgroundColor);

  fill(fontColor1);
  textSize(38);
  text("Monke Project", centerX, centerY - 40);

  fill(fontColor2);
  pingPongTextSize(24, 28);
  text("Press Enter to start", centerX, centerY + 40);
}

function pingPongTextSize(from, to, speed = 0.001) {
  textSize(smootherStep(from, to, pingPong(gameTimeMs * speed, 1)));
}

function drawBeforeBattle() {
  background(backgroundColor);

  fill(fontColor1);
  textSize(38);
  text("Controls", centerX, centerY - 100);

  fill(fontColor3);
  textSize(24);
  text("Use arrow keys to move", centerX, centerY - 50);
  text("Press X to throw dung", centerX, centerY - 20);
  text("Press P to pause", centerX, centerY + 10);
  text("Press M to mute", centerX, centerY + 40);

  fill(fontColor2);
  pingPongTextSize(24, 28);
  text("Press Enter to play", centerX, centerY + 90);
}

function drawBattle() {
  background(backgroundColor);

  push();
  shakeEffect.applyMatrix();

  Thing.spawn(rocks)

  for (const rock of rocks) {
    rock.update();
    checkRockMonkeyCollision(rock);
    rock.draw();
  }

  rocks = Thing.cleanupInstances(rocks);

  for (const dung of monkey.dungs) {
    dung.update();
    checkDungLemonkeCollision(dung);
    dung.draw();
  }

  lemonke.update();
  monkey.update();
  checkLemonkeMonkeyCollision();

  checkWinOrLose();

  lemonke.draw();
  monkey.draw();

  pop();
}

function drawEnd() {
  background(backgroundColor);

  fill(fontColor1);
  textSize(38);
  text(isGameWon ? "You win!" : "Game over!", centerX, centerY - 40);

  fill(fontColor2);
  pingPongTextSize(24, 28);
  text("Press Enter to start over", centerX, centerY + 40);
}

function checkLemonkeMonkeyCollision() {
  const rect1 = {
    x: monkey.x,
    y: monkey.y,
    width: Monkey.width,
    height: Monkey.height,
  };
  const rect2 = {
    x: lemonke.x,
    y: lemonke.y,
    width: Lemonke.width,
    height: Lemonke.height,
  };
  if (!lemonke.hasWon && intersectRect(rect1, rect2)) {
    monkey.takeThrow();
    lemonke.won();
  }
}

function checkDungLemonkeCollision(dung) {
  const rect1 = {
    x: dung.x,
    y: dung.y,
    width: Dung.width,
    height: Dung.height,
  };
  const rect2 = {
    x: lemonke.x,
    y: lemonke.y,
    width: Lemonke.width,
    height: Lemonke.height,
  };
  if (intersectRect(rect1, rect2)) {
    dung.takeHit();
    lemonke.takeHit();
  }
}

function checkRockMonkeyCollision(rock) {
  const rect1 = { x: rock.x, y: rock.y, width: 32, height: 32 };
  const rect2 = {
    x: monkey.x,
    y: monkey.y,
    width: Monkey.width,
    height: Monkey.height,
  };
  if (intersectRect(rect1, rect2)) {
    rock.takeHit();
    monkey.takeHit();
  }
}

// Return whether two axis-aligned rects intersect.
function intersectRect(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.height + rect1.y > rect2.y
  );
}

function checkWinOrLose() {
  if (lemonke.hp === 0) {
    lemonke.lost();
    winSound.play();
    isGameWon = true;
  } else if (monkey.hp === 0) {
    lemonke.won();
    loseSound.play();
  } else {
    return;
  }
  gameStage = "end";
}
