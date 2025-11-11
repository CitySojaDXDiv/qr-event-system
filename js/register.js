// ========================================
// 設定
// ========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbzuykr6KseMM4wFZDHyIA8L8cKrFKKtAFcqYTdO2qnZctR0Vz0GU0Zp0qR4OMsQ4j0/exec";

// ========================================
// 初期化
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  loadEvents();
  setupFormSubmit();
});

// ========================================
// イベント一覧取得（JSONP）
// ========================================
async function loadEvents() {
  try {
    const result = await jsonpRequest(GAS_URL, { action: "getEvents" });
    
    const select = document.getElementById("event-select");
    select.innerHTML = '<option value="">イベントを選択してください</option>';
    
    if (result.success && result.events) {
      result.events.forEach(event => {
        if (event.status === "受付中") {
          const option = document.createElement("option");
          option.value = event.eventId;
          option.textContent = `${event.eventName}（${event.eventDate}）`;
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
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "登録中...";
    
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
      const result = await jsonpRequest(GAS_URL, formData);
      
      if (result.success) {
        showCompleteScreen(result, formData);
      } else {
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
// 登録完了画面表示（修正版）
// ========================================
function showCompleteScreen(result, formData) {
  document.getElementById("register-form").style.display = "none";
  document.getElementById("register-complete").style.display = "block";
  
  document.getElementById("receipt-no").textContent = result.receiptNo;
  document.getElementById("display-name").textContent = formData.name;
  document.getElementById("display-party-size").textContent = formData.partySize;
  
  // メール送信結果を表示
  if (result.emailSent) {
    const emailNotice = document.createElement("p");
    emailNotice.style.color = "green";
    emailNotice.style.fontWeight = "bold";
    emailNotice.textContent = `✅ QRコードを ${formData.email} に送信しました。`;
    document.querySelector(".info-box").appendChild(emailNotice);
  } else {
    const emailNotice = document.createElement("p");
    emailNotice.style.color = "red";
    emailNotice.style.fontWeight = "bold";
    emailNotice.textContent = "⚠️ メール送信に失敗しました。QRコードをダウンロードしてください。";
    document.querySelector(".info-box").appendChild(emailNotice);
  }
  
  generateQRCode(result.qrData);
  setupDownloadButton();
}

// ========================================
// QRコード生成
// ========================================
function generateQRCode(qrData) {
  const qrcodeContainer = document.getElementById("qrcode");
  qrcodeContainer.innerHTML = "";
  
  new QRCode(qrcodeContainer, {
    text: qrData,
    width: 300,
    height: 300,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
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
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `qrcode_${document.getElementById("receipt-no").textContent}.png`;
      link.click();
    } else {
      alert("QRコードの生成に失敗しました。");
    }
  });
}