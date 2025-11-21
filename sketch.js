let angle = 0;          // 現在の角度
let targetAngle = 0;    // 目標とする角度 (スナップ先)
let isMoving = false;   // 操作中フラグ

let radius;             // 単位円の半径
let cx, cy;             // 中心座標
let pixelsPerRadian;    // グラフのスケール
let graphLength;        // グラフ描画長

const ROTATE_SPEED = 0.05; // 回転速度
const SNAP_SPEED = 0.2;    // 吸着時の補間スピード

let specialAngles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  
  specialAngles = [
    0, PI/6, PI/4, PI/3, PI/2, 2*PI/3, 3*PI/4, 5*PI/6, PI,
    7*PI/6, 5*PI/4, 4*PI/3, 3*PI/2, 5*PI/3, 7*PI/4, 11*PI/6, TWO_PI
  ];

  calculateLayout();
  
  // 初期ターゲット
  targetAngle = 0;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateLayout();
}

function calculateLayout() {
  radius = min(width, height) * 0.22; 
  cx = width * 0.4;
  cy = height * 0.45;
  graphLength = max(width, height);
  pixelsPerRadian = (radius * 2.5) / TWO_PI; 
}

function draw() {
  background(10, 10, 30);
  
  updateControl();

  let freqMultiplier = map(mouseX, 0, width, 2.0, 0.5);
  let currentScale = pixelsPerRadian * freqMultiplier;

  push();
  translate(cx, cy);

  drawMovingSinGraph(currentScale);
  drawMovingCosGraph(currentScale);
  drawAxesAndCircle();

  let circleX = radius * cos(angle);
  let circleY = radius * sin(-angle); 

  stroke(255, 255, 0); strokeWeight(2);
  line(0, 0, circleX, circleY);

  let locked = (!isMoving && abs(angle - targetAngle) < 0.001);
  if (locked) {
    fill(255, 255, 0); noStroke();
    ellipse(circleX, circleY, 20, 20);

    stroke(255, 255, 0, 100); strokeWeight(2); noFill();
    ellipse(circleX, circleY, 30, 30);
  } else {
    fill(255, 50, 50); noStroke();
    ellipse(circleX, circleY, 16, 16);
  }
  
  stroke(0, 255, 0, 150); strokeWeight(2);
  line(circleX, circleY, graphLength, circleY);
  fill(0, 255, 0); ellipse(circleX, circleY, 10, 10);

  stroke(255, 0, 255, 150);
  line(circleX, circleY, circleX, graphLength);
  fill(255, 0, 255); ellipse(circleX, circleY, 10, 10);
  
  pop();

  drawUI(locked);
}

function updateControl() {
  let keyInput = false;
  
  if (keyIsDown(RIGHT_ARROW)) {
    angle += ROTATE_SPEED;
    keyInput = true;
  } else if (keyIsDown(LEFT_ARROW)) {
    angle -= ROTATE_SPEED;
    keyInput = true;
  }
  
  if (keyInput) {
    isMoving = true;
    // 桁あふれ防止
    if (angle > TWO_PI * 100) angle -= TWO_PI * 100;
    if (angle < -TWO_PI * 100) angle += TWO_PI * 100;
    
  } else {
    if (isMoving) {
      targetAngle = findClosestSpecialAngle(angle);
      isMoving = false;
    }
    
    if (abs(angle - targetAngle) > 0.0001) {
      angle = lerp(angle, targetAngle, SNAP_SPEED);
    } else {
      angle = targetAngle; 
    }
  }
}

function findClosestSpecialAngle(current) {
  let normalized = current % TWO_PI;
  if (normalized < 0) normalized += TWO_PI;
  
  let closestDist = 1000;
  let bestAngleNormalized = 0;
  
  for (let sa of specialAngles) {
    let dist = abs(normalized - sa);
    if (dist > PI) dist = TWO_PI - dist;
    
    if (dist < closestDist) {
      closestDist = dist;
      bestAngleNormalized = sa;
    }
  }
  
  let currentBase = current - normalized; 
  if (current < 0 && current % TWO_PI != 0) currentBase = current - (normalized - TWO_PI);

  let candidate1 = floor(current / TWO_PI) * TWO_PI + bestAngleNormalized;
  let candidate2 = candidate1 + TWO_PI;
  let candidate3 = candidate1 - TWO_PI;
  
  let d1 = abs(current - candidate1);
  let d2 = abs(current - candidate2);
  let d3 = abs(current - candidate3);
  
  if (d1 <= d2 && d1 <= d3) return candidate1;
  if (d2 <= d1 && d2 <= d3) return candidate2;
  return candidate3;
}

function drawAxesAndCircle() {
  stroke(60, 60, 90); strokeWeight(1);
  line(-width, 0, width, 0);
  line(0, -height, 0, height);

  noFill(); stroke(0, 255, 255); strokeWeight(2);
  ellipse(0, 0, radius * 2, radius * 2);
  
  for (let theta of specialAngles) {
    let sx = radius * cos(theta);
    let sy = radius * sin(-theta);
    stroke(255, 255, 255, 80); strokeWeight(1);
    line(0, 0, sx * 1.1, sy * 1.1); 
  }
}

function drawMovingSinGraph(scale) {
  noFill(); stroke(0, 255, 0); strokeWeight(2);
  beginShape();
  for (let t = angle; t < angle + (width / scale) + 1; t += 0.05) {
    let x = (t - angle) * scale;
    if (x >= 0) {
      let y = radius * sin(-t);
      vertex(x, y);
    }
  }
  endShape();
}

function drawMovingCosGraph(scale) {
  noFill(); stroke(255, 0, 255); strokeWeight(2);
  beginShape();
  for (let t = angle; t < angle + (height / scale) + 1; t += 0.05) {
    let y = (t - angle) * scale;
    if (y >= 0) {
      let x = radius * cos(t);
      vertex(x, y);
    }
  }
  endShape();
}

function drawUI(locked) {
  fill(255); textAlign(LEFT, TOP); textSize(16); noStroke();
  text("Hold Arrow Keys to Rotate.", 20, 20);
  
  let dispAngle = targetAngle;
  if (!locked) dispAngle = angle; 
  
  dispAngle = dispAngle % TWO_PI;
  if (dispAngle < 0) dispAngle += TWO_PI;
  if (abs(dispAngle - round(dispAngle/(PI/12))*(PI/12)) < 0.001) {
    dispAngle = round(dispAngle/(PI/12))*(PI/12);
  }

  if (locked) {
    fill(0, 0, 0, 200); stroke(255, 255, 0); strokeWeight(2);
  } else {
    fill(0, 0, 0, 150); noStroke();
  }
  rect(10, height - 160, 360, 150, 10);

  fill(255, 255, 0); textSize(28); noStroke();
  text("θ = " + nf(degrees(dispAngle), 0, 0) + "°", 30, height - 140);
  
  if (locked) {
    fill(255, 200, 0); textSize(14);
    text("LOCKED", 200, height - 140);
  }

  let valSin = getExactTrigValue(dispAngle, true);
  let valCos = getExactTrigValue(dispAngle, false);

  let startY = height - 100;
  fill(0, 255, 0); textSize(24);
  text("sinθ =", 30, startY);
  drawBeautifulFraction(valSin, 110, startY);

  startY = height - 50;
  fill(255, 0, 255); textSize(24);
  text("cosθ =", 30, startY);
  drawBeautifulFraction(valCos, 110, startY);
}

function drawBeautifulFraction(v, x, y) {
  push();
  textAlign(LEFT, CENTER); textSize(24); noStroke();
  
  if (!v.isFraction) {
    text(v.numerator, x, y + 10);
  } else {
    let numY = y - 5;
    let denY = y + 25;
    let lineY = y + 12;
    text(v.numerator, x + 5, numY);
    text(v.denominator, x + 5, denY);
    strokeWeight(2); stroke(255); 
    let lineW = max(textWidth(v.numerator), textWidth(v.denominator));
    line(x, lineY, x + lineW + 10, lineY);
  }
  pop();
}

class TrigValue {
  constructor(n, d, f) {
    this.numerator = n; 
    this.denominator = d; 
    this.isFraction = f;
  }
}

function getExactTrigValue(ang, isSin) {
  let e = 0.01;
  let val = isSin ? sin(ang) : cos(ang);
  
  if (abs(val) < e) return new TrigValue("0", "", false);
  if (abs(val - 0.5) < e) return new TrigValue("1", "2", true);
  if (abs(val + 0.5) < e) return new TrigValue("-1", "2", true);
  if (abs(val - 1.0) < e) return new TrigValue("1", "", false);
  if (abs(val + 1.0) < e) return new TrigValue("-1", "", false);
  
  if (abs(val - sqrt(2)/2) < e) return new TrigValue("√2", "2", true);
  if (abs(val + sqrt(2)/2) < e) return new TrigValue("-√2", "2", true);
  if (abs(val - sqrt(3)/2) < e) return new TrigValue("√3", "2", true);
  if (abs(val + sqrt(3)/2) < e) return new TrigValue("-√3", "2", true);
  
  return new TrigValue(nf(val, 0, 2), "", false);
}