// Hàm hiển thị toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
            type === 'error' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        z-index: 999999;
        animation: slideIn 0.3s ease-out;
        max-width: 350px;
        word-wrap: break-word;
    `;

    toast.textContent = message;
    document.body.appendChild(toast);

    // Thêm animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Tự động ẩn sau 4 giây
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Hàm chờ element xuất hiện (dùng querySelector)
function waitForElement(selector, timeout = 60000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkElement = () => {
            const element = document.querySelector(selector);

            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Timeout: Không tìm thấy ${selector} sau ${timeout/1000}s`));
            } else {
                setTimeout(checkElement, 300);
            }
        };

        checkElement();
    });
}

// Hàm chờ element xuất hiện (dùng xpath)
function waitForElementXPath(xpath, timeout = 60000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkElement = () => {
            const element = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;

            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Timeout: Không tìm thấy element sau ${timeout/1000}s`));
            } else {
                setTimeout(checkElement, 300);
            }
        };

        checkElement();
    });
}

// Hàm chờ text xuất hiện trong element
function waitForText(xpath, text, timeout = 60000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkText = () => {
            const element = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;

            if (element && element.textContent.includes(text)) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Timeout: Không thấy text "${text}" sau ${timeout/1000}s`));
            } else {
                setTimeout(checkText, 300);
            }
        };

        checkText();
    });
}

// Đợi trang load xong hoàn toàn
window.addEventListener("load", async () => {
    const posterId = new URLSearchParams(window.location.search).get("poster") || window.posterTarget;
    if (!posterId) return;

    console.log("Bắt đầu tự động bình chọn poster:", posterId);

    try {
        // Bước 1: Chờ ô input xuất hiện
        console.log("Đang chờ ô tìm kiếm...");
        const searchInput = await waitForElementXPath('//*[@id="root"]/div/div[1]/div[1]/input');
        console.log("Đã tìm thấy ô tìm kiếm!");

        // Bước 2: Điền giá trị vào ô tìm kiếm
        searchInput.value = posterId;
        searchInput.focus();
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log("Đã điền mã poster:", posterId);

        // Bước 3: Nhấn Enter để tìm kiếm
        await new Promise(resolve => setTimeout(resolve, 500));
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        });
        searchInput.dispatchEvent(enterEvent);
        console.log("Đã nhấn Enter để tìm kiếm");

        // Bước 4: Chờ poster xuất hiện và click để mở modal
        console.log("Đang chờ poster xuất hiện...");
        const posterCard = await waitForElementXPath('//*[@id="root"]/div/div[2]/div', 60000);
        console.log("Đã tìm thấy poster!");

        await new Promise(resolve => setTimeout(resolve, 1000));
        posterCard.click();
        console.log("Đã click vào poster để mở modal");

        // Bước 5: Chờ nút bình chọn xuất hiện trong modal
        console.log("Đang chờ nút bình chọn...");
        const voteButton = await waitForElementXPath('//*[@id="root"]/div/div[5]/div[2]/div/div[2]/div/button', 60000);
        console.log("Đã tìm thấy nút bình chọn!");

        // Kiểm tra xem đã bình chọn chưa
        const buttonText = voteButton.textContent.trim();
        console.log("Trạng thái nút:", buttonText);

        if (buttonText === 'Đã bình chọn') {
            console.log("Poster này đã được bình chọn rồi!");
            showToast(`Poster ${posterId} đã được bình chọn trước đó rồi!`, 'info');
            chrome.runtime.sendMessage({ type: 'voteResult', status: 'skip', posterId });
            return;
        }

        // Nếu chưa bình chọn, click vào nút
        await new Promise(resolve => setTimeout(resolve, 500));
        voteButton.click();
        console.log("Đã nhấn nút bình chọn");

        // Bước 6: Chờ nút chuyển sang "Đã bình chọn"
        console.log("Đang chờ xác nhận...");
        await waitForText('//*[@id="root"]/div/div[5]/div[2]/div/div[2]/div/button', 'Đã bình chọn', 60000);

        console.log("THÀNH CÔNG! Đã bình chọn poster:", posterId);
        showToast(`Bình chọn thành công poster ${posterId}! Cảm ơn bạn đã tham gia bình chọn.`, 'success');
        chrome.runtime.sendMessage({ type: 'voteResult', status: 'success', posterId });

    } catch (error) {
        console.error("Lỗi:", error.message);
        showToast(`Có lỗi xảy ra: ${error.message}. Vui lòng thử lại!`, 'error');
        chrome.runtime.sendMessage({ type: 'voteResult', status: 'error', posterId, error: error.message });
    }
});
