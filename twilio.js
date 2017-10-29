
//***************CONFIG*****************//
var CONFIG_LOCATION = './config/config.json';
var CONFIG_FILE = require(CONFIG_LOCATION);

var CONFIG = {};
CONFIG["ACCOUNT_SID"] = CONFIG_FILE.TWILIO.ACCOUNT_SID;
CONFIG["SERVER_PHONE"] = CONFIG_FILE.TWILIO.AUTH_TOKEN;
CONFIG["SERVER_PHONE"] = CONFIG_FILE.TWILIO.SERVER_PHONE;
//**************************************//

var twilio = require('twilio');
var client = null; 
var fail = false;
for(key in CONFIG){
	if(!CONFIG[key] || CONFIG[key] == ""){
		console.log("Error: could not find config for "+key);
		fail = true;
	}
}
if(fail){
	console.log("Twilio will be disabled");
}else{
	client = new twilio(CONFIG["ACCOUNT_SID"],CONFIG["AUTH_TOKEN"]);
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
			from: CONFIG["SERVER_PHONE"]
		});
	}
};

