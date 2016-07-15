/*global chrome */

(function() {
  chrome.tabs.onActivated.addListener(function() {
    var d = new Date();
    var date = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();

    chrome.storage.local.get(function(values){
      var count = values['unread'][date].length;
      if(count > 0){
        return chrome.browserAction.setBadgeText({ text: count.toString() });
      }else{
        return chrome.browserAction.setBadgeText({ text: '' });
      }
    });
  });
}).call(this);
