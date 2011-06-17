(function() {
	// private space execution
	function override(f, g) { return function() { return g.apply(f,arguments); }; };
	
	if(typeof Component.loader.handleResponse === "undefined")
		throw new Error("Component.loader.handleResponse is not found to override. fix the load order");
	
	Component.loader.handleResponse = override(Component.loader.handleResponse, function(context) {
		// pipe the incoming data to EJS then to the component
		context.data = new EJS({text:context.data+"", type:'['}).render({});
		
		return this(context);
	});
})();