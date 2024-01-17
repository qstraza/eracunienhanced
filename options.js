chrome.storage.sync.get('websiteurl', function(data) {
  if (data.websiteurl === 'undefined') {
    data.websiteurl = "";
  }
  document.getElementById("websiteurl").value = data.websiteurl;
});

chrome.storage.sync.get('authtoken', function(data) {
  if (data.authtoken === 'undefined') {
    data.authtoken = "";
  }
  document.getElementById("authtoken").value = data.authtoken;
});

document.getElementById("form").addEventListener('submit', function(e){
  e.preventDefault();
  let url = document.getElementById("websiteurl").value;
  let authtoken = document.getElementById("authtoken").value;
  chrome.storage.sync.set(
    {
      websiteurl: url,
      authtoken: authtoken
    }, function() {
  })
});
