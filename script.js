document.addEventListener('DOMContentLoaded', () => {
    // --- Elements for Loading and Resizing ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const pageContainer = document.querySelector('.page-container');
    if (!pageContainer || !loadingIndicator) {
        console.error("Core elements (page-container or loading-indicator) not found!");
        return;
    }

    // --- Core Application Logic ---
    const fakeMouseCursor = document.getElementById('fakeMouseCursor');
    const xlsReportModalOverlay = document.getElementById('xlsReportModalOverlay');
    const xlsReportModalCloseBtn = document.getElementById('xlsReportModalCloseBtn');
    
    let xlsNpsGaugeBackgroundChart, xlsPercentagePieChart, xlsCountBarChart;
    let animationIsRunning = false;
    let currentScaleFactor = 1;

    const cursorAnimationDuration = 700;
    const cursorClickVisualDelay = 150;

    // --- RESIZE OBSERVER LOGIC ---
    const handleResize = (entry) => {
        const containerWidth = entry.contentRect.width;
        // Base width of the original design is 1200px.
        // The scale factor is the current width divided by the base width.
        const newScaleFactor = containerWidth / 1200;
        
        currentScaleFactor = newScaleFactor;
        
        // Update the CSS variable on the page container element.
        pageContainer.style.setProperty('--scale-factor', newScaleFactor);
    };

    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            handleResize(entry);
        }
    });
    resizeObserver.observe(pageContainer);
    // --- END RESIZE OBSERVER ---


    async function animateCursorToAndClick(targetElement, actionToTrigger) {
        if (!fakeMouseCursor || !targetElement) return;
        fakeMouseCursor.classList.remove('clicking');
        fakeMouseCursor.classList.add('visible');
        const targetRect = targetElement.getBoundingClientRect();
        
        // We now get the font size of the body to scale the cursor appropriately
        const bodyFontSize = parseFloat(getComputedStyle(document.body).fontSize);
        const cursorSize = 1.5 * bodyFontSize; // 1.5em
        
        const targetX = targetRect.left + (targetRect.width / 2);
        const targetY = targetRect.top + (targetRect.height / 2);
        fakeMouseCursor.style.left = `${targetX - (cursorSize / 4)}px`;
        fakeMouseCursor.style.top = `${targetY - (cursorSize / 4)}px`;
        await new Promise(resolve => setTimeout(resolve, cursorAnimationDuration + 100));
        if (!animationIsRunning) { fakeMouseCursor.classList.remove('visible'); return; }
        fakeMouseCursor.classList.add('clicking');
        await new Promise(resolve => setTimeout(resolve, cursorClickVisualDelay + 50));
        if (actionToTrigger) actionToTrigger();
        await new Promise(resolve => setTimeout(resolve, cursorClickVisualDelay / 2 + 50));
        fakeMouseCursor.classList.remove('clicking');
    }

    function initializeXLSReportCharts() {
        // We use the globally updated 'currentScaleFactor'
        const scaleFactor = currentScaleFactor;

        const xlsNpsGaugeCtxLocal = document.getElementById('xlsReportModal').querySelector('#xlsNpsGaugeBackgroundChart')?.getContext('2d');
        const xlsPieCtxLocal = document.getElementById('xlsReportModal').querySelector('#xlsPercentagePieChart')?.getContext('2d');
        const xlsBarCtxLocal = document.getElementById('xlsReportModal').querySelector('#xlsCountBarChart')?.getContext('2d');
        if (!xlsNpsGaugeCtxLocal || !xlsPieCtxLocal || !xlsBarCtxLocal) { console.error("XLS canvas contexts not found!"); return; }
        if (xlsNpsGaugeBackgroundChart) xlsNpsGaugeBackgroundChart.destroy();
        if (xlsPercentagePieChart) xlsPercentagePieChart.destroy();
        if (xlsCountBarChart) xlsCountBarChart.destroy();

        const npsGaugeValueElement = document.getElementById('xlsReportModal').querySelector('#xlsNpsGaugeValue');
        const npsGaugeNeedleElement = document.getElementById('xlsReportModal').querySelector('#xlsNpsGaugeNeedle');

        const promoterColor = '#1E8449';
        const passiveColor = '#B7950B';
        const detractorColor = '#943126';

        const npsScore = 65.00;
        const totalPromoters = 62;
        const totalPassives = 10;
        const totalDetractors = 8;
        const totalResponses = totalPromoters + totalPassives + totalDetractors;

        const promoterPercent = (totalResponses > 0) ? (totalPromoters / totalResponses) * 100 : 0;
        const passivePercent = (totalResponses > 0) ? (totalPassives / totalResponses) * 100 : 0;
        const detractorPercent = (totalResponses > 0) ? (totalDetractors / totalResponses) * 100 : 0;
        
        const pieChartData = [promoterPercent, passivePercent, detractorPercent];
        const pieChartLabels = ['Promoters', 'Passives', 'Detractors'];
        const pieChartColors = [promoterColor, passiveColor, detractorColor];

        const barChartData = [promoterPercent, passivePercent, detractorPercent];
        const barChartLabels = ['Promoters', 'Passives', 'Detractors'];
        const barChartColors = [promoterColor, passiveColor, detractorColor];
        const barChartRawCounts = [totalPromoters, totalPassives, totalDetractors];

        Chart.register(ChartDataLabels);

        xlsNpsGaugeBackgroundChart = new Chart(xlsNpsGaugeCtxLocal, { type: 'doughnut', data: { datasets: [{ data: [50, 25, 25], backgroundColor: [detractorColor, passiveColor, promoterColor], borderWidth: 0, circumference: 180, rotation: -90, }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false }, datalabels: { display: false } }, animation: { duration: 0 } } });
        
        xlsPercentagePieChart = new Chart(xlsPieCtxLocal, { 
            type: 'pie', 
            data: { 
                labels: pieChartLabels,
                datasets: [{ data: pieChartData, backgroundColor: pieChartColors, borderColor: '#ffffff', borderWidth: 2 * scaleFactor, }] 
            }, 
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false }, datalabels: { formatter: (v, c) => `${c.chart.data.labels[c.dataIndex]}\n${v.toFixed(2)}%`, color: 'white', font: { weight: 'bold', size: 11 * scaleFactor, }, textStrokeColor: 'rgba(0,0,0,0.5)', textStrokeWidth: 4, align: 'center', anchor: 'center', } } } 
        });
        
        xlsCountBarChart = new Chart(xlsBarCtxLocal, { 
            type: 'bar', 
            data: { 
                labels: barChartLabels, 
                datasets: [{ data: barChartData, backgroundColor: barChartColors }] 
            }, 
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { beginAtZero: true, max: 100, display: false }, y: { display: false } }, plugins: { legend: { display: false }, tooltip: { enabled: false }, datalabels: { formatter: (v, c) => { const label = c.chart.data.labels[c.dataIndex]; const rawCount = barChartRawCounts[c.dataIndex]; return `${label}\n${rawCount}`; }, color: 'white', font: { weight: 'bold', size: 11 * scaleFactor, }, align: 'start', anchor: 'start', offset: 8, } } } 
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
        pageContainer.classList.remove('hidden');
        loadingIndicator.style.display = 'none';

        animationIsRunning = true;
        document.getElementById('reportsPageContent').style.display = 'flex';

        while (true) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const xlsBadge = document.querySelector('[data-tour-id="reports-xls-1"]');
            if (xlsBadge) await animateCursorToAndClick(xlsBadge, openXlsReportModal);
            await new Promise(resolve => setTimeout(resolve, 3500));
            if (xlsReportModalCloseBtn && xlsReportModalOverlay?.classList.contains('visible')) {
                await animateCursorToAndClick(xlsReportModalCloseBtn, closeXlsReportModal);
            }
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }

    setTimeout(runLoopingAnimation, 1000);
    
    if (xlsReportModalCloseBtn) { xlsReportModalCloseBtn.addEventListener('click', closeXlsReportModal); }
    if (xlsReportModalOverlay) { xlsReportModalOverlay.addEventListener('click', (e) => { if (e.target === xlsReportModalOverlay) closeXlsReportModal(); }); }
});
