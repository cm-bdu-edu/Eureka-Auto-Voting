let logs = [];

// Lắng nghe cập nhật từ background
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'updateStatus') {
        updateUI(message.data);
    } else if (message.type === 'votingComplete') {
        document.getElementById('currentPoster').querySelector('.current-poster-id').textContent = 
            message.data.stopped ? 'Đã dừng!' : 'Hoàn thành!';
        document.getElementById('stopBtn').disabled = true;
    } else if (message.type === 'addLog') {
        addLog(message.data);
    }
});

// Khôi phục trạng thái ban đầu
chrome.storage.local.get(['votingState'], (result) => {
    if (result.votingState) {
        updateUI(result.votingState);
    }
});

function updateUI(state) {
    const { current, total, currentPoster, successCount, skipCount, errorCount } = state;
    
    // Cập nhật poster hiện tại
    document.getElementById('currentPoster').querySelector('.current-poster-id').textContent = currentPoster;
    
    // Cập nhật progress bar
    const progress = (current / total) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = `${current} / ${total}`;
    
    // Cập nhật stats
    document.getElementById('successCount').textContent = successCount || 0;
    document.getElementById('skipCount').textContent = skipCount || 0;
    document.getElementById('errorCount').textContent = errorCount || 0;
}

function addLog(data) {
    const { posterId, status, message } = data;
    
    logs.unshift({ posterId, status, message });
    if (logs.length > 20) logs.pop(); // Giữ tối đa 20 log
    
    const logSection = document.getElementById('logSection');
    logSection.innerHTML = '';
    
    logs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = `log-item ${log.status}`;
        logItem.innerHTML = `
            <span>${log.posterId}</span>
            <span class="log-status">${
                log.status === 'success' ? 'Thành công' :
                log.status === 'skip' ? 'Bỏ qua' : 'Lỗi'
            }</span>
        `;
        logSection.appendChild(logItem);
    });
}

// Nút ẩn
document.getElementById('hideBtn').addEventListener('click', () => {
    window.close();
});

// Nút dừng
document.getElementById('stopBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'stopVoting' });
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('stopBtn').textContent = 'Đang dừng...';
});
