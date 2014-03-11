/*
 	scrollr - v0.0.1 
 	A plugin that replaces the default scrollbars in the browser with CSS scrollbars, without removing its natural behavior.
	by Robert Bue (@robert_bue)

 	Licensed under MIT
 */

;(function ( $, window, document, undefined ) {

    var pluginName = "scrollr",
        dataPlugin = "plugin_" + pluginName,
        
        // default options
        defaults = {
			offset : 0,
            fadeOnHover: true,
            fadeOnActive: true,
            autoHandle: true,
            minHandleHeight: 35,
            maxHandleHeight: 9999999
		};

    var Plugin = function ( element, options ) {

        this.element = element;
        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;
        this.build();
        this.events();
    };

    Plugin.prototype.build = function () {
        var self = this;
            
        self.settings = this.settings,
        self.target = $(self.element),
        self.targetWidth = self.target.width(),
        self.targetHeight = self.target.height(),
        self.ticker = 0,
        self.scrollbarTop = 0,
        self.scrolling = false,
        self.totalHeight = 0;
        self.timer = null;


        // Wheel events
        //self.wheelEvents = ( 'onwheel' in document || document.documentMode >= 9 ) ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'];
        self.wheelEvents = ( 'onwheel' in document || document.documentMode >= 9 ) ? 'wheel' : 'mousewheel DOMMouseScroll MozMousePixelScroll';
        // webkitDirectionInvertedFromDevice

        // Key events
        //var hasKeyDown = 'onkeydown' in document;
        self.keyEvents = "keydown";
        //self.keyEvents = ( 'onkeydown' in document ) ? "onkeydown" : "keydown";

        // Mouse events
        //self.mouseEvents = "mousedown touchstart";
        self.mouseEvents = [
        'touchstart mousedown',
        'touchmove mousemove',
        'touchend touchcancel mouseup'];


        // Pointer events
        // var hasTouchWin = ( navigator.msMaxTouchPoints ) ? navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 1 : navigator.MaxTouchPoints && navigator.MaxTouchPoints > 1;
        // bodyTouchAction = document.body.style.msTouchAction;
        // document.body.style.msTouchAction = "none";

        //self.hasPointerEvents = window.navigator.pointerEnabled || window.navigator.msPointerEnabled;

        if ( window.PointerEvent ) {
            self.keyEvents = "pointerdown";
        } else if ( window.MSPointerEvent ) {
            self.keyEvents = "MSPointerDown";
        }

        // Touch events
        var hasTouch = 'ontouchstart' in window;
        self.mobileRegex = /mobile|tablet|ip(ad|hone|od)|android|silk/i;
        // check hammer.js - NO_MOUSEEVENTS
        if ( hasTouch && window.navigator.userAgent.match(self.mobileRegex) ) {
            return;
        }        

        // Add a scrollr class
        self.target.addClass('scrollr');


        self.target.wrapInner('<div class="scrollr-inner"></div>').append('<div class="scrollr-scrollbar scrollr-scrollbar-y"><div class="scrollr-handle"></div></div>');

        // this.scrollbar = $(document.createElement('div')).addClass('lazybar-' + this.options.axis);
        // this.scrubber = $(document.createElement('div')).addClass('scrubber').appendTo(this.scrollbar);

        // Optimze this - $innner = createelement(div);
        self.target.scrollrInner = self.target.find('.scrollr-inner');
        self.target.scrollrBar = self.target.find('.scrollr-scrollbar-y');
        self.target.scrollrHandle = self.target.find('.scrollr-handle');

        // Set tabindex to 0 to allow keydown event
        self.target.scrollrInner.attr("tabindex", 0);



        // Get scrollbar width and sets padding
        // FIX THIS: DONT DO THIS EVERYTIME
        var scrollBarWidth = getScrollbarWidth();

        if ( scrollBarWidth === 0 ) {
            //currentPadding = window.getComputedStyle(this.content, null).getPropertyValue('padding-right').replace(/\D+/g, '');
            currentPadding = 0;

            cssRule = {
                right: -14,
                paddingRight: +currentPadding + 14
            };
        }

        //else if (BROWSER_SCROLLBAR_WIDTH) {
        else {
            cssRule = {
                right: -scrollBarWidth
            };
        }

        if (cssRule != null) {
            //self.target.scrollrInner.css(cssRule);
        }


        // Find height of content
        // Add this as a public method for updating the height after DOM changes
        // var intElemScrollHeight = document.getElementById(id_attribute_value).scrollHeight;
        // self.target.scrollrInner.children().each(function(){
        //     self.totalHeight = self.totalHeight + $(this).outerHeight(true);
        // });
        

        if ( self.settings.fadeOnHover ) {    
            self.target.addClass('scrollr-fade-hover');
            self.target.scrollrBar.hide();
        }

        if ( self.settings.fadeOnActive ) {    
            self.target.addClass('scrollr-fade');
            self.target.scrollrBar.hide();
        }

        

        // Checks if the browser support transform property
        // FIX THIS: IS EXECUTED EVERY TIME
        if ( !self.transformProperty ) {
            if ( $.support.transform && $.support.transform !== "transform" ) {
                // Checks if browser support translate3d
                // If so we'll use translate3d because its faster, right?
                if ( isTranslate3dSupported() ) {
                    self.transformProperty = "translate3d"
                } else {
                    self.transformProperty = "translate";
                }
            } else {
                self.transformProperty = "top";
            }
        }

        this.update();
        this.scrollbarPosition();
    }

    Plugin.prototype.events = function () {
        
        var self = this;

        // Mousewheel
        //self.target.on(self.wheelEvents + " " + self.keyEvents + " " + self.mouseEvents[0], function(event) {
        self.target.on(self.wheelEvents + " " + self.keyEvents, function(event) {         
            self.eventTrigger(); 
        });

        var mouse = {}, 
            start = {}, 
            handle = {};

        // Click scrollbar track
        self.target.scrollrBar.on(self.mouseEvents[0], function(event) {
   
            self.eventTrigger();

            self.scrollbarTop = (event.pageY / (self.scrollrInnerHeight + self.scrollrHandleHeight)) * (self.totalHeight);

            self.target.scrollrInner.scrollTop(self.scrollbarTop);    
        });

        // Select text
        self.target.scrollrInner.on(self.mouseEvents[0], function(event) {
   
            //event.stopPropagation();
            self.dragging = true;
            self.selectText = true;
            self.scrollTop = self.target.scrollrInner.scrollTop();

            self.eventTrigger();

            self.handleDragging = setInterval(function() {
                self.eventTrigger();
            }, 400);
        });

        // Drag handle
        self.target.scrollrHandle.on(self.mouseEvents[0], function(event) {          
            event.preventDefault();
            event.stopPropagation();
            
            self.dragging = true;
            self.scrollTop = self.target.scrollrInner.scrollTop();

            self.eventTrigger();

            self.handleDragging = setInterval(function() {
                self.eventTrigger();
            }, 400);

            //self.target.addClass('scrolling');

            handle.y = getHandlePosition('y', self);
            start.y = event.pageY;
            
        });

        $(document).on(self.mouseEvents[1], function(event) { 
            if ( self.dragging && !self.selectText ) {
                event.preventDefault();

                mouse.moveX = event.pageX;
                mouse.moveY = event.pageY - start.y;        

                self.scrollTop = handle.y + mouse.moveY;
                self.scrollTop = Math.round(self.scrollTop * (self.totalHeight - self.scrollrInnerHeight) / (self.scrollrInnerHeight - self.scrollrHandleHeight));  
            }
        });

        $(document).on(self.mouseEvents[2], function() {
            self.dragging = false;
            self.selectText = false;
            clearInterval(self.handleDragging);
            //self.target.removeClass('scrolling');
        });

        $(window).on("load resize", function(event) {
            self.update();
            console.log('reisze');
        });

        // Needed?
        $('img').on('load', function() {
            self.refresh();
        });
    }

    Plugin.prototype.update = function () {

        var self = this;

        self.scrollrInnerHeight = self.target.scrollrInner.height();
        self.scrollrHandleHeight = self.target.scrollrHandle.height();
        self.totalHeight = self.target.scrollrInner[0].scrollHeight;

        // Set the height of the handle from the content height vs visible height ratio
        if ( self.settings.autoHandle ) {
            self.scrollrHandleHeight = Math.round((self.scrollrInnerHeight / self.totalHeight) * self.scrollrInnerHeight);

            self.scrollrHandleHeight = Math.min(self.scrollrHandleHeight, self.settings.maxHandleHeight);
            self.scrollrHandleHeight = Math.max(self.scrollrHandleHeight, self.settings.minHandleHeight);

            self.target.scrollrHandle.height(self.scrollrHandleHeight);
        }

        if ( self.totalHeight < self.scrollrInnerHeight ) {
            //if ( self.settings.fadeOnHover ) { 
                self.target.scrollrBar.hide();
            //}
        } else {
            //if ( !self.settings.fadeOnHover ) { 
                self.target.scrollrBar.show();
            //}
        }
    }

    Plugin.prototype.scrollbarPosition = function () {
        var self = this;

        if ( self.dragging && !self.selectText  ) {
            self.target.scrollrInner.scrollTop(self.scrollTop);
            self.scrollbarTop = self.scrollTop;
        } else {
            self.scrollLeft = self.target.scrollrInner.scrollLeft();
            self.scrollbarTop = self.target.scrollrInner.scrollTop();
        }

        self.scrollbarTop = Math.round((self.scrollbarTop / (self.totalHeight - self.scrollrInnerHeight)) * (self.scrollrInnerHeight - self.scrollrHandleHeight));
        
        self.scrollbarTop = Math.min(self.scrollbarTop, (self.scrollrInnerHeight - self.scrollrHandleHeight));
        self.scrollbarTop = Math.max(self.scrollbarTop, 0);
        
        //element.target.scrollrHandle.css({"top": self.scrollbarTop});
        //self.target.scrollrHandle.css({ transform: "translateY(" + self.scrollbarTop + "px)" });
        self.target.scrollrHandle.css(
            cssValues(0, self.scrollbarTop, self.transformProperty)
        );

        
    }

    Plugin.prototype.eventTrigger = function () {
        var self = this;

        // Add focus for keydown event
        // FIX THIS: JUMPS TO THIS WHEN ALREADY SCROLLED DOWN ON SITE
        // self.target.scrollrInner.focus();

        //console.log(event);

        clearTimeout(self.timer);

        if ( !self.scrolling ) {
            self.start(self);
        }

        self.scrolling = true;

        self.timer = setTimeout(function(){
            self.stop(self);
        }, 500);
    }

    Plugin.prototype.loop = function (self) {
        //console.log('loop')
        var self = this;
        this.scrollbarPosition();

        this.ticker = requestAnimationFrame(function(){
            self.loop()
        });

        // ES5
        //requestAnimationFrame(this.update.bind(this)});
        
    }

    Plugin.prototype.start = function () {
        this.loop();
        this.target.addClass('scrollr-active');
    }

    Plugin.prototype.stop = function () {
        if ( self.dragging ) {
           return; //is this needed?
        }

        cancelAnimationFrame(this.ticker);
        this.ticker = null;
        this.scrolling = false;
        this.target.removeClass('scrollr-active');
    }

    Plugin.prototype.destroy = function () {
        this.element.data( dataPlugin, null );
    }
 
    // Get the position of the handle
    function getHandlePosition(axis, self) {
        
        if ( self.transformProperty == "top" ) {
            handle = parseInt(self.target.scrollrHandle.css('top'));
        } else {
            handle = self.target.scrollrHandle.css('transform');
            handle = handle.match(/(-?[0-9\.]+)/g);
            handle = parseInt(handle[5]);
        }

        return handle;
    }

    // Formats css values
    function cssValues(x, y, property) {
        
        if ( property == "translate" ) {
            cssValue = {
                transform: "translate(" + x + "px, " + y + "px)"
            };
        }

        else if ( property == "translate3d" ) {
            cssValue = {
                transform: "translate3d(" + x + "px, " + y + "px, 0)"
            };
        }

        else {
            cssValue = {
                left: x + "px",
                top: y + "px"
            };
        }

        return cssValue;
    }

    function getScrollbarWidth() {
        var div, divStyle, scrollbarWidth;
        div = document.createElement('div');
        divStyle = div.style;
        divStyle.position = 'absolute';
        divStyle.width = '100px';
        divStyle.height = '100px';
        divStyle.overflow = "scroll";
        divStyle.top = '-9999px';
        document.body.appendChild(div);
        scrollbarWidth = div.offsetWidth - div.clientWidth;
        document.body.removeChild(div);
        
        return scrollbarWidth;
    }

    // Testing for CSS 3D Transforms Support
    // optimize this - already got vendor prefixes from cssPropertyCheck
    function isTranslate3dSupported() {
        var el = document.createElement('div'),
        has3d,
        transforms = {
            'webkitTransform':'-webkit-transform',
            'OTransform':'-o-transform',
            'msTransform':'-ms-transform',
            'MozTransform':'-moz-transform',
            'transform':'transform'
        };
     
        // Add it to the body to get the computed style
        document.body.insertBefore(el, null);
     
        for(var t in transforms){
            if( el.style[t] !== undefined ){
                el.style[t] = 'translate3d(1px,1px,1px)';
                has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
            }
        }
     
        document.body.removeChild(el);
     
        return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
    }

    function cssPropertyCheck( prop ) {
        var vendorProp, supportedProp,
        capProp = prop.charAt( 0 ).toUpperCase() + prop.slice( 1 ),
        prefixes = [ "Moz", "Webkit", "O", "ms" ],
        div = document.createElement( "div" );

        if ( prop in div.style ) {
            supportedProp = prop;
        } else {
            for ( var i = 0; i < prefixes.length; i++ ) {
            vendorProp = prefixes[ i ] + capProp;
                if ( vendorProp in div.style ) {
                    supportedProp = vendorProp;
                    break;
                }
            }
        }

        div = null;
        $.support[ prop ] = supportedProp;
        return supportedProp;
    }

    var transform = cssPropertyCheck("transform");


    // requestAnimationFrame polyfill
    // https://gist.github.com/paulirish/1579671    
    (function() {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                       || window[vendors[x]+'CancelRequestAnimationFrame'];
        }
     
        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
                  timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
     
        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }());

    $.fn[ pluginName ] = function ( options ) {
        return this.each(function() {
            if ( !$.data( this, "plugin_" + pluginName ) ) {
                $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
            }
        });
    };

}(jQuery, window, document));