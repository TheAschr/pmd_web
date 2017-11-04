var path = require('path');
var fs = require('fs');

var json_dirs = [
	["TRANSMISSION","TORRENTS_DIR"],
	["TRANSMISSION","MOVIES_DIR"],
	["TRANSMISSION","TV_SHOWS_DIR"],

	["LOCAL","PICTURES_DIR"]
];

var json_files = [
	["LOCAL","DB_FILE"],

	["WEB","SSL","KEY_FILE"],
	["WEB","SSL","CERT_FILE"]
];

var json_required = [
	["LOCAL","DB_FILE"],
	["LOCAL","PICTURES_DIR"],
	["WEB","IPTCOOKIE"],
	["WEB","REGISTRATION_CODE"],
	["WEB","ADMIN_REGISTRATION_CODE"],
	["WEB","SSL","KEY_FILE"],
	["WEB","SSL","CERT_FILE"],
]

function get_json_value(json,loc){
	var curr_json_item = json;
	for(var i = 0; i < loc.length;i++){
	  curr_json_item = curr_json_item[loc[i]];
	}
	return curr_json_item;
}

function dir_exists(loc){
	if(!fs.existsSync(loc) && loc !== ''){
		return 0;
	}
	return 1;
}



function file_exists(loc){
	if(!fs.existsSync(loc)){
		return 0;
	}
	return 1;
}

module.exports = {
	validate_data: function(json){
		var error_msgs = [];
		var success = true;
		for(var i = 0; i < json_required.length;i++){
			var value = get_json_value(json,json_required[i]);
			value = value.replace(/^\s+/, '').replace(/\s+$/, '');
			if(value === ''){
				error_msgs.push([json_required[i],"Field  is required"]);
				success = false;
			}
		}

		if(success){
			for(var i = 0; i < json_dirs.length;i++){
				var dir = get_json_value(json,json_dirs[i]);
				dir = dir.replace(/^\s+/, '').replace(/\s+$/, '');

				if(!dir_exists(dir)){
					error_msgs.push([json_dirs[i],"Could not find directory"]);
				}
			}
			for(var i = 0; i < json_files.length;i++){
				var file = get_json_value(json,json_files[i]);
				if(!file_exists(file)){
					error_msgs.push([json_files[i],"Could not find file"]);
				}
			}	
		}

		return error_msgs;
	},
	load: function(){
		var CONFIG_FILE = './config/config.json';
		var CONFIG = require(CONFIG_FILE);
		var express = require('express');
  		var app = express();
		var http = require('http').Server(app);
  		app.use(express.static(path.join(__dirname, 'public')));
		app.get('/', function(req, res){
		  res.sendFile(__dirname + '/init.html');
		});

		var io = require('socket.io')(http);
	  	io.on('connection', function(socket) {
	  		 socket.on('config_req',function(){
      			socket.emit('config_res',{config: CONFIG});
    		});
	   		 socket.on('config_update',function(data){
	   		  var error_msgs = module.exports.validate_data(data.config);
	   		  if(!error_msgs.length){
			  	data.config["INIT"] = "FALSE";
			  	CONFIG = data.config;
		      	fs.writeFileSync(CONFIG_FILE,JSON.stringify(data.config,null,"\t"),'utf8');   		  	
	   		  	socket.emit('config_update_status',{success:true});
	   		  }
	   		  else{
	   		  	socket.emit('config_update_status',{success:false,error_msgs:error_msgs});
	   		  }

		    });
		    socket.on('restart',function(){
		      process.exit(0);
		    });
		    socket.on('disconnect', function() {});
		});

		http.listen(80, function(){
		  console.log('Starting initialization Server');
		});		
	}
}
