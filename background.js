chrome.webRequest.onBeforeRequest.addListener(function (request) {
    console.log("Intercepted request URL:", request.url);
    if (!request.url.startsWith("chrome-extension://")) {
      {
        chrome.tabs.query({
          active: true,
          currentWindow: true
        }, function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "addParameter",
            url: request.url
          });
        });
      }
    }
  }, {
    urls: ["<all_urls>"]
  }, ["blocking"]);