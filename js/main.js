/* global chrome, $ */

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
      chrome.storage.local.set(urlHash);
      console.log('finish initialization.');
    }else{
      console.log('no need to initialization.');
    }
  });
}

var renderStatus = function(statusText, type){
  var html = '<div class="alert alert-' + type + '" role="alert">' + statusText + '</div>';
  $('#status').html(html);
};

var renderUrls = function(url_hash, date){
  console.log('rendering urls....');
  // render UNREAD list
  if(url_hash['unread'][date][0]){
    var unreadHtml = '<ol>';
    for(var unreadUrl in url_hash['unread'][date]){
      unreadHtml += '<li><a href=';
      unreadHtml += url_hash['unread'][date][unreadUrl];
      unreadHtml += ' class="unread-url" target="_blank">';
      unreadHtml += trim(url_hash['unread'][date][unreadUrl]);
      unreadHtml += '</a></li>';
    }
    unreadHtml += '</ol>';
    $('#unread-urls').html(unreadHtml);
  }else{
    var noUrls = '<p>Nothing to Read</p>';
    $('#unread-urls').html(noUrls);
  }

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
  $('#read-urls').html(readHtml);

  // add event lister after rendering
  $('.unread-url').on('click', moveUrlToRead);
};

var trim = function(url) {
  return url.substring(0, 50) + '...';
};

var clearData = function() {
  chrome.storage.local.clear();
};

var dateParser = function(d) {
  var date = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
  return date;
};

var return_today = function() {
  var d = new Date();
  var date = dateParser(d);
  return date;
};

var dateArray = function(){
  // ["6/13/2016", "6/14/2016", "6/20/2016", "6/27/2016", "7/13/2016"]
  var d = new Date();
  var array, today, tomorrow, few_days, week, few_weeks, month;
  today = return_today();

  d.setDate(d.getDate() + 1);
  tomorrow = dateParser(d);

  d.setDate(d.getDate() + 2);
  few_days = dateParser(d);

  d.setDate(d.getDate() + 4);
  week = dateParser(d);

  d.setDate(d.getDate() + 7);
  few_weeks = dateParser(d);

  d.setDate(d.getDate() + 14);
  month = dateParser(d);

  array = [today, tomorrow, few_days, week, few_weeks, month];
  return array;
};

$('#clearButton').on('click', function() {
  var date = return_today();

  clearData();
  initData();
  renderStatus('Cleared!', 'success');
  chrome.storage.local.get(function(values){
    renderUrls(values, date);
  });
});

$('#addButton').on('click', function() {
  getCurrentTabUrl(function(url) {
    console.log('Detecting if you have registered ' + url);

    var today = return_today();
    var dates = dateArray();
    console.log(dates);

    chrome.storage.local.get(function(values){
      $.each(dates, function(){
        if(typeof(values['unread'][this]) === 'undefined'){
          values['unread'][this] = [];
        }

        if(values['unread'][this].includes(url)){
          console.log('Already Added!');
          renderStatus('Already Added!', 'info');
        }else{
          values['unread'][this].push(url);
          console.log('Added!');
          renderStatus('Added!', 'success');
        }

        chrome.storage.local.set(values);

        renderUrls(values, today);
      });
    });
  });
});

window.onload = function(){
  // Prepare url hash in local storage
  initData();
  var date = return_today();

  chrome.storage.local.get(function(values){
    renderUrls(values, date);
  });
};

// move url from unread urls to read urls
var moveUrlToRead = function(){
  console.log('move url to read list');
  var url = this.href;
  var date = return_today();

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
