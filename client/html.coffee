###
 * Federated Wiki : HTML Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-html/blob/master/LICENSE.txt
###

sanitize = require 'sanitize-caja'

builtins =
  'http://new_page/': (params) ->
    {title: params.title}

emit = ($item, item) ->
  $item.append "<p>#{wiki.resolveLinks(item.text, sanitize)}</p>"

bind = ($item, item) ->
  $item.dblclick -> wiki.textEditor $item, item

  $item.on 'submit', (e) ->

    show = (page) ->
      $page = $(e.target).parents('.page')
      resultPage = wiki.newPage(page)
      wiki.showResult resultPage, {$page}

    e.preventDefault()
    params = {}
    $item.find('input').serializeArray().map (obj) ->
      params[obj.name] = obj.value

    if handler = builtins[e.target.action]
      show handler params
    else
      req =
        type: "POST",
        url: e.target.action
        dataType: 'json',
        contentType: "application/json",
        data: JSON.stringify(params)
      $.ajax(req).done show


window.plugins.html = {emit, bind} if window?
