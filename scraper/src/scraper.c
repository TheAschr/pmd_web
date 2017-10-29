#include "scraper.h"
#include "main.h"
#include "string_time.h"
#include <string.h>
#include <time.h>

#ifdef _WIN32
#include <process.h> 
#define proc_ret_type unsigned __stdcall
#define thread_term_function _endthreadex;

#define sleep_1sec Sleep(100)
#define time_type clock_t
#define __curr_time clock()
#define clock_mod CLOCKS_PER_SEC
#endif

#ifdef linux
#include <pthread.h>
#include <unistd.h>
#define proc_ret_type void *
#define thread_term_function pthread_exit;

#define sleep_1sec sleep(0.1)
#define time_type time_t
#define __curr_time time(NULL)
#define clock_mod 1
#endif

typedef struct{
	char *main_page_url;
	int main_page_index;
	sqlite3 *db;
}MainPageThreadData;

int running_threads = 0;
int media_scraped = 0;

proc_ret_type scrape_index_page(void *data){
	MainPageThreadData *m_page_thread_data = (MainPageThreadData *)data;
	
	JSON_Element *local_el = get_json_child(CONFIG->head,"LOCAL",&json_get_child_err);

	JSON_Element *pics_dir_el = get_json_child(local_el,"PICTURES_DIR",&json_get_child_err);

	if(!local_el || !pics_dir_el){
		running_threads--;
		thread_term_function(1);
	}

	char *pics_file_rel = get_json_value(pics_dir_el);
	char pics_dir[strlen(ROOT_DIR)+strlen(pics_file_rel)];
	sprintf(pics_dir,"%s%s",ROOT_DIR,pics_file_rel);

	int main_page_retry = 0;

	do{
		Vector main_page_html = {0,0};
		curl_get_buffer(&main_page_html,m_page_thread_data->main_page_url);
		int end_of_table_pos = html_get_pos_end(&main_page_html,"<table id=torrents");
		if(end_of_table_pos == -1)
			main_page_retry++;
		else{
		 	main_page_retry = 0;
			int n_rows = 0;
			int rc_rows = 0;
			int **row_positions = html_get_pos_between_str(&main_page_html,&n_rows,&rc_rows,"<tr>","</tr>",end_of_table_pos,main_page_html.size);

			for(int media_index = 0; media_index < n_rows;media_index++){
				Media media = {0};

				//SCRAPE TYPE///////////////////////////////////////
				int n_types = 0;
				int rc_types = 0;
				int **type_positions = html_get_pos_between_str(&main_page_html,&n_types,&rc_types,"<td class=t_label>","<td",row_positions[media_index][PRE_END],row_positions[media_index][POST_BEGIN]);

				ScrapeStringContainer *type = string_container_init();

				string_container_transform(type,html_get_string_between_pos(&main_page_html,type_positions[0][PRE_END],type_positions[0][POST_BEGIN]));
				string_container_transform(type,string_remove_to(type->string,"<img class=\""));
				string_container_transform(type,string_remove_after(type->string,"\""));

				media.type = type->string;
				////////////////////////////////////////////////////

				//MAKE SURE TYPE IS ACCEPTD
				int good_type = 1;
				for(int i = 0; i < sizeof(IGNORE_TYPES)/sizeof(IGNORE_TYPES[0]) && good_type;i++)
					if(!strcmp(IGNORE_TYPES[i],type->string))
						good_type = 0;

				if(good_type){
					//SCRAPE TITLE//////////////////////////////////////
					int n_title = 0;
					int rc_title = 0;
					int **title_positions = html_get_pos_between_str(&main_page_html,&n_title, &rc_title,"<a class=\"b\"","</a",row_positions[media_index][PRE_END],row_positions[media_index][POST_BEGIN]);

					ScrapeStringContainer *title = string_container_init();
					string_container_transform(title,html_get_string_between_pos(&main_page_html,title_positions[0][PRE_END],title_positions[0][POST_BEGIN]));
					string_container_transform(title, string_remove_to(title->string,">"));

					media.title = title->string;
					////////////////////////////////////////////////////

					int good_title = 1;
					for(int i = 0; i < sizeof(IGNORE_TITLE_CONTAINS)/sizeof(IGNORE_TITLE_CONTAINS[0]) && good_title;i++)
						if(string_contains(title->string,IGNORE_TITLE_CONTAINS[i]))
							good_title = 0;

					if(good_title){
						//SCRAPE DESCRIPTION////////////////////////////////
						int n_descr = 0;
						int rc_descr = 0;
						int **descr_positions = html_get_pos_between_str(&main_page_html,&n_descr,&rc_descr,"<td class=ac>","<td",row_positions[media_index][PRE_END],row_positions[media_index][POST_BEGIN]);
						////////////////////////////////////////////////////

						//SCRAPE TORRENT LINK///////////////////////////////
						ScrapeStringContainer *tr_link = string_container_init();

						string_container_transform(tr_link,html_get_string_between_pos(&main_page_html,descr_positions[1][PRE_END],descr_positions[1][POST_BEGIN]));
						string_container_transform(tr_link,string_remove_to(tr_link->string,"\""));
						string_container_transform(tr_link,string_remove_after(tr_link->string,"\""));
						
						media.tr_link = tr_link->string;
						////////////////////////////////////////////////////

						//SCRAPE MEDIA SIZE/////////////////////////////////
						media.md_size = html_get_string_between_pos(&main_page_html,descr_positions[3][PRE_END],descr_positions[3][POST_BEGIN]);
						////////////////////////////////////////////////////
						
						//SCRAPE MEDIA ID///////////////////////////////////
						ScrapeStringContainer *md_id = string_container_init();
						md_id->string = realloc(md_id->string,(strlen(tr_link->string)+1)*sizeof(char));
						strcpy(md_id->string,tr_link->string);
						string_container_transform(md_id,string_remove_to(md_id->string,"/download.php/"));
						string_container_transform(md_id, string_remove_after(md_id->string,"/"));

						media.md_id = md_id->string;
						////////////////////////////////////////////////////


				 		//CHECK IF IT EXISTS IN DATABASE
						if(!db_contains(m_page_thread_data->db,"uid",md_id->string)){
		
							//SCRAPE MEDIA PICTURE PAGE/////////////////////////
							int pic_page_retry = 0;

							char pic_page_url_base[] = "https://iptorrents.com/details.php?id=";
							int pic_page_url_length = strlen(pic_page_url_base)+1;
							char pic_page_url[MAX_URL_LENGTH];

							snprintf(pic_page_url,MAX_URL_LENGTH,"%s%s",pic_page_url_base,md_id->string);
							do{
								Vector pic_page_html = {0,0};
								curl_get_buffer(&pic_page_html,pic_page_url);

								if(html_get_pos_end(&pic_page_html,"imdb-photo")==-1)
									pic_page_retry = 1;
								else{
									pic_page_retry = 0;

									//SCRAPE MEDIA PICTURE FILE URL//////////////////////
									int n_pics = 0;
									int rc_pics = 0;
									int **img_link_positions = html_get_pos_between_str(&pic_page_html,&n_pics,&rc_pics,"<img class=\'imdb-photo\' src=\'","\'",0,pic_page_html.size);
									if(n_pics==1){
										
										char *pic_file_url = html_get_string_between_pos(&pic_page_html,img_link_positions[0][PRE_END],img_link_positions[0][POST_BEGIN]);
										char pic_file_ext[] = ".jpeg";								
										char pic_file[strlen(pics_dir)+strlen(md_id->string)+1+strlen(pic_file_ext)];
										snprintf(pic_file,strlen(pics_dir)+1+strlen(md_id->string)+strlen(pic_file_ext)+1,"%s/%s.jpeg",pics_dir,md_id->string);
										
										//SCRAPE MEDIA PICTURE FILE//////////////////////////
										FILE *pic_file_descr = fopen(pic_file,"wb");
										curl_get_file(pic_file_descr,pic_file_url);
										fclose(pic_file_descr);
										////////////////////////////////////////////////////

										char *insert_media_zSQL = sqlite3_mprintf("INSERT INTO media ( title, type, link, size, uid,status) VALUES ('%q','%q','%q','%q','%q','none');"
											,media.title,media.type,media.tr_link,media.md_size,media.md_id,media.md_id);				

										db_exec(m_page_thread_data->db,insert_media_zSQL);

										//printf("%s%s | %s | %s | %s%s\n\n",LINE_BREAK,media.title,media.md_size,media.tr_link,media.type,LINE_BREAK_THIN);			
										media_scraped++;									
										free(pic_file_url);
									}			
									////////////////////////////////////////////////////
									html_pos_cleanup(img_link_positions,rc_pics);

								}
								free(pic_page_html.buffer);
								
							}while(pic_page_retry);
							////////////////////////////////////////////////////
				 		}

				 		html_pos_cleanup(title_positions,rc_title);
						string_container_cleanup(title);

						html_pos_cleanup(type_positions,rc_types);
						string_container_cleanup(type);


						html_pos_cleanup(descr_positions,rc_descr);

						string_container_cleanup(tr_link);

						free(media.md_size);

						string_container_cleanup(md_id);
					}
				}
			}
			html_pos_cleanup(row_positions,rc_rows);
		}
		free(main_page_html.buffer);
	}while(main_page_retry);

	free(m_page_thread_data);
	running_threads--;
	thread_term_function(0);
}

int scrape(int num_pages,sqlite3 *db){
	curl_global_init(CURL_GLOBAL_DEFAULT);

	char main_page_url_base[] = "https://iptorrents.com/t?o=seeders;p=";
	char main_page_url_end[] = "#torrents";
	int running = 1;
	time_type start_time = __curr_time;
	for(int main_page_index = 1; main_page_index <= num_pages;main_page_index++){
		
		char main_page_index_str[50];
		snprintf(main_page_index_str,50,"%d",main_page_index);

		int main_page_url_length = strlen(main_page_url_base)+strlen(main_page_url_end)+strlen(main_page_index_str)+1;
		char *main_page_url = malloc(sizeof(char)*main_page_url_length);
		snprintf(main_page_url,main_page_url_length,"%s%s%s",main_page_url_base,main_page_index_str,main_page_url_end);
		
		MainPageThreadData *m_page_thread_data = malloc(sizeof(MainPageThreadData));
		m_page_thread_data->main_page_url = main_page_url;
		m_page_thread_data->main_page_index = main_page_index;
		m_page_thread_data->db = db;

		running_threads++;

		#ifdef _WIN32
		HANDLE hThread = (HANDLE)_beginthreadex(NULL, 0,scrape_index_page ,m_page_thread_data , 0, NULL);
		#endif

		#ifdef linux
		pthread_t thread;
		pthread_create(&thread,NULL,(void *) &scrape_index_page,m_page_thread_data);
		#endif

	}

	while(running_threads){
		sleep_1sec;

		char *curr_time = get_time_string((float)(__curr_time-start_time)/clock_mod);

		if(curr_time){
			printf("               ");
			printf("\rPAGES REMAINING %d | TIME ELAPSED %s | MEDIA SCRAPED %d", running_threads,curr_time,media_scraped);
			free(curr_time);
		}
	}
	curl_global_cleanup();
	return 1;
}