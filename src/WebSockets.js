import config from './config.js';

const setupWebSocketConnection = () => {
	window.connection = new WebSocket(config.socket.host + ':' + config.socket.port);

	connection.onopen = () => {
		addMessageToConsole('You are now connected!');
	};

	connection.onerror = (error) => {
		console.log(`An error occured: ${error}`);
	};

	connection.onmessage = (message) => {
		const data = JSON.parse(message.data);
		addMessageToConsole(`Client${data.client} says: ${data.text}`);
	};
};
