// register global Component triple functions/objects so that others can hook into.
var Component = {};
Component.loader = {};
Component.compiler = {};

console.log('loading component');

(function() {

	var scripts = document.getElementsByTagName("script");
	var head = document.getElementsByTagName("head")[0];
	
	for(var i in scripts)
		if(typeof scripts[i].src != 'undefined')
			if(scripts[i].src.indexOf("component.js") != -1) {
				var basePath = "./";
				if(scripts[i].src.indexOf("/") != -1)
					basePath = scripts[i].src.substr(0,scripts[i].src.lastIndexOf("/")+1);
				
				var parts = scripts[i].src.split("?");
				if(parts[1]) {
					var files = parts[1].split(',');
					for(var f in files) {
						var req = new XMLHttpRequest();
						req.open("GET", basePath+"component-"+files[f]+".js", false);
						req.send(null); // null because of FF3.0
						if (req.status == 200 || req.status == 304 || req.status == 0 ) {
							var builder = new Function(req.responseText);
							builder.apply(this);
						}
					}
				}
				
				return; //halt further processing of head section as script component.js has been found.
			}
	
	console.log("component loaded");
})();
