sanitize = require 'sanitize-caja'

emit = ($item, item) ->
	linksResolved = wiki.resolveLinks(item.text)
	$item.append "<p>#{sanitize linksResolved}</p>"

bind = ($item, item) ->
	$item.dblclick -> wiki.textEditor $item, item

window.plugins.html = {emit, bind} if window?
