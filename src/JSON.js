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
 * @member Carcass
 * @method encode
 * @alias Carcasse.JSON#encode
 */
Carcasse.encode = Carcasse.JSON.encode;
/**
 * Shorthand for {@link Carcasse.JSON#decode}.
 * @member Carcass
 * @method decode
 * @alias Carcasse.JSON#decode
 */
Carcasse.decode = Carcasse.JSON.decode;