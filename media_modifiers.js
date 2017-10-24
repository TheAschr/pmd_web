var data_sizes = ['KB','MB','GB','TB'];

function normalize_data_size(data_str){
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

module.exports = {
	size_between : function(str_min,str_max,media){
		var min = normalize_data_size(str_min);
		var max = normalize_data_size(str_max);
		var results = [];
		for(i = 0; i < media.length; i++){
			var media_size = normalize_data_size(media[i].size);
			if(media_size >= +min && media_size <= +max){
				results.push(media[i]);
			}	
		}
		return results;
	}
	
}