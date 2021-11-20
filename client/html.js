/*
 * Federated Wiki : HTML Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-html/blob/master/LICENSE.txt
 */
var bind, builtins, emit, sanitize;

sanitize = require('@mapbox/sanitize-caja');

builtins = {
  'http://new_page/': params => ({
    "title": params.title,
    "story": [
      {
        "id": "98234090910324",
        "type": "future",
        "text": "Click to create this page.",
        "title": params.title
      }
    ],
    "journal": []
  })
};

emit = function($item, item) {
  return $item.append("<p>" + (window.wiki.resolveLinks(item.text, sanitize)) + "</p>");
};

bind = function($item, item) {
  var $form, el, lastButtonData;
  $item.dblclick(() => window.wiki.textEditor($item, item));
  $item.find('input').dblclick(e => e.stopPropagation());
  el = $item.get(0);
  lastButtonData = null;
  $form = $item.find('form');
  $form.find(':submit').click(({target:button}) => {
    if (button && button.name) {
      lastButtonData = {
        name: button.name,
        value: button.value
      };
    }
  });
  return $item.on('submit', function(e) {
    var handler, params, req, show;
    show = function(page) {
      var $page, resultPage;
      $page = $(e.target).parents('.page');
      resultPage = window.wiki.newPage(page);
      return window.wiki.showResult(resultPage, {
        $page: $page
      });
    };
    e.preventDefault();
    params = {};
    $item.find('form').serializeArray().map(({name, value}) => params[name] = value);
    if (lastButtonData && lastButtonData.name) {
      params[lastButtonData.name] = lastButtonData.value;
    }
    const handler = builtins[e.target.action];
    if (handler) {
      return show(handler(params));
    } else {
      req = {
        type: $item.find('form').attr('method') || "POST",
        url: e.target.action,
        dataType: 'json',
        contentType: "application/json",
        data: JSON.stringify(params)
      };
      $.ajax(req).done(show);
      return lastButtonData = null;
    }
  });
};

if (typeof window !== "undefined" && window !== null) {
  window.plugins.html = {
    emit: emit,
    bind: bind
  };
}
