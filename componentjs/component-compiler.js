// ------------------------ component compile logic. core of componentjs ----------------------
(function(){
	Component.compiler.augment = function(context, element) {
	
	};
	
	Component.compiler.compileAndExecute = function(scriptContext, content, context) {
		try {
			var builder = new Function(content);
			builder.apply(scriptContext);
		} catch (e) {
			throw new Error(e.message+" @file: "+context.path,context.path);
		}
	};
	
	Component.compiler.executeScript = function(scriptContext, node, context) {
		for ( var i = 0; i < node.childNodes.length; i++) {
			var content = node.childNodes[i].data.replace(/^\s+|\s+$/g, "");
			Component.compiler.compileAndExecute(scriptContext, content, context);
		}
	};
	
	Component.compiler.resolvePath = function(path,context) {
		if(context.verbose)
			console.log(context.path+"|"+path);
		return context.path.substr(0,context.path.lastIndexOf("/")+1)+path;
	};
	
	Component.compiler.copyAttributes = function(src,dest,ignore) {
		if (typeof src.attributes === "undefined" || src.attributes === null)
			return;
		
		if(typeof ignore == "undefined")
			ignore = [];
		
		for ( var i = 0; i < src.attributes.length; i++) {
			var ignore = false;
			for(var k in ignore) 
				if(src.attributes[i].name == k)
					ignore = true;
			if(ignore)
				continue;
			
			if(src.attributes[i].namespaceURI != null)
				dest.setAttributeNS(src.attributes[i].namespaceURI, src.attributes[i].name,
						src.attributes[i].value);
			else
				dest.setAttribute(src.attributes[i].name, src.attributes[i].value);
		}
	};
	
	Component.compiler.wrapToElement = function(node, parentDomNode, context) {
		
		// process <link> tag, ie append to head
		if(node.nodeName == "link") {
			var head = document.getElementsByTagName("head")[0];
			var currentLinks = head.getElementsByTagName("link");
			for(var l = 0; i <currentLinks.length; l++)
				if(currentLinks[l].getAttribute('href') == node.getAttribute('href')) {
					if(context.verbose)
						console.log("skipping appending link to head, already exists such "+node.getAttribute('href'));
					return null; // half processing this node as link of such has been added already.
				}
			
			var link = document.createElement(node.nodeName);
			Component.compiler.copyAttributes(node,link);
			link.href = Component.compiler.resolvePath(node.getAttribute('href'),context);
			
			head.appendChild(link);
			return null;
			
		// process <script> tag with type=component-code, useful as code-behind
		} else if (node.nodeName == "script" && node.getAttribute("type") === "component-code") {
			
			// execute the script at given source path
			var path = Component.compiler.resolvePath(node.getAttribute("source"), context);
			Component.loader.executeScriptFromPath({scriptContext: parentDomNode, path: path, parent:context});
			
			// execute any inlined script text or cdata
			if (node.childNodes.length != 0)
				Component.compiler.executeScript(parentDomNode, node, context);
			
			return null;
			
		// process <script> tag with src pointing to a ordinary javascript 
		} else if (node.nodeName == "script" && node.getAttribute("src") !== null) {
	
			var script = document.createElement(node.nodeName);
			script.setAttribute('src', node.getAttribute("src"));
						
			// execute any inlined script text or cdata
			if (node.childNodes.length != 0)
				Component.compiler.executeScript(script, node, context);
	
			return script;
			
		// process <script> tag with source, ie include a nested component
		} else if (node.nodeName == "script" && node.getAttribute("source") !== null) {
			var path = Component.compiler.resolvePath(node.getAttribute("source"), context);
			var element = Component.loader.wrapPathToElement({path : path, parent: context});
			
			if (typeof parentDomNode !== 'undefined' && node.getAttribute("id"))
				parentDomNode[node.getAttribute("id")] = element;
			
			Component.compiler.copyAttributes(node,element,['source','type']);
			
			// execute any inlined script text or cdata
			if (node.childNodes.length != 0)  
				Component.compiler.executeScript(element, node, context);
				
			return element;
			
		// process inlined script
		} else if (node.nodeName == "script" && node.getAttribute("source") === null) {
			Component.compiler.executeScript(parentDomNode, node, context);
			return null;

		// apply the node as it is and traverse its childs, ie default process action 
		} else { 
			
			// construct domElement e 
			var e = null;
			if(node.namespaceURI != null)
				e = document.createElementNS(node.namespaceURI, node.nodeName);
			else
				e = document.createElement(node.nodeName);
	
			Component.compiler.copyAttributes(node,e);
			
			// iterate node's childs recursively 
			for ( var i = 0; i < node.childNodes.length; i++) {
	
				if (node.childNodes[i].nodeType == 8) // ignore comments ;)
					continue;
	
				if (node.childNodes[i].nodeType == 3) { // the node is text, so just appending should be fine
					var text = document.createTextNode(node.childNodes[i].data);
					e.appendChild(text);
					
				} else { // default is a recursion 
					var value = Component.compiler.wrapToElement(node.childNodes[i], e, context);
					if (value) {
						e.appendChild(value);
						if (value.getAttribute('id'))
							e[value.getAttribute('id')] = value;
					}
				}
			}
	
			return e;
		}
	};
	
})();