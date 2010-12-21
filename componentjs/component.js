// public interface 
Component = function() {
};

(function() {
	var componentCacheCollection = [];

	Component.fromPath = function(path, id, async) {
		return Component.wrapPathToElement({
			path : path,
			id : id,
			async : async
		});
	};

	Component.overrideFromPath = function(scriptElement, path, async) {
		var parentElement = scriptElement.parentNode;

		if (typeof async !== "function") {
			var component = Component.wrapPathToElement({
				path : path,
				id : scriptElement.getAttribute('id')
			});

			if (scriptElement.getAttribute('id'))
				parentElement[scriptElement.getAttribute('id')] = component;
			parentElement.replaceChild(component, scriptElement);
		} else {
			Component.wrapPathToElement({
						path : path,
						id : scriptElement.getAttribute('id'),
						async : function(component) {
							if (scriptElement.getAttribute('id'))
								parentElement[scriptElement.getAttribute('id')] = component;
							
							// give component to the caller to be modified
							// before rendering
							async(component);
							// render synch
							parentElement.replaceChild(component, scriptElement);
						}
					});
		}
	};

	Component.appendFromPath = function(parentElement, path, id, async) {
		if (typeof async !== "function") {
			var component = Component.wrapPathToElement({
				path : path,
				id : id
			});

			if (id)
				parentElement[id] = component;
			parentElement.appendChild(component);
			return component;
		} else {
			Component.wrapPathToElement({
				path : path,
				id : id,
				async : function(component) {
					if (id)
						parentElement[id] = component;
					// give component to the caller to be modified before
					// rendering
					async(component);
					// render synch
					parentElement.appendChild(component);
				}
			});
		}
	};

	Component.overrideCurrent = function() {
		var hasComponents = true;
		while (hasComponents) {
			hasComponents = false;
			var x = document.body.getElementsByTagName("script");
			for ( var i = 0; i < x.length; i++) {
				if (x[i].getAttribute('source')) {
					if (x[i].getAttribute('type') == "component") {
						Component.overrideFromPath(x[i], x[i].getAttribute('source'));
						hasComponents = true;
						break;
					} else if (x[i].getAttribute('type') == "component-code") {
						Component.executeScriptFromPath(x[i].parentNode, x[i].getAttribute('source'));
					}
				}
			}
		}
	};
	
	Component.getExtension = function(path) {
		if(path.lastIndexOf(".") == path.length-4)
			return "";
		return ".html";
	};

	// private space execution
	Component.wrapPathToElement = function(context) {
		var extension = Component.getExtension(context.path);
		
		if (typeof componentCacheCollection[context.path + extension] !== 'undefined') {
			context.data = componentCacheCollection[context.path + extension];
			if(context.verbose)
				console.log('from cache '+context.data);
			return Component.handleResponse(context);
		}
		
		var req = new XMLHttpRequest();

		if (typeof context.async === "function") {
			req.open("GET", context.path + extension, true);
			req.onreadystatechange = function() {
				if (req.readyState == 4) {
					if (req.status == 200 || req.status == 304) {
						componentCacheCollection[context.path + extension] = req.responseText;

						context.data = req.responseText;
						if(context.verbose)
							console.log('data async:'+context.data);
						Component.handleResponse(context);
					} else if (req.status == 404)
						throw new Error("component not found "+context.path+extension,context.path+extension);
				}
			};

			req.send(null); // null because of FF3.0
		} else {
			
			req.open("GET", context.path + extension, false);
			req.send(null); // null because of FF3.0
			if (req.status == 200 || req.status == 304 || req.status == 0 ) { // status == 0 is google chrom default response (?)
				componentCacheCollection[context.path + extension] = req.responseText;

				context.data = req.responseText;
				if(context.verbose)
					console.log('data sync:'+context.data);
				return Component.handleResponse(context);
			} else if(req.status == 404)
				throw new Error("component not found "+context.path+extension,context.path+extension);
			else
				throw new Error(req.status+" "+req.responseText);
		}
	};

	Component.handleResponse = function(context) {

		if (window.DOMParser) {
			parser = new DOMParser();
			xmlDoc = parser.parseFromString(context.data, "text/xml");
		} else { // Internet Explorer
			xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async = "false";
			xmlDoc.loadXML(context.data);
		}

		var element = Component.wrapToElement(xmlDoc.firstChild, context.id, null, context);
		Component.augment(element);

		if (typeof context.async !== "function")
			return element;
		else
			context.async(element);
	};

	Component.augment = function(element) {

	};

	Component.compileAndExecute = function(context, content, file) {
		try {
			var builder = new Function(content);
			builder.apply(context);
		} catch (e) {
			throw new Error(e.message,file);
		}
	};

	Component.executeScript = function(context, node, file) {
		for ( var i = 0; i < node.childNodes.length; i++) {
			var content = node.childNodes[i].data.replace(/^\s+|\s+$/g, "");
			Component.compileAndExecute(context, content, file);
		}
	};

	Component.executeScriptFromPath = function(context, path) {
		var req = new XMLHttpRequest();
		var content;
		if (componentCacheCollection[path + ".js"] === undefined) {
			req.open("GET", path + ".js", false);
			req.send(null); // null because of FF3.0
			if (req.status != 200 && req.status != 304)
				console.error("script not found " + path);
			componentCacheCollection[path + ".js"] = req.responseText;
			content = req.responseText;
		} else
			content = componentCacheCollection[path + ".js"];

		Component.compileAndExecute(context, content, path+".js");
	};

	Component.wrapToElement = function(node, id, parentDomNode, context) {
		if(node.nodeName == "link") {
			var head = document.getElementsByTagName("head")[0];
			var link = document.createElement(node.nodeName);
			if (typeof node.attributes !== "undefined"
				&& node.attributes !== null)
					for ( var i = 0; i < node.attributes.length; i++) {
						link.setAttribute(node.attributes[i].name, node.attributes[i].value);
					}
			
			head.appendChild(link);
		} else if (node.nodeName == "script" && node.getAttribute("type") === "component-code") {
			
			Component.executeScriptFromPath(parentDomNode, node.getAttribute("source"));
			var extension = Component.getExtension(context.path);
			Component.executeScript(parentDomNode, node, context.path+extension);
			
			return null;
		} else if (node.nodeName == "script" && node.getAttribute("src") !== null) {

			var script = document.createElement(node.nodeName);
			script.setAttribute('src', node.getAttribute("src"));
			if (node.getAttribute('id') !== null)
				script.setAttribute("id", node.getAttribute("id"));

			if (node.childNodes.length != 0) // text or cdata
				var extension = Component.getExtension(context.path);
				Component.executeScript(script, node, context.path+extension);

			return script;
		} else if (node.nodeName == "script" && node.getAttribute("source") !== null) {

			var element = Component.wrapPathToElement({
										path : node.getAttribute("source"),
										id : node.getAttribute("id")
									});
			
			if (typeof parentDomNode !== 'undefined')
				parentDomNode[node.getAttribute("id")] = element;

			if (node.childNodes.length != 0) // text or cdata
				var extension = Component.getExtension(context.path);
				Component.executeScript(element, node, context.path+extension);
				
			if (typeof node.attributes !== "undefined"
					&& node.attributes !== null)
				for ( var i = 0; i < node.attributes.length; i++) {
					if(node.attributes[i].name == "source" || node.attributes[i].name == "type")
						continue;
					
					if(node.attributes[i].namespaceURI != null)
						element.setAttributeNS(node.attributes[i].namespaceURI, node.attributes[i].name,
								node.attributes[i].value);
					else
						element.setAttribute(node.attributes[i].name, node.attributes[i].value);
				}
				
			return element;
		} else if (node.nodeName == "script" && node.getAttribute("source") === null) {
			var extension = Component.getExtension(context.path);
			Component.executeScript(parentDomNode, node, context.path+extension);
			return null;
		} else { // apply the node as it is by traversing its childs
			var e = null;
			if(node.namespaceURI != null)
				e = document.createElementNS(node.namespaceURI, node.nodeName);
			else
				e = document.createElement(node.nodeName);

			if (id)
				e.setAttribute('id', id);

			if (typeof node.attributes !== "undefined"
					&& node.attributes !== null)
				for ( var i = 0; i < node.attributes.length; i++) {
					if(node.attributes[i].namespaceURI != null)
						e.setAttributeNS(node.attributes[i].namespaceURI, node.attributes[i].name,
								node.attributes[i].value);
					else
						e.setAttribute(node.attributes[i].name, node.attributes[i].value);
				}

			for ( var i = 0; i < node.childNodes.length; i++) {

				if (node.childNodes[i].nodeType == 8)
					continue;

				if (node.childNodes[i].nodeType == 3) {
					var text = document.createTextNode(node.childNodes[i].data);
					e.appendChild(text);
				} else {
					var value = Component.wrapToElement(node.childNodes[i], null, e, context);
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
	
	var scripts = document.getElementsByTagName("script");
	for(var i in scripts)
		if(typeof scripts[i].src != 'undefined')
			if(scripts[i].src.indexOf("component.js") != -1) {
				var parts = scripts[i].src.split("?");
				if(parts[1])
					Component[parts[1]]();
			}

})();
