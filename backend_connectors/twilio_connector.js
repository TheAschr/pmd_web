var path = require('path');
var HOME = path.resolve(__dirname+'\\..\\');

var cfg_hndlr = require(HOME+'\\backend_handlers\\config_handler.js');
var twilio_hndlr = require(HOME+'\\backend_handlers\\twilio_handler.js');

var twilio = require('twilio');

module.exports = function(CONFIG){
	var module = {};


	module.client = null;

	if(CONFIG){
		if(cfg_hndlr.check_config(CONFIG.TWILIO.ACCOUNT_SID,false) && 
			cfg_hndlr.check_config(CONFIG.TWILIO.AUTH_TOKEN,false) && 
			cfg_hndlr.check_config(CONFIG.TWILIO.ACCOUNT_SID.SERVER_PHONE,false)
			)
		{
			module.client = new twilio(CONFIG.TWILIO.ACCOUNT_SID,CONFIG.TWILIO.AUTH_TOKEN);
		}

		module.send = function(message,client_phone){
			if(!module.client){
				console.log("Twilio is disabled due to misconfigured settings");
				return;
			}
			console.log("Sending text:\""+message+"\" to "+client_phone);
			module.client.messages.create({
				body: message,
				to: client_phone,
				from: twilio_hndlr.parse_phone_number(CONFIG.TWILIO.ACCOUNT_SID.SERVER_PHONE)
			});
		}

	}

	return module;
};

