document.addEventListener('supabaseReady', async function (e) {
    const { sb, session } = e.detail;
    const SUPABASE_URL = 'https://mqruxlhrxniyzbhkhmtc.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcnV4bGhyeG5peXpiaGtobXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjgzMDIsImV4cCI6MjA4MzkwNDMwMn0.qPt-dN4Uj0d0pKU11AYy782XMuoXeJ7CFiVXmEyrJzA';

    window.generateCard = async function (gb_id, message, emoji) {
        const btn = document.querySelector(`[data-gen-id="${gb_id}"]`);
        btn.disabled = true;
        btn.innerText = "생성중...";
        try {
            const res = await fetch("https://mqruxlhrxniyzbhkhmtc.supabase.co/functions/v1/create-card", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ id: gb_id, message, emoji })
            });
            await res.json();
            const pngRes = await fetch("https://png-converter.onrender.com/convert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: gb_id })
            });
            await pngRes.json();
            btn.innerText = "완료";
            loadVisitorLogs();
        } catch (err) {
            btn.innerText = "실패";
            console.error(err);
        }
    }

    window.deleteCardImg = async function (gb_id) {
        const { error: storageError } = await sb.storage
            .from('guestbook')
            .remove([`cards/${gb_id}.svg`, `cards/${gb_id}.png`]);
        if (storageError) { console.error('스토리지 삭제 실패:', storageError); return; }
        const { error } = await sb.from('guestbook').update({ gb_card_image_url: null }).eq('gb_id', Number(gb_id));
        if (error) { console.error('삭제 실패:', error); } else { loadVisitorLogs(); }
    }

    window.submitAnswer = async function (gb_id) {
        const input = document.getElementById(`answer-input-${gb_id}`);
        const value = input.value.trim();
        if (!value) return;
        const { error } = await sb.from('guestbook').update({ gb_answer_url: value }).eq('gb_id', Number(gb_id));
        if (error) { console.error('업데이트 실패:', error); } else { alert('저장됐습니다.'); loadVisitorLogs(); }
    }

    window.deleteLog = async function (gb_id) {
        if (!confirm("삭제하시겠습니까?")) return;
        const { error } = await sb.from('guestbook').delete().eq('gb_id', Number(gb_id));
        if (error) { console.error('삭제 실패:', error); } else { loadVisitorLogs(); }
    }



    loadVisitorLogs();
});

function formatDateShort(dateStr) {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

async function loadVisitorLogs() {
    try {
        const { data, error } = await sb
            .from('guestbook')
            .select('*')
            .order('gb_created_at', { ascending: false });
        if (error) throw error;

        const container = document.getElementById('admin-table');
        container.innerHTML = '';

        data.forEach(row => {
            const el = document.createElement('div');

            // 답변 완료인 경우
            let compBadge = "";
            let compClass = "";
            if (row.gb_answer_url?.trim()){
                compBadge = `<span class="badge-complete"><i data-lucide="circle-check"></i> 답변 완료</span>`;
                compClass = `complete`;
            }

            if (!row.gb_message?.trim()) {
                el.className = 'no-msg';
                el.innerHTML = `<div class="gb-item">${row.gb_emoji}</div>`;
            } else {
                el.className = `has-msg ${compClass}`;
                let html = `<div class="card-head">
                    <button onclick="deleteLog(${row.gb_id});" class="btn-row-delete icon-btn"><i data-lucide="x"></i></button>
                    <p title="${formatDate(row.gb_created_at)} (${row.gb_id})">${row.gb_emoji} <span class="date">${formatDateShort(formatDate(row.gb_created_at))}</span> ${compBadge}</p>
                </div>
                `;

                if (!row.gb_card_image_url?.trim()) {
                    html += `
                                <div class="card-body">${row.gb_message}</div>
                                <div class="card-foot"><button class='create-card-btn w100-btn' data-gen-id="${row.gb_id}"
                                    onclick="generateCard(${row.gb_id}, \`${row.gb_message}\`, \`${row.gb_emoji}\`)">이미지 생성</button></div>
                            `;
                } else {
                    const cardUrl = `https://png-converter.onrender.com/view-card?id=${row.gb_id}`;
                    html += `<div class="img-wrapper"><img src="${row.gb_card_image_url}?v=${Date.now()}" onclick='window.open("${cardUrl}")'  style="cursor:pointer;" /></div>`;

                    if (!row.gb_answer_url?.trim()) {
                        html += `
                                    <div class="card-foot answer-form d-flex">
                                        <input type="text" id="answer-input-${row.gb_id}" placeholder="답변 트윗 주소를 입력하세요." />
                                        <button class='update-answer-btn icon-btn' onclick="submitAnswer('${row.gb_id}')"><i data-lucide="link"></i></button>
                                    </div>
                                    <button class='delete-card-btn icon-btn' onclick="deleteCardImg('${row.gb_id}');"><i data-lucide="image-off"></i></button>
                                `;
                    } else {
                        html += `<div><button onclick='window.open("${row.gb_answer_url}");' class="w100-btn">답장 보기</button></div>`;
                    }
                }

                el.innerHTML = html;
            }

            container.appendChild(el);
        });

        twemoji.parse(container);
        lucide.createIcons();
        loadComplete();

    } catch (error) {
        console.error('Error loading visitor logs:', error);
    }
}

