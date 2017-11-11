var path = require('path');
var HOME = path.resolve(__dirname+'\\..\\');

var cfg_hndlr = require(HOME+'\\backend_handlers\\config_handler.js');
var twilio_hndlr = require(HOME+'\\backend_handlers\\twilio_handler.js');

var bcrypt = require('bcrypt');
const saltRounds = 10;

var sqlite3 = require('sqlite3').verbose();

module.exports = function(CONFIG){
	var module = {};

	module.user_exists = function(username,succ_cb,fail_cb){
		if(username){
			var db = new sqlite3.Database(CONFIG.LOCAL.DB_FILE,(err)=>{
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
	}


	module.register_user = function(secret_code,username,email,password,password_conf,phone,succ_cb,fail_cb){
		if(!username || username == ""){
			fail_cb("Please enter username");
			return 0;
		}
		module.user_exists(username,function(){
			fail_cb("Username already taken");
			return 0;
		},function(){
			if(password == password_conf){
				var level = 0;
				if(secret_code == CONFIG.WEB.REGISTRATION_CODE){
					level = 2;
				}
				if(secret_code == CONFIG.WEB.ADMIN_REGISTRATION_CODE){
					level = 1;
				}
				if(level){
					if(password.length >= CONFIG.WEB.PASSWORD_REQS.MIN_LEN){
						var nums_in_password = password.match(/[0-9]/g);
						if(!nums_in_password){
							nums_in_password = [];
						}
						if(nums_in_password.length >= CONFIG.WEB.PASSWORD_REQS.MIN_NUMBERS){
							var spec_in_password = password.match(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g);
							if(!spec_in_password){
								spec_in_password = [];
							}
							if(spec_in_password.length >= CONFIG.WEB.PASSWORD_REQS.MIN_SPECIAL_CHARS){
								bcrypt.hash(password,saltRounds,function(err,hash){
									if(err){
										console.log(err);
									}
									var db = new sqlite3.Database(CONFIG.LOCAL.DB_FILE,(err)=>{
									if (err){
										return console.error(err.message);
										}
									});
									var insert_user = db.prepare("INSERT INTO users (username,email,password,phone,level) VALUES (?,?,?,?,?)");
									var parsed_phone = twilio_hndlr.parse_phone_num(phone);
									if(parsed_phone == null){
										fail_cb("Please enter phone number in correct format");
										insert_user.finalize();
										db.close();
										return 0;
									}
									insert_user.run(username,email,hash,parsed_phone,level);	
									insert_user.finalize();	
									db.close();
									succ_cb();	
									return 1;
								});			
							}else{
								fail_cb('Password must have at least '+CONFIG.WEB.PASSWORD_REQS.MIN_SPECIAL_CHARS+' special characters');
								return 0;
							}
						}else{
							fail_cb('Password must have at least '+CONFIG.WEB.PASSWORD_REQS.MIN_NUMBERS+' numbers');
							return 0;
						}
					}else{
						fail_cb('Password must be at least '+CONFIG.WEB.PASSWORD_REQS.MIN_LEN+' character long');
						return 0;
					}

				}else{
					fail_cb('Invalid registration code');
					return 0;
				}
			}else{
				fail_cb('Passwords do not match');
				return 0;
			}
	
		});
	}

	module.all = function(statement,values,callback){
		var db = new sqlite3.Database(CONFIG.LOCAL.DB_FILE,(err)=>{
			if (err){
				return console.error(err.message);
			}
		});

	  	db.all(statement,values,function(err,rows){
	  		if(err){
	  			if(err.code == 'SQLITE_BUSY'){
	  				console.log(":: BUSY RETRYING")
	  				module.all(statement,module.all(statement,values,callback));
	  			}else{
		  			console.log(err);
	  			}
	  		}
			db.close();
			if(callback && rows){
				callback(rows);
			}
			return rows;
		});			
		


	}

	module.validate_user = function(username,password,succ_cb,fail_cb){
		if(username && password){
			var db = new sqlite3.Database(CONFIG.LOCAL.DB_FILE,(err)=>{
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
							succ_cb(row);									
						}
						else{
							fail_cb(row);					
						}
					});
				}
				else{
					fail_cb(row);
				}

			});
			zSQL.finalize();
			db.close();
		}
		else{
			fail_cb();
		}
	}
	return module;
}
