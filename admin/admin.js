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

// 탭 요소
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// 새로고침 버튼
const refreshVisitor = document.getElementById('refreshVisitor');
const refreshGuestbook = document.getElementById('refreshGuestbook');

// 테이블 바디
const visitorBody = document.getElementById('visitorBody');
const guestbookBody = document.getElementById('guestbookBody');

// 메시지 표시
function showMessage(text, type = 'error') {
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}

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

// 탭 전환
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // 모든 탭 비활성화
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // 선택된 탭 활성화
        btn.classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
        
        // 데이터 로드
        if (tabName === 'visitor') {
            loadVisitorLogs();
        } else if (tabName === 'guestbook') {
            loadGuestbook();
        }
    });
});

// 방문자 로그 가져오기
async function loadVisitorLogs() {
    try {
        const { data, error } = await sb
            .from('visitor_log')
            .select('*')
            .order('vl_visited_at', { ascending: false });

        if (error) throw error;

        // 통계 계산
        const total = data.length;
        const mobile = data.filter(v => v.vl_device_type === 'mobile').length;
        const pc = data.filter(v => v.vl_device_type === 'pc').length;

        document.getElementById('totalVisitors').textContent = total;
        document.getElementById('mobileVisitors').textContent = mobile;
        document.getElementById('pcVisitors').textContent = pc;

        // 테이블 생성
        if (data.length === 0) {
            visitorBody.innerHTML = '<tr><td colspan="6" class="loading">데이터가 없습니다.</td></tr>';
            return;
        }

        visitorBody.innerHTML = data.map(log => `
            <tr>
                <td>${log.vl_date_int}</td>
                <td>${formatDate(log.vl_visited_at)}</td>
                <td>${log.vl_ip}</td>
                <td style="max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${log.vl_user_agent}">${log.vl_user_agent}</td>
                <td><span class="device-badge device-${log.vl_device_type}">${log.vl_device_type.toUpperCase()}</span></td>
                <td>${log.vl_country_code || '-'}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading visitor logs:', error);
        visitorBody.innerHTML = '<tr><td colspan="6" class="loading" style="color: #c33;">데이터 로드 실패</td></tr>';
    }
}

// 방명록 가져오기
// 방명록 가져오기
async function loadGuestbook() {
    try {
        const { data, error } = await sb
            .from('guestbook')
            .select('*')
            .order('gb_id', { ascending: false }); // 일단 ID 역순으로

        if (error) {
            console.error('Error:', error);
            throw error;
        }

        console.log('Guestbook data:', data); // 데이터 확인

        // 통계
        document.getElementById('totalGuestbook').textContent = data.length;

        // 테이블 생성
        if (data.length === 0) {
            guestbookBody.innerHTML = '<tr><td colspan="7" class="loading">데이터가 없습니다.</td></tr>';
            return;
        }

        guestbookBody.innerHTML = data.map(gb => `
            <tr>
                <td>${gb.gb_id}</td>
                <td>${gb.created_at ? formatDate(gb.created_at) : '-'}</td>
                <td>${gb.gb_ip || '-'}</td>
                <td style="max-width: 300px;">${gb.gb_message || '-'}</td>
                <td class="emoji-display">${gb.gb_emoji || '-'}</td>
                <td>${gb.gb_country_code || '-'}</td>
                <td style="max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${gb.gb_user_agent || ''}">${gb.gb_user_agent || '-'}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading guestbook:', error);
        guestbookBody.innerHTML = '<tr><td colspan="7" class="loading" style="color: #c33;">데이터 로드 실패: ' + error.message + '</td></tr>';
    }
}

// 세션 확인
async function checkSession() {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        showAdminPanel();
    }
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

// 새로고침 버튼
refreshVisitor.addEventListener('click', loadVisitorLogs);
refreshGuestbook.addEventListener('click', loadGuestbook);

// 관리자 패널 표시
function showAdminPanel() {
    loginForm.style.display = 'none';
    adminPanel.style.display = 'block';
    loginContainer.classList.add('wide');
    loadVisitorLogs(); // 기본으로 방문자 로그 로드
}

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
        showAdminPanel();
    } else if (event === 'SIGNED_OUT') {
        showLoginForm();
    }
});