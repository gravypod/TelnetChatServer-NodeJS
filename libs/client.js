var NEW_LINE = "\r\n";
var VALID_USERNAME = /[A-Za-z0-9]+/; // A-z 0-9

var ErrorCodes = {
	LENGTH : 0,
	SPACE : 1,
	CONTENT : 2,
	IN_USE : 3,
	NO_ERR : 4
};

function login(that, message) {
	if (message.length < 2 || message.length > 32) {
		return ErrorCodes.LENGTH;
	}
	if (message.indexOf(" ") !== -1) {
		return ErrorCodes.SPACE;
	}
	if (message.match(VALID_USERNAME) === null) {
		return ErrorCodes.CONTENT;
	}
	that.setUsername(message);
	that.loggedIn = that.connect();
	if (!that.loggedIn) {
		return ErrorCodes.IN_USE;
	}
	return ErrorCodes.NO_ERR;
}

module.exports = {
	make : function(socket, clientManager) {
		var loggedIn = false;
		var username = null;
		
		var client = {
				loggedIn : false,
				send : function (message) {
					socket.write(message + NEW_LINE);
				},
				getUsername : function () {
					return username;
				},
				setUsername : function (message) {
					username = message;
				},
				connect: function () {
					return clientManager.connect(this);
				}
		};
		
		var drop = function () {
			loggedIn = false;
			clientManager.drop(client);
			socket.destroy();
		};
		
		setTimeout(function(client) { // Wait 10 seconds.
			if (client.loggedIn === false) { // Has the client logged in?
				client.send("Session dropped. Please login next time."); // Well to bad for them!
				client.socket.removeListener("data", client.onMessage); // Remove listeners, no turning back
				setTimeout(function(client) { // Give the user time to read this.
					drop();
				}, 3 * 1000, client);
			}
		}, 10 * 1000, this);
		
		socket.on("close", drop);
		socket.on("data", function(data) {

			var message = data.toString("utf8").trim();
			
			if (message.length === 0) {
				return;
			}
			
			if (client.loggedIn === false) {
				switch (login(client, message)) {
					case ErrorCodes.LENGTH:
						client.send("A username may not be longer than 32 characters or shorter than 2 characters");
						return;
					case ErrorCodes.SPACE:
						client.send("A username may not contain a space");
						return;
					case ErrorCodes.CONTENT:
						client.send("A username may not contain a space, non-aplhanumeric characters.");
						return;
					case ErrorCodes.IN_USE:
						client.send("Username already taken! Pick another.");
						return;
					case ErrorCodes.NO_ERR:
						client.send("Welcome to the server " + client.getUsername() + "!");
						return;
				}
				
			}
			
			clientManager.sendMessage(client, message);
			
		});
	}
};