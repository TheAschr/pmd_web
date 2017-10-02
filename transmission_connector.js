
//***************CONFIG*****************//
var config = require('config');
var sh = require("shelljs");

var IPT_COOKIE = config.get('Web.IPTCookie');

var TRANSMISSION_IP = config.get('Transmission.ip');
var TRANSMISSION_PORT = config.get('Transmission.port');
var TRANSMISSION_USERNAME = config.get('Transmission.username');
var TRANSMISSION_PASSWORD = config.get('Transmission.password');

var TORRENT_DIR; 
if(config.has('Local.FileDir')){
	TORRENT_DIR = config.get('Local.FileDir');
}
else{
	TORRENT_DIR = sh.pwd() + "\\torrent_files";
}

var MEDIA_DIR;
if(config.has('Local.MediadDir')){
	MEDIA_DIR = config.get('Local.MediaDir');
}
else{
	MEDIA_DIR = sh.pwd()+"\\media_files";
}

//**************************************//

var Transmission = require('transmission');

var request = require('request');
var fs = require('fs');

var transmission = new Transmission({
    port : TRANSMISSION_PORT,
    host : TRANSMISSION_IP,
    username : TRANSMISSION_USERNAME,
    password : TRANSMISSION_PASSWORD
});

var active_torrents = [];

module.exports = {

	upload : function(row){
		row.link = row.link.toString();
		var url_split = row.link.split('/');
		var f_name = url_split[url_split.length-1];

		if(!fs.existsSync(TORRENT_DIR)){
			fs.mkdirSync(TORRENT_DIR);
		}	

		var response_stream = request({url: 'http://iptorrents.com'+row.link, headers: {Cookie: IPT_COOKIE}});
		
		response_stream.on('error',function(err){
			console.log(err);
		});

		response_stream.on('response',function(response){
			var torrent_file = TORRENT_DIR + "\\" + f_name;

			var write_stream = fs.createWriteStream(torrent_file);

			response_stream.pipe(write_stream);

			response_stream.on('end',function(){

				write_stream.on('close',function(){

					if(!fs.existsSync(MEDIA_DIR)){
							fs.mkdirSync(MEDIA_DIR);
					}


					transmission.addFile(torrent_file, {
					     "download-dir" : MEDIA_DIR
					}, function(err, result) {

					    if (err) {
					        return console.log(err);
					    }
					    var id = result.id;
					    console.log(': DOWLOADING TORRENT WITH ID \"' + id + '\" at \"'+ torrent_file+'\" to \"'+ MEDIA_DIR+'\"');
					   	active_torrents[id] = row.uid;
					    transmission.get( function(err, arg){
					        if (err){
					            console.error(err);          
					        }
					    });
					});				
				});				
			});
		});

	},
	reload_progress: function(socket){

    transmission.active(function(err, result){
	    if (err){
	        console.log(err);
	    }
	    else {
	    	media_progress = [];
	        for (var i=0; i< result.torrents.length; i++){
	            console.log(active_torrents[result.torrents[i].id]);
	            console.log(result.torrents[i].status);
	            console.log(result.torrents[i].eta);
	            console.log("Progress "+(result.torrents[i].downloadedEver/result.torrents[i].sizeWhenDone*100)+"%");
	            media_progress[i] = {uid : active_torrents[result.torrents[i].id],progress : (result.torrents[i].downloadedEver/result.torrents[i].sizeWhenDone*100).toFixed(2)};	        }
	        console.log(media_progress);
	        socket.emit('media_progress',{media_progress: media_progress});
	    }

    });
	
	}

}