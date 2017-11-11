module.exports = {
	parse_phone_num : function(phone_num){
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
}