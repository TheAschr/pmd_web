
//***************CONFIG*****************//
var config = require('./config/sql_connector_config.json');
var sh = require('shelljs');

var DB_LOCATION = config.db_location;

var movies = [];
var movie_types = config.allowed_types.movies.split(',');

var tv_shows = [];
var tv_show_types = config.allowed_types.tv_shows.split(',');

var registration_code = config.registration_code;

//**************************************//

var bcrypt = require('bcrypt');
const saltRounds = 10;

var sqlite3 = require('sqlite3').verbose();

function search_by_title(media,title){
	var results = [];
	if(!title){
		title = "";
	}
	for(index = 0; index < media.length;index++){
		if(media[index].title.toUpperCase().includes(title.toUpperCase())){
			results.push(media[index])
		}
	}
	return results;
}

module.exports = {
	register_user: function(secret_code,username,email,password,phone,succ_cb,fail_cb){
	module.exports.user_exists(username,function(){
		fail_cb("Username already taken");
	},function(){
		if(secret_code == registration_code){
			var db = new sqlite3.Database(DB_LOCATION,(err)=>{
				if (err){
					return console.error(err.message);
				}
			});
			bcrypt.hash(password,saltRounds,function(err,hash){
				if(err){
					console.log(err);
				}
				var insert_user = db.prepare("INSERT INTO users (username,email,password,phone) VALUES (?,?,?,?)");
				insert_user.run(username,email,hash,phone);	
				insert_user.finalize();	
				db.close();
				succ_cb();
			});
		}else{
			fail_cb('Invalid registration code');
		}
	});



	},
	user_exists: function(username,succ_cb,fail_cb){
		if(username){
			var db = new sqlite3.Database(DB_LOCATION,(err)=>{
				if (err){
					return console.error(err.message);
				}
			});
			var zSQL = db.prepare("SELECT * FROM users where username = (?);")
			zSQL.get(username,function(err,row){
				if(row){
					succ_cb();
				}
				else{
					fail_cb();
				}
			});
			zSQL.finalize();
			db.close();
		}
		else{
			fail_cb();
		}
	},
	validate_user: function(username,password,succ_cb,fail_cb){
		if(username && password){
			var db = new sqlite3.Database(DB_LOCATION,(err)=>{
				if (err){
					return console.error(err.message);
				}
			});
			var zSQL = db.prepare("SELECT * FROM users where username = (?);")
			zSQL.get(username,function(err,row){
				if(row){
					bcrypt.compare(password,row.password,function(err,res){
						if(res){
							console.log(row.username+" successfully logged in ")
							succ_cb();									
						}
						else{
							fail_cb();					
						}
					});
				}
				else{
					fail_cb();
				}

			});
			zSQL.finalize();
			db.close();
		}
		else{
			fail_cb();
		}
	},
	send: function(socket,data){
	  	if(data.type == "movies"){
		 	var results = search_by_title(movies,data.title);
	  		socket.emit('media_data',{media: results.slice(data.offset,data.offset+data.size)});
	  	}
	  	else if(data.type == "tv_shows"){
 		 	var results = search_by_title(tv_shows,data.title);
			socket.emit('media_data',{media: results.slice(data.offset,data.offset+data.size)});
	  	}
	},
	reload : function(socket,data){
		movies = [];
		tv_shows = [];
		var db = new sqlite3.Database(DB_LOCATION,(err)=>{
			if (err){
				return console.error(err.message);
			}
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
		});

		var update_status = db.prepare("UPDATE movies SET status = \"none\";");
		update_status.run();	
	},
	get_rows_from_uid: function(uid,callback){
		var db = new sqlite3.Database(DB_LOCATION,(err)=>{
			if (err){
				return console.error(err.message);
			}
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
