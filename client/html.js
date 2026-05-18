/*
 * Federated Wiki : HTML Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-html/blob/master/LICENSE.txt
 */
var builtins

const dependencyLoaded = import('https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js')

builtins = {
  'http://new_page/': params => {
    let title = params.title.trim()
    let slug = wiki.asSlug(title)
    console.log('new page', title, slug)
    let hits = []
    let story = []
    let foundLocally = false

    Object.keys(wiki.neighborhoodObject.sites).forEach((site, index) => {
      const info = wiki.neighborhoodObject.sites[site]
      if (info.sitemap != null) {
        const result = info.sitemap.find(element => element.slug == slug)
        if (result != null) {
          if (index == 0) {
            foundLocally = true
          }
          hits.push({
            id: wiki.itemId,
            type: 'reference',
            site: site,
            slug: slug,
            title: title,
            text: result.synopsis || '',
          })
        }
        console.log(result)
      }
    })

    if (hits.length > 0) {
      story.push({
        id: wiki.itemId,
        type: 'future',
        text: 'Click to create this page',
        title: title,
      })
      let text = ''
      if (foundLocally == true) {
        if (hits.length > 1) {
          text = 'We found the page on your wiki, and elsewhere in the neighborhood'
        } else {
          text = 'We found the page on your wiki'
        }
      }
      story.push({
        id: wiki.itemId,
        type: 'paragraph',
        text: text,
      })
      hits.forEach(element => story.push(element))
    } else {
      story.push({
        id: wiki.itemId,
        type: 'future',
        text: 'Click to create this page.',
        title: title,
      })
    }
    return {
      title: title,
      story: story,
      journal: [],
    }
  },
}

async function emit($item, item) {
  if (!$("link[href='/plugins/html/html.css']").length) {
    $('<link rel="stylesheet" href="/plugins/html/html.css" type="text/css">').appendTo('head')
  }
  await dependencyLoaded
  function sanitize(dirty) {
    return window.DOMPurify.sanitize(dirty, {
      SANITIZE_DOM: false,
      ADD_TAGS: ['foreignObject', 'feDropShadow'],
    })
  }
  $item.css('overflow-x', 'auto')
  $item.append(
    `<style>
img[src="/images/external-link-ltr-icon.png"] {display:none;}
a.external::after {content:url(/images/external-link-ltr-icon.png);}
</style>`,
    window.wiki.resolveLinks(item.text, sanitize),
  )
  var $form, el, lastButtonData
  $item.on('dblclick', () => window.wiki.textEditor($item, item))
  $item.find('input').on('dblclick', e => e.stopPropagation())
  $item.find('svg a[data-title]').on('click', event => {
    event.preventDefault()
    event.stopPropagation()
    let anchor = event.target.closest('a[data-title]')
    let page = event.shiftKey ? null : $(anchor).parents('.page')
    let { title, site } = anchor.dataset
    window.wiki.doInternalLink(title, page, site)
  })
  el = $item.get(0)
  lastButtonData = null
  $form = $item.find('form')
  $form.find(':submit').on('click', ({ target: button }) => {
    if (button && button.name) {
      lastButtonData = {
        name: button.name,
        value: button.value,
      }
    }
  })
  return $item.on('submit', function (e) {
    const show = function (page) {
      var $page, resultPage
      $page = $(e.target).parents('.page')
      resultPage = window.wiki.newPage(page)
      return window.wiki.showResult(resultPage, {
        $page: $page,
      })
    }
    e.preventDefault()
    const params = {}
    $item
      .find('form')
      .serializeArray()
      .map(({ name, value }) => (params[name] = value))
    if (lastButtonData && lastButtonData.name) {
      params[lastButtonData.name] = lastButtonData.value
    }
    const handler = builtins[e.target.action]
    if (handler) {
      return show(handler(params))
    } else {
      const req = {
        type: $item.find('form').attr('method') || 'POST',
        url: e.target.action,
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(params),
      }
      $.ajax(req).done(show)
      return (lastButtonData = null)
    }
  })
}

function bind($item, item) {
  if ($item[0].querySelectorAll('svg').length > 0) {
    const svgs = $item[0].querySelectorAll('svg')

    const download = (filename, text) => {
      const element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
      element.setAttribute('download', filename)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }

    const svgClickHandler = event => {
      const { target } = event
      const action = (target.closest('a') || {}).dataset?.action

      if (!action) return

      event.stopPropagation()
      event.preventDefault()
      const svg = action ? event.target.closest('.wrappedSVG').querySelector('svg').outerHTML : ''
      switch (action) {
        case 'download':
          const slug = $item.parents('.page').attr('id')
          download(`${slug}.svg`, svg)
          break
        case 'zoom':
          const pageKey = $item.parents('.page').data('key')
          const context = wiki.lineup.atKey(pageKey).getContext()
          const htmlDialog = window.open(
            '/plugins/html/dialog/#',
            event.shiftKey ? '_blank' : 'html',
            'popup,height=600,width=800',
          )
          //const svg = event.originalTarget.closest('.wrappedSVG').querySelector('svg').outerHTML
          if (htmlDialog.location.pathname !== '/plugins/html/dialog/') {
            htmlDialog.addEventListener('load', event => {
              htmlDialog.postMessage({ svg: svg, pageKey, context }, window.origin)
            })
          } else {
            htmlDialog.postMessage({ svg: svg, pageKey, context }, window.origin)
          }
          break
      }
    }

    svgs.forEach(svg => {
      const wrapper = document.createElement('div')
      wrapper.classList.add('wrappedSVG')
      svg.parentNode.insertBefore(wrapper, svg)
      wrapper.appendChild(svg)
      const overlay = document.createElement('nav')
      overlay.setAttribute('class', 'actions')

      const downloadAnchor = Object.assign(document.createElement('a'), {
        href: '#',
        title: 'Download',
      })
      downloadAnchor.dataset.action = 'download'
      const downloadImg = Object.assign(document.createElement('img'), {
        width: 18,
        height: 18,
        alt: 'download',
        src: 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24" fill="grey"><g><rect fill="none" height="24" width="24"/></g><g><path d="M5,20h14v-2H5V20z M19,9h-4V3H9v6H5l7,7L19,9z"/></g></svg>',
      })
      downloadAnchor.append(downloadImg)

      const zoomAnchor = Object.assign(document.createElement('a'), {
        href: '#',
        title: 'Zoom',
      })
      zoomAnchor.dataset.action = 'zoom'
      const zoomImg = Object.assign(document.createElement('img'), {
        width: 18,
        height: 18,
        alt: 'toggle zoom',
        src: 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24"><g><rect fill="none" height="24" width="24"/></g><g><g><g><path fill="grey" d="M15,3l2.3,2.3l-2.89,2.87l1.42,1.42L18.7,6.7L21,9V3H15z M3,9l2.3-2.3l2.87,2.89l1.42-1.42L6.7,5.3L9,3H3V9z M9,21 l-2.3-2.3l2.89-2.87l-1.42-1.42L5.3,17.3L3,15v6H9z M21,15l-2.3,2.3l-2.87-2.89l-1.42,1.42l2.89,2.87L15,21h6V15z"/></g></g></g></svg>',
      })
      zoomAnchor.append(zoomImg)

      overlay.append(downloadAnchor, zoomAnchor)

      svg.parentNode.insertBefore(overlay, svg)
      wrapper.addEventListener('click', svgClickHandler)
    })
  }
}

function htmlListener(event) {
  // only continue if event is from a graphviz popup.
  // events from a popup window will have an opener
  // ensure that the popup window is one of ours
  if (!event.source.opener || event.source.location.pathname !== '/plugins/html/dialog/') {
    if (wiki.debug) {
      console.log('htmlListener - not for us', { event })
    }
    return
  }
  if (wiki.debug) {
    console.log('htmlListener - ours', { event })
  }

  const { data } = event
  const { action, keepLineup = false, pageKey = null, title = null, context = null } = data

  let $page = null
  if (pageKey != null) {
    $page = keepLineup ? null : $('.page').filter((i, el) => $(el).data('key') == pageKey)
  }

  switch (action) {
    case 'doInternalLink':
      wiki.pageHandler.context = context
      wiki.doInternalLink(title, $page)
      break
    default:
      console.error({ where: 'htmlListener', message: 'unknown action', data })
  }
}

if (typeof window !== 'undefined' && window !== null) {
  window.plugins.html = {
    emit: emit,
    bind: bind,
  }
  if (typeof window.htmlListener !== 'undefined' || window.htmlListener == null) {
    console.log('**** Adding html listener')
    window.htmlListener = htmlListener
    window.addEventListener('message', htmlListener)
  }
}
