let currentHistoryData = [];
let originalHistoryData = [];
let smoothingEnabled = false;
let noiseFilterEnabled = false;
let showOutliersOnly = false;
let currentSort = { column: 'time', direction: 'desc' };

// ========== HÀM PHÁT HIỆN OUTLIER ==========
function isOutlier(dustValue, previousWindow) {
    if (dustValue === 0) return true;
    if (previousWindow.length === 0) return false;
    const avg = previousWindow.reduce((a, b) => a + b, 0) / previousWindow.length;
    if (avg === 0) return dustValue > 0;
    const threshold = 3;
    return (dustValue > avg * threshold || dustValue < avg / threshold);
}

function markOutliers(records, windowSize = 3) {
    if (records.length <= windowSize) return records.map(r => ({ ...r, isOutlier: false }));
    const flagged = [];
    for (let i = 0; i < windowSize; i++) {
        flagged.push({ ...records[i], isOutlier: false });
    }
    for (let i = windowSize; i < records.length; i++) {
        const prevWindow = records.slice(i - windowSize, i).map(r => r.dust);
        const outlier = isOutlier(records[i].dust, prevWindow);
        flagged.push({ ...records[i], isOutlier: outlier });
    }
    return flagged;
}

// ========== DỮ LIỆU HIỆN TẠI ==========
async function loadCurrentData(hours) {
    const endTime = Date.now();
    const startTime = endTime - hours * 3600 * 1000;
    await loadDataForChart(startTime, endTime, hours);
}

async function loadCustomRange() {
    const startInput = document.getElementById('customStart').value;
    const endInput = document.getElementById('customEnd').value;
    if (!startInput || !endInput) return alert('Vui lòng chọn thời gian!');
    const startTime = new Date(startInput).getTime();
    const endTime = new Date(endInput).getTime();
    if (startTime >= endTime) return alert('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc!');
    await loadDataForChart(startTime, endTime, null);
}

async function loadDataForChart(startTime, endTime, hoursLabel) {
    try {
        const data = await fetchFirebaseData();
        if (!data) return;

        let records = Object.keys(data).map(key => {
            const record = data[key];
            const timeMs = record.time ? new Date(record.time).getTime() : null;
            return { ...record, id: key, timeMs };
        }).filter(r => r.timeMs && r.timeMs >= startTime && r.timeMs <= endTime && r.dust > 0)
          .sort((a, b) => a.timeMs - b.timeMs);

        if (records.length === 0) {
            alert('Không có dữ liệu hợp lệ (dust > 0) trong khoảng thời gian này!');
            return;
        }

        const latest = records[records.length - 1];
        document.getElementById('currentTemp').innerText = (latest.temp !== undefined) ? latest.temp.toFixed(1) + ' °C' : '--';
        document.getElementById('currentHumidity').innerText = (latest.humi !== undefined) ? latest.humi.toFixed(1) + ' %' : '--';
        const dustUg = (latest.dust !== undefined) ? (latest.dust * 1000).toFixed(1) : '--';
        document.getElementById('currentPm25').innerText = dustUg + ' µg/m³';

        let labels = records.map(r => moment(r.timeMs).format('HH:mm DD/MM'));
        let tempData = records.map(r => r.temp || 0);
        let humiData = records.map(r => r.humi || 0);
        let dustData = records.map(r => (r.dust || 0) * 1000);

        if (noiseFilterEnabled) {
            tempData = filterOutliers(tempData);
            humiData = filterOutliers(humiData);
            dustData = filterOutliers(dustData);
        }

        if (smoothingEnabled) {
            const windowSize = 5;
            tempData = smoothArray(tempData, windowSize);
            humiData = smoothArray(humiData, windowSize);
            dustData = smoothArray(dustData, windowSize);
        }

        renderCharts(labels, tempData, humiData, dustData);
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        alert('Không thể kết nối Firebase. Vui lòng kiểm tra cấu hình và thử lại.');
    }
}

// ========== LỊCH SỬ ==========
async function loadHistoryData() {
    const startInput = document.getElementById('startDateTime').value;
    const endInput = document.getElementById('endDateTime').value;
    if (!startInput || !endInput) return alert('Vui lòng chọn thời gian!');
    const startTime = new Date(startInput).getTime();
    const endTime = new Date(endInput).getTime();
    if (startTime >= endTime) return alert('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc!');

    try {
        const data = await fetchFirebaseData();
        if (!data) return;

        let records = Object.keys(data).map(key => {
            const record = data[key];
            const timeMs = record.time ? new Date(record.time).getTime() : null;
            return { ...record, id: key, timeMs };
        }).filter(r => r.timeMs && r.timeMs >= startTime && r.timeMs <= endTime && r.dust > 0)
          .sort((a, b) => a.timeMs - b.timeMs);

        const flaggedRecords = markOutliers(records);
        originalHistoryData = flaggedRecords.map(r => ({ ...r }));
        currentHistoryData = originalHistoryData.map(r => ({ ...r }));
        if (showOutliersOnly) {
            applyOutlierFilter();
        } else {
            sortHistory(currentSort.column, currentSort.direction);
        }
    } catch (error) {
        console.error('Lỗi tải lịch sử:', error);
        alert('Lỗi kết nối Firebase.');
    }
}

function applyOutlierFilter() {
    if (!originalHistoryData.length) return;
    if (showOutliersOnly) {
        currentHistoryData = originalHistoryData.filter(r => r.isOutlier === true);
    } else {
        currentHistoryData = originalHistoryData.map(r => ({ ...r }));
    }
    sortHistory(currentSort.column, currentSort.direction);
}

function displayHistoryTable(records) {
    const tbody = document.getElementById('historyTableBody');
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Không có dữ liệu (đã lọc bỏ dust=0)</td></tr>';
        return;
    }

    let html = '';
    records.forEach(record => {
        const dustUg = record.dust * 1000;
        const aqi = calculateAQI(dustUg);
        const colorClass = getAQIColorClass(aqi);
        const warning = getAQIWarning(aqi);
        const rowClass = record.isOutlier ? 'table-warning' : '';
        html += `<tr class="${rowClass}">
            <td>${moment(record.timeMs).format('DD/MM/YYYY HH:mm')}</td>
            <td>${(record.temp || 0).toFixed(1)}</td>
            <td>${(record.humi || 0).toFixed(1)}</td>
            <td>${dustUg.toFixed(1)}</td>
            <td><span class="aqi-indicator ${colorClass}"></span> ${aqi}</td>
            <td>${warning}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ========== SẮP XẾP ==========
function sortHistory(column, direction) {
    if (!currentHistoryData.length) return;

    const sorted = [...currentHistoryData];
    sorted.sort((a, b) => {
        let valA, valB;
        switch (column) {
            case 'time':
                valA = a.timeMs;
                valB = b.timeMs;
                break;
            case 'temp':
                valA = a.temp || 0;
                valB = b.temp || 0;
                break;
            case 'humi':
                valA = a.humi || 0;
                valB = b.humi || 0;
                break;
            case 'dust':
                valA = a.dust || 0;
                valB = b.dust || 0;
                break;
            case 'aqi':
                valA = calculateAQI((a.dust || 0) * 1000);
                valB = calculateAQI((b.dust || 0) * 1000);
                break;
            case 'warning':
                valA = getAQIWarning(calculateAQI((a.dust || 0) * 1000));
                valB = getAQIWarning(calculateAQI((b.dust || 0) * 1000));
                break;
            default:
                return 0;
        }
        if (direction === 'asc') {
            return valA > valB ? 1 : (valA < valB ? -1 : 0);
        } else {
            return valA < valB ? 1 : (valA > valB ? -1 : 0);
        }
    });

    currentHistoryData = sorted;
    displayHistoryTable(sorted);
    updateSortIcons(column, direction);
}

function initSortHandlers() {
    const headers = document.querySelectorAll('#historyTable th');
    headers.forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort-key');
            if (!column) return;

            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }
            sortHistory(currentSort.column, currentSort.direction);
        });
    });
}

function updateSortIcons(activeColumn, direction) {
    const headers = document.querySelectorAll('#historyTable th');
    headers.forEach(th => {
        const icon = th.querySelector('i');
        if (!icon) return;
        const column = th.getAttribute('data-sort-key');
        if (column === activeColumn) {
            icon.className = direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        } else {
            icon.className = 'fas fa-sort';
        }
    });
}

function exportToExcel() {
    if (currentHistoryData.length === 0) return alert('Không có dữ liệu!');
    const excelData = currentHistoryData.map(record => {
        const dustUg = record.dust * 1000;
        const aqi = calculateAQI(dustUg);
        return {
            'Thời gian': moment(record.timeMs).format('DD/MM/YYYY HH:mm'),
            'Nhiệt độ (°C)': (record.temp || 0).toFixed(1),
            'Độ ẩm (%)': (record.humi || 0).toFixed(1),
            'PM2.5 (µg/m³)': dustUg.toFixed(1),
            'AQI': aqi,
            'Cảnh báo': getAQIWarning(aqi)
        };
    });
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lịch sử chất lượng không khí');
    XLSX.writeFile(wb, `airquality_history_${moment().format('YYYYMMDD_HHmm')}.xlsx`);
}

// ========== DỰ ĐOÁN ==========
async function runPrediction() {
    const minutes = parseInt(document.getElementById('predictMinutes').value);
    if (isNaN(minutes) || minutes < 1 || minutes > 120) {
        alert('Vui lòng nhập số phút từ 1 đến 120!');
        return;
    }

    const errorDiv = document.getElementById('predictionError');
    const successDiv = document.getElementById('predictionSuccess');
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    const endTime = Date.now();
    const startTime = endTime - 3 * 24 * 3600 * 1000;

    try {
        const data = await fetchFirebaseData();
        if (!data) return;

        let records = Object.keys(data).map(key => {
            const record = data[key];
            const timeMs = record.time ? new Date(record.time).getTime() : null;
            return { ...record, timeMs };
        }).filter(r => r.timeMs && r.timeMs >= startTime && r.timeMs <= endTime && r.dust > 0)
          .sort((a, b) => a.timeMs - b.timeMs);

        if (records.length < 10) {
            errorDiv.innerText = 'Không đủ dữ liệu hợp lệ (cần ít nhất 10 bản ghi) trong 3 ngày qua.';
            errorDiv.style.display = 'block';
            return;
        }

        let temps = records.map(r => r.temp);
        let humis = records.map(r => r.humi);
        let dusts = records.map(r => r.dust * 1000);  // µg/m³

        // Giới hạn trên cho bụi: không vượt quá 130% giá trị lịch sử lớn nhất
        const maxHistoricalDust = Math.max(...dusts);
        const DUST_UPPER_LIMIT = Math.max(maxHistoricalDust * 1.3, 500); // tối thiểu 500 µg/m³

        if (noiseFilterEnabled) {
            temps = filterOutliers(temps);
            humis = filterOutliers(humis);
            dusts = filterOutliers(dusts);
        }

        if (smoothingEnabled) {
            const windowSize = 5;
            temps = smoothArray(temps, windowSize);
            humis = smoothArray(humis, windowSize);
            dusts = smoothArray(dusts, windowSize);
        }

      
        const LAG = 60;

        // Hàm dự đoán hồi quy tuyến tính có chặn giới hạn
        function linearPredictionBounded(yValues, steps, lowerBound = 0, upperBound = Infinity) {
            const n = yValues.length;
            if (n < 2) return yValues[n - 1];
            const x = Array.from({ length: n }, (_, i) => i);
            const sumX = x.reduce((a, b) => a + b, 0);
            const sumY = yValues.reduce((a, b) => a + b, 0);
            const sumXY = x.reduce((a, _, i) => a + x[i] * yValues[i], 0);
            const sumXX = x.reduce((a, _, i) => a + x[i] * x[i], 0);
            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            let predicted = intercept + slope * (n - 1 + steps);

            if (predicted < lowerBound) predicted = lowerBound;
            if (predicted > upperBound) predicted = upperBound;
            return predicted;
        }

        let lastTemps = temps.slice(-LAG);
        let lastHumis = humis.slice(-LAG);
        let lastDusts = dusts.slice(-LAG);

        const minutesToPredict = minutes;
        const futureTimes = [];
        const futureTemps = [];
        const futureHumis = [];
        const futureDusts = [];

        const MAX_CHANGE_RATE = 0.15; // không tăng/giảm quá 15% mỗi phút

        for (let step = 1; step <= minutesToPredict; step++) {
            let predTemp = linearPredictionBounded(lastTemps, 1, 0, 60);
            let predHumi = linearPredictionBounded(lastHumis, 1, 0, 100);
            let predDust = linearPredictionBounded(lastDusts, 1, 0, DUST_UPPER_LIMIT);

            // Giới hạn tốc độ thay đổi bụi
            const lastDustVal = lastDusts[lastDusts.length - 1];
            if (lastDustVal > 0) {
                const maxIncrease = lastDustVal * (1 + MAX_CHANGE_RATE);
                const maxDecrease = lastDustVal * (1 - MAX_CHANGE_RATE);
                if (predDust > maxIncrease) predDust = maxIncrease;
                if (predDust < maxDecrease) predDust = maxDecrease;
            }

            futureTemps.push(predTemp);
            futureHumis.push(predHumi);
            futureDusts.push(predDust);

            // Cập nhật cửa sổ trượt
            lastTemps.shift(); lastTemps.push(predTemp);
            lastHumis.shift(); lastHumis.push(predHumi);
            lastDusts.shift(); lastDusts.push(predDust);

            futureTimes.push(endTime + step * 60 * 1000);
        }

        renderPredictionChart(futureTimes, futureTemps, futureHumis, futureDusts);
        successDiv.innerText = `Dự đoán ${minutes} phút tiếp theo thành công! (Giới hạn bụi ≤ ${DUST_UPPER_LIMIT.toFixed(0)} µg/m³)`;
        successDiv.style.display = 'block';
    } catch (error) {
        console.error('Lỗi dự đoán:', error);
        errorDiv.innerText = 'Lỗi khi chạy dự đoán: ' + error.message;
        errorDiv.style.display = 'block';
    }
}

// ========== CÁC HÀM HỖ TRỢ KHÁC ==========
function filterOutliers(data, windowSize = 3, threshold = 3) {
    if (data.length <= windowSize) return data.slice();
    const filtered = [];
    for (let i = 0; i < windowSize; i++) filtered.push(data[i]);
    for (let i = windowSize; i < data.length; i++) {
        const recent = data.slice(i - windowSize, i);
        const avg = recent.reduce((a, b) => a + b, 0) / windowSize;
        if (data[i] > avg * threshold || data[i] < avg / threshold) {
            filtered.push(avg);
        } else {
            filtered.push(data[i]);
        }
    }
    return filtered;
}

// ========== KHỞI TẠO SỰ KIỆN DOM ==========
document.addEventListener('DOMContentLoaded', function () {
    loadConfigFromStorage();

    document.getElementById('firebaseHost').value = firebaseHost;
    document.getElementById('firebaseAuth').value = firebaseAuth;
    document.getElementById('firebasePath').value = firebasePath;

    setDefaultHistoryTimes();
    setDefaultCustomTimes();

    loadCurrentData(3);

    document.getElementById('historyForm').addEventListener('submit', function (e) {
        e.preventDefault();
        loadHistoryData();
    });

    document.getElementById('configForm').addEventListener('submit', function (e) {
        e.preventDefault();
        if (saveConfig()) alert('Lưu cấu hình thành công!');
    });

    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);

    const smoothToggle = document.getElementById('smoothToggle');
    if (smoothToggle) {
        smoothToggle.addEventListener('change', function (e) {
            smoothingEnabled = e.target.checked;
            loadCurrentData(3);
        });
    }

    const noiseToggle = document.getElementById('noiseFilterToggle');
    if (noiseToggle) {
        noiseToggle.addEventListener('change', function (e) {
            noiseFilterEnabled = e.target.checked;
            loadCurrentData(3);
        });
    }

    const outliersOnlyToggle = document.getElementById('showOutliersOnlyToggle');
    if (outliersOnlyToggle) {
        outliersOnlyToggle.addEventListener('change', function (e) {
            showOutliersOnly = e.target.checked;
            if (originalHistoryData.length) {
                applyOutlierFilter();
            }
        });
    }

    initSortHandlers();

    setInterval(() => {
        if (document.getElementById('current-tab').classList.contains('active')) {
            loadCurrentData(3);
        }
    }, 30000);
});