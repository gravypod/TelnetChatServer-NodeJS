var VALID_MESSAGE = /[A-Za-z0-9/!\._\-:\(\)\[\]\{\} ]+/; // A-z 0-9 / ! . _ - ( ) { } [ ]

var ClientManager = {
	connections : {},
	getMessagePrefix : function(client) {

		return "[" + client.getUsername() + "] ";
		
	},
	send : function(message, shouldSend) {

		for ( var username in ClientManager.connections) { // Loop over clients
			if (ClientManager.connections.hasOwnProperty(username)) { // Is it a part of the object we made?
				var client = ClientManager.connections[username];
				if (typeof (shouldSend) === 'undefined' ? true : shouldSend(client)) { // Should we send it? Are we filtering?
					client.send(message); // Send out the message to the element
				}
			}
		}
	},
	sendMessage : function(sender, message) {

		var m = message.trim();
		
		if (m.length === 0 || m.match(VALID_MESSAGE) === null) {
			return;
		}
		
		m = ClientManager.getMessagePrefix(sender) + m;
		
		ClientManager.send(m, function(c) {

			return c !== sender;
		});
		
	},
	drop : function(client) {

		var username = client.getUsername();
		
		if (!ClientManager.connections.hasOwnProperty(username)) {
			return;
		}
		
		delete ClientManager.connections[username];
		
		ClientManager.send("Client " + ClientManager.getMessagePrefix(client) + "has disconnected.");
		
	},
	isUsernameTaken : function(username) {

		return ClientManager.connections.hasOwnProperty(username);
	},
	connect : function(client) {

		var username = client.getUsername();
		
		if (ClientManager.isUsernameTaken(username)) {
			return false;
		}
		
		ClientManager.send("Client " + ClientManager.getMessagePrefix(client) + "has connected to the server.");
		
		ClientManager.connections[username] = client;
		
		return true;
	}
};

module.exports = ClientManager;