module.exports = {
	get_with_sizes_between : function(str_min,str_max,media){
		var min = module.exports.bytes_string_to_int(module.exports.string_to_bytes(str_min));
		if(!min){
			min = 0;
		}
		var max = module.exports.bytes_string_to_int(module.exports.string_to_bytes(str_max));
		if(!max){
			max = Number.MAX_SAFE_INTEGER;
		}
		var results = [];
		for(i = 0; i < media.length; i++){
			var media_size = module.exports.bytes_string_to_int(module.exports.string_to_bytes(String(media[i].size)));
			if(media_size >= +min && media_size <= +max){
				results.push(media[i]);
			}	
		}
		return results;
	},
	data_sizes : ["B","KB","MB","GB","TB"],
	bytes_string_to_int: function(bytes_string){
		if(!bytes_string || typeof(bytes_string)!='string' || !bytes_string.length){
			return null;
		}
		bytes_string = bytes_string.toUpperCase();
		bytes_string = bytes_string.replace(/\s/g, '');
		if(bytes_string[bytes_string.length-1]!='B' || /[^\.\d]/.test(bytes_string.substring(0,bytes_string.length-1))){
			console.log("Not bytes string");
			return null;
		}
		bytes_string.length = bytes_string.length - 1;
		return parseInt(bytes_string);
	},
	bytes_to_string : function(size) {
		if(!size || typeof(size)=='string'){
			return null;
		}
		var multiplier;
		for(multiplier = 0; multiplier < module.exports.data_sizes.length && Math.pow(1000,multiplier) <= size;multiplier++){}
		return ""+size/Math.pow(1000,multiplier-1)+module.exports.data_sizes[multiplier-1];
	},
	string_to_bytes : function(size_str){
		if(!size_str ||typeof(size_str)!='string' || !size_str.length){
			return null;
		}
		size_str = size_str.toUpperCase();
		size_str = size_str.replace(/\s/g, '');
		var multiplier;
		var possible_mults = []
		for(multiplier = 0; multiplier < module.exports.data_sizes.length;multiplier++){
			if(size_str.substring(size_str.length-module.exports.data_sizes[multiplier].length,size_str.length) == module.exports.data_sizes[multiplier]){
				possible_mults.push(multiplier);
			}
		}
		if(!possible_mults.length){
			return null;
		}
		if(/[^$,\.\d]/.test(size_str.substring(0,size_str.length-module.exports.data_sizes[possible_mults.length-1].length))){
			console.log("Not an int");
			return null;
		}
		var size_int = parseInt(size_str.substring(0,size_str.length-module.exports.data_sizes[possible_mults.length-1].length));
		if(!size_int){
			return null;
		}
		return ""+size_int*Math.pow(1000,possible_mults[possible_mults.length-1])+"B";
		
	}
}