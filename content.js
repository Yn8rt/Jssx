const parametersSet = new Set();
let scanScheduled = false;

//下面是针对的标签，这里只有a的herf标签和form标签
function extractParameters() {
    const anchorElements = document.querySelectorAll("a[href]");
    anchorElements.forEach((anchorElement) => {
        try {
            const urlObject = new URL(anchorElement.href);
            if (!urlObject.href.startsWith("chrome-extension://")) {
                const pathname = urlObject.pathname;
                const searchParams = new URLSearchParams(urlObject.search);
                for (const [key, value] of searchParams.entries()) {
                    parametersSet.add(
                        "" +
                            urlObject.origin +
                            pathname +
                            "?" +
                            key +
                            "=" +
                            value
                    );
                }
            }
        } catch (error) {
            console.error("处理 URL 时出错:", anchorElement.href, error);
        }
    });

    const formElements = document.querySelectorAll("form");
    formElements.forEach((formElement) => {
        try {
            const formData = new FormData(formElement);
            for (const [key, value] of formData.entries()) {
                if (
                    formElement.action &&
                    !formElement.action.startsWith("chrome-extension://")
                ) {
                    parametersSet.add(
                        formElement.action + "?" + key + "=" + value
                    );
                }
            }
        } catch (error) {
            console.error("处理表单时出错:", formElement, error);
        }
    });

    // 发送所有收集到的参数
    chrome.runtime.sendMessage({
        action: "sendParameters",
        parameters: Array.from(parametersSet),
    });
}

function scheduleScan(delay) {
    if (!scanScheduled) {
        scanScheduled = true;
        setTimeout(() => {
            extractParameters();
            scanScheduled = false;
        }, delay);
    }
}

// 初始扫描
extractParameters();

// 延迟扫描（500ms 后）
scheduleScan(500);

// 再次延迟扫描（1s 后）
scheduleScan(1000);

// 使用 MutationObserver 监控文档变化
const observer = new MutationObserver(extractParameters);
observer.observe(document.body, { childList: true, subtree: true });

document.addEventListener("click", function (event) {
    if (
        event.target &&
        event.target.id === "forgotPassword"
    ) {
        setTimeout(extractParameters, 100);
    }
});

chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
) {
    if (message.action === "getAllParameters") {
        sendResponse({ parameters: Array.from(parametersSet) });
    } else if (message.action === "addParameter") {
        parametersSet.add(message.url);
    }
});