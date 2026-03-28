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

                if (!row.gb_message?.trim()) {
                    el.className = 'no-msg';
                    el.innerHTML = `<div class="gb-item">${row.gb_emoji}</div>`;
                } else {
                    el.className = 'has-msg';
                    let html = `
                                <button onclick="deleteLog(${row.gb_id});" class="btn-row-delete">게시글 삭제</button>
                                <p>${formatDate(row.gb_created_at)} (${row.gb_id})</p>
                                <p>${row.gb_emoji}</p>
                            `;

                    if (!row.gb_card_image_url?.trim()) {
                        html += `
                                    ${row.gb_message}
                                    <p><button class='btn btn-sm btn-primary' data-gen-id="${row.gb_id}"
                                        onclick="generateCard(${row.gb_id}, \`${row.gb_message}\`, \`${row.gb_emoji}\`)">이미지 생성</button></p>
                                `;
                    } else {
                        const cardUrl = `https://png-converter.onrender.com/view-card?id=${row.gb_id}`;
                        html += `<div class="img-wrapper"><img src="${row.gb_card_image_url}?v=${Date.now()}" onclick='window.open("${cardUrl}")'  style="cursor:pointer;" /></div>`;

                        if (!row.gb_answer_url?.trim()) {
                            html += `
                                        <div>
                                            <button class='btn btn-sm btn-danger' onclick="deleteCardImg('${row.gb_id}');">카드 삭제</button>
                                            <input type="text" id="answer-input-${row.gb_id}" />
                                            <button class='btn btn-sm btn-primary' onclick="submitAnswer('${row.gb_id}')">입력</button>
                                        </div>
                                    `;
                        } else {
                            html += `<a href="${row.gb_answer_url}" target="_blank" class="btn btn-sm btn-outline-light">답장 보기</a>`;
                        }
                    }

                    el.innerHTML = html;
                }

                container.appendChild(el);
            });

            twemoji.parse(container);
            loadComplete();

        } catch (error) {
            console.error('Error loading visitor logs:', error);
        }
    }

    loadVisitorLogs();
});