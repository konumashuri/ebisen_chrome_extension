/* global chrome, $ */

var Ebisen = {};

(function(){
  "use strict";
  Ebisen.Article = (function(){
    return {
      //今いるタブのUrlを取得する
      get: function(callback){
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
      },

      //Url追加する
      add: function(){
        Ebisen.Article.get(function(url) {
          console.log('Detecting if you have registered ' + url);

          var today = Ebisen.DateManager.get_today();
          var dates = Ebisen.DateManager.get_list();
          console.log(dates);

          chrome.storage.local.get(function(values){
            $.each(dates, function(){
              if(typeof(values['unread'][this]) === 'undefined'){
                values['unread'][this] = [];
              }
              if(typeof(values['read'][this]) === 'undefined'){
                values['read'][this] = [];
              }

              if(values['unread'][this].includes(url)){
                console.log('Already Added!');
                Ebisen.RenderStatus.init('Already Added!', 'info');
              }else{
                values['unread'][this].push(url);
                console.log('Added!');
                Ebisen.RenderStatus.init('Added!', 'success');
              }

              chrome.storage.local.set(values);

              console.log('--------------');
              console.log(values['unread'][this]);
              console.log(values['unread'][this].length);
              console.log('--------------');

            });
            Ebisen.ArticleList.render(values, today);
          });
        });
      },

      //Urlを既読にする
      move: function(){
        console.log('move url to read list');
        var url = this.href;
        var date = Ebisen.DateManager.get_today();

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
      },

      //Urlをtrimする
      trim: function(url){
        return url.substring(0, 50) + '...';
      },

      //Url削除する
      //remove: function(){}
    };
  })();

  Ebisen.ArticleList = (function(){
    return {
      //Url Listを表示する
      render: function(url_hash, date){
        console.log('rendering urls....');
        // render UNREAD list
        if(url_hash['unread'][date][0]){
          var unreadHtml = '<ol>';
          for(var unreadUrl in url_hash['unread'][date]){
            unreadHtml += '<li><a href=';
            unreadHtml += url_hash['unread'][date][unreadUrl];
            unreadHtml += ' class="unread-url" target="_blank">';
            unreadHtml += Ebisen.Article.trim(url_hash['unread'][date][unreadUrl]);
            unreadHtml += '</a></li>';
          }
          unreadHtml += '</ol>';
          $('#unread-urls').html(unreadHtml);
        }else{
          $('#unread-urls').html('<p>Nothing to Read</p>');
        }

        // read list
        var readHtml = '<ol>';
        for(var readUrl in url_hash['read'][date]){
          readHtml += '<li><a href=';
          readHtml += url_hash['read'][date][readUrl];
          readHtml += ' class="read-url" target="_blank">';
          readHtml += Ebisen.Article.trim(url_hash['read'][date][readUrl]);
          readHtml += '</a></li>';
        }
        readHtml += '</ol>';
        $('#read-urls').html(readHtml);

        // add event lister after rendering
        $('.unread-url').on('click', Ebisen.Article.move);
      },
      //Url Listを切り替える => tab
      change: function(){},
      //Url Listを削除する
      remove: function(){
        chrome.storage.local.clear();
      },
      prepare: function(){
        chrome.storage.local.get(function(values){
          if(typeof(values['read']) === 'undefined' && typeof(values['unread']) === 'undefined'){
            var d = new Date();
            var yesterday, today, tomorrow;

            d.setDate(d.getDate() - 1);
            yesterday = Ebisen.DateManager.to_date(d);
            d.setDate(d.getDate() + 1);
            today = Ebisen.DateManager.to_date(d);
            d.setDate(d.getDate() + 1);
            tomorrow = Ebisen.DateManager.to_date(d);

            var urlHash = {
              read: {},
              unread: {}
            };

            for(var key in urlHash){
              urlHash[key][yesterday] = [];
              urlHash[key][today] = [];
              urlHash[key][tomorrow] = [];
            }

            chrome.storage.local.set(urlHash);
            console.log('finish initialization.');
          }else{
            console.log('no need to initialization.');
          }
        });
      }
    };
  })();

  Ebisen.DateManager = (function(){
    return {
      // 日付のフォーマット化
      to_date: function(d){
        var date = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
        return date;
      },
      get_today: function() {
        var d = new Date();
        var date = Ebisen.DateManager.to_date(d);
        return date;
      },
      // return ["6/13/2016", "6/14/2016", "6/20/2016", "6/27/2016", "7/13/2016"]
      get_list: function(){
        var d = new Date();
        var array, today, tomorrow, few_days, week, few_weeks, month;

        today = Ebisen.DateManager.to_date(d);

        d.setDate(d.getDate() + 1);
        tomorrow = Ebisen.DateManager.to_date(d);

        d.setDate(d.getDate() + 2);
        few_days = Ebisen.DateManager.to_date(d);

        d.setDate(d.getDate() + 4);
        week = Ebisen.DateManager.to_date(d);

        d.setDate(d.getDate() + 7);
        few_weeks = Ebisen.DateManager.to_date(d);

        d.setDate(d.getDate() + 14);
        month = Ebisen.DateManager.to_date(d);

        array = [today, tomorrow, few_days, week, few_weeks, month];
        return array;
      }
    };
  })();

  Ebisen.RenderStatus = (function(){
    return {
      init: function(statusText, type){
        var html = '<div id="statusContent" class="alert alert-' + type + '" role="alert">' + statusText + '</div>';
        $('#status').html(html);

        setTimeout(function(){
          $('#statusContent').fadeOut('slow');
        }, 750);
      }
    };
  })();

  Ebisen.ViewManager = (function(){
    return {
      init: function(tab){
        //e.preventDefault();
        tab.removeClass('active');
        $(this).addClass('active');

        var id = $(this).attr('id');
        var d = new Date();
        if(id === 'tab1'){
          d.setDate(d.getDate() - 1);
        }else if(id === 'tab3'){
          d.setDate(d.getDate() + 1);
        }
        var date = Ebisen.DateManager.to_date(d);

        chrome.storage.local.get(function(values){
          Ebisen.ArticleList.render(values, date);
        });
      }
    };
  })();

  Ebisen.Initializer = (function(){
    return {
      init: function(){
        // Prepare url hash in local storage
        Ebisen.ArticleList.prepare();
        $('#tab2').click();
      }
    };
  })();

  $('.unread-url').on('click', Ebisen.Article.move());
  $('#addButton').on('click', Ebisen.Article.add());
  $('#clearButton').on('click', function() {
    Ebisen.ArticleList.remove();
    Ebisen.ArticleList.prepare();
    Ebisen.RenderStatus.init('Cleared!', 'success');
    $('#tab2').click();
  });

  $('li.tab').on('click', Ebisen.ViewManager.init('li.tab'));

  Ebisen.Initializer.init();
})();
