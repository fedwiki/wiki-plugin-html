/*
 * Federated Wiki : HTML Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-html/blob/master/LICENSE.txt
 */
var builtins;

const dependencyLoaded = import('/plugins/html/DOMPurify-2.3.3/purify.min.js');

builtins = {
  'http://new_page/': params => {
    const clone = obj => JSON.parse(JSON.stringify(obj))
    const date = Date.now()
    const page = {
      "title": params.title,
      "story": [
        {
          "id": "98234090910324",
          "type": "future",
          "text": "Click to create this page.",
          "title": params.title
        }
      ]
    }
    page.journal = [{type: "create", date, item:clone(page)}]
    return page
  }
};

async function emit($item, item) {
  await dependencyLoaded;
  function sanitize(dirty) {
    return window.DOMPurify.sanitize(dirty, {
      SANITIZE_DOM: false,
      ADD_TAGS: ['foreignObject']
    });
  }
  $item.css('overflow-x', 'auto');
  $item.append(
    `<style>
img[src="/images/external-link-ltr-icon.png"] {display:none;}
a.external::after {content:url(/images/external-link-ltr-icon.png);}
</style>`,
    window.wiki.resolveLinks(item.text, sanitize));
  var $form, el, lastButtonData;
  $item.dblclick(() => window.wiki.textEditor($item, item));
  $item.find('input').dblclick(e => e.stopPropagation());
  $item.find('svg a[data-title]').click(event => {
    event.preventDefault();
    event.stopPropagation();
    let anchor = event.target.closest('a[data-title]');
    let page = event.shiftKey ? null : $(anchor).parents('.page');
    let {title, site} = anchor.dataset;
    window.wiki.doInternalLink(title, page, site)
  });
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
    const show = function(page) {
      var $page, resultPage;
      $page = $(e.target).parents('.page');
      resultPage = window.wiki.newPage(page);
      return window.wiki.showResult(resultPage, {
        $page: $page
      });
    };
    e.preventDefault();
    const params = {};
    $item.find('form').serializeArray().map(({name, value}) => params[name] = value);
    if (lastButtonData && lastButtonData.name) {
      params[lastButtonData.name] = lastButtonData.value;
    }
    const handler = builtins[e.target.action];
    if (handler) {
      return show(handler(params));
    } else {
      const req = {
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

}

function bind($item, item) {};

if (typeof window !== "undefined" && window !== null) {
  window.plugins.html = {
    emit: emit,
    bind: bind
  };
}
