/**
 * Carcasse - Build structured, modular and object-oriented JavaScript projects
 * 
 * @web <https://github.com/h2non/carcassejs>
 * @license GNU GPL 3 <http://mitlicense.com>
 *
 */

/**
 * @class Carcasse
 * @singleton
 */
(function(window) {
    
    "use strict";
    
    var global = window,
        objectPrototype = Object.prototype,
        toString = objectPrototype.toString,
        enumerables = true,
        Carcasse,
        enumerablesTest = { toString: 1 },
        emptyFn = function(){},
        i;

    if (typeof Carcasse !== 'object') {
        global.Carcasse = Carcasse = {};
    }

    Carcasse.global = global;

    for (i in enumerablesTest) {
        enumerables = null;
    }

    if (enumerables) {
        enumerables = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable',
                       'toLocaleString', 'toString', 'constructor'];
    }

    /**
     * An array containing extra enumerables for old browsers.
     * @property {String[]}
     */
    Carcasse.enumerables = enumerables;

    /**
     * Copies all the properties of config to the specified object.
     * Note that if recursive merging and cloning without referencing the original objects / arrays is needed, use
     * {@link Carcasse.Object#merge} instead.
     * @param {Object} object The receiver of the properties.
     * @param {Object} config The source of the properties.
     * @param {Object} [defaults] A different object that will also be applied for default values.
     * @return {Object} returns obj
     */
    Carcasse.apply = function (object, config, defaults) {
        if (defaults) {
            Carcasse.apply(object, defaults);
        }

        if (object && config && typeof config === 'object') {
            var i, j, k;

            for (i in config) {
                object[i] = config[i];
            }

            if (enumerables) {
                for (j = enumerables.length; j--;) {
                    k = enumerables[j];
                    if (config.hasOwnProperty(k)) {
                        object[k] = config[k];
                    }
                }
            }
        }

        return object;
    };

    Carcasse.buildSettings = Carcasse.apply({
        baseCSSPrefix: 'x-',
        scopeResetCSS: false
    }, Carcasse.buildSettings || {});

    Carcasse.apply(Carcasse, {
        /**
         * A reusable empty function
         */
        emptyFn: emptyFn,

        baseCSSPrefix: Carcasse.buildSettings.baseCSSPrefix,

        /**
         * Copies all the properties of config to object if they don't already exist.
         * @param {Object} object The receiver of the properties.
         * @param {Object} config The source of the properties.
         * @return {Object} returns obj
         */
        applyIf: function(object, config) {
            var property;

            if (object) {
                for (property in config) {
                    if (object[property] === undefined) {
                        object[property] = config[property];
                    }
                }
            }

            return object;
        },

        /**
         * Iterates either an array or an object. This method delegates to
         * {@link Carcasse.Array#each Carcasse.Array.each} if the given value is iterable, and {@link Carcasse.Object#each Carcasse.Object.each} otherwise.
         *
         * @param {Object/Array} object The object or array to be iterated.
         * @param {Function} fn The function to be called for each iteration. See and {@link Carcasse.Array#each Carcasse.Array.each} and
         * {@link Carcasse.Object#each Carcasse.Object.each} for detailed lists of arguments passed to this function depending on the given object
         * type that is being iterated.
         * @param {Object} scope (Optional) The scope (`this` reference) in which the specified function is executed.
         * Defaults to the object being iterated itself.
         */
        iterate: function(object, fn, scope) {
            if (Carcasse.isEmpty(object)) {
                return;
            }

            if (scope === undefined) {
                scope = object;
            }

            if (Carcasse.isIterable(object)) {
                Carcasse.Array.each.call(Carcasse.Array, object, fn, scope);
            }
            else {
                Carcasse.Object.each.call(Carcasse.Object, object, fn, scope);
            }
        }
    });

    // A full set of static methods to do type checking
    Carcasse.apply(Carcasse, {
        
                /**
         * This method deprecated. Use {@link Carcasse#define Carcasse.define} instead.
         * @method
         * @param {Function} superclass
         * @param {Object} overrides
         * @return {Function} The subclass constructor from the `overrides` parameter, or a generated one if not provided.
         * @deprecated 4.0.0 Please use {@link Carcasse#define Carcasse.define} instead
         */
        extend: function() {
            // inline overrides
            var objectConstructor = objectPrototype.constructor,
                inlineOverrides = function(o) {
                for (var m in o) {
                    if (!o.hasOwnProperty(m)) {
                        continue;
                    }
                    this[m] = o[m];
                }
            };

            return function(subclass, superclass, overrides) {
                // First we check if the user passed in just the superClass with overrides
                if (Carcasse.isObject(superclass)) {
                    overrides = superclass;
                    superclass = subclass;
                    subclass = overrides.constructor !== objectConstructor ? overrides.constructor : function() {
                        superclass.apply(this, arguments);
                    };
                }

                //<debug>
                if (!superclass) {
                    Carcasse.Error.raise({
                        sourceClass: 'Carcasse',
                        sourceMethod: 'extend',
                        msg: 'Attempting to extend from a class which has not been loaded on the page.'
                    });
                }
                //</debug>

                // We create a new temporary class
                var F = function() {},
                    subclassProto, superclassProto = superclass.prototype;

                F.prototype = superclassProto;
                subclassProto = subclass.prototype = new F();
                subclassProto.constructor = subclass;
                subclass.superclass = superclassProto;

                if (superclassProto.constructor === objectConstructor) {
                    superclassProto.constructor = superclass;
                }

                subclass.override = function(overrides) {
                    Carcasse.override(subclass, overrides);
                };

                subclassProto.override = inlineOverrides;
                subclassProto.proto = subclassProto;

                subclass.override(overrides);
                subclass.extend = function(o) {
                    return Carcasse.extend(subclass, o);
                };

                return subclass;
            };
        }(),

        /**
         * Proxy to {@link Carcasse.Base#override}. Please refer {@link Carcasse.Base#override} for further details.
         *
         * @param {Object} cls The class to override
         * @param {Object} overrides The properties to add to `origClass`. This should be specified as an object literal
         * containing one or more properties.
         * @method override
         * @deprecated 4.1.0 Please use {@link Carcasse#define Carcasse.define} instead.
         */
        override: function(cls, overrides) {
            if (cls.$isClass) {
                return cls.override(overrides);
            }
            else {
                Carcasse.apply(cls.prototype, overrides);
            }
        },

        /**
         * Returns the given value itself if it's not empty, as described in {@link Carcasse#isEmpty}; returns the default
         * value (second argument) otherwise.
         *
         * @param {Object} value The value to test.
         * @param {Object} defaultValue The value to return if the original value is empty.
         * @param {Boolean} [allowBlank=false] (optional) `true` to allow zero length strings to qualify as non-empty.
         * @return {Object} `value`, if non-empty, else `defaultValue`.
         */
        valueFrom: function(value, defaultValue, allowBlank){
            return Carcasse.isEmpty(value, allowBlank) ? defaultValue : value;
        },

        /**
         * Returns the type of the given variable in string format. List of possible values are:
         *
         * - `undefined`: If the given value is `undefined`
         * - `null`: If the given value is `null`
         * - `string`: If the given value is a string
         * - `number`: If the given value is a number
         * - `boolean`: If the given value is a boolean value
         * - `date`: If the given value is a `Date` object
         * - `function`: If the given value is a function reference
         * - `object`: If the given value is an object
         * - `array`: If the given value is an array
         * - `regexp`: If the given value is a regular expression
         * - `element`: If the given value is a DOM Element
         * - `textnode`: If the given value is a DOM text node and contains something other than whitespace
         * - `whitespace`: If the given value is a DOM text node and contains only whitespace
         *
         * @param {Object} value
         * @return {String}
         */
        typeOf: function(value) {
            if (value === null) {
                return 'null';
            }

            var type = typeof value;

            if (type === 'undefined' || type === 'string' || type === 'number' || type === 'boolean') {
                return type;
            }

            var typeToString = toString.call(value);

            switch(typeToString) {
                case '[object Array]':
                    return 'array';
                case '[object Date]':
                    return 'date';
                case '[object Boolean]':
                    return 'boolean';
                case '[object Number]':
                    return 'number';
                case '[object RegExp]':
                    return 'regexp';
            }

            if (type === 'function') {
                return 'function';
            }

            if (type === 'object') {
                if (value.nodeType !== undefined) {
                    if (value.nodeType === 3) {
                        return (/\S/).test(value.nodeValue) ? 'textnode' : 'whitespace';
                    }
                    else {
                        return 'element';
                    }
                }

                return 'object';
            }

            //<debug error>
            Carcasse.Error.raise({
                sourceClass: 'Carcasse',
                sourceMethod: 'typeOf',
                msg: 'Failed to determine the type of the specified value "' + value + '". This is most likely a bug.'
            });
            //</debug>
        },

        /**
         * Returns `true` if the passed value is empty, `false` otherwise. The value is deemed to be empty if it is either:
         *
         * - `null`
         * - `undefined`
         * - a zero-length array.
         * - a zero-length string (Unless the `allowEmptyString` parameter is set to `true`).
         *
         * @param {Object} value The value to test.
         * @param {Boolean} [allowEmptyString=false] (optional) `true` to allow empty strings.
         * @return {Boolean}
         */
        isEmpty: function(value, allowEmptyString) {
            return (value === null) || (value === undefined) || (!allowEmptyString ? value === '' : false) || (Carcasse.isArray(value) && value.length === 0);
        },

        /**
         * Returns `true` if the passed value is a JavaScript Array, `false` otherwise.
         *
         * @param {Object} target The target to test.
         * @return {Boolean}
         * @method
         */
        isArray: ('isArray' in Array) ? Array.isArray : function(value) {
            return toString.call(value) === '[object Array]';
        },

        /**
         * Returns `true` if the passed value is a JavaScript Date object, `false` otherwise.
         * @param {Object} object The object to test.
         * @return {Boolean}
         */
        isDate: function(value) {
            return toString.call(value) === '[object Date]';
        },

        /**
         * Returns `true` if the passed value is a JavaScript Object, `false` otherwise.
         * @param {Object} value The value to test.
         * @return {Boolean}
         * @method
         */
        isObject: (toString.call(null) === '[object Object]') ?
        function(value) {
            // check ownerDocument here as well to exclude DOM nodes
            return value !== null && value !== undefined && toString.call(value) === '[object Object]' && value.ownerDocument === undefined;
        } :
        function(value) {
            return toString.call(value) === '[object Object]';
        },

        /**
         * @private
         */
        isSimpleObject: function(value) {
            return value instanceof Object && value.constructor === Object;
        },
        /**
         * Returns `true` if the passed value is a JavaScript 'primitive', a string, number or Boolean.
         * @param {Object} value The value to test.
         * @return {Boolean}
         */
        isPrimitive: function(value) {
            var type = typeof value;

            return type === 'string' || type === 'number' || type === 'boolean';
        },

        /**
         * Returns `true` if the passed value is a JavaScript Function, `false` otherwise.
         * @param {Object} value The value to test.
         * @return {Boolean}
         * @method
         */
        isFunction:
        // Safari 3.x and 4.x returns 'function' for typeof <NodeList>, hence we need to fall back to using
        // Object.prorotype.toString (slower)
        (typeof document !== 'undefined' && typeof document.getElementsByTagName('body') === 'function') ? function(value) {
            return toString.call(value) === '[object Function]';
        } : function(value) {
            return typeof value === 'function';
        },

        /**
         * Returns `true` if the passed value is a number. Returns `false` for non-finite numbers.
         * @param {Object} value The value to test.
         * @return {Boolean}
         */
        isNumber: function(value) {
            return typeof value === 'number' && isFinite(value);
        },

        /**
         * Validates that a value is numeric.
         * @param {Object} value Examples: 1, '1', '2.34'
         * @return {Boolean} `true` if numeric, `false` otherwise.
         */
        isNumeric: function(value) {
            return !isNaN(parseFloat(value)) && isFinite(value);
        },

        /**
         * Returns `true` if the passed value is a string.
         * @param {Object} value The value to test.
         * @return {Boolean}
         */
        isString: function(value) {
            return typeof value === 'string';
        },

        /**
         * Returns `true` if the passed value is a Boolean.
         *
         * @param {Object} value The value to test.
         * @return {Boolean}
         */
        isBoolean: function(value) {
            return typeof value === 'boolean';
        },

        /**
         * Returns `true` if the passed value is an HTMLElement.
         * @param {Object} value The value to test.
         * @return {Boolean}
         */
        isElement: function(value) {
            return value ? value.nodeType === 1 : false;
        },

        /**
         * Returns `true` if the passed value is a TextNode.
         * @param {Object} value The value to test.
         * @return {Boolean}
         */
        isTextNode: function(value) {
            return value ? value.nodeName === "#text" : false;
        },

        /**
         * Returns `true` if the passed value is defined.
         * @param {Object} value The value to test.
         * @return {Boolean}
         */
        isDefined: function(value) {
            return typeof value !== 'undefined';
        },

        /**
         * Returns `true` if the passed value is iterable, `false` otherwise.
         * @param {Object} value The value to test.
         * @return {Boolean}
         */
        isIterable: function(value) {
            return (value && typeof value !== 'string') ? value.length !== undefined : false;
        }
    });

    Carcasse.apply(Carcasse, {

        /**
         * Clone almost any type of variable including array, object, DOM nodes and Date without keeping the old reference.
         * @param {Object} item The variable to clone.
         * @return {Object} clone
         */
        clone: function(item) {
            if (item === null || item === undefined) {
                return item;
            }

            // DOM nodes
            if (item.nodeType && item.cloneNode) {
                return item.cloneNode(true);
            }

            // Strings
            var type = toString.call(item);

            // Dates
            if (type === '[object Date]') {
                return new Date(item.getTime());
            }

            var i, j, k, clone, key;

            // Arrays
            if (type === '[object Array]') {
                i = item.length;

                clone = [];

                while (i--) {
                    clone[i] = Carcasse.clone(item[i]);
                }
            }
            // Objects
            else if (type === '[object Object]' && item.constructor === Object) {
                clone = {};

                for (key in item) {
                    clone[key] = Carcasse.clone(item[key]);
                }

                if (enumerables) {
                    for (j = enumerables.length; j--;) {
                        k = enumerables[j];
                        clone[k] = item[k];
                    }
                }
            }

            return clone || item;
        },

        /**
         * @private
         * Generate a unique reference of Carcasse in the global scope, useful for sandboxing.
         */
        getUniqueGlobalNamespace: function() {
            var uniqueGlobalNamespace = this.uniqueGlobalNamespace;

            if (uniqueGlobalNamespace === undefined) {
                var i = 0;

                do {
                    uniqueGlobalNamespace = 'CarcasseBox' + (++i);
                } while (Carcasse.global[uniqueGlobalNamespace] !== undefined);

                Carcasse.global[uniqueGlobalNamespace] = Carcasse;
                this.uniqueGlobalNamespace = uniqueGlobalNamespace;
            }

            return uniqueGlobalNamespace;
        },

        /**
         * @private
         */
        functionFactory: function() {
            var args = Array.prototype.slice.call(arguments),
                ln = args.length;

            if (ln > 0) {
                args[ln - 1] = 'var Carcasse=window.' + this.getUniqueGlobalNamespace() + ';' + args[ln - 1];
            }

            return Function.prototype.constructor.apply(Function.prototype, args);
        },

        /**
         * @private
         */
        globalEval: ('execScript' in global) ? function(code) {
            global.execScript(code)
        } : function(code) {
            (function(){
                eval(code);
            })();
        },

        //<feature logger>
        /**
         * @private
         * @property
         */
        Logger: {
            log: function(message, priority) {
                if ('console' in global) {
                    if (!priority || !(priority in global.console)) {
                        priority = 'log';
                    }
                    message = '[' + priority.toUpperCase() + '] ' + message;
                    global.console[priority](message);
                }
            },
            verbose: function(message) {
                this.log(message, 'verbose');
            },
            info: function(message) {
                this.log(message, 'info');
            },
            warn: function(message) {
                this.log(message, 'warn');
            },
            error: function(message) {
                throw new Error(message);
            },
            deprecate: function(message) {
                this.log(message, 'warn');
            }
        }
        //</feature>
    });

    /**
     * Old alias to {@link Carcasse#typeOf}.
     * @deprecated 4.0.0 Please use {@link Carcasse#typeOf} instead.
     * @method
     * @alias Carcasse#typeOf
     */
    Carcasse.type = Carcasse.typeOf;

})(typeof(module) === 'undefined' ? window : this);

//@tag foundation,core
//@define Carcasse.Version
//@require Carcasse

/**
 * @author Jacky Nguyen <jacky@sencha.com>
 * @docauthor Jacky Nguyen <jacky@sencha.com>
 * @class Carcasse.Version
 *
 * A utility class that wrap around a string version number and provide convenient
 * method to perform comparison. See also: {@link Carcasse.Version#compare compare}. Example:
 *
 *     var version = new Carcasse.Version('1.0.2beta');
 *     console.log("Version is " + version); // Version is 1.0.2beta
 *
 *     console.log(version.getMajor()); // 1
 *     console.log(version.getMinor()); // 0
 *     console.log(version.getPatch()); // 2
 *     console.log(version.getBuild()); // 0
 *     console.log(version.getRelease()); // beta
 *
 *     console.log(version.isGreaterThan('1.0.1')); // true
 *     console.log(version.isGreaterThan('1.0.2alpha')); // true
 *     console.log(version.isGreaterThan('1.0.2RC')); // false
 *     console.log(version.isGreaterThan('1.0.2')); // false
 *     console.log(version.isLessThan('1.0.2')); // true
 *
 *     console.log(version.match(1.0)); // true
 *     console.log(version.match('1.0.2')); // true
 */
(function(Carcasse) {

// Current core version
var version = '4.1.0', Version;
    Carcasse.Version = Version = Carcasse.extend(Object, {

        /**
         * Creates new Version object.
         * @param {String/Number} version The version number in the follow standard format: major[.minor[.patch[.build[release]]]]
         * Examples: 1.0 or 1.2.3beta or 1.2.3.4RC
         * @return {Carcasse.Version} this
         */
        constructor: function(version) {
            var toNumber = this.toNumber,
                parts, releaseStartIndex;

            if (version instanceof Version) {
                return version;
            }

            this.version = this.shortVersion = String(version).toLowerCase().replace(/_/g, '.').replace(/[\-+]/g, '');

            releaseStartIndex = this.version.search(/([^\d\.])/);

            if (releaseStartIndex !== -1) {
                this.release = this.version.substr(releaseStartIndex, version.length);
                this.shortVersion = this.version.substr(0, releaseStartIndex);
            }

            this.shortVersion = this.shortVersion.replace(/[^\d]/g, '');

            parts = this.version.split('.');

            this.major = toNumber(parts.shift());
            this.minor = toNumber(parts.shift());
            this.patch = toNumber(parts.shift());
            this.build = toNumber(parts.shift());

            return this;
        },

        /**
         * @param value
         * @return {Number}
         */
        toNumber: function(value) {
            value = parseInt(value || 0, 10);

            if (isNaN(value)) {
                value = 0;
            }

            return value;
        },

        /**
         * Override the native `toString()` method.
         * @private
         * @return {String} version
         */
        toString: function() {
            return this.version;
        },

        /**
         * Override the native `valueOf()` method.
         * @private
         * @return {String} version
         */
        valueOf: function() {
            return this.version;
        },

        /**
         * Returns the major component value.
         * @return {Number} major
         */
        getMajor: function() {
            return this.major || 0;
        },

        /**
         * Returns the minor component value.
         * @return {Number} minor
         */
        getMinor: function() {
            return this.minor || 0;
        },

        /**
         * Returns the patch component value.
         * @return {Number} patch
         */
        getPatch: function() {
            return this.patch || 0;
        },

        /**
         * Returns the build component value.
         * @return {Number} build
         */
        getBuild: function() {
            return this.build || 0;
        },

        /**
         * Returns the release component value.
         * @return {Number} release
         */
        getRelease: function() {
            return this.release || '';
        },

        /**
         * Returns whether this version if greater than the supplied argument.
         * @param {String/Number} target The version to compare with.
         * @return {Boolean} `true` if this version if greater than the target, `false` otherwise.
         */
        isGreaterThan: function(target) {
            return Version.compare(this.version, target) === 1;
        },

        /**
         * Returns whether this version if greater than or equal to the supplied argument.
         * @param {String/Number} target The version to compare with.
         * @return {Boolean} `true` if this version if greater than or equal to the target, `false` otherwise.
         */
        isGreaterThanOrEqual: function(target) {
            return Version.compare(this.version, target) >= 0;
        },

        /**
         * Returns whether this version if smaller than the supplied argument.
         * @param {String/Number} target The version to compare with.
         * @return {Boolean} `true` if this version if smaller than the target, `false` otherwise.
         */
        isLessThan: function(target) {
            return Version.compare(this.version, target) === -1;
        },

        /**
         * Returns whether this version if less than or equal to the supplied argument.
         * @param {String/Number} target The version to compare with.
         * @return {Boolean} `true` if this version if less than or equal to the target, `false` otherwise.
         */
        isLessThanOrEqual: function(target) {
            return Version.compare(this.version, target) <= 0;
        },

        /**
         * Returns whether this version equals to the supplied argument.
         * @param {String/Number} target The version to compare with.
         * @return {Boolean} `true` if this version equals to the target, `false` otherwise.
         */
        equals: function(target) {
            return Version.compare(this.version, target) === 0;
        },

        /**
         * Returns whether this version matches the supplied argument. Example:
         * 
         *     var version = new Carcasse.Version('1.0.2beta');
         *     console.log(version.match(1)); // true
         *     console.log(version.match(1.0)); // true
         *     console.log(version.match('1.0.2')); // true
         *     console.log(version.match('1.0.2RC')); // false
         * 
         * @param {String/Number} target The version to compare with.
         * @return {Boolean} `true` if this version matches the target, `false` otherwise.
         */
        match: function(target) {
            target = String(target);
            return this.version.substr(0, target.length) === target;
        },

        /**
         * Returns this format: [major, minor, patch, build, release]. Useful for comparison.
         * @return {Number[]}
         */
        toArray: function() {
            return [this.getMajor(), this.getMinor(), this.getPatch(), this.getBuild(), this.getRelease()];
        },

        /**
         * Returns shortVersion version without dots and release.
         * @return {String}
         */
        getShortVersion: function() {
            return this.shortVersion;
        },

        /**
         * Convenient alias to {@link Carcasse.Version#isGreaterThan isGreaterThan}
         * @param {String/Number} target
         * @return {Boolean}
         */
        gt: function() {
            return this.isGreaterThan.apply(this, arguments);
        },

        /**
         * Convenient alias to {@link Carcasse.Version#isLessThan isLessThan}
         * @param {String/Number} target
         * @return {Boolean}
         */
        lt: function() {
            return this.isLessThan.apply(this, arguments);
        },

        /**
         * Convenient alias to {@link Carcasse.Version#isGreaterThanOrEqual isGreaterThanOrEqual}
         * @param {String/Number} target
         * @return {Boolean}
         */
        gtEq: function() {
            return this.isGreaterThanOrEqual.apply(this, arguments);
        },

        /**
         * Convenient alias to {@link Carcasse.Version#isLessThanOrEqual isLessThanOrEqual}
         * @param {String/Number} target
         * @return {Boolean}
         */
        ltEq: function() {
            return this.isLessThanOrEqual.apply(this, arguments);
        }
    });

    Carcasse.apply(Version, {
        // @private
        releaseValueMap: {
            'dev': -6,
            'alpha': -5,
            'a': -5,
            'beta': -4,
            'b': -4,
            'rc': -3,
            '#': -2,
            'p': -1,
            'pl': -1
        },

        /**
         * Converts a version component to a comparable value.
         *
         * @static
         * @param {Object} value The value to convert
         * @return {Object}
         */
        getComponentValue: function(value) {
            return !value ? 0 : (isNaN(value) ? this.releaseValueMap[value] || value : parseInt(value, 10));
        },

        /**
         * Compare 2 specified versions, starting from left to right. If a part contains special version strings,
         * they are handled in the following order:
         * 'dev' < 'alpha' = 'a' < 'beta' = 'b' < 'RC' = 'rc' < '#' < 'pl' = 'p' < 'anything else'
         *
         * @static
         * @param {String} current The current version to compare to.
         * @param {String} target The target version to compare to.
         * @return {Number} Returns -1 if the current version is smaller than the target version, 1 if greater, and 0 if they're equivalent.
         */
        compare: function(current, target) {
            var currentValue, targetValue, i;

            current = new Version(current).toArray();
            target = new Version(target).toArray();

            for (i = 0; i < Math.max(current.length, target.length); i++) {
                currentValue = this.getComponentValue(current[i]);
                targetValue = this.getComponentValue(target[i]);

                if (currentValue < targetValue) {
                    return -1;
                } else if (currentValue > targetValue) {
                    return 1;
                }
            }

            return 0;
        }
    });

    Carcasse.apply(Carcasse, {
        /**
         * @private
         */
        versions: {},

        /**
         * @private
         */
        lastRegisteredVersion: null,

        /**
         * Set version number for the given package name.
         *
         * @param {String} packageName The package name, for example: 'core', 'touch', 'extjs'.
         * @param {String/Carcasse.Version} version The version, for example: '1.2.3alpha', '2.4.0-dev'.
         * @return {Carcasse}
         */
        setVersion: function(packageName, version) {
            Carcasse.versions[packageName] = new Version(version);
            Carcasse.lastRegisteredVersion = Carcasse.versions[packageName];

            return this;
        },

        /**
         * Get the version number of the supplied package name; will return the last registered version
         * (last `Carcasse.setVersion()` call) if there's no package name given.
         *
         * @param {String} packageName (Optional) The package name, for example: 'core', 'touch', 'extjs'.
         * @return {Carcasse.Version} The version.
         */
        getVersion: function(packageName) {
            if (packageName === undefined) {
                return Carcasse.lastRegisteredVersion;
            }

            return Carcasse.versions[packageName];
        },

        /**
         * Create a closure for deprecated code.
         *
         *     // This means Carcasse.oldMethod is only supported in 4.0.0beta and older.
         *     // If Carcasse.getVersion('extjs') returns a version that is later than '4.0.0beta', for example '4.0.0RC',
         *     // the closure will not be invoked
         *     Carcasse.deprecate('extjs', '4.0.0beta', function() {
         *         Carcasse.oldMethod = Carcasse.newMethod;
         *         // ...
         *     });
         *
         * @param {String} packageName The package name.
         * @param {String} since The last version before it's deprecated.
         * @param {Function} closure The callback function to be executed with the specified version is less than the current version.
         * @param {Object} scope The execution scope (`this`) if the closure
         */
        deprecate: function(packageName, since, closure, scope) {
            if (Version.compare(Carcasse.getVersion(packageName), since) < 1) {
                closure.call(scope);
            }
        }
    }); // End Versioning

    Carcasse.setVersion('core', version);

})();

//@tag foundation,core
//@define Carcasse.String
//@require Carcasse.Version

/**
 * @class Carcasse.String
 *
 * A collection of useful static methods to deal with strings.
 * @singleton
 */

Carcasse.String = {
    trimRegex: /^[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000]+|[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000]+$/g,
    escapeRe: /('|\\)/g,
    formatRe: /\{(\d+)\}/g,
    escapeRegexRe: /([-.*+?^${}()|[\]\/\\])/g,

    /**
     * Convert certain characters (&, <, >, and ") to their HTML character equivalents for literal display in web pages.
     * @param {String} value The string to encode.
     * @return {String} The encoded text.
     * @method
     */
    htmlEncode: (function() {
        var entities = {
            '&': '&amp;',
            '>': '&gt;',
            '<': '&lt;',
            '"': '&quot;'
        }, keys = [], p, regex;

        for (p in entities) {
            keys.push(p);
        }

        regex = new RegExp('(' + keys.join('|') + ')', 'g');

        return function(value) {
            return (!value) ? value : String(value).replace(regex, function(match, capture) {
                return entities[capture];
            });
        };
    })(),

    /**
     * Convert certain characters (&, <, >, and ") from their HTML character equivalents.
     * @param {String} value The string to decode.
     * @return {String} The decoded text.
     * @method
     */
    htmlDecode: (function() {
        var entities = {
            '&amp;': '&',
            '&gt;': '>',
            '&lt;': '<',
            '&quot;': '"'
        }, keys = [], p, regex;

        for (p in entities) {
            keys.push(p);
        }

        regex = new RegExp('(' + keys.join('|') + '|&#[0-9]{1,5};' + ')', 'g');

        return function(value) {
            return (!value) ? value : String(value).replace(regex, function(match, capture) {
                if (capture in entities) {
                    return entities[capture];
                } else {
                    return String.fromCharCode(parseInt(capture.substr(2), 10));
                }
            });
        };
    })(),

    /**
     * Appends content to the query string of a URL, handling logic for whether to place
     * a question mark or ampersand.
     * @param {String} url The URL to append to.
     * @param {String} string The content to append to the URL.
     * @return {String} The resulting URL.
     */
    urlAppend : function(url, string) {
        if (!Carcasse.isEmpty(string)) {
            return url + (url.indexOf('?') === -1 ? '?' : '&') + string;
        }

        return url;
    },

    /**
     * Trims whitespace from either end of a string, leaving spaces within the string intact.  Example:
     *
     *     @example
     *     var s = '  foo bar  ';
     *     alert('-' + s + '-'); // alerts "-  foo bar  -"
     *     alert('-' + Carcasse.String.trim(s) + '-'); // alerts "-foo bar-"
     *
     * @param {String} string The string to escape
     * @return {String} The trimmed string
     */
    trim: function(string) {
        return string.replace(Carcasse.String.trimRegex, "");
    },

    /**
     * Capitalize the given string.
     * @param {String} string
     * @return {String}
     */
    capitalize: function(string) {
        return string.charAt(0).toUpperCase() + string.substr(1);
    },

    /**
     * Truncate a string and add an ellipsis ('...') to the end if it exceeds the specified length.
     * @param {String} value The string to truncate.
     * @param {Number} length The maximum length to allow before truncating.
     * @param {Boolean} word `true` to try to find a common word break.
     * @return {String} The converted text.
     */
    ellipsis: function(value, len, word) {
        if (value && value.length > len) {
            if (word) {
                var vs = value.substr(0, len - 2),
                index = Math.max(vs.lastIndexOf(' '), vs.lastIndexOf('.'), vs.lastIndexOf('!'), vs.lastIndexOf('?'));
                if (index !== -1 && index >= (len - 15)) {
                    return vs.substr(0, index) + "...";
                }
            }
            return value.substr(0, len - 3) + "...";
        }
        return value;
    },

    /**
     * Escapes the passed string for use in a regular expression.
     * @param {String} string
     * @return {String}
     */
    escapeRegex: function(string) {
        return string.replace(Carcasse.String.escapeRegexRe, "\\$1");
    },

    /**
     * Escapes the passed string for ' and \.
     * @param {String} string The string to escape.
     * @return {String} The escaped string.
     */
    escape: function(string) {
        return string.replace(Carcasse.String.escapeRe, "\\$1");
    },

    /**
     * Utility function that allows you to easily switch a string between two alternating values.  The passed value
     * is compared to the current string, and if they are equal, the other value that was passed in is returned.  If
     * they are already different, the first value passed in is returned.  Note that this method returns the new value
     * but does not change the current string.
     *
     *     // alternate sort directions
     *     sort = Carcasse.String.toggle(sort, 'ASC', 'DESC');
     *
     *     // instead of conditional logic:
     *     sort = (sort == 'ASC' ? 'DESC' : 'ASC');
     *
     * @param {String} string The current string.
     * @param {String} value The value to compare to the current string.
     * @param {String} other The new value to use if the string already equals the first value passed in.
     * @return {String} The new value.
     */
    toggle: function(string, value, other) {
        return string === value ? other : value;
    },

    /**
     * Pads the left side of a string with a specified character.  This is especially useful
     * for normalizing number and date strings.  Example usage:
     *
     *     var s = Carcasse.String.leftPad('123', 5, '0');
     *     alert(s); // '00123'
     *
     * @param {String} string The original string.
     * @param {Number} size The total length of the output string.
     * @param {String} [character= ] (optional) The character with which to pad the original string (defaults to empty string " ").
     * @return {String} The padded string.
     */
    leftPad: function(string, size, character) {
        var result = String(string);
        character = character || " ";
        while (result.length < size) {
            result = character + result;
        }
        return result;
    },

    /**
     * Allows you to define a tokenized string and pass an arbitrary number of arguments to replace the tokens.  Each
     * token must be unique, and must increment in the format {0}, {1}, etc.  Example usage:
     *
     *     var cls = 'my-class',
     *         text = 'Some text';
     *     var s = Carcasse.String.format('<div class="{0}">{1}</div>', cls, text);
     *     alert(s); // '<div class="my-class">Some text</div>'
     *
     * @param {String} string The tokenized string to be formatted.
     * @param {String} value1 The value to replace token {0}.
     * @param {String} value2 Etc...
     * @return {String} The formatted string.
     */
    format: function(format) {
        var args = Carcasse.Array.toArray(arguments, 1);
        return format.replace(Carcasse.String.formatRe, function(m, i) {
            return args[i];
        });
    },

    /**
     * Returns a string with a specified number of repetitions a given string pattern.
     * The pattern be separated by a different string.
     *
     *     var s = Carcasse.String.repeat('---', 4); // '------------'
     *     var t = Carcasse.String.repeat('--', 3, '/'); // '--/--/--'
     *
     * @param {String} pattern The pattern to repeat.
     * @param {Number} count The number of times to repeat the pattern (may be 0).
     * @param {String} sep An option string to separate each pattern.
     */
    repeat: function(pattern, count, sep) {
        for (var buf = [], i = count; i--; ) {
            buf.push(pattern);
        }
        return buf.join(sep || '');
    }
};

/**
 * Old alias to {@link Carcasse.String#htmlEncode}.
 * @deprecated Use {@link Carcasse.String#htmlEncode} instead.
 * @method
 * @member Carcasse
 * @alias Carcasse.String#htmlEncode
 */
Carcasse.htmlEncode = Carcasse.String.htmlEncode;

/**
 * Old alias to {@link Carcasse.String#htmlDecode}.
 * @deprecated Use {@link Carcasse.String#htmlDecode} instead.
 * @method
 * @member Carcasse
 * @alias Carcasse.String#htmlDecode
 */
Carcasse.htmlDecode = Carcasse.String.htmlDecode;

/**
 * Old alias to {@link Carcasse.String#urlAppend}.
 * @deprecated Use {@link Carcasse.String#urlAppend} instead.
 * @method
 * @member Carcasse
 * @alias Carcasse.String#urlAppend
 */
Carcasse.urlAppend = Carcasse.String.urlAppend;

//@tag foundation,core
//@define Carcasse.Array
//@require Carcasse.String

/**
 * @class Carcasse.Array
 * @singleton
 * @author Jacky Nguyen <jacky@sencha.com>
 * @docauthor Jacky Nguyen <jacky@sencha.com>
 *
 * A set of useful static methods to deal with arrays; provide missing methods for older browsers.
 */
(function() {

    var arrayPrototype = Array.prototype,
        slice = arrayPrototype.slice,
        supportsSplice = function () {
            var array = [],
                lengthBefore,
                j = 20;

            if (!array.splice) {
                return false;
            }

            // This detects a bug in IE8 splice method:
            // see http://social.msdn.microsoft.com/Forums/en-US/iewebdevelopment/thread/6e946d03-e09f-4b22-a4dd-cd5e276bf05a/

            while (j--) {
                array.push("A");
            }

            array.splice(15, 0, "F", "F", "F", "F", "F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F");

            lengthBefore = array.length; //41
            array.splice(13, 0, "XXX"); // add one element

            if (lengthBefore+1 != array.length) {
                return false;
            }
            // end IE8 bug

            return true;
        }(),
        supportsForEach = 'forEach' in arrayPrototype,
        supportsMap = 'map' in arrayPrototype,
        supportsIndexOf = 'indexOf' in arrayPrototype,
        supportsEvery = 'every' in arrayPrototype,
        supportsSome = 'some' in arrayPrototype,
        supportsFilter = 'filter' in arrayPrototype,
        supportsSort = function() {
            var a = [1,2,3,4,5].sort(function(){ return 0; });
            return a[0] === 1 && a[1] === 2 && a[2] === 3 && a[3] === 4 && a[4] === 5;
        }(),
        supportsSliceOnNodeList = true,
        CarcasseArray;

    try {
        // IE 6 - 8 will throw an error when using Array.prototype.slice on NodeList
        if (typeof document !== 'undefined') {
            slice.call(document.getElementsByTagName('body'));
        }
    } catch (e) {
        supportsSliceOnNodeList = false;
    }

    function fixArrayIndex (array, index) {
        return (index < 0) ? Math.max(0, array.length + index)
                           : Math.min(array.length, index);
    }

    /*
    Does the same work as splice, but with a slightly more convenient signature. The splice
    method has bugs in IE8, so this is the implementation we use on that platform.

    The rippling of items in the array can be tricky. Consider two use cases:

                  index=2
                  removeCount=2
                 /=====\
        +---+---+---+---+---+---+---+---+
        | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
        +---+---+---+---+---+---+---+---+
                         /  \/  \/  \/  \
                        /   /\  /\  /\   \
                       /   /  \/  \/  \   +--------------------------+
                      /   /   /\  /\   +--------------------------+   \
                     /   /   /  \/  +--------------------------+   \   \
                    /   /   /   /+--------------------------+   \   \   \
                   /   /   /   /                             \   \   \   \
                  v   v   v   v                               v   v   v   v
        +---+---+---+---+---+---+       +---+---+---+---+---+---+---+---+---+
        | 0 | 1 | 4 | 5 | 6 | 7 |       | 0 | 1 | a | b | c | 4 | 5 | 6 | 7 |
        +---+---+---+---+---+---+       +---+---+---+---+---+---+---+---+---+
        A                               B        \=========/
                                                 insert=[a,b,c]

    In case A, it is obvious that copying of [4,5,6,7] must be left-to-right so
    that we don't end up with [0,1,6,7,6,7]. In case B, we have the opposite; we
    must go right-to-left or else we would end up with [0,1,a,b,c,4,4,4,4].
    */
    function replaceSim (array, index, removeCount, insert) {
        var add = insert ? insert.length : 0,
            length = array.length,
            pos = fixArrayIndex(array, index);

        // we try to use Array.push when we can for efficiency...
        if (pos === length) {
            if (add) {
                array.push.apply(array, insert);
            }
        } else {
            var remove = Math.min(removeCount, length - pos),
                tailOldPos = pos + remove,
                tailNewPos = tailOldPos + add - remove,
                tailCount = length - tailOldPos,
                lengthAfterRemove = length - remove,
                i;

            if (tailNewPos < tailOldPos) { // case A
                for (i = 0; i < tailCount; ++i) {
                    array[tailNewPos+i] = array[tailOldPos+i];
                }
            } else if (tailNewPos > tailOldPos) { // case B
                for (i = tailCount; i--; ) {
                    array[tailNewPos+i] = array[tailOldPos+i];
                }
            } // else, add == remove (nothing to do)

            if (add && pos === lengthAfterRemove) {
                array.length = lengthAfterRemove; // truncate array
                array.push.apply(array, insert);
            } else {
                array.length = lengthAfterRemove + add; // reserves space
                for (i = 0; i < add; ++i) {
                    array[pos+i] = insert[i];
                }
            }
        }

        return array;
    }

    function replaceNative (array, index, removeCount, insert) {
        if (insert && insert.length) {
            if (index < array.length) {
                array.splice.apply(array, [index, removeCount].concat(insert));
            } else {
                array.push.apply(array, insert);
            }
        } else {
            array.splice(index, removeCount);
        }
        return array;
    }

    function eraseSim (array, index, removeCount) {
        return replaceSim(array, index, removeCount);
    }

    function eraseNative (array, index, removeCount) {
        array.splice(index, removeCount);
        return array;
    }

    function spliceSim (array, index, removeCount) {
        var pos = fixArrayIndex(array, index),
            removed = array.slice(index, fixArrayIndex(array, pos+removeCount));

        if (arguments.length < 4) {
            replaceSim(array, pos, removeCount);
        } else {
            replaceSim(array, pos, removeCount, slice.call(arguments, 3));
        }

        return removed;
    }

    function spliceNative (array) {
        return array.splice.apply(array, slice.call(arguments, 1));
    }

    var erase = supportsSplice ? eraseNative : eraseSim,
        replace = supportsSplice ? replaceNative : replaceSim,
        splice = supportsSplice ? spliceNative : spliceSim;

    // NOTE: from here on, use erase, replace or splice (not native methods)...
    CarcasseArray = Carcasse.Array = {
        /**
         * Iterates an array or an iterable value and invoke the given callback function for each item.
         *
         *     var countries = ['Vietnam', 'Singapore', 'United States', 'Russia'];
         *
         *     Carcasse.Array.each(countries, function(name, index, countriesItSelf) {
         *         console.log(name);
         *     });
         *
         *     var sum = function() {
         *         var sum = 0;
         *
         *         Carcasse.Array.each(arguments, function(value) {
         *             sum += value;
         *         });
         *
         *         return sum;
         *     };
         *
         *     sum(1, 2, 3); // returns 6
         *
         * The iteration can be stopped by returning false in the function callback.
         *
         *     Carcasse.Array.each(countries, function(name, index, countriesItSelf) {
         *         if (name === 'Singapore') {
         *             return false; // break here
         *         }
         *     });
         *
         * {@link Carcasse#each Carcasse.each} is alias for {@link Carcasse.Array#each Carcasse.Array.each}
         *
         * @param {Array/NodeList/Object} iterable The value to be iterated. If this
         * argument is not iterable, the callback function is called once.
         * @param {Function} fn The callback function. If it returns `false`, the iteration stops and this method returns
         * the current `index`.
         * @param {Object} fn.item The item at the current `index` in the passed `array`
         * @param {Number} fn.index The current `index` within the `array`
         * @param {Array} fn.allItems The `array` itself which was passed as the first argument
         * @param {Boolean} fn.return Return false to stop iteration.
         * @param {Object} scope (Optional) The scope (`this` reference) in which the specified function is executed.
         * @param {Boolean} [reverse=false] (Optional) Reverse the iteration order (loop from the end to the beginning).
         * @return {Boolean} See description for the `fn` parameter.
         */
        each: function(array, fn, scope, reverse) {
            array = CarcasseArray.from(array);

            var i,
                ln = array.length;

            if (reverse !== true) {
                for (i = 0; i < ln; i++) {
                    if (fn.call(scope || array[i], array[i], i, array) === false) {
                        return i;
                    }
                }
            }
            else {
                for (i = ln - 1; i > -1; i--) {
                    if (fn.call(scope || array[i], array[i], i, array) === false) {
                        return i;
                    }
                }
            }

            return true;
        },

        /**
         * Iterates an array and invoke the given callback function for each item. Note that this will simply
         * delegate to the native `Array.prototype.forEach` method if supported. It doesn't support stopping the
         * iteration by returning `false` in the callback function like {@link Carcasse.Array#each}. However, performance
         * could be much better in modern browsers comparing with {@link Carcasse.Array#each}
         *
         * @param {Array} array The array to iterate.
         * @param {Function} fn The callback function.
         * @param {Object} fn.item The item at the current `index` in the passed `array`.
         * @param {Number} fn.index The current `index` within the `array`.
         * @param {Array}  fn.allItems The `array` itself which was passed as the first argument.
         * @param {Object} scope (Optional) The execution scope (`this`) in which the specified function is executed.
         */
        forEach: supportsForEach ? function(array, fn, scope) {
                return array.forEach(fn, scope);
        } : function(array, fn, scope) {
            var i = 0,
                ln = array.length;

            for (; i < ln; i++) {
                fn.call(scope, array[i], i, array);
            }
        },

        /**
         * Get the index of the provided `item` in the given `array`, a supplement for the
         * missing arrayPrototype.indexOf in Internet Explorer.
         *
         * @param {Array} array The array to check.
         * @param {Object} item The item to look for.
         * @param {Number} from (Optional) The index at which to begin the search.
         * @return {Number} The index of item in the array (or -1 if it is not found).
         */
        indexOf: (supportsIndexOf) ? function(array, item, from) {
            return array.indexOf(item, from);
        } : function(array, item, from) {
            var i, length = array.length;

            for (i = (from < 0) ? Math.max(0, length + from) : from || 0; i < length; i++) {
                if (array[i] === item) {
                    return i;
                }
            }

            return -1;
        },

        /**
         * Checks whether or not the given `array` contains the specified `item`.
         *
         * @param {Array} array The array to check.
         * @param {Object} item The item to look for.
         * @return {Boolean} `true` if the array contains the item, `false` otherwise.
         */
        contains: supportsIndexOf ? function(array, item) {
            return array.indexOf(item) !== -1;
        } : function(array, item) {
            var i, ln;

            for (i = 0, ln = array.length; i < ln; i++) {
                if (array[i] === item) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Converts any iterable (numeric indices and a length property) into a true array.
         *
         *     function test() {
         *         var args = Carcasse.Array.toArray(arguments),
         *             fromSecondToLastArgs = Carcasse.Array.toArray(arguments, 1);
         *
         *         alert(args.join(' '));
         *         alert(fromSecondToLastArgs.join(' '));
         *     }
         *
         *     test('just', 'testing', 'here'); // alerts 'just testing here';
         *                                      // alerts 'testing here';
         *
         *     Carcasse.Array.toArray(document.getElementsByTagName('div')); // will convert the NodeList into an array
         *     Carcasse.Array.toArray('splitted'); // returns ['s', 'p', 'l', 'i', 't', 't', 'e', 'd']
         *     Carcasse.Array.toArray('splitted', 0, 3); // returns ['s', 'p', 'l', 'i']
         *
         * {@link Carcasse#toArray Carcasse.toArray} is alias for {@link Carcasse.Array#toArray Carcasse.Array.toArray}
         *
         * @param {Object} iterable the iterable object to be turned into a true Array.
         * @param {Number} [start=0] (Optional) a zero-based index that specifies the start of extraction.
         * @param {Number} [end=-1] (Optional) a zero-based index that specifies the end of extraction.
         * @return {Array}
         */
        toArray: function(iterable, start, end){
            if (!iterable || !iterable.length) {
                return [];
            }

            if (typeof iterable === 'string') {
                iterable = iterable.split('');
            }

            if (supportsSliceOnNodeList) {
                return slice.call(iterable, start || 0, end || iterable.length);
            }

            var array = [],
                i;

            start = start || 0;
            end = end ? ((end < 0) ? iterable.length + end : end) : iterable.length;

            for (i = start; i < end; i++) {
                array.push(iterable[i]);
            }

            return array;
        },

        /**
         * Plucks the value of a property from each item in the Array. Example:
         *
         *     Carcasse.Array.pluck(Carcasse.query("p"), "className"); // [el1.className, el2.className, ..., elN.className]
         *
         * @param {Array/NodeList} array The Array of items to pluck the value from.
         * @param {String} propertyName The property name to pluck from each element.
         * @return {Array} The value from each item in the Array.
         */
        pluck: function(array, propertyName) {
            var ret = [],
                i, ln, item;

            for (i = 0, ln = array.length; i < ln; i++) {
                item = array[i];

                ret.push(item[propertyName]);
            }

            return ret;
        },

        /**
         * Creates a new array with the results of calling a provided function on every element in this array.
         *
         * @param {Array} array
         * @param {Function} fn Callback function for each item.
         * @param {Object} scope Callback function scope.
         * @return {Array} results
         */
        map: supportsMap ? function(array, fn, scope) {
            return array.map(fn, scope);
        } : function(array, fn, scope) {
            var results = [],
                i = 0,
                len = array.length;

            for (; i < len; i++) {
                results[i] = fn.call(scope, array[i], i, array);
            }

            return results;
        },

        /**
         * Executes the specified function for each array element until the function returns a falsy value.
         * If such an item is found, the function will return `false` immediately.
         * Otherwise, it will return `true`.
         *
         * @param {Array} array
         * @param {Function} fn Callback function for each item.
         * @param {Object} scope Callback function scope.
         * @return {Boolean} `true` if no `false` value is returned by the callback function.
         */
        every: function(array, fn, scope) {
            //<debug>
            if (!fn) {
                Carcasse.Error.raise('Carcasse.Array.every must have a callback function passed as second argument.');
            }
            //</debug>
            if (supportsEvery) {
                return array.every(fn, scope);
            }

            var i = 0,
                ln = array.length;

            for (; i < ln; ++i) {
                if (!fn.call(scope, array[i], i, array)) {
                    return false;
                }
            }

            return true;
        },

        /**
         * Executes the specified function for each array element until the function returns a truthy value.
         * If such an item is found, the function will return `true` immediately. Otherwise, it will return `false`.
         *
         * @param {Array} array
         * @param {Function} fn Callback function for each item.
         * @param {Object} scope Callback function scope.
         * @return {Boolean} `true` if the callback function returns a truthy value.
         */
        some: function(array, fn, scope) {
            //<debug>
            if (!fn) {
                Carcasse.Error.raise('Carcasse.Array.some must have a callback function passed as second argument.');
            }
            //</debug>
            if (supportsSome) {
                return array.some(fn, scope);
            }

            var i = 0,
                ln = array.length;

            for (; i < ln; ++i) {
                if (fn.call(scope, array[i], i, array)) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Filter through an array and remove empty item as defined in {@link Carcasse#isEmpty Carcasse.isEmpty}.
         *
         * See {@link Carcasse.Array#filter}
         *
         * @param {Array} array
         * @return {Array} results
         */
        clean: function(array) {
            var results = [],
                i = 0,
                ln = array.length,
                item;

            for (; i < ln; i++) {
                item = array[i];

                if (!Carcasse.isEmpty(item)) {
                    results.push(item);
                }
            }

            return results;
        },

        /**
         * Returns a new array with unique items.
         *
         * @param {Array} array
         * @return {Array} results
         */
        unique: function(array) {
            var clone = [],
                i = 0,
                ln = array.length,
                item;

            for (; i < ln; i++) {
                item = array[i];

                if (CarcasseArray.indexOf(clone, item) === -1) {
                    clone.push(item);
                }
            }

            return clone;
        },

        /**
         * Creates a new array with all of the elements of this array for which
         * the provided filtering function returns `true`.
         *
         * @param {Array} array
         * @param {Function} fn Callback function for each item.
         * @param {Object} scope Callback function scope.
         * @return {Array} results
         */
        filter: function(array, fn, scope) {
            if (supportsFilter) {
                return array.filter(fn, scope);
            }

            var results = [],
                i = 0,
                ln = array.length;

            for (; i < ln; i++) {
                if (fn.call(scope, array[i], i, array)) {
                    results.push(array[i]);
                }
            }

            return results;
        },

        /**
         * Converts a value to an array if it's not already an array; returns:
         *
         * - An empty array if given value is `undefined` or `null`
         * - Itself if given value is already an array
         * - An array copy if given value is {@link Carcasse#isIterable iterable} (arguments, NodeList and alike)
         * - An array with one item which is the given value, otherwise
         *
         * @param {Object} value The value to convert to an array if it's not already is an array.
         * @param {Boolean} [newReference=false] (Optional) `true` to clone the given array and return a new reference if necessary.
         * @return {Array} array
         */
        from: function(value, newReference) {
            if (value === undefined || value === null) {
                return [];
            }

            if (Carcasse.isArray(value)) {
                return (newReference) ? slice.call(value) : value;
            }

            if (value && value.length !== undefined && typeof value !== 'string') {
                return CarcasseArray.toArray(value);
            }

            return [value];
        },

        /**
         * Removes the specified item from the array if it exists.
         *
         * @param {Array} array The array.
         * @param {Object} item The item to remove.
         * @return {Array} The passed array itself.
         */
        remove: function(array, item) {
            var index = CarcasseArray.indexOf(array, item);

            if (index !== -1) {
                erase(array, index, 1);
            }

            return array;
        },

        /**
         * Push an item into the array only if the array doesn't contain it yet.
         *
         * @param {Array} array The array.
         * @param {Object} item The item to include.
         */
        include: function(array, item) {
            if (!CarcasseArray.contains(array, item)) {
                array.push(item);
            }
        },

        /**
         * Clone a flat array without referencing the previous one. Note that this is different
         * from `Carcasse.clone` since it doesn't handle recursive cloning. It's simply a convenient, easy-to-remember method
         * for `Array.prototype.slice.call(array)`.
         *
         * @param {Array} array The array
         * @return {Array} The clone array
         */
        clone: function(array) {
            return slice.call(array);
        },

        /**
         * Merge multiple arrays into one with unique items.
         *
         * {@link Carcasse.Array#union} is alias for {@link Carcasse.Array#merge}
         *
         * @param {Array} array1
         * @param {Array} array2
         * @param {Array} etc
         * @return {Array} merged
         */
        merge: function() {
            var args = slice.call(arguments),
                array = [],
                i, ln;

            for (i = 0, ln = args.length; i < ln; i++) {
                array = array.concat(args[i]);
            }

            return CarcasseArray.unique(array);
        },

        /**
         * Merge multiple arrays into one with unique items that exist in all of the arrays.
         *
         * @param {Array} array1
         * @param {Array} array2
         * @param {Array} etc
         * @return {Array} intersect
         */
        intersect: function() {
            var intersect = [],
                arrays = slice.call(arguments),
                i, j, k, minArray, array, x, y, ln, arraysLn, arrayLn;

            if (!arrays.length) {
                return intersect;
            }

            // Find the smallest array
            for (i = x = 0,ln = arrays.length; i < ln,array = arrays[i]; i++) {
                if (!minArray || array.length < minArray.length) {
                    minArray = array;
                    x = i;
                }
            }

            minArray = CarcasseArray.unique(minArray);
            erase(arrays, x, 1);

            // Use the smallest unique'd array as the anchor loop. If the other array(s) do contain
            // an item in the small array, we're likely to find it before reaching the end
            // of the inner loop and can terminate the search early.
            for (i = 0,ln = minArray.length; i < ln,x = minArray[i]; i++) {
                var count = 0;

                for (j = 0,arraysLn = arrays.length; j < arraysLn,array = arrays[j]; j++) {
                    for (k = 0,arrayLn = array.length; k < arrayLn,y = array[k]; k++) {
                        if (x === y) {
                            count++;
                            break;
                        }
                    }
                }

                if (count === arraysLn) {
                    intersect.push(x);
                }
            }

            return intersect;
        },

        /**
         * Perform a set difference A-B by subtracting all items in array B from array A.
         *
         * @param {Array} arrayA
         * @param {Array} arrayB
         * @return {Array} difference
         */
        difference: function(arrayA, arrayB) {
            var clone = slice.call(arrayA),
                ln = clone.length,
                i, j, lnB;

            for (i = 0,lnB = arrayB.length; i < lnB; i++) {
                for (j = 0; j < ln; j++) {
                    if (clone[j] === arrayB[i]) {
                        erase(clone, j, 1);
                        j--;
                        ln--;
                    }
                }
            }

            return clone;
        },

        /**
         * Returns a shallow copy of a part of an array. This is equivalent to the native
         * call `Array.prototype.slice.call(array, begin, end)`. This is often used when "array"
         * is "arguments" since the arguments object does not supply a slice method but can
         * be the context object to `Array.prototype.slice()`.
         *
         * @param {Array} array The array (or arguments object).
         * @param {Number} begin The index at which to begin. Negative values are offsets from
         * the end of the array.
         * @param {Number} end The index at which to end. The copied items do not include
         * end. Negative values are offsets from the end of the array. If end is omitted,
         * all items up to the end of the array are copied.
         * @return {Array} The copied piece of the array.
         */
        slice: function(array, begin, end) {
            return slice.call(array, begin, end);
        },

        /**
         * Sorts the elements of an Array.
         * By default, this method sorts the elements alphabetically and ascending.
         *
         * @param {Array} array The array to sort.
         * @param {Function} sortFn (optional) The comparison function.
         * @return {Array} The sorted array.
         */
        sort: function(array, sortFn) {
            if (supportsSort) {
                if (sortFn) {
                    return array.sort(sortFn);
                } else {
                    return array.sort();
                }
            }

            var length = array.length,
                i = 0,
                comparison,
                j, min, tmp;

            for (; i < length; i++) {
                min = i;
                for (j = i + 1; j < length; j++) {
                    if (sortFn) {
                        comparison = sortFn(array[j], array[min]);
                        if (comparison < 0) {
                            min = j;
                        }
                    } else if (array[j] < array[min]) {
                        min = j;
                    }
                }
                if (min !== i) {
                    tmp = array[i];
                    array[i] = array[min];
                    array[min] = tmp;
                }
            }

            return array;
        },

        /**
         * Recursively flattens into 1-d Array. Injects Arrays inline.
         *
         * @param {Array} array The array to flatten
         * @return {Array} The 1-d array.
         */
        flatten: function(array) {
            var worker = [];

            function rFlatten(a) {
                var i, ln, v;

                for (i = 0, ln = a.length; i < ln; i++) {
                    v = a[i];

                    if (Carcasse.isArray(v)) {
                        rFlatten(v);
                    } else {
                        worker.push(v);
                    }
                }

                return worker;
            }

            return rFlatten(array);
        },

        /**
         * Returns the minimum value in the Array.
         *
         * @param {Array/NodeList} array The Array from which to select the minimum value.
         * @param {Function} comparisonFn (optional) a function to perform the comparison which determines minimization.
         * If omitted the "<" operator will be used.
         * __Note:__ gt = 1; eq = 0; lt = -1
         * @return {Object} minValue The minimum value.
         */
        min: function(array, comparisonFn) {
            var min = array[0],
                i, ln, item;

            for (i = 0, ln = array.length; i < ln; i++) {
                item = array[i];

                if (comparisonFn) {
                    if (comparisonFn(min, item) === 1) {
                        min = item;
                    }
                }
                else {
                    if (item < min) {
                        min = item;
                    }
                }
            }

            return min;
        },

        /**
         * Returns the maximum value in the Array.
         *
         * @param {Array/NodeList} array The Array from which to select the maximum value.
         * @param {Function} comparisonFn (optional) a function to perform the comparison which determines maximization.
         * If omitted the ">" operator will be used.
         * __Note:__ gt = 1; eq = 0; lt = -1
         * @return {Object} maxValue The maximum value
         */
        max: function(array, comparisonFn) {
            var max = array[0],
                i, ln, item;

            for (i = 0, ln = array.length; i < ln; i++) {
                item = array[i];

                if (comparisonFn) {
                    if (comparisonFn(max, item) === -1) {
                        max = item;
                    }
                }
                else {
                    if (item > max) {
                        max = item;
                    }
                }
            }

            return max;
        },

        /**
         * Calculates the mean of all items in the array.
         *
         * @param {Array} array The Array to calculate the mean value of.
         * @return {Number} The mean.
         */
        mean: function(array) {
            return array.length > 0 ? CarcasseArray.sum(array) / array.length : undefined;
        },

        /**
         * Calculates the sum of all items in the given array.
         *
         * @param {Array} array The Array to calculate the sum value of.
         * @return {Number} The sum.
         */
        sum: function(array) {
            var sum = 0,
                i, ln, item;

            for (i = 0,ln = array.length; i < ln; i++) {
                item = array[i];

                sum += item;
            }

            return sum;
        },

        //<debug>
        _replaceSim: replaceSim, // for unit testing
        _spliceSim: spliceSim,
        //</debug>

        /**
         * Removes items from an array. This is functionally equivalent to the splice method
         * of Array, but works around bugs in IE8's splice method and does not copy the
         * removed elements in order to return them (because very often they are ignored).
         *
         * @param {Array} array The Array on which to replace.
         * @param {Number} index The index in the array at which to operate.
         * @param {Number} removeCount The number of items to remove at index.
         * @return {Array} The array passed.
         * @method
         */
        erase: erase,

        /**
         * Inserts items in to an array.
         *
         * @param {Array} array The Array on which to replace.
         * @param {Number} index The index in the array at which to operate.
         * @param {Array} items The array of items to insert at index.
         * @return {Array} The array passed.
         */
        insert: function (array, index, items) {
            return replace(array, index, 0, items);
        },

        /**
         * Replaces items in an array. This is functionally equivalent to the splice method
         * of Array, but works around bugs in IE8's splice method and is often more convenient
         * to call because it accepts an array of items to insert rather than use a variadic
         * argument list.
         *
         * @param {Array} array The Array on which to replace.
         * @param {Number} index The index in the array at which to operate.
         * @param {Number} removeCount The number of items to remove at index (can be 0).
         * @param {Array} insert (optional) An array of items to insert at index.
         * @return {Array} The array passed.
         * @method
         */
        replace: replace,

        /**
         * Replaces items in an array. This is equivalent to the splice method of Array, but
         * works around bugs in IE8's splice method. The signature is exactly the same as the
         * splice method except that the array is the first argument. All arguments following
         * removeCount are inserted in the array at index.
         *
         * @param {Array} array The Array on which to replace.
         * @param {Number} index The index in the array at which to operate.
         * @param {Number} removeCount The number of items to remove at index (can be 0).
         * @return {Array} An array containing the removed items.
         * @method
         */
        splice: splice
    };

    /**
     * @method
     * @member Carcasse
     * @alias Carcasse.Array#each
     */
    Carcasse.each = CarcasseArray.each;

    /**
     * @method
     * @member Carcasse.Array
     * @alias Carcasse.Array#merge
     */
    CarcasseArray.union = CarcasseArray.merge;

    /**
     * Old alias to {@link Carcasse.Array#min}
     * @deprecated 4.0.0 Please use {@link Carcasse.Array#min} instead
     * @method
     * @member Carcasse
     * @alias Carcasse.Array#min
     */
    Carcasse.min = CarcasseArray.min;

    /**
     * Old alias to {@link Carcasse.Array#max}
     * @deprecated 4.0.0 Please use {@link Carcasse.Array#max} instead
     * @method
     * @member Carcasse
     * @alias Carcasse.Array#max
     */
    Carcasse.max = CarcasseArray.max;

    /**
     * Old alias to {@link Carcasse.Array#sum}
     * @deprecated 4.0.0 Please use {@link Carcasse.Array#sum} instead
     * @method
     * @member Carcasse
     * @alias Carcasse.Array#sum
     */
    Carcasse.sum = CarcasseArray.sum;

    /**
     * Old alias to {@link Carcasse.Array#mean}
     * @deprecated 4.0.0 Please use {@link Carcasse.Array#mean} instead
     * @method
     * @member Carcasse
     * @alias Carcasse.Array#mean
     */
    Carcasse.mean = CarcasseArray.mean;

    /**
     * Old alias to {@link Carcasse.Array#flatten}
     * @deprecated 4.0.0 Please use {@link Carcasse.Array#flatten} instead
     * @method
     * @member Carcasse
     * @alias Carcasse.Array#flatten
     */
    Carcasse.flatten = CarcasseArray.flatten;

    /**
     * Old alias to {@link Carcasse.Array#clean}
     * @deprecated 4.0.0 Please use {@link Carcasse.Array#clean} instead
     * @method
     * @member Carcasse
     * @alias Carcasse.Array#clean
     */
    Carcasse.clean = CarcasseArray.clean;

    /**
     * Old alias to {@link Carcasse.Array#unique}
     * @deprecated 4.0.0 Please use {@link Carcasse.Array#unique} instead
     * @method
     * @member Carcasse
     * @alias Carcasse.Array#unique
     */
    Carcasse.unique = CarcasseArray.unique;

    /**
     * Old alias to {@link Carcasse.Array#pluck Carcasse.Array.pluck}
     * @deprecated 4.0.0 Please use {@link Carcasse.Array#pluck Carcasse.Array.pluck} instead
     * @method
     * @member Carcasse
     * @alias Carcasse.Array#pluck
     */
    Carcasse.pluck = CarcasseArray.pluck;

    /**
     * @method
     * @member Carcasse
     * @alias Carcasse.Array#toArray
     */
    Carcasse.toArray = function() {
        return CarcasseArray.toArray.apply(CarcasseArray, arguments);
    };
})();

//@tag foundation,core
//@define Carcasse.Number
//@require Carcasse.Array

/**
 * @class Carcasse.Number
 *
 * A collection of useful static methods to deal with numbers
 * @singleton
 */

(function() {

var isToFixedBroken = (0.9).toFixed() !== '1';

Carcasse.Number = {
    /**
     * Checks whether or not the passed number is within a desired range.  If the number is already within the
     * range it is returned, otherwise the min or max value is returned depending on which side of the range is
     * exceeded. Note that this method returns the constrained value but does not change the current number.
     * @param {Number} number The number to check
     * @param {Number} min The minimum number in the range
     * @param {Number} max The maximum number in the range
     * @return {Number} The constrained value if outside the range, otherwise the current value
     */
    constrain: function(number, min, max) {
        number = parseFloat(number);

        if (!isNaN(min)) {
            number = Math.max(number, min);
        }
        if (!isNaN(max)) {
            number = Math.min(number, max);
        }
        return number;
    },

    /**
     * Snaps the passed number between stopping points based upon a passed increment value.
     * @param {Number} value The unsnapped value.
     * @param {Number} increment The increment by which the value must move.
     * @param {Number} minValue The minimum value to which the returned value must be constrained. Overrides the increment..
     * @param {Number} maxValue The maximum value to which the returned value must be constrained. Overrides the increment..
     * @return {Number} The value of the nearest snap target.
     */
    snap : function(value, increment, minValue, maxValue) {
        var newValue = value,
            m;

        if (!(increment && value)) {
            return value;
        }
        m = value % increment;
        if (m !== 0) {
            newValue -= m;
            if (m * 2 >= increment) {
                newValue += increment;
            } else if (m * 2 < -increment) {
                newValue -= increment;
            }
        }
        return Carcasse.Number.constrain(newValue, minValue,  maxValue);
    },

    /**
     * Formats a number using fixed-point notation
     * @param {Number} value The number to format
     * @param {Number} precision The number of digits to show after the decimal point
     */
    toFixed: function(value, precision) {
        if (isToFixedBroken) {
            precision = precision || 0;
            var pow = Math.pow(10, precision);
            return (Math.round(value * pow) / pow).toFixed(precision);
        }

        return value.toFixed(precision);
    },

    /**
     * Validate that a value is numeric and convert it to a number if necessary. Returns the specified default value if
     * it is not.

Carcasse.Number.from('1.23', 1); // returns 1.23
Carcasse.Number.from('abc', 1); // returns 1

     * @param {Object} value
     * @param {Number} defaultValue The value to return if the original value is non-numeric
     * @return {Number} value, if numeric, defaultValue otherwise
     */
    from: function(value, defaultValue) {
        if (isFinite(value)) {
            value = parseFloat(value);
        }

        return !isNaN(value) ? value : defaultValue;
    }
};

})();

/**
 * This method is deprecated, please use {@link Carcasse.Number#from Carcasse.Number.from} instead
 *
 * @deprecated 4.0.0 Replaced by Carcasse.Number.from
 * @member Carcasse
 * @method num
 */
Carcasse.num = function() {
    return Carcasse.Number.from.apply(this, arguments);
};

//@tag foundation,core
//@define Carcasse.Object
//@require Carcasse.Number

/**
 * @author Jacky Nguyen <jacky@sencha.com>
 * @docauthor Jacky Nguyen <jacky@sencha.com>
 * @class Carcasse.Object
 *
 * A collection of useful static methods to deal with objects.
 *
 * @singleton
 */

(function() {

// The "constructor" for chain:
var TemplateClass = function(){};

var CarcasseObject = Carcasse.Object = {

    /**
     * Returns a new object with the given object as the prototype chain.
     * @param {Object} object The prototype chain for the new object.
     */
    chain: ('create' in Object) ? function(object){
        return Object.create(object);
    } : function (object) {
        TemplateClass.prototype = object;
        var result = new TemplateClass();
        TemplateClass.prototype = null;
        return result;
    },

    /**
     * Convert a `name` - `value` pair to an array of objects with support for nested structures; useful to construct
     * query strings. For example:
     *
     * Non-recursive:
     *
     *     var objects = Carcasse.Object.toQueryObjects('hobbies', ['reading', 'cooking', 'swimming']);
     *
     *     // objects then equals:
     *     [
     *         { name: 'hobbies', value: 'reading' },
     *         { name: 'hobbies', value: 'cooking' },
     *         { name: 'hobbies', value: 'swimming' }
     *     ]
     *
     * Recursive:
     *
     *     var objects = Carcasse.Object.toQueryObjects('dateOfBirth', {
     *         day: 3,
     *         month: 8,
     *         year: 1987,
     *         extra: {
     *             hour: 4,
     *             minute: 30
     *         }
     *     }, true);
     *
     *     // objects then equals:
     *     [
     *         { name: 'dateOfBirth[day]', value: 3 },
     *         { name: 'dateOfBirth[month]', value: 8 },
     *         { name: 'dateOfBirth[year]', value: 1987 },
     *         { name: 'dateOfBirth[extra][hour]', value: 4 },
     *         { name: 'dateOfBirth[extra][minute]', value: 30 }
     *     ]
     *
     * @param {String} name
     * @param {Object} value
     * @param {Boolean} [recursive=false] `true` to recursively encode any sub-objects.
     * @return {Object[]} Array of objects with `name` and `value` fields.
     */
    toQueryObjects: function(name, value, recursive) {
        var self = CarcasseObject.toQueryObjects,
            objects = [],
            i, ln;

        if (Carcasse.isArray(value)) {
            for (i = 0, ln = value.length; i < ln; i++) {
                if (recursive) {
                    objects = objects.concat(self(name + '[' + i + ']', value[i], true));
                }
                else {
                    objects.push({
                        name: name,
                        value: value[i]
                    });
                }
            }
        }
        else if (Carcasse.isObject(value)) {
            for (i in value) {
                if (value.hasOwnProperty(i)) {
                    if (recursive) {
                        objects = objects.concat(self(name + '[' + i + ']', value[i], true));
                    }
                    else {
                        objects.push({
                            name: name,
                            value: value[i]
                        });
                    }
                }
            }
        }
        else {
            objects.push({
                name: name,
                value: value
            });
        }

        return objects;
    },

    /**
     * Takes an object and converts it to an encoded query string.
     *
     * Non-recursive:
     *
     *     Carcasse.Object.toQueryString({foo: 1, bar: 2}); // returns "foo=1&bar=2"
     *     Carcasse.Object.toQueryString({foo: null, bar: 2}); // returns "foo=&bar=2"
     *     Carcasse.Object.toQueryString({'some price': '$300'}); // returns "some%20price=%24300"
     *     Carcasse.Object.toQueryString({date: new Date(2011, 0, 1)}); // returns "date=%222011-01-01T00%3A00%3A00%22"
     *     Carcasse.Object.toQueryString({colors: ['red', 'green', 'blue']}); // returns "colors=red&colors=green&colors=blue"
     *
     * Recursive:
     *
     *     Carcasse.Object.toQueryString({
     *         username: 'Jacky',
     *         dateOfBirth: {
     *             day: 1,
     *             month: 2,
     *             year: 1911
     *         },
     *         hobbies: ['coding', 'eating', 'sleeping', ['nested', 'stuff']]
     *     }, true);
     *
     *     // returns the following string (broken down and url-decoded for ease of reading purpose):
     *     // username=Jacky
     *     //    &dateOfBirth[day]=1&dateOfBirth[month]=2&dateOfBirth[year]=1911
     *     //    &hobbies[0]=coding&hobbies[1]=eating&hobbies[2]=sleeping&hobbies[3][0]=nested&hobbies[3][1]=stuff
     *
     * @param {Object} object The object to encode.
     * @param {Boolean} [recursive=false] Whether or not to interpret the object in recursive format.
     * (PHP / Ruby on Rails servers and similar).
     * @return {String} queryString
     */
    toQueryString: function(object, recursive) {
        var paramObjects = [],
            params = [],
            i, j, ln, paramObject, value;

        for (i in object) {
            if (object.hasOwnProperty(i)) {
                paramObjects = paramObjects.concat(CarcasseObject.toQueryObjects(i, object[i], recursive));
            }
        }

        for (j = 0, ln = paramObjects.length; j < ln; j++) {
            paramObject = paramObjects[j];
            value = paramObject.value;

            if (Carcasse.isEmpty(value)) {
                value = '';
            }
            else if (Carcasse.isDate(value)) {
                value = Carcasse.Date.toString(value);
            }

            params.push(encodeURIComponent(paramObject.name) + '=' + encodeURIComponent(String(value)));
        }

        return params.join('&');
    },

    /**
     * Converts a query string back into an object.
     *
     * Non-recursive:
     *
     *     Carcasse.Object.fromQueryString("foo=1&bar=2"); // returns {foo: 1, bar: 2}
     *     Carcasse.Object.fromQueryString("foo=&bar=2"); // returns {foo: null, bar: 2}
     *     Carcasse.Object.fromQueryString("some%20price=%24300"); // returns {'some price': '$300'}
     *     Carcasse.Object.fromQueryString("colors=red&colors=green&colors=blue"); // returns {colors: ['red', 'green', 'blue']}
     *
     * Recursive:
     *
     *     Carcasse.Object.fromQueryString("username=Jacky&dateOfBirth[day]=1&dateOfBirth[month]=2&dateOfBirth[year]=1911&hobbies[0]=coding&hobbies[1]=eating&hobbies[2]=sleeping&hobbies[3][0]=nested&hobbies[3][1]=stuff", true);
     *
     *     // returns
     *     {
     *         username: 'Jacky',
     *         dateOfBirth: {
     *             day: '1',
     *             month: '2',
     *             year: '1911'
     *         },
     *         hobbies: ['coding', 'eating', 'sleeping', ['nested', 'stuff']]
     *     }
     *
     * @param {String} queryString The query string to decode.
     * @param {Boolean} [recursive=false] Whether or not to recursively decode the string. This format is supported by
     * PHP / Ruby on Rails servers and similar.
     * @return {Object}
     */
    fromQueryString: function(queryString, recursive) {
        var parts = queryString.replace(/^\?/, '').split('&'),
            object = {},
            temp, components, name, value, i, ln,
            part, j, subLn, matchedKeys, matchedName,
            keys, key, nextKey;

        for (i = 0, ln = parts.length; i < ln; i++) {
            part = parts[i];

            if (part.length > 0) {
                components = part.split('=');
                name = decodeURIComponent(components[0]);
                value = (components[1] !== undefined) ? decodeURIComponent(components[1]) : '';

                if (!recursive) {
                    if (object.hasOwnProperty(name)) {
                        if (!Carcasse.isArray(object[name])) {
                            object[name] = [object[name]];
                        }

                        object[name].push(value);
                    }
                    else {
                        object[name] = value;
                    }
                }
                else {
                    matchedKeys = name.match(/(\[):?([^\]]*)\]/g);
                    matchedName = name.match(/^([^\[]+)/);

                    //<debug error>
                    if (!matchedName) {
                        throw new Error('[Carcasse.Object.fromQueryString] Malformed query string given, failed parsing name from "' + part + '"');
                    }
                    //</debug>

                    name = matchedName[0];
                    keys = [];

                    if (matchedKeys === null) {
                        object[name] = value;
                        continue;
                    }

                    for (j = 0, subLn = matchedKeys.length; j < subLn; j++) {
                        key = matchedKeys[j];
                        key = (key.length === 2) ? '' : key.substring(1, key.length - 1);
                        keys.push(key);
                    }

                    keys.unshift(name);

                    temp = object;

                    for (j = 0, subLn = keys.length; j < subLn; j++) {
                        key = keys[j];

                        if (j === subLn - 1) {
                            if (Carcasse.isArray(temp) && key === '') {
                                temp.push(value);
                            }
                            else {
                                temp[key] = value;
                            }
                        }
                        else {
                            if (temp[key] === undefined || typeof temp[key] === 'string') {
                                nextKey = keys[j+1];

                                temp[key] = (Carcasse.isNumeric(nextKey) || nextKey === '') ? [] : {};
                            }

                            temp = temp[key];
                        }
                    }
                }
            }
        }

        return object;
    },

    /**
     * Iterate through an object and invoke the given callback function for each iteration. The iteration can be stop
     * by returning `false` in the callback function. For example:
     *
     *     var person = {
     *         name: 'Jacky',
     *         hairColor: 'black',
     *         loves: ['food', 'sleeping', 'wife']
     *     };
     *
     *     Carcasse.Object.each(person, function(key, value, myself) {
     *         console.log(key + ":" + value);
     *
     *         if (key === 'hairColor') {
     *             return false; // stop the iteration
     *         }
     *     });
     *
     * @param {Object} object The object to iterate
     * @param {Function} fn The callback function.
     * @param {String} fn.key
     * @param {Mixed} fn.value
     * @param {Object} fn.object The object itself
     * @param {Object} [scope] The execution scope (`this`) of the callback function
     */
    each: function(object, fn, scope) {
        for (var property in object) {
            if (object.hasOwnProperty(property)) {
                if (fn.call(scope || object, property, object[property], object) === false) {
                    return;
                }
            }
        }
    },

    /**
     * Merges any number of objects recursively without referencing them or their children.
     *
     *     var extjs = {
     *         companyName: 'Carcasse JS',
     *         products: ['Carcasse JS', 'Carcasse GWT', 'Carcasse Designer'],
     *         isSuperCool: true,
     *         office: {
     *             size: 2000,
     *             location: 'Palo Alto',
     *             isFun: true
     *         }
     *     };
     *
     *     var newStuff = {
     *         companyName: 'Sencha Inc.',
     *         products: ['Carcasse JS', 'Carcasse GWT', 'Carcasse Designer', 'Sencha Touch', 'Sencha Animator'],
     *         office: {
     *             size: 40000,
     *             location: 'Redwood City'
     *         }
     *     };
     *
     *     var sencha = Carcasse.Object.merge({}, extjs, newStuff);
     *
     *     // sencha then equals to
     *     {
     *         companyName: 'Sencha Inc.',
     *         products: ['Carcasse JS', 'Carcasse GWT', 'Carcasse Designer', 'Sencha Touch', 'Sencha Animator'],
     *         isSuperCool: true
     *         office: {
     *             size: 40000,
     *             location: 'Redwood City'
     *             isFun: true
     *         }
     *     }
     *
     * @param {Object} source The first object into which to merge the others.
     * @param {Object...} objs One or more objects to be merged into the first.
     * @return {Object} The object that is created as a result of merging all the objects passed in.
     */
    merge: function(source) {
        var i = 1,
            ln = arguments.length,
            mergeFn = CarcasseObject.merge,
            cloneFn = Carcasse.clone,
            object, key, value, sourceKey;

        for (; i < ln; i++) {
            object = arguments[i];

            for (key in object) {
                value = object[key];
                if (value && value.constructor === Object) {
                    sourceKey = source[key];
                    if (sourceKey && sourceKey.constructor === Object) {
                        mergeFn(sourceKey, value);
                    }
                    else {
                        source[key] = cloneFn(value);
                    }
                }
                else {
                    source[key] = value;
                }
            }
        }

        return source;
    },

    /**
     * @private
     * @param source
     */
    mergeIf: function(source) {
        var i = 1,
            ln = arguments.length,
            cloneFn = Carcasse.clone,
            object, key, value;

        for (; i < ln; i++) {
            object = arguments[i];

            for (key in object) {
                if (!(key in source)) {
                    value = object[key];

                    if (value && value.constructor === Object) {
                        source[key] = cloneFn(value);
                    }
                    else {
                        source[key] = value;
                    }
                }
            }
        }

        return source;
    },

    /**
     * Returns the first matching key corresponding to the given value.
     * If no matching value is found, `null` is returned.
     *
     *     var person = {
     *         name: 'Jacky',
     *         loves: 'food'
     *     };
     *
     *     alert(Carcasse.Object.getKey(sencha, 'food')); // alerts 'loves'
     *
     * @param {Object} object
     * @param {Object} value The value to find
     */
    getKey: function(object, value) {
        for (var property in object) {
            if (object.hasOwnProperty(property) && object[property] === value) {
                return property;
            }
        }

        return null;
    },

    /**
     * Gets all values of the given object as an array.
     *
     *     var values = Carcasse.Object.getValues({
     *         name: 'Jacky',
     *         loves: 'food'
     *     }); // ['Jacky', 'food']
     *
     * @param {Object} object
     * @return {Array} An array of values from the object.
     */
    getValues: function(object) {
        var values = [],
            property;

        for (property in object) {
            if (object.hasOwnProperty(property)) {
                values.push(object[property]);
            }
        }

        return values;
    },

    /**
     * Gets all keys of the given object as an array.
     *
     *     var values = Carcasse.Object.getKeys({
     *         name: 'Jacky',
     *         loves: 'food'
     *     }); // ['name', 'loves']
     *
     * @param {Object} object
     * @return {String[]} An array of keys from the object.
     * @method
     */
    getKeys: ('keys' in Object) ? Object.keys : function(object) {
        var keys = [],
            property;

        for (property in object) {
            if (object.hasOwnProperty(property)) {
                keys.push(property);
            }
        }

        return keys;
    },

    /**
     * Gets the total number of this object's own properties.
     *
     *     var size = Carcasse.Object.getSize({
     *         name: 'Jacky',
     *         loves: 'food'
     *     }); // size equals 2
     *
     * @param {Object} object
     * @return {Number} size
     */
    getSize: function(object) {
        var size = 0,
            property;

        for (property in object) {
            if (object.hasOwnProperty(property)) {
                size++;
            }
        }

        return size;
    },

    /**
     * @private
     */
    classify: function(object) {
        var objectProperties = [],
            arrayProperties = [],
            propertyClassesMap = {},
            objectClass = function() {
                var i = 0,
                    ln = objectProperties.length,
                    property;

                for (; i < ln; i++) {
                    property = objectProperties[i];
                    this[property] = new propertyClassesMap[property];
                }

                ln = arrayProperties.length;

                for (i = 0; i < ln; i++) {
                    property = arrayProperties[i];
                    this[property] = object[property].slice();
                }
            },
            key, value, constructor;

        for (key in object) {
            if (object.hasOwnProperty(key)) {
                value = object[key];

                if (value) {
                    constructor = value.constructor;

                    if (constructor === Object) {
                        objectProperties.push(key);
                        propertyClassesMap[key] = CarcasseObject.classify(value);
                    }
                    else if (constructor === Array) {
                        arrayProperties.push(key);
                    }
                }
            }
        }

        objectClass.prototype = object;

        return objectClass;
    },

    defineProperty: ('defineProperty' in Object) ? Object.defineProperty : function(object, name, descriptor) {
        if (descriptor.get) {
            object.__defineGetter__(name, descriptor.get);
        }

        if (descriptor.set) {
            object.__defineSetter__(name, descriptor.set);
        }
    }
};

/**
 * A convenient alias method for {@link Carcasse.Object#merge}.
 *
 * @member Carcasse
 * @method merge
 */
Carcasse.merge = Carcasse.Object.merge;

/**
 * @private
 */
Carcasse.mergeIf = Carcasse.Object.mergeIf;

/**
 * A convenient alias method for {@link Carcasse.Object#toQueryString}.
 *
 * @member Carcasse
 * @method urlEncode
 * @deprecated 4.0.0 Please use `{@link Carcasse.Object#toQueryString Carcasse.Object.toQueryString}` instead
 */
Carcasse.urlEncode = function() {
    var args = Carcasse.Array.from(arguments),
        prefix = '';

    // Support for the old `pre` argument
    if ((typeof args[1] === 'string')) {
        prefix = args[1] + '&';
        args[1] = false;
    }

    return prefix + CarcasseObject.toQueryString.apply(CarcasseObject, args);
};

/**
 * A convenient alias method for {@link Carcasse.Object#fromQueryString}.
 *
 * @member Carcasse
 * @method urlDecode
 * @deprecated 4.0.0 Please use {@link Carcasse.Object#fromQueryString Carcasse.Object.fromQueryString} instead
 */
Carcasse.urlDecode = function() {
    return CarcasseObject.fromQueryString.apply(CarcasseObject, arguments);
};

})();

//@tag foundation,core
//@define Carcasse.Function
//@require Carcasse.Object

/**
 * @class Carcasse.Function
 *
 * A collection of useful static methods to deal with function callbacks.
 * @singleton
 * @alternateClassName Carcasse.util.Functions
 */
Carcasse.Function = {

    /**
     * A very commonly used method throughout the framework. It acts as a wrapper around another method
     * which originally accepts 2 arguments for `name` and `value`.
     * The wrapped function then allows "flexible" value setting of either:
     *
     * - `name` and `value` as 2 arguments
     * - one single object argument with multiple key - value pairs
     *
     * For example:
     *
     *     var setValue = Carcasse.Function.flexSetter(function(name, value) {
     *         this[name] = value;
     *     });
     *
     *     // Afterwards
     *     // Setting a single name - value
     *     setValue('name1', 'value1');
     *
     *     // Settings multiple name - value pairs
     *     setValue({
     *         name1: 'value1',
     *         name2: 'value2',
     *         name3: 'value3'
     *     });
     *
     * @param {Function} setter
     * @return {Function} flexSetter
     */
    flexSetter: function(fn) {
        return function(a, b) {
            var k, i;

            if (a === null) {
                return this;
            }

            if (typeof a !== 'string') {
                for (k in a) {
                    if (a.hasOwnProperty(k)) {
                        fn.call(this, k, a[k]);
                    }
                }

                if (Carcasse.enumerables) {
                    for (i = Carcasse.enumerables.length; i--;) {
                        k = Carcasse.enumerables[i];
                        if (a.hasOwnProperty(k)) {
                            fn.call(this, k, a[k]);
                        }
                    }
                }
            } else {
                fn.call(this, a, b);
            }

            return this;
        };
    },

    /**
     * Create a new function from the provided `fn`, change `this` to the provided scope, optionally
     * overrides arguments for the call. Defaults to the arguments passed by the caller.
     *
     * {@link Carcasse#bind Carcasse.bind} is alias for {@link Carcasse.Function#bind Carcasse.Function.bind}
     *
     * @param {Function} fn The function to delegate.
     * @param {Object} scope (optional) The scope (`this` reference) in which the function is executed.
     * **If omitted, defaults to the browser window.**
     * @param {Array} args (optional) Overrides arguments for the call. (Defaults to the arguments passed by the caller)
     * @param {Boolean/Number} appendArgs (optional) if `true` args are appended to call args instead of overriding,
     * if a number the args are inserted at the specified position.
     * @return {Function} The new function.
     */
    bind: function(fn, scope, args, appendArgs) {
        if (arguments.length === 2) {
            return function() {
                return fn.apply(scope, arguments);
            }
        }

        var method = fn,
            slice = Array.prototype.slice;

        return function() {
            var callArgs = args || arguments;

            if (appendArgs === true) {
                callArgs = slice.call(arguments, 0);
                callArgs = callArgs.concat(args);
            }
            else if (typeof appendArgs == 'number') {
                callArgs = slice.call(arguments, 0); // copy arguments first
                Carcasse.Array.insert(callArgs, appendArgs, args);
            }

            return method.apply(scope || window, callArgs);
        };
    },

    /**
     * Create a new function from the provided `fn`, the arguments of which are pre-set to `args`.
     * New arguments passed to the newly created callback when it's invoked are appended after the pre-set ones.
     * This is especially useful when creating callbacks.
     *
     * For example:
     *
     *     var originalFunction = function(){
     *         alert(Carcasse.Array.from(arguments).join(' '));
     *     };
     *
     *     var callback = Carcasse.Function.pass(originalFunction, ['Hello', 'World']);
     *
     *     callback(); // alerts 'Hello World'
     *     callback('by Me'); // alerts 'Hello World by Me'
     *
     * {@link Carcasse#pass Carcasse.pass} is alias for {@link Carcasse.Function#pass Carcasse.Function.pass}
     *
     * @param {Function} fn The original function.
     * @param {Array} args The arguments to pass to new callback.
     * @param {Object} scope (optional) The scope (`this` reference) in which the function is executed.
     * @return {Function} The new callback function.
     */
    pass: function(fn, args, scope) {
        if (!Carcasse.isArray(args)) {
            args = Carcasse.Array.clone(args);
        }

        return function() {
            args.push.apply(args, arguments);
            return fn.apply(scope || this, args);
        };
    },

    /**
     * Create an alias to the provided method property with name `methodName` of `object`.
     * Note that the execution scope will still be bound to the provided `object` itself.
     *
     * @param {Object/Function} object
     * @param {String} methodName
     * @return {Function} aliasFn
     */
    alias: function(object, methodName) {
        return function() {
            return object[methodName].apply(object, arguments);
        };
    },

    /**
     * Create a "clone" of the provided method. The returned method will call the given
     * method passing along all arguments and the "this" pointer and return its result.
     *
     * @param {Function} method
     * @return {Function} cloneFn
     */
    clone: function(method) {
        return function() {
            return method.apply(this, arguments);
        };
    },

    /**
     * Creates an interceptor function. The passed function is called before the original one. If it returns false,
     * the original one is not called. The resulting function returns the results of the original function.
     * The passed function is called with the parameters of the original function. Example usage:
     *
     *     var sayHi = function(name){
     *         alert('Hi, ' + name);
     *     };
     *
     *     sayHi('Fred'); // alerts "Hi, Fred"
     *
     *     // create a new function that validates input without
     *     // directly modifying the original function:
     *     var sayHiToFriend = Carcasse.Function.createInterceptor(sayHi, function(name){
     *         return name === 'Brian';
     *     });
     *
     *     sayHiToFriend('Fred');  // no alert
     *     sayHiToFriend('Brian'); // alerts "Hi, Brian"
     *
     * @param {Function} origFn The original function.
     * @param {Function} newFn The function to call before the original.
     * @param {Object} scope (optional) The scope (`this` reference) in which the passed function is executed.
     * **If omitted, defaults to the scope in which the original function is called or the browser window.**
     * @param {Object} [returnValue=null] (optional) The value to return if the passed function return `false`.
     * @return {Function} The new function.
     */
    createInterceptor: function(origFn, newFn, scope, returnValue) {
        var method = origFn;
        if (!Carcasse.isFunction(newFn)) {
            return origFn;
        }
        else {
            return function() {
                var me = this,
                    args = arguments;
                newFn.target = me;
                newFn.method = origFn;
                return (newFn.apply(scope || me || window, args) !== false) ? origFn.apply(me || window, args) : returnValue || null;
            };
        }
    },

    /**
     * Creates a delegate (callback) which, when called, executes after a specific delay.
     *
     * @param {Function} fn The function which will be called on a delay when the returned function is called.
     * Optionally, a replacement (or additional) argument list may be specified.
     * @param {Number} delay The number of milliseconds to defer execution by whenever called.
     * @param {Object} scope (optional) The scope (`this` reference) used by the function at execution time.
     * @param {Array} args (optional) Override arguments for the call. (Defaults to the arguments passed by the caller)
     * @param {Boolean/Number} appendArgs (optional) if True args are appended to call args instead of overriding,
     * if a number the args are inserted at the specified position.
     * @return {Function} A function which, when called, executes the original function after the specified delay.
     */
    createDelayed: function(fn, delay, scope, args, appendArgs) {
        if (scope || args) {
            fn = Carcasse.Function.bind(fn, scope, args, appendArgs);
        }

        return function() {
            var me = this,
                args = Array.prototype.slice.call(arguments);

            setTimeout(function() {
                fn.apply(me, args);
            }, delay);
        }
    },

    /**
     * Calls this function after the number of milliseconds specified, optionally in a specific scope. Example usage:
     *
     *     var sayHi = function(name){
     *         alert('Hi, ' + name);
     *     };
     *
     *     // executes immediately:
     *     sayHi('Fred');
     *
     *     // executes after 2 seconds:
     *     Carcasse.Function.defer(sayHi, 2000, this, ['Fred']);
     *
     *     // this syntax is sometimes useful for deferring
     *     // execution of an anonymous function:
     *     Carcasse.Function.defer(function(){
     *         alert('Anonymous');
     *     }, 100);
     *
     * {@link Carcasse#defer Carcasse.defer} is alias for {@link Carcasse.Function#defer Carcasse.Function.defer}
     *
     * @param {Function} fn The function to defer.
     * @param {Number} millis The number of milliseconds for the `setTimeout()` call.
     * If less than or equal to 0 the function is executed immediately.
     * @param {Object} scope (optional) The scope (`this` reference) in which the function is executed.
     * If omitted, defaults to the browser window.
     * @param {Array} args (optional) Overrides arguments for the call. Defaults to the arguments passed by the caller.
     * @param {Boolean/Number} appendArgs (optional) if `true`, args are appended to call args instead of overriding,
     * if a number the args are inserted at the specified position.
     * @return {Number} The timeout id that can be used with `clearTimeout()`.
     */
    defer: function(fn, millis, scope, args, appendArgs) {
        fn = Carcasse.Function.bind(fn, scope, args, appendArgs);
        if (millis > 0) {
            return setTimeout(fn, millis);
        }
        fn();
        return 0;
    },

    /**
     * Create a combined function call sequence of the original function + the passed function.
     * The resulting function returns the results of the original function.
     * The passed function is called with the parameters of the original function. Example usage:
     *
     *     var sayHi = function(name){
     *         alert('Hi, ' + name);
     *     };
     *
     *     sayHi('Fred'); // alerts "Hi, Fred"
     *
     *     var sayGoodbye = Carcasse.Function.createSequence(sayHi, function(name){
     *         alert('Bye, ' + name);
     *     });
     *
     *     sayGoodbye('Fred'); // both alerts show
     *
     * @param {Function} originalFn The original function.
     * @param {Function} newFn The function to sequence.
     * @param {Object} scope (optional) The scope (`this` reference) in which the passed function is executed.
     * If omitted, defaults to the scope in which the original function is called or the browser window.
     * @return {Function} The new function.
     */
    createSequence: function(originalFn, newFn, scope) {
        if (!newFn) {
            return originalFn;
        }
        else {
            return function() {
                var result = originalFn.apply(this, arguments);
                newFn.apply(scope || this, arguments);
                return result;
            };
        }
    },

    /**
     * Creates a delegate function, optionally with a bound scope which, when called, buffers
     * the execution of the passed function for the configured number of milliseconds.
     * If called again within that period, the impending invocation will be canceled, and the
     * timeout period will begin again.
     *
     * @param {Function} fn The function to invoke on a buffered timer.
     * @param {Number} buffer The number of milliseconds by which to buffer the invocation of the
     * function.
     * @param {Object} scope (optional) The scope (`this` reference) in which
     * the passed function is executed. If omitted, defaults to the scope specified by the caller.
     * @param {Array} args (optional) Override arguments for the call. Defaults to the arguments
     * passed by the caller.
     * @return {Function} A function which invokes the passed function after buffering for the specified time.
     */
    createBuffered: function(fn, buffer, scope, args) {
        var timerId;

        return function() {
            var callArgs = args || Array.prototype.slice.call(arguments, 0),
                me = scope || this;

            if (timerId) {
                clearTimeout(timerId);
            }

            timerId = setTimeout(function(){
                fn.apply(me, callArgs);
            }, buffer);
        };
    },

    /**
     * Creates a throttled version of the passed function which, when called repeatedly and
     * rapidly, invokes the passed function only after a certain interval has elapsed since the
     * previous invocation.
     *
     * This is useful for wrapping functions which may be called repeatedly, such as
     * a handler of a mouse move event when the processing is expensive.
     *
     * @param {Function} fn The function to execute at a regular time interval.
     * @param {Number} interval The interval, in milliseconds, on which the passed function is executed.
     * @param {Object} scope (optional) The scope (`this` reference) in which
     * the passed function is executed. If omitted, defaults to the scope specified by the caller.
     * @return {Function} A function which invokes the passed function at the specified interval.
     */
    createThrottled: function(fn, interval, scope) {
        var lastCallTime, elapsed, lastArgs, timer, execute = function() {
            fn.apply(scope || this, lastArgs);
            lastCallTime = new Date().getTime();
        };

        return function() {
            elapsed = new Date().getTime() - lastCallTime;
            lastArgs = arguments;

            clearTimeout(timer);
            if (!lastCallTime || (elapsed >= interval)) {
                execute();
            } else {
                timer = setTimeout(execute, interval - elapsed);
            }
        };
    },

    interceptBefore: function(object, methodName, fn) {
        var method = object[methodName] || Carcasse.emptyFn;

        return object[methodName] = function() {
            var ret = fn.apply(this, arguments);
            method.apply(this, arguments);

            return ret;
        };
    },

    interceptAfter: function(object, methodName, fn) {
        var method = object[methodName] || Carcasse.emptyFn;

        return object[methodName] = function() {
            method.apply(this, arguments);
            return fn.apply(this, arguments);
        };
    }
};

/**
 * @method
 * @member Carcasse
 * @alias Carcasse.Function#defer
 */
Carcasse.defer = Carcasse.Function.alias(Carcasse.Function, 'defer');

/**
 * @method
 * @member Carcasse
 * @alias Carcasse.Function#pass
 */
Carcasse.pass = Carcasse.Function.alias(Carcasse.Function, 'pass');

/**
 * @method
 * @member Carcasse
 * @alias Carcasse.Function#bind
 */
Carcasse.bind = Carcasse.Function.alias(Carcasse.Function, 'bind');

//@tag foundation,core
//@define Carcasse.JSON
//@require Carcasse.Function

/**
 * @class Carcasse.JSON
 * Modified version of Douglas Crockford's json.js that doesn't
 * mess with the Object prototype.
 * [http://www.json.org/js.html](http://www.json.org/js.html)
 * @singleton
 */
Carcasse.JSON = new(function() {
    var useHasOwn = !! {}.hasOwnProperty,
    isNative = function() {
        var useNative = null;

        return function() {
            if (useNative === null) {
                useNative = Carcasse.USE_NATIVE_JSON && window.JSON && JSON.toString() == '[object JSON]';
            }

            return useNative;
        };
    }(),
    pad = function(n) {
        return n < 10 ? "0" + n : n;
    },
    doDecode = function(json) {
        return eval("(" + json + ')');
    },
    doEncode = function(o) {
        if (!Carcasse.isDefined(o) || o === null) {
            return "null";
        } else if (Carcasse.isArray(o)) {
            return encodeArray(o);
        } else if (Carcasse.isDate(o)) {
            return Carcasse.JSON.encodeDate(o);
        } else if (Carcasse.isString(o)) {
            return encodeString(o);
        } else if (typeof o == "number") {
            //don't use isNumber here, since finite checks happen inside isNumber
            return isFinite(o) ? String(o) : "null";
        } else if (Carcasse.isBoolean(o)) {
            return String(o);
        } else if (Carcasse.isObject(o)) {
            return encodeObject(o);
        } else if (typeof o === "function") {
            return "null";
        }
        return 'undefined';
    },
    m = {
        "\b": '\\b',
        "\t": '\\t',
        "\n": '\\n',
        "\f": '\\f',
        "\r": '\\r',
        '"': '\\"',
        "\\": '\\\\',
        '\x0b': '\\u000b' //ie doesn't handle \v
    },
    charToReplace = /[\\\"\x00-\x1f\x7f-\uffff]/g,
    encodeString = function(s) {
        return '"' + s.replace(charToReplace, function(a) {
            var c = m[a];
            return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"';
    },
    encodeArray = function(o) {
        var a = ["[", ""],
        // Note empty string in case there are no serializable members.
        len = o.length,
        i;
        for (i = 0; i < len; i += 1) {
            a.push(doEncode(o[i]), ',');
        }
        // Overwrite trailing comma (or empty string)
        a[a.length - 1] = ']';
        return a.join("");
    },
    encodeObject = function(o) {
        var a = ["{", ""],
        // Note empty string in case there are no serializable members.
        i;
        for (i in o) {
            if (!useHasOwn || o.hasOwnProperty(i)) {
                a.push(doEncode(i), ":", doEncode(o[i]), ',');
            }
        }
        // Overwrite trailing comma (or empty string)
        a[a.length - 1] = '}';
        return a.join("");
    };

    /**
     * Encodes a Date. This returns the actual string which is inserted into the JSON string as the literal expression.
     * __The returned value includes enclosing double quotation marks.__
     *
     * The default return format is "yyyy-mm-ddThh:mm:ss".
     * 
     * To override this:
     *
     *     Carcasse.JSON.encodeDate = function(d) {
     *         return Carcasse.Date.format(d, '"Y-m-d"');
     *     };
     *
     * @param {Date} d The Date to encode.
     * @return {String} The string literal to use in a JSON string.
     */
    this.encodeDate = function(o) {
        return '"' + o.getFullYear() + "-" 
        + pad(o.getMonth() + 1) + "-"
        + pad(o.getDate()) + "T"
        + pad(o.getHours()) + ":"
        + pad(o.getMinutes()) + ":"
        + pad(o.getSeconds()) + '"';
    };

    /**
     * Encodes an Object, Array or other value.
     * @param {Object} o The variable to encode.
     * @return {String} The JSON string.
     * @method
     */
    this.encode = function() {
        var ec;
        return function(o) {
            if (!ec) {
                // setup encoding function on first access
                ec = isNative() ? JSON.stringify : doEncode;
            }
            return ec(o);
        };
    }();


    /**
     * Decodes (parses) a JSON string to an object. If the JSON is invalid, this function throws a Error unless the safe option is set.
     * @param {String} json The JSON string.
     * @param {Boolean} safe (optional) Whether to return `null` or throw an exception if the JSON is invalid.
     * @return {Object/null} The resulting object.
     * @method
     */
    this.decode = function() {
        var dc;
        return function(json, safe) {
            if (!dc) {
                // setup decoding function on first access
                dc = isNative() ? JSON.parse : doDecode;
            }
            try {
                return dc(json);
            } catch (e) {
                if (safe === true) {
                    return null;
                }
                Carcasse.Error.raise({
                    sourceClass: "Carcasse.JSON",
                    sourceMethod: "decode",
                    msg: "You're trying to decode an invalid JSON String: " + json
                });
            }
        };
    }();

})();
/**
 * Shorthand for {@link Carcasse.JSON#encode}.
 * @member Carcasse
 * @method encode
 * @alias Carcasse.JSON#encode
 */
Carcasse.encode = Carcasse.JSON.encode;
/**
 * Shorthand for {@link Carcasse.JSON#decode}.
 * @member Carcasse
 * @method decode
 * @alias Carcasse.JSON#decode
 */
Carcasse.decode = Carcasse.JSON.decode;


//@tag foundation,core
//@define Carcasse.Error
//@require Carcasse.JSON

Carcasse.Error = {
    raise: function(object) {
        throw new Error(object.msg);
    }
};

//@tag foundation,core
//@define Carcasse.Date
//@require Carcasse.Error

/**
 *
 */
Carcasse.Date = {
    /** @ignore */
    now: Date.now,

    /**
     * @private
     * Private for now
     */
    toString: function(date) {
        if (!date) {
            date = new Date();
        }

        var pad = Carcasse.String.leftPad;

        return date.getFullYear() + "-"
            + pad(date.getMonth() + 1, 2, '0') + "-"
            + pad(date.getDate(), 2, '0') + "T"
            + pad(date.getHours(), 2, '0') + ":"
            + pad(date.getMinutes(), 2, '0') + ":"
            + pad(date.getSeconds(), 2, '0');
    }
};


//@tag foundation,core
//@define Carcasse.Base
//@require Carcasse.Date

/**
 * @class Carcasse.Base
 *
 * @author Jacky Nguyen <jacky@sencha.com>
 * @aside guide class_system
 * @aside video class-system
 *
 * The root of all classes created with {@link Carcasse#define}.
 *
 * Carcasse.Base is the building block of all Carcasse classes. All classes in Carcasse inherit from Carcasse.Base. All prototype and static
 * members of this class are inherited by all other classes.
 *
 * See the [Class System Guide](#!/guide/class_system) for more.
 *
 */
(function(flexSetter) {

var noArgs = [],
    Base = function(){};

    // These static properties will be copied to every newly created class with {@link Carcasse#define}
    Carcasse.apply(Base, {
        $className: 'Carcasse.Base',

        $isClass: true,

        /**
         * Create a new instance of this Class.
         *
         *     Carcasse.define('My.cool.Class', {
         *         // ...
         *     });
         *
         *     My.cool.Class.create({
         *         someConfig: true
         *     });
         *
         * All parameters are passed to the constructor of the class.
         *
         * @return {Object} the created instance.
         * @static
         * @inheritable
         */
        create: function() {
            return Carcasse.create.apply(Carcasse, [this].concat(Array.prototype.slice.call(arguments, 0)));
        },

        /**
         * @private
         * @static
         * @inheritable
         */
        extend: function(parent) {
            var parentPrototype = parent.prototype,
                prototype, i, ln, name, statics;

            prototype = this.prototype = Carcasse.Object.chain(parentPrototype);
            prototype.self = this;

            this.superclass = prototype.superclass = parentPrototype;

            if (!parent.$isClass) {
                Carcasse.apply(prototype, Carcasse.Base.prototype);
                prototype.constructor = function() {
                    parentPrototype.constructor.apply(this, arguments);
                };
            }

            //<feature classSystem.inheritableStatics>
            // Statics inheritance
            statics = parentPrototype.$inheritableStatics;

            if (statics) {
                for (i = 0,ln = statics.length; i < ln; i++) {
                    name = statics[i];

                    if (!this.hasOwnProperty(name)) {
                        this[name] = parent[name];
                    }
                }
            }
            //</feature>

            if (parent.$onCarcasseended) {
                this.$onCarcasseended = parent.$onCarcasseended.slice();
            }

            //<feature classSystem.config>
            prototype.config = prototype.defaultConfig = new prototype.configClass;
            prototype.initConfigList = prototype.initConfigList.slice();
            prototype.initConfigMap = Carcasse.Object.chain(prototype.initConfigMap);
            //</feature>
        },

        /**
         * @private
         * @static
         * @inheritable
         */
        '$onCarcasseended': [],

        /**
         * @private
         * @static
         * @inheritable
         */
        triggerCarcasseended: function() {
            var callbacks = this.$onCarcasseended,
                ln = callbacks.length,
                i, callback;

            if (ln > 0) {
                for (i = 0; i < ln; i++) {
                    callback = callbacks[i];
                    callback.fn.apply(callback.scope || this, arguments);
                }
            }
        },

        /**
         * @private
         * @static
         * @inheritable
         */
        onCarcasseended: function(fn, scope) {
            this.$onCarcasseended.push({
                fn: fn,
                scope: scope
            });

            return this;
        },

        /**
         * @private
         * @static
         * @inheritable
         */
        addConfig: function(config, fullMerge) {
            var prototype = this.prototype,
                initConfigList = prototype.initConfigList,
                initConfigMap = prototype.initConfigMap,
                defaultConfig = prototype.defaultConfig,
                hasInitConfigItem, name, value;

            fullMerge = Boolean(fullMerge);

            for (name in config) {
                if (config.hasOwnProperty(name) && (fullMerge || !(name in defaultConfig))) {
                    value = config[name];
                    hasInitConfigItem = initConfigMap[name];

                    if (value !== null) {
                        if (!hasInitConfigItem) {
                            initConfigMap[name] = true;
                            initConfigList.push(name);
                        }
                    }
                    else if (hasInitConfigItem) {
                        initConfigMap[name] = false;
                        Carcasse.Array.remove(initConfigList, name);
                    }
                }
            }

            if (fullMerge) {
                Carcasse.merge(defaultConfig, config);
            }
            else {
                Carcasse.mergeIf(defaultConfig, config);
            }

            prototype.configClass = Carcasse.Object.classify(defaultConfig);
        },

        /**
         * Add / override static properties of this class.
         *
         *     Carcasse.define('My.cool.Class', {
         *         // this.se
         *     });
         *
         *     My.cool.Class.addStatics({
         *         someProperty: 'someValue',      // My.cool.Class.someProperty = 'someValue'
         *         method1: function() {  },    // My.cool.Class.method1 = function() { ... };
         *         method2: function() {  }     // My.cool.Class.method2 = function() { ... };
         *     });
         *
         * @param {Object} members
         * @return {Carcasse.Base} this
         * @static
         * @inheritable
         */
        addStatics: function(members) {
            var member, name;
            //<debug>
            var className = Carcasse.getClassName(this);
            //</debug>

            for (name in members) {
                if (members.hasOwnProperty(name)) {
                    member = members[name];
                    //<debug>
                    if (typeof member == 'function') {
                        member.displayName = className + '.' + name;
                    }
                    //</debug>
                    this[name] = member;
                }
            }

            return this;
        },

        /**
         * @private
         * @static
         * @inheritable
         */
        addInheritableStatics: function(members) {
            var inheritableStatics,
                hasInheritableStatics,
                prototype = this.prototype,
                name, member;

            inheritableStatics = prototype.$inheritableStatics;
            hasInheritableStatics = prototype.$hasInheritableStatics;

            if (!inheritableStatics) {
                inheritableStatics = prototype.$inheritableStatics = [];
                hasInheritableStatics = prototype.$hasInheritableStatics = {};
            }

            //<debug>
            var className = Carcasse.getClassName(this);
            //</debug>

            for (name in members) {
                if (members.hasOwnProperty(name)) {
                    member = members[name];
                    //<debug>
                    if (typeof member == 'function') {
                        member.displayName = className + '.' + name;
                    }
                    //</debug>
                    this[name] = member;

                    if (!hasInheritableStatics[name]) {
                        hasInheritableStatics[name] = true;
                        inheritableStatics.push(name);
                    }
                }
            }

            return this;
        },

        /**
         * Add methods / properties to the prototype of this class.
         *
         *     @example
         *     Carcasse.define('My.awesome.Cat', {
         *         constructor: function() {
         *             // ...
         *         }
         *     });
         *
         *      My.awesome.Cat.addMembers({
         *          meow: function() {
         *             alert('Meowww...');
         *          }
         *      });
         *
         *      var kitty = new My.awesome.Cat();
         *      kitty.meow();
         *
         * @param {Object} members
         * @static
         * @inheritable
         */
        addMembers: function(members) {
            var prototype = this.prototype,
                names = [],
                name, member;

            //<debug>
            var className = this.$className || '';
            //</debug>

            for (name in members) {
                if (members.hasOwnProperty(name)) {
                    member = members[name];

                    if (typeof member == 'function' && !member.$isClass && member !== Carcasse.emptyFn) {
                        member.$owner = this;
                        member.$name = name;
                        //<debug>
                        member.displayName = className + '#' + name;
                        //</debug>
                    }

                    prototype[name] = member;
                }
            }

            return this;
        },

        /**
         * @private
         * @static
         * @inheritable
         */
        addMember: function(name, member) {
            if (typeof member == 'function' && !member.$isClass && member !== Carcasse.emptyFn) {
                member.$owner = this;
                member.$name = name;
                //<debug>
                member.displayName = (this.$className || '') + '#' + name;
                //</debug>
            }

            this.prototype[name] = member;

            return this;
        },

        /**
         * @private
         * @static
         * @inheritable
         */
        implement: function() {
            this.addMembers.apply(this, arguments);
        },

        /**
         * Borrow another class' members to the prototype of this class.
         *
         *     Carcasse.define('Bank', {
         *         money: '$$$',
         *         printMoney: function() {
         *             alert('$$$$$$$');
         *         }
         *     });
         *
         *     Carcasse.define('Thief', {
         *         // ...
         *     });
         *
         *     Thief.borrow(Bank, ['money', 'printMoney']);
         *
         *     var steve = new Thief();
         *
         *     alert(steve.money); // alerts '$$$'
         *     steve.printMoney(); // alerts '$$$$$$$'
         *
         * @param {Carcasse.Base} fromClass The class to borrow members from
         * @param {Array/String} members The names of the members to borrow
         * @return {Carcasse.Base} this
         * @static
         * @inheritable
         * @private
         */
        borrow: function(fromClass, members) {
            var prototype = this.prototype,
                fromPrototype = fromClass.prototype,
                //<debug>
                className = Carcasse.getClassName(this),
                //</debug>
                i, ln, name, fn, toBorrow;

            members = Carcasse.Array.from(members);

            for (i = 0,ln = members.length; i < ln; i++) {
                name = members[i];

                toBorrow = fromPrototype[name];

                if (typeof toBorrow == 'function') {
                    fn = function() {
                        return toBorrow.apply(this, arguments);
                    };

                    //<debug>
                    if (className) {
                        fn.displayName = className + '#' + name;
                    }
                    //</debug>

                    fn.$owner = this;
                    fn.$name = name;

                    prototype[name] = fn;
                }
                else {
                    prototype[name] = toBorrow;
                }
            }

            return this;
        },

        /**
         * Override members of this class. Overridden methods can be invoked via
         * {@link Carcasse.Base#callParent}.
         *
         *     Carcasse.define('My.Cat', {
         *         constructor: function() {
         *             alert("I'm a cat!");
         *         }
         *     });
         *
         *     My.Cat.override({
         *         constructor: function() {
         *             alert("I'm going to be a cat!");
         *
         *             var instance = this.callParent(arguments);
         *
         *             alert("Meeeeoooowwww");
         *
         *             return instance;
         *         }
         *     });
         *
         *     var kitty = new My.Cat(); // alerts "I'm going to be a cat!"
         *                               // alerts "I'm a cat!"
         *                               // alerts "Meeeeoooowwww"
         *
         * As of 2.1, direct use of this method is deprecated. Use {@link Carcasse#define Carcasse.define}
         * instead:
         *
         *     Carcasse.define('My.CatOverride', {
         *         override: 'My.Cat',
         *         
         *         constructor: function() {
         *             alert("I'm going to be a cat!");
         *
         *             var instance = this.callParent(arguments);
         *
         *             alert("Meeeeoooowwww");
         *
         *             return instance;
         *         }
         *     });
         *
         * The above accomplishes the same result but can be managed by the {@link Carcasse.Loader}
         * which can properly order the override and its target class and the build process
         * can determine whether the override is needed based on the required state of the
         * target class (My.Cat).
         *
         * @param {Object} members The properties to add to this class. This should be
         * specified as an object literal containing one or more properties.
         * @return {Carcasse.Base} this class
         * @static
         * @inheritable
         * @deprecated 2.1.0 Please use {@link Carcasse#define Carcasse.define} instead
         */
        override: function(members) {
            var me = this,
                enumerables = Carcasse.enumerables,
                target = me.prototype,
                cloneFunction = Carcasse.Function.clone,
                name, index, member, statics, names, previous;

            if (arguments.length === 2) {
                name = members;
                members = {};
                members[name] = arguments[1];
                enumerables = null;
            }

            do {
                names = []; // clean slate for prototype (1st pass) and static (2nd pass)
                statics = null; // not needed 1st pass, but needs to be cleared for 2nd pass

                for (name in members) { // hasOwnProperty is checked in the next loop...
                    if (name == 'statics') {
                        statics = members[name];
                    }
                    else if (name == 'config') {
                        me.addConfig(members[name], true);
                    }
                    else {
                        names.push(name);
                    }
                }

                if (enumerables) {
                    names.push.apply(names, enumerables);
                }

                for (index = names.length; index--; ) {
                    name = names[index];

                    if (members.hasOwnProperty(name)) {
                        member = members[name];

                        if (typeof member == 'function' && !member.$className && member !== Carcasse.emptyFn) {
                            if (typeof member.$owner != 'undefined') {
                                member = cloneFunction(member);
                            }

                            //<debug>
                            var className = me.$className;
                            if (className) {
                                member.displayName = className + '#' + name;
                            }
                            //</debug>

                            member.$owner = me;
                            member.$name = name;

                            previous = target[name];
                            if (previous) {
                                member.$previous = previous;
                            }
                        }

                        target[name] = member;
                    }
                }

                target = me; // 2nd pass is for statics
                members = statics; // statics will be null on 2nd pass
            } while (members);

            return this;
        },

        /**
         * @protected
         * @static
         * @inheritable
         */
        callParent: function(args) {
            var method;

            // This code is intentionally inlined for the least amount of debugger stepping
            return (method = this.callParent.caller) && (method.$previous ||
                  ((method = method.$owner ? method : method.caller) &&
                        method.$owner.superclass.$class[method.$name])).apply(this, args || noArgs);
        },

        //<feature classSystem.mixins>
        /**
         * Used internally by the mixins pre-processor
         * @private
         * @static
         * @inheritable
         */
        mixin: function(name, mixinClass) {
            var mixin = mixinClass.prototype,
                prototype = this.prototype,
                key;

            if (typeof mixin.onClassMixedIn != 'undefined') {
                mixin.onClassMixedIn.call(mixinClass, this);
            }

            if (!prototype.hasOwnProperty('mixins')) {
                if ('mixins' in prototype) {
                    prototype.mixins = Carcasse.Object.chain(prototype.mixins);
                }
                else {
                    prototype.mixins = {};
                }
            }

            for (key in mixin) {
                if (key === 'mixins') {
                    Carcasse.merge(prototype.mixins, mixin[key]);
                }
                else if (typeof prototype[key] == 'undefined' && key != 'mixinId' && key != 'config') {
                    prototype[key] = mixin[key];
                }
            }

            //<feature classSystem.config>
            if ('config' in mixin) {
                this.addConfig(mixin.config, false);
            }
            //</feature>

            prototype.mixins[name] = mixin;
        },
        //</feature>

        /**
         * Get the current class' name in string format.
         *
         *     Carcasse.define('My.cool.Class', {
         *         constructor: function() {
         *             alert(this.self.getName()); // alerts 'My.cool.Class'
         *         }
         *     });
         *
         *     My.cool.Class.getName(); // 'My.cool.Class'
         *
         * @return {String} className
         * @static
         * @inheritable
         */
        getName: function() {
            return Carcasse.getClassName(this);
        },

        /**
         * Create aliases for existing prototype methods. Example:
         *
         *     Carcasse.define('My.cool.Class', {
         *         method1: function() {  },
         *         method2: function() {  }
         *     });
         *
         *     var test = new My.cool.Class();
         *
         *     My.cool.Class.createAlias({
         *         method3: 'method1',
         *         method4: 'method2'
         *     });
         *
         *     test.method3(); // test.method1()
         *
         *     My.cool.Class.createAlias('method5', 'method3');
         *
         *     test.method5(); // test.method3() -> test.method1()
         *
         * @param {String/Object} alias The new method name, or an object to set multiple aliases. See
         * {@link Carcasse.Function#flexSetter flexSetter}
         * @param {String/Object} origin The original method name
         * @static
         * @inheritable
         * @method
         */
        createAlias: flexSetter(function(alias, origin) {
            this.override(alias, function() {
                return this[origin].apply(this, arguments);
            });
        }),

        /**
         * @private
         * @static
         * @inheritable
         */
        addXtype: function(xtype) {
            var prototype = this.prototype,
                xtypesMap = prototype.xtypesMap,
                xtypes = prototype.xtypes,
                xtypesChain = prototype.xtypesChain;

            if (!prototype.hasOwnProperty('xtypesMap')) {
                xtypesMap = prototype.xtypesMap = Carcasse.merge({}, prototype.xtypesMap || {});
                xtypes = prototype.xtypes = prototype.xtypes ? [].concat(prototype.xtypes) : [];
                xtypesChain = prototype.xtypesChain = prototype.xtypesChain ? [].concat(prototype.xtypesChain) : [];
                prototype.xtype = xtype;
            }

            if (!xtypesMap[xtype]) {
                xtypesMap[xtype] = true;
                xtypes.push(xtype);
                xtypesChain.push(xtype);
                Carcasse.ClassManager.setAlias(this, 'widget.' + xtype);
            }

            return this;
        }
    });

    Base.implement({
        isInstance: true,

        $className: 'Carcasse.Base',

        configClass: Carcasse.emptyFn,

        initConfigList: [],

        initConfigMap: {},

        /**
         * Get the reference to the class from which this object was instantiated. Note that unlike {@link Carcasse.Base#self},
         * `this.statics()` is scope-independent and it always returns the class from which it was called, regardless of what
         * `this` points to during run-time
         *
         *     Carcasse.define('My.Cat', {
         *         statics: {
         *             totalCreated: 0,
         *             speciesName: 'Cat' // My.Cat.speciesName = 'Cat'
         *         },
         *
         *         constructor: function() {
         *             var statics = this.statics();
         *
         *             alert(statics.speciesName);     // always equals to 'Cat' no matter what 'this' refers to
         *                                             // equivalent to: My.Cat.speciesName
         *
         *             alert(this.self.speciesName);   // dependent on 'this'
         *
         *             statics.totalCreated++;
         *         },
         *
         *         clone: function() {
         *             var cloned = new this.self();                    // dependent on 'this'
         *
         *             cloned.groupName = this.statics().speciesName;   // equivalent to: My.Cat.speciesName
         *
         *             return cloned;
         *         }
         *     });
         *
         *
         *     Carcasse.define('My.SnowLeopard', {
         *         extend: 'My.Cat',
         *
         *         statics: {
         *             speciesName: 'Snow Leopard'     // My.SnowLeopard.speciesName = 'Snow Leopard'
         *         },
         *
         *         constructor: function() {
         *             this.callParent();
         *         }
         *     });
         *
         *     var cat = new My.Cat();                 // alerts 'Cat', then alerts 'Cat'
         *
         *     var snowLeopard = new My.SnowLeopard(); // alerts 'Cat', then alerts 'Snow Leopard'
         *
         *     var clone = snowLeopard.clone();
         *     alert(Carcasse.getClassName(clone));         // alerts 'My.SnowLeopard'
         *     alert(clone.groupName);                 // alerts 'Cat'
         *
         *     alert(My.Cat.totalCreated);             // alerts 3
         *
         * @protected
         * @return {Carcasse.Class}
         */
        statics: function() {
            var method = this.statics.caller,
                self = this.self;

            if (!method) {
                return self;
            }

            return method.$owner;
        },

        /**
         * Call the "parent" method of the current method. That is the method previously
         * overridden by derivation or by an override (see {@link Carcasse#define}).
         *
         *      Carcasse.define('My.Base', {
         *          constructor: function (x) {
         *              this.x = x;
         *          },
         *
         *          statics: {
         *              method: function (x) {
         *                  return x;
         *              }
         *          }
         *      });
         *
         *      Carcasse.define('My.Derived', {
         *          extend: 'My.Base',
         *
         *          constructor: function () {
         *              this.callParent([21]);
         *          }
         *      });
         *
         *      var obj = new My.Derived();
         *
         *      alert(obj.x);  // alerts 21
         *
         * This can be used with an override as follows:
         *
         *      Carcasse.define('My.DerivedOverride', {
         *          override: 'My.Derived',
         *
         *          constructor: function (x) {
         *              this.callParent([x*2]); // calls original My.Derived constructor
         *          }
         *      });
         *
         *      var obj = new My.Derived();
         *
         *      alert(obj.x);  // now alerts 42
         *
         * This also works with static methods.
         *
         *      Carcasse.define('My.Derived2', {
         *          extend: 'My.Base',
         *
         *          statics: {
         *              method: function (x) {
         *                  return this.callParent([x*2]); // calls My.Base.method
         *              }
         *          }
         *      });
         *
         *      alert(My.Base.method(10));     // alerts 10
         *      alert(My.Derived2.method(10)); // alerts 20
         *
         * Lastly, it also works with overridden static methods.
         *
         *      Carcasse.define('My.Derived2Override', {
         *          override: 'My.Derived2',
         *
         *          statics: {
         *              method: function (x) {
         *                  return this.callParent([x*2]); // calls My.Derived2.method
         *              }
         *          }
         *      });
         *
         *      alert(My.Derived2.method(10)); // now alerts 40
         * 
         * To override a method and replace it and also call the superclass method, use
         * {@link #callSuper}. This is often done to patch a method to fix a bug.
         *
         * @protected
         * @param {Array/Arguments} args The arguments, either an array or the `arguments` object
         * from the current method, for example: `this.callParent(arguments)`
         * @return {Object} Returns the result of calling the parent method
         */
        callParent: function(args) {
            // NOTE: this code is deliberately as few expressions (and no function calls)
            // as possible so that a debugger can skip over this noise with the minimum number
            // of steps. Basically, just hit Step Into until you are where you really wanted
            // to be.
            var method,
                superMethod = (method = this.callParent.caller) && (method.$previous ||
                        ((method = method.$owner ? method : method.caller) &&
                                method.$owner.superclass[method.$name]));

            //<debug error>
            if (!superMethod) {
                method = this.callParent.caller;
                var parentClass, methodName;

                if (!method.$owner) {
                    if (!method.caller) {
                        throw new Error("Attempting to call a protected method from the public scope, which is not allowed");
                    }

                    method = method.caller;
                }

                parentClass = method.$owner.superclass;
                methodName = method.$name;

                if (!(methodName in parentClass)) {
                    throw new Error("this.callParent() was called but there's no such method (" + methodName +
                                ") found in the parent class (" + (Carcasse.getClassName(parentClass) || 'Object') + ")");
                }
            }
            //</debug>

            return superMethod.apply(this, args || noArgs);
        },

        /**
         * This method is used by an override to call the superclass method but bypass any
         * overridden method. This is often done to "patch" a method that contains a bug
         * but for whatever reason cannot be fixed directly.
         * 
         * Consider:
         * 
         *      Carcasse.define('Carcasse.some.Class', {
         *          method: function () {
         *              console.log('Good');
         *          }
         *      });
         * 
         *      Carcasse.define('Carcasse.some.DerivedClass', {
         *          method: function () {
         *              console.log('Bad');
         * 
         *              // ... logic but with a bug ...
         *              
         *              this.callParent();
         *          }
         *      });
         * 
         * To patch the bug in `DerivedClass.method`, the typical solution is to create an
         * override:
         * 
         *      Carcasse.define('App.paches.DerivedClass', {
         *          override: 'Carcasse.some.DerivedClass',
         *          
         *          method: function () {
         *              console.log('Fixed');
         * 
         *              // ... logic but with bug fixed ...
         *
         *              this.callSuper();
         *          }
         *      });
         * 
         * The patch method cannot use `callParent` to call the superclass `method` since
         * that would call the overridden method containing the bug. In other words, the
         * above patch would only produce "Fixed" then "Good" in the console log, whereas,
         * using `callParent` would produce "Fixed" then "Bad" then "Good".
         *
         * @protected
         * @param {Array/Arguments} args The arguments, either an array or the `arguments` object
         * from the current method, for example: `this.callSuper(arguments)`
         * @return {Object} Returns the result of calling the superclass method
         */
        callSuper: function(args) {
            var method,
                superMethod = (method = this.callSuper.caller) && ((method = method.$owner ? method : method.caller) &&
                                method.$owner.superclass[method.$name]);

            //<debug error>
            if (!superMethod) {
                method = this.callSuper.caller;
                var parentClass, methodName;

                if (!method.$owner) {
                    if (!method.caller) {
                        throw new Error("Attempting to call a protected method from the public scope, which is not allowed");
                    }

                    method = method.caller;
                }

                parentClass = method.$owner.superclass;
                methodName = method.$name;

                if (!(methodName in parentClass)) {
                    throw new Error("this.callSuper() was called but there's no such method (" + methodName +
                                ") found in the parent class (" + (Carcasse.getClassName(parentClass) || 'Object') + ")");
                }
            }
            //</debug>

            return superMethod.apply(this, args || noArgs);
        },

        /**
         * Call the original method that was previously overridden with {@link Carcasse.Base#override},
         * 
         * This method is deprecated as {@link #callParent} does the same thing.
         *
         *     Carcasse.define('My.Cat', {
         *         constructor: function() {
         *             alert("I'm a cat!");
         *         }
         *     });
         *
         *     My.Cat.override({
         *         constructor: function() {
         *             alert("I'm going to be a cat!");
         *
         *             var instance = this.callOverridden();
         *
         *             alert("Meeeeoooowwww");
         *
         *             return instance;
         *         }
         *     });
         *
         *     var kitty = new My.Cat(); // alerts "I'm going to be a cat!"
         *                               // alerts "I'm a cat!"
         *                               // alerts "Meeeeoooowwww"
         *
         * @param {Array/Arguments} args The arguments, either an array or the `arguments` object
         * from the current method, for example: `this.callOverridden(arguments)`
         * @return {Object} Returns the result of calling the overridden method
         * @protected
         * @deprecated Use callParent instead
         */
        callOverridden: function(args) {
            var method;

            return (method = this.callOverridden.caller) && method.$previous.apply(this, args || noArgs);
        },

        /**
         * @property {Carcasse.Class} self
         *
         * Get the reference to the current class from which this object was instantiated. Unlike {@link Carcasse.Base#statics},
         * `this.self` is scope-dependent and it's meant to be used for dynamic inheritance. See {@link Carcasse.Base#statics}
         * for a detailed comparison
         *
         *     Carcasse.define('My.Cat', {
         *         statics: {
         *             speciesName: 'Cat' // My.Cat.speciesName = 'Cat'
         *         },
         *
         *         constructor: function() {
         *             alert(this.self.speciesName); // dependent on 'this'
         *         },
         *
         *         clone: function() {
         *             return new this.self();
         *         }
         *     });
         *
         *
         *     Carcasse.define('My.SnowLeopard', {
         *         extend: 'My.Cat',
         *         statics: {
         *             speciesName: 'Snow Leopard'         // My.SnowLeopard.speciesName = 'Snow Leopard'
         *         }
         *     });
         *
         *     var cat = new My.Cat();                     // alerts 'Cat'
         *     var snowLeopard = new My.SnowLeopard();     // alerts 'Snow Leopard'
         *
         *     var clone = snowLeopard.clone();
         *     alert(Carcasse.getClassName(clone));             // alerts 'My.SnowLeopard'
         *
         * @protected
         */
        self: Base,

        // Default constructor, simply returns `this`
        constructor: function() {
            return this;
        },

        //<feature classSystem.config>

        wasInstantiated: false,

        /**
         * Initialize configuration for this class. a typical example:
         *
         *     Carcasse.define('My.awesome.Class', {
         *         // The default config
         *         config: {
         *             name: 'Awesome',
         *             isAwesome: true
         *         },
         *
         *         constructor: function(config) {
         *             this.initConfig(config);
         *         }
         *     });
         *
         *     var awesome = new My.awesome.Class({
         *         name: 'Super Awesome'
         *     });
         *
         *     alert(awesome.getName()); // 'Super Awesome'
         *
         * @protected
         * @param {Object} instanceConfig
         * @return {Object} mixins The mixin prototypes as key - value pairs
         */
        initConfig: function(instanceConfig) {
            //<debug>
//            if (instanceConfig && instanceConfig.breakOnInitConfig) {
//                debugger;
//            }
            //</debug>
            var configNameCache = Carcasse.Class.configNameCache,
                prototype = this.self.prototype,
                initConfigList = this.initConfigList,
                initConfigMap = this.initConfigMap,
                config = new this.configClass,
                defaultConfig = this.defaultConfig,
                i, ln, name, value, nameMap, getName;

            this.initConfig = Carcasse.emptyFn;

            this.initialConfig = instanceConfig || {};

            if (instanceConfig) {
                Carcasse.merge(config, instanceConfig);
            }

            this.config = config;

            // Optimize initConfigList *once* per class based on the existence of apply* and update* methods
            // Happens only once during the first instantiation
            if (!prototype.hasOwnProperty('wasInstantiated')) {
                prototype.wasInstantiated = true;

                for (i = 0,ln = initConfigList.length; i < ln; i++) {
                    name = initConfigList[i];
                    nameMap = configNameCache[name];
                    value = defaultConfig[name];

                    if (!(nameMap.apply in prototype)
                        && !(nameMap.update in prototype)
                        && prototype[nameMap.set].$isDefault
                        && typeof value != 'object') {
                        prototype[nameMap.internal] = defaultConfig[name];
                        initConfigMap[name] = false;
                        Carcasse.Array.remove(initConfigList, name);
                        i--;
                        ln--;
                    }
                }
            }

            if (instanceConfig) {
                initConfigList = initConfigList.slice();

                for (name in instanceConfig) {
                    if (name in defaultConfig && !initConfigMap[name]) {
                        initConfigList.push(name);
                    }
                }
            }

            // Point all getters to the initGetters
            for (i = 0,ln = initConfigList.length; i < ln; i++) {
                name = initConfigList[i];
                nameMap = configNameCache[name];
                this[nameMap.get] = this[nameMap.initGet];
            }

            this.beforeInitConfig(config);

            for (i = 0,ln = initConfigList.length; i < ln; i++) {
                name = initConfigList[i];
                nameMap = configNameCache[name];
                getName = nameMap.get;

                if (this.hasOwnProperty(getName)) {
                    this[nameMap.set].call(this, config[name]);
                    delete this[getName];
                }
            }

            return this;
        },

        beforeInitConfig: Carcasse.emptyFn,

        /**
         * @private
         */
        getCurrentConfig: function() {
            var defaultConfig = this.defaultConfig,
                configNameCache = Carcasse.Class.configNameCache,
                config = {},
                name, nameMap;

            for (name in defaultConfig) {
                nameMap = configNameCache[name];
                config[name] = this[nameMap.get].call(this);
            }

            return config;
        },

        /**
         * @private
         */
        setConfig: function(config, applyIfNotSet) {
            if (!config) {
                return this;
            }

            var configNameCache = Carcasse.Class.configNameCache,
                currentConfig = this.config,
                defaultConfig = this.defaultConfig,
                initialConfig = this.initialConfig,
                configList = [],
                name, i, ln, nameMap;

            applyIfNotSet = Boolean(applyIfNotSet);

            for (name in config) {
                if ((applyIfNotSet && (name in initialConfig))) {
                    continue;
                }

                currentConfig[name] = config[name];

                if (name in defaultConfig) {
                    configList.push(name);
                    nameMap = configNameCache[name];
                    this[nameMap.get] = this[nameMap.initGet];
                }
            }

            for (i = 0,ln = configList.length; i < ln; i++) {
                name = configList[i];
                nameMap = configNameCache[name];
                this[nameMap.set].call(this, config[name]);
                delete this[nameMap.get];
            }

            return this;
        },

        set: function(name, value) {
            return this[Carcasse.Class.configNameCache[name].set].call(this, value);
        },

        get: function(name) {
            return this[Carcasse.Class.configNameCache[name].get].call(this);
        },

        /**
         * @private
         */
        getConfig: function(name) {
            return this[Carcasse.Class.configNameCache[name].get].call(this);
        },

        /**
         * @private
         */
        hasConfig: function(name) {
            return (name in this.defaultConfig);
        },

        /**
         * Returns the initial configuration passed to constructor.
         *
         * @param {String} [name] When supplied, value for particular configuration
         * option is returned, otherwise the full config object is returned.
         * @return {Object/Mixed}
         */
        getInitialConfig: function(name) {
            var config = this.config;

            if (!name) {
                return config;
            }
            else {
                return config[name];
            }
        },

        /**
         * @private
         */
        onConfigUpdate: function(names, callback, scope) {
            var self = this.self,
                //<debug>
                className = self.$className,
                //</debug>
                i, ln, name,
                updaterName, updater, newUpdater;

            names = Carcasse.Array.from(names);

            scope = scope || this;

            for (i = 0,ln = names.length; i < ln; i++) {
                name = names[i];
                updaterName = 'update' + Carcasse.String.capitalize(name);
                updater = this[updaterName] || Carcasse.emptyFn;
                newUpdater = function() {
                    updater.apply(this, arguments);
                    scope[callback].apply(scope, arguments);
                };
                newUpdater.$name = updaterName;
                newUpdater.$owner = self;
                //<debug>
                newUpdater.displayName = className + '#' + updaterName;
                //</debug>

                this[updaterName] = newUpdater;
            }
        },
        //</feature>

        /**
         * @private
         * @param name
         * @param value
         * @return {Mixed}
         */
        link: function(name, value) {
            this.$links = {};
            this.link = this.doLink;
            return this.link.apply(this, arguments);
        },

        doLink: function(name, value) {
            this.$links[name] = true;

            this[name] = value;

            return value;
        },

        /**
         * @private
         */
        unlink: function() {
            var i, ln, link, value;

            for (i = 0, ln = arguments.length; i < ln; i++) {
                link = arguments[i];
                if (this.hasOwnProperty(link)) {
                    value = this[link];
                    if (value) {
                        if (value.isInstance && !value.isDestroyed) {
                            value.destroy();
                        }
                        else if (value.parentNode && 'nodeType' in value) {
                            value.parentNode.removeChild(value);
                        }
                    }
                    delete this[link];
                }
            }

            return this;
        },

        /**
         * @protected
         */
        destroy: function() {
            this.destroy = Carcasse.emptyFn;
            this.isDestroyed = true;

            if (this.hasOwnProperty('$links')) {
                this.unlink.apply(this, Carcasse.Object.getKeys(this.$links));
                delete this.$links;
            }
        }
    });

    Carcasse.Base = Base;

})(Carcasse.Function.flexSetter);

//@tag foundation,core
//@define Carcasse.Class
//@require Carcasse.Base

/**
 * @class Carcasse.Class
 *
 * @author Jacky Nguyen <jacky@sencha.com>
 * @aside guide class_system
 * @aside video class-system
 *
 * Handles class creation throughout the framework. This is a low level factory that is used by Carcasse.ClassManager and generally
 * should not be used directly. If you choose to use Carcasse.Class you will lose out on the namespace, aliasing and dependency loading
 * features made available by Carcasse.ClassManager. The only time you would use Carcasse.Class directly is to create an anonymous class.
 *
 * If you wish to create a class you should use {@link Carcasse#define Carcasse.define} which aliases
 * {@link Carcasse.ClassManager#create Carcasse.ClassManager.create} to enable namespacing and dynamic dependency resolution.
 *
 * Carcasse.Class is the factory and **not** the superclass of everything. For the base class that **all** Carcasse classes inherit
 * from, see {@link Carcasse.Base}.
 */
(function() {
    var CarcasseClass,
        Base = Carcasse.Base,
        baseStaticMembers = [],
        baseStaticMember, baseStaticMemberLength;

    for (baseStaticMember in Base) {
        if (Base.hasOwnProperty(baseStaticMember)) {
            baseStaticMembers.push(baseStaticMember);
        }
    }

    baseStaticMemberLength = baseStaticMembers.length;

    /**
     * @method constructor
     * Creates a new anonymous class.
     *
     * @param {Object} data An object represent the properties of this class.
     * @param {Function} onCreated (optional) The callback function to be executed when this class is fully created.
     * Note that the creation process can be asynchronous depending on the pre-processors used.
     *
     * @return {Carcasse.Base} The newly created class
     */
    Carcasse.Class = CarcasseClass = function(Class, data, onCreated) {
        if (typeof Class != 'function') {
            onCreated = data;
            data = Class;
            Class = null;
        }

        if (!data) {
            data = {};
        }

        Class = CarcasseClass.create(Class);

        CarcasseClass.process(Class, data, onCreated);

        return Class;
    };

    Carcasse.apply(CarcasseClass, {
        /**
         * @private
         * @static
         */
        onBeforeCreated: function(Class, data, hooks) {
            Class.addMembers(data);

            hooks.onCreated.call(Class, Class);
        },

        /**
         * @private
         * @static
         */
        create: function(Class) {
            var name, i;

            if (!Class) {
                Class = function() {
                    return this.constructor.apply(this, arguments);
                };
            }

            for (i = 0; i < baseStaticMemberLength; i++) {
                name = baseStaticMembers[i];
                Class[name] = Base[name];
            }

            return Class;
        },

        /**
         * @private
         * @static
         */
        process: function(Class, data, onCreated) {
            var preprocessorStack = data.preprocessors || CarcasseClass.defaultPreprocessors,
                preprocessors = this.preprocessors,
                hooks = {
                    onBeforeCreated: this.onBeforeCreated,
                    onCreated: onCreated || Carcasse.emptyFn
                },
                index = 0,
                name, preprocessor, properties,
                i, ln, fn, property, process;

            delete data.preprocessors;

            process = function(Class, data, hooks) {
                fn = null;

                while (fn === null) {
                    name = preprocessorStack[index++];

                    if (name) {
                        preprocessor = preprocessors[name];
                        properties = preprocessor.properties;

                        if (properties === true) {
                            fn = preprocessor.fn;
                        }
                        else {
                            for (i = 0,ln = properties.length; i < ln; i++) {
                                property = properties[i];

                                if (data.hasOwnProperty(property)) {
                                    fn = preprocessor.fn;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        hooks.onBeforeCreated.apply(this, arguments);
                        return;
                    }
                }

                if (fn.call(this, Class, data, hooks, process) !== false) {
                    process.apply(this, arguments);
                }
            };

            process.call(this, Class, data, hooks);
        },

        /**
         * @private
         * @static
         */
        preprocessors: {},

        /**
         * Register a new pre-processor to be used during the class creation process.
         *
         * @private
         * @static
         * @param {String} name The pre-processor's name.
         * @param {Function} fn The callback function to be executed. Typical format:
         *
         *     function(cls, data, fn) {
         *         // Your code here
         *
         *         // Execute this when the processing is finished.
         *         // Asynchronous processing is perfectly OK
         *         if (fn) {
         *             fn.call(this, cls, data);
         *         }
         *     });
         *
         * @param {Function} fn.cls The created class.
         * @param {Object} fn.data The set of properties passed in {@link Carcasse.Class} constructor.
         * @param {Function} fn.fn The callback function that __must__ to be executed when this pre-processor finishes,
         * regardless of whether the processing is synchronous or asynchronous.
         *
         * @return {Carcasse.Class} this
         */
        registerPreprocessor: function(name, fn, properties, position, relativeTo) {
            if (!position) {
                position = 'last';
            }

            if (!properties) {
                properties = [name];
            }

            this.preprocessors[name] = {
                name: name,
                properties: properties || false,
                fn: fn
            };

            this.setDefaultPreprocessorPosition(name, position, relativeTo);

            return this;
        },

        /**
         * Retrieve a pre-processor callback function by its name, which has been registered before.
         *
         * @private
         * @static
         * @param {String} name
         * @return {Function} preprocessor
         */
        getPreprocessor: function(name) {
            return this.preprocessors[name];
        },

        /**
         * @private
         * @static
         */
        getPreprocessors: function() {
            return this.preprocessors;
        },

        /**
         * @private
         * @static
         */
        defaultPreprocessors: [],

        /**
         * Retrieve the array stack of default pre-processors.
         * @private
         * @static
         * @return {Function} defaultPreprocessors
         */
        getDefaultPreprocessors: function() {
            return this.defaultPreprocessors;
        },

        /**
         * Set the default array stack of default pre-processors.
         *
         * @private
         * @static
         * @param {Array} preprocessors
         * @return {Carcasse.Class} this
         */
        setDefaultPreprocessors: function(preprocessors) {
            this.defaultPreprocessors = Carcasse.Array.from(preprocessors);

            return this;
        },

        /**
         * Insert this pre-processor at a specific position in the stack, optionally relative to
         * any existing pre-processor. For example:
         *
         *     Carcasse.Class.registerPreprocessor('debug', function(cls, data, fn) {
         *         // Your code here
         *
         *         if (fn) {
         *             fn.call(this, cls, data);
         *         }
         *     }).insertDefaultPreprocessor('debug', 'last');
         *
         * @private
         * @static
         * @param {String} name The pre-processor name. Note that it needs to be registered with
         * {@link Carcasse.Class#registerPreprocessor registerPreprocessor} before this.
         * @param {String} offset The insertion position. Four possible values are:
         * 'first', 'last', or: 'before', 'after' (relative to the name provided in the third argument).
         * @param {String} relativeName
         * @return {Carcasse.Class} this
         */
        setDefaultPreprocessorPosition: function(name, offset, relativeName) {
            var defaultPreprocessors = this.defaultPreprocessors,
                index;

            if (typeof offset == 'string') {
                if (offset === 'first') {
                    defaultPreprocessors.unshift(name);

                    return this;
                }
                else if (offset === 'last') {
                    defaultPreprocessors.push(name);

                    return this;
                }

                offset = (offset === 'after') ? 1 : -1;
            }

            index = Carcasse.Array.indexOf(defaultPreprocessors, relativeName);

            if (index !== -1) {
                Carcasse.Array.splice(defaultPreprocessors, Math.max(0, index + offset), 0, name);
            }

            return this;
        },

        /**
         * @private
         * @static
         */
        configNameCache: {},

        /**
         * @private
         * @static
         */
        getConfigNameMap: function(name) {
            var cache = this.configNameCache,
                map = cache[name],
                capitalizedName;

            if (!map) {
                capitalizedName = name.charAt(0).toUpperCase() + name.substr(1);

                map = cache[name] = {
                    name: name,
                    internal: '_' + name,
                    initializing: 'is' + capitalizedName + 'Initializing',
                    apply: 'apply' + capitalizedName,
                    update: 'update' + capitalizedName,
                    set: 'set' + capitalizedName,
                    get: 'get' + capitalizedName,
                    initGet: 'initGet' + capitalizedName,
                    doSet : 'doSet' + capitalizedName,
                    changeEvent: name.toLowerCase() + 'change'
                }
            }

            return map;
        },

        /**
         * @private
         * @static
         */
        generateSetter: function(nameMap) {
            var internalName = nameMap.internal,
                getName = nameMap.get,
                applyName = nameMap.apply,
                updateName = nameMap.update,
                setter;

            setter = function(value) {
                var oldValue = this[internalName],
                    applier = this[applyName],
                    updater = this[updateName];

                delete this[getName];

                if (applier) {
                    value = applier.call(this, value, oldValue);
                }

                if (typeof value != 'undefined') {
                    this[internalName] = value;

                    if (updater && value !== oldValue) {
                        updater.call(this, value, oldValue);
                    }
                }

                return this;
            };

            setter.$isDefault = true;

            return setter;
        },

        /**
         * @private
         * @static
         */
        generateInitGetter: function(nameMap) {
            var name = nameMap.name,
                setName = nameMap.set,
                getName = nameMap.get,
                initializingName = nameMap.initializing;

            return function() {
                this[initializingName] = true;
                delete this[getName];

                this[setName].call(this, this.config[name]);
                delete this[initializingName];

                return this[getName].apply(this, arguments);
            }
        },

        /**
         * @private
         * @static
         */
        generateGetter: function(nameMap) {
            var internalName = nameMap.internal;

            return function() {
                return this[internalName];
            }
        }
    });

    /**
     * @cfg {String} extend
     * The parent class that this class extends. For example:
     *
     *     @example
     *     Carcasse.define('Person', {
     *         say: function(text) {
     *             alert(text);
     *         }
     *     });
     *
     *     Carcasse.define('Developer', {
     *         extend: 'Person',
     *         say: function(text) {
     *             this.callParent(["print " + text]);
     *         }
     *     });
     *
     *     var person1 = Carcasse.create("Person");
     *     person1.say("Bill");
     *
     *     var developer1 = Carcasse.create("Developer");
     *     developer1.say("Ted");
     */
    CarcasseClass.registerPreprocessor('extend', function(Class, data) {
        var Base = Carcasse.Base,
            extend = data.extend,
            Parent;

        delete data.extend;

        if (extend && extend !== Object) {
            Parent = extend;
        }
        else {
            Parent = Base;
        }

        Class.extend(Parent);

        Class.triggerCarcasseended.apply(Class, arguments);

        if (data.onClassCarcasseended) {
            Class.onCarcasseended(data.onClassCarcasseended, Class);
            delete data.onClassCarcasseended;
        }

    }, true);

    //<feature classSystem.statics>
    /**
     * @cfg {Object} statics
     * List of static methods for this class. For example:
     *
     *     Carcasse.define('Computer', {
     *          statics: {
     *              factory: function(brand) {
     *                  // 'this' in static methods refer to the class itself
     *                  return new this(brand);
     *              }
     *          },
     *
     *          constructor: function() {
     *              // ...
     *          }
     *     });
     *
     *     var dellComputer = Computer.factory('Dell');
     */
    CarcasseClass.registerPreprocessor('statics', function(Class, data) {
        Class.addStatics(data.statics);

        delete data.statics;
    });
    //</feature>

    //<feature classSystem.inheritableStatics>
    /**
     * @cfg {Object} inheritableStatics
     * List of inheritable static methods for this class.
     * Otherwise just like {@link #statics} but subclasses inherit these methods.
     */
    CarcasseClass.registerPreprocessor('inheritableStatics', function(Class, data) {
        Class.addInheritableStatics(data.inheritableStatics);

        delete data.inheritableStatics;
    });
    //</feature>

    //<feature classSystem.config>
    /**
     * @cfg {Object} config
     *
     * List of configuration options with their default values.
     *
     * __Note:__ You need to make sure {@link Carcasse.Base#initConfig} is called from your constructor if you are defining
     * your own class or singleton, unless you are extending a Component. Otherwise the generated getter and setter
     * methods will not be initialized.
     *
     * Each config item will have its own setter and getter method automatically generated inside the class prototype
     * during class creation time, if the class does not have those methods explicitly defined.
     *
     * As an example, let's convert the name property of a Person class to be a config item, then add extra age and
     * gender items.
     *
     *     Carcasse.define('My.sample.Person', {
     *         config: {
     *             name: 'Mr. Unknown',
     *             age: 0,
     *             gender: 'Male'
     *         },
     *
     *         constructor: function(config) {
     *             this.initConfig(config);
     *
     *             return this;
     *         }
     *
     *         // ...
     *     });
     *
     * Within the class, this.name still has the default value of "Mr. Unknown". However, it's now publicly accessible
     * without sacrificing encapsulation, via setter and getter methods.
     *
     *     var jacky = new Person({
     *         name: "Jacky",
     *         age: 35
     *     });
     *
     *     alert(jacky.getAge());      // alerts 35
     *     alert(jacky.getGender());   // alerts "Male"
     *
     *     jacky.walk(10);             // alerts "Jacky is walking 10 steps"
     *
     *     jacky.setName("Mr. Nguyen");
     *     alert(jacky.getName());     // alerts "Mr. Nguyen"
     *
     *     jacky.walk(10);             // alerts "Mr. Nguyen is walking 10 steps"
     *
     * Notice that we changed the class constructor to invoke this.initConfig() and pass in the provided config object.
     * Two key things happened:
     *
     *  - The provided config object when the class is instantiated is recursively merged with the default config object.
     *  - All corresponding setter methods are called with the merged values.
     *
     * Beside storing the given values, throughout the frameworks, setters generally have two key responsibilities:
     *
     *  - Filtering / validation / transformation of the given value before it's actually stored within the instance.
     *  - Notification (such as firing events) / post-processing after the value has been set, or changed from a
     *    previous value.
     *
     * By standardize this common pattern, the default generated setters provide two extra template methods that you
     * can put your own custom logics into, i.e: an "applyFoo" and "updateFoo" method for a "foo" config item, which are
     * executed before and after the value is actually set, respectively. Back to the example class, let's validate that
     * age must be a valid positive number, and fire an 'agechange' if the value is modified.
     *
     *     Carcasse.define('My.sample.Person', {
     *         config: {
     *             // ...
     *         },
     *
     *         constructor: {
     *             // ...
     *         },
     *
     *         applyAge: function(age) {
     *             if (typeof age !== 'number' || age < 0) {
     *                 console.warn("Invalid age, must be a positive number");
     *                 return;
     *             }
     *
     *             return age;
     *         },
     *
     *         updateAge: function(newAge, oldAge) {
     *             // age has changed from "oldAge" to "newAge"
     *             this.fireEvent('agechange', this, newAge, oldAge);
     *         }
     *
     *         // ...
     *     });
     *
     *     var jacky = new Person({
     *         name: "Jacky",
     *         age: 'invalid'
     *     });
     *
     *     alert(jacky.getAge());      // alerts 0
     *
     *     alert(jacky.setAge(-100));  // alerts 0
     *     alert(jacky.getAge());      // alerts 0
     *
     *     alert(jacky.setAge(35));    // alerts 0
     *     alert(jacky.getAge());      // alerts 35
     *
     * In other words, when leveraging the config feature, you mostly never need to define setter and getter methods
     * explicitly. Instead, "apply*" and "update*" methods should be implemented where necessary. Your code will be
     * consistent throughout and only contain the minimal logic that you actually care about.
     *
     * When it comes to inheritance, the default config of the parent class is automatically, recursively merged with
     * the child's default config. The same applies for mixins.
     */
    CarcasseClass.registerPreprocessor('config', function(Class, data) {
        var config = data.config,
            prototype = Class.prototype,
            defaultConfig = prototype.config,
            nameMap, name, setName, getName, initGetName, internalName, value;

        delete data.config;

        for (name in config) {
            // Once per config item, per class hierarchy
            if (config.hasOwnProperty(name) && !(name in defaultConfig)) {
                value = config[name];
                nameMap = this.getConfigNameMap(name);
                setName = nameMap.set;
                getName = nameMap.get;
                initGetName = nameMap.initGet;
                internalName = nameMap.internal;

                data[initGetName] = this.generateInitGetter(nameMap);

                if (value === null && !data.hasOwnProperty(internalName)) {
                    data[internalName] = null;
                }

                if (!data.hasOwnProperty(getName)) {
                    data[getName] = this.generateGetter(nameMap);
                }

                if (!data.hasOwnProperty(setName)) {
                    data[setName] = this.generateSetter(nameMap);
                }
            }
        }

        Class.addConfig(config, true);
    });
    //</feature>

    //<feature classSystem.mixins>
    /**
     * @cfg {Object} mixins
     * List of classes to mix into this class. For example:
     *
     *     Carcasse.define('CanSing', {
     *          sing: function() {
     *              alert("I'm on the highway to hell...");
     *          }
     *     });
     *
     *     Carcasse.define('Musician', {
     *          extend: 'Person',
     *
     *          mixins: {
     *              canSing: 'CanSing'
     *          }
     *     });
     */
    CarcasseClass.registerPreprocessor('mixins', function(Class, data, hooks) {
        var mixins = data.mixins,
            name, mixin, i, ln;

        delete data.mixins;

        Carcasse.Function.interceptBefore(hooks, 'onCreated', function() {
            if (mixins instanceof Array) {
                for (i = 0,ln = mixins.length; i < ln; i++) {
                    mixin = mixins[i];
                    name = mixin.prototype.mixinId || mixin.$className;

                    Class.mixin(name, mixin);
                }
            }
            else {
                for (name in mixins) {
                    if (mixins.hasOwnProperty(name)) {
                        Class.mixin(name, mixins[name]);
                    }
                }
            }
        });
    });
    //</feature>

    //<feature classSystem.backwardsCompatible>
    // Backwards compatible
    Carcasse.extend = function(Class, Parent, members) {
        if (arguments.length === 2 && Carcasse.isObject(Parent)) {
            members = Parent;
            Parent = Class;
            Class = null;
        }

        var cls;

        if (!Parent) {
            throw new Error("[Carcasse.extend] Attempting to extend from a class which has not been loaded on the page.");
        }

        members.extend = Parent;
        members.preprocessors = [
            'extend'
            //<feature classSystem.statics>
            ,'statics'
            //</feature>
            //<feature classSystem.inheritableStatics>
            ,'inheritableStatics'
            //</feature>
            //<feature classSystem.mixins>
            ,'mixins'
            //</feature>
            //<feature classSystem.config>
            ,'config'
            //</feature>
        ];

        if (Class) {
            cls = new CarcasseClass(Class, members);
        }
        else {
            cls = new CarcasseClass(members);
        }

        cls.prototype.override = function(o) {
            for (var m in o) {
                if (o.hasOwnProperty(m)) {
                    this[m] = o[m];
                }
            }
        };

        return cls;
    };
    //</feature>
})();

//@tag foundation,core
//@define Carcasse.ClassManager
//@require Carcasse.Class

/**
 * @class  Carcasse.ClassManager
 *
 * @author Jacky Nguyen <jacky@sencha.com>
 * @aside guide class_system
 * @aside video class-system
 *
 * Carcasse.ClassManager manages all classes and handles mapping from string class name to
 * actual class objects throughout the whole framework. It is not generally accessed directly, rather through
 * these convenient shorthands:
 *
 * - {@link Carcasse#define Carcasse.define}
 * - {@link Carcasse.ClassManager#create Carcasse.create}
 * - {@link Carcasse#widget Carcasse.widget}
 * - {@link Carcasse#getClass Carcasse.getClass}
 * - {@link Carcasse#getClassName Carcasse.getClassName}
 *
 * ## Basic syntax:
 *
 *     Carcasse.define(className, properties);
 *
 * in which `properties` is an object represent a collection of properties that apply to the class. See
 * {@link Carcasse.ClassManager#create} for more detailed instructions.
 *
 *     @example
 *     Carcasse.define('Person', {
 *          name: 'Unknown',
 *
 *          constructor: function(name) {
 *              if (name) {
 *                  this.name = name;
 *              }
 *
 *              return this;
 *          },
 *
 *          eat: function(foodType) {
 *              alert("I'm eating: " + foodType);
 *
 *              return this;
 *          }
 *     });
 *
 *     var aaron = new Person("Aaron");
 *     aaron.eat("Sandwich"); // alert("I'm eating: Sandwich");
 *
 * Carcasse.Class has a powerful set of extensible {@link Carcasse.Class#registerPreprocessor pre-processors} which takes care of
 * everything related to class creation, including but not limited to inheritance, mixins, configuration, statics, etc.
 *
 * ## Inheritance:
 *
 *     Carcasse.define('Developer', {
 *          extend: 'Person',
 *
 *          constructor: function(name, isGeek) {
 *              this.isGeek = isGeek;
 *
 *              // Apply a method from the parent class' prototype
 *              this.callParent([name]);
 *
 *              return this;
 *
 *          },
 *
 *          code: function(language) {
 *              alert("I'm coding in: " + language);
 *
 *              this.eat("Bugs");
 *
 *              return this;
 *          }
 *     });
 *
 *     var jacky = new Developer("Jacky", true);
 *     jacky.code("JavaScript"); // alert("I'm coding in: JavaScript");
 *                               // alert("I'm eating: Bugs");
 *
 * See {@link Carcasse.Base#callParent} for more details on calling superclass' methods
 *
 * ## Mixins:
 *
 *     Carcasse.define('CanPlayGuitar', {
 *          playGuitar: function() {
 *             alert("F#...G...D...A");
 *          }
 *     });
 *
 *     Carcasse.define('CanComposeSongs', {
 *          composeSongs: function() { }
 *     });
 *
 *     Carcasse.define('CanSing', {
 *          sing: function() {
 *              alert("I'm on the highway to hell...");
 *          }
 *     });
 *
 *     Carcasse.define('Musician', {
 *          extend: 'Person',
 *
 *          mixins: {
 *              canPlayGuitar: 'CanPlayGuitar',
 *              canComposeSongs: 'CanComposeSongs',
 *              canSing: 'CanSing'
 *          }
 *     });
 *
 *     Carcasse.define('CoolPerson', {
 *          extend: 'Person',
 *
 *          mixins: {
 *              canPlayGuitar: 'CanPlayGuitar',
 *              canSing: 'CanSing'
 *          },
 *
 *          sing: function() {
 *              alert("Ahem...");
 *
 *              this.mixins.canSing.sing.call(this);
 *
 *              alert("[Playing guitar at the same time...]");
 *
 *              this.playGuitar();
 *          }
 *     });
 *
 *     var me = new CoolPerson("Jacky");
 *
 *     me.sing(); // alert("Ahem...");
 *                // alert("I'm on the highway to hell...");
 *                // alert("[Playing guitar at the same time...]");
 *                // alert("F#...G...D...A");
 *
 * ## Config:
 *
 *     Carcasse.define('SmartPhone', {
 *          config: {
 *              hasTouchScreen: false,
 *              operatingSystem: 'Other',
 *              price: 500
 *          },
 *
 *          isExpensive: false,
 *
 *          constructor: function(config) {
 *              this.initConfig(config);
 *
 *              return this;
 *          },
 *
 *          applyPrice: function(price) {
 *              this.isExpensive = (price > 500);
 *
 *              return price;
 *          },
 *
 *          applyOperatingSystem: function(operatingSystem) {
 *              if (!(/^(iOS|Android|BlackBerry)$/i).test(operatingSystem)) {
 *                  return 'Other';
 *              }
 *
 *              return operatingSystem;
 *          }
 *     });
 *
 *     var iPhone = new SmartPhone({
 *          hasTouchScreen: true,
 *          operatingSystem: 'iOS'
 *     });
 *
 *     iPhone.getPrice(); // 500;
 *     iPhone.getOperatingSystem(); // 'iOS'
 *     iPhone.getHasTouchScreen(); // true;
 *
 *     iPhone.isExpensive; // false;
 *     iPhone.setPrice(600);
 *     iPhone.getPrice(); // 600
 *     iPhone.isExpensive; // true;
 *
 *     iPhone.setOperatingSystem('AlienOS');
 *     iPhone.getOperatingSystem(); // 'Other'
 *
 * ## Statics:
 *
 *     Carcasse.define('Computer', {
 *          statics: {
 *              factory: function(brand) {
 *                 // 'this' in static methods refer to the class itself
 *                  return new this(brand);
 *              }
 *          },
 *
 *          constructor: function() { }
 *     });
 *
 *     var dellComputer = Computer.factory('Dell');
 *
 * Also see {@link Carcasse.Base#statics} and {@link Carcasse.Base#self} for more details on accessing
 * static properties within class methods
 *
 * @singleton
 */
(function(Class, alias, arraySlice, arrayFrom, global) {
    var Manager = Carcasse.ClassManager = {

        /**
         * @property classes
         * @type Object
         * All classes which were defined through the ClassManager. Keys are the
         * name of the classes and the values are references to the classes.
         * @private
         */
        classes: {},

        /**
         * @private
         */
        existCache: {},

        /**
         * @private
         */
        namespaceRewrites: [{
            from: 'Carcasse.',
            to: Carcasse
        }],

        /**
         * @private
         */
        maps: {
            alternateToName: {},
            aliasToName: {},
            nameToAliases: {},
            nameToAlternates: {}
        },

        /** @private */
        enableNamespaceParseCache: true,

        /** @private */
        namespaceParseCache: {},

        /** @private */
        instantiators: [],

        /**
         * Checks if a class has already been created.
         *
         * @param {String} className
         * @return {Boolean} exist
         */
        isCreated: function(className) {
            var existCache = this.existCache,
                i, ln, part, root, parts;

            //<debug error>
            if (typeof className != 'string' || className.length < 1) {
                throw new Error("[Carcasse.ClassManager] Invalid classname, must be a string and must not be empty");
            }
            //</debug>

            if (this.classes[className] || existCache[className]) {
                return true;
            }

            root = global;
            parts = this.parseNamespace(className);

            for (i = 0, ln = parts.length; i < ln; i++) {
                part = parts[i];

                if (typeof part != 'string') {
                    root = part;
                } else {
                    if (!root || !root[part]) {
                        return false;
                    }

                    root = root[part];
                }
            }

            existCache[className] = true;

            this.triggerCreated(className);

            return true;
        },

        /**
         * @private
         */
        createdListeners: [],

        /**
         * @private
         */
        nameCreatedListeners: {},

        /**
         * @private
         */
        triggerCreated: function(className) {
            var listeners = this.createdListeners,
                nameListeners = this.nameCreatedListeners,
                alternateNames = this.maps.nameToAlternates[className],
                names = [className],
                i, ln, j, subLn, listener, name;

            for (i = 0,ln = listeners.length; i < ln; i++) {
                listener = listeners[i];
                listener.fn.call(listener.scope, className);
            }

            if (alternateNames) {
                names.push.apply(names, alternateNames);
            }

            for (i = 0,ln = names.length; i < ln; i++) {
                name = names[i];
                listeners = nameListeners[name];

                if (listeners) {
                    for (j = 0,subLn = listeners.length; j < subLn; j++) {
                        listener = listeners[j];
                        listener.fn.call(listener.scope, name);
                    }
                    delete nameListeners[name];
                }
            }
        },

        /**
         * @private
         */
        onCreated: function(fn, scope, className) {
            var listeners = this.createdListeners,
                nameListeners = this.nameCreatedListeners,
                listener = {
                    fn: fn,
                    scope: scope
                };

            if (className) {
                if (this.isCreated(className)) {
                    fn.call(scope, className);
                    return;
                }

                if (!nameListeners[className]) {
                    nameListeners[className] = [];
                }

                nameListeners[className].push(listener);
            }
            else {
                listeners.push(listener);
            }
        },

        /**
         * Supports namespace rewriting.
         * @private
         */
        parseNamespace: function(namespace) {
            //<debug error>
            if (typeof namespace != 'string') {
                throw new Error("[Carcasse.ClassManager] Invalid namespace, must be a string");
            }
            //</debug>

            var cache = this.namespaceParseCache;

            if (this.enableNamespaceParseCache) {
                if (cache.hasOwnProperty(namespace)) {
                    return cache[namespace];
                }
            }

            var parts = [],
                rewrites = this.namespaceRewrites,
                root = global,
                name = namespace,
                rewrite, from, to, i, ln;

            for (i = 0, ln = rewrites.length; i < ln; i++) {
                rewrite = rewrites[i];
                from = rewrite.from;
                to = rewrite.to;

                if (name === from || name.substring(0, from.length) === from) {
                    name = name.substring(from.length);

                    if (typeof to != 'string') {
                        root = to;
                    } else {
                        parts = parts.concat(to.split('.'));
                    }

                    break;
                }
            }

            parts.push(root);

            parts = parts.concat(name.split('.'));

            if (this.enableNamespaceParseCache) {
                cache[namespace] = parts;
            }

            return parts;
        },

        /**
         * Creates a namespace and assign the `value` to the created object.
         *
         *     Carcasse.ClassManager.setNamespace('MyCompany.pkg.Example', someObject);
         *     alert(MyCompany.pkg.Example === someObject); // alerts true
         *
         * @param {String} name
         * @param {Mixed} value
         */
        setNamespace: function(name, value) {
            var root = global,
                parts = this.parseNamespace(name),
                ln = parts.length - 1,
                leaf = parts[ln],
                i, part;

            for (i = 0; i < ln; i++) {
                part = parts[i];

                if (typeof part != 'string') {
                    root = part;
                } else {
                    if (!root[part]) {
                        root[part] = {};
                    }

                    root = root[part];
                }
            }

            root[leaf] = value;

            return root[leaf];
        },

        /**
         * The new Carcasse.ns, supports namespace rewriting.
         * @private
         */
        createNamespaces: function() {
            var root = global,
                parts, part, i, j, ln, subLn;

            for (i = 0, ln = arguments.length; i < ln; i++) {
                parts = this.parseNamespace(arguments[i]);

                for (j = 0, subLn = parts.length; j < subLn; j++) {
                    part = parts[j];

                    if (typeof part != 'string') {
                        root = part;
                    } else {
                        if (!root[part]) {
                            root[part] = {};
                        }

                        root = root[part];
                    }
                }
            }

            return root;
        },

        /**
         * Sets a name reference to a class.
         *
         * @param {String} name
         * @param {Object} value
         * @return {Carcasse.ClassManager} this
         */
        set: function(name, value) {
            var me = this,
                maps = me.maps,
                nameToAlternates = maps.nameToAlternates,
                targetName = me.getName(value),
                alternates;

            me.classes[name] = me.setNamespace(name, value);

            if (targetName && targetName !== name) {
                maps.alternateToName[name] = targetName;
                alternates = nameToAlternates[targetName] || (nameToAlternates[targetName] = []);
                alternates.push(name);
            }

            return this;
        },

        /**
         * Retrieve a class by its name.
         *
         * @param {String} name
         * @return {Carcasse.Class} class
         */
        get: function(name) {
            var classes = this.classes;

            if (classes[name]) {
                return classes[name];
            }

            var root = global,
                parts = this.parseNamespace(name),
                part, i, ln;

            for (i = 0, ln = parts.length; i < ln; i++) {
                part = parts[i];

                if (typeof part != 'string') {
                    root = part;
                } else {
                    if (!root || !root[part]) {
                        return null;
                    }

                    root = root[part];
                }
            }

            return root;
        },

        /**
         * Register the alias for a class.
         *
         * @param {Carcasse.Class/String} cls a reference to a class or a `className`.
         * @param {String} alias Alias to use when referring to this class.
         */
        setAlias: function(cls, alias) {
            var aliasToNameMap = this.maps.aliasToName,
                nameToAliasesMap = this.maps.nameToAliases,
                className;

            if (typeof cls == 'string') {
                className = cls;
            } else {
                className = this.getName(cls);
            }

            if (alias && aliasToNameMap[alias] !== className) {
                //<debug info>
                if (aliasToNameMap[alias]) {
                    Carcasse.Logger.info("[Carcasse.ClassManager] Overriding existing alias: '" + alias + "' " +
                        "of: '" + aliasToNameMap[alias] + "' with: '" + className + "'. Be sure it's intentional.");
                }
                //</debug>

                aliasToNameMap[alias] = className;
            }

            if (!nameToAliasesMap[className]) {
                nameToAliasesMap[className] = [];
            }

            if (alias) {
                Carcasse.Array.include(nameToAliasesMap[className], alias);
            }

            return this;
        },

        /**
         * Adds a batch of class name to alias mappings
         * @param {Object} aliases The set of mappings of the form
         * className : [values...]
         */
        addNameAliasMappings: function(aliases){
            var aliasToNameMap = this.maps.aliasToName,
                nameToAliasesMap = this.maps.nameToAliases,
                className, aliasList, alias, i;

            for (className in aliases) {
                aliasList = nameToAliasesMap[className] ||
                    (nameToAliasesMap[className] = []);

                for (i = 0; i < aliases[className].length; i++) {
                    alias = aliases[className][i];
                    if (!aliasToNameMap[alias]) {
                        aliasToNameMap[alias] = className;
                        aliasList.push(alias);
                    }
                }

            }
            return this;
        },

        /**
         *
         * @param {Object} alternates The set of mappings of the form
         * className : [values...]
         */
        addNameAlternateMappings: function(alternates) {
            var alternateToName = this.maps.alternateToName,
                nameToAlternates = this.maps.nameToAlternates,
                className, aliasList, alternate, i;

            for (className in alternates) {
                aliasList = nameToAlternates[className] ||
                    (nameToAlternates[className] = []);

                for (i  = 0; i < alternates[className].length; i++) {
                    alternate = alternates[className];
                    if (!alternateToName[alternate]) {
                        alternateToName[alternate] = className;
                        aliasList.push(alternate);
                    }
                }

            }
            return this;
        },

        /**
         * Get a reference to the class by its alias.
         *
         * @param {String} alias
         * @return {Carcasse.Class} class
         */
        getByAlias: function(alias) {
            return this.get(this.getNameByAlias(alias));
        },

        /**
         * Get the name of a class by its alias.
         *
         * @param {String} alias
         * @return {String} className
         */
        getNameByAlias: function(alias) {
            return this.maps.aliasToName[alias] || '';
        },

        /**
         * Get the name of a class by its alternate name.
         *
         * @param {String} alternate
         * @return {String} className
         */
        getNameByAlternate: function(alternate) {
            return this.maps.alternateToName[alternate] || '';
        },

        /**
         * Get the aliases of a class by the class name
         *
         * @param {String} name
         * @return {Array} aliases
         */
        getAliasesByName: function(name) {
            return this.maps.nameToAliases[name] || [];
        },

        /**
         * Get the name of the class by its reference or its instance;
         * usually invoked by the shorthand {@link Carcasse#getClassName Carcasse.getClassName}
         *
         *     Carcasse.ClassManager.getName(Carcasse.Action); // returns "Carcasse.Action"
         *
         * @param {Carcasse.Class/Object} object
         * @return {String} className
         */
        getName: function(object) {
            return object && object.$className || '';
        },

        /**
         * Get the class of the provided object; returns null if it's not an instance
         * of any class created with Carcasse.define. This is usually invoked by the shorthand {@link Carcasse#getClass Carcasse.getClass}.
         *
         *     var component = new Carcasse.Component();
         *
         *     Carcasse.ClassManager.getClass(component); // returns Carcasse.Component
         *
         * @param {Object} object
         * @return {Carcasse.Class} class
         */
        getClass: function(object) {
            return object && object.self || null;
        },

        /**
         * @private
         */
        create: function(className, data, createdFn) {
            //<debug error>
            if (typeof className != 'string') {
                throw new Error("[Carcasse.define] Invalid class name '" + className + "' specified, must be a non-empty string");
            }
            //</debug>

            data.$className = className;

            return new Class(data, function() {
                var postprocessorStack = data.postprocessors || Manager.defaultPostprocessors,
                    registeredPostprocessors = Manager.postprocessors,
                    index = 0,
                    postprocessors = [],
                    postprocessor, process, i, ln, j, subLn, postprocessorProperties, postprocessorProperty;

                delete data.postprocessors;

                for (i = 0,ln = postprocessorStack.length; i < ln; i++) {
                    postprocessor = postprocessorStack[i];

                    if (typeof postprocessor == 'string') {
                        postprocessor = registeredPostprocessors[postprocessor];
                        postprocessorProperties = postprocessor.properties;

                        if (postprocessorProperties === true) {
                            postprocessors.push(postprocessor.fn);
                        }
                        else if (postprocessorProperties) {
                            for (j = 0,subLn = postprocessorProperties.length; j < subLn; j++) {
                                postprocessorProperty = postprocessorProperties[j];

                                if (data.hasOwnProperty(postprocessorProperty)) {
                                    postprocessors.push(postprocessor.fn);
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        postprocessors.push(postprocessor);
                    }
                }

                process = function(clsName, cls, clsData) {
                    postprocessor = postprocessors[index++];

                    if (!postprocessor) {
                        Manager.set(className, cls);

                        if (createdFn) {
                            createdFn.call(cls, cls);
                        }

                        Manager.triggerCreated(className);
                        return;
                    }

                    if (postprocessor.call(this, clsName, cls, clsData, process) !== false) {
                        process.apply(this, arguments);
                    }
                };

                process.call(Manager, className, this, data);
            });
        },

        createOverride: function(className, data) {
            var overriddenClassName = data.override,
                requires = Carcasse.Array.from(data.requires);

            delete data.override;
            delete data.requires;

            this.existCache[className] = true;

            Carcasse.require(requires, function() {
                // Override the target class right after it's created
                this.onCreated(function() {
                    this.get(overriddenClassName).override(data);

                    // This push the overridding file itself into Carcasse.Loader.history
                    // Hence if the target class never exists, the overriding file will
                    // never be included in the build
                    this.triggerCreated(className);
                }, this, overriddenClassName);
            }, this);

            return this;
        },

        /**
         * Instantiate a class by its alias; usually invoked by the convenient shorthand {@link Carcasse#createByAlias Carcasse.createByAlias}
         * If {@link Carcasse.Loader} is {@link Carcasse.Loader#setConfig enabled} and the class has not been defined yet, it will
         * attempt to load the class via synchronous loading.
         *
         *     var window = Carcasse.ClassManager.instantiateByAlias('widget.window', { width: 600, height: 800 });
         *
         * @param {String} alias
         * @param {Mixed...} args Additional arguments after the alias will be passed to the class constructor.
         * @return {Object} instance
         */
        instantiateByAlias: function() {
            var alias = arguments[0],
                args = arraySlice.call(arguments),
                className = this.getNameByAlias(alias);

            if (!className) {
                className = this.maps.aliasToName[alias];

                //<debug error>
                if (!className) {
                    throw new Error("[Carcasse.createByAlias] Cannot create an instance of unrecognized alias: " + alias);
                }
                //</debug>

                //<debug warn>
                Carcasse.Logger.warn("[Carcasse.Loader] Synchronously loading '" + className + "'; consider adding " +
                     "Carcasse.require('" + alias + "') above Carcasse.onReady");
                //</debug>

                Carcasse.syncRequire(className);
            }

            args[0] = className;

            return this.instantiate.apply(this, args);
        },

        /**
         * Instantiate a class by either full name, alias or alternate name; usually invoked by the convenient
         * shorthand {@link Carcasse.ClassManager#create Carcasse.create}.
         *
         * If {@link Carcasse.Loader} is {@link Carcasse.Loader#setConfig enabled} and the class has not been defined yet, it will
         * attempt to load the class via synchronous loading.
         *
         * For example, all these three lines return the same result:
         *
         *     // alias
         *     var formPanel = Carcasse.create('widget.formpanel', { width: 600, height: 800 });
         *
         *     // alternate name
         *     var formPanel = Carcasse.create('Carcasse.form.FormPanel', { width: 600, height: 800 });
         *
         *     // full class name
         *     var formPanel = Carcasse.create('Carcasse.form.Panel', { width: 600, height: 800 });
         *
         * @param {String} name
         * @param {Mixed} args Additional arguments after the name will be passed to the class' constructor.
         * @return {Object} instance
         */
        instantiate: function() {
            var name = arguments[0],
                args = arraySlice.call(arguments, 1),
                alias = name,
                possibleName, cls;

            if (typeof name != 'function') {
                //<debug error>
                if ((typeof name != 'string' || name.length < 1)) {
                    throw new Error("[Carcasse.create] Invalid class name or alias '" + name + "' specified, must be a non-empty string");
                }
                //</debug>

                cls = this.get(name);
            }
            else {
                cls = name;
            }

            // No record of this class name, it's possibly an alias, so look it up
            if (!cls) {
                possibleName = this.getNameByAlias(name);

                if (possibleName) {
                    name = possibleName;

                    cls = this.get(name);
                }
            }

            // Still no record of this class name, it's possibly an alternate name, so look it up
            if (!cls) {
                possibleName = this.getNameByAlternate(name);

                if (possibleName) {
                    name = possibleName;

                    cls = this.get(name);
                }
            }

            // Still not existing at this point, try to load it via synchronous mode as the last resort
            if (!cls) {
                //<debug warn>
                Carcasse.Logger.warn("[Carcasse.Loader] Synchronously loading '" + name + "'; consider adding '" +
                    ((possibleName) ? alias : name) + "' explicitly as a require of the corresponding class");
                //</debug>

                Carcasse.syncRequire(name);

                cls = this.get(name);
            }

            //<debug error>
            if (!cls) {
                throw new Error("[Carcasse.create] Cannot create an instance of unrecognized class name / alias: " + alias);
            }

            if (typeof cls != 'function') {
                throw new Error("[Carcasse.create] '" + name + "' is a singleton and cannot be instantiated");
            }
            //</debug>

            return this.getInstantiator(args.length)(cls, args);
        },

        /**
         * @private
         * @param name
         * @param args
         */
        dynInstantiate: function(name, args) {
            args = arrayFrom(args, true);
            args.unshift(name);

            return this.instantiate.apply(this, args);
        },

        /**
         * @private
         * @param length
         */
        getInstantiator: function(length) {
            var instantiators = this.instantiators,
                instantiator;

            instantiator = instantiators[length];

            if (!instantiator) {
                var i = length,
                    args = [];

                for (i = 0; i < length; i++) {
                    args.push('a[' + i + ']');
                }

                instantiator = instantiators[length] = new Function('c', 'a', 'return new c(' + args.join(',') + ')');
                //<debug>
                instantiator.displayName = "Carcasse.ClassManager.instantiate" + length;
                //</debug>
            }

            return instantiator;
        },

        /**
         * @private
         */
        postprocessors: {},

        /**
         * @private
         */
        defaultPostprocessors: [],

        /**
         * Register a post-processor function.
         *
         * @private
         * @param {String} name
         * @param {Function} postprocessor
         */
        registerPostprocessor: function(name, fn, properties, position, relativeTo) {
            if (!position) {
                position = 'last';
            }

            if (!properties) {
                properties = [name];
            }

            this.postprocessors[name] = {
                name: name,
                properties: properties || false,
                fn: fn
            };

            this.setDefaultPostprocessorPosition(name, position, relativeTo);

            return this;
        },

        /**
         * Set the default post processors array stack which are applied to every class.
         *
         * @private
         * @param {String/Array} The name of a registered post processor or an array of registered names.
         * @return {Carcasse.ClassManager} this
         */
        setDefaultPostprocessors: function(postprocessors) {
            this.defaultPostprocessors = arrayFrom(postprocessors);

            return this;
        },

        /**
         * Insert this post-processor at a specific position in the stack, optionally relative to
         * any existing post-processor
         *
         * @private
         * @param {String} name The post-processor name. Note that it needs to be registered with
         * {@link Carcasse.ClassManager#registerPostprocessor} before this
         * @param {String} offset The insertion position. Four possible values are:
         * 'first', 'last', or: 'before', 'after' (relative to the name provided in the third argument)
         * @param {String} relativeName
         * @return {Carcasse.ClassManager} this
         */
        setDefaultPostprocessorPosition: function(name, offset, relativeName) {
            var defaultPostprocessors = this.defaultPostprocessors,
                index;

            if (typeof offset == 'string') {
                if (offset === 'first') {
                    defaultPostprocessors.unshift(name);

                    return this;
                }
                else if (offset === 'last') {
                    defaultPostprocessors.push(name);

                    return this;
                }

                offset = (offset === 'after') ? 1 : -1;
            }

            index = Carcasse.Array.indexOf(defaultPostprocessors, relativeName);

            if (index !== -1) {
                Carcasse.Array.splice(defaultPostprocessors, Math.max(0, index + offset), 0, name);
            }

            return this;
        },

        /**
         * Converts a string expression to an array of matching class names. An expression can either refers to class aliases
         * or class names. Expressions support wildcards:
         *
         *      // returns ['Carcasse.window.Window']
         *     var window = Carcasse.ClassManager.getNamesByExpression('widget.window');
         *
         *     // returns ['widget.panel', 'widget.window', ...]
         *     var allWidgets = Carcasse.ClassManager.getNamesByExpression('widget.*');
         *
         *     // returns ['Carcasse.data.Store', 'Carcasse.data.ArrayProxy', ...]
         *     var allData = Carcasse.ClassManager.getNamesByExpression('Carcasse.data.*');
         *
         * @param {String} expression
         * @return {Array} classNames
         */
        getNamesByExpression: function(expression) {
            var nameToAliasesMap = this.maps.nameToAliases,
                names = [],
                name, alias, aliases, possibleName, regex, i, ln;

            //<debug error>
            if (typeof expression != 'string' || expression.length < 1) {
                throw new Error("[Carcasse.ClassManager.getNamesByExpression] Expression " + expression + " is invalid, must be a non-empty string");
            }
            //</debug>

            if (expression.indexOf('*') !== -1) {
                expression = expression.replace(/\*/g, '(.*?)');
                regex = new RegExp('^' + expression + '$');

                for (name in nameToAliasesMap) {
                    if (nameToAliasesMap.hasOwnProperty(name)) {
                        aliases = nameToAliasesMap[name];

                        if (name.search(regex) !== -1) {
                            names.push(name);
                        }
                        else {
                            for (i = 0, ln = aliases.length; i < ln; i++) {
                                alias = aliases[i];

                                if (alias.search(regex) !== -1) {
                                    names.push(name);
                                    break;
                                }
                            }
                        }
                    }
                }

            } else {
                possibleName = this.getNameByAlias(expression);

                if (possibleName) {
                    names.push(possibleName);
                } else {
                    possibleName = this.getNameByAlternate(expression);

                    if (possibleName) {
                        names.push(possibleName);
                    } else {
                        names.push(expression);
                    }
                }
            }

            return names;
        }
    };

    //<feature classSystem.alias>
    /**
     * @cfg {String[]} alias
     * @member Carcasse.Class
     * List of short aliases for class names.  Most useful for defining xtypes for widgets:
     *
     *     Carcasse.define('MyApp.CoolPanel', {
     *         extend: 'Carcasse.panel.Panel',
     *         alias: ['widget.coolpanel'],
     *         title: 'Yeah!'
     *     });
     *
     *     // Using Carcasse.create
     *     Carcasse.create('widget.coolpanel');
     *
     *     // Using the shorthand for widgets and in xtypes
     *     Carcasse.widget('panel', {
     *         items: [
     *             {xtype: 'coolpanel', html: 'Foo'},
     *             {xtype: 'coolpanel', html: 'Bar'}
     *         ]
     *     });
     */
    Manager.registerPostprocessor('alias', function(name, cls, data) {
        var aliases = data.alias,
            i, ln;

        for (i = 0,ln = aliases.length; i < ln; i++) {
            alias = aliases[i];

            this.setAlias(cls, alias);
        }

    }, ['xtype', 'alias']);
    //</feature>

    //<feature classSystem.singleton>
    /**
     * @cfg {Boolean} singleton
     * @member Carcasse.Class
     * When set to true, the class will be instantiated as singleton.  For example:
     *
     *     Carcasse.define('Logger', {
     *         singleton: true,
     *         log: function(msg) {
     *             console.log(msg);
     *         }
     *     });
     *
     *     Logger.log('Hello');
     */
    Manager.registerPostprocessor('singleton', function(name, cls, data, fn) {
        fn.call(this, name, new cls(), data);
        return false;
    });
    //</feature>

    //<feature classSystem.alternateClassName>
    /**
     * @cfg {String/String[]} alternateClassName
     * @member Carcasse.Class
     * Defines alternate names for this class.  For example:
     *
     *     @example
     *     Carcasse.define('Developer', {
     *         alternateClassName: ['Coder', 'Hacker'],
     *         code: function(msg) {
     *             alert('Typing... ' + msg);
     *         }
     *     });
     *
     *     var joe = Carcasse.create('Developer');
     *     joe.code('stackoverflow');
     *
     *     var rms = Carcasse.create('Hacker');
     *     rms.code('hack hack');
     */
    Manager.registerPostprocessor('alternateClassName', function(name, cls, data) {
        var alternates = data.alternateClassName,
            i, ln, alternate;

        if (!(alternates instanceof Array)) {
            alternates = [alternates];
        }

        for (i = 0, ln = alternates.length; i < ln; i++) {
            alternate = alternates[i];

            //<debug error>
            if (typeof alternate != 'string') {
                throw new Error("[Carcasse.define] Invalid alternate of: '" + alternate + "' for class: '" + name + "'; must be a valid string");
            }
            //</debug>

            this.set(alternate, cls);
        }
    });
    //</feature>

    Carcasse.apply(Carcasse, {
        /**
         * Instantiate a class by either full name, alias or alternate name.
         *
         * If {@link Carcasse.Loader} is {@link Carcasse.Loader#setConfig enabled} and the class has not been defined yet, it will
         * attempt to load the class via synchronous loading.
         *
         * For example, all these three lines return the same result:
         *
         *     // alias
         *     var formPanel = Carcasse.create('widget.formpanel', { width: 600, height: 800 });
         *
         *     // alternate name
         *     var formPanel = Carcasse.create('Carcasse.form.FormPanel', { width: 600, height: 800 });
         *
         *     // full class name
         *     var formPanel = Carcasse.create('Carcasse.form.Panel', { width: 600, height: 800 });
         *
         * @param {String} name
         * @param {Mixed} args Additional arguments after the name will be passed to the class' constructor.
         * @return {Object} instance
         */
        create: alias(Manager, 'instantiate'),

        /**
         * Convenient shorthand to create a widget by its xtype, also see {@link Carcasse.ClassManager#instantiateByAlias}
         *
         *     var button = Carcasse.widget('button'); // Equivalent to Carcasse.create('widget.button')
         *     var panel = Carcasse.widget('panel'); // Equivalent to Carcasse.create('widget.panel')
         *
         * @member Carcasse
         * @method widget
         */
        widget: function(name) {
            var args = arraySlice.call(arguments);
            args[0] = 'widget.' + name;

            return Manager.instantiateByAlias.apply(Manager, args);
        },

        /**
         * Convenient shorthand, see {@link Carcasse.ClassManager#instantiateByAlias}.
         * @member Carcasse
         * @method createByAlias
         */
        createByAlias: alias(Manager, 'instantiateByAlias'),

        /**
         * Defines a class or override. A basic class is defined like this:
         *
         *      Carcasse.define('My.awesome.Class', {
         *          someProperty: 'something',
         *
         *          someMethod: function(s) {
         *              console.log(s + this.someProperty);
         *          }
         *      });
         *
         *      var obj = new My.awesome.Class();
         *
         *      obj.someMethod('Say '); // logs 'Say something' to the console
         *
         * To defines an override, include the `override` property. The content of an
         * override is aggregated with the specified class in order to extend or modify
         * that class. This can be as simple as setting default property values or it can
         * extend and/or replace methods. This can also extend the statics of the class.
         *
         * One use for an override is to break a large class into manageable pieces.
         *
         *      // File: /src/app/Panel.js
         *      Carcasse.define('My.app.Panel', {
         *          extend: 'Carcasse.panel.Panel',
         *          requires: [
         *              'My.app.PanelPart2',
         *              'My.app.PanelPart3'
         *          ],
         *
         *          constructor: function (config) {
         *              this.callParent(arguments); // calls Carcasse.panel.Panel's constructor
         *              // ...
         *          },
         *
         *          statics: {
         *              method: function () {
         *                  return 'abc';
         *              }
         *          }
         *      });
         *
         *      // File: /src/app/PanelPart2.js
         *      Carcasse.define('My.app.PanelPart2', {
         *          override: 'My.app.Panel',
         *
         *          constructor: function (config) {
         *              this.callParent(arguments); // calls My.app.Panel's constructor
         *              // ...
         *          }
         *      });
         *
         * Another use for an override is to provide optional parts of classes that can be
         * independently required. In this case, the class may even be unaware of the
         * override altogether.
         *
         *      Carcasse.define('My.ux.CoolTip', {
         *          override: 'Carcasse.tip.ToolTip',
         *
         *          constructor: function (config) {
         *              this.callParent(arguments); // calls Carcasse.tip.ToolTip's constructor
         *              // ...
         *          }
         *      });
         *
         * The above override can now be required as normal.
         *
         *      Carcasse.define('My.app.App', {
         *          requires: [
         *              'My.ux.CoolTip'
         *          ]
         *      });
         *
         * Overrides can also contain statics:
         *
         *      Carcasse.define('My.app.BarMod', {
         *          override: 'Carcasse.foo.Bar',
         *
         *          statics: {
         *              method: function (x) {
         *                  return this.callParent([x * 2]); // call Carcasse.foo.Bar.method
         *              }
         *          }
         *      });
         *
         * __IMPORTANT:__ An override is only included in a build if the class it overrides is
         * required. Otherwise, the override, like the target class, is not included.
         *
         * @param {String} className The class name to create in string dot-namespaced format, for example:
         * 'My.very.awesome.Class', 'FeedViewer.plugin.CoolPager'
         *
         * It is highly recommended to follow this simple convention:
         *  - The root and the class name are 'CamelCased'
         *  - Everything else is lower-cased
         *
         * @param {Object} data The key - value pairs of properties to apply to this class. Property names can be of
         * any valid strings, except those in the reserved listed below:
         *
         *  - `mixins`
         *  - `statics`
         *  - `config`
         *  - `alias`
         *  - `self`
         *  - `singleton`
         *  - `alternateClassName`
         *  - `override`
         *
         * @param {Function} [createdFn] Optional callback to execute after the class (or override)
         * is created. The execution scope (`this`) will be the newly created class itself.
         * @return {Carcasse.Base}
         *
         * @member Carcasse
         * @method define
         */
        define: function (className, data, createdFn) {
            if ('override' in data) {
                return Manager.createOverride.apply(Manager, arguments);
            }

            return Manager.create.apply(Manager, arguments);
        },

        /**
         * Convenient shorthand for {@link Carcasse.ClassManager#getName}.
         * @member Carcasse
         * @method getClassName
         * @inheritdoc Carcasse.ClassManager#getName
         */
        getClassName: alias(Manager, 'getName'),

        /**
         * Returns the display name for object.  This name is looked for in order from the following places:
         *
         * - `displayName` field of the object.
         * - `$name` and `$class` fields of the object.
         * - '$className` field of the object.
         *
         * This method is used by {@link Carcasse.Logger#log} to display information about objects.
         *
         * @param {Mixed} [object] The object who's display name to determine.
         * @return {String} The determined display name, or "Anonymous" if none found.
         * @member Carcasse
         */
        getDisplayName: function(object) {
            if (object) {
                if (object.displayName) {
                    return object.displayName;
                }

                if (object.$name && object.$class) {
                    return Carcasse.getClassName(object.$class) + '#' + object.$name;
                }

                if (object.$className) {
                    return object.$className;
                }
            }

            return 'Anonymous';
        },

        /**
         * Convenient shorthand, see {@link Carcasse.ClassManager#getClass}.
         * @member Carcasse
         * @method getClass
         */
        getClass: alias(Manager, 'getClass'),

        /**
         * Creates namespaces to be used for scoping variables and classes so that they are not global.
         * Specifying the last node of a namespace implicitly creates all other nodes. Usage:
         *
         *     Carcasse.namespace('Company', 'Company.data');
         *
         *      // equivalent and preferable to the above syntax
         *     Carcasse.namespace('Company.data');
         *
         *     Company.Widget = function() {
         *         // ...
         *     };
         *
         *     Company.data.CustomStore = function(config) {
         *         // ...
         *     };
         *
         * @param {String} namespace1
         * @param {String} namespace2
         * @param {String} etc
         * @return {Object} The namespace object. If multiple arguments are passed, this will be the last namespace created.
         * @member Carcasse
         * @method namespace
         */
        namespace: alias(Manager, 'createNamespaces')
    });

    /**
     * Old name for {@link Carcasse#widget}.
     * @deprecated 4.0.0 Please use {@link Carcasse#widget} instead.
     * @method createWidget
     * @member Carcasse
     */
    Carcasse.createWidget = Carcasse.widget;

    /**
     * Convenient alias for {@link Carcasse#namespace Carcasse.namespace}.
     * @member Carcasse
     * @method ns
     */
    Carcasse.ns = Carcasse.namespace;

    Class.registerPreprocessor('className', function(cls, data) {
        if (data.$className) {
            cls.$className = data.$className;
            //<debug>
            cls.displayName = cls.$className;
            //</debug>
        }
    }, true, 'first');

    Class.registerPreprocessor('alias', function(cls, data) {
        var prototype = cls.prototype,
            xtypes = arrayFrom(data.xtype),
            aliases = arrayFrom(data.alias),
            widgetPrefix = 'widget.',
            widgetPrefixLength = widgetPrefix.length,
            xtypesChain = Array.prototype.slice.call(prototype.xtypesChain || []),
            xtypesMap = Carcasse.merge({}, prototype.xtypesMap || {}),
            i, ln, alias, xtype;

        for (i = 0,ln = aliases.length; i < ln; i++) {
            alias = aliases[i];

            //<debug error>
            if (typeof alias != 'string' || alias.length < 1) {
                throw new Error("[Carcasse.define] Invalid alias of: '" + alias + "' for class: '" + name + "'; must be a valid string");
            }
            //</debug>

            if (alias.substring(0, widgetPrefixLength) === widgetPrefix) {
                xtype = alias.substring(widgetPrefixLength);
                Carcasse.Array.include(xtypes, xtype);
            }
        }

        cls.xtype = data.xtype = xtypes[0];
        data.xtypes = xtypes;

        for (i = 0,ln = xtypes.length; i < ln; i++) {
            xtype = xtypes[i];

            if (!xtypesMap[xtype]) {
                xtypesMap[xtype] = true;
                xtypesChain.push(xtype);
            }
        }

        data.xtypesChain = xtypesChain;
        data.xtypesMap = xtypesMap;

        Carcasse.Function.interceptAfter(data, 'onClassCreated', function() {
            var mixins = prototype.mixins,
                key, mixin;

            for (key in mixins) {
                if (mixins.hasOwnProperty(key)) {
                    mixin = mixins[key];

                    xtypes = mixin.xtypes;

                    if (xtypes) {
                        for (i = 0,ln = xtypes.length; i < ln; i++) {
                            xtype = xtypes[i];

                            if (!xtypesMap[xtype]) {
                                xtypesMap[xtype] = true;
                                xtypesChain.push(xtype);
                            }
                        }
                    }
                }
            }
        });

        for (i = 0,ln = xtypes.length; i < ln; i++) {
            xtype = xtypes[i];

            //<debug error>
            if (typeof xtype != 'string' || xtype.length < 1) {
                throw new Error("[Carcasse.define] Invalid xtype of: '" + xtype + "' for class: '" + name + "'; must be a valid non-empty string");
            }
            //</debug>

            Carcasse.Array.include(aliases, widgetPrefix + xtype);
        }

        data.alias = aliases;

    }, ['xtype', 'alias']);

})(Carcasse.Class, Carcasse.Function.alias, Array.prototype.slice, Carcasse.Array.from, Carcasse.global);

//@tag foundation,core
//@define Carcasse.Loader
//@require Carcasse.ClassManager

/**
 * @class Carcasse.Loader
 *
 * @author Jacky Nguyen <jacky@sencha.com>
 * @docauthor Jacky Nguyen <jacky@sencha.com>
 * @aside guide mvc_dependencies
 *
 * Carcasse.Loader is the heart of the new dynamic dependency loading capability in Carcasse JS 4+. It is most commonly used
 * via the {@link Carcasse#require} shorthand. Carcasse.Loader supports both asynchronous and synchronous loading
 * approaches, and leverage their advantages for the best development flow.
 * We'll discuss about the pros and cons of each approach.
 *
 * __Note:__ The Loader is only enabled by default in development versions of the library (eg sencha-touch-debug.js). To
 * explicitly enable the loader, use `Carcasse.Loader.setConfig({ enabled: true });` before the start of your script.
 *
 * ## Asynchronous Loading
 *
 * - Advantages:
 * 	+ Cross-domain
 * 	+ No web server needed: you can run the application via the file system protocol (i.e: `file://path/to/your/index
 *  .html`)
 * 	+ Best possible debugging experience: error messages come with the exact file name and line number
 *
 * - Disadvantages:
 * 	+ Dependencies need to be specified before-hand
 *
 * ### Method 1: Explicitly include what you need: ###
 *
 *     // Syntax
 *     // Carcasse.require({String/Array} expressions);
 *
 *     // Example: Single alias
 *     Carcasse.require('widget.window');
 *
 *     // Example: Single class name
 *     Carcasse.require('Carcasse.window.Window');
 *
 *     // Example: Multiple aliases / class names mix
 *     Carcasse.require(['widget.window', 'layout.border', 'Carcasse.data.Connection']);
 *
 *     // Wildcards
 *     Carcasse.require(['widget.*', 'layout.*', 'Carcasse.data.*']);
 *
 * ### Method 2: Explicitly exclude what you don't need: ###
 *
 *     // Syntax: Note that it must be in this chaining format.
 *     // Carcasse.exclude({String/Array} expressions)
 *     //    .require({String/Array} expressions);
 *
 *     // Include everything except Carcasse.data.*
 *     Carcasse.exclude('Carcasse.data.*').require('*');
 *
 *     // Include all widgets except widget.checkbox*,
 *     // which will match widget.checkbox, widget.checkboxfield, widget.checkboxgroup, etc.
 *     Carcasse.exclude('widget.checkbox*').require('widget.*');
 *
 * # Synchronous Loading on Demand #
 *
 * - *Advantages:*
 * 	+ There's no need to specify dependencies before-hand, which is always the convenience of including ext-all.js
 *  before
 *
 * - *Disadvantages:*
 * 	+ Not as good debugging experience since file name won't be shown (except in Firebug at the moment)
 * 	+ Must be from the same domain due to XHR restriction
 * 	+ Need a web server, same reason as above
 *
 * There's one simple rule to follow: Instantiate everything with Carcasse.create instead of the `new` keyword
 *
 *     Carcasse.create('widget.window', {}); // Instead of new Carcasse.window.Window({...});
 *
 *     Carcasse.create('Carcasse.window.Window', {}); // Same as above, using full class name instead of alias
 *
 *     Carcasse.widget('window', {}); // Same as above, all you need is the traditional `xtype`
 *
 * Behind the scene, {@link Carcasse.ClassManager} will automatically check whether the given class name / alias has already
 *  existed on the page. If it's not, Carcasse.Loader will immediately switch itself to synchronous mode and automatic load the given
 *  class and all its dependencies.
 *
 * # Hybrid Loading - The Best of Both Worlds #
 *
 * It has all the advantages combined from asynchronous and synchronous loading. The development flow is simple:
 *
 * ### Step 1: Start writing your application using synchronous approach. ###
 * Carcasse.Loader will automatically fetch all dependencies on demand as they're 
 * needed during run-time. For example:
 *
 *     Carcasse.onReady(function(){
 *         var window = Carcasse.createWidget('window', {
 *             width: 500,
 *             height: 300,
 *             layout: {
 *                 type: 'border',
 *                 padding: 5
 *             },
 *             title: 'Hello Dialog',
 *             items: [{
 *                 title: 'Navigation',
 *                 collapsible: true,
 *                 region: 'west',
 *                 width: 200,
 *                 html: 'Hello',
 *                 split: true
 *             }, {
 *                 title: 'TabPanel',
 *                 region: 'center'
 *             }]
 *         });
 *
 *         window.show();
 *     });
 *
 * ### Step 2: Along the way, when you need better debugging ability, watch the console for warnings like these: ###
 *
 *     [Carcasse.Loader] Synchronously loading 'Carcasse.window.Window'; consider adding Carcasse.require('Carcasse.window.Window') before your application's code
 *     ClassManager.js:432
 *     [Carcasse.Loader] Synchronously loading 'Carcasse.layout.container.Border'; consider adding Carcasse.require('Carcasse.layout.container.Border') before your application's code
 *
 * Simply copy and paste the suggested code above `Carcasse.onReady`, i.e:
 *
 *     Carcasse.require('Carcasse.window.Window');
 *     Carcasse.require('Carcasse.layout.container.Border');
 *
 *     Carcasse.onReady(function () {
 *         // ...
 *     });
 *
 * Everything should now load via asynchronous mode.
 *
 * # Deployment #
 *
 * It's important to note that dynamic loading should only be used during development on your local machines.
 * During production, all dependencies should be combined into one single JavaScript file. Carcasse.Loader makes
 * the whole process of transitioning from / to between development / maintenance and production as easy as
 * possible. Internally {@link Carcasse.Loader#history Carcasse.Loader.history} maintains the list of all dependencies your application
 * needs in the exact loading sequence. It's as simple as concatenating all files in this array into one,
 * then include it on top of your application.
 *
 * This process will be automated with Sencha Command, to be released and documented towards Carcasse JS 4 Final.
 *
 * @singleton
 */
(function(Manager, Class, flexSetter, alias, pass, arrayFrom, arrayErase, arrayInclude) {

    var
        dependencyProperties = ['extend', 'mixins', 'requires'],
        Loader,
        setPathCount = 0;;

    Loader = Carcasse.Loader = {

        /**
         * @private
         */
        isInHistory: {},

        /**
         * An array of class names to keep track of the dependency loading order.
         * This is not guaranteed to be the same every time due to the asynchronous
         * nature of the Loader.
         *
         * @property history
         * @type Array
         */
        history: [],

        /**
         * Configuration
         * @private
         */
        config: {
            /**
             * Whether or not to enable the dynamic dependency loading feature.
             * @cfg {Boolean} enabled
             */
            enabled: true,

            /**
             * @cfg {Boolean} disableCaching
             * Appends current timestamp to script files to prevent caching.
             */
            disableCaching: true,

            /**
             * @cfg {String} disableCachingParam
             * The get parameter name for the cache buster's timestamp.
             */
            disableCachingParam: '_dc',

            /**
             * @cfg {Object} paths
             * The mapping from namespaces to file paths.
             *
             *     {
             *         'Carcasse': '.', // This is set by default, Carcasse.layout.container.Container will be
             *                     // loaded from ./layout/Container.js
             *
             *         'My': './src/my_own_folder' // My.layout.Container will be loaded from
             *                                     // ./src/my_own_folder/layout/Container.js
             *     }
             *
             * Note that all relative paths are relative to the current HTML document.
             * If not being specified, for example, `Other.awesome.Class`
             * will simply be loaded from `./Other/awesome/Class.js`.
             */
            paths: {
                'Carcasse': '.'
            }
        },

        /**
         * Set the configuration for the loader. This should be called right after ext-(debug).js
         * is included in the page, and before Carcasse.onReady. i.e:
         *
         *     <script type="text/javascript" src="ext-core-debug.js"></script>
         *     <script type="text/javascript">
         *         Carcasse.Loader.setConfig({
         *           enabled: true,
         *           paths: {
         *               'My': 'my_own_path'
         *           }
         *         });
         *     <script>
         *     <script type="text/javascript">
         *         Carcasse.require(...);
         *
         *         Carcasse.onReady(function() {
         *           // application code here
         *         });
         *     </script>
         *
         * Refer to config options of {@link Carcasse.Loader} for the list of possible properties.
         *
         * @param {Object} config The config object to override the default values.
         * @return {Carcasse.Loader} this
         */
        setConfig: function(name, value) {
            if (Carcasse.isObject(name) && arguments.length === 1) {
                Carcasse.merge(this.config, name);
            }
            else {
                this.config[name] = (Carcasse.isObject(value)) ? Carcasse.merge(this.config[name], value) : value;
            }

            return this;
        },

        /**
         * Get the config value corresponding to the specified name. If no name is given, will return the config object.
         * @param {String} name The config property name.
         * @return {Object/Mixed}
         */
        getConfig: function(name) {
            if (name) {
                return this.config[name];
            }

            return this.config;
        },

        /**
         * Sets the path of a namespace.
         * For example:
         *
         *     Carcasse.Loader.setPath('Carcasse', '.');
         *
         * @param {String/Object} name See {@link Carcasse.Function#flexSetter flexSetter}
         * @param {String} path See {@link Carcasse.Function#flexSetter flexSetter}
         * @return {Carcasse.Loader} this
         * @method
         */
        setPath: flexSetter(function(name, path) {
            this.config.paths[name] = path;

            return this;
        }),

        /**
         * Sets a batch of path entries
         *
         * @param {Object } paths a set of className: path mappings
         * @return {Carcasse.Loader} this
         */
        addClassPathMappings: function(paths) {
            var name;

            if(setPathCount == 0){
                Loader.config.paths = paths;
            } else {
                for(name in paths){
                    Loader.config.paths[name] = paths[name];
                }
            }
            setPathCount++;
            return Loader;
        },

        /**
         * Translates a className to a file path by adding the
         * the proper prefix and converting the .'s to /'s. For example:
         *
         *     Carcasse.Loader.setPath('My', '/path/to/My');
         *
         *     alert(Carcasse.Loader.getPath('My.awesome.Class')); // alerts '/path/to/My/awesome/Class.js'
         *
         * Note that the deeper namespace levels, if explicitly set, are always resolved first. For example:
         *
         *     Carcasse.Loader.setPath({
         *         'My': '/path/to/lib',
         *         'My.awesome': '/other/path/for/awesome/stuff',
         *         'My.awesome.more': '/more/awesome/path'
         *     });
         *
         *     alert(Carcasse.Loader.getPath('My.awesome.Class')); // alerts '/other/path/for/awesome/stuff/Class.js'
         *
         *     alert(Carcasse.Loader.getPath('My.awesome.more.Class')); // alerts '/more/awesome/path/Class.js'
         *
         *     alert(Carcasse.Loader.getPath('My.cool.Class')); // alerts '/path/to/lib/cool/Class.js'
         *
         *     alert(Carcasse.Loader.getPath('Unknown.strange.Stuff')); // alerts 'Unknown/strange/Stuff.js'
         *
         * @param {String} className
         * @return {String} path
         */
        getPath: function(className) {
            var path = '',
                paths = this.config.paths,
                prefix = this.getPrefix(className);

            if (prefix.length > 0) {
                if (prefix === className) {
                    return paths[prefix];
                }

                path = paths[prefix];
                className = className.substring(prefix.length + 1);
            }

            if (path.length > 0) {
                path += '/';
            }

            return path.replace(/\/\.\//g, '/') + className.replace(/\./g, "/") + '.js';
        },

        /**
         * @private
         * @param {String} className
         */
        getPrefix: function(className) {
            var paths = this.config.paths,
                prefix, deepestPrefix = '';

            if (paths.hasOwnProperty(className)) {
                return className;
            }

            for (prefix in paths) {
                if (paths.hasOwnProperty(prefix) && prefix + '.' === className.substring(0, prefix.length + 1)) {
                    if (prefix.length > deepestPrefix.length) {
                        deepestPrefix = prefix;
                    }
                }
            }

            return deepestPrefix;
        },

        /**
         * Loads all classes by the given names and all their direct dependencies; optionally executes the given callback function when
         * finishes, within the optional scope. This method is aliased by {@link Carcasse#require Carcasse.require} for convenience.
         * @param {String/Array} expressions Can either be a string or an array of string.
         * @param {Function} fn (optional) The callback function.
         * @param {Object} scope (optional) The execution scope (`this`) of the callback function.
         * @param {String/Array} excludes (optional) Classes to be excluded, useful when being used with expressions.
         */
        require: function(expressions, fn, scope, excludes) {
            if (fn) {
                fn.call(scope);
            }
        },

        /**
         * Synchronously loads all classes by the given names and all their direct dependencies; optionally executes the given callback function when finishes, within the optional scope. This method is aliased by {@link Carcasse#syncRequire} for convenience
         * @param {String/Array} expressions Can either be a string or an array of string
         * @param {Function} fn (optional) The callback function
         * @param {Object} scope (optional) The execution scope (`this`) of the callback function
         * @param {String/Array} excludes (optional) Classes to be excluded, useful when being used with expressions
         */
        syncRequire: function() {},

        /**
         * Explicitly exclude files from being loaded. Useful when used in conjunction with a broad include expression.
         * Can be chained with more `require` and `exclude` methods, eg:
         *
         *     Carcasse.exclude('Carcasse.data.*').require('*');
         *
         *     Carcasse.exclude('widget.button*').require('widget.*');
         *
         * @param {Array} excludes
         * @return {Object} object contains `require` method for chaining.
         */
        exclude: function(excludes) {
            var me = this;

            return {
                require: function(expressions, fn, scope) {
                    return me.require(expressions, fn, scope, excludes);
                },

                syncRequire: function(expressions, fn, scope) {
                    return me.syncRequire(expressions, fn, scope, excludes);
                }
            };
        },

        /**
         * Add a new listener to be executed when all required scripts are fully loaded.
         *
         * @param {Function} fn The function callback to be executed.
         * @param {Object} scope The execution scope (`this`) of the callback function.
         * @param {Boolean} withDomReady Whether or not to wait for document DOM ready as well.
         */
        onReady: function(fn, scope, withDomReady, options) {
            var oldFn;

            if (withDomReady !== false && Carcasse.onDocumentReady) {
                oldFn = fn;

                fn = function() {
                    Carcasse.onDocumentReady(oldFn, scope, options);
                };
            }

            fn.call(scope);
        }
    };

    //<feature classSystem.loader>
    Carcasse.apply(Loader, {
        /**
         * @private
         */
        documentHead: typeof document != 'undefined' && (document.head || document.getElementsByTagName('head')[0]),

        /**
         * Flag indicating whether there are still files being loaded
         * @private
         */
        isLoading: false,

        /**
         * Maintain the queue for all dependencies. Each item in the array is an object of the format:
         * 
         *     {
         *         requires: [...], // The required classes for this queue item
         *         callback: function() { ... } // The function to execute when all classes specified in requires exist
         *     }
         * @private
         */
        queue: [],

        /**
         * Maintain the list of files that have already been handled so that they never get double-loaded
         * @private
         */
        isClassFileLoaded: {},

        /**
         * @private
         */
        isFileLoaded: {},

        /**
         * Maintain the list of listeners to execute when all required scripts are fully loaded
         * @private
         */
        readyListeners: [],

        /**
         * Contains optional dependencies to be loaded last
         * @private
         */
        optionalRequires: [],

        /**
         * Map of fully qualified class names to an array of dependent classes.
         * @private
         */
        requiresMap: {},

        /**
         * @private
         */
        numPendingFiles: 0,

        /**
         * @private
         */
        numLoadedFiles: 0,

        /** @private */
        hasFileLoadError: false,

        /**
         * @private
         */
        classNameToFilePathMap: {},

        /**
         * @private
         */
        syncModeEnabled: false,

        scriptElements: {},

        /**
         * Refresh all items in the queue. If all dependencies for an item exist during looping,
         * it will execute the callback and call refreshQueue again. Triggers onReady when the queue is
         * empty
         * @private
         */
        refreshQueue: function() {
            var queue = this.queue,
                ln = queue.length,
                i, item, j, requires, references;

            if (ln === 0) {
                this.triggerReady();
                return;
            }

            for (i = 0; i < ln; i++) {
                item = queue[i];

                if (item) {
                    requires = item.requires;
                    references = item.references;

                    // Don't bother checking when the number of files loaded
                    // is still less than the array length
                    if (requires.length > this.numLoadedFiles) {
                        continue;
                    }

                    j = 0;

                    do {
                        if (Manager.isCreated(requires[j])) {
                            // Take out from the queue
                            arrayErase(requires, j, 1);
                        }
                        else {
                            j++;
                        }
                    } while (j < requires.length);

                    if (item.requires.length === 0) {
                        arrayErase(queue, i, 1);
                        item.callback.call(item.scope);
                        this.refreshQueue();
                        break;
                    }
                }
            }

            return this;
        },

        /**
         * Inject a script element to document's head, call onLoad and onError accordingly
         * @private
         */
        injectScriptElement: function(url, onLoad, onError, scope) {
            var script = document.createElement('script'),
                me = this,
                onLoadFn = function() {
                    me.cleanupScriptElement(script);
                    onLoad.call(scope);
                },
                onErrorFn = function() {
                    me.cleanupScriptElement(script);
                    onError.call(scope);
                };

            script.type = 'text/javascript';
            script.src = url;
            script.onload = onLoadFn;
            script.onerror = onErrorFn;
            script.onreadystatechange = function() {
                if (this.readyState === 'loaded' || this.readyState === 'complete') {
                    onLoadFn();
                }
            };

            this.documentHead.appendChild(script);

            return script;
        },

        removeScriptElement: function(url) {
            var scriptElements = this.scriptElements;

            if (scriptElements[url]) {
                this.cleanupScriptElement(scriptElements[url], true);
                delete scriptElements[url];
            }

            return this;
        },

        /**
         * @private
         */
        cleanupScriptElement: function(script, remove) {
            script.onload = null;
            script.onreadystatechange = null;
            script.onerror = null;

            if (remove) {
                this.documentHead.removeChild(script);
            }

            return this;
        },

        /**
         * Load a script file, supports both asynchronous and synchronous approaches
         *
         * @param {String} url
         * @param {Function} onLoad
         * @param {Object} scope
         * @param {Boolean} synchronous
         * @private
         */
        loadScriptFile: function(url, onLoad, onError, scope, synchronous) {
            var me = this,
                isFileLoaded = this.isFileLoaded,
                scriptElements = this.scriptElements,
                noCacheUrl = url + (this.getConfig('disableCaching') ? ('?' + this.getConfig('disableCachingParam') + '=' + Carcasse.Date.now()) : ''),
                xhr, status, content, onScriptError;

            if (isFileLoaded[url]) {
                return this;
            }

            scope = scope || this;

            this.isLoading = true;

            if (!synchronous) {
                onScriptError = function() {
                    //<debug error>
                    onError.call(scope, "Failed loading '" + url + "', please verify that the file exists", synchronous);
                    //</debug>
                };

                if (!Carcasse.isReady && Carcasse.onDocumentReady) {
                    Carcasse.onDocumentReady(function() {
                        if (!isFileLoaded[url]) {
                            scriptElements[url] = me.injectScriptElement(noCacheUrl, onLoad, onScriptError, scope);
                        }
                    });
                }
                else {
                    scriptElements[url] = this.injectScriptElement(noCacheUrl, onLoad, onScriptError, scope);
                }
            }
            else {
                if (typeof XMLHttpRequest != 'undefined') {
                    xhr = new XMLHttpRequest();
                } else {
                    xhr = new ActiveXObject('Microsoft.XMLHTTP');
                }

                try {
                    xhr.open('GET', noCacheUrl, false);
                    xhr.send(null);
                }
                catch (e) {
                    //<debug error>
                    onError.call(this, "Failed loading synchronously via XHR: '" + url + "'; It's likely that the file is either " +
                                       "being loaded from a different domain or from the local file system whereby cross origin " +
                                       "requests are not allowed due to security reasons. Use asynchronous loading with " +
                                       "Carcasse.require instead.", synchronous);
                    //</debug>
                }

                status = (xhr.status == 1223) ? 204 : xhr.status;
                content = xhr.responseText;

                if ((status >= 200 && status < 300) || status == 304 || (status == 0 && content.length > 0)) {
                    // Debugger friendly, file names are still shown even though they're eval'ed code
                    // Breakpoints work on both Firebug and Chrome's Web Inspector
                    Carcasse.globalEval(content + "\n//@ sourceURL=" + url);
                    onLoad.call(scope);
                }
                else {
                    //<debug>
                    onError.call(this, "Failed loading synchronously via XHR: '" + url + "'; please " +
                                       "verify that the file exists. " +
                                       "XHR status code: " + status, synchronous);
                    //</debug>
                }

                // Prevent potential IE memory leak
                xhr = null;
            }
        },

        // documented above
        syncRequire: function() {
            var syncModeEnabled = this.syncModeEnabled;

            if (!syncModeEnabled) {
                this.syncModeEnabled = true;
            }

            this.require.apply(this, arguments);

            if (!syncModeEnabled) {
                this.syncModeEnabled = false;
            }

            this.refreshQueue();
        },

        // documented above
        require: function(expressions, fn, scope, excludes) {
            var excluded = {},
                included = {},
                queue = this.queue,
                classNameToFilePathMap = this.classNameToFilePathMap,
                isClassFileLoaded = this.isClassFileLoaded,
                excludedClassNames = [],
                possibleClassNames = [],
                classNames = [],
                references = [],
                callback,
                syncModeEnabled,
                filePath, expression, exclude, className,
                possibleClassName, i, j, ln, subLn;

            if (excludes) {
                excludes = arrayFrom(excludes);

                for (i = 0,ln = excludes.length; i < ln; i++) {
                    exclude = excludes[i];

                    if (typeof exclude == 'string' && exclude.length > 0) {
                        excludedClassNames = Manager.getNamesByExpression(exclude);

                        for (j = 0,subLn = excludedClassNames.length; j < subLn; j++) {
                            excluded[excludedClassNames[j]] = true;
                        }
                    }
                }
            }

            expressions = arrayFrom(expressions);

            if (fn) {
                if (fn.length > 0) {
                    callback = function() {
                        var classes = [],
                            i, ln, name;

                        for (i = 0,ln = references.length; i < ln; i++) {
                            name = references[i];
                            classes.push(Manager.get(name));
                        }

                        return fn.apply(this, classes);
                    };
                }
                else {
                    callback = fn;
                }
            }
            else {
                callback = Carcasse.emptyFn;
            }

            scope = scope || Carcasse.global;

            for (i = 0,ln = expressions.length; i < ln; i++) {
                expression = expressions[i];

                if (typeof expression == 'string' && expression.length > 0) {
                    possibleClassNames = Manager.getNamesByExpression(expression);
                    subLn = possibleClassNames.length;

                    for (j = 0; j < subLn; j++) {
                        possibleClassName = possibleClassNames[j];

                        if (excluded[possibleClassName] !== true) {
                            references.push(possibleClassName);

                            if (!Manager.isCreated(possibleClassName) && !included[possibleClassName]) {
                                included[possibleClassName] = true;
                                classNames.push(possibleClassName);
                            }
                        }
                    }
                }
            }

            // If the dynamic dependency feature is not being used, throw an error
            // if the dependencies are not defined
            if (classNames.length > 0) {
                if (!this.config.enabled) {
                    throw new Error("Carcasse.Loader is not enabled, so dependencies cannot be resolved dynamically. " +
                             "Missing required class" + ((classNames.length > 1) ? "es" : "") + ": " + classNames.join(', '));
                }
            }
            else {
                callback.call(scope);
                return this;
            }

            syncModeEnabled = this.syncModeEnabled;

            if (!syncModeEnabled) {
                queue.push({
                    requires: classNames.slice(), // this array will be modified as the queue is processed,
                                                  // so we need a copy of it
                    callback: callback,
                    scope: scope
                });
            }

            ln = classNames.length;

            for (i = 0; i < ln; i++) {
                className = classNames[i];

                filePath = this.getPath(className);

                // If we are synchronously loading a file that has already been asynchronously loaded before
                // we need to destroy the script tag and revert the count
                // This file will then be forced loaded in synchronous
                if (syncModeEnabled && isClassFileLoaded.hasOwnProperty(className)) {
                    this.numPendingFiles--;
                    this.removeScriptElement(filePath);
                    delete isClassFileLoaded[className];
                }

                if (!isClassFileLoaded.hasOwnProperty(className)) {
                    isClassFileLoaded[className] = false;

                    classNameToFilePathMap[className] = filePath;

                    this.numPendingFiles++;

                    this.loadScriptFile(
                        filePath,
                        pass(this.onFileLoaded, [className, filePath], this),
                        pass(this.onFileLoadError, [className, filePath]),
                        this,
                        syncModeEnabled
                    );
                }
            }

            if (syncModeEnabled) {
                callback.call(scope);

                if (ln === 1) {
                    return Manager.get(className);
                }
            }

            return this;
        },

        /**
         * @private
         * @param {String} className
         * @param {String} filePath
         */
        onFileLoaded: function(className, filePath) {
            this.numLoadedFiles++;

            this.isClassFileLoaded[className] = true;
            this.isFileLoaded[filePath] = true;

            this.numPendingFiles--;

            if (this.numPendingFiles === 0) {
                this.refreshQueue();
            }

            //<debug>
            if (!this.syncModeEnabled && this.numPendingFiles === 0 && this.isLoading && !this.hasFileLoadError) {
                var queue = this.queue,
                    missingClasses = [],
                    missingPaths = [],
                    requires,
                    i, ln, j, subLn;

                for (i = 0,ln = queue.length; i < ln; i++) {
                    requires = queue[i].requires;

                    for (j = 0,subLn = requires.length; j < subLn; j++) {
                        if (this.isClassFileLoaded[requires[j]]) {
                            missingClasses.push(requires[j]);
                        }
                    }
                }

                if (missingClasses.length < 1) {
                    return;
                }

                missingClasses = Carcasse.Array.filter(Carcasse.Array.unique(missingClasses), function(item) {
                    return !this.requiresMap.hasOwnProperty(item);
                }, this);

                for (i = 0,ln = missingClasses.length; i < ln; i++) {
                    missingPaths.push(this.classNameToFilePathMap[missingClasses[i]]);
                }

                throw new Error("The following classes are not declared even if their files have been " +
                            "loaded: '" + missingClasses.join("', '") + "'. Please check the source code of their " +
                            "corresponding files for possible typos: '" + missingPaths.join("', '"));
            }
            //</debug>
        },

        /**
         * @private
         */
        onFileLoadError: function(className, filePath, errorMessage, isSynchronous) {
            this.numPendingFiles--;
            this.hasFileLoadError = true;

            //<debug error>
            throw new Error("[Carcasse.Loader] " + errorMessage);
            //</debug>
        },

        /**
         * @private
         */
        addOptionalRequires: function(requires) {
            var optionalRequires = this.optionalRequires,
                i, ln, require;

            requires = arrayFrom(requires);

            for (i = 0, ln = requires.length; i < ln; i++) {
                require = requires[i];

                arrayInclude(optionalRequires, require);
            }

            return this;
        },

        /**
         * @private
         */
        triggerReady: function(force) {
            var readyListeners = this.readyListeners,
                optionalRequires = this.optionalRequires,
                listener;

            if (this.isLoading || force) {
                this.isLoading = false;

                if (optionalRequires.length !== 0) {
                    // Clone then empty the array to eliminate potential recursive loop issue
                    optionalRequires = optionalRequires.slice();

                    // Empty the original array
                    this.optionalRequires.length = 0;

                    this.require(optionalRequires, pass(this.triggerReady, [true], this), this);
                    return this;
                }

                while (readyListeners.length) {
                    listener = readyListeners.shift();
                    listener.fn.call(listener.scope);

                    if (this.isLoading) {
                        return this;
                    }
                }
            }

            return this;
        },

        // duplicate definition (documented above)
        onReady: function(fn, scope, withDomReady, options) {
            var oldFn;

            if (withDomReady !== false && Carcasse.onDocumentReady) {
                oldFn = fn;

                fn = function() {
                    Carcasse.onDocumentReady(oldFn, scope, options);
                };
            }

            if (!this.isLoading) {
                fn.call(scope);
            }
            else {
                this.readyListeners.push({
                    fn: fn,
                    scope: scope
                });
            }
        },

        /**
         * @private
         * @param {String} className
         */
        historyPush: function(className) {
            var isInHistory = this.isInHistory;

            if (className && this.isClassFileLoaded.hasOwnProperty(className) && !isInHistory[className]) {
                isInHistory[className] = true;
                this.history.push(className);
            }

            return this;
        }
    });

    //</feature>

    /**
     * Convenient alias of {@link Carcasse.Loader#require}. Please see the introduction documentation of
     * {@link Carcasse.Loader} for examples.
     * @member Carcasse
     * @method require
     * @inheritdoc Carcasse.Loader#require
     */
    Carcasse.require = alias(Loader, 'require');

    /**
     * Synchronous version of {@link Carcasse#require}, convenient alias of {@link Carcasse.Loader#syncRequire}.
     * @member Carcasse
     * @method syncRequire
     * @inheritdoc Carcasse.Loader#syncRequire
     */
    Carcasse.syncRequire = alias(Loader, 'syncRequire');

    /**
     * Convenient shortcut to {@link Carcasse.Loader#exclude}.
     * @member Carcasse
     * @method exclude
     * @inheritdoc Carcasse.Loader#exclude
     */
    Carcasse.exclude = alias(Loader, 'exclude');

    /**
     * Adds a listener to be notified when the document is ready and all dependencies are loaded.
     *
     * @param {Function} fn The method the event invokes.
     * @param {Object} [scope] The scope in which the handler function executes. Defaults to the browser window.
     * @param {Boolean} [options] Options object as passed to {@link Carcasse.Element#addListener}. It is recommended
     * that the options `{single: true}` be used so that the handler is removed on first invocation.
     * @member Carcasse
     * @method onReady
     */
    Carcasse.onReady = function(fn, scope, options) {
        Loader.onReady(fn, scope, true, options);
    };

    Class.registerPreprocessor('loader', function(cls, data, hooks, continueFn) {
        var me = this,
            dependencies = [],
            className = Manager.getName(cls),
            i, j, ln, subLn, value, propertyName, propertyValue;

        /*
        Loop through the dependencyProperties, look for string class names and push
        them into a stack, regardless of whether the property's value is a string, array or object. For example:
        {
              extend: 'Carcasse.MyClass',
              requires: ['Carcasse.some.OtherClass'],
              mixins: {
                  observable: 'Carcasse.mixin.Observable';
              }
        }
        which will later be transformed into:
        {
              extend: Carcasse.MyClass,
              requires: [Carcasse.some.OtherClass],
              mixins: {
                  observable: Carcasse.mixin.Observable;
              }
        }
        */

        for (i = 0,ln = dependencyProperties.length; i < ln; i++) {
            propertyName = dependencyProperties[i];

            if (data.hasOwnProperty(propertyName)) {
                propertyValue = data[propertyName];

                if (typeof propertyValue == 'string') {
                    dependencies.push(propertyValue);
                }
                else if (propertyValue instanceof Array) {
                    for (j = 0, subLn = propertyValue.length; j < subLn; j++) {
                        value = propertyValue[j];

                        if (typeof value == 'string') {
                            dependencies.push(value);
                        }
                    }
                }
                else if (typeof propertyValue != 'function') {
                    for (j in propertyValue) {
                        if (propertyValue.hasOwnProperty(j)) {
                            value = propertyValue[j];

                            if (typeof value == 'string') {
                                dependencies.push(value);
                            }
                        }
                    }
                }
            }
        }

        if (dependencies.length === 0) {
            return;
        }

        //<feature classSystem.loader>
        //<debug error>
        var deadlockPath = [],
            requiresMap = Loader.requiresMap,
            detectDeadlock;

        /*
        Automatically detect deadlocks before-hand,
        will throw an error with detailed path for ease of debugging. Examples of deadlock cases:

        - A extends B, then B extends A
        - A requires B, B requires C, then C requires A

        The detectDeadlock function will recursively transverse till the leaf, hence it can detect deadlocks
        no matter how deep the path is.
        */

        if (className) {
            requiresMap[className] = dependencies;
            //<debug>
            if (!Loader.requiredByMap) Loader.requiredByMap = {};
            Carcasse.Array.each(dependencies, function(dependency){
                if (!Loader.requiredByMap[dependency]) Loader.requiredByMap[dependency] = [];
                Loader.requiredByMap[dependency].push(className);
            });
            //</debug>
            detectDeadlock = function(cls) {
                deadlockPath.push(cls);

                if (requiresMap[cls]) {
                    if (Carcasse.Array.contains(requiresMap[cls], className)) {
                        throw new Error("Deadlock detected while loading dependencies! '" + className + "' and '" +
                                deadlockPath[1] + "' " + "mutually require each other. Path: " +
                                deadlockPath.join(' -> ') + " -> " + deadlockPath[0]);
                    }

                    for (i = 0,ln = requiresMap[cls].length; i < ln; i++) {
                        detectDeadlock(requiresMap[cls][i]);
                    }
                }
            };

            detectDeadlock(className);
        }

        //</debug>
        //</feature>

        Loader.require(dependencies, function() {
            for (i = 0,ln = dependencyProperties.length; i < ln; i++) {
                propertyName = dependencyProperties[i];

                if (data.hasOwnProperty(propertyName)) {
                    propertyValue = data[propertyName];

                    if (typeof propertyValue == 'string') {
                        data[propertyName] = Manager.get(propertyValue);
                    }
                    else if (propertyValue instanceof Array) {
                        for (j = 0, subLn = propertyValue.length; j < subLn; j++) {
                            value = propertyValue[j];

                            if (typeof value == 'string') {
                                data[propertyName][j] = Manager.get(value);
                            }
                        }
                    }
                    else if (typeof propertyValue != 'function') {
                        for (var k in propertyValue) {
                            if (propertyValue.hasOwnProperty(k)) {
                                value = propertyValue[k];

                                if (typeof value == 'string') {
                                    data[propertyName][k] = Manager.get(value);
                                }
                            }
                        }
                    }
                }
            }

            continueFn.call(me, cls, data, hooks);
        });

        return false;
    }, true, 'after', 'className');

    //<feature classSystem.loader>
    /**
     * @cfg {String[]} uses
     * @member Carcasse.Class
     * List of optional classes to load together with this class. These aren't necessarily loaded before
     * this class is created, but are guaranteed to be available before Carcasse.onReady listeners are
     * invoked
     */
    Manager.registerPostprocessor('uses', function(name, cls, data) {
        var uses = arrayFrom(data.uses),
            items = [],
            i, ln, item;

        for (i = 0,ln = uses.length; i < ln; i++) {
            item = uses[i];

            if (typeof item == 'string') {
                items.push(item);
            }
        }

        Loader.addOptionalRequires(items);
    });

    Manager.onCreated(function(className) {
        this.historyPush(className);
    }, Loader);
    //</feature>

})(Carcasse.ClassManager, Carcasse.Class, Carcasse.Function.flexSetter, Carcasse.Function.alias,
   Carcasse.Function.pass, Carcasse.Array.from, Carcasse.Array.erase, Carcasse.Array.include);

//@require Carcasse.Class
//@require Carcasse.ClassManager
//@require Carcasse.Loader

/**
 * Base class for all mixins.
 * @private
 */
Carcasse.define('Carcasse.mixin.Mixin', {
    onClassCarcasseended: function(cls, data) {
        var mixinConfig = data.mixinConfig,
            parentClassMixinConfig,
            beforeHooks, afterHooks;

        if (mixinConfig) {
            parentClassMixinConfig = cls.superclass.mixinConfig;

            if (parentClassMixinConfig) {
                mixinConfig = data.mixinConfig = Carcasse.merge({}, parentClassMixinConfig, mixinConfig);
            }

            data.mixinId = mixinConfig.id;

            beforeHooks = mixinConfig.beforeHooks;
            afterHooks = mixinConfig.hooks || mixinConfig.afterHooks;

            if (beforeHooks || afterHooks) {
                Carcasse.Function.interceptBefore(data, 'onClassMixedIn', function(targetClass) {
                    var mixin = this.prototype;

                    if (beforeHooks) {
                        Carcasse.Object.each(beforeHooks, function(from, to) {
                            targetClass.override(to, function() {
                                if (mixin[from].apply(this, arguments) !== false) {
                                    return this.callOverridden(arguments);
                                }
                            });
                        });
                    }

                    if (afterHooks) {
                        Carcasse.Object.each(afterHooks, function(from, to) {
                            targetClass.override(to, function() {
                                var ret = this.callOverridden(arguments);

                                mixin[from].apply(this, arguments);

                                return ret;
                            });
                        });
                    }
                });
            }
        }
    }
});

/*
DeftJS 0.6.7

Copyright (c) 2012 [DeftJS Framework Contributors](http://deftjs.org)
Open source under the [MIT License](http://en.wikipedia.org/wiki/MIT_License).
*/
Carcasse.define('Carcasse.log.Logger', {
  alternateClassName: ['Carcasse.Logger'],
  singleton: true,
  log: function(message, priority) {},
  error: function(message) {
    this.log(message, 'error');
  },
  info: function(message) {
    this.log(message, 'info');
  },
  verbose: function(message) {
    this.log(message, 'verbose');
  },
  warn: function(message) {
    this.log(message, 'warn');
  },
  deprecate: function(message) {
    this.log(message, 'deprecate');
  }
}, function() {
  var _ref;
  if (Carcasse.isFunction((_ref = Carcasse.Logger) != null ? _ref.log : void 0)) {
    this.log = Carcasse.bind(Carcasse.Logger.log, Carcasse.Logger);
  } else if (Carcasse.isFunction(Carcasse.log)) {
    this.log = function(message, priority) {
      if (priority == null) {
        priority = 'info';
      }
      if (priority === 'deprecate') {
        priority = 'warn';
      }
      Carcasse.log({
        msg: message,
        level: priority
      });
    };
  }
});

/**
 * @class Carcasse.util.Function
 * @singleton
 */
Carcasse.define('Carcasse.util.Function', {
  statics: {
    /**
            Creates a new wrapper function that spreads the passed Array over the target function arguments.
    */

    spread: function(fn, scope) {
      return function(array) {
        if (!Carcasse.isArray(array)) {
          Carcasse.Error.raise({
            msg: "Error spreading passed Array over target function arguments: passed a non-Array."
          });
        }
        return fn.apply(scope, array);
      };
    },
    /**
            Returns a new wrapper function that caches the return value for previously processed function argument(s).
    */

    memoize: function(fn, scope, hashFn) {
      var memo;
      memo = {};
      return function(value) {
        var key;
        key = Carcasse.isFunction(hashFn) ? hashFn.apply(scope, arguments) : value;
        if (!(key in memo)) {
          memo[key] = fn.apply(scope, arguments);
        }
        return memo[key];
      };
    }
  }
});

/**
@private

Used by {@link Carcasse.ioc.Injector}.
*/

Carcasse.define('Carcasse.ioc.DependencyProvider', {
  requires: ['Carcasse.log.Logger'],
  config: {
    identifier: null,
    /**
            Class to be instantiated, by either full name, alias or alternate name, to resolve this dependency.
    */

    className: null,
    /**
            Optional arguments to pass to the class' constructor when instantiating a class to resolve this dependency.
    */

    parameters: null,
    /**
            Factory function to be executed to obtain the corresponding object instance or value to resolve this dependency.
            
            NOTE: For lazily instantiated dependencies, this function will be passed the object instance for which the dependency is being resolved.
    */

    fn: null,
    /**
            Value to use to resolve this dependency.
    */

    value: null,
    /**
            Indicates whether this dependency should be resolved as a singleton, or as a transient value for each resolution request.
    */

    singleton: true,
    /**
            Indicates whether this dependency should be 'eagerly' instantiated when this provider is defined, rather than 'lazily' instantiated when later requested.
            
            NOTE: Only valid when either a factory function or class is specified as a singleton.
    */

    eager: false
  },
  constructor: function(config) {
    var classDefinition;
    this.initConfig(config);
    if ((config.value != null) && config.value.constructor === Object) {
      this.setValue(config.value);
    }
    if (this.getEager()) {
      if (this.getValue() != null) {
        Carcasse.Error.raise({
          msg: "Error while configuring '" + (this.getIdentifier()) + "': a 'value' cannot be created eagerly."
        });
      }
      if (!this.getSingleton()) {
        Carcasse.Error.raise({
          msg: "Error while configuring '" + (this.getIdentifier()) + "': only singletons can be created eagerly."
        });
      }
    }
    if (this.getClassName() != null) {
      classDefinition = Carcasse.ClassManager.get(this.getClassName());
      if (!(classDefinition != null)) {
        Carcasse.Logger.warn("Synchronously loading '" + (this.getClassName()) + "'; consider adding Carcasse.require('" + (this.getClassName()) + "') above Carcasse.onReady.");
        Carcasse.syncRequire(this.getClassName());
        classDefinition = Carcasse.ClassManager.get(this.getClassName());
      }
      if (!(classDefinition != null)) {
        Carcasse.Error.raise({
          msg: "Error while configuring rule for '" + (this.getIdentifier()) + "': unrecognized class name or alias: '" + (this.getClassName()) + "'"
        });
      }
    }
    if (!this.getSingleton()) {
      if (this.getClassName() != null) {
        if (Carcasse.ClassManager.get(this.getClassName()).singleton) {
          Carcasse.Error.raise({
            msg: "Error while configuring rule for '" + (this.getIdentifier()) + "': singleton classes cannot be configured for injection as a prototype. Consider removing 'singleton: true' from the class definition."
          });
        }
      }
      if (this.getValue() != null) {
        Carcasse.Error.raise({
          msg: "Error while configuring '" + (this.getIdentifier()) + "': a 'value' can only be configured as a singleton."
        });
      }
    } else {
      if ((this.getClassName() != null) && (this.getParameters() != null)) {
        if (Carcasse.ClassManager.get(this.getClassName()).singleton) {
          Carcasse.Error.raise({
            msg: "Error while configuring rule for '" + (this.getIdentifier()) + "': parameters cannot be applied to singleton classes. Consider removing 'singleton: true' from the class definition."
          });
        }
      }
    }
    return this;
  },
  /**
    Resolve a target instance's dependency with an object instance or value generated by this dependency provider.
  */

  resolve: function(targetInstance) {
    var instance, parameters;
    Carcasse.Logger.log("Resolving '" + (this.getIdentifier()) + "'.");
    if (this.getValue() != null) {
      return this.getValue();
    }
    instance = null;
    if (this.getFn() != null) {
      Carcasse.Logger.log("Executing factory function.");
      instance = this.getFn().call(null, targetInstance);
    } else if (this.getClassName() != null) {
      if (Carcasse.ClassManager.get(this.getClassName()).singleton) {
        Carcasse.Logger.log("Using existing singleton instance of '" + (this.getClassName()) + "'.");
        instance = Carcasse.ClassManager.get(this.getClassName());
      } else {
        Carcasse.Logger.log("Creating instance of '" + (this.getClassName()) + "'.");
        parameters = this.getParameters() != null ? [this.getClassName()].concat(this.getParameters()) : [this.getClassName()];
        instance = Carcasse.create.apply(this, parameters);
      }
    } else {
      Carcasse.Error.raise({
        msg: "Error while configuring rule for '" + (this.getIdentifier()) + "': no 'value', 'fn', or 'className' was specified."
      });
    }
    if (this.getSingleton()) {
      this.setValue(instance);
    }
    return instance;
  }
});

/**
A lightweight IoC container for dependency injection.

Used in conjunction with {@link Carcasse.mixin.Injectable}.
*/

Carcasse.define('Carcasse.ioc.Injector', {
  alternateClassName: ['Carcasse.Injector'],
  requires: ['Carcasse.log.Logger', 'Carcasse.ioc.DependencyProvider'],
  singleton: true,
  constructor: function() {
    this.providers = {};
    return this;
  },
  /**
    Configure the Injector.
  */

  configure: function(configuration) {
    Carcasse.Logger.log('Configuring injector.');
    Carcasse.Object.each(configuration, function(identifier, config) {
      var provider;
      Carcasse.Logger.log("Configuring dependency provider for '" + identifier + "'.");
      if (Carcasse.isString(config)) {
        provider = Carcasse.create('Carcasse.ioc.DependencyProvider', {
          identifier: identifier,
          className: config
        });
      } else {
        provider = Carcasse.create('Carcasse.ioc.DependencyProvider', Carcasse.apply({
          identifier: identifier
        }, config));
      }
      this.providers[identifier] = provider;
    }, this);
    Carcasse.Object.each(this.providers, function(identifier, provider) {
      if (provider.getEager()) {
        Carcasse.Logger.log("Eagerly creating '" + (provider.getIdentifier()) + "'.");
        provider.resolve();
      }
    }, this);
  },
  /**
    Indicates whether the Injector can resolve a dependency by the specified identifier with the corresponding object instance or value.
  */

  canResolve: function(identifier) {
    var provider;
    provider = this.providers[identifier];
    return provider != null;
  },
  /**
    Resolve a dependency (by identifier) with the corresponding object instance or value.
    
    Optionally, the caller may specify the target instance (to be supplied to the dependency provider's factory function, if applicable).
  */

  resolve: function(identifier, targetInstance) {
    var provider;
    provider = this.providers[identifier];
    if (provider != null) {
      return provider.resolve(targetInstance);
    } else {
      Carcasse.Error.raise({
        msg: "Error while resolving value to inject: no dependency provider found for '" + identifier + "'."
      });
    }
  },
  /**
    Inject dependencies (by their identifiers) into the target object instance.
  */

  inject: function(identifiers, targetInstance, targetInstanceIsInitialized) {
    var injectConfig, name, originalInitConfigFunction, setterFunctionName, value;
    if (targetInstanceIsInitialized == null) {
      targetInstanceIsInitialized = true;
    }
    injectConfig = {};
    if (Carcasse.isString(identifiers)) {
      identifiers = [identifiers];
    }
    Carcasse.Object.each(identifiers, function(key, value) {
      var identifier, resolvedValue, targetProperty;
      targetProperty = Carcasse.isArray(identifiers) ? value : key;
      identifier = value;
      resolvedValue = this.resolve(identifier, targetInstance);
      if (targetProperty in targetInstance.config) {
        Carcasse.Logger.log("Injecting '" + identifier + "' into '" + targetProperty + "' config.");
        injectConfig[targetProperty] = resolvedValue;
      } else {
        Carcasse.Logger.log("Injecting '" + identifier + "' into '" + targetProperty + "' property.");
        targetInstance[targetProperty] = resolvedValue;
      }
    }, this);
    if (targetInstanceIsInitialized) {
      for (name in injectConfig) {
        value = injectConfig[name];
        setterFunctionName = 'set' + Carcasse.String.capitalize(name);
        targetInstance[setterFunctionName].call(targetInstance, value);
      }
    } else {
      if (Carcasse.isFunction(targetInstance.initConfig)) {
        originalInitConfigFunction = targetInstance.initConfig;
        targetInstance.initConfig = function(config) {
          var result;
          result = originalInitConfigFunction.call(this, Carcasse.Object.merge({}, config || {}, injectConfig));
          return result;
        };
      }
    }
    return targetInstance;
  }
});

/**
A mixin that marks a class as participating in dependency injection.

Used in conjunction with {@link Carcasse.ioc.Injector}.
*/

Carcasse.define('Carcasse.mixin.Injectable', {
  requires: ['Carcasse.ioc.Injector'],
  /**
    @private
  */

  onClassMixedIn: function(targetClass) {
    targetClass.prototype.constructor = Carcasse.Function.createInterceptor(targetClass.prototype.constructor, function() {
      return Carcasse.Injector.inject(this.inject, this, false);
    });
  }
});

/**
A lightweight MVC view controller.

Used in conjunction with {@link Carcasse.mixin.Controllable}.
*/

Carcasse.define('Carcasse.mvc.ViewController', {
  alternateClassName: ['Carcasse.ViewController'],
  requires: ['Carcasse.log.Logger'],
  config: {
    /**
            View controlled by this ViewController.
    */

    view: null
  },
  constructor: function(config) {
    this.initConfig(config);
    if (this.getView() instanceof Carcasse.ClassManager.get('Carcasse.Component')) {
      this.registeredComponents = {};
      this.isExtJS = this.getView().events != null;
      this.isSenchaTouch = !this.isExtJS;
      if (this.isExtJS) {
        if (this.getView().rendered) {
          this.onViewInitialize();
        } else {
          this.getView().on('afterrender', this.onViewInitialize, this, {
            single: true
          });
        }
      } else {
        if (this.getView().initialized) {
          this.onViewInitialize();
        } else {
          this.getView().on('initialize', this.onViewInitialize, this, {
            single: true
          });
        }
      }
    } else {
      Carcasse.Error.raise({
        msg: 'Error constructing ViewController: the configured \'view\' is not an Carcasse.Component.'
      });
    }
    return this;
  },
  /**
    Initialize the ViewController
  */

  init: function() {},
  /**
    Destroy the ViewController
  */

  destroy: function() {
    return true;
  },
  /**
    @private
  */

  onViewInitialize: function() {
    var component, config, id, listeners, originalViewDestroyFunction, self, _ref;
    if (this.isExtJS) {
      this.getView().on('beforedestroy', this.onViewBeforeDestroy, this);
      this.getView().on('destroy', this.onViewDestroy, this, {
        single: true
      });
    } else {
      self = this;
      originalViewDestroyFunction = this.getView().destroy;
      this.getView().destroy = function() {
        if (self.destroy()) {
          originalViewDestroyFunction.call(this);
        }
      };
    }
    _ref = this.control;
    for (id in _ref) {
      config = _ref[id];
      component = this.locateComponent(id, config);
      listeners = Carcasse.isObject(config.listeners) ? config.listeners : !(config.selector != null) ? config : void 0;
      this.registerComponent(id, component, listeners);
    }
    this.init();
  },
  /**
    @private
  */

  onViewBeforeDestroy: function() {
    if (this.destroy()) {
      this.getView().un('beforedestroy', this.onBeforeDestroy, this);
      return true;
    }
    return false;
  },
  /**
    @private
  */

  onViewDestroy: function() {
    var id;
    for (id in this.registeredComponents) {
      this.unregisterComponent(id);
    }
  },
  /**
    @private
  */

  getComponent: function(id) {
    var _ref;
    return (_ref = this.registeredComponents[id]) != null ? _ref.component : void 0;
  },
  /**
    @private
  */

  registerComponent: function(id, component, listeners) {
    var event, existingComponent, fn, getterName, listener, options, scope;
    Carcasse.Logger.log("Registering '" + id + "' component.");
    existingComponent = this.getComponent(id);
    if (existingComponent != null) {
      Carcasse.Error.raise({
        msg: "Error registering component: an existing component already registered as '" + id + "'."
      });
    }
    this.registeredComponents[id] = {
      component: component,
      listeners: listeners
    };
    if (id !== 'view') {
      getterName = 'get' + Carcasse.String.capitalize(id);
      if (!this[getterName]) {
        this[getterName] = Carcasse.Function.pass(this.getComponent, [id], this);
      }
    }
    if (Carcasse.isObject(listeners)) {
      for (event in listeners) {
        listener = listeners[event];
        fn = listener;
        scope = this;
        options = null;
        if (Carcasse.isObject(listener)) {
          options = Carcasse.apply({}, listener);
          if (options.fn != null) {
            fn = options.fn;
            delete options.fn;
          }
          if (options.scope != null) {
            scope = options.scope;
            delete options.scope;
          }
        }
        Carcasse.Logger.log("Adding '" + event + "' listener to '" + id + "'.");
        if (Carcasse.isFunction(fn)) {
          component.on(event, fn, scope, options);
        } else if (Carcasse.isFunction(this[fn])) {
          component.on(event, this[fn], scope, options);
        } else {
          Carcasse.Error.raise({
            msg: "Error adding '" + event + "' listener: the specified handler '" + fn + "' is not a Function or does not exist."
          });
        }
      }
    }
  },
  /**
    @private
  */

  unregisterComponent: function(id) {
    var component, event, existingComponent, fn, getterName, listener, listeners, options, scope, _ref;
    Carcasse.Logger.log("Unregistering '" + id + "' component.");
    existingComponent = this.getComponent(id);
    if (!(existingComponent != null)) {
      Carcasse.Error.raise({
        msg: "Error unregistering component: no component is registered as '" + id + "'."
      });
    }
    _ref = this.registeredComponents[id], component = _ref.component, listeners = _ref.listeners;
    if (Carcasse.isObject(listeners)) {
      for (event in listeners) {
        listener = listeners[event];
        fn = listener;
        scope = this;
        if (Carcasse.isObject(listener)) {
          options = listener;
          if (options.fn != null) {
            fn = options.fn;
          }
          if (options.scope != null) {
            scope = options.scope;
          }
        }
        Carcasse.Logger.log("Removing '" + event + "' listener from '" + id + "'.");
        if (Carcasse.isFunction(fn)) {
          component.un(event, fn, scope);
        } else if (Carcasse.isFunction(this[fn])) {
          component.un(event, this[fn], scope);
        } else {
          Carcasse.Error.raise({
            msg: "Error removing '" + event + "' listener: the specified handler '" + fn + "' is not a Function or does not exist."
          });
        }
      }
    }
    if (id !== 'view') {
      getterName = 'get' + Carcasse.String.capitalize(id);
      this[getterName] = null;
    }
    this.registeredComponents[id] = null;
  },
  /**
    @private
  */

  locateComponent: function(id, config) {
    var matches, view;
    view = this.getView();
    if (id === 'view') {
      return view;
    }
    if (Carcasse.isString(config)) {
      matches = view.query(config);
      if (matches.length === 0) {
        Carcasse.Error.raise({
          msg: "Error locating component: no component found matching '" + config + "'."
        });
      }
      if (matches.length > 1) {
        Carcasse.Error.raise({
          msg: "Error locating component: multiple components found matching '" + config + "'."
        });
      }
      return matches[0];
    } else if (Carcasse.isString(config.selector)) {
      matches = view.query(config.selector);
      if (matches.length === 0) {
        Carcasse.Error.raise({
          msg: "Error locating component: no component found matching '" + config.selector + "'."
        });
      }
      if (matches.length > 1) {
        Carcasse.Error.raise({
          msg: "Error locating component: multiple components found matching '" + config.selector + "'."
        });
      }
      return matches[0];
    } else {
      matches = view.query('#' + id);
      if (matches.length === 0) {
        Carcasse.Error.raise({
          msg: "Error locating component: no component found with an itemId of '" + id + "'."
        });
      }
      if (matches.length > 1) {
        Carcasse.Error.raise({
          msg: "Error locating component: multiple components found with an itemId of '" + id + "'."
        });
      }
      return matches[0];
    }
  }
});

/**
A mixin that creates and attaches the specified view controller(s) to the target view.

Used in conjunction with {@link Carcasse.mvc.ViewController}.
*/

Carcasse.define('Carcasse.mixin.Controllable', {});

Carcasse.Class.registerPreprocessor('controller', function(Class, data, hooks, callback) {
  var controllerClass, parameters, self;
  if (arguments.length === 3) {
    parameters = Carcasse.toArray(arguments);
    hooks = parameters[1];
    callback = parameters[2];
  }
  if ((data.mixins != null) && Carcasse.Array.contains(data.mixins, Carcasse.ClassManager.get('Carcasse.mixin.Controllable'))) {
    controllerClass = data.controller;
    delete data.controller;
    if (controllerClass != null) {
      Class.prototype.constructor = Carcasse.Function.createSequence(Class.prototype.constructor, function() {
        var controller;
        try {
          controller = Carcasse.create(controllerClass, {
            view: this
          });
        } catch (error) {
          Carcasse.Logger.warn("Error initializing Controllable instance: an error occurred while creating an instance of the specified controller: '" + controllerClass + "'.");
          throw error;
        }
        if (!(this.getController != null)) {
          this.getController = function() {
            return controller;
          };
          Class.prototype.destroy = Carcasse.Function.createSequence(Class.prototype.destroy, function() {
            delete this.getController;
          });
        }
      });
      self = this;
      Carcasse.require([controllerClass], function() {
        if (callback != null) {
          callback.call(self, Class, data, hooks);
        }
      });
      return false;
    }
  }
});

Carcasse.Class.setDefaultPreprocessorPosition('controller', 'before', 'mixins');

/**
 * @class Carcasse.promise.Deferred
 */
Carcasse.define('Carcasse.promise.Deferred', {
  alternateClassName: ['Carcasse.Deferred'],
  constructor: function() {
    this.state = 'pending';
    this.progress = void 0;
    this.value = void 0;
    this.progressCallbacks = [];
    this.successCallbacks = [];
    this.failureCallbacks = [];
    this.cancelCallbacks = [];
    this.promise = Carcasse.create('Carcasse.Promise', this);
    return this;
  },
  /**
   * Returns a new {@link Carcasse.promise.Promise} with the specified callbacks registered to be called when this {@link Carcasse.promise.Deferred} is resolved, rejected, updated or cancelled.
   */
  then: function(callbacks) {
    var callback, cancelCallback, deferred, failureCallback, progressCallback, successCallback, wrapCallback, wrapProgressCallback, _i, _len, _ref;
    if (Carcasse.isObject(callbacks)) {
      successCallback = callbacks.success, failureCallback = callbacks.failure, progressCallback = callbacks.progress, cancelCallback = callbacks.cancel;
    } else {
      successCallback = arguments[0], failureCallback = arguments[1], progressCallback = arguments[2], cancelCallback = arguments[3];
    }
    _ref = [successCallback, failureCallback, progressCallback, cancelCallback];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      callback = _ref[_i];
      if (!(Carcasse.isFunction(callback) || callback === null || callback === void 0)) {
        Carcasse.Error.raise({
          msg: 'Error while configuring callback: a non-function specified.'
        });
      }
    }
    deferred = Carcasse.create('Carcasse.promise.Deferred');
    wrapCallback = function(callback, action) {
      return function(value) {
        var result;
        if (Carcasse.isFunction(callback)) {
          try {
            result = callback(value);
            if (result === void 0) {
              deferred[action](value);
            } else if (result instanceof Carcasse.ClassManager.get('Carcasse.promise.Promise') || result instanceof Carcasse.ClassManager.get('Carcasse.promise.Deferred')) {
              result.then(Carcasse.bind(deferred.resolve, deferred), Carcasse.bind(deferred.reject, deferred), Carcasse.bind(deferred.update, deferred), Carcasse.bind(deferred.cancel, deferred));
            } else {
              deferred.resolve(result);
            }
          } catch (error) {
            deferred.reject(error);
          }
        } else {
          deferred[action](value);
        }
      };
    };
    this.register(wrapCallback(successCallback, 'resolve'), this.successCallbacks, 'resolved', this.value);
    this.register(wrapCallback(failureCallback, 'reject'), this.failureCallbacks, 'rejected', this.value);
    this.register(wrapCallback(cancelCallback, 'cancel'), this.cancelCallbacks, 'cancelled', this.value);
    wrapProgressCallback = function(callback) {
      return function(value) {
        var result;
        if (Carcasse.isFunction(callback)) {
          result = callback(value);
          if (result === void 0) {
            deferred.update(value);
          } else {
            deferred.update(result);
          }
        } else {
          deferred.update(value);
        }
      };
    };
    this.register(wrapProgressCallback(progressCallback), this.progressCallbacks, 'pending', this.progress);
    return deferred.getPromise();
  },
  /**
    Returns a new {@link Carcasse.promise.Promise} with the specified callbacks registered to be called when this {@link Carcasse.promise.Deferred} is either resolved, rejected, or cancelled.
  */

  always: function(alwaysCallback) {
    return this.then({
      success: alwaysCallback,
      failure: alwaysCallback,
      cancel: alwaysCallback
    });
  },
  /**
    Update progress for this {@link Carcasse.promise.Deferred} and notify relevant callbacks.
  */

  update: function(progress) {
    if (this.state === 'pending') {
      this.progress = progress;
      this.notify(this.progressCallbacks, progress);
    } else {
      Carcasse.Error.raise({
        msg: 'Error: this Deferred has already been completed and cannot be modified.'
      });
    }
  },
  /**
    Resolve this {@link Carcasse.promise.Deferred} and notify relevant callbacks.
  */

  resolve: function(value) {
    this.complete('resolved', value, this.successCallbacks);
  },
  /**
    Reject this {@link Carcasse.promise.Deferred} and notify relevant callbacks.
  */

  reject: function(error) {
    this.complete('rejected', error, this.failureCallbacks);
  },
  /**
    Cancel this {@link Carcasse.promise.Deferred} and notify relevant callbacks.
  */

  cancel: function(reason) {
    this.complete('cancelled', reason, this.cancelCallbacks);
  },
  /**
    Get this {@link Carcasse.promise.Deferred}'s associated {@link Carcasse.promise.Promise}.
  */

  getPromise: function() {
    return this.promise;
  },
  /**
    Get this {@link Carcasse.promise.Deferred}'s current state.
  */

  getState: function() {
    return this.state;
  },
  /**
    Register a callback for this {@link Carcasse.promise.Deferred} for the specified callbacks and state, immediately notifying with the specified value (if applicable).
    @private
  */

  register: function(callback, callbacks, state, value) {
    if (Carcasse.isFunction(callback)) {
      if (this.state === 'pending') {
        callbacks.push(callback);
        if (this.state === state && value !== void 0) {
          this.notify([callback], value);
        }
      } else {
        if (this.state === state) {
          this.notify([callback], value);
        }
      }
    }
  },
  /**
    Complete this {@link Carcasse.promise.Deferred} with the specified state and value.
    @private
  */

  complete: function(state, value, callbacks) {
    if (this.state === 'pending') {
      this.state = state;
      this.value = value;
      this.notify(callbacks, value);
      this.releaseCallbacks();
    } else {
      Carcasse.Error.raise({
        msg: 'Error: this Deferred has already been completed and cannot be modified.'
      });
    }
  },
  /**
    Notify the specified callbacks with the specified value.
    @private
  */

  notify: function(callbacks, value) {
    var callback, _i, _len;
    for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
      callback = callbacks[_i];
      callback(value);
    }
  },
  /**
    Release references to all callbacks registered with this {@link Carcasse.promise.Deferred}.
    @private
  */

  releaseCallbacks: function() {
    this.progressCallbacks = null;
    this.successCallbacks = null;
    this.failureCallbacks = null;
    this.cancelCallbacks = null;
  }
});

/*
Promise.when(), all(), any(), map() and reduce() methods adapted from:
[when.js](https://github.com/cujojs/when)
Copyright (c) B Cavalier & J Hann
Open source under the [MIT License](http://en.wikipedia.org/wiki/MIT_License).
*/

Carcasse.define('Carcasse.promise.Promise', {
  alternateClassName: ['Carcasse.Promise'],
  statics: {
    /**
            Returns a new {@link Carcasse.promise.Promise} that:
            - resolves immediately for the specified value, or
            - resolves, rejects, updates or cancels when the specified {@link Carcasse.promise.Deferred} or {@link Carcasse.promise.Promise} is resolved, rejected, updated or cancelled.
    */

    when: function(promiseOrValue) {
      var deferred;
      if (promiseOrValue instanceof Carcasse.ClassManager.get('Carcasse.promise.Promise') || promiseOrValue instanceof Carcasse.ClassManager.get('Carcasse.promise.Deferred')) {
        return promiseOrValue.then();
      } else {
        deferred = Carcasse.create('Carcasse.promise.Deferred');
        deferred.resolve(promiseOrValue);
        return deferred.then();
      }
    },
    /**
            Returns a new {@link Carcasse.promise.Promise} that will only resolve once all the specified `promisesOrValues` have resolved.
            The resolution value will be an Array containing the resolution value of each of the `promisesOrValues`.
    */

    all: function(promisesOrValues) {
      var promise, results;
      results = new Array(promisesOrValues.length);
      promise = this.reduce(promisesOrValues, this.reduceIntoArray, results);
      return this.when(promise);
    },
    /**
            Returns a new {@link Carcasse.promise.Promise} that will only resolve once any one of the the specified `promisesOrValues` has resolved.
            The resolution value will be the resolution value of the triggering `promiseOrValue`.
    */

    any: function(promisesOrValues) {
      var complete, deferred, index, progressFunction, promiseOrValue, rejectFunction, rejecter, resolveFunction, resolver, updater, _i, _len;
      deferred = Carcasse.create('Carcasse.promise.Deferred');
      updater = function(progress) {
        deferred.update(progress);
      };
      resolver = function(value) {
        complete();
        deferred.resolve(value);
      };
      rejecter = function(error) {
        complete();
        deferred.reject(error);
      };
      complete = function() {
        return updater = resolver = rejecter = function() {};
      };
      resolveFunction = function(value) {
        return resolver(value);
      };
      rejectFunction = function(value) {
        return rejector(value);
      };
      progressFunction = function(value) {
        return updater(value);
      };
      for (index = _i = 0, _len = promisesOrValues.length; _i < _len; index = ++_i) {
        promiseOrValue = promisesOrValues[index];
        if (index in promisesOrValues) {
          this.when(promiseOrValue).then(resolveFunction, rejectFunction, progressFunction);
        }
      }
      return this.when(deferred);
    },
    /**
            Returns a new function that wraps the specified function and caches the results for previously processed inputs.
            Similar to `Carcasse.util.Function::memoize()`, except it allows input to contain promises and/or values.
    */

    memoize: function(fn, scope, hashFn) {
      return this.all(Carcasse.Array.toArray(arguments)).then(Carcasse.util.Function.spread(function() {
        return Carcasse.util.memoize(arguments, scope, hashFn);
      }, scope));
    },
    /**
            Traditional map function, similar to `Array.prototype.map()`, that allows input to contain promises and/or values.
            The specified map function may return either a value or a promise.
    */

    map: function(promisesOrValues, mapFunction) {
      var index, promiseOrValue, results, _i, _len;
      results = new Array(promisesOrValues.length);
      for (index = _i = 0, _len = promisesOrValues.length; _i < _len; index = ++_i) {
        promiseOrValue = promisesOrValues[index];
        if (index in promisesOrValues) {
          results[index] = this.when(promiseOrValue, mapFunction);
        }
      }
      return this.reduce(results, this.reduceIntoArray, results);
    },
    /**
            Traditional reduce function, similar to `Array.reduce()`, that allows input to contain promises and/or values.
    */

    reduce: function(promisesOrValues, reduceFunction, initialValue) {
      var reduceArguments, whenResolved;
      whenResolved = this.when;
      reduceArguments = [
        function(previousValueOrPromise, currentValueOrPromise, currentIndex) {
          return whenResolved(previousValueOrPromise, function(previousValue) {
            return whenResolved(currentValueOrPromise, function(currentValue) {
              return reduceFunction(previousValue, currentValue, currentIndex, promisesOrValues);
            });
          });
        }
      ];
      if (arguments.length === 3) {
        reduceArguments.push(initialValue);
      }
      return this.when(this.reduceArray.apply(promisesOrValues, reduceArguments));
    },
    /**
            Fallback implementation when Array.reduce is not available.
            @private
    */

    reduceArray: function(reduceFunction, initialValue) {
      var args, array, index, length, reduced;
      index = 0;
      array = Object(this);
      length = array.length >>> 0;
      args = arguments;
      if (args.length <= 1) {
        while (true) {
          if (index in array) {
            reduced = array[index++];
            break;
          }
          if (++index >= length) {
            throw new TypeError();
          }
        }
      } else {
        reduced = args[1];
      }
      while (index < length) {
        if (index in array) {
          reduced = reduceFunction(reduced, array[index], index, array);
        }
        index++;
      }
      return reduced;
    },
    /**
            @private
    */

    reduceIntoArray: function(previousValue, currentValue, currentIndex) {
      previousValue[currentIndex] = currentValue;
      return previousValue;
    }
  },
  constructor: function(deferred) {
    this.deferred = deferred;
    return this;
  },
  /**
    Returns a new {@link Carcasse.promise.Promise} with the specified callbacks registered to be called when this {@link Carcasse.promise.Promise} is resolved, rejected, updated or cancelled.
  */

  then: function(callbacks) {
    return this.deferred.then.apply(this.deferred, arguments);
  },
  /**
    Returns a new {@link Carcasse.promise.Promise} with the specified callback registered to be called when this {@link Carcasse.promise.Promise} is resolved, rejected or cancelled.
  */

  always: function(callback) {
    return this.deferred.always(callback);
  },
  /**
    Cancel this {@link Carcasse.promise.Promise} and notify relevant callbacks.
  */

  cancel: function(reason) {
    return this.deferred.cancel(reason);
  },
  /**
    Get this {@link Carcasse.promise.Promise}'s current state.
  */

  getState: function() {
    return this.deferred.getState();
  }
}, function() {
  if (Array.prototype.reduce != null) {
    this.reduceArray = Array.prototype.reduce;
  }
});

if (typeof module === 'object') {
    module.exports = Carcasse;
}