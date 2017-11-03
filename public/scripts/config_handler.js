function Config(socket) {

    var config_self = this;

    this.g_json = {};

    this.config_json_loc = {
        "transmission_username": ["TRANSMISSION", "USERNAME"],
        "transmission_password": ["TRANSMISSION", "PASSWORD"],
        "transmission_port": ["TRANSMISSION", "PORT"],
        "transmission_torrents_dir": ["TRANSMISSION", "TORRENTS_DIR"],
        "transmission_movies_dir": ["TRANSMISSION", "MOVIES_DIR"],
        "transmission_tv_shows_dir": ["TRANSMISSION", "TV_SHOWS_DIR"],
        "local_database_file": ["LOCAL", "DB_FILE"],
        "local_pictures_dir": ["LOCAL", "PICTURES_DIR"],
        "web_iptcookie": ["WEB", "IPTCOOKIE"],
        "web_movies_types": ["WEB", "MEDIA", "MOVIES", "ALLOWED_TYPES"],
        "web_movies_max": ["WEB", "MEDIA", "MOVIES", "ALLOWED_SIZES", "MAX"],
        "web_movies_min": ["WEB", "MEDIA", "MOVIES", "ALLOWED_SIZES", "MIN"],
        "web_tv_shows_types": ["WEB", "MEDIA", "TV_SHOWS", "ALLOWED_TYPES"],
        "web_tv_shows_max": ["WEB", "MEDIA", "TV_SHOWS", "ALLOWED_SIZES", "MAX"],
        "web_tv_shows_min": ["WEB", "MEDIA", "TV_SHOWS", "ALLOWED_SIZES", "MIN"],
        "web_admin_reg_code": ["WEB", "ADMIN_REGISTRATION_CODE"],
        "web_user_reg_code": ["WEB", "REGISTRATION_CODE"],
        "web_ssl_key_file": ["WEB", "SSL", "KEY_FILE"],
        "web_ssl_cert_file": ["WEB", "SSL", "CERT_FILE"],
        "twilio_account_sid": ["TWILIO", "ACCOUNT_SID"],
        "twilio_auth_token": ["TWILIO", "AUTH_TOKEN"],
        "twilio_server_phone": ["TWILIO", "SERVER_PHONE"]
    };

    this.get_config_json_key = function(value) {
        for (var key in config_self.config_json_loc) {
            if (config_self.config_json_loc[key].toString() == value.toString()) {
                return key;
            }
        }
    }

    this.get_json_value = function(json, loc){
        var curr_json_item = json;
        for (var i = 0; i < loc.length; i++) {
            curr_json_item = curr_json_item[loc[i]];
        }
        return curr_json_item;
    }

    this.set_json_value = function(json, loc, value) {
        var curr_json_item = json;
        for (var i = 0; i < loc.length - 1; i++) {
            curr_json_item = curr_json_item[loc[i]];
        }
        curr_json_item[loc[loc.length - 1]] = value;
    }


    this.set_all_json = function(json) {
        for (key in config_self.config_json_loc) {
            if (config_self.config_json_loc.hasOwnProperty(key)) {
                var config_item = document.getElementById(key);
                config_self.set_json_value(json, config_self.config_json_loc[key], config_item.value);
            }
        }
    }

    this.inject_json_values = function(json) {
        for (key in config_self.config_json_loc) {
            if (config_self.config_json_loc.hasOwnProperty(key)) {
                var config_item = document.getElementById(key);
                config_item.value = config_self.get_json_value(json, config_self.config_json_loc[key]);
            }
        }
    }

    //socket communication

    socket.on('config_res', function(data) {
        config_self.g_json = data.config;
        config_self.inject_json_values(data.config);
    });

    socket.on('config_update_status', function(data) {
       var old_errors = document.getElementsByClassName("error_msg");
        while (old_errors[0]) {
            old_errors[0].parentNode.removeChild(old_errors[0]);
        }
        var old_success = document.getElementsByClassName("success_msg");
        while (old_success[0]) {
            old_success[0].parentNode.removeChild(old_success[0]);
        }
        if (data.success == true) {
            var container = document.getElementById("config_page");
            var success_container = document.createElement("div");
            success_container.classList.add("success_container");
            container.appendChild(success_container);
            var success_el = document.createElement("div");
            success_el.classList.add("success_msg");
            success_el.innerHTML = "Successfully uploaded config. Press Load to restart server and apply settings";
            success_container.appendChild(success_el);
            window.scrollTo(0, document.body.scrollHeight);
            var upload_button = document.getElementById("plex_upload");
            upload_button.disabled = false;
            upload_button.classList.remove("disabled");
        } else {
            var upload_button = document.getElementById("plex_upload");
            upload_button.disabled = true;
            upload_button.classList.add("disabled");
            for (var i = 0; i < data.error_msgs.length; i++) {
                var key = get_config_json_key(data.error_msgs[i][0]);
                var row = document.getElementById(key).parentNode.parentNode;
                var error_el = document.createElement("div");
                error_el.classList.add("error_msg");
                error_el.innerHTML = "* " + data.error_msgs[i][1];
                row.appendChild(error_el);
            }
        }
    });

    this.upload_json = function() {
     config_self.set_all_json(config_self.g_json);
        socket.emit('config_update', {
            config: config_self.g_json
        });
    }

    this.load_json = function() {
        socket.emit('restart');
        window.location = '/';
    }

    window.addEventListener("load", function() {
        socket.emit('config_req', {});
    }, true);
}