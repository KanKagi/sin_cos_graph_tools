// ----------------------------------------------------
// 定数と変数
// ----------------------------------------------------
let angle = 0;
let targetAngle = 0;
let isMoving = false;

let radius;
let cx, cy;
let pixelsPerRadian;

// UI配置用変数
let btnSize;
let btnLeftX, btnLeftY;
let btnRightX, btnRightY;
let panelX, panelY, panelW, panelH;

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

  calculateLayout();
  targetAngle = 0;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateLayout();
}

// --- レイアウト計算 ---
function calculateLayout() {
  let isPortrait = height > width;

  // 1. 円とグラフの配置
  if (isPortrait) {
    // 縦向き: 円は左上
    radius = width * 0.20; 
    cx = width * 0.35;     
    cy = height * 0.25;    
  } else {
    // 横向き: 円は左中央
    radius = min(width, height) * 0.18; 
    cx = width * 0.3; 
    cy = height * 0.45;
  }
  pixelsPerRadian = (radius * 2.5) / TWO_PI; 

  // 2. 操作ボタンの配置 (画面下部の左右)
  btnSize = isPortrait ? width * 0.18 : height * 0.18; // 画面サイズに応じて調整
  btnSize = constrain(btnSize, 60, 120); // 大きすぎず小さすぎず

  let margin = 20;
  
  // 左ボタン (画面左下)
  btnLeftX = margin;
  btnLeftY = height - btnSize - margin;

  // 右ボタン (画面右下)
  btnRightX = width - btnSize - margin;
  btnRightY = height - btnSize - margin;

  // 3. 数値パネルの配置 (ボタンの間、または少し上)
  panelH = 130;
  // ボタンに重ならないように幅を制限
  let availableWidth = width - (btnSize * 2 + margin * 4);
  panelW = min(320, max(200, availableWidth)); 
  
  // 横向きならボタンの間、縦向きで幅が狭すぎればボタンの上に配置
  if (availableWidth < 220) {
    // 幅が狭い場合(スマホ縦持ちなど): ボタンの上に配置
    panelX = (width - panelW) / 2;
    panelY = btnLeftY - panelH - 10;
  } else {
    // 幅に余裕がある場合: ボタンの間に配置
    panelX = (width - panelW) / 2;
    panelY = height - panelH - 20;
  }
}

// ----------------------------------------------------
// メインループ
// ----------------------------------------------------
function draw() {
  background(10, 10, 30);
  
  // --- 1. 操作処理 ---
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
  let graphLen = max(width, height);
  stroke(0, 255, 0, 150); strokeWeight(2);
  line(circleX, circleY, graphLen, circleY);
  fill(0, 255, 0); ellipse(circleX, circleY, 10, 10);

  stroke(255, 0, 255, 150);
  line(circleX, circleY, circleX, graphLen);
  fill(255, 0, 255); ellipse(circleX, circleY, 10, 10);
  
  pop();

  // --- 4. UIとコントローラー表示 ---
  drawUI(locked);
  drawController();
}

// ----------------------------------------------------
// コントロールロジック (ボタン対応)
// ----------------------------------------------------
function updateControl() {
  let inputRight = false;
  let inputLeft = false;

  // キーボード操作
  if (keyIsDown(RIGHT_ARROW)) inputRight = true;
  if (keyIsDown(LEFT_ARROW)) inputLeft = true;

  // タッチ/マウス操作 (ボタン判定)
  if (mouseIsPressed) {
    // 左ボタンの判定 (矩形当たり判定)
    if (mouseX > btnLeftX && mouseX < btnLeftX + btnSize &&
        mouseY > btnLeftY && mouseY < btnLeftY + btnSize) {
      inputLeft = true;
    }
    // 右ボタンの判定
    if (mouseX > btnRightX && mouseX < btnRightX + btnSize &&
        mouseY > btnRightY && mouseY < btnRightY + btnSize) {
      inputRight = true;
    }
  }
  
  // 動きの適用
  if (inputRight) {
    angle += ROTATE_SPEED;
    isMoving = true;
  } else if (inputLeft) {
    angle -= ROTATE_SPEED;
    isMoving = true;
  } else {
    // 入力なし: スナップ処理
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

  // 桁あふれ防止
  if (isMoving) {
    if (angle > TWO_PI * 100) angle -= TWO_PI * 100;
    if (angle < -TWO_PI * 100) angle += TWO_PI * 100;
  }
}

// ----------------------------------------------------
// 描画: コントローラーボタン
// ----------------------------------------------------
function drawController() {
  // 共通スタイル
  textAlign(CENTER, CENTER);
  textSize(btnSize * 0.5);
  noStroke();

  // 左ボタン判定と描画
  let isLeftActive = (mouseIsPressed && mouseX > btnLeftX && mouseX < btnLeftX + btnSize && mouseY > btnLeftY && mouseY < btnLeftY + btnSize) || keyIsDown(LEFT_ARROW);
  
  fill(255, isLeftActive ? 150 : 50); // 押したら明るく
  rect(btnLeftX, btnLeftY, btnSize, btnSize, 15); // 角丸
  fill(255);
  text("↺", btnLeftX + btnSize/2, btnLeftY + btnSize/2 - 3);

  // 右ボタン判定と描画
  let isRightActive = (mouseIsPressed && mouseX > btnRightX && mouseX < btnRightX + btnSize && mouseY > btnRightY && mouseY < btnRightY + btnSize) || keyIsDown(RIGHT_ARROW);

  fill(255, isRightActive ? 150 : 50);
  rect(btnRightX, btnRightY, btnSize, btnSize, 15);
  fill(255);
  text("↻", btnRightX + btnSize/2, btnRightY + btnSize/2 - 3);
}

// ----------------------------------------------------
// 描画: UIパネル
// ----------------------------------------------------
function drawUI(locked) {
  let dispAngle = targetAngle;
  if (!locked) dispAngle = angle; 
  
  dispAngle = dispAngle % TWO_PI;
  if (dispAngle < 0) dispAngle += TWO_PI;
  if (abs(dispAngle - round(dispAngle/(PI/12))*(PI/12)) < 0.001) {
    dispAngle = round(dispAngle/(PI/12))*(PI/12);
  }

  // 背景パネル
  if (locked) {
    fill(0, 0, 0, 200); stroke(255, 255, 0); strokeWeight(2);
  } else {
    fill(0, 0, 0, 150); noStroke();
  }
  rect(panelX, panelY, panelW, panelH, 10);

  // 角度表示
  noStroke();
  fill(255, 255, 0); textSize(24); textAlign(LEFT, TOP);
  text("θ = " + nf(degrees(dispAngle), 0, 0) + "°", panelX + 20, panelY + 15);
  
  if (locked) {
    fill(255, 200, 0); textSize(12);
    text("LOCKED", panelX + 150, panelY + 18);
  }

  let valSin = getExactTrigValue(dispAngle, true);
  let valCos = getExactTrigValue(dispAngle, false);

  let startY = panelY + 50;
  fill(0, 255, 0); textSize(20);
  text("sinθ =", panelX + 20, startY);
  drawBeautifulFraction(valSin, panelX + 90, startY);

  startY = panelY + 90;
  fill(255, 0, 255); textSize(20);
  text("cosθ =", panelX + 20, startY);
  drawBeautifulFraction(valCos, panelX + 90, startY);
}

// ----------------------------------------------------
// 共通ヘルパー関数
// ----------------------------------------------------
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