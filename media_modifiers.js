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

module.exports = function(){
	
}