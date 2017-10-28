
//***************CONFIG*****************//
var config_file = './config/config.json';
var config = require(config_file);

var twilio_config = {};
twilio_config["ACCOUNT_SID"] = config.Twilio.account_sid;
twilio_config["SERVER_PHONE"] = config.Twilio.auth_token;
twilio_config["SERVER_PHONE"] = config.Twilio.server_phone;
//**************************************//

var twilio = require('twilio');
var client = null; 
var fail = false;
for(key in twilio_config){
	if(!twilio_config[key] || twilio_config[key] == ""){
		console.log("Error: could not find config for "+key);
		fail = true;
	}
}
if(fail){
	console.log("Twilio will be disabled");
}else{
	client = new twilio(twilio_config["ACCOUNT_SID"],twilio_config["AUTH_TOKEN"]);
}

module.exports = {
	client: client,
	send: function(message,client_phone){
		if(!twilio){
			console.log("Twilio is disabled due to misconfigured settings");
			return;
		}
		console.log("Sending text:\""+message+"\" to "+client_phone);
		module.exports.client.messages.create({
			body: message,
			to: client_phone,
			from: twilio_config["SERVER_PHONE"]
		});
	}
};

