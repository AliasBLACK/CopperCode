// Polyfills later imports lean on while their own bodies evaluate — an
// imported module runs before the importer's body, so these can't live in
// runtime.js itself. Oimo wires prototypes with Object.create at load, and
// webpack's harmony glue wants defineProperty's value form.
Object.create = function (o) { function f(){}; f.prototype = o; return new f() }
Object.defineProperty = function(obj, prop, descriptor) {
	if ('value' in descriptor) obj[prop] = descriptor.value
	return obj
}
Array.prototype.includes = function(item) { return this.indexOf(item) != -1 }

// Typed-array stand-in for geometry buffers.
global.Float32Array = function(len) { const arr = new Array(len); while (len--) arr[len] = 0; return arr }
