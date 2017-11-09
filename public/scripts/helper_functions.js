
var data_sizes = ["B","KB","MB","GB","TB"];

function bytes_string_to_int(bytes_string){
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
}
function bytes_to_string(size) {
	if(!size || typeof(size)=='string'){
		return null;
	}
	var multiplier;
	for(multiplier = 0; multiplier < data_sizes.length && Math.pow(1000,multiplier) <= size;multiplier++){}
	return ""+size/Math.pow(1000,multiplier-1)+data_sizes[multiplier-1];
}
function string_to_bytes(size_str){
	if(!size_str ||typeof(size_str)!='string' || !size_str.length){
		return null;
	}
	size_str = size_str.toUpperCase();
	size_str = size_str.replace(/\s/g, '');
	var multiplier;
	var possible_mults = []
	for(multiplier = 0; multiplier < data_sizes.length;multiplier++){
		if(size_str.substring(size_str.length-data_sizes[multiplier].length,size_str.length) == data_sizes[multiplier]){
			possible_mults.push(multiplier);
		}
	}
	if(!possible_mults.length){
		return null;
	}
	if(/[^$,\.\d]/.test(size_str.substring(0,size_str.length-data_sizes[possible_mults.length-1].length))){
		console.log("Not an int");
		return null;
	}
	var size_int = parseInt(size_str.substring(0,size_str.length-data_sizes[possible_mults.length-1].length));
	if(!size_int){
		return null;
	}
	return ""+size_int*Math.pow(1000,possible_mults[possible_mults.length-1])+"B";
	
}