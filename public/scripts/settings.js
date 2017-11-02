var g_json = {};

var config_json_loc = {
"transmission_username": ["TRANSMISSION","USERNAME"],
"transmission_password": ["TRANSMISSION","PASSWORD"],
"transmission_port": ["TRANSMISSION","PORT"],
"transmission_torrents_dir": ["TRANSMISSION","TORRENTS_DIR"],
"transmission_movies_dir": ["TRANSMISSION","MOVIES_DIR"],
"transmission_tv_shows_dir": ["TRANSMISSION","TV_SHOWS_DIR"],
"local_database_file" : ["LOCAL","DB_FILE"],
"local_pictures_dir" : ["LOCAL","PICTURES_DIR"],
"web_iptcookie": ["WEB","IPTCOOKIE"],
"web_movies_types": ["WEB","MEDIA","MOVIES","ALLOWED_TYPES"],
"web_movies_max": ["WEB","MEDIA","MOVIES","ALLOWED_SIZES","MAX"],
"web_movies_min": ["WEB","MEDIA","MOVIES","ALLOWED_SIZES","MIN"],
"web_tv_shows_types": ["WEB","MEDIA","TV_SHOWS","ALLOWED_TYPES"],
"web_tv_shows_max": ["WEB","MEDIA","TV_SHOWS","ALLOWED_SIZES","MAX"],
"web_tv_shows_min": ["WEB","MEDIA","TV_SHOWS","ALLOWED_SIZES","MIN"],
"web_admin_reg_code": ["WEB","ADMIN_REGISTRATION_CODE"],
"web_user_reg_code": ["WEB","REGISTRATION_CODE"],
"twilio_account_sid": ["TWILIO","ACCOUNT_SID"],
"twilio_auth_token": ["TWILIO","AUTH_TOKEN"],
"twilio_server_phone": ["TWILIO","SERVER_PHONE"]
};

function get_json_value(json,loc){
var curr_json_item = json;
for(var i = 0; i < loc.length;i++){
  curr_json_item = curr_json_item[loc[i]];
}
return curr_json_item;
}

function set_json_value(json,loc,value){
 var curr_json_item = json;
 for(var i = 0; i < loc.length - 1;i++){
   curr_json_item = curr_json_item[loc[i]];
 }
 curr_json_item[loc[loc.length-1]] = value;
}


function set_all_json(json){
for(key in config_json_loc){
  if(config_json_loc.hasOwnProperty(key)){
    var config_item = document.getElementById(key);
    set_json_value(json,config_json_loc[key],config_item.value);          
  }
}
}

function upload_json(){
set_all_json(g_json);
socket.emit('config_update',{config:g_json});
}
function load_json(){
socket.emit('restart');
window.location = '/';
}

function inject_json_values(json){
   for(key in config_json_loc){
    if(config_json_loc.hasOwnProperty(key)){
      var config_item = document.getElementById(key);
      config_item.value = get_json_value(json,config_json_loc[key]);                
    }
 }
}