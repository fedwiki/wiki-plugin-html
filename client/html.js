/*
 * Federated Wiki : HTML Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-html/blob/master/LICENSE.txt
 */
var builtins;

const dependencyLoaded = import('https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js');

builtins = {
  'http://new_page/': params => {
    let title = params.title.trim()
    let slug = wiki.asSlug(title)
    console.log('new page', title, slug)
    let hits = []
    let story = []
    let foundLocally = false

    Object.keys(wiki.neighborhoodObject.sites).forEach((site, index) => {
      info = wiki.neighborhoodObject.sites[site]
      if (info.sitemap != null) {
        result = info.sitemap.find(element => element.slug == slug)
        if (result != null) {
          if (index == 0) {foundLocally = true}
          hits.push({
            "id": wiki.itemId,
            "type": "reference",
            "site": site,
            "slug": slug,
            "title": title,
            "text": result.synopsis || ''
          })
        }
        console.log(result)
      }
    })

    if (hits.length > 0) {
      story.push({
        "id": wiki.itemId,
        "type": "future",
        "text": "Click to create this page",
        "title": title
      })
      let text = ""
      if (foundLocally == true) {
        if (hits.length > 1) {
          text = "We found the page on your wiki, and elsewhere in the neighborhood"
        } else {
          text = "We found the page on your wiki"
        }
      }
      story.push({
        "id": wiki.itemId,
        "type": "paragraph",
        "text": text
      })
      hits.forEach(element => story.push(element))
    } else {
      story.push({
        "id": wiki.itemId,
        "type": "future",
        "text": "Click to create this page.",
        "title": title
      })
    }
    return {
      "title": title,
      "story": story,
      "journal": []
    }
  }
};

async function emit($item, item) {
  await dependencyLoaded;
  function sanitize(dirty) {
    return window.DOMPurify.sanitize(dirty, {
      SANITIZE_DOM: false,
      ADD_TAGS: ['foreignObject', 'feDropShadow']
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
  $item.on('dblclick', () => window.wiki.textEditor($item, item));
  $item.find('input').on('dblclick', e => e.stopPropagation());
  $item.find('svg a[data-title]').on('click', event => {
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
  $form.find(':submit').on('click',({target:button}) => {
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
