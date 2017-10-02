#include "web.h"
#include "main.h"
#include "config.h"


static size_t get_buffer_cb(void *ptr, size_t size, size_t nmemb,Vector **vector) 
{ 
	char *data = (char *)ptr;
	for(int i = 0; i < nmemb;i++){
		push_back(vector,data[i]);
	}
	
	return size*nmemb; 
}

int curl_get_buffer(Vector *vector,char *url){

    CURLSH *share = curl_share_init(); 
    curl_share_setopt(share, CURLSHOPT_SHARE, CURL_LOCK_DATA_SSL_SESSION); 

	CURL *curl = curl_easy_init();
	
	if(curl) {
		curl_easy_setopt(curl, CURLOPT_SHARE, share);
		curl_easy_setopt(curl, CURLOPT_NOSIGNAL, 1); 

		curl_easy_setopt(curl, CURLOPT_URL, url);

		curl_easy_setopt(curl, CURLOPT_COOKIE,CONFIG->cookie);

		curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);

		curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, get_buffer_cb); 

    	curl_easy_setopt(curl, CURLOPT_WRITEDATA, &vector);
		
		CURLcode res = curl_easy_perform(curl);
		if(res != CURLE_OK){
			fprintf(stderr, ":: FAILED || %s ||\n\n",
			curl_easy_strerror(res));
			return 0;
		}
		push_back(&vector,'\0');
	}
	curl_easy_cleanup(curl);
	curl_share_cleanup(share);
	return 1;
}


static size_t get_file_cb(void *ptr, size_t size, size_t nmemb, FILE *stream) 
{ 
 return fwrite(ptr, size, nmemb, stream); 
} 

int curl_get_file(FILE *f,char *url){

	CURL *curl = curl_easy_init();

	if(curl) {

		curl_easy_setopt(curl, CURLOPT_NOSIGNAL, 1); 

		curl_easy_setopt(curl, CURLOPT_URL, url);

		curl_easy_setopt(curl, CURLOPT_COOKIE,CONFIG->cookie);

		curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);

		curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, get_file_cb); 

    	curl_easy_setopt(curl, CURLOPT_WRITEDATA, f);
		
		CURLcode res = curl_easy_perform(curl);
		if(res != CURLE_OK){
			fprintf(stderr, ":: FAILED || %s ||\n\n",
			curl_easy_strerror(res));
			return 0;
		}


	}
	
	curl_easy_cleanup(curl);
return 1;
}

