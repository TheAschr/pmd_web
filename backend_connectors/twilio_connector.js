var helper = require('../helper_functions.js');

var twilio = require('twilio');

module.exports = function(CONFIG){
	var module = {};
	module.client = null;
	if(helper.check_config(CONFIG.TWILIO.ACCOUNT_SID,false) && 
		helper.check_config(CONFIG.TWILIO.AUTH_TOKEN,false) && 
		helper.check_config(CONFIG.TWILIO.ACCOUNT_SID.SERVER_PHONE,false)
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
	return module;
};

