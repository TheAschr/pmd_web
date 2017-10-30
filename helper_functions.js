module.exports = {
	parse_phone_num: function(phone_num){
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
	},
	get_with_sizes_between : function(str_min,str_max,media){
		var min = module.exports.parse_data_size(str_min);
		if(!min){
			min = 0;
		}
		var max = module.exports.parse_data_size(str_max);
		if(!max){
			max = Number.MAX_SAFE_INTEGER;
		}
		var results = [];
		for(i = 0; i < media.length; i++){
			var media_size = module.exports.parse_data_size(media[i].size);
			if(media_size >= +min && media_size <= +max){
				results.push(media[i]);
			}	
		}
		return results;
	},
	data_sizes : ['KB','MB','GB','TB'],
	parse_data_size : function(data_str){
		if(!data_str || data_str == ""){
			return null;
		}
		var size = data_str.replace(/[^0-9\.]+/g,"");
		var found = false;
		for(s = 0; s < module.exports.data_sizes.length && !found; s++){
			if(data_str.toUpperCase().search(module.exports.data_sizes[s])!=-1){
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
}