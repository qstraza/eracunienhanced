chrome.storage.sync.get('apiurl', function(data) {
  if (data.apiurl === 'undefined') {
    data.apiurl = "";
  }
  document.getElementById("webapiurl").value = data.apiurl;
});

chrome.storage.sync.get('proxyurl', function(data) {
  if (data.proxyurl === 'undefined') {
    data.proxyurl = "";
  }
  document.getElementById("proxyurl").value = data.proxyurl;
});

document.getElementById("form").addEventListener('submit', function(e){
  e.preventDefault();
  let url = document.getElementById("webapiurl").value;
  let proxy = document.getElementById("proxyurl").value;
  chrome.storage.sync.set(
    {
      apiurl: url,
      proxyurl: proxy
    }, function() {
  })
});
