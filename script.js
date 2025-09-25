document.addEventListener('DOMContentLoaded', () => {
    // --- Elements for our Animation ---
    const fakeMouseCursor = document.getElementById('fakeMouseCursor');
    const xlsReportModalOverlay = document.getElementById('xlsReportModalOverlay');
    const xlsReportModalCloseBtn = document.getElementById('xlsReportModalCloseBtn');
    
    let xlsNpsGaugeBackgroundChart, xlsPercentagePieChart, xlsCountBarChart;
    let animationIsRunning = false;

    // --- Helper Functions ---
    const cursorAnimationDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cursor-animation-duration').replace('s',''))*1000 || 700;
    const cursorClickVisualDelay = 150;

    const getScaleFactor = () => {
        const factor = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale-factor'));
        return isNaN(factor) ? 1 : factor;
    };


    async function animateCursorToAndClick(targetElement, actionToTrigger) {
        if (!fakeMouseCursor || !targetElement) return;

        fakeMouseCursor.classList.remove('clicking');
        fakeMouseCursor.classList.add('visible');

        const targetRect = targetElement.getBoundingClientRect();
        const cursorSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cursor-size').replace('px','')) || 24;
        const targetX = targetRect.left + (targetRect.width / 2);
        const targetY = targetRect.top + (targetRect.height / 2);

        fakeMouseCursor.style.left = `${targetX - (cursorSize / 4)}px`;
        fakeMouseCursor.style.top = `${targetY - (cursorSize / 4)}px`;

        await new Promise(resolve => setTimeout(resolve, cursorAnimationDuration + 100));
        
        if (!animationIsRunning) {
             fakeMouseCursor.classList.remove('visible');
             return;
        }

        fakeMouseCursor.classList.add('clicking');
        await new Promise(resolve => setTimeout(resolve, cursorClickVisualDelay + 50));
        
        if (actionToTrigger) {
            actionToTrigger();
        }

        await new Promise(resolve => setTimeout(resolve, cursorClickVisualDelay / 2 + 50));
        fakeMouseCursor.classList.remove('clicking');
    }

    function initializeXLSReportCharts() {
        const scaleFactor = getScaleFactor();

        const xlsNpsGaugeCtxLocal = document.getElementById('xlsReportModal').querySelector('#xlsNpsGaugeBackgroundChart')?.getContext('2d');
        const xlsPieCtxLocal = document.getElementById('xlsReportModal').querySelector('#xlsPercentagePieChart')?.getContext('2d');
        const xlsBarCtxLocal = document.getElementById('xlsReportModal').querySelector('#xlsCountBarChart')?.getContext('2d');
        if (!xlsNpsGaugeCtxLocal || !xlsPieCtxLocal || !xlsBarCtxLocal) { console.error("XLS canvas contexts not found!"); return; }
        if (xlsNpsGaugeBackgroundChart) xlsNpsGaugeBackgroundChart.destroy();
        if (xlsPercentagePieChart) xlsPercentagePieChart.destroy();
        if (xlsCountBarChart) xlsCountBarChart.destroy();

        const npsGaugeValueElement = document.getElementById('xlsReportModal').querySelector('#xlsNpsGaugeValue');
        const npsGaugeNeedleElement = document.getElementById('xlsReportModal').querySelector('#xlsNpsGaugeNeedle');

        const happyColorBase = '#1E8449';
        const neutralColorBase = '#B7950B';
        const notHappyColorBase = '#943126';

        const npsScore = 56.00;
        const totalHappy = 18.00, totalNeutral = 3.00, totalNotHappy = 4.00;
        const totalResponses = totalHappy + totalNeutral + totalNotHappy;
        const happyPercent = (totalResponses > 0) ? (totalHappy / totalResponses) * 100 : 0;
        const neutralPercent = (totalResponses > 0) ? (totalNeutral / totalResponses) * 100 : 0;
        const notHappyPercent = (totalResponses > 0) ? (totalNotHappy / totalResponses) * 100 : 0;
        
        const pieChartData = [happyPercent, neutralPercent, notHappyPercent];
        const pieChartLabels = ['Happy', 'Neutral', 'Not happy'];
        const pieChartColors = [happyColorBase, neutralColorBase, notHappyColorBase];

        const finalBarData = [totalNotHappy, totalNeutral, totalHappy];
        const barChartLabels = ['Not happy', 'Neutral', 'Happy'];
        const barChartColors = [notHappyColorBase, neutralColorBase, happyColorBase];

        const maxBarValue = Math.max(...finalBarData) + 2;
        
        // --- Register the Datalabels plugin globally ---
        Chart.register(ChartDataLabels);

        xlsNpsGaugeBackgroundChart = new Chart(xlsNpsGaugeCtxLocal, { type: 'doughnut', data: { datasets: [{ data: [50, 25, 25], backgroundColor: [notHappyColorBase, neutralColorBase, happyColorBase], borderWidth: 0, circumference: 180, rotation: -90, }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false }, datalabels: { display: false } }, animation: { duration: 0 } } });
        
        // --- UPDATED Pie Chart Configuration ---
        xlsPercentagePieChart = new Chart(xlsPieCtxLocal, { 
            type: 'pie', 
            data: { 
                labels: pieChartLabels,
                datasets: [{ 
                    data: pieChartData, 
                    backgroundColor: pieChartColors, 
                    borderColor: '#ffffff', 
                    borderWidth: 1, 
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false },
                    tooltip: { enabled: false },
                    datalabels: {
                        formatter: (value, context) => {
                            const label = context.chart.data.labels[context.dataIndex];
                            return `${label}\n${value.toFixed(2)}%`;
                        },
                        color: (context) => context.dataset.backgroundColor[context.dataIndex],
                        font: {
                            weight: 'bold',
                            size: 12 * scaleFactor, // Scale the font
                        },
                        textAlign: 'center',
                        textStrokeColor: 'white',
                        textStrokeWidth: 4,
                        align: 'end',
                        anchor: 'end',
                        offset: 8
                    }
                } 
            } 
        });

        // --- UPDATED Bar Chart Configuration ---
        xlsCountBarChart = new Chart(xlsBarCtxLocal, { 
            type: 'bar', 
            data: { 
                labels: barChartLabels, 
                datasets: [{ 
                    data: finalBarData, 
                    backgroundColor: barChartColors
                }] 
            }, 
            options: { 
                indexAxis: 'y', 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    x: { beginAtZero: true, suggestedMax: maxBarValue, display: false }, 
                    y: { display: false } 
                }, 
                plugins: { 
                    legend: { display: false }, 
                    tooltip: { enabled: false },
                    datalabels: {
                        formatter: (value, context) => {
                            const label = context.chart.data.labels[context.dataIndex];
                             return `${label}\n${value.toFixed(2)}`;
                        },
                         color: (context) => context.dataset.backgroundColor[context.dataIndex],
                        font: {
                            weight: 'bold',
                            size: 12 * scaleFactor, // Scale the font
                        },
                        textAlign: 'center',
                        align: 'center',
                        anchor: 'center',
                    }
                } 
            } 
        });
        
        if (npsGaugeValueElement && npsGaugeNeedleElement) {
            const finalNeedleRotation = (npsScore / 100) * 90;
            npsGaugeValueElement.innerText = npsScore.toFixed(2);
            npsGaugeNeedleElement.style.transition = 'none';
            npsGaugeNeedleElement.style.transform = `translateX(-50%) rotate(-90deg)`;
            setTimeout(() => {
                npsGaugeNeedleElement.style.transition = `transform 2.1s ease-in-out`;
                npsGaugeNeedleElement.style.transform = `translateX(-50%) rotate(${finalNeedleRotation}deg)`;
            }, 250);
        }
    }

    function openXlsReportModal() {
        if (xlsReportModalOverlay) {
            initializeXLSReportCharts();
            xlsReportModalOverlay.classList.add('visible');
            
            setTimeout(() => {
                if (xlsNpsGaugeBackgroundChart) xlsNpsGaugeBackgroundChart.resize();
                if (xlsPercentagePieChart) xlsPercentagePieChart.resize();
                if (xlsCountBarChart) xlsCountBarChart.resize();
            }, 350);
        }
    }

    function closeXlsReportModal() {
        if (xlsReportModalOverlay) {
            xlsReportModalOverlay.classList.remove('visible');
            if (xlsNpsGaugeBackgroundChart) xlsNpsGaugeBackgroundChart.destroy();
            if (xlsPercentagePieChart) xlsPercentagePieChart.destroy();
            if (xlsCountBarChart) xlsCountBarChart.destroy();
        }
    }

    async function runLoopingAnimation() {
        animationIsRunning = true;
        document.getElementById('reportsPageContent').style.display = 'flex';

        while (true) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const xlsBadge = document.querySelector('[data-tour-id="reports-xls-1"]');
            if (xlsBadge) {
                await animateCursorToAndClick(xlsBadge, openXlsReportModal);
            }
            await new Promise(resolve => setTimeout(resolve, 3500));

            if (xlsReportModalCloseBtn && xlsReportModalOverlay?.classList.contains('visible')) {
                await animateCursorToAndClick(xlsReportModalCloseBtn, closeXlsReportModal);
            }
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }

    setTimeout(runLoopingAnimation, 1500);
    
    if (xlsReportModalCloseBtn) { xlsReportModalCloseBtn.addEventListener('click', closeXlsReportModal); }
    if (xlsReportModalOverlay) { xlsReportModalOverlay.addEventListener('click', (e) => { if (e.target === xlsReportModalOverlay) closeXlsReportModal(); }); }
});
