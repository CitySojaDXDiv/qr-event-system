const GAS_URL = "https://script.google.com/macros/s/AKfycbzuykr6KseMM4wFZDHyIA8L8cKrFKKtAFcqYTdO2qnZctR0Vz0GU0Zp0qR4OMsQ4j0/exec";

// イベント一覧取得
async function loadEvents() {
  try {
    const response = await fetch(`${GAS_URL}?action=getEvents`);
    const result = await response.json();
    
    if (result.success) {
      const select = document.getElementById("event-select");
      select.innerHTML = '<option value="">イベントを選択してください</option>';
      
      result.events.forEach(event => {
        const option = document.createElement("option");
        option.value = event.eventId;
        option.textContent = `${event.eventName}（${event.eventDate}）`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    alert("イベント一覧の取得に失敗しました: " + error.message);
  }
}

// 統計情報取得
async function loadStats(eventId) {
  try {
    const response = await fetch(`${GAS_URL}?action=getStats&eventId=${eventId}`);
    const result = await response.json();
    
    if (result.success) {
      document.getElementById("stats").style.display = "block";
      document.getElementById("total-registered").textContent = result.totalRegistered;
      document.getElementById("total-checked-in").textContent = result.totalCheckedIn;
      document.getElementById("total-party-size").textContent = result.totalPartySize;
      document.getElementById("check-in-rate").textContent = result.checkInRate + "%";
    }
  } catch (error) {
    alert("統計情報の取得に失敗しました: " + error.message);
  }
}

// CSVエクスポート
function exportCSV(eventId) {
  window.open(`${GAS_URL}?action=exportCSV&eventId=${eventId}`, '_blank');
}

// イベント選択時
document.getElementById("event-select").addEventListener("change", (e) => {
  const eventId = e.target.value;
  if (eventId) {
    loadStats(eventId);
  } else {
    document.getElementById("stats").style.display = "none";
  }
});

// CSVエクスポートボタン
document.getElementById("export-csv-btn").addEventListener("click", () => {
  const eventId = document.getElementById("event-select").value;
  if (eventId) {
    exportCSV(eventId);
  }
});

// 初期化
loadEvents();