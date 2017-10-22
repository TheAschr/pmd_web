
//***************CONFIG*****************//
var config = require('./config/config.json');
var sh = require('shelljs');

var DB_LOCATION = config.Local.DB_File;

var REGISTRAION_CODE = config.Web.registration_code;

var MIN_PASS_LEN = 8;
var MIN_PASS_NUM = 0;
var MIN_PASS_SPEC = 0;

//**************************************//

var bcrypt = require('bcrypt');
const saltRounds = 10;

var sqlite3 = require('sqlite3').verbose();


module.exports = {
	register_user: function(secret_code,username,email,password,password_conf,phone,succ_cb,fail_cb){
	module.exports.user_exists(username,function(){
		fail_cb("Username already taken");
	},function(){
		if(password == password_conf){
			if(secret_code == REGISTRAION_CODE){
				if(password.length >= MIN_PASS_LEN){
					var nums_in_password = password.match(/[0-9]/g);
					if(!nums_in_password){
						nums_in_password = [];
					}
					if(nums_in_password.length >= MIN_PASS_NUM){
						var spec_in_password = password.match(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g);
						if(!spec_in_password){
							spec_in_password = [];
						}
						if(spec_in_password.length >= MIN_PASS_SPEC){
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
							fail_cb('Password must have at least '+MIN_PASS_SPEC+' special characters');
						}
					}else{
						fail_cb('Password must have at least '+MIN_PASS_NUM+' numbers');
					}
				}else{
					fail_cb('Password must be at least '+MIN_PASS_LEN+' character long');
				}

			}else{
				fail_cb('Invalid registration code');
			}
		}else{
			fail_cb('Passwords do not match');
		}
	
		});
	},
	all_media: function(statement,values,callback){
		var db = new sqlite3.Database(DB_LOCATION,(err)=>{
			if (err){
				return console.error(err.message);
			}
		});

	  	db.all(statement,values,function(err,rows){
	  		if(err){
	  			console.log(err);
	  		}
			db.close();
			if(callback){
				callback(rows);
			}
			return rows;
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
	}
}
