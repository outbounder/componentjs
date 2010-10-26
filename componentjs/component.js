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

	// private space execution
	Component.wrapPathToElement = function(context) {

		if (componentCacheCollection[context.path + ".html"] !== undefined) {
			context.data = componentCacheCollection[context.path + ".html"];
			return Component.handleResponse(context);
		}

		var req = new XMLHttpRequest();

		if (typeof context.async === "function") {
			req.open("GET", context.path + ".html", true);
			req.onreadystatechange = function() {
				if (req.readyState == 4) {
					if (req.status == 200 || req.status == 304) {
						componentCacheCollection[context.path + ".html"] = req.responseText;

						context.data = req.responseText;
						Component.handleResponse(context);
					} else
						throw new Error("component not found "+context.path+".html",context.path+".html");
				}
			};

			req.send(null); // null because of FF3.0
		} else {
			req.open("GET", context.path + ".html", false);
			req.send(null); // null because of FF3.0
			if (req.status == 200 || req.status == 304) {
				componentCacheCollection[context.path + ".html"] = req.responseText;

				context.data = req.responseText;
				return Component.handleResponse(context);
			} else
				throw new Error("component not found "+context.path+".html",context.path+".html");
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

		Compomnent.compileAndExecute(context, content, path+".js");
	};

	Component.wrapToElement = function(node, id, parentDomNode, context) {
		if (node.nodeName == "script" && node.getAttribute("type") === "component-code") {
			
			Component.executeScriptFromPath(parentDomNode, node.getAttribute("source"));
			Component.executeScript(parentDomNode, node, context.path+".html");
			
			return null;
		} else if (node.nodeName == "script" && node.getAttribute("src") !== null) {

			var script = document.createElement(node.nodeName);
			script.setAttribute('src', node.getAttribute("src"));
			if (node.getAttribute('id') !== null)
				script.setAttribute("id", node.getAttribute("id"));

			if (node.childNodes.length != 0) // text or cdata
				Component.executeScript(script, node, context.path+".html");

			return script;
		} else if (node.nodeName == "script" && node.getAttribute("source") !== null) {

			var element = Component.wrapPathToElement({
										path : node.getAttribute("source"),
										id : node.getAttribute("id")
									});
			
			if (typeof parentDomNode !== 'undefined')
				parentDomNode[node.getAttribute("id")] = element;

			if (node.childNodes.length != 0) // text or cdata
				Component.executeScript(element, node, context.path+".html");

			return element;
		} else if (node.nodeName == "script" && node.getAttribute("source") === null) {
			
			Component.executeScript(parentDomNode, node, context.path+".html");
			return null;
		} else { // apply the node as it is by traversing its childs
			var e = document.createElement(node.nodeName);

			if (id)
				e.setAttribute('id', id);

			if (typeof node.attributes !== "undefined"
					&& node.attributes !== null)
				for ( var i = 0; i < node.attributes.length; i++)
					e.setAttribute(node.attributes[i].name,
							node.attributes[i].value);

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

})();