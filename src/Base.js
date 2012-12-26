

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