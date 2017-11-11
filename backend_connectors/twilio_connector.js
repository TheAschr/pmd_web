var path = require('path');
var HOME = path.resolve(__dirname+'\\..\\');

var cfg_hndlr = require(HOME+'\\backend_handlers\\config_handler.js');

var twilio = require('twilio');

module.exports = function(CONFIG){
	var module = {};

	module.parse_phone_num = function(phone_num){
		if(phone_num && phone_num != ""){
			phone_num = phone_num.match(/(\+)?[0-9]/g);
			if(phone_num.length == 0){
				return null;
			}
			else if(phone_num[0].length == 2 && phone_num.length == 11){
				return phone_num.join();
			}
			else if(phone_num[0].length == 1 && phone_num.length == 10){
				return "+1"+ phone_num.join("");
			}
			else{
				return null;
			}	
		}
		return "";
	}
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
				from: CONFIG.TWILIO.ACCOUNT_SID.SERVER_PHONE
			});
		}

	}

	return module;
};

