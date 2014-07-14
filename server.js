var PORT = 23;
var TEXT_REGEX = /^[a-z0-9._]+$/;
var e = new require('events');
var events = new e.EventEmitter();

var net = require("net");

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

var clients = {};


function isLoggedIn(username) {

	return typeof (clients[username]) !== "undefined";
}

function removeListeners(socket) {

	socket.removeListener("data", socket.onData);
	socket.removeListener("close", socket.onClose);
	events.removeListener("message", socket.onMessage);
	events.removeListener("connect", socket.onConnect);
	events.removeListener("disconnect", socket.onDisconnect);
}

function addListeners(socket) {

	socket.onData = function(data) {

		var message = data.toString("utf8").trim();
		
		if (message.match(TEXT_REGEX) === null) {
			return;
		}
		
		if (socket.username === undefined) {
			
			if (message.length <= 2 || message.length > 32) {
				socket.send("Usernames can only be between 2 and 32 characters");
				return;
			}
			
			if (isLoggedIn(message)) {
				socket.send("Someone is logged in with this username! Please pick another.");
				return;
			}
			
			clients[message] = socket;
			
			socket.username = message;
			socket.event("connect", message);
			socket.send("Welcome to the server " + socket.username + "!");
		} else {
			socket.event("message", message);
		}
	};
	socket.onClose = function(hasErrored) {

		socket.drop(hasErrored);
		events.emit("disconnect", socket.username);
	};
	socket.onMessage = function(username, message) {

		if (socket.username === username) {
			return;
		}
		socket.send("[" + username + "] " + message);
	};
	socket.onConnect = function(username) {

		if (socket.username === username) {
			return;
		}
		socket.send("User [" + username + "] has connect.");
	};
	socket.onDisconnect = function(username) {

		if (socket.username === username) {
			return;
		}
		socket.send("User [" + username + "] has disconnected.");
	};
	
	socket.on("data", socket.onData);
	socket.on("close", socket.onClose);
	events.on("message", socket.onMessage);
	events.on("connect", socket.onConnect);
	events.on("disconnect", socket.onDisconnect);
	
}

var serverListener = function(socket) {

	socket.send = function(message) {

		socket.write(message + "\r\n");
	};
	
	socket.event = function(event, message) {

		events.emit(event, socket.username, message);
	};
	
	socket.drop = function() {
		removeListeners(socket);
		delete clients[socket.username];
	};
	
	addListeners(socket);
	socket.send("Please select a username.");
	
	setTimeout(function() {

		if (socket.username) {
			return;
		}
		socket.send("Session timeout, you should have logged in!");
		setTimeout(function() {
			socket.destroy();
			socket.drop();
		}, 5 * 1000);
	}, 10 * 1000);
	
};

if (cluster.isMaster) {
	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}
} else {
	var server = net.createServer(serverListener);
	server.listen(PORT);
}
