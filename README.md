# componentjs is a simple module for browser based component development. #
the code is a fork from flashjs project http://code.google.com/p/flashjs/

## Features ##

* Visual component based development of web applications
* Component implementation using _templates_ and _code-behind_ 
* Optimized to run on every browser
* Compose complex web application user interfaces with nested components
* runtime component compile and presentation
* integrated component caching (because of the above)
* works with any kind of html entities 
* javascript helper methods using synch and asynch component loading
* fits well with jquery, prorotype, mooTools and any other.
* supports dom element and attribute namespaces (thus runs smooth with SVG files)

## Limits ##
* every component implementation must have only a single root tag
* components can be loaded only under on cross-domain restrictions (but there are workarounds)
* runtime error reporting is limited to the component file path but not including the line.
* every component is first loaded at runtime, no support for minifying of web application based on components yet.

## Good to be known ##
* Place component javascript code within `<script>//<![CDATA[` and `//]]></script>` so that the browser's xml parser can do its job nice.

## Examples ##

* http://vn.east.fi/svgtest/
* http://outbounder.github.com/simpleui-techbrowser/www/index.html

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
    
### using inline component templating ###
component templating is done using EJS (http://www.embeddedjs.com/). There is extender script of the componentjs
which simply pipes the raw component text code to EJS and then again constructs component dom element instance from it.

Typical implementation of component with EJS looks like
    <div>
        <p>[%=this.getTitle()%]</p>
        <ul>
        [% for(var i=0; i<supplies.length; i++) {%]
           <li>[%= supplies[i] %]</li>
        [% } %]
        </ul>
    </div>
    
### using component events ###
component eventing is added as generic methods using componentjs extender script 'emitter'.

Typical implementation of component who emits even look like
    <div>
        <script>
        //<![CDATA[
            this.startLoadingAssets = function() {
                this.emit("loading", "assets"); // method signature emit(eventName, eventData)
            }
        //]]>
        </script>
    </div>
    
Typical implementation of component who listens for events
    <div>
        <script type="component" source="components/componentEmiter" id="emitter" />
        <script>
            // method signature on(eventName, eventHandler)
            this.emitter.on("loading", function(data) {
                console.log(data); // output: "assets"
            });
        </script>
    </div>
    
## TODO/ROADMAP ##
* rewrite componentjs implementation so that it can be extended a lot more easily
* write down full stack of functional and unit tests
* improve error and exception reporting
* provide backend component generation, ie do not load components at runtime but leave the backend to serve all the 
components in one request.
