// 이모지 목록 (여기서 한 번만 관리)
const EMOJIS = ["❤️", "👍", "🔥", "😋"];

// 이모지 빠른 전송 버튼 생성
const quickButtonsContainer = document.querySelector('.emoji-quick-buttons');

// select 옵션 생성
const emojiSelect = document.getElementById('emoji-select');

// 스피너 요소 가져오기
const spinner = document.getElementById('loading-spinner');

/**
 * 스피너 켜기
 */
function showLoading() {
    if (spinner) {
        spinner.style.display = 'flex';
        // 뒤쪽 본문 스크롤 막기 (선택 사항)
        document.body.style.overflow = 'hidden'; 
    }
}

/**
 * 스피너 끄기
 */
function hideLoading() {
    if (spinner) {
        spinner.style.display = 'none';
        // 스크롤 다시 허용
        document.body.style.overflow = 'auto';
    }
}

EMOJIS.forEach(emoji => {  // slice 제거
  const btn = document.createElement('button');
  btn.className = 'emoji-quick-btn';
  btn.dataset.emoji = emoji;
  btn.textContent = emoji;
  quickButtonsContainer.appendChild(btn);
});

// select 옵션 생성
EMOJIS.forEach((emoji, index) => {
  const option = document.createElement('option');
  option.value = emoji;
  option.textContent = emoji;
  if (index === 0) {
    option.selected = true;  // 첫 번째 이모지 기본 선택
  }
  emojiSelect.appendChild(option);
});

// 공통 알림 설정 (중복 코드를 줄이기 위해)
const toast = (title, icon) => {
  Swal.fire({
    title: title,
    icon: icon
  });
};

// 이모지만 바로 전송
document.querySelectorAll('.emoji-quick-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    showLoading();
    try {
      await submitGuestbook(null, btn.dataset.emoji);
      toast("Sent!", "success"); // 성공 알림
    } catch (e) {
      toast("Failed to send", "error"); // 실패 알림
    } finally {
      hideLoading();
    }
  });
});

// 메시지 + 이모지 전송
document.getElementById("gb-submit").addEventListener("click", async () => {
  const message = document.getElementById("gb-input").value.trim();
  const emoji = emojiSelect.value;
  
  if (!message) {
    toast("Write something first!", "warning"); // 경고 알림
    return;
  }

  showLoading();
  try {
    await submitGuestbook(message, emoji || null);
    document.getElementById("gb-input").value = "";
    emojiSelect.selectedIndex = 0;
    toast("Thanks for the message!", "success");
  } catch (e) {
    toast("Error occurred", "error");
  } finally {
    hideLoading();
  }
});