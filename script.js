  // 이모지 목록 (여기서 한 번만 관리)
  const EMOJIS = ["❤️", "👍", "🔥", "😋"];

  // 이모지 빠른 전송 버튼 생성
  const quickButtonsContainer = document.querySelector('.emoji-quick-buttons');
EMOJIS.forEach(emoji => {  // slice 제거
  const btn = document.createElement('button');
  btn.className = 'emoji-quick-btn';
  btn.dataset.emoji = emoji;
  btn.textContent = emoji;
  quickButtonsContainer.appendChild(btn);
});

  // select 옵션 생성
  const emojiSelect = document.getElementById('emoji-select');
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

  // 이모지만 바로 전송
  document.querySelectorAll('.emoji-quick-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await submitGuestbook(null, btn.dataset.emoji);
        alert("Message saved. Thanks!");
      } catch (e) {
        alert("Failed to send.");
      }
    });
  });

// 메시지 + 이모지 전송
document.getElementById("gb-submit").addEventListener("click", async () => {
  const message = document.getElementById("gb-input").value.trim();
  const emoji = emojiSelect.value;
  
  // 메시지가 없으면 전송 안 함
  if (!message) {
    alert("Please enter a message.");
    return;
  }

  try {
    await submitGuestbook(message, emoji || null);
    document.getElementById("gb-input").value = "";
    emojiSelect.selectedIndex = 0;
    alert("Message saved. Thanks!");
  } catch (e) {
    alert("Failed to send.");
  }
});