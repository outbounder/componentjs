(function() {
	// private space execution
	function override(f, g) { return function() { return g.apply(f,arguments); }; };
	
	Component.handleResponse = override(Component.handleResponse, function(context) {
		// pipe the incoming data to EJS then to the component
		context.data = new EJS({text:context.data+"", type:'['}).render({});
		
		return this(context);
	});
})();