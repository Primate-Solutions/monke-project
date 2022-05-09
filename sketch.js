// "use strict";

console.debug(
  "Press Shift + D to enable debug mode controls (see keyPressed() for details)."
);
console.info("Have fun!");

// Globals.

const gameStages = ["start", "controls", "play", "end"];

let audioMuted = false;
let debugModeOn = false;
let gameStartCounter = 0;

// Init in preload().
let font;

// Init in setup().
let fartSound;
let winSound;
let loseSound;
let backgroundColor;
let fontColor1;
let fontColor2;
let fontColor3;
let greenColor;
let redColor;

// Init in startGame().
let gameStage;
let gameWon;
let ySpawnMargin;
let yMoveMargin;
let monkey;
let lemonke;
let itemRain;
let shakeEffect;
let centerX;
let centerY;
let playStartedAtMs;
let playDuration;
let hasNewBestTime;

class Monkey {
  // JSHint in editor.p5js.org doesn't yet support the use of static below.
  // jshint ignore:start
  static image;

  static crySound;
  static throwSound;

  static throwSoundSprites = {
    1: [0, 277],
    2: [277, 383],
  };

  static maxHp = 10;
  // jshint ignore:end

  static setupImage() {
    this.image.pause();
  }

  constructor() {
    this.facingDirection = -1; // -1 and 1 for left and right

    this.size = getSizeFromImage(this.constructor.image);
    this.position = createVector(
      centerX - this.size.x / 2,
      height - this.size.y - ySpawnMargin
    );
    this.velocity = createVector();

    this.hp = this.constructor.maxHp;
    this.healthBar = new HealthBar(
      this.hp / this.constructor.maxHp,
      false,
      greenColor
    );

    this.wasThrown = false;
    this.throwDirection = -1;

    this.displayRotationRad = 0;

    this.dungs = new Dungs();
    this.dungThrownAtMs = 0;
  }

  checkControls() {
    this.velocity.set(0, 0);
    if (keyIsDown(LEFT_ARROW)) {
      this.velocity.x = this.facingDirection = -1;
    } else if (keyIsDown(RIGHT_ARROW)) {
      this.velocity.x = this.facingDirection = 1;
    }
    if (keyIsDown(UP_ARROW)) {
      this.velocity.y = -1;
    } else if (keyIsDown(DOWN_ARROW)) {
      this.velocity.y = 1;
    }
    this.velocity.setMag(0.5); // speed

    // Letter X.
    if (keyIsDown(88)) {
      this.throwDung();
    }
  }

  throwDung() {
    if (millis() - this.dungThrownAtMs < 100 || this.wasThrown) {
      return;
    }

    const xMargin = 5;
    const offset =
      (this.facingDirection == -1 ? -xMargin : this.size.x - xMargin) -
      Dung.size.x / 2;
    const position = createVector(
      constrain(this.position.x + offset, 0, width - Dung.size.x),
      this.position.y - Dung.size.y * 0.75
    );

    const targetPosition = p5.Vector.add(
      lemonke.position,
      p5.Vector.div(lemonke.size, 2)
    );
    // FIXME: Tweak errorMag to encourage the player to move horizontally with
    // lemonke.
    const errorMag = max(0, 0.00167 * position.dist(targetPosition) + 0.03855);
    const error = random(-errorMag, errorMag);
    const direction = p5.Vector.sub(targetPosition, position).heading() + error;
    const velocity = createVector(cos(direction), sin(direction));
    const displayUnder = velocity.y < 0;
    this.dungs.arr.push(new Dung(position, velocity, displayUnder));

    this.dungThrownAtMs = millis();
    this.constructor.throwSound.play(
      random(Object.keys(this.constructor.throwSoundSprites))
    );
  }

  update() {
    this.dungs.update();

    if (this.wasThrown) {
      this.position.x += this.throwDirection * deltaTime;
      this.position.y -= deltaTime;
      this.displayRotationRad += deltaTime * 0.05;
    } else {
      this.position.add(p5.Vector.mult(this.velocity, deltaTime));
      this.position.x = constrain(this.position.x, 0, width - this.size.x);
      this.position.y = constrain(
        this.position.y,
        yMoveMargin,
        height - this.size.y - yMoveMargin
      );
    }

    this.healthBar.update(this.hp / this.constructor.maxHp);
  }

  display() {
    this.dungs.displayUnder();

    this.healthBar.display();

    push();
    translate(
      this.position.x + this.size.x / 2,
      this.position.y + this.size.y / 2
    );
    rotate(this.displayRotationRad);
    this.constructor.image.setFrame(max(0, this.facingDirection));
    imageMode(CENTER);
    image(this.constructor.image, 0, 0, this.size.x, this.size.y);
    pop();

    this.dungs.displayOver();
  }

  isDead() {
    return this.wasThrown ? abs(this.position.x) > width * 1.5 : this.hp === 0;
  }

  takeHit(hp) {
    if (this.wasThrown && hp > 0) {
      return;
    }
    this.hp = constrain(this.hp + hp, 0, this.constructor.maxHp);
    if (hp < 0) {
      shakeEffect.trigger();
    }
    this.healthBar.flash();
  }

  takeThrow() {
    if (this.wasThrown) {
      return;
    }

    this.hp = 0;
    this.wasThrown = true;
    // Throw monkey towards opp. side of the screen.
    this.throwDirection = this.position.x + this.size.x / 2 > centerX ? -1 : 1;
    this.constructor.crySound.play();
    shakeEffect.trigger({ durationMs: 200, magnitude: 100 });
    this.healthBar.flash();
  }
}

// TODO: Give Lemonke a special rock attack.
class Lemonke {
  // jshint ignore:start
  static image;

  static voiceSound;
  static throwSound;

  static voiceSoundSprites = {
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

  static randomSoundSprites = [
    "fart",
    "stinky",
    "poopAhah",
    "madePoopie",
    "funnyPoop",
  ];
  static hitSoundSprites = ["uhOh", "uhOh2", "oopsie"];

  static maxHp = 300;
  // jshint ignore:end

  constructor() {
    this.size = getSizeFromImage(this.constructor.image);
    this.position = createVector(centerX - this.size.x / 2, ySpawnMargin);
    this.newPosition = this.position;

    this.hp = this.constructor.maxHp;
    this.healthBar = new HealthBar(
      this.hp / this.constructor.maxHp,
      true,
      redColor
    );

    this.shakeEffect = new ShakeEffect();

    this.lastHitAtMs = 0;
    this.hasWon = false;

    this.moveAtMs = 0;
    this.movedAtMs = millis();

    this.speakAtMs = 0;
    this.spokeAtMs = 0;

    this.setNextMoveTime();
  }

  setNextSpeakTime() {
    this.speakAtMs = millis() + random(1000, 15000);
  }

  setNextMoveTime() {
    this.moveAtMs = millis() + random(4000, 8000);
  }

  update() {
    if (millis() > this.moveAtMs) {
      this.move();
      this.setNextMoveTime();
    }

    if (millis() > this.speakAtMs) {
      this.speakRandom(this.constructor.randomSoundSprites);
      this.setNextSpeakTime();
    }

    const speedMs = 300;
    this.position.lerp(
      this.newPosition,
      min(millis() - this.movedAtMs, speedMs) / speedMs
    );

    this.healthBar.update(this.hp / Lemonke.maxHp);
    this.shakeEffect.update();
  }

  move() {
    const xMargin = this.size.x * 0.3;
    const position = createVector(
      random(xMargin, width - this.size.x - xMargin),
      random(yMoveMargin + ySpawnMargin, height * 0.4 - yMoveMargin)
    );
    this.newPosition = position;
    this.movedAtMs = millis();
  }

  speakRandom(sprites) {
    if (millis() - this.spokeAtMs > 500) {
      this.constructor.voiceSound.play(random(sprites));
      this.spokeAtMs = millis();
    }
  }

  display() {
    push();
    applyMatrix(
      1,
      0,
      0,
      1,
      this.shakeEffect.transform.x,
      this.shakeEffect.transform.y
    );

    this.healthBar.display();

    if (this.lastHitAtMs) {
      const amount = constrain(millis() - this.lastHitAtMs, 0, 255);
      tint(255, amount, amount);
    }
    image(
      this.constructor.image,
      this.position.x,
      this.position.y,
      this.size.x,
      this.size.y
    );
    pop();
  }

  hasThrownMonkey() {
    this.win();
    this.constructor.throwSound.play();
  }

  isDead() {
    return this.hp === 0 && !this.hasWon;
  }

  takeHit(hp) {
    this.hp = constrain(this.hp + hp, 0, this.constructor.maxHp);
    if (hp < 0) {
      this.lastHitAtMs = millis();
      this.shakeEffect.trigger();
    }
    this.healthBar.flash();

    if (millis() - this.spokeAtMs < 1000) {
      return;
    }

    if (random(100) > 95) {
      this.speakRandom(this.constructor.hitSoundSprites);
    }
  }

  lose() {
    this.constructor.voiceSound.stop();
    this.constructor.voiceSound.play("pooEch");
  }

  win() {
    // This function might get called twice before the play stage ends and
    // evilHahah should only be played once.
    if (!this.hasWon) {
      this.constructor.voiceSound.stop();
      this.constructor.voiceSound.play("evilHahah");
    }
    this.hasWon = true;
  }
}

class Item {
  // jshint ignore:start
  static image;
  static hitSound;
  // jshint ignore:end

  constructor(position, velocity, hp) {
    this.size = getSizeFromImage(this.constructor.image);
    this.position = position;
    this.velocity = velocity;

    this.hp = hp;
    this.hit = false;

    this.displayRotationRad = 0;
    this.displayRotationSpeedFactor = random(0.005, 0.0005);
    this.displayRotationDirection = random(-1, 1);
  }

  update() {
    this.position.add(p5.Vector.mult(this.velocity, deltaTime));

    this.displayRotationRad +=
      this.displayRotationDirection *
      deltaTime *
      this.displayRotationSpeedFactor;
  }

  display() {
    push();
    translate(
      this.position.x + this.size.x / 2,
      this.position.y + this.size.y / 2
    );
    rotate(this.displayRotationRad);
    imageMode(CENTER);
    image(this.constructor.image, 0, 0, this.size.x, this.size.y);
    pop();
  }

  takeHit() {
    this.hit = true;
    this.constructor.hitSound.play();
  }
}

class Coconut extends Item {
  constructor(position, velocity) {
    super(position, velocity, -1);
  }
}

class Banana extends Item {
  constructor(position, velocity) {
    super(position, velocity, 1);
  }
}

class Dung extends Item {
  // jshint ignore:start
  static numImageFrames;
  static size;
  // jshint ignore:end

  static setupImage() {
    this.image.pause();
    this.numImageFrames = this.image.numFrames();
    this.size = createVector(this.image.width, this.image.height);
  }

  constructor(position, velocity, displayUnder) {
    super(position, velocity, -1);

    this.constructor.image.setFrame(
      floor(random(this.constructor.numImageFrames - 1))
    );
    this.image = this.constructor.image.get();

    this.displayUnder = displayUnder;
  }

  display() {
    image(
      this.image,
      this.position.x,
      this.position.y,
      this.size.x,
      this.size.y
    );
  }
}

class ShakeEffect {
  constructor() {
    this.durationMs = 100;
    this.magnitude = 15;
    this.speed = 0.06;
    this.transform = createVector();
    this.stopAtMs = 0;
  }

  update() {
    const t = millis() * this.speed;
    // FIXME: Use a mirrored exponential easing function to dampen shaking.
    const damping = this.stopAtMs > millis() ? 1 : 0;
    this.transform.x = (cos(t) / PI) * this.magnitude * damping;
    this.transform.y = (sin(t) / PI) * this.magnitude * damping;
  }

  trigger(props) {
    Object.assign(this, props);
    this.stopAtMs = millis() + this.durationMs;
  }
}

class HealthBar {
  // jshint ignore:start
  static height = 15;
  static flashDurationMs = 200;
  // jshint ignore:end

  constructor(health, onTop, fillColor) {
    this.health = health; // in the range [0, 1]

    this.yPosition = onTop ? 0 : height - HealthBar.height;
    this.width = width;

    this.fillColor = fillColor;
    this.emptyColor = lerpColor(this.fillColor, backgroundColor, 0.5);
    colorMode(HSB);
    this.flashColor = color(
      hue(this.fillColor),
      100,
      brightness(this.fillColor)
    );
    colorMode(RGB);

    this.flashUntilMs = 0;
  }

  update(health) {
    this.health = health;
    this.width = moveTowards(this.width, this.health * width, deltaTime * 2);
  }

  display() {
    fill(this.emptyColor);
    rect(0, this.yPosition, width, HealthBar.height);

    const lerpAmount =
      max(0, this.flashUntilMs - millis()) / this.constructor.flashDurationMs;
    fill(lerpColor(this.fillColor, this.flashColor, lerpAmount));
    rect(0, this.yPosition, this.width, HealthBar.height);
  }

  flash() {
    this.flashUntilMs = millis() + this.constructor.flashDurationMs;
  }
}

class Group {
  constructor(filterCallback) {
    this.filterCallback = filterCallback;
    this.arr = [];
  }

  update() {
    for (const el of this.arr) {
      el.update();
    }
    this.arr = this.arr.filter(this.filterCallback);
  }

  display() {
    for (const el of this.arr) {
      el.display();
    }
  }
}

class Dungs extends Group {
  constructor() {
    super((dung) => !dung.hit && dung.position.y + dung.size.y > 0);
  }

  displayUnder() {
    for (const dung of this.arr) {
      if (dung.displayUnder) {
        dung.display();
      }
    }
  }

  displayOver() {
    for (const dung of this.arr) {
      if (!dung.displayUnder) {
        dung.display();
      }
    }
  }
}

class ItemRain extends Group {
  constructor() {
    super((item) => !item.hit && item.position.y < height);

    this.nextSpawnAtMs = 0;
    this.startX = centerX;
  }

  spawnItem() {
    const position = createVector(
      pingPong(this.startX + millis() * 0.05 + random(-100, 100), width),
      -30
    );
    const error = random(-0.15, 0.15);
    const direction =
      p5.Vector.sub(monkey.position, position).heading() + error;
    const speed = 0.3;
    const velocity = createVector(cos(direction), sin(direction)).setMag(speed);
    if (random(100) > 90) {
      this.arr.push(new Banana(position, velocity));
    } else {
      this.arr.push(new Coconut(position, velocity));
    }
    const min = 250;
    const max = 1500;
    const hpAdjustedMax = max - (1 - lemonke.hp / Lemonke.maxHp) * (max - min);
    this.nextSpawnAtMs = millis() + random(min, hpAdjustedMax);
  }

  update() {
    super.update();

    if (this.nextSpawnAtMs < millis()) {
      this.spawnItem();
    }
  }
}

function getSizeFromImage(image) {
  return createVector(image.width, image.height);
}

function moveTowards(from, to, maxDelta) {
  if (abs(to - from) <= maxDelta) {
    return to;
  }
  return from + Math.sign(to - from) * maxDelta;
}

function preload() {
  font = loadFont("assets/fredokaOne.otf");

  Monkey.image = loadImage("assets/monkey.gif");
  Lemonke.image = loadImage("assets/lemonke.png");
  Coconut.image = loadImage("assets/coconut.png");
  Banana.image = loadImage("assets/banana.png");
  Dung.image = loadImage("assets/dung.gif");
}

function setup() {
  Monkey.setupImage();
  Dung.setupImage();

  // FIXME: Prevent startGame() from running before all sounds are loaded.
  //
  // howler.js is used instead of p5.sound because of this issue:
  // https://github.com/processing/p5.js-sound/issues/284.
  //
  // Unlike loadSound(), calls to Howl() inside preload() will not block
  // setup() from running, so don't place them there.
  //
  // Could the result of loadBytes() be turned into a base64 data URI and
  // passed to Howl() as a source? This could improve/fix the loading issue.
  fartSound = new Howl({ src: "assets/fart.ogg" });
  winSound = new Howl({ src: "assets/yay.ogg" });
  loseSound = new Howl({ src: "assets/sadTrombone.ogg" });
  Monkey.crySound = new Howl({ src: "assets/monkeyCry.ogg" });
  Monkey.throwSound = new Howl({
    src: "assets/swooshes.ogg",
    sprite: Monkey.throwSoundSprites,
  });
  Lemonke.voiceSound = new Howl({
    src: "assets/uhOh.ogg",
    sprite: Lemonke.voiceSoundSprites,
  });
  // TODO: Find a more impactful Lemonke.throwSound.
  Lemonke.throwSound = new Howl({ src: "assets/stickSwoosh.ogg" });
  Coconut.hitSound = new Howl({ src: "assets/bonk.ogg" });
  Banana.hitSound = new Howl({ src: "assets/nom.ogg" });
  Dung.hitSound = new Howl({ src: "assets/splat.ogg" });

  backgroundColor = color(250, 245, 240);
  fontColor1 = color(143, 116, 96);
  fontColor2 = color(199, 145, 103);
  fontColor3 = color(230, 145, 103);
  greenColor = color(122, 191, 101);
  redColor = color(191, 101, 101);

  createCanvas(450, 600);

  noStroke();

  textFont(font);
  textAlign(CENTER, CENTER);

  centerX = width / 2;
  centerY = height / 2;

  Howler.volume(0.1);

  startGame();
}

function startGame() {
  Howler.stop(); // for when starting over

  gameStage = "start";
  gameWon = false;

  ySpawnMargin = 40;
  yMoveMargin = HealthBar.height;

  monkey = new Monkey();
  lemonke = new Lemonke();
  itemRain = new ItemRain();
  shakeEffect = new ShakeEffect();

  playStartedAtMs = 0;
  playDuration = "";
  hasNewBestTime = false;

  gameStartCounter += 1;
  if (gameStartCounter === 5) {
    console.info("＼(＾▽＾)／");
  }
}

// TODO: Use P to pause and unpause the game, making sure to also pause and
// unpause audio (and not just stop or mute it).
function keyPressed() {
  switch (keyCode) {
    case ENTER:
      if (gameStage !== "play") {
        const i = (gameStages.indexOf(gameStage) + 1) % gameStages.length;
        if (gameStages[i] === "start") {
          startGame();
        } else {
          gameStage = gameStages[i];
        }
        fartSound.play();
      }
      break;
    case 77: // letter M for mute
      audioMuted = !audioMuted;
      Howler.mute(audioMuted);
      break;
    case 68: // letter D for debug
      if (keyIsDown(SHIFT)) {
        debugModeOn = !debugModeOn;
        console.debug("debugModeOn:", debugModeOn);
      }
      break;
  }

  if (!debugModeOn) {
    return;
  }

  switch (keyCode) {
    case 82: // letter R for restart
      startGame();
      break;
    case 80: // letter P for play
      startGame();
      gameStage = "play";
      break;
    case 72: // letter H for hit
      if (keyIsDown(SHIFT)) {
        monkey.takeHit(-1);
      } else {
        lemonke.takeHit(-1);
      }
      break;
    case 84: // letter T for throw
      monkey.takeThrow();
      break;
    case 75: // letter K for kill
      if (keyIsDown(SHIFT)) {
        monkey.hp = 1;
        monkey.takeHit(-1);
      } else {
        lemonke.hp = 1;
        lemonke.takeHit(-1);
      }
      break;
    case 83: // letter S for shake
      shakeEffect.shake();
      break;
    case 66: // letter B for best
      removeItem("bestTime"); // reset best time
      break;
  }
}

function draw() {
  background(backgroundColor);

  switch (gameStage) {
    case "start":
      drawStart();
      break;
    case "controls":
      drawControls();
      break;
    case "play":
      drawPlay();
      break;
    case "end":
      drawEnd();
      break;
  }
}

function drawStart() {
  fill(fontColor1);
  textSize(38);
  text("Monke Project", centerX, centerY - 40);

  fill(fontColor2);
  animateTextSize(24, 28);
  text("Press Enter to start", centerX, centerY + 40);
}

function animateTextSize(min, max) {
  textSize(smootherStep(min, max, pingPong(millis() * 0.001, 1)));
}

function pingPong(x, length) {
  x = repeat(x, length * 2);
  return length - abs(x - length);
}

function repeat(x, length) {
  return constrain(x - floor(x / length) * length, 0, length);
}

// More info: https://en.wikipedia.org/wiki/Smoothstep.
function smootherStep(from, to, x) {
  x = constrain(x, 0, 1);
  x = -2 * x * x * x + 3 * x * x;
  return to * x + from * (1 - x);
}

function drawControls() {
  fill(fontColor1);
  textSize(38);
  text("Controls", centerX, centerY - 85);

  fill(fontColor3);
  textSize(24);
  text("Use arrow keys to move", centerX, centerY - 35);
  text("Hold X to throw dung", centerX, centerY - 5);
  text("Press M to toggle mute", centerX, centerY + 25);

  fill(fontColor2);
  animateTextSize(24, 28);
  text("Press Enter to play", centerX, centerY + 75);
}

function drawPlay() {
  if (!playStartedAtMs) {
    playStartedAtMs = millis();
  }

  monkey.checkControls();

  itemRain.update();
  monkey.update();
  lemonke.update();
  shakeEffect.update();

  checkMonkeyItemCollision();
  checkLemonkeDungCollision();
  checkLemonkeMonkeyCollision();
  checkWinOrLose();

  push();
  applyMatrix(1, 0, 0, 1, shakeEffect.transform.x, shakeEffect.transform.y);

  itemRain.display();
  lemonke.display();
  monkey.display();

  pop();
}

// TODO: Show how many bananas were caught by monkey.
function drawEnd() {
  if (!playDuration) {
    const durationMs = millis() - playStartedAtMs;
    if (durationMs >= 3600000) {
      playDuration = "69:69";
    } else {
      playDuration = new Date(durationMs).toISOString().slice(14, -5);
    }

    const bestTime = getItem("bestTime");
    if (gameWon && (!bestTime || bestTime > durationMs)) {
      hasNewBestTime = true;
      storeItem("bestTime", durationMs);
    }
  }

  fill(fontColor1);
  textSize(38);
  text(gameWon ? "You win!" : "Game over!", centerX, centerY - 65);

  fill(fontColor3);
  textSize(24);
  text(
    hasNewBestTime ? "You have a new best time!" : "Your time",
    centerX,
    centerY - 15
  );
  text(playDuration, centerX, centerY + 15);

  fill(fontColor2);
  animateTextSize(24, 28);
  text("Press Enter to start over", centerX, centerY + 60);
}

function checkMonkeyItemCollision() {
  for (const item of itemRain.arr) {
    if (
      checkCollision(item.position, item.size, monkey.position, monkey.size)
    ) {
      item.takeHit();
      monkey.takeHit(item.hp);
    }
  }
}

// Check whether two axis-aligned rectangles intersect.
function checkCollision(position1, size1, position2, size2) {
  return (
    position1.x < position2.x + size2.x &&
    position1.x + size1.x > position2.x &&
    position1.y < position2.y + size2.y &&
    size1.y + position1.y > position2.y
  );
}

function checkLemonkeDungCollision() {
  for (const item of monkey.dungs.arr) {
    if (
      checkCollision(item.position, item.size, lemonke.position, lemonke.size)
    ) {
      item.takeHit();
      lemonke.takeHit(item.hp);
    }
  }
}

function checkLemonkeMonkeyCollision() {
  if (
    !lemonke.hasWon &&
    checkCollision(monkey.position, monkey.size, lemonke.position, lemonke.size)
  ) {
    monkey.takeThrow();
    lemonke.hasThrownMonkey();
  }
}

function checkWinOrLose() {
  if (monkey.isDead()) {
    lemonke.win();
    loseSound.play();
    gameWon = false;
  } else if (lemonke.isDead()) {
    lemonke.lose();
    winSound.play();
    gameWon = true;
  } else {
    return;
  }
  gameStage = "end";
}
