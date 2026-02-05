twemoji.parse(document.body);

// Supabase 설정
const SUPABASE_URL = 'https://mqruxlhrxniyzbhkhmtc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcnV4bGhyeG5peXpiaGtobXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjgzMDIsImV4cCI6MjA4MzkwNDMwMn0.qPt-dN4Uj0d0pKU11AYy782XMuoXeJ7CFiVXmEyrJzA';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM 요소
const loginContainer = document.getElementById('loginContainer');
const loginForm = document.getElementById('loginForm');
const adminPanel = document.getElementById('adminPanel');
const authForm = document.getElementById('authForm');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const message = document.getElementById('message');

// 날짜 포맷
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


// 세션 확인
async function checkSession() {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        showAdminPanel();
    }
}

// 메시지 표시
function showMessage(text, type = 'error') {
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}

// 로그인
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    loginBtn.disabled = true;
    loginBtn.textContent = '로그인 중...';

    try {
        const { data, error } = await sb.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        showMessage('로그인 성공!', 'success');
        showAdminPanel();
    } catch (error) {
        showMessage(error.message || '로그인에 실패했습니다.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = '로그인';
    }
});

// 로그아웃
logoutBtn.addEventListener('click', async () => {
    try {
        const { error } = await sb.auth.signOut();
        if (error) throw error;
        
        showLoginForm();
        showMessage('로그아웃되었습니다.', 'success');
    } catch (error) {
        showMessage('로그아웃에 실패했습니다.');
    }
});

// 로그인 폼 표시
function showLoginForm() {
    loginForm.style.display = 'block';
    adminPanel.style.display = 'none';
    loginContainer.classList.remove('wide');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}

// 페이지 로드 시 세션 확인
checkSession();

// 인증 상태 변경 감지
sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        alert("세션 있음");
    } else if (event === 'SIGNED_OUT') {
        alert("세션 없음")
        showLoginForm();
    }
});

function showAdminPanel(){
    alert("관리자 보기");
}