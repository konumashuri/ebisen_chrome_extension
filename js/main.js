/* global chrome */

function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = tab.url;
    console.assert(typeof url === 'string', 'tab.url should be a string');

    callback(url);
  });
}

function initData() {
  chrome.storage.local.get(function(values){
    if(typeof(values['read']) === 'undefined' && typeof(values['unread']) === 'undefined'){
      var urlHash = {
        read: {},
        unread: {}
      };
      console.log(urlHash);
      chrome.storage.local.set(urlHash);
      console.log('finish initialization.');
    }else{
      console.log('no need to initialization.');
    }
  });
}

var renderStatus = function(statusText, type){
  var html = '<div class="alert alert-' + type + '" role="alert">' + statusText + '</div>';
  document.getElementById('status').innerHTML = html;
};

var renderUrls = function(url_hash, date){
  console.log('rendering urls....');
  // render UNREAD list
  var unreadHtml = '<ol>';
  for(var unreadUrl in url_hash['unread'][date]){
    unreadHtml += '<li><a href=';
    unreadHtml += url_hash['unread'][date][unreadUrl];
    unreadHtml += ' class="unread-url" target="_blank">';
    unreadHtml += trim(url_hash['unread'][date][unreadUrl]);
    unreadHtml += '</a></li>';
  }
  unreadHtml += '</ol>';
  document.getElementById('unread-urls').innerHTML = unreadHtml;

  // read list
  var readHtml = '<ol>';
  for(var readUrl in url_hash['read'][date]){
    readHtml += '<li><a href=';
    readHtml += url_hash['read'][date][readUrl];
    readHtml += ' class="read-url" target="_blank">';
    readHtml += trim(url_hash['read'][date][readUrl]);
    readHtml += '</a></li>';
  }
  readHtml += '</ol>';
  document.getElementById('read-urls').innerHTML = readHtml;

  // add event lister after rendering
  console.log(className.length);
  for(var i = 0; i < className.length; i++) {
    className[i].addEventListener('click', moveUrlToRead, false);
  }
};

var trim = function(url) {
  return url.substring(0, 50) + '...';
};

var clearData = function() {
  chrome.storage.local.clear();
};

var dateParser = function() {
  var d = new Date();
  var date = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
  return date;
};

document.getElementById('clearButton').addEventListener('click', function() {
  var date = dateParser();

  clearData();
  initData();
  renderStatus('Cleared!', 'success');
  chrome.storage.local.get(function(values){
    renderUrls(values, date);
  });
});

document.getElementById('addButton').addEventListener('click', function() {
  getCurrentTabUrl(function(url) {
    console.log('Detecting if you have registered ' + url);

    var date = dateParser();

    chrome.storage.local.get(function(values){

      if(typeof(values['unread'][date]) === 'undefined'){
        values['unread'][date] = [];
      }

      if(values['unread'][date].includes(url)){
        console.log('Already Added!');
        renderStatus('Already Added!', 'info');
      }else{
        values['unread'][date].push(url);
        console.log('Added!');
        renderStatus('Added!', 'success');
      }

      chrome.storage.local.set(values);

      renderUrls(values, date);
    });
  });
});

window.onload = function(){
  // Prepare url hash in local storage
  initData();
  var date = dateParser();

  chrome.storage.local.get(function(values){
    renderUrls(values, date);
  });
};

// move url from unread urls to read urls
var className = document.getElementsByClassName('unread-url');
var moveUrlToRead = function(){
  console.log('move url to read list');
  var url = this.href;
  var date = dateParser();

  chrome.storage.local.get(function(values){
    var index = values['unread'][date].indexOf(url);
    if (index > -1){
      values['unread'][date].splice(index, 1);
      if(typeof(values['read'][date]) === 'undefined'){
        values['read'][date] = [];
      }
      values['read'][date].push(url);

      chrome.storage.local.set(values);
    }
  });
};
