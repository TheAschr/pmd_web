
var data_sizes = ['KB','MB','GB','TB'];

function parse_data_size(data_str){
	if(!data_str || data_str == ""){
		return null;
	}
	var size = data_str.replace(/[^0-9\.]+/g,"");
	var found = false;
	for(s = 0; s < data_sizes.length && !found; s++){
		if(data_str.toUpperCase().search(data_sizes[s])!=-1){
			found = true;
			var multiplier = Math.pow(1000,s+1);
			size*=multiplier;
		}
	}
	if(!found){
		return null;
	}
	return size;
}

//***************CONFIG*****************//
var config = require('./config/config.json');
var sh = require('shelljs');

var DB_LOCATION = config.Local.DB_File;

var movies = [];
var movie_types = config.Web.allowed_types.movies.split(',');

var tv_shows = [];
var tv_show_types = config.Web.allowed_types.tv_shows.split(',');

var registration_code = config.Web.registration_code;

var max_media_size = parse_data_size(config.Web.max_media_size);
var min_media_size = parse_data_size(config.Web.min_media_size);

var min_pass_len = 8;
var min_pass_num = 1;
var min_pass_spec = 1;

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
			var data_size = parse_data_size(media[index].size);

			if(min_media_size && max_media_size && data_size){
				if(data_size >= min_media_size && data_size <= max_media_size){
					results.push(media[index]);
				}
			}else{
				results.push(media[index]);
			}
		}
	}
	return results;
}

module.exports = {
	register_user: function(secret_code,username,email,password,password_conf,phone,succ_cb,fail_cb){
	module.exports.user_exists(username,function(){
		fail_cb("Username already taken");
	},function(){
		if(password == password_conf){
			if(secret_code == registration_code){
				if(password.length >= min_pass_len){
					var nums_in_password = password.match(/[0-9]/g);
					if(nums_in_password && nums_in_password.length >= min_pass_num){
						var spec_in_password = password.match(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g);
						if(spec_in_password && spec_in_password.length >= min_pass_spec){
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
							fail_cb('Password must have at least '+min_pass_spec+' special characters');
						}
					}else{
						fail_cb('Password must have at least '+min_pass_num+' numbers');
					}
				}else{
					fail_cb('Password must be at least '+min_pass_len+' character long');
				}

			}else{
				fail_cb('Invalid registration code');
			}
		}else{
			fail_cb('Passwords do not match');
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
	  		socket.emit('media_res',{media: results.slice(data.offset,data.offset+data.size)});
	  	}
	  	else if(data.type == "tv_shows"){
 		 	var results = search_by_title(tv_shows,data.title);
			socket.emit('media_res',{media: results.slice(data.offset,data.offset+data.size)});
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
