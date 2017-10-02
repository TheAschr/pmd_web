
//***************CONFIG*****************//
var config = require('./config/sql_connector_config.json');
var sh = require("shelljs");

var sqlite3 = require('sqlite3').verbose();
var DB_LOCATION = config.db_location;

var movies = [];
var movie_types = config.allowed_types.movies.split(',');

var tv_shows = [];
var tv_show_types = config.allowed_types.tv_shows.split(',');

//**************************************//


module.exports = {
	send: function(socket,data){
	  	if(data.type == "movies"){
	  		socket.emit('media_data',{media: movies.slice(data.offset,data.offset+data.size)});
	  	}
	  	else if(data.type == "tv_shows"){
	  		socket.emit('media_data',{media: tv_shows.slice(data.offset,data.offset+data.size)});
	  	}
	},
	reload : function(socket,data){
		movies = [];
		tv_shows = [];
		var db = new sqlite3.Database(DB_LOCATION,(err)=>{
			if (err){
				return console.error(err.message);
			}
			console.log('Connected to database for reset media data');
		});

		db.serialize(function() {
		    db.each("SELECT * FROM movies WHERE type = \""+movie_types.join("\" OR type = \"")+"\";", function(err, row) {
		    	if(err){
		    		console.log("SQL ERROR: "+err);
		    	}
		    	movies.push(row);
		    },function(){
		 		db.serialize(function() {
				    db.each("SELECT * FROM movies WHERE type = \""+tv_show_types.join("\" OR type = \"")+"\";", function(err, row) {
				    	if(err){
				    		console.log("SQL ERROR: "+err);
				    	}
				    	tv_shows.push(row);
				    },function(){
				    	db.close();
				    	if(socket!=undefined || data !=undefined){
					    	module.exports.send(socket,data);
				    	}
				    });
				})
		    });
		});
	},
	set_status: function(uid,status,io,data){
		var db = new sqlite3.Database(DB_LOCATION,(err)=>{
			if (err){
				return console.error(err.message);
			}
			console.log('Connected to database for setting sql status');
		});
	  	var update_status = db.prepare("UPDATE movies SET status = \""+status+"\" WHERE uid = (?);");
	  	update_status.each(uid,function(err,row){

	  	},function(){
	  		update_status.finalize();
			db.close();
			module.exports.reload(io.sockets,data);
			
	  	});
	},
	reset_status_all: function(){
		var db = new sqlite3.Database(DB_LOCATION,(err)=>{
			if (err){
				return console.error(err.message);
			}
			console.log('Connected to database for setting sql status');
		});

		var update_status = db.prepare("UPDATE movies SET status = \"none\";");
		update_status.run();	
	},
	get_rows_from_uid: function(uid,callback){
		var db = new sqlite3.Database(DB_LOCATION,(err)=>{
			if (err){
				return console.error(err.message);
			}
			console.log('Connected to database for downloading movie');
		});

  		var zSQL = db.prepare("SELECT * FROM movies WHERE uid = (?);");
  		zSQL.each(uid,function(err,row){
  			callback(row);
  		},function(){
	  		zSQL.finalize();
			db.close();
  		});
	}
}
