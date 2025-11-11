// ========================================
// 設定
// ========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbzuykr6KseMM4wFZDHyIA8L8cKrFKKtAFcqYTdO2qnZctR0Vz0GU0Zp0qR4OMsQ4j0/exec";
// ↑ Google Apps Script のデプロイURLに置き換えてください

// ========================================
// 初期化
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  loadEvents();
  setupFormSubmit();
});

// ========================================
// イベント一覧取得
// ========================================
async function loadEvents() {
  try {
    const response = await fetch(`${GAS_URL}?action=getEvents`);
    const result = await response.json();
    
    const select = document.getElementById("event-select");
    select.innerHTML = '<option value="">イベントを選択してください</option>';
    
    if (result.success && result.events) {
      result.events.forEach(event => {
        // 「受付中」のイベントのみ表示
        if (event.status === "受付中") {
          const option = document.createElement("option");
          option.value = event.eventId;
          option.textContent = `${event.eventName}（${formatDate(event.eventDate)}）`;
          select.appendChild(option);
        }
      });
    }
  } catch (error) {
    console.error("イベント一覧の取得に失敗:", error);
    alert("イベント一覧の取得に失敗しました。ページを再読み込みしてください。");
  }
}

// ========================================
// フォーム送信処理
// ========================================
function setupFormSubmit() {
  const form = document.getElementById("registration-form");
  
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // ボタンを無効化（二重送信防止）
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "登録中...";
    
    // フォームデータ取得
    const formData = {
      action: "register",
      eventId: document.getElementById("event-select").value,
      name: document.getElementById("name").value,
      furigana: document.getElementById("furigana").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      partySize: parseInt(document.getElementById("party-size").value)
    };
    
    try {
      // Google Apps Script に送信
      const response = await fetch(GAS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 登録成功
        showCompleteScreen(result, formData);
      } else {
        // 登録失敗
        alert("登録に失敗しました: " + result.message);
        submitBtn.disabled = false;
        submitBtn.textContent = "登録する";
      }
    } catch (error) {
      console.error("登録エラー:", error);
      alert("登録に失敗しました。もう一度お試しください。");
      submitBtn.disabled = false;
      submitBtn.textContent = "登録する";
    }
  });
}

// ========================================
// 登録完了画面表示
// ========================================
function showCompleteScreen(result, formData) {
  // フォームを非表示
  document.getElementById("register-form").style.display = "none";
  
  // 完了画面を表示
  document.getElementById("register-complete").style.display = "block";
  
  // 登録情報を表示
  document.getElementById("receipt-no").textContent = result.receiptNo;
  document.getElementById("display-name").textContent = formData.name;
  document.getElementById("display-party-size").textContent = formData.partySize;
  
  // QRコード生成
  generateQRCode(result.qrData);
  
  // ダウンロードボタン設定
  setupDownloadButton();
}

// ========================================
// QRコード生成
// ========================================
function generateQRCode(qrData) {
  const qrcodeContainer = document.getElementById("qrcode");
  qrcodeContainer.innerHTML = ""; // 既存のQRコードをクリア
  
  new QRCode(qrcodeContainer, {
    text: qrData,
    width: 300,
    height: 300,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H // 高精度
  });
}

// ========================================
// QRコードダウンロード
// ========================================
function setupDownloadButton() {
  const downloadBtn = document.getElementById("download-qr-btn");
  
  downloadBtn.addEventListener("click", () => {
    const canvas = document.querySelector("#qrcode canvas");
    
    if (canvas) {
      // Canvas を画像に変換
      const image = canvas.toDataURL("image/png");
      
      // ダウンロードリンク作成
      const link = document.createElement("a");
      link.href = image;
      link.download = `qrcode_${document.getElementById("receipt-no").textContent}.png`;
      link.click();
    } else {
      alert("QRコードの生成に失敗しました。");
    }
  });
}

// ========================================
// ユーティリティ：日付フォーマット
// ========================================
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}