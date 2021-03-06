var EventEmitter = require('events').EventEmitter;

function inherits(Child, Parent) {
	Child.prototype = Object.create(Parent.prototype, {
		constructor: { value: Child, enumerable: false, writable: true, configurable: true }
	});
}

var TimedNumber = function (tSource, ticks) {
	if (typeof tSource !== 'object') {
		throw new Error('You must instantiate TimedNumber with an Object.');
	}

	// Detect if we're using something that has a setter, ie. tomes.

	var hasSetFunction = typeof Object.getPrototypeOf(tSource).set === 'function';

	function set(key, value) {
		if (hasSetFunction) {
			tValue.set(key, value);
		} else {
			tValue[key] = value;
		}
	}

	this.now = function () {
		return Date.now() / 1000 << 0;
	};

	var tValue = this.source = tSource;

	// Set up some sane default values.

	if (!tValue.hasOwnProperty('last')) {
		set('last', 0);
	}

	var that = this;
	this.last = tValue.last;
	var max = this.max = tValue.hasOwnProperty('max') ? tValue.max : Infinity;
	var min = this.min = tValue.hasOwnProperty('min') ? tValue.min : -Infinity;
	var rate = this.rate = tValue.hasOwnProperty('rate') ? tValue.rate : 0;
	var interval = this.interval = tValue.hasOwnProperty('interval') ? tValue.interval : 1;

	var lastTick = this.lastTick = function () {
		return that.now() - (that.now() - that.last) % interval;
	};

	if (!tValue.hasOwnProperty('val')) {
		set('val', 0);
	}

	this.get = function () {
		var diff = ((lastTick() - tValue.last) / interval) >> 0;
		var calc = tValue.val + (diff * rate);
		return Math.max(min, Math.min(max, calc));
	};

	this.set = function (value) {
		var newVal = Math.max(min, Math.min(max, value));
		var newLast = this.now();
		set('val', newVal);
		set('last', newLast);
	};

	this.inc = function (value) {
		this.set(this.get() + value);
	};

	var ticker;

	function tick() {
		clearTimeout(ticker);
		that.emit('tick', that.get());
		ticker = setTimeout(tick, (interval - that.now() + lastTick()) * 1000);
	}

	if (ticks) {
		tValue.val.on('readable', tick);
		tick();
	}

	this.nextTick = function () {
		return lastTick() + interval;
	};

	this.finalTick = function () {
		var direction = rate > 0 ? max : min;
		var diff = Math.abs(tValue.val - direction);
		return that.last + diff / rate * interval;
	};
};

inherits(TimedNumber, EventEmitter);

module.exports = TimedNumber;
