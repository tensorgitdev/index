function loadPlugins() {
    return new Promise((resolve, reject) => {
        
        fetch('inc/plugin.html')
            .then(response => response.text())
            .then(html => {
                
                // HTML 파싱
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // script 태그들 추출
                const scripts = Array.from(doc.querySelectorAll('script'));
                const links = Array.from(doc.querySelectorAll('link'));
                
                // console.log('찾은 script 개수:', scripts.length);
                // console.log('찾은 link 개수:', links.length);
                
                // link 태그들 먼저 추가 (CSS 등)
                links.forEach(link => {
                    const newLink = document.createElement('link');
                    Array.from(link.attributes).forEach(attr => {
                        newLink.setAttribute(attr.name, attr.value);
                    });
                    document.head.appendChild(newLink);
                });
                
                // script 태그들을 순차적으로 로드
                let loadedScripts = 0;
                const totalScripts = scripts.length;
                
                if (totalScripts === 0) {
                    console.warn('로드할 스크립트가 없습니다!');
                    reject('No scripts found');
                    return;
                }
                
                scripts.forEach((script, index) => {
                    const newScript = document.createElement('script');
                    
                    // src 속성이 있으면 (외부 스크립트)
                    if (script.src) {
                        newScript.src = script.src;
                        // console.log(`스크립트 로드 시작 [${index + 1}/${totalScripts}]:`, script.src);
                        
                        newScript.onload = () => {
                            loadedScripts++;
                            // console.log(`✅ 로드 완료 [${loadedScripts}/${totalScripts}]:`, script.src);
                            
                            if (loadedScripts === totalScripts) {
                                console.log('🎉 모든 스크립트 로드 완료');
                                resolve();
                            }
                        };
                        
                        newScript.onerror = (error) => {
                            console.error(`❌ 스크립트 로드 실패:`, script.src, error);
                            reject(error);
                        };
                    } 
                    // 인라인 스크립트
                    else {
                        newScript.textContent = script.textContent;
                        loadedScripts++;
                        console.log(`인라인 스크립트 추가 [${loadedScripts}/${totalScripts}]`);
                    }
                    
                    // 다른 속성들도 복사
                    Array.from(script.attributes).forEach(attr => {
                        if (attr.name !== 'src') {
                            newScript.setAttribute(attr.name, attr.value);
                        }
                    });
                    
                    document.head.appendChild(newScript);
                });
                
                // 인라인 스크립트만 있는 경우
                if (loadedScripts === totalScripts) {
                    console.log('인라인 스크립트만 있음 - 즉시 완료');
                    resolve();
                }
            })
            .catch(error => {
                console.error('fetch 에러:', error);
                reject(error);
            });
    });
}

document.addEventListener('DOMContentLoaded', async function () {

    // ── 1. 플러그인 로드 ──────────────────────────────────────
    try {
        await loadPlugins();
        console.log("1. 플러그인 로드 완료");
    } catch (error) {
        console.error("플러그인 로드 실패:", error);
        return;
    }

    // ── 2. Supabase 로드 확인 ─────────────────────────────────
    if (typeof supabase === 'undefined') {
        console.error('supabase가 여전히 undefined입니다!');
        return;
    }
    console.log("2. supabase 확인됨");

    // ── 3. Supabase 클라이언트 생성 ───────────────────────────
    const SUPABASE_URL = 'https://mqruxlhrxniyzbhkhmtc.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcnV4bGhyeG5peXpiaGtobXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjgzMDIsImV4cCI6MjA4MzkwNDMwMn0.qPt-dN4Uj0d0pKU11AYy782XMuoXeJ7CFiVXmEyrJzA';

    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.sb = sb;
    console.log("3. Supabase 클라이언트 생성 완료");

    // ── 4. 세션 확인 및 인증 처리 ─────────────────────────────
    const { data: { session } } = await sb.auth.getSession();
    const isLoginPage = window.location.pathname.includes('login.html');

    if (session) {
        console.log('✅ 로그인됨:', session.user.email);
    } else {
        console.log("세션 없음");
        if (!isLoginPage) {
            window.location.href = '../admin/login.html';
            return; // 리다이렉트 후 아래 코드 실행 방지
        }
    }

    // ── 5. 로그아웃 ───────────────────────────────────────────
    async function logout() {
        await sb.auth.signOut();
        window.location.href = '../admin/login.html';
    }

    window.logout = logout;

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // ── 6. supabaseReady 이벤트 발생 ──────────────────────────
    document.dispatchEvent(new CustomEvent('supabaseReady', {
        detail: { sb, session }
    }));
    console.log("4. supabaseReady 이벤트 발생");

    // ── 7. 네비게이터 렌더링 ──────────────────────────────────
    $("#navigator").html(`
        <a href="visitor-log.html">방문자 로그</a>
        <a href="guestbook.html">방문록</a>
    `);

    lucide.createIcons();

});

// 국가 코드를 국기 이모지로 변환
function countryCodeToFlag(code) {
    if (!code || code === '-' || code === 'unknown' || code === 'LOCAL') return code;

    const codePoints = code
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

// User Agent 파싱 함수
function parseUserAgent(ua) {
    if (!ua || ua === 'unknown') return { browser: '-', os: '-', device: '-' };

    // 브라우저 감지
    let browser = 'Unknown';
    if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Opera/') || ua.includes('OPR/')) browser = 'Opera';

    // OS 감지
    let os = 'Unknown';
    if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
    else if (ua.includes('Windows NT')) os = 'Windows';
    else if (ua.includes('Mac OS X')) os = 'macOS';
    else if (ua.includes('Android')) {
        const match = ua.match(/Android (\d+)/);
        os = match ? `Android ${match[1]}` : 'Android';
    }
    else if (ua.includes('iPhone') || ua.includes('iPad')) {
        const match = ua.match(/OS (\d+)_(\d+)/);
        os = match ? `iOS ${match[1]}` : 'iOS';
    }
    else if (ua.includes('Linux')) os = 'Linux';

    // 디바이스
    let device = '🖥';
    if (ua.includes('iPhone')) device = `<img src="img/icon-apple.png" width="22px" />`;
    else if (ua.includes('iPad')) device = 'iPad';
    else if (ua.includes('Android')) device = `<img src="img/icon-android.png" width="22px" />`;
    else if (ua.includes('Mobile')) device = '📱';

    return { browser, os, device };
}

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

function loadComplete(){
    $("body").animate({"opacity":"1.0"});
}