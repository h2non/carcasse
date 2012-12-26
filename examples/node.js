
var Ext = require('../carcasse.js');

Ext.define('Person', {
    singleton: true,
    constructor: function () {
        console.log('Constructor called!');
    },
    legs: 2,
    getLegs: function () {
        return this.legs;
    }
});