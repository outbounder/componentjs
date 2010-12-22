// ------------------------ component public interface ----------------------
(function(){
	
	// return domElement from given path
	Component.fromPath = function(path, async) {
		return Component.loader.wrapPathToElement({
			path : path,
			async : async
		});
	};
	
	// override given <script> domElement with domElement from given path 
	Component.overrideFromPath = function(scriptElement, path, async) {
		var parentElement = scriptElement.parentNode;
	
		if (typeof async !== "function") {
			var component = Component.loader.wrapPathToElement({
				path : path
			});
	
			if (scriptElement.getAttribute('id'))
				parentElement[scriptElement.getAttribute('id')] = component;
			parentElement.replaceChild(component, scriptElement);
		} else {
			Component.loader.wrapPathToElement({
						path : path,
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
	
	// append to given parent domElement with domElement from given path
	Component.appendFromPath = function(parentElement, path, async) {
		if (typeof async !== "function") {
			var component = Component.loader.wrapPathToElement({
				path : path
			});
	
			parentElement.appendChild(component);
			return component;
		} else {
			Component.loader.wrapPathToElement({
				path : path,
				async : function(component) {
					// give component to the caller to be modified before
					// rendering
					async(component);
					// render synch
					parentElement.appendChild(component);
				}
			});
		}
	};
	
	// process given domElement for <script type="component" source='...'></script> and replace with with domElements from their sources.
	Component.process = function(domElement) {
		var hasComponents = true;
		while (hasComponents) { // ugly workaround to use loop here... 
			hasComponents = false;
			var x = domElement.getElementsByTagName("script");
			for ( var i = 0; i < x.length; i++) {
				if (x[i].getAttribute('source')) {
					if (x[i].getAttribute('type') == "component") {
						Component.overrideFromPath(x[i], x[i].getAttribute('source'));
						hasComponents = true;
						break;
					}
				}
			}
		}
	};
	
})();