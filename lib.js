var EmbedCartBuy = (function () {
	
	var module = {};
	
	//default config
	var config = {
		settings: {
			title: true,
			price: true,
			image: true,
			buttonColor: '0B76C9',
			buttonTxtColor: 'fff',
			bgColor: '0B76C9',
			buttonTxt: 'Buy Now'
		}
	};
	
	/*
	* setConfig options
	*/
	var setConfigOptions = function(data){
		data.url 		=  data.socket+data.domain;
		data.createUrl  =  data.url+'/checkout.php';
		data.invoiceUrl =  data.url+'/invoice.php';
		data.productUrl =  data.url+'/products.php';
		data.spinner 	=  data.url+'/images/spinner.gif';
		data.closeIcon 	=  data.url+'/images/close-icon.png';
		
		//overwrite default setings
		data.settings	=  Object.assign({},config.settings, data.settings);
		config = data;
	};
	
	/**
	 * Find in the Array and return matched object
	 */
	var grep = function(items, callback, direct) {
		var filtered = [],
			len = items.length,
			i = 0;
		for (i; i < len; i++) {
			var item = items[i];
			var cond = callback(item);
			if (cond) {
				filtered.push(item);
			}
		}

		filtered = (direct)? filtered[0] : filtered;
		return filtered;
	};
	
	/**
	 * Find in the Object and return matched object
	 */
	var grepObj = function(items, callback, direct) {
		var items = Object.keys(items).map(function (key) { return items[key]; })
		return grep(items, callback, direct);
	};
	
	/**
	 * Find in array by value
	 */
	var inArray = function(needle, haystack){
		for(var key in haystack){
			if(needle === haystack[key]){
				return key;
			}
		}
		return false;
	}
		
	/**
     * Set class for element
     */
    function setclass(className, element) {
        if (className) {
            if (element.classList) {
                element.classList.add(className);
            } else {
                var classes = element.className.split(" ");
                if (classes.indexOf(className) > -1) {
                    return;
                }
                element.setAttribute("class", element.className + " " + className);
            }
        }
    }
    
	/*
	 * Check if element has class
	 */
	function hasClass(cls,element) {
		return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
	}

	/**
     * Remove class from element
     */
    function removeclass(n, element) {
        if (n) {
            if (element.classList) {
                element.classList.remove(n);
            } else {
                element.setAttribute("class", element.className.replace(n, ""));
            }
        }
    }
	
	/**
	 * Append Style Tag
	 */
	function appendStyleTag(el,cssTxt){
		styletag = document.createElement("style");
		styletag.appendChild(document.createTextNode(cssTxt));
		el.appendChild(styletag);
	}
	
	/*
	 * Format Price
	 */
	function formatMoney(n, c, d, t) {
		c = isNaN(c = Math.abs(c)) ? 2 : c,
		d = d == undefined ? "." : d,
		t = t == undefined ? "," : t,
		s = n < 0 ? "-" : "",
		i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
		j = (j = i.length) > 3 ? j % 3 : 0;
		return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
	};
	
	/*
	 * Remove last comma
	 */
	function rtrim(string){
		return string.replace(/,\s*$/, '');
	}
	
	/*
	 * Query to append modules
	 */
	function query(next, module) {
        return module = {
            exports: {}
        }, next(module, module.exports), module.exports;
    }
	
	/**
	 * Initiate properties in object
     * Used @createIframe
	 */
	var make = function() {
		
		function defineProperty(proto, name) {
			var i = 0;
			for (; i < name.length; i++) {
				var desc = name[i];
				desc.enumerable = desc.enumerable || false;
				desc.configurable = true;
				if ("value" in desc) {
					desc.writable = true;
				}
				Object.defineProperty(proto, desc.key, desc);
			}
		}
		return function(context, name, tag) {
			return name && defineProperty(context.prototype, name), tag && defineProperty(context, tag), context;
		};
	}();

	/*
	 * Module Append
	 */
	function moduleAppend(prop) {
        return prop && ("object" == typeof prop && "default" in prop) ? prop.default : prop;
    }

	/**
     * Ajax request to get the list of products.
     */
	var ajaxRequest = function(method,url,params,async){
		return new Promise(function(resolve, reject) {
			var allProducts = {};
			var isIE8 = window.XDomainRequest ? true : false;
			
			if (isIE8) {
				request = new window.XDomainRequest();
			}
			else {
				request = new XMLHttpRequest();
			}

			if(isIE8) {
				request.onload = function(){
					var response = request.responseText;
					resolve({
						json: response
					});
				};
				request.open(method, url, async);
				request.send(params);
			}
			else {
				request.open(method, url, async);
				
				//Send the proper header information along with the request
				if(params != ''){
					request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				}
				request.onreadystatechange = function(){
					if (request.readyState == 4){
						if (request.status == 200) {
							var response = request.responseText;
							resolve({
								json: response
							});
						}
						else {
							reject("Cross origin Error!");
						}
					}
				};
				request.send(params);
			}
		});
	}
	
	/**
	 * Render Products to ajax call
	 */
	var renderProducts = function(){
		
		if(undefined != config.products){
			//get all product IDs from product object
			var allProductIDs = [];
			Object.keys(config.products).forEach(function(pdivID) {
				var productIDs = config.products[pdivID];
				for(var pid in productIDs){
					allProductIDs.push(parseInt(productIDs[pid]));
				}
			});
			
			var url =  config.productUrl+'/?ids='+allProductIDs.join(',');
			return ajaxRequest('GET',url,'',true);
		}
		else{
			return new Promise(function(resolve, reject) {
				reject('Products not found!');
			});
		}
	}

	/**
	 * Serialize the form data
	 */
	function serialize(form) {
		if (!form || form.nodeName !== "FORM") {
				return;
		}
		var i, j, q = [];
		for (i = form.elements.length - 1; i >= 0; i = i - 1) {
			if (form.elements[i].name === "") {
					continue;
			}
			switch (form.elements[i].nodeName) {
				case 'INPUT':
						switch (form.elements[i].type) {
						case 'text':
						case 'hidden':
						case 'password':
						case 'button':
						case 'reset':
						case 'submit':
								q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
								break;
						case 'checkbox':
						case 'radio':
								if (form.elements[i].checked) {
										q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
								}                                               
								break;
						}
						break;
						case 'file':
						break; 
				case 'TEXTAREA':
						q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
						break;
				case 'SELECT':
						switch (form.elements[i].type) {
						case 'select-one':
								q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
								break;
						case 'select-multiple':
								for (j = form.elements[i].options.length - 1; j >= 0; j = j - 1) {
										if (form.elements[i].options[j].selected) {
												q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].options[j].value));
										}
								}
								break;
						}
						break;
				case 'BUTTON':
						switch (form.elements[i].type) {
						case 'reset':
						case 'submit':
						case 'button':
								q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
								break;
						}
				break;
			}
		}
		return q.join("&");
	}
	
	
	/** 
	 * Mustache Framework 
	 */
	var selfQ = "undefined" != typeof window ? window : "undefined" != typeof self ? self : {};
	var mustacheFramework = query(function(dataAndEvents, arg) {
        ! function(e, add) {
            if ("object" == typeof arg && (arg && "string" != typeof arg.nodeName)) {
                add(arg);
            } else {
                if ("function" == typeof define && define.amd) {
                    define(["exports"], add);
                } else {
                    e.Mustache = {};
                    add(e.Mustache);
                }
            }
        }(selfQ, function(mustache) {
            
			function isFunction(fn) {
                return "function" == typeof fn;
            }
            
			function type(obj) {
                return isArray(obj) ? "array" : typeof obj;
            }
            
			function trim(str) {
                return str.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
            }
            
			function callback(arg, key) {
                return null != arg && ("object" == typeof arg && key in arg);
            }
            
            function post(attributes, name) {
                return fn.call(attributes, name);
            }
            
            function isWhitespace(string) {
                return !post(value, string);
            }
            
            function escapeHtml(s) {
                return String(s).replace(/[&<>"'`=\/]/g, function(off) {
                    return buf[off];
                });
            }
            
            function parseTemplate(template, tags) {
                
                function stripSpace() {
                    if (_tryInitOnFocus && !_isFocused) {
                        for (; spaces.length;) {
                            delete tokens[spaces.pop()];
                        }
                    } else {
                        spaces = [];
                    }
                    _tryInitOnFocus = false;
                    _isFocused = false;
                }
                
                function evaluate(val) {
                    if ("string" == typeof val && (val = val.split(re, 2)), !isArray(val) || 2 !== val.length) {
                        throw new Error("Invalid tags: " + val);
                    }
                    whiteRe = new RegExp(trim(val[0]) + "\\s*");
                    curlyRe = new RegExp("\\s*" + trim(val[1]));
                    closeRe = new RegExp("\\s*" + trim("}" + val[1]));
                }
                if (!template) {
                    return [];
                }
                var whiteRe;
                var curlyRe;
                var closeRe;
                var eventPath = [];
                var tokens = [];
                var spaces = [];
                var _tryInitOnFocus = false;
                var _isFocused = false;
                evaluate(tags || mustache.tags);
                var start;
                var value;
                var source;
                var chr;
                var token;
                var a;
                var scanner = new Scanner(template);
                for (; !scanner.eos();) {
                    if (start = scanner.pos, source = scanner.scanUntil(whiteRe)) {
                        var i = 0;
                        var il = source.length;
                        for (; i < il; ++i) {
                            chr = source.charAt(i);
                            if (isWhitespace(chr)) {
                                spaces.push(tokens.length);
                            } else {
                                _isFocused = true;
                            }
                            tokens.push(["text", chr, start, start + 1]);
                            start += 1;
                            if ("\n" === chr) {
                                stripSpace();
                            }
                        }
                    }
                    if (!scanner.scan(whiteRe)) {
                        break;
                    }
                    if (_tryInitOnFocus = true, value = scanner.scan(tagRe) || "name", scanner.scan(text), "=" === value ? (source = scanner.scanUntil(eqRe), scanner.scan(eqRe), scanner.scanUntil(curlyRe)) : "{" === value ? (source = scanner.scanUntil(closeRe), scanner.scan(tag), scanner.scanUntil(curlyRe), value = "&") : source = scanner.scanUntil(curlyRe), !scanner.scan(curlyRe)) {
                        throw new Error("Unclosed tag at " + scanner.pos);
                    }
                    if (token = [value, source, start, scanner.pos], tokens.push(token), "#" === value || "^" === value) {
                        eventPath.push(token);
                    } else {
                        if ("/" === value) {
                            if (a = eventPath.pop(), !a) {
                                throw new Error('Unopened section "' + source + '" at ' + start);
                            }
                            if (a[1] !== source) {
                                throw new Error('Unclosed section "' + a[1] + '" at ' + start);
                            }
                        } else {
                            if ("name" === value || ("{" === value || "&" === value)) {
                                _isFocused = true;
                            } else {
                                if ("=" === value) {
                                    evaluate(source);
                                }
                            }
                        }
                    }
                }
                if (a = eventPath.pop()) {
                    throw new Error('Unclosed section "' + a[1] + '" at ' + scanner.pos);
                }
                return nestTokens(squashTokens(tokens));
            }
            
            function squashTokens(tokens) {
                var token;
                var lastToken;
                var squashedTokens = [];
                var ti = 0;
                var nTokens = tokens.length;
                for (; ti < nTokens; ++ti) {
                    token = tokens[ti];
                    if (token) {
                        if ("text" === token[0] && (lastToken && "text" === lastToken[0])) {
                            lastToken[1] += token[1];
                            lastToken[3] = token[3];
                        } else {
                            squashedTokens.push(token);
                            lastToken = token;
                        }
                    }
                }
                return squashedTokens;
            }
            
            function nestTokens(tokens) {
                var token;
                var section;
                var tree = [];
                var collector = tree;
                var sections = [];
                var ti = 0;
                var nTokens = tokens.length;
                for (; ti < nTokens; ++ti) {
                    switch (token = tokens[ti], token[0]) {
                        case "#":
                            ;
                        case "^":
                            collector.push(token);
                            sections.push(token);
                            collector = token[4] = [];
                            break;
                        case "/":
                            section = sections.pop();
                            section[5] = token[2];
                            collector = sections.length > 0 ? sections[sections.length - 1][4] : tree;
                            break;
                        default:
                            collector.push(token);
                    }
                }
                return tree;
            }
            
            function Scanner(string) {
                this.string = string;
                this.tail = string;
                this.pos = 0;
            }
            
            function Context(view, parent) {
                this.view = view;
                this.cache = {
                    ".": this.view
                };
                this.parent = parent;
            }
            
            function Writer() {
                this.cache = {};
            }
            var ostring = Object.prototype.toString;
            var isArray = Array.isArray || function(attributes) {
                return "[object Array]" === ostring.call(attributes);
            };
            var fn = RegExp.prototype.test;
            var value = /\S/;
            var buf = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
                "/": "&#x2F;",
                "`": "&#x60;",
                "=": "&#x3D;"
            };
            var text = /\s*/;
            var re = /\s+/;
            var eqRe = /\s*=/;
            var tag = /\s*\}/;
            var tagRe = /#|\^|\/|>|\{|&|=|!/;
            
            Scanner.prototype.eos = function() {
                return "" === this.tail;
            };
            
            Scanner.prototype.scan = function(re) {
                var match = this.tail.match(re);
                if (!match || 0 !== match.index) {
                    return "";
                }
                var string = match[0];
                return this.tail = this.tail.substring(string.length), this.pos += string.length, string;
            };
            
            Scanner.prototype.scanUntil = function(re) {
                var match;
                var index = this.tail.search(re);
                switch (index) {
                    case -1:
                        match = this.tail;
                        this.tail = "";
                        break;
                    case 0:
                        match = "";
                        break;
                    default:
                        match = this.tail.substring(0, index);
                        this.tail = this.tail.substring(index);
                }
                return this.pos += match.length, match;
            };
            
            Context.prototype.push = function(object) {
                return new Context(object, this);
            };
            
            Context.prototype.lookup = function(name) {
                var value;
                var cache = this.cache;
                if (cache.hasOwnProperty(name)) {
                    value = cache[name];
                } else {
                    var codeSegments;
                    var i;
                    var result = this;
                    var state = false;
                    for (; result;) {
                        if (name.indexOf(".") > 0) {
                            value = result.view;
                            codeSegments = name.split(".");
                            i = 0;
                            for (; null != value && i < codeSegments.length;) {
                                if (i === codeSegments.length - 1) {
                                    state = callback(value, codeSegments[i]);
                                }
                                value = value[codeSegments[i++]];
                            }
                        } else {
                            value = result.view[name];
                            state = callback(result.view, name);
                        }
                        if (state) {
                            break;
                        }
                        result = result.parent;
                    }
                    cache[name] = value;
                }
                return isFunction(value) && (value = value.call(this.view)), value;
            };
            
            Writer.prototype.clearCache = function() {
                this.cache = {};
            };
            
            Writer.prototype.parse = function(text, options) {
                var cache = this.cache;
                var item = cache[text];
                return null == item && (item = cache[text] = parseTemplate(text, options)), item;
            };
            
            Writer.prototype.render = function(opt_attributes, view, deepDataAndEvents) {
                var expectationResult = this.parse(opt_attributes);
                var directives = view instanceof Context ? view : new Context(view);
                return this.renderTokens(expectationResult, directives, deepDataAndEvents, opt_attributes);
            };
            
            Writer.prototype.renderTokens = function(result, directives, deepDataAndEvents, attributes) {
                var b;
                var val;
                var c;
                var buffer = "";
                var i = 0;
                var iLength = result.length;
                for (; i < iLength; ++i) {
                    c = void 0;
                    b = result[i];
                    val = b[0];
                    if ("#" === val) {
                        c = this.renderSection(b, directives, deepDataAndEvents, attributes);
                    } else {
                        if ("^" === val) {
                            c = this.renderInverted(b, directives, deepDataAndEvents, attributes);
                        } else {
                            if (">" === val) {
                                c = this.renderPartial(b, directives, deepDataAndEvents, attributes);
                            } else {
                                if ("&" === val) {
                                    c = this.unescapedValue(b, directives);
                                } else {
                                    if ("name" === val) {
                                        c = this.escapedValue(b, directives);
                                    } else {
                                        if ("text" === val) {
                                            c = this.rawValue(b);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (void 0 !== c) {
                        buffer += c;
                    }
                }
                return buffer;
            };
            
            Writer.prototype.renderSection = function(data, options, deepDataAndEvents, name) {
                
                function scopedRender(attributes) {
                    return jQuery.render(attributes, options, deepDataAndEvents);
                }
                var jQuery = this;
                var buffer = "";
                var value = options.lookup(data[1]);
                if (value) {
                    if (isArray(value)) {
                        var i = 0;
                        var len = value.length;
                        for (; i < len; ++i) {
                            buffer += this.renderTokens(data[4], options.push(value[i]), deepDataAndEvents, name);
                        }
                    } else {
                        if ("object" == typeof value || ("string" == typeof value || "number" == typeof value)) {
                            buffer += this.renderTokens(data[4], options.push(value), deepDataAndEvents, name);
                        } else {
                            if (isFunction(value)) {
                                if ("string" != typeof name) {
                                    throw new Error("Cannot use higher-order sections without the original template");
                                }
                                value = value.call(options.view, name.slice(data[3], data[5]), scopedRender);
                                if (null != value) {
                                    buffer += value;
                                }
                            } else {
                                buffer += this.renderTokens(data[4], options, deepDataAndEvents, name);
                            }
                        }
                    }
                    return buffer;
                }
            };
            
            Writer.prototype.renderInverted = function(v12, directives, deepDataAndEvents, opt_attributes) {
                var pathConfig = directives.lookup(v12[1]);
                if (!pathConfig || isArray(pathConfig) && 0 === pathConfig.length) {
                    return this.renderTokens(v12[4], directives, deepDataAndEvents, opt_attributes);
                }
            };
            
            Writer.prototype.renderPartial = function(v12, options, template) {
                if (template) {
                    var attributes = isFunction(template) ? template(v12[1]) : template[v12[1]];
                    return null != attributes ? this.renderTokens(this.parse(attributes), options, template, attributes) : void 0;
                }
            };
            
            Writer.prototype.unescapedValue = function(keys, options) {
                var unescapedValue = options.lookup(keys[1]);
                if (null != unescapedValue) {
                    return unescapedValue;
                }
            };
            
            Writer.prototype.escapedValue = function(keys, options) {
                var body = options.lookup(keys[1]);
                if (null != body) {
                    return mustache.escape(body);
                }
            };
            
            Writer.prototype.rawValue = function(v12) {
                return v12[1];
            };
            mustache.name = "mustache.js";
            mustache.version = "2.2.1";
            mustache.tags = ["{{", "}}"];
            var model = new Writer;
            mustache.clearCache = function() {
                return model.clearCache();
            };
            
            mustache.parse = function(resp, xhr) {
                return model.parse(resp, xhr);
            };
            
            mustache.render = function(opt_attributes, options, deepDataAndEvents) {
                if ("string" != typeof opt_attributes) {
                    throw new TypeError('Invalid template! Template should be a "string" but "' + type(opt_attributes) + '" was given as the first argument for mustache#render(template, view, partials)');
                }
                return model.render(opt_attributes, options, deepDataAndEvents);
            };
            
            mustache.to_html = function(attributes, view, deepDataAndEvents, send) {
                var result = mustache.render(attributes, view, deepDataAndEvents);
                return isFunction(send) ? void send(result) : result;
            };
            mustache.escape = escapeHtml;
            mustache.Scanner = Scanner;
            mustache.Context = Context;
            mustache.Writer = Writer;
        });
    });
    var mustache = moduleAppend(mustacheFramework);
	
		
	//iframe settings and attributes
	var iframeSettings = {
		'settings' : {
			width	 : "100%",
			overflow : "hidden",
			border	 : "none"
		},
		'attrs': {
			scrolling			: "no",
			frameBorder			: "0",
			verticalscrolling	: "no",
			allowTransparency	: "true",
			horizontalscrolling	: "no"
		},
		'metas': {
			meta1 : {"charset": "utf-8"},
			meta2 : {"http-equiv": "X-UA-Compatible", "content" : "IE=edge"},
			meta3 : {"name": "viewport", "content" : "width=device-width, initial-scale=1"}
		},
		'defaultbrowserFeature' : '.is-active {\n}'
	};
	
	//create iframe for products and cart sidebar
	var createIframe = function() {
        
        function init(parent, params) {
            var self = this;
            this.el = document.createElement("iframe");
            this.parent = parent;
            this.stylesheet = params.stylesheet;
            this.classes = params.classes;
            this.scripts = params.scripts;
            this.fullheight = params.fullheight;
            this.htmlcontent = params.htmlcontent || [];
            this.name = params.name;
            if (params.width) {
                this.setWidth(params.width);
            }
			this.setHeight('100%');
            Object.keys(iframeSettings.settings).forEach(function(x) {
                self.el.style[x] = iframeSettings.settings[x];
            });
            Object.keys(iframeSettings.attrs).forEach(function(attr) {
                return self.el.setAttribute(attr, iframeSettings.attrs[attr]);
            });
            this.el.setAttribute("name", params.name);
            this.styleTag = null;
        }
        return init.prototype.load = function() {
            var that = this;
            return new Promise(function(done) {
                
                that.el.onload = function() {
					return that.setBodycontent(),that.setMeta(),that.setScript(),that.appendStyleTag(); 
                };
				done();
				
                that.parent.appendChild(that.el);
            });
        }, init.prototype.reload = function() {
			var that = this;
			var tempDiv = document.createElement("div");
				tempDiv.innerHTML = that.htmlcontent;
				setclass(that.classes,tempDiv);
				that.document.body.innerHTML = '';
				that.document.body.appendChild(tempDiv);
				
        }, init.prototype.setMeta= function() {
			var that = this;
			Object.keys(iframeSettings.metas).forEach(function(attr) {
				meta = document.createElement("meta");
				Object.keys(iframeSettings.metas[attr]).forEach(function(key) {
					meta.setAttribute(key, iframeSettings.metas[attr][key]);
				});				
				that.document.head.appendChild(meta);
            });
        }, init.prototype.setScript= function() {
			var that = this;
			if(undefined != this.scripts){
				tempDiv = document.createElement("script");
				tempDiv.innerHTML = this.scripts;
				that.document.head.appendChild(tempDiv);
			}
        }, init.prototype.setcontent= function(content_) {
			this.htmlcontent = content_;
        }, init.prototype.setBodycontent = function() {
			var that = this;
			return new Promise(function(proceed) {
				
				var tempDiv = document.createElement("div");
				tempDiv.innerHTML = that.htmlcontent;
				setclass(that.classes,tempDiv);
				that.document.body.appendChild(tempDiv);
				
				//process body content
				proceed();

				setTimeout(function() {
					h = that.document.body.firstChild.scrollHeight+'px';
					that.setHeight(h);
				}, 1000);
			});
        }, init.prototype.setWidth = function(width) {
            this.parent.style["max-width"] = width;
		}, init.prototype.setHeight = function(h) {
            this.el.style.height = (this.fullheight)? '100%' : h;
        }, init.prototype.addClass = function(className) {
            setclass(className, this.parent);
        }, init.prototype.removeClass = function(c) {
            removeclass(c, this.parent);
        }, init.prototype.setName = function(val) {
            this.el.setAttribute("name", val);
        }, init.prototype.appendStyleTag = function() {
            if (this.document.head) {
				//add style in iframe
                this.styleTag = this.document.createElement("style");
                if (this.styleTag.styleSheet) {
                    this.styleTag.styleSheet.cssText = this.css;
                } else {
                    this.styleTag.appendChild(this.document.createTextNode(this.css));
                }
                this.document.head.appendChild(this.styleTag);
            }
        }, make(init, [{
            key: "width",
            get: function() {
                return this.parent.style["max-width"];
            }
        }, {
            key: "document",
            get: function() {
                var contentDocument = void 0;
                return this.el.contentWindow && this.el.contentWindow.document.body ? contentDocument = this.el.contentWindow.document : this.el.document && this.el.document.body ? contentDocument = this.el.document : this.el.contentDocument && (this.el.contentDocument.body && (contentDocument = this.el.contentDocument)), contentDocument;
            }
        }, {
            key: "css",
            get: function() {
                return this.stylesheet + " \n " + iframeSettings.defaultbrowserFeature;
            }
        }]), init;
    }();
	
	
	/**
	 * Client for queries and action
	 */
	var EmbedCartClientCore = query(function(module){
		
		var app = {};
		
		/*
		 * Get Products from temp storage
		 */
		app.getProducts = function(){
			return (JSON.parse(localStorage.getItem('embedcart-productos')) != null) ? JSON.parse(localStorage.getItem('embedcart-productos')) : {};
		}
		
		/*
		 * Get Cart Products from temp storage
		 */
		app.getCartProducts = function(){
			return (JSON.parse(localStorage.getItem('embedcart-cart')) != null) ? JSON.parse(localStorage.getItem('embedcart-cart')) : {items : []}
		}
		
		/*
		 * Set Items to storage
		 */
		app.setItems = function(items){
			localStorage.setItem('embedcart-cart', JSON.stringify(items));
		}
		
		/*
		 * Empty Cart items storage
		 */
		app.emptyCart = function(item){
			localStorage.removeItem('embedcart-cart');
		}
		
		/**
		 * Create Products
		 */
		app.createProducts = function(prdIds){
			
			var productos = app.getProducts();
			
			//default product options
			defaultData = defaultOpts.product;
			
			productsGrid = '<div class="product-grid">'
			
				for(var i = 0; i < productos.total; i++){
					
					//skip if product not exists in array to display in single div
					if(!inArray(parseInt(productos[i].pid), prdIds)){
						continue;
					}

					//check if unlimited stock or limit qty for product
					if(productos[i].unlimited_stock == 'Yes' || (productos[i].unlimited_stock == 'No' && productos[i].limit_qty > 0)){
						
						productos[i].img = function() {
							return app.createImagePath(productos[i]);
						}
						productos[i].qty = function() {
							return (parseInt(this.limit_qty) > 0)? this.limit_qty : (this.unlimited_stock == 'Yes')? 'Unlimited': defaultData.text.outOfStock;
						}
						productos[i].formatPrice = function(){
							return this.sign + formatMoney(this.price,2,'.',',');
						}
						
						productos[i].attributesOption = function(){
							attributes = JSON.parse(this.attributes);
							mustacheFormattedAttr = [];

							for (var attr in attributes){
								if (attributes.hasOwnProperty(attr)){
									mustacheFormattedAttr.push({
										'key'  : attr,
										'value': Object.keys(attributes[attr]).map(function (key) { attributes[attr][key].aid = key; return attributes[attr][key]; })
									});
								}
							}
							return mustacheFormattedAttr;
						}
						
						productos[i].hasAttributes = function(){
							attributes = JSON.parse(this.attributes);
							return (Object.keys(attributes).length > 0)? true : false;
						}
						
						var prodData  = Object.assign({config:config},defaultData, productos[i]);
						productsGrid += mustache.render($htmlStructure.product,prodData)
					}

				}

			productsGrid+= '</div>';
			
			return productsGrid;

		}
		
		/*
		 * Render Image Path
		 */
		app.createImagePath = function(product){
			return config.url+'/'+product.dir_path+product.img_name;
		}
		
		/*
		 * Add to cart
		 */
		app.addtoCart = function(id,el,selAttribute){
			
			var productos = app.getProducts(),
			producto = grepObj(productos, function(e){ return e.pid == id; },true);
			
			if(undefined != producto){
				
				var cart = app.getCartProducts();
				var curProd = grep(cart.items, function(e){ return e.id == id; })
				addQty = 1;
				addedQty = 0;
				
				//list of variations in product.
				if(undefined != curProd){
					Object.keys(curProd).forEach(function(k){
						addedQty += curProd[k].added
					})
				}
				
				//check if product already exists in item and get total qty
				if(	(addedQty < producto.limit_qty && 
					(addedQty < producto.pro_limit_purchase || producto.pro_limit_purchase == 0)) 
					|| producto.unlimited_stock == 'Yes'
				)
				{
					
					//search if product exists for add
					app.searchProd(cart,producto.pid,parseInt(addQty),producto.pname,producto.price,app.createImagePath(producto),producto.limit_qty,producto.unlimited_stock,producto.pro_limit_purchase,selAttribute)
							
					//added processing class on button
					setclass('processing',el);
					setTimeout(function(){
						app.updatecart();
						removeclass('processing',el);
					},1000);
					
				}else{
					alert('You can not add more of this product')
				}
			}
			else{
				throw new Error('Oops! Something bad happens, try again later')
			}
		}
		
		/*
		 * Search product if exists in cart items
		 */
		app.searchProd = function(cart,id,addQty,name,price,img,available,unlimited_stock,pro_limit,selectedAttribute){
			
			// var selAttribute = {'Color':'Green','Size':'Small'};
			
			var attributeString = '';
			var attributeStringNames = '';
			var attributeMatch = '';
			if(typeof selectedAttribute === 'object'){
				for(var i in selectedAttribute){
					attributeString += i+'|'+selectedAttribute[i].id+','
					attributeStringNames += i+'|'+selectedAttribute[i].txt+','
				}
				
				attributeString = rtrim(attributeString);
				attributeStringNames = rtrim(attributeStringNames);
				attributeMatch  = escape(attributeString);
			}
			
			//If we pass a negative value to the amount, it is deducted from the cart
			var curProd = grep(cart.items, function(e){ return (e.id == id && e.attributeMatch == attributeMatch); },true)

			if(undefined != curProd && curProd != null){
				//The product already exists, we add one more to its quantity
				if(curProd.added < available || unlimited_stock == 'Yes'){
					curProd.added = parseInt(curProd.added + addQty)
				}else{
					alert('You can not add more of this product')
				}
				
			}else{
				var uniqueID = new Date().valueOf();
				available = (available < 1 || unlimited_stock == 'Yes')? '-1' : available;
				//But if we add it to the cart
				var prod = {
					id : id,
					cid : uniqueID,
					added : addQty,
					name : name,
					price : price,
					img : img,
					available : available,
					pro_limit : pro_limit,
					attribute : selectedAttribute,
					attributeString : attributeString,
					attributeStringNames : attributeStringNames,
					attributeMatch : attributeMatch
				}
				cart.items.push(prod)
				
			}
			app.setItems(cart);
			app.displayCart(false)
		}
		
		/*
		 * Render products on cart sidebar
		 */
		app.displayCart = function(hidetoggle){
			var cart = app.getCartProducts(),
			msg = '',
			total = 0
			totalqty = 0
			hiddenfields = ''

			if(undefined == cart || null == cart || cart == '' || cart.items.length == 0){
				items = 'Your cart is empty.';
				var empty = true;
			}else{
				var empty = false;
				var items = cart.items;
				items.forEach(function(n, key) {
				   total = total  + (n.added * n.price)
				   totalqty += parseInt(n.added)
				});
				
				var hiddenfields = [
					{'key':'cust_name', 'value': ''},
					{'key':'cust_lname', 'value': ''},
					{'key':'cust_email', 'value': ''},
					{'key':'cust_id', 'value': ''},
					{'key':'order_id', 'value': ''},
					{'key':'coupon_code', 'value': ''},
					{'key':'cust_phone', 'value': ''},
					{'key':'cust_company', 'value': ''},
					{'key':'cust_address', 'value': ''},
					{'key':'cust_address2', 'value': ''},
					{'key':'cust_city', 'value': ''},
					{'key':'cust_region', 'value': ''},
					{'key':'cust_zip', 'value': ''},
					{'key':'region_tax', 'value': ''},
					{'key':'switch-payment', 'value': 'invoice'},
					{'key':'amount', 'value': total},
					{'key':'payment_type', 'value': 'AUTH_CAPTURE'},
					{'key':'view', 'value': 'fullview'},
					{'key':'order-source', 'value': 'buybutton'}
				];
			}
			
			//default cart static object
			defaultData = defaultOpts.cart;
			
			var cartData = {
				'items': items,
				'total': total,
				'empty': empty,
				'hiddenfields': hiddenfields,
				'calcPrice': function() {
					var cp = this.price * this.added;
					return defaultData.sign + formatMoney(cp,2,'.',',')
				},
				'hidetoggle': function(){
					return (totalqty > 0) ? (hidetoggle)? hidetoggle : false : true;
				},
				'totalcount': totalqty,
				'formatTotal': function(){
					return this.sign + formatMoney(this.total,2,'.',',');
				}
			};
			
			var cartCData = Object.assign({config:config},defaultData, cartData);
			items = mustache.render($htmlStructure.cart,cartCData)
			
			return items;
		}
		
		/*
		 * Update cart sidebar
		 */
		app.updatecart = function(){
			var hidetoggle = (hasClass('embedcart-openframe',CartframeDIV))? true : false;
			var items = app.displayCart(hidetoggle);
			Cartframe.setcontent(items);
			Cartframe.reload();
		}
		
		//get total product qty from cart with product id
		app.getCartProductsQty = function(pid){
			var cart = app.getCartProducts();
			var relatedPrdcts = grep(cart.items, function(e){ return e.id == pid; })
			var addedQty = 0,prolimit = 0,avail = 0;
			
			//list of all variable products.
			if(undefined != relatedPrdcts){
				Object.keys(relatedPrdcts).forEach(function(k){
					addedQty += relatedPrdcts[k].added
					prolimit = relatedPrdcts[k].pro_limit
					avail = relatedPrdcts[k].available
				})
			}
			
			var qtyHave = {
				added : addedQty,
				limit : parseInt(prolimit),
				avail : parseInt(avail),
				pending: (avail-addedQty)
			};
			
			return qtyHave;
		}
		
		//set quantity automatically to maximum	
		app.maxQtyItem = function(that,pid,cid){
			
			var cart = app.getCartProducts(),
			curProd = grep(cart.items, function(e){ return e.cid == cid; },true)
			
			//update product on textbox change
			if(undefined != curProd){
				
				//get total product qty from cart
				var cpQty = app.getCartProductsQty(pid);
				
				var currentAdded = (parseInt(cpQty.added) - parseInt(curProd.added)) + parseInt(that.value);
				
				//check if value is empty or 0 in qty box
				if(that.value == '' || that.value == 0){
					that.value = 1;
				}
				else if(currentAdded > cpQty.limit && cpQty.limit > 0){
					alert('You can not add more of this product');
					that.value = (cpQty.limit - (parseInt(cpQty.added) - parseInt(curProd.added)));
				}
				else if(currentAdded > cpQty.avail && cpQty.avail > 0){
					alert('You can not add more of this product');
					that.value = (cpQty.avail - (parseInt(cpQty.added) - parseInt(curProd.added)));
				}
				
				//set value of added
				curProd.added = parseInt(that.value);
				app.setItems(cart)
				app.updatecart()
			}
			
		}
		
		//product and cart item id update quantity
		app.updateQtyItem = function(that,pid,cid,updatedQty,incre){
			
			//remove the cart item
			var cart = app.getCartProducts(),
			curProd = grep(cart.items, function(e){ return e.cid == cid; },true)
			
			//update cart
			curProd.added = updatedQty;
			
			//get product total qty
			var cpQty = app.getCartProductsQty(pid);
			
			/* 
			 * check if have qty to add and decrement
			 * check if product has limit for purchase in order 
			 */
			if( (cpQty.pending > 0 || !incre) &&
				curProd.added <= curProd.available && 
				(cpQty.added <= curProd.pro_limit || curProd.pro_limit == 0) || 
				curProd.available == '-1'
			){
				//check if qty not less than 0
				if(curProd.added > 0){
					app.setItems(cart)
					app.updatecart()
				}else{
					app.deleteProd(cid,true)
				}
			}
			else{
				//set max quantity if greater than Available quantity
				if(curProd.added > curProd.available){
					app.updatecart()
				}
				
				console.log('stock empty! :'+curProd.name);
			}
		}
		
		/*
		 * Delete product from cart
		 */
		app.delete = function(id){
			var cart = app.getCartProducts();
			var curProd = grep(cart.items, function(e){ return e.cid == id; },true)
			cart.items.splice(inArray(curProd, cart.items),1);
			app.setItems(cart)
			app.updatecart()
		}

		/*
		 * Delete product from cart with product id
		 */
		app.deleteProd = function(id,remove){
			if(undefined != id && id > 0){
				
				if(remove == true){
					app.delete(id)
				}else{
					var conf = confirm('Do you want to remove this product?')
					if(conf){
						app.delete(id)
					}
				}
				
			}
		}
		
		/*
		 * Checkout create order
		 */
		app.icheckOut = function(form){
			var formData = serialize(form);
			// console.log(formData);
			var checkbtn = form.getElementsByClassName('checkout_btn')[0];
			
			//added class on button
			setclass('processing',checkbtn);
			
			//load window directly and then open after click
			checkoutWindow = window.open('','checkout','width=800,height=600');
			
			var url = config.createUrl;
			ajaxRequest('POST',url,formData,true).then(function(data){
				// console.log(data.json);
				var responseData = JSON.parse(data.json);
				if(undefined != responseData){
					if(responseData.status == "Success"){
						
						//remove cart after success
						app.emptyCart();
						app.updatecart();
						
						//open invoice window to process order
						var windowURl = config.invoiceUrl+'?order_id='+responseData.order_id;
						// window.open(windowURl,'checkout','width=800,height=600');
						
						checkoutWindow.location = windowURl;
					}
					else{
						throw new Error(responseData.errors);
					}
				}
				else{
					throw new Error('Unable to create order!');
				}
			}).catch(function(error){
				console.log(error);
			});
			
			return false;
		}
		
		module.exports = app;
	});
	EmbedCartBuyClient = moduleAppend(EmbedCartClientCore);
	
	
	/**
	 * Dom events click on div or buttons
	 */
	var domeventCore = query(function(module){
		
		var dom = {};
		
		dom.hideframe = function(e,empty){
			if(!empty) removeclass('hidden',e);
			removeclass('embedcart-openframe',CartframeDIV);
		}
		
		dom.showframe = function(e){
			setclass('hidden',e);
			setclass('embedcart-openframe',CartframeDIV);
		}
		
		module.exports = dom;
	});
	DomEvent = moduleAppend(domeventCore);
	
		
	$scriptsTag = {};
	$scriptsTag.product = `
		function selectedVal(classes){
			var selectBoxes = document.getElementsByClassName(classes);
			var selectedBoth = 0;
			var selectedAttri = {};
			for(var i=0;i < selectBoxes.length;i++){
				var selectedIn = selectBoxes[i].selectedIndex;
				if(selectedIn != 0){
					selectedBoth += 1;
					selectedAttri[selectBoxes[i].name] = { 
						id: selectBoxes[i].options[selectedIn].value,
						txt: selectBoxes[i].options[selectedIn].text
					};
				}
			}
			
			if(selectBoxes.length != selectedBoth){
				return {error:'Select required attributes!'};
			}
			return selectedAttri;
		}
		function addToCart(p_id,that){
			var attriClass = "attributebox-"+p_id;
			var closeButton = "attributebox-"+p_id;
			var selectedattr = selectedVal(attriClass);
			// console.log(selectedattr); return false;
			if(undefined != selectedattr.error){
				alert(selectedattr.error);
			}
			else{
				parent.EmbedCartBuy.action.addtoCart(p_id,that,selectedattr);
				setTimeout(function(){
					if(Object.keys(selectedattr).length >0) 
						hideOptions(p_id);
				},1200);
			}
		}
		function addToCartVariation(p_id,that){
			var attrID = "atrributes-wrap-"+p_id;
			var el = document.getElementById(attrID);
			if(hasClass('hidden',el)){
				showOptions(p_id)
			}
			else{
				addToCart(p_id,that)
			}
		}
		function hasClass(cls,element) {
			return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
		}
		function showOptions(id){
			var attrID = "atrributes-wrap-"+id;
			var el = document.getElementById(attrID);
			el.classList.remove("hidden");
		}
		function hideOptions(id){
			var attrID = "atrributes-wrap-"+id;
			var el = document.getElementById(attrID);
			el.className += " hidden";
		}
	`;
	
	$scriptsTag.cart = `
		function maxQty(that,id,cid){
			parent.EmbedCartBuy.action.maxQtyItem(that,id,cid)
		}
		function updateQty(that,id,cid,avail,incre){
			if(incre){
				var qtyInput = that.previousElementSibling;
				var updatedQty = parseInt(qtyInput.value) + 1;
			}
			else{
				var qtyInput = that.nextElementSibling;
				var updatedQty = parseInt(qtyInput.value) - 1;
			}
			parent.EmbedCartBuy.action.updateQtyItem(that,id,cid,updatedQty,incre)
		}
		function isNumber(evt) {
			evt = (evt) ? evt : window.event;
			var charCode = (evt.which) ? evt.which : evt.keyCode;
			if (charCode > 31 && (charCode < 48 || charCode > 57)) {
				return false;
			}
			return true;
		}
		function showframe(that){
			parent.EmbedCartBuy.event.showframe(that)
		}
		function hideframe(empty){
			parent.EmbedCartBuy.event.hideframe(document.getElementById(\'carttoggle\'),empty);
		}
	`;

	
	//html structure for frames with mustache framework
	$htmlStructure = {};
	$htmlStructure.product = `
		<section class="{{classes.wrapper}}">
			{{#config.settings.image}}
				<span class="{{classes.imgContainer}}">
					<span class="{{classes.imgInner}}">
						<img src="{{img}}" alt="{{pname}}" class="{{classes.img}}">
					</span>
				</span>
			{{/config.settings.image}}
			<!--h5>Qty: <span class="{{classes.stock}}">{{qty}}</span></h5-->
			{{#config.settings.title}}<h2>{{pname}}</h2>{{/config.settings.title}}
			<aside class="{{classes.buttonWrapper}}">
				<p class="{{classes.price}} {{^config.settings.price}}hidden{{/config.settings.price}}">{{text.price}}: {{formatPrice}}</p>
				{{^hasAttributes}}
					<button class="{{classes.button}} prod-{{pid}}" onclick="addToCart({{pid}},this)">{{text.button}}</button>
				{{/hasAttributes}}
				{{#hasAttributes}}
					<button class="{{classes.button}} prod-{{pid}}" onclick="addToCartVariation({{pid}},this)">{{text.button}}</button>
				{{/hasAttributes}}
			</aside>
			{{#hasAttributes}}
				<div id="atrributes-wrap-{{pid}}" class="{{classes.attributeWrapper}} hidden">
					<div class="close-btn" onclick="hideOptions({{pid}})"></div>
					<div class="{{classes.attributeContainer}}">
						{{#attributesOption}}
							<select name="{{key}}" class="{{classes.attributeSel}} attributebox-{{pid}}">
								<option value="">{{key}}</option>
								{{#value}}
									<option value="{{aid}}">{{name}}</option>
								{{/value}}
							</select>
						{{/attributesOption}}
						<!--button class="{{classes.button}} prod-{{pid}}" onclick="addToCart({{pid}},this)">{{text.button}}</button-->
					</div>
				</div>
			{{/hasAttributes}}
		</section>`;
		
	$htmlStructure.cart = `
		<div id="carttoggle" class="{{classes.toggleBtn}} {{#hidetoggle}} hidden {{/hidetoggle}}" onclick="showframe(this)">
			<div class="{{classes.toggleCount}}">{{totalcount}}</div>
			<svg xmlns="http://www.w3.org/2000/svg" class="{{classes.toggleCartIcon}}" viewBox="0 0 25 25" enable-background="new 0 0 25 25"><g class="{{classes.toggleCartIconG}}"><path d="M24.6 3.6c-.3-.4-.8-.6-1.3-.6h-18.4l-.1-.5c-.3-1.5-1.7-1.5-2.5-1.5h-1.3c-.6 0-1 .4-1 1s.4 1 1 1h1.8l3 13.6c.2 1.2 1.3 2.4 2.5 2.4h12.7c.6 0 1-.4 1-1s-.4-1-1-1h-12.7c-.2 0-.5-.4-.6-.8l-.2-1.2h12.6c1.3 0 2.3-1.4 2.5-2.4l2.4-7.4v-.2c.1-.5-.1-1-.4-1.4zm-4 8.5v.2c-.1.3-.4.8-.5.8h-13l-1.8-8.1h17.6l-2.3 7.1z"></path><circle cx="9" cy="22" r="2"></circle><circle cx="19" cy="22" r="2"></circle></g></svg>
		</div>
		<section class="{{classes.cart}}">
			<form id="checkout" method="POST" onsubmit="return parent.EmbedCartBuy.action.icheckOut(this);">
				<div class="{{classes.crossIcon}}">
					<span class="{{classes.crossIconInner}}" onclick="hideframe({{empty}})"></span>
				</div>
				<aside style="display: block;">
					<div class="{{classes.carthead}}">
						<h1>{{text.heading}}</h1>
					</div>
					<div class="{{classes.cartcontent}}">
						{{^empty}}
							<div class="{{classes.allItemsWrap}}">
							{{#items}}
								<div class="{{classes.wrap}}">
									{{#config.settings.image}}
										<div class="{{classes.img}}">
											<img src="{{img}}">
										</div>
									{{/config.settings.image}}
									<div class="{{classes.title}}">
										<p>{{name}}</p>
										<span>{{attributeStringNames}}</span>
										<input type="hidden" name="products[{{id}}][0][price]" value="{{price}}">
										{{#attributeString}}
											<input type="hidden" name="products[{{id}}][0][attr_id]" value="{{attributeString}}">
										{{/attributeString}}
										<div class="{{classes.qtyWrap}}">
											<button class="{{classes.qtydecrement}}" type="button" onclick="updateQty(this,{{id}},{{cid}},{{available}},false)">
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M4 7h8v2H4z"></path></svg>
											</button>
											<input class="{{classes.qtyinput}}" type="text" min="0" value="{{added}}" name="products[{{id}}][0][qty]" onchange="maxQty(this,{{id}},{{cid}})" onkeypress="return isNumber(event)" autocomplete="off">
											<button class="{{classes.qtyincrement}}" type="button" onclick="updateQty(this,{{id}},{{cid}},{{available}},true)">
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M12 7H9V4H7v3H4v2h3v3h2V9h3z"></path></svg>
											</button>
										</div>
									</div>
									<div class="{{classes.price}}">{{calcPrice}}</div>
									<!--button class="remove" onclick="parent.EmbedCartBuy.action.deleteProd({{id}},false)">x</button-->
								</div>
							{{/items}}
							</div>
							<div class="{{classes.checkout}}">
								<p class="{{classes.checkoutTotal}}">{{text.subtotal}} <span>{{formatTotal}}</span></p>
								<button class="{{classes.checkoutBtn}}">{{text.checkout}}</button>
							</div>
							<span class="{{classes.hidden_fields}}">
								{{#hiddenfields}}
									<input type="hidden" name="{{key}}" value="{{value}}">
								{{/hiddenfields}}
							</span>
						{{/empty}}
						{{#empty}}
							{{items}}
						{{/empty}}
						<div style="clear:both"></div>
					</div>
				</aside>
			</form>
		</section>`;
	
	
	//Styles for frame
	$styleData = {};
	$styleData.product = '*,body{margin:0}h1,h2{font-weight:200}*{padding:0;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}body{font-size:16px;font-family:Arial,"Helvetica Neue",Helvetica,sans-serif}.product-grid img{width:auto;height:auto;max-width:100%;max-height:100%}.product-grid aside,button{width:100%}.product-grid{display:flex;flex-wrap:wrap;justify-content:center}.product-grid>section{align-items:center;display:flex;flex:1 1 0%;flex-direction:column;text-align:center;max-width:400px;position:relative;background:#fff;padding:1em;margin:.5em;border-radius:4px}.product-grid>section>p{flex-grow:1;margin-top:0}.product-grid ul{display:flex;justify-content:space-between}h1{color:#777380;font-size:35px}h2{font-size:16px;margin:10px 0;line-height:24px;flex-grow:1}.product-img-container{display:table;width:250px;border:1px solid #d1d1d1}.product-img-inner{display:table-cell;height:300px;vertical-align:middle}.hidden{display:none}.price,button{font-weight:700;outline:0;margin-bottom:10px}button{background:#{{settings.buttonColor}};border:0;border-radius:4px;cursor:pointer;color:#{{settings.buttonTxtColor}};font-size:13px;padding:1.1em 3em;text-transform:uppercase;display:block;position:relative;z-index:99}button:hover{box-shadow:inset 0 0 100px 100px rgba(0,0,0,.2)}button.processing{background:#07487a;pointer-events:none}button.btn.submit.processing::after{position:absolute;right:15px;content:"\u2713";font-size:17px;margin-top:-3px;background:url({{&spinner}}) center no-repeat;background-size:contain;color:transparent}.product-attribute-wrapper{position:absolute;width:100%;height:100%;top:0;background:rgba(255,255,255,.9)}.prod-attributes{position:absolute;top:50%;transform:translateY(-50%);width:100%}select.attribute-box{width:90%;margin-bottom:5px;padding:7px}.close-btn{background:url({{&closeIcon}}) no-repeat;background-size:contain;right:15px;top:15px;position:absolute;width:20px;height:20px;cursor:pointer;margin-top:15px}@media (max-width:1600px){.product-grid>section{max-width:250px}}@media (min-width:768px) and (max-width:1024px){.product-grid{display:inline-block;*display:inline}.product-grid>section{float:left;max-width:238px;min-height:494px}}@media (max-width:767px){.product-grid>section{max-width:100%;margin:auto}.product-grid{display:block}.prod-attributes{position:relative;top:42%;width:76%;margin:auto}.close-btn{right:46px}}';
	
	$styleData.cart = '*{box-sizing:border-box}body{font-size:14px;margin:0;font-family:Arial,"Helvetica Neue",Helvetica,sans-serif}.cart-heading{background-color:#{{settings.bgColor}};color:#fff;padding:9px 8px 9px 8px}.cart-heading h1{line-height:20px;font-size:18px;margin:0;font-weight:400}.cart-content{padding:15px 5px 15px 10px}.cart ul{list-style-type:none;padding:0}.price{font-weight:700;margin-bottom:10px}.cart aside{position:fixed;width:80%;height:100%;background:#fff;right:0;top:0;display:none;box-shadow:0 0 10px #ccc}.cart .toggle-wrap{position:fixed;cursor:pointer;float:left;z-index:9999;top:250px;right:0;-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.cart .toggle-bar{position:relative;display:block;height:75px;width:50px;border-radius:6px 0 0 6px;font-size:20px;color:#fff;text-align:center;padding-top:6px}.cart .toggle-wrap.active{top:5px}.cart .toggle-wrap.active .toggle-bar{background-color:transparent;background-image:url({{&closeIcon}});background-repeat:no-repeat;height:22px;width:22px;color:#a2a2a2;background-size:contain;right:8px;top:3px}.cart-wrap .prod-img img{max-width:100%}.cart-wrap{margin-top:20px;display:table;width:100%}.cart-wrap:first-child{margin-top:0}.cart-wrap .prod-img,.cart-wrap .prod-name,.cart-wrap .prod-price{display:table-cell;vertical-align:top}.cart-wrap .prod-img{width:15%}.cart-wrap .prod-name{width:52%;padding-left:10px}.cart-wrap .prod-name span{float:left;margin-top:5px}.cart-wrap .prod-name p{margin-bottom:0;margin-top:0;width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.embedcart-buy__quantity-container{margin-top:5px;float:left}.cart-wrap .prod-price{width:30%;text-align:right;vertical-align:middle;font-weight:700}.cart .checkout-box{position:absolute;bottom:0;width:100%;left:0;padding:10px;background:#fff}.cart .checkout-box .sub-t{margin-bottom:20px}.cart .checkout-box .sub-t span{float:right}.cart .ui-widget.ui-widget-content{width:60%}input.cart-qty{width:50%}.checkout-box button{background:#{{settings.buttonColor}};border:0;border-radius:4px;cursor:pointer;color:#{{settings.buttonTxtColor}};font-weight:700;font-size:13px;padding:1.1em 3em;text-transform:uppercase;display:block;width:100%}.checkout-box button:hover{box-shadow:inset 0 0 100px 100px rgba(0,0,0,.2)}.embedcart-buy__cart-toggle{position:fixed;top:68%;z-index:999;background-color:#{{settings.bgColor}};color:#fff;border-radius:3px 0 0 3px;padding:8px 10px;text-align:center;display:inline-block;min-width:12%;left:20px;margin-right:0;cursor:pointer;-webkit-transition:background 200ms ease;transition:background 200ms ease}.embedcart-buy__cart-toggle:hover{box-shadow:inset 0 0 100px 100px rgba(0,0,0,.2)}.embedcart-buy__icon-cart--side{height:20px;width:20px;fill:currentColor}button.remove{color:#c50707;background:white;border:1px solid #c50707;border-radius:4px;cursor:pointer}.embedcart-buy__quantity-decrement,.embedcart-buy__quantity-increment{border-radius:0}.embedcart-buy__quantity-decrement,.embedcart-buy__quantity-increment{color:#fff;display:block;height:30px;float:left;line-height:16px;width:26px;padding:0;background:#{{settings.buttonColor}};box-shadow:none;cursor:pointer;font-size:18px;text-align:center;border:1px solid #{{settings.buttonColor}};position:relative}.embedcart-buy__quantity-decrement svg,.embedcart-buy__quantity-increment svg{width:18px;height:18px;position:absolute;top:50%;left:50%;margin-top:-9px;margin-left:-8px;fill:#{{settings.buttonTxtColor}}}.embedcart-buy__quantity{display:block;margin:0;float:left;color:#000;width:45px;height:30px;font-size:16px;border:none;text-align:center;-moz-appearance:textfield;-webkit-appearance:none;display:inline-block;padding:0;border-radius:0;border-top:1px solid #d4d4d4;border-bottom:1px solid #d4d4d4}.hidden{display:none!important}.all-cart-items{overflow-y:auto;;float:left;height:100%;padding-bottom:180px}button.processing{background:#07487a;pointer-events:none}button.processing::after{position:absolute;right:20px;content:"\u2713";font-size:17px;margin-top:-5px;background:url({{& spinner}}) center no-repeat;background-size:contain;color:transparent}@media (max-width:320px){.cart aside{width:300px}.cart-wrap .prod-img>img{width:90%}}';
	
	//cart sidebar style main div
	var cartDivStyle = '#cartcontent{position: fixed;width: 420px;right: -350px;top: 0px;height: 100%;-webkit-transition: all 250ms cubic-bezier(0.165, 0.84, 0.44, 1);transition: all 250ms cubic-bezier(0.165, 0.84, 0.44, 1);z-index: 9999;}#cartcontent.embedcart-openframe{right: 0px;}';
	
	
	var defaultOpts  = {};
	var CartframeDIV = '';
	var Cartframe = '';
	var EmbedCartClient = function(configData){
		// console.log(configData);
		// console.log('Product loading!');
		
		//set configuration data
		setConfigOptions(configData);
		
		renderProducts().then(function(data){
			
			//set products from ajax request
			localStorage.setItem('embedcart-productos',data.json);
			
			//default options
			defaultOpts = {
				product: {
					sign: '$',
					layout: "vertical",
					classes: {
						wrapper: "product-wrapper",
						img: "product-img",
						imgContainer: "product-img-container",
						imgInner: "product-img-inner",
						button: "columns btn submit",
						buttonWrapper: "embedcart-buy__btn-wrapper",
						title: "embedcart-buy__product__title",
						attributeContainer: "prod-attributes",
						attributeWrapper: "product-attribute-wrapper",
						attributeSel: "attribute-box",
						price: "price"
					},
					text: {
						price: "Price",
						button: config.settings.buttonTxt,
						selectOption: "Select Option",
						outOfStock: "Out of stock",
						unavailable: "Unavailable"
					}
				},
				cart: {
					sign: '$',
					layout: "vertical",
					classes: {
						toggleBtn: 'is-sticky embedcart-buy__cart-toggle',
						toggleCount: 'embedcart-buy__cart-toggle__count',
						toggleCartIcon: 'embedcart-buy__icon-cart embedcart-buy__icon-cart--side',
						toggleCartIconG: 'embedcart-buy__icon-cart__group',
						cart: "cart",
						stock: "stock",
						crossIcon: 'toggle-wrap active',
						crossIconInner: 'toggle-bar',
						allItemsWrap: "all-cart-items",
						wrap: "cart-wrap",
						carthead: "cart-heading",
						cartcontent: "cart-content",
						img: "prod-img",
						title: "prod-name",
						price: "prod-price",
						qtyWrap: 'embedcart-buy__quantity-container',
						qtyinput: 'embedcart-buy__quantity embedcart-buy__cart-item_quantity-input',
						qtyincrement: 'embedcart-buy__quantity-increment',
						qtydecrement: 'embedcart-buy__quantity-decrement',
						checkout: 'checkout-box',
						checkoutTotal: 'sub-t',
						checkoutBtn: 'checkout_btn',
						hidden_fields: 'hidden-fields'
					},
					text: {
						heading: 'Cart',
						subtotal: "SUBTOTAL",
						checkout: "Checkout"
					}
				}
			};
			
			
			//products iframe
			Object.keys(config.products).forEach(function(pdivID) {
				//products data for Iframe
				var productsNode = document.getElementById(pdivID);
				var productsIframe = new createIframe(productsNode, {
					classes: 'product-data',
					stylesheet: mustache.render($styleData['product'],config),
					name: 'frame-product',
					scripts: $scriptsTag.product,
					htmlcontent: EmbedCartBuyClient.createProducts(config.products[pdivID]),
					width: "vertical" === defaultOpts.product.layout ? defaultOpts.product.width : null,
					fullheight: false
				}); 
				productsIframe.load();
			
				//reload products iframe
				window.onresize = function(event) {
					productsIframe.load();
				};
			
			});
			
			
			//create div for cart content sidebar
			CartframeDIV = document.createElement('div');
			CartframeDIV.setAttribute("id","cartcontent");
			document.body.appendChild(CartframeDIV);
			appendStyleTag(CartframeDIV,cartDivStyle);
			
			//cart config data
			Cartframe = new createIframe(CartframeDIV, {
				classes: 'cart-data',
				stylesheet: mustache.render($styleData['cart'],config),
				name: 'frame-cart',
				scripts: $scriptsTag.cart,
				htmlcontent: EmbedCartBuyClient.displayCart(false),
				width: "vertical" === defaultOpts.cart.layout ? defaultOpts.cart.width : null,
				fullheight: true
			});
			Cartframe.load();
			
			
		})
		.catch(function(error) {
			console.log('iframe: '+error);
		});
		
	};
	
	var client = {
		EmbedCartClient: EmbedCartClient,
		buildClient: function() {
			var element = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
			return new this.EmbedCartClient(element);
		}
	};
	
	module.client = client;
	module.action = EmbedCartBuyClient;
	module.event  = DomEvent;
	
    return module;
}());