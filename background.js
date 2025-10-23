let isRunning = false;
let shouldStop = false;

// Tu dong mo start.html khi extension duoc load
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({ url: 'start.html' });
});

// Kiem tra va mo start.html khi khoi dong
(async () => {
  // Doi 1 giay de Chrome khoi dong xong
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Kiem tra xem da co tab start.html chua
  const tabs = await chrome.tabs.query({});
  const hasStartPage = tabs.some(tab => tab.url && tab.url.includes('start.html'));
  
  // Neu chua co, mo start.html
  if (!hasStartPage) {
    chrome.tabs.create({ url: 'start.html' });
  }
})();

// Mo popup tu dong khi tab voting duoc tao
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('binhchon.khoahoctre.com.vn/eureka-poster-2025.html')) {
    // Kiem tra xem co poster ID trong URL khong
    const urlParams = new URLSearchParams(new URL(tab.url).search);
    if (!urlParams.has('poster')) {
      // Neu khong co poster ID, mo popup de nguoi dung nhap
      chrome.action.openPopup();
    }
  }
});

chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === 'startVoting') {
    startVotingProcess();
  } else if (message.type === 'stopVoting') {
    shouldStop = true;
  } else if (message.type === 'voteResult') {
    // Chuyển tiếp kết quả đến tất cả popup đang mở
    chrome.runtime.sendMessage(message);
  }
});

async function startVotingProcess() {
  if (isRunning) return;
  
  isRunning = true;
  shouldStop = false;

  const { votingQueue } = await chrome.storage.local.get(['votingQueue']);
  if (!votingQueue || votingQueue.length === 0) {
    isRunning = false;
    return;
  }

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < votingQueue.length; i++) {
    if (shouldStop) {
      chrome.runtime.sendMessage({ 
        type: 'votingComplete', 
        data: { stopped: true, successCount, skipCount, errorCount }
      });
      break;
    }

    const posterId = votingQueue[i];
    
    // Cập nhật trạng thái
    const state = {
      isRunning: true,
      current: i + 1,
      total: votingQueue.length,
      currentPoster: posterId,
      successCount,
      skipCount,
      errorCount
    };
    
    await chrome.storage.local.set({ votingState: state });
    chrome.runtime.sendMessage({ type: 'updateStatus', data: state });

    try {
      const url = `https://binhchon.khoahoctre.com.vn/eureka-poster-2025.html?poster=${posterId}`;
      const tab = await chrome.tabs.create({ url, active: true });
      
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (id) => { window.posterTarget = id; },
        args: [posterId]
      });
      
      // Chờ kết quả từ content script
      const result = await new Promise((resolve) => {
        const listener = (message, sender) => {
          if (sender.tab && sender.tab.id === tab.id && message.type === 'voteResult') {
            chrome.runtime.onMessage.removeListener(listener);
            resolve(message);
          }
        };
        chrome.runtime.onMessage.addListener(listener);
        setTimeout(() => resolve({ status: 'timeout' }), 90000); // 90 giây = 1.5 phút
      });
      
      let logStatus = 'error';
      if (result.status === 'success') {
        successCount++;
        logStatus = 'success';
      } else if (result.status === 'skip') {
        skipCount++;
        logStatus = 'skip';
      } else {
        errorCount++;
        logStatus = 'error';
        // Chỉ hiện toast khi có lỗi
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: (msg) => {
                if (typeof showToast === 'function') {
                  showToast(msg, 'error');
                }
              },
              args: [`Lỗi khi bình chọn ${posterId}`]
            });
          }
        });
      }
      
      // Thêm log
      chrome.runtime.sendMessage({ 
        type: 'addLog', 
        data: { posterId, status: logStatus, message: result.error || '' }
      });
      
      // Chờ 3 giây để người dùng xem kết quả
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Đóng tab
      await chrome.tabs.remove(tab.id);
      
      // Chờ 1 giây trước khi xử lý poster tiếp theo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error("Lỗi:", error);
      errorCount++;
      chrome.runtime.sendMessage({ 
        type: 'addLog', 
        data: { posterId, status: 'error', message: error.message }
      });
    }
  }

  chrome.runtime.sendMessage({ 
    type: 'votingComplete', 
    data: { stopped: shouldStop, successCount, skipCount, errorCount }
  });
  
  // Xóa trạng thái
  await chrome.storage.local.remove(['votingQueue', 'votingState']);
  
  isRunning = false;
  shouldStop = false;
}
