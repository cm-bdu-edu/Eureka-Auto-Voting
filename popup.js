// Chọn tất cả
document.getElementById("selectAll").addEventListener("change", (e) => {
  const select = document.getElementById("posterId");
  const options = select.options;
  for (let i = 0; i < options.length; i++) {
    options[i].selected = e.target.checked;
  }
});

// Nút bình chọn
document.getElementById("goBtn").addEventListener("click", async () => {
  const select = document.getElementById("posterId");
  const selectedOptions = Array.from(select.selectedOptions).map(opt => opt.value);
  
  if (selectedOptions.length === 0) {
    return alert("Vui lòng chọn ít nhất một mã poster!");
  }

  // Kiểm tra xem có chrome API không
  if (typeof chrome === 'undefined' || !chrome.storage) {
    alert("Vui lòng mở extension bằng cách:\n1. Click vào icon Extensions (puzzle)\n2. Chọn 'Bình chọn Eureka Poster'\n\nHoặc chạy lại file run-voting.vbs");
    return;
  }

  try {
    // Lưu danh sách vào storage
    await chrome.storage.local.set({
      votingQueue: selectedOptions,
      votingState: {
        isRunning: true,
        current: 0,
        total: selectedOptions.length,
        currentPoster: selectedOptions[0],
        successCount: 0,
        skipCount: 0,
        errorCount: 0
      }
    });

    // Lấy kích thước màn hình và tính toán vị trí góc phải
    chrome.system.display.getInfo((displays) => {
      const primaryDisplay = displays[0];
      const screenWidth = primaryDisplay.workArea.width;
      
      const windowWidth = 400;
      const windowHeight = 600;
      
      // Vị trí góc phải màn hình (cách lề 20px)
      const left = screenWidth - windowWidth - 20;
      const top = 20;
      
      // Mở cửa sổ trạng thái ở góc phải
      chrome.windows.create({
        url: 'status-window.html',
        type: 'popup',
        width: windowWidth,
        height: windowHeight,
        left: left,
        top: top
      });
    });

    // Gửi message đến background script để bắt đầu
    chrome.runtime.sendMessage({ type: 'startVoting' });

    // Đóng popup/tab hiện tại
    setTimeout(() => {
      window.close();
    }, 500);
    
  } catch (error) {
    console.error('Lỗi:', error);
    alert('Có lỗi xảy ra: ' + error.message);
  }
});
