###
 * Federated Wiki : HTML Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-html/blob/master/LICENSE.txt
###

sanitize = require '@mapbox/sanitize-caja'

builtins =
  'http://new_page/': (params) ->
    "title": params.title,
    "story": [
      "id": "98234090910324",
      "type": "future",
      "text": "Click to create this page.",
      "title": params.title
    ],
    "journal": []


emit = ($item, item) ->
  $item.append "<p>#{wiki.resolveLinks(item.text, sanitize)}</p>"

bind = ($item, item) ->
  stopBubble = (e) ->
    if e.keyCode is 37 or e.keyCode is 39  # left or right arrow keys
      e.stopPropagation()

  $item.dblclick -> wiki.textEditor $item, item
  $item.find('input').dblclick (e) -> e.stopPropagation()
  $item.find('input').keydown (e) -> stopBubble(e)

  el = $item.get(0)
  lastButtonData = null
  $form = $item.find('form')
  $form.find(':submit').click (e) ->
    button = e.target
    if button and button.name
      lastButtonData = { name: button.name, value: button.value }

  $item.on 'submit', (e) ->

    show = (page) ->
      $page = $(e.target).parents('.page')
      resultPage = wiki.newPage(page)
      wiki.showResult resultPage, {$page}

    e.preventDefault()
    params = {}
    $item.find('form').serializeArray().map (obj) ->
      params[obj.name] = obj.value
    if lastButtonData and lastButtonData.name
      params[lastButtonData.name] = lastButtonData.value

    if handler = builtins[e.target.action]
      show handler params
    else
      req =
        type: $item.find('form').attr('method') or "POST",
        url: e.target.action
        dataType: 'json',
        contentType: "application/json",
        data: JSON.stringify(params)
      $.ajax(req).done show
      lastButtonData = null

window.plugins.html = {emit, bind} if window?
