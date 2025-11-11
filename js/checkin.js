// ========================================
// 設定
// ========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbzuykr6KseMM4wFZDHyIA8L8cKrFKKtAFcqYTdO2qnZctR0Vz0GU0Zp0qR4OMsQ4j0/exec";

let html5QrCode;

// ========================================
// 初期化（修正版）
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  startScanner();
  setupRestartButton();
  setupManualCheckin(); // 追加
});

// ========================================
// 手動チェックイン
// ========================================
function setupManualCheckin() {
  const form = document.getElementById("manual-checkin-form");
  
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const receiptNo = document.getElementById("manual-receipt-no").value.trim();
    
    if (receiptNo) {
      // スキャナーを停止
      if (html5QrCode) {
        html5QrCode.stop();
      }
      
      // チェックイン処理
      await checkIn(receiptNo);
    }
  });
}

// ========================================
// QRコードスキャナー起動
// ========================================
function startScanner() {
  html5QrCode = new Html5Qrcode("reader");
  
  html5QrCode.start(
    { facingMode: "environment" }, // 背面カメラ
    {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    },
    async (decodedText) => {
      // スキャン成功時
      await handleScan(decodedText);
    },
    (errorMessage) => {
      // エラーは無視（スキャン中の警告）
    }
  ).catch((err) => {
    console.error("カメラの起動に失敗:", err);
    alert("カメラの起動に失敗しました。カメラへのアクセスを許可してください。");
  });
}

// ========================================
// QRコードスキャン処理
// ========================================
async function handleScan(decodedText) {
  // スキャナーを停止
  html5QrCode.stop();
  
  try {
    // QRコードデータを解析
    const qrData = JSON.parse(decodedText);
    
    // チェックイン処理
    await checkIn(qrData.receiptNo);
  } catch (error) {
    console.error("QRコード解析エラー:", error);
    showResult(false, "無効なQRコードです", null);
  }
}

// ========================================
// チェックイン処理
// ========================================
async function checkIn(receiptNo) {
  try {
    const result = await jsonpRequest(GAS_URL, {
      action: "checkIn",
      receiptNo: receiptNo
    });
    
    if (result.success) {
      showResult(true, "チェックイン完了", result.participant);
    } else {
      showResult(false, result.message, result.participant);
    }
  } catch (error) {
    console.error("チェックインエラー:", error);
    showResult(false, "チェックインに失敗しました", null);
  }
}

// ========================================
// JSONP リクエスト
// ========================================
function jsonpRequest(url, params) {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonpCallback' + Date.now();
    const script = document.createElement('script');
    
    window[callbackName] = (data) => {
      delete window[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };
    
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    script.src = `${url}?${queryString}&callback=${callbackName}`;
    script.onerror = () => {
      delete window[callbackName];
      document.body.removeChild(script);
      reject(new Error('JSONP request failed'));
    };
    
    document.body.appendChild(script);
  });
}

// ========================================
// 結果表示
// ========================================
function showResult(success, message, participant) {
  // チェックイン画面を非表示
  document.getElementById("checkin-screen").style.display = "none";
  
  // 結果画面を表示
  document.getElementById("result-screen").style.display = "block";
  
  // タイトル設定
  const title = document.getElementById("result-title");
  title.textContent = success ? "✅ " + message : "❌ " + message;
  title.style.color = success ? "green" : "red";
  
  // メッセージ設定
  const messageEl = document.getElementById("result-message");
  
  if (participant) {
    messageEl.innerHTML = `
      <p><strong>受付番号：</strong>${participant.receiptNo}</p>
      <p><strong>お名前：</strong>${participant.name}</p>
      <p><strong>フリガナ：</strong>${participant.furigana}</p>
      <p><strong>参加人数：</strong>${participant.partySize}名</p>
      ${participant.checkInAt ? `<p><strong>チェックイン日時：</strong>${participant.checkInAt}</p>` : ''}
    `;
  } else {
    messageEl.innerHTML = `<p>${message}</p>`;
  }
}

// ========================================
// 再スキャンボタン
// ========================================
function setupRestartButton() {
  document.getElementById("restart-btn").addEventListener("click", () => {
    // 結果画面を非表示
    document.getElementById("result-screen").style.display = "none";
    
    // チェックイン画面を表示
    document.getElementById("checkin-screen").style.display = "block";
    
    // スキャナーを再起動
    startScanner();
  });
}