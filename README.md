# componentjs is a simple module for browser based component development. #
## Features ##

* Visual component based development of web applications
* Component implementation using _templates_ and _code-behind_ 
* Optimized to run on every browser
* Compose complex web application user interfaces with nested components
* runtime component compile and presentation
* integrated component caching (because of the above)
* works with any kind of html entities 
* javascript helper methods using synch and asynch component loading

## Limits ##
* every component implementation must have only a single root tag
* components can be loaded only under on cross-domain restrictions
* runtime error reporting is limited to the component file path but not including the line.

## Good to be known ##
* Place component javascript code within `<script>//<![CDATA[` and `//]]></script>` so that the browser's xml parser can do its job nice.

##  brief usage examples ##

    <!DOCTYPE html>
    <html>
	    <body>
		    <script type="component" source="component/loggedbox" id="loggedbox"></script>
	
		    <div id="page">
		
			    <script type="component" source="component/controlmenu" id="controlmenu"></script>
			    <script type="component" source="component/search" id="searchbox"></script>
			
		    </div>
	    </body>
    </html>

## component implementation example ##
    <div class='rootdiv'>
	    <script>
	    //<![CDATA[
		    console.log(this.getAttribute('class')); // output: rootdiv
	    //]]>
	    </script>
	    <div id="child">
		    <script>
		    //<![CDATA[
			    console.log(this.getAttribute('id')); // output: child
		    //]]>
		    </script>
	    </div>
	    <div>
		    <div id="innerchild">
		    </div>
	    </div>
	    <script type="component" source="component/loginbox">
	    //<![CDATA[
		    console.log(this); // output: a component/loginbox domElement
	    //]]>		
	    </script>
	    <script>
	    //<![CDATA[
		    console.log(this.child.getAttribute('id')); // output: child
		    console.log(this.innerchild); // output: undefined, due the fact that the id is not immediate child of rootdir
	    //]]>
	    </script>
    </div>

## Other usages and possibilities ##
### execute script at given path ###
    // executes pathToFileWithoutExtension.js script where 'this' is the parent of the inlined script component-code.
    <script type="component-code" source="pathToFileWithoutExtension" /> 
    

### inline javascript within component's html code (experimental) ###
    <div>
      <a href="[%=returnLinkHref(1);]">[%=returnLinkTitle(2)]<a/>
      <script type="component-code" source="components/linkdetails" />
      <script src="ttp://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js" />
    </div>
