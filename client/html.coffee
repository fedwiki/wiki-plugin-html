sanitize = require 'sanitize-caja'

emit = ($item, item) ->
	$item.append "<p>#{wiki.resolveLinks(item.text, sanitize)}</p>"

bind = ($item, item) ->
	$item.dblclick -> wiki.textEditor $item, item

window.plugins.html = {emit, bind} if window?
