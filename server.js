var PORT = 23;
var KEEP_ALIVE = false;

var clientManager = require("./libs/clientmanager.js");
var connect = require("./libs/client.js").make;

var net = require("net");

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

var serverListener = function(socket) {
	connect(socket, clientManager);
};

var exitListener = function(worker, code, signal) {
	if (KEEP_ALIVE) {
		cluster.fork();
	}
};

if (cluster.isMaster) {
	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}
	cluster.on('exit', exitListener);
} else {
	var server = net.createServer(serverListener);
	server.listen(PORT);
}
