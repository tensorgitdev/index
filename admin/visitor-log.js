
document.addEventListener('supabaseReady', async function (e) {
    const { sb, session } = e.detail;
    renderCard();
    renderTable();
    renderChart();

});

function toLocalISOString(date) {
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date - offset).toISOString()
}

async function renderCard() {
    // 전체 레코드
    const todayFilter = new Date()
    todayFilter.setHours(0, 0, 0, 0)

    const { count: totalCount, error: error1 } = await sb
        .from('visitor_log')
        .select('*', { count: 'exact', head: true });

    const { count: todayCount, error: error2 } = await sb
        .from('visitor_log')
        .select('*', { count: 'exact', head: true })
        .gte('vl_visited_at', toLocalISOString(todayFilter));

    console.log(totalCount);
    console.log(todayCount);
    $("#total-visitors").html(totalCount);
    $("#today-visitors").html(todayCount);
}

async function renderTable() {
    try {


        const todayFilter = new Date()
        todayFilter.setHours(0, 0, 0, 0)

        const { data, error } = await sb
            .from('visitor_log')
            .select('*')
            .gte('vl_visited_at', toLocalISOString(todayFilter))
            .order('vl_visited_at', { ascending: false });
        if (error) throw error;

        const now = new Date();
        const todayInt = parseInt(
            now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0')
        );

        const total = data.length;
        // $("#total-visitors").html(total);
        // $("#today-visitors").html(data.filter(v => v.vl_date_int === todayInt).length);

        let rowPopupFormatter = function (e, row) {
            let data = row.getData()
            let container = document.createElement("div")
            container.innerHTML = `<strong style='font-size:1.2em;'>USER AGENT</strong><div>${data.vl_user_agent}</div>`
            return container;
        };

        let table = new Tabulator("#admin-table", {
            data: data,
            layout: "fitColumns",
            placeholder: "데이터가 없습니다.",
            rowClickPopup: rowPopupFormatter,
            rowHeight: 40,
            headerHeight: 40,
            rowFormatter: function (row) {
                if (row.getData().vl_date_int === todayInt) {
                    row.getElement().classList.add("today-row");
                }
            },
            columns: [
                {
                    title: "방문 시간", field: "vl_visited_at", width: 180,
                    headerHozAlign: "center", hozAlign: "center",
                    formatter: cell => formatDate(cell.getValue())
                },
                {
                    title: "IP", field: "vl_ip", width: 180,
                    headerHozAlign: "center", hozAlign: "center",
                },
                {
                    title: "국가", field: "vl_country_code", width: 100,
                    headerHozAlign: "center",
                    formatter: cell => `<div style="text-align:center;" title="${cell.getValue()}">${countryCodeToFlag(cell.getValue())}</div>`
                },
                {
                    title: "브라우저 정보", field: "vl_user_agent",
                    headerHozAlign: "center", widthGrow: true,
                    formatter: function (cell) {
                        const parsed = parseUserAgent(cell.getValue());
                        return `<span style="display:inline-block;width:30px;text-align:center;">${parsed.device}</span> <strong>${parsed.browser}</strong> on ${parsed.os}`;
                    }
                },
                {
                    title: "디바이스", field: "vl_device_type", width: 100,
                    hozAlign: "center", headerHozAlign: "center",
                    formatter: cell => {
                        const type = cell.getValue();
                        return `<span class="device-badge device-${type}">${type.toUpperCase() === "PC" ? "🖥" : "📱"}</span>`;
                    }
                }
            ]
        });

        table.on("renderComplete", () => twemoji.parse(document.body));

        flatpickr("#date-filter", {
            mode: "range",
            dateFormat: "Y-m-d",
            maxDate: "today",
            defaultDate: ["today", "today"],
            onChange: async function (selectedDates) {
                if (selectedDates.length === 2) {
                    const start = new Date(selectedDates[0])
                    start.setHours(0, 0, 0, 0)
                    const end = new Date(selectedDates[1])
                    end.setHours(23, 59, 59, 999)

                    const { data, error } = await sb
                        .from('visitor_log')
                        .select('*')
                        .gte('vl_visited_at', toLocalISOString(start))
                        .lte('vl_visited_at', toLocalISOString(end))
                        .order('vl_visited_at', { ascending: false });

                    if (error) return console.error(error);
                    table.setData(data);
                }
            }
        })

        loadComplete();

    } catch (error) {
        console.error('Error loading visitor logs:', error);
    }
}

async function renderChart() {
    const { data, error } = await sb
        .from('visitor_log')
        .select('vl_date_int')
        .order('vl_date_int', { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    // vl_date_int 기준으로 count 집계
    const countMap = {};
    for (const row of data) {
        countMap[row.vl_date_int] = (countMap[row.vl_date_int] || 0) + 1;
    }

    const categories = Object.keys(countMap).map(n => {
        const s = String(n);
        return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    });
    const seriesData = Object.values(countMap);

    const options = {
        series: [{
            name: '방문자 수',
            data: seriesData
        }],
        chart: {
            height: 350,
            type: 'area'
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth'
        },
        xaxis: {
            type: 'datetime',
            categories: categories,
            labels: {
                format: 'dd일',
                style: {
                    colors: '#ffffff'  // y축 색깔
                }
            },

        },
        yaxis: {
            labels: {
                style: {
                    colors: '#ffffff'  // y축 색깔
                }
            }
        },
        tooltip: {
            x: {
                format: 'dd일'
            },
            theme: 'dark',
        }
    };

    const chart = new ApexCharts(document.querySelector("#apexchart-wrapper"), options);
    chart.render();
}