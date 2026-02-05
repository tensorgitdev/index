// ===============================
// 이모지 목록
// ===============================
const EMOJIS = ["❤️", "👍", "🔥", "😋"];

// ===============================
// DOM 요소
// ===============================
const quickButtonsContainer = document.querySelector(".emoji-quick-buttons");
const emojiSelect = document.getElementById("emoji-select");
const submitBtn = document.getElementById("gb-submit");
const input = document.getElementById("gb-input");

// ===============================
// Notyf 초기화
// ===============================
const notyf = new Notyf({
  duration: 2500,
  position: {
    x: 'center',
    y: 'bottom',
  },
  dismissible: false,
});

// ===============================
// Notyf helpers
// ===============================
function showPendingToast(text = "sending...") {
  const notif = notyf.open({
    type: 'info',
    message: text,
    duration: 0
  });
  
  const toastElement = document.querySelector('.notyf__toast:last-child');
  return { notif, element: toastElement };
}
function updateToSuccess(pendingData, text = "sent!") {
  const { notif, element } = pendingData;
  
  const messageEl = element.querySelector('.notyf__message');
  if (messageEl) {
    messageEl.innerHTML = `
      <div class="lottie-wrapper">
        <lottie-player
          src="img/system-solid-31-check-hover-pinch.json"
          background="transparent"
          speed="1"
          style="width: 22px; height: 22px;"
          autoplay>
        </lottie-player>
        <span>${text}</span>
      </div>
    `;
  }
  
  element.classList.add('success-state');
  
  setTimeout(() => {
    notyf.dismiss(notif);
  }, 2500);
}

function updateToError(pendingData, text = "failed to send") {
  const { notif, element } = pendingData;
  
  const messageEl = element.querySelector('.notyf__message');
  if (messageEl) {
    messageEl.innerHTML = `
      <div class="lottie-wrapper">
        <lottie-player
          src="img/system-solid-31-check-hover-pinch.json"
          background="transparent"
          speed="1"
          style="width: 22px; height: 22px;"
          autoplay>
        </lottie-player>
        <span>${text}</span>
      </div>
    `;
  }
  
  element.classList.add('error-state');
  
  setTimeout(() => {
    notyf.dismiss(notif);
  }, 2500);
}

function showWarningToast(text) {
  notyf.open({
    type: 'warning',
    message: text,
    background: '#ff9800',
  });
}

// ===============================
// 이모지 빠른 버튼 생성
// ===============================
EMOJIS.forEach((emoji) => {
  const btn = document.createElement("button");
  btn.className = "emoji-quick-btn";
  btn.dataset.emoji = emoji;
  btn.textContent = emoji;
  quickButtonsContainer.appendChild(btn);
});

// ===============================
// select 옵션 생성
// ===============================
EMOJIS.forEach((emoji, index) => {
  const option = document.createElement("option");
  option.value = emoji;
  option.textContent = emoji;
  if (index === 0) option.selected = true;
  emojiSelect.appendChild(option);
});

twemoji.parse(document.body);


// ===============================
// 이모지만 바로 전송
// ===============================
document.querySelectorAll(".emoji-quick-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (btn.disabled) return;
    btn.disabled = true;

    const pendingData = showPendingToast("sending...");

    try {
      await submitGuestbook(null, btn.dataset.emoji);
      updateToSuccess(pendingData, "sent!");
    } catch (e) {
      updateToError(pendingData, "failed to send");
    } finally {
      btn.disabled = false;
    }
  });
});

// ===============================
// 메시지 + 이모지 전송
// ===============================
submitBtn.addEventListener("click", async () => {
  if (submitBtn.disabled) return;

  const message = input.value.trim();
  const emoji = emojiSelect.value;

  if (!message) {
    showWarningToast("write something first!");
    return;
  }

  submitBtn.disabled = true;
  const pendingData = showPendingToast("sending...");

  try {
    await submitGuestbook(message, emoji || null);
    updateToSuccess(pendingData, "thanks for the message!");
    
    input.value = "";
    emojiSelect.selectedIndex = 0;
  } catch (e) {
    updateToError(pendingData, "error occurred");
  } finally {
    submitBtn.disabled = false;
  }
});