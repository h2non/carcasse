# WORK IN PROGRESS, KEEP IN TOUCH!

# Carcasse

`Build structured, modular and object-oriented JavaScript projects`

## Introduction

Today, JavaScript applications are bigger and tend to be complex. The client-side environment becomes a significant part of any Web application. New ways to structure and modularize your code are needed.
Carcasse's goal is to provide an easy-to-use, robust, modern and object-oriented system to structure and modularize (and prettify) your JavaScript code.

## About

Carcasse takes the advanced Sencha class system introducing powerful advantages to the way to structure and build your JavaScript project. 

## Goals

* **Flexibility**
	* Coordinates dynamic assembly of object dependencies based on a configurable IoC container.
* **Approachability**
	* Builds on familiar Ext JS API syntax conventions for 'pay-as-you-go' complexity.
* **Simplicity**
	* Eliminates boilerplate code in favor of the simplest expression of developer intent.
* **Testability**
	* Promotes loose coupling through class annotation driven dependency injection.
* **Extensibility**
	* Leverages the advanced class system provided by Ext JS and Sencha Touch.
* **Reusability**
	* Enables business layer code reuse between Ext JS and Sencha Touch applications.

## Features

* **IoC Container**
	* Provides class annotation driven dependency injection.
	* Maps dependencies by user-defined identifiers.
	* Resolves dependencies by class instance, factory function or value.
	* Supports singleton and prototype resolution of class instance and factory function dependencies.
	* Offers eager and lazy instantiation of dependencies.
	* Injects dependencies into Ext JS class configs and properties before the class constructor is executed.

* **Promises and Deferreds**
	* Provides an elegant way to represent a 'future value' resulting from an asynchronous operation.
	* Offers a consistent, readable API for registering success, failure, cancellation or progress callbacks.
	* Allows chaining of transformation and processing of future values.
	* Simplifies processing of a set of future values via utility functions including all(), any(), map() and reduce().
	* Implements the CommonJS Promises/A specification.

## API

## Carcasse.ioc.Injector

A lightweight IoC container for dependency injection.

### Configuration

**Classes**

In the simplest scenario, the Injector can be configured to map identifiers by class names:

```javascript
Carcasse.Injector.configure({
	contactStore: 'MyApp.store.ContactStore',
	contactManager: 'MyApp.manager.ContactManager',
	...
});
```

## Examples

### TODO

## Authors

- Library author and maintaner
	* Tomas Aparicio <tomas@rijndael-project.com>
- Sencha class system
	* Sencha framework authors <http://sencha.com>
- Third-party authors
	* John Yanarella
	* Ryan Campbell
	* Brian Kotek
	* David Tucker

## License

```
Carcasse JS
Copyright (C) 2012 Tomas Aparicio <tomas@rijndael-project.com>
Copyright (C) 2012 Sencha Inc <http://www.sencha.com>
Copyright (C) 2012 DeftJS Authors <http://deftjs.org/>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
```

See LICENSE.md