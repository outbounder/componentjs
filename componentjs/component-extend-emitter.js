(function() {
	// private space execution
	function override(f, g) { return function() { return g.apply(f,arguments); }; };
	
	if(typeof Component.compiler.augment === "undefined")
		throw new Error("Component.compiler.augment is not found to override. fix the load order");
	
	Component.compiler.augment = override(Component.compiler.augment, function(element) {
		element.$eventHandlers = [];
		element.on = function(eventName, handler) {
			for(var i in this.$eventHandlers)
				if(this.$eventHandlers[i].name === eventName && this.$eventHandlers[i].handle === handler)
					return;
			
			this.$eventHandlers.push({name: eventName, handle: handler});
		};
		element.emit = function(eventName, eventData) {
			for(var i in this.$eventHandlers)
				if(this.$eventHandlers[i].name == eventName)
					if(!this.$eventHandlers[i].handle(eventData))
						return false;
			
			return true;
		};
		element.stopListen = function(eventName, handler) {
			for(var i in this.$eventHandlers)
				if(this.$eventHandlers[i].name == eventName) {
					this.$eventHandlers[i].splice(i,1); 
					i -= 1;// TODO check,coz this may cause issues
				}
		};
		return this(element);
	});
})();