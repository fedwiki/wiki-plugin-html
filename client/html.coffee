###
 * Federated Wiki : HTML Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-html/blob/master/LICENSE.txt
###

sanitize = require 'sanitize-caja'

emit = ($item, item) ->
  $item.append "<p>#{wiki.resolveLinks(item.text, sanitize)}</p>"

bind = ($item, item) ->
  $item.dblclick -> wiki.textEditor $item, item
  $item.on 'submit', (e) ->
    e.preventDefault()
    params = {}
    $item.find('input').serializeArray().map (obj) ->
      params[obj.name] = obj.value

    req =
      type: "POST",
      url: e.target.action
      dataType: 'json',
      contentType: "application/json",
      data: JSON.stringify(params)

    $.ajax(req).done (page) ->
      $item.find('.caption').text 'done'
      resultPage = wiki.newPage(page)
      wiki.showResult resultPage


window.plugins.html = {emit, bind} if window?
