sanitize = require 'sanitize-caja'

emit = ($item, item) ->
	sanitizedItem = sanitize item.text
	$item.append "<p>#{wiki.resolveLinks(sanitizedItem)}</p>"

bind = ($item, item) ->
	$item.dblclick -> wiki.textEditor $item, item

window.plugins.html = {emit, bind} if window?
