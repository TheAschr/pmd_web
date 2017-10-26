
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

function parse_phone_num(phone_num){
	if(phone_num && phone_num != ""){
		phone_num = phone_num.match(/(\+)?[0-9]/g);
		if(phone_num.length == 0){
			return null;
		}
		else if(phone_num[0].length == 2 && phone_num.length == 11){
			return phone_num.join();
		}
		else if(phone_num[0].length == 1 && phone_num.length == 10){
			return "+1"+ phone_num.join("");
		}
		else{
			return null;
		}	
	}
	return "";
}

module.exports = {
	register_user: function(secret_code,username,email,password,password_conf,phone,succ_cb,fail_cb){
	if(!username || username == ""){
		fail_cb("Please enter username");
		return 0;
	}
	module.exports.user_exists(username,function(){
		fail_cb("Username already taken");
		return 0;
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
							bcrypt.hash(password,saltRounds,function(err,hash){
								if(err){
									console.log(err);
								}
								var db = new sqlite3.Database(DB_LOCATION,(err)=>{
								if (err){
									return console.error(err.message);
									}
								});
								var insert_user = db.prepare("INSERT INTO users (username,email,password,phone) VALUES (?,?,?,?)");
								var parsed_phone = parse_phone_num(phone);
								if(parsed_phone == null){
									fail_cb("Please enter phone number in correct format");
									insert_user.finalize();
									db.close();
									return 0;
								}
								insert_user.run(username,email,hash,parsed_phone);	
								insert_user.finalize();	
								db.close();
								succ_cb();	
								return 1;
							});			
						}else{
							fail_cb('Password must have at least '+MIN_PASS_SPEC+' special characters');
							return 0;
						}
					}else{
						fail_cb('Password must have at least '+MIN_PASS_NUM+' numbers');
						return 0;
					}
				}else{
					fail_cb('Password must be at least '+MIN_PASS_LEN+' character long');
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
