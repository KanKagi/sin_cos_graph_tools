// ----------------------------------------------------
// 定数と変数
// ----------------------------------------------------
let angle = 0;
let targetAngle = 0;
let isMoving = false;

let radius;
let cx, cy;            // 円の中心座標
let pixelsPerRadian;
let graphLength;

// 操作パラメータ
const ROTATE_SPEED = 0.05; 
const SNAP_SPEED = 0.2;    

// 特殊角リスト
let specialAngles = [];

// ----------------------------------------------------
// 初期設定
// ----------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  
  specialAngles = [
    0, PI/6, PI/4, PI/3, PI/2, 2*PI/3, 3*PI/4, 5*PI/6, PI,
    7*PI/6, 5*PI/4, 4*PI/3, 3*PI/2, 5*PI/3, 7*PI/4, 11*PI/6, TWO_PI
  ];

  // 起動時の画面サイズに合わせてレイアウト計算
  calculateLayout();
  targetAngle = 0;
}

// 画面サイズが変わったとき（回転したとき）に再計算
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateLayout();
}

// --- レイアウト自動調整ロジック ---
function calculateLayout() {
  // 縦長(Portrait)か横長(Landscape)か判定
  let isPortrait = height > width;

  if (isPortrait) {
    // 【縦向き】の場合
    // 円を「左上」に寄せることで、右と下のスペースを確保
    radius = width * 0.22; // 幅基準で少し大きめに
    cx = width * 0.35;     // 左寄せ
    cy = height * 0.30;    // 上寄せ
  } else {
    // 【横向き】の場合
    // 従来どおり、少し左・上下中央
    radius = min(width, height) * 0.20; 
    cx = width * 0.35; 
    cy = height * 0.5;
  }
  
  graphLength = max(width, height); // 十分な長さを確保
  pixelsPerRadian = (radius * 2.5) / TWO_PI; 
}

// ----------------------------------------------------
// メインループ
// ----------------------------------------------------
function draw() {
  background(10, 10, 30);
  
  // --- 1. 操作と動きの制御 ---
  updateControl();

  push();
  translate(cx, cy);

  // --- 2. グラフと単位円の描画 ---
  let currentScale = pixelsPerRadian; 

  drawMovingSinGraph(currentScale);
  drawMovingCosGraph(currentScale);
  drawAxesAndCircle();

  // --- 3. 現在の点と連動線 ---
  let circleX = radius * cos(angle);
  let circleY = radius * sin(-angle); 

  // 半径線
  stroke(255, 255, 0); strokeWeight(2);
  line(0, 0, circleX, circleY);

  // ロック判定
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
  
  // 連動線
  stroke(0, 255, 0, 150); strokeWeight(2);
  line(circleX, circleY, graphLength, circleY);
  fill(0, 255, 0); ellipse(circleX, circleY, 10, 10);

  stroke(255, 0, 255, 150);
  line(circleX, circleY, circleX, graphLength);
  fill(255, 0, 255); ellipse(circleX, circleY, 10, 10);
  
  pop();

  // --- 4. UI表示 ---
  drawUI(locked);
  
  // --- 5. タッチガイド ---
  drawTouchGuides();
}

// ----------------------------------------------------
// コントロールロジック
// ----------------------------------------------------
function updateControl() {
  let inputRight = false;
  let inputLeft = false;

  if (keyIsDown(RIGHT_ARROW)) inputRight = true;
  if (keyIsDown(LEFT_ARROW)) inputLeft = true;

  if (mouseIsPressed) {
    // 画面の半分より右なら右回転、左なら左回転
    if (mouseX > width / 2) {
      inputRight = true;
    } else {
      inputLeft = true;
    }
  }
  
  if (inputRight) {
    angle += ROTATE_SPEED;
    isMoving = true;
  } else if (inputLeft) {
    angle -= ROTATE_SPEED;
    isMoving = true;
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

  if (isMoving) {
    if (angle > TWO_PI * 100) angle -= TWO_PI * 100;
    if (angle < -TWO_PI * 100) angle += TWO_PI * 100;
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

// ----------------------------------------------------
// 描画関数群
// ----------------------------------------------------
function drawAxesAndCircle() {
  stroke(60, 60, 90); strokeWeight(1);
  // 画面全体をカバーするように長く線を引く
  let maxDim = max(width, height);
  line(-maxDim, 0, maxDim, 0);
  line(0, -maxDim, 0, maxDim);

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
  // 描画範囲を画面サイズに合わせて動的に調整
  let drawLimit = width / scale + 1; 
  for (let t = angle; t < angle + drawLimit; t += 0.05) {
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
  let drawLimit = height / scale + 1;
  for (let t = angle; t < angle + drawLimit; t += 0.05) {
    let y = (t - angle) * scale;
    if (y >= 0) {
      let x = radius * cos(t);
      vertex(x, y);
    }
  }
  endShape();
}

// ----------------------------------------------------
// UI・ガイド表示
// ----------------------------------------------------
function drawUI(locked) {
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
  
  // UIパネルの位置調整
  // 縦持ちのときは少し下に余裕を持たせる
  let panelW = min(300, width * 0.8);
  let panelH = 130;
  let panelX = (width > height) ? 10 : (width - panelW) / 2; // 縦持ちなら中央揃え
  
  rect(panelX, height - panelH - 20, panelW, panelH, 10);

  noStroke();
  fill(255, 255, 0); textSize(24);
  text("θ = " + nf(degrees(dispAngle), 0, 0) + "°", panelX + 15, height - panelH + 10);
  
  if (locked) {
    fill(255, 200, 0); textSize(12);
    text("LOCKED", panelX + 140, height - panelH + 10);
  }

  let valSin = getExactTrigValue(dispAngle, true);
  let valCos = getExactTrigValue(dispAngle, false);

  let startY = height - panelH + 45;
  fill(0, 255, 0); textSize(20);
  text("sinθ =", panelX + 15, startY);
  drawBeautifulFraction(valSin, panelX + 80, startY);

  startY = height - panelH + 85;
  fill(255, 0, 255); textSize(20);
  text("cosθ =", panelX + 15, startY);
  drawBeautifulFraction(valCos, panelX + 80, startY);
}

function drawTouchGuides() {
  if (isMoving) return;

  fill(255, 255, 255, 30); noStroke();
  textSize(40); textAlign(CENTER, CENTER);
  
  // ガイドもレイアウトに合わせて少し調整
  let guideY = height / 2;
  if (height > width) guideY = height * 0.6; // 縦持ちなら少し下に表示

  text("↺", width * 0.1, guideY);
  textSize(12);
  text("Touch", width * 0.1, guideY + 40);

  textSize(40);
  text("↻", width * 0.9, guideY);
  textSize(12);
  text("Touch", width * 0.9, guideY + 40);
}

function drawBeautifulFraction(v, x, y) {
  push();
  textAlign(LEFT, CENTER); textSize(20); noStroke();
  
  if (!v.isFraction) {
    text(v.numerator, x, y + 8);
  } else {
    let numY = y - 6;
    let denY = y + 22;
    let lineY = y + 10;
    text(v.numerator, x + 4, numY);
    text(v.denominator, x + 4, denY);
    strokeWeight(2); stroke(255); 
    let lineW = max(textWidth(v.numerator), textWidth(v.denominator));
    line(x, lineY, x + lineW + 8, lineY);
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