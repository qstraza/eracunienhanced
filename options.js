chrome.storage.sync.get('apiurl', function(data) {
  document.getElementById("webapiurl").value = data.apiurl;
});

document.getElementById("form").addEventListener('submit', function(e){
  e.preventDefault();
  let url = document.getElementById("webapiurl").value;
  chrome.storage.sync.set(
    {
      apiurl: url
    }, function() {
    console.log('color is ' + url);
  })
});
