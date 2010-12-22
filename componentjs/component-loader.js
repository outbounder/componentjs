// ------------------------ component loading logic. uses compiler to return domElement result ----------------------
(function(){
	var componentCacheCollection = [];
	
	// private space execution
	Component.loader.wrapPathToElement = function(context) {
		
		if (typeof componentCacheCollection[context.path] !== 'undefined') {
			context.data = componentCacheCollection[context.path];
			if(context.verbose)
				console.log('from cache '+context.data);
			return Component.loader.handleResponse(context);
		}
		
		var req = new XMLHttpRequest();
	
		if (typeof context.async === "function") {
			req.open("GET", context.path, true);
			req.onreadystatechange = function() {
				if (req.readyState == 4) {
					if (req.status == 200 || req.status == 304) {
						componentCacheCollection[context.path] = req.responseText;
	
						context.data = req.responseText;
						if(context.verbose)
							console.log('data async:'+context.data);
						Component.loader.handleResponse(context);
					} else if (req.status == 404)
						throw new Error("component not found "+context.path,context.path);
				}
			};
	
			req.send(null); // null because of FF3.0
		} else {
			
			req.open("GET", context.path, false);
			req.send(null); // null because of FF3.0
			if (req.status == 200 || req.status == 304 || req.status == 0 ) { // status == 0 is google chrome default response (?)
				componentCacheCollection[context.path] = req.responseText;
	
				context.data = req.responseText;
				if(context.verbose)
					console.log('data sync:'+context.data);
				return Component.loader.handleResponse(context);
			} else if(req.status == 404)
				throw new Error("component not found "+context.path,context.path);
			else
				throw new Error(req.status+" "+req.responseText);
		}
	};
	
	Component.loader.handleResponse = function(context) {
	
		if (window.DOMParser) {
			parser = new DOMParser();
			xmlDoc = parser.parseFromString(context.data, "text/xml");
		} else { // Internet Explorer
			xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async = "false";
			xmlDoc.loadXML(context.data);
		}
		
		try{
			var element = Component.compiler.wrapToElement(xmlDoc.firstChild, null, context);
			Component.compiler.augment(element);
		} catch(e) {
			throw new Error(e,context.path); // rethrow with file pointing to current context path value
		}
	
		if (typeof context.async !== "function")
			return element;
		else
			context.async(element);
	};
	
	Component.loader.executeScriptFromPath = function(context) {
		var req = new XMLHttpRequest();
		var content;
		if (componentCacheCollection[context.path + ".js"] === undefined) {
			req.open("GET", context.path + ".js", false);
			req.send(null); // null because of FF3.0
			if (req.status != 200 && req.status != 304)
				throw new Error("script not found " + context.path, context.parent.path);
			componentCacheCollection[context.path + ".js"] = req.responseText;
			content = req.responseText;
		} else
			content = componentCacheCollection[path + ".js"];
	
		Component.compiler.compileAndExecute(context.scriptContext, content, context);
	};
	
})();