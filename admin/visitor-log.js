document.addEventListener('supabaseReady', async function (e) {
    const { sb, session } = e.detail;
    renderTable();
    renderChart();
});

async function renderTable() {
    try {
        const { data, error } = await sb
            .from('visitor_log')
            .select('*')
            .order('vl_visited_at', { ascending: false });

        if (error) throw error;

        const now = new Date();
        const todayInt = parseInt(
            now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0')
        );

        console.log("data", data);

        const total = data.length;
        const mobile = data.filter(v => v.vl_device_type === 'mobile').length;
        const pc = data.filter(v => v.vl_device_type === 'pc').length;
        const today = data.filter(v => v.vl_date_int === todayInt).length;

        //document.getElementById('totalVisitors').textContent = total;
        //document.getElementById('mobileVisitors').textContent = mobile;
        //document.getElementById('pcVisitors').textContent = pc;
        $("#total-visitors").html(total);
        $("#today-visitors").html(today);

        let rowPopupFormatter = function(e, row, onRendered){
            let data = row.getData(),
            container = document.createElement("div"),
            contents = "<strong style='font-size:1.2em;'>USER AGENT</strong>";
            contents += `<div>${data.vl_user_agent}</div>`;

            container.innerHTML = contents;

            return container;
        };

        //create header popup contents
        let headerPopupFormatter = function(e, column, onRendered){
            let container = document.createElement("div");

            let label = document.createElement("label");
            label.innerHTML = "Filter Column:";
            label.style.display = "block";
            label.style.fontSize = ".7em";

            let input = document.createElement("input");
            input.placeholder = "Filter Column...";
            input.value = column.getHeaderFilterValue() || "";

            input.addEventListener("keyup", (e) => {
                column.setHeaderFilterValue(input.value);
            });

            container.appendChild(label);
            container.appendChild(input);

            return container;
        }

        //create dummy header filter to allow popup to filter
        let emptyHeaderFilter = function(){
            return document.createElement("div");;
        }


        // Tabulator 테이블 생성
        const table = new Tabulator("#admin-table", {
            data: data, // 초기 데이터를 여기서 설정
            layout: "fitColumns",
            placeholder: "데이터가 없습니다.",
            rowClickPopup:rowPopupFormatter,
            rowHeight:40, 
            headerHeight: 40,
            rowFormatter: function(row) {
                const rowData = row.getData();
                if (rowData.vl_date_int === todayInt) {
                    row.getElement().classList.add("today-row");
                }
            },
            columns: [
                {
                    title: "방문 시간",
                    field: "vl_visited_at",
                    width: 180,
                    headerHozAlign: "center",
                    hozAlign:"center",
                    formatter: function (cell) {
                        return formatDate(cell.getValue());
                    }
                },
                {
                    title: "IP",
                    field: "vl_ip",
                    width: 180,
                    headerHozAlign: "center",
                    hozAlign:"center",
                },
                {
                    title: "국가",
                    field: "vl_country_code",
                    width: 100,
                    headerHozAlign: "center",    
                    formatter: function (cell) {
                        const flag = countryCodeToFlag(cell.getValue());
                        return `<div style="text-align:center; " title="${cell.getValue()}">${flag}</div>`;
                    }
                },                            
                {
                    title: "브라우저 정보",
                    field: "vl_user_agent",
                    headerHozAlign: "center",
                    formatter: function (cell) {
                        const parsed = parseUserAgent(cell.getValue());
                        return `<span style="display: inline-block; width: 30px; text-align:center;">${parsed.device}</span> <strong>${parsed.browser}</strong> on ${parsed.os}
                    `;
                    },
                    widthGrow: true
                },
                {
                    title: "디바이스",
                    field: "vl_device_type",
                    width: 100,
                    hozAlign:"center",
                    headerHozAlign: "center",
                    formatter: function (cell) {
                        const type = cell.getValue();
                        let icon = "";
                        if(type.toUpperCase() == "PC"){icon = "🖥";} else {icon = "📱";}
                        return `<span class="device-badge device-${type}">${icon}</span>`;
                    }
                }

            ]
        });

        table.on("renderComplete", function () {
            twemoji.parse(document.body);
        });

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
    return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
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