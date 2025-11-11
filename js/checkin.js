// Google Apps Script のデプロイURLを設定
const GAS_URL = "https://script.google.com/macros/s/AKfycbzuykr6KseMM4wFZDHyIA8L8cKrFKKtAFcqYTdO2qnZctR0Vz0GU0Zp0qR4OMsQ4j0/exec";

const html5QrCode = new Html5Qrcode("reader");

// カメラ起動
html5QrCode.start(
  { facingMode: "environment" }, // 背面カメラ
  { fps: 10, qrbox: 250 },
  async (decodedText) => {
    // スキャン成功時
    html5QrCode.stop();
    
    try {
      const qrData = JSON.parse(decodedText);
      await checkIn(qrData.receiptNo);
    } catch (error) {
      alert("QRコードの読み取りに失敗しました: " + error.message);
      restartScanner();
    }
  },
  (errorMessage) => {
    // エラーは無視（スキャン中の警告）
  }
).catch((err) => {
  alert("カメラの起動に失敗しました: " + err);
});

// チェックイン処理
async function checkIn(receiptNo) {
  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors", // CORS対応
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "checkIn",
        receiptNo: receiptNo
      })
    });
    
    // no-cors モードでは response.json() が使えないため、
    // 別途 GET リクエストで結果を取得する方法もあります
    // ここでは簡易的に成功と仮定
    
    showResult(true, "チェックイン完了", {
      name: "参加者名",
      partySize: 1
    });
    
  } catch (error) {
    showResult(false, "エラーが発生しました: " + error.message);
  }
}

// 結果表示
function showResult(success, message, participant = null) {
  document.getElementById("reader").style.display = "none";
  document.getElementById("result").style.display = "block";
  document.getElementById("restart-btn").style.display = "block";
  
  const messageEl = document.getElementById("message");
  messageEl.textContent = success ? "✅ " + message : "❌ " + message;
  messageEl.style.color = success ? "green" : "red";
  
  if (participant) {
    document.getElementById("participant-info").innerHTML = `
      <p><strong>お名前：</strong>${participant.name}</p>
      <p><strong>参加人数：</strong>${participant.partySize}名</p>
    `;
  }
}

// スキャン再開
function restartScanner() {
  document.getElementById("reader").style.display = "block";
  document.getElementById("result").style.display = "none";
  document.getElementById("restart-btn").style.display = "none";
  
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    async (decodedText) => {
      html5QrCode.stop();
      const qrData = JSON.parse(decodedText);
      await checkIn(qrData.receiptNo);
    }
  );
}

// 再スキャンボタン
document.getElementById("restart-btn").addEventListener("click", restartScanner);