# scollr
because functionality before fancy  

# Description
A plugin that replaces the default scrollbars in the browser with CSS scrollbars, without removing its natural behavior.

That means that it behaves like the user is used to, and dosen't try to normalize the scrolling for all users.

[Click here for demo](http://robertbue.no/plugins/jquery.scollr/)

[Click here for demo (standalone)](http://robertbue.no/plugins/jquery.scollr/standalone.html)

# Why?
Users have different settings for mouse speed, differexnt mouse, browser and operating system. So making a scrolling behavior that is equally for all users is, in first place, hard, if not impossible, but more importantly it's not what the user is used to. The scrolling behavior should be the same as on all other sites the user interact with. 

https://medium.com/design-idea/7764db6a9987
"When you scrolljack you are taking the memory of how a customer’s (most of you call these people users) legs work. They mean to walk down the page, but instead they are interrupted and taken to a new place, and unexpected place."

# What it does not do?
- Animates the scrolling content
- Add scrollbars to touch devices (because users should be presented with scrollbars default behavior)

# Goal
- Behave like your default scrollbar
The scrolling speed you are used to and with the same functionality as your default scrollbar (except arrows, because they are just ugly)

- No need for changes in your existing markup
scrollr only adds a extra div for the magic to happen. There should be no effect for the rest of your design/layout if scrollr is enabled or not

- Fast and lightweight (xkB js and css)
By using requestAnimationFrame (and not listning to scrollbar position) (fallbacks to setTimeout for older browsers) we have a optimized loop, and the whole plugin is written to it's basic, but still be powerfull by settings and options

- Customizable
All styling is done by CSS after scrollr-classes

- Not to break anything
If JavaScript is turned of it will fallback to the default scrollbras

# Requirements
jQuery 1.8.0 or higher
css style position is needed on element

# Browser Support
All A-grade browsers for desktop, touch devices is left untouches (read why under "What it does not do")

## Usage

1. Include jQuery:

	```html
	<script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>
	```

2. Include plugin's code:

	```html
	<script src="jquery.scrollr.js"></script>
	```

3. Create a img-tag:

	```html
	<article id="element"></article>
	```

4. Call the plugin:

	```javascript
	$("#element").scrollr({
	    offset : 0,
	    fade : false,
	    autoHandle: true,
	    minHandleHeight: 35,
	    maxHandleHeight: 9999999
	});
	```

## Public Methods
	
Method 1: 

	$('#element').scrollr('someThing', value);


## License

This plugin is available under the [MIT license](http://opensource.org/licenses/mit-license.php).

## Author

Made by [Robert Bue](http://robertbue.no)