
//***************CONFIG*****************//
var config_file = './config/config.json';
var config = require(config_file);

var ACCOUNT_SID = config.Twilio.account_sid;
var AUTH_TOKEN = config.Twilio.auth_token;
var SERVER_PHONE = config.Twilio.server_phone;
//**************************************//

var twilio = require('twilio');

module.exports = {
	client: new twilio(ACCOUNT_SID,AUTH_TOKEN),
	send: function(message,client_phone){
		console.log("Sending text:\""+message+"\" to "+client_phone);
		module.exports.client.messages.create({
			body: message,
			to: client_phone,
			from: SERVER_PHONE
		});
	}
};

