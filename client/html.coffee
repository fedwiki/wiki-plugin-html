sanitize = require 'sanitize-caja'

emit = ($item, item) ->
	$item.append "<p>#{sanitize item.text}</p>"

bind = ($item, item) ->
	$item.dblclick -> wiki.textEditor $item, item

window.plugins.html = {emit, bind} if window?