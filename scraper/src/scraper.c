#include "scraper.h"
#include "main.h"
#include "string_time.h"
#include <process.h> 

typedef struct{
	char *main_page_url;
	int main_page_index;
	sqlite3 *db;
}MainPageThreadData;

int running_threads = 0;
int movies_scraped = 0;

unsigned __stdcall scrape_index_page(void *data){
	MainPageThreadData *m_page_thread_data = (MainPageThreadData *)data;
	
	JSON_Element *local_el = get_json_child(CONFIG->head,"Local");

	JSON_Element *pics_dir_el = get_json_child(local_el,"Pictures_dir");

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

			for(int movie_index = 0; movie_index < n_rows;movie_index++){
				Movie movie = {0};

				//SCRAPE TYPE///////////////////////////////////////
				int n_types = 0;
				int rc_types = 0;
				int **type_positions = html_get_pos_between_str(&main_page_html,&n_types,&rc_types,"<td class=t_label>","<td",row_positions[movie_index][PRE_END],row_positions[movie_index][POST_BEGIN]);

				ScrapeStringContainer *type = string_container_init();

				string_container_transform(type,html_get_string_between_pos(&main_page_html,type_positions[0][PRE_END],type_positions[0][POST_BEGIN]));
				string_container_transform(type,string_remove_to(type->string,"<img class=\""));
				string_container_transform(type,string_remove_after(type->string,"\""));

				movie.type = type->string;
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
					int **title_positions = html_get_pos_between_str(&main_page_html,&n_title, &rc_title,"<a class=\"b\"","</a",row_positions[movie_index][PRE_END],row_positions[movie_index][POST_BEGIN]);

					ScrapeStringContainer *title = string_container_init();
					string_container_transform(title,html_get_string_between_pos(&main_page_html,title_positions[0][PRE_END],title_positions[0][POST_BEGIN]));
					string_container_transform(title, string_remove_to(title->string,">"));

					movie.title = title->string;
					////////////////////////////////////////////////////

					int good_title = 1;
					for(int i = 0; i < sizeof(IGNORE_TITLE_CONTAINS)/sizeof(IGNORE_TITLE_CONTAINS[0]) && good_title;i++)
						if(string_contains(title->string,IGNORE_TITLE_CONTAINS[i]))
							good_title = 0;

					if(good_title){
						//SCRAPE DESCRIPTION////////////////////////////////
						int n_descr = 0;
						int rc_descr = 0;
						int **descr_positions = html_get_pos_between_str(&main_page_html,&n_descr,&rc_descr,"<td class=ac>","<td",row_positions[movie_index][PRE_END],row_positions[movie_index][POST_BEGIN]);
						////////////////////////////////////////////////////

						//SCRAPE TORRENT LINK///////////////////////////////
						ScrapeStringContainer *tr_link = string_container_init();

						string_container_transform(tr_link,html_get_string_between_pos(&main_page_html,descr_positions[1][PRE_END],descr_positions[1][POST_BEGIN]));
						string_container_transform(tr_link,string_remove_to(tr_link->string,"\""));
						string_container_transform(tr_link,string_remove_after(tr_link->string,"\""));
						
						movie.tr_link = tr_link->string;
						////////////////////////////////////////////////////

						//SCRAPE MOVIE SIZE/////////////////////////////////
						movie.mv_size = html_get_string_between_pos(&main_page_html,descr_positions[3][PRE_END],descr_positions[3][POST_BEGIN]);
						////////////////////////////////////////////////////
						
						//SCRAPE MOVIE ID///////////////////////////////////
						ScrapeStringContainer *mv_id = string_container_init();
						mv_id->string = realloc(mv_id->string,(strlen(tr_link->string)+1)*sizeof(char));
						strcpy(mv_id->string,tr_link->string);
						string_container_transform(mv_id,string_remove_to(mv_id->string,"/download.php/"));
						string_container_transform(mv_id, string_remove_after(mv_id->string,"/"));

						movie.mv_id = mv_id->string;
						////////////////////////////////////////////////////


				 		//CHECK IF IT EXISTS IN DATABASE
						if(!db_contains(m_page_thread_data->db,"uid",mv_id->string)){
		
							//SCRAPE MOVIE PICTURE PAGE/////////////////////////
							int pic_page_retry = 0;

							char pic_page_url_base[] = "https://iptorrents.com/details.php?id=";
							int pic_page_url_length = strlen(pic_page_url_base)+1;
							char pic_page_url[MAX_URL_LENGTH];

							snprintf(pic_page_url,MAX_URL_LENGTH,"%s%s",pic_page_url_base,mv_id->string);
							do{
								Vector pic_page_html = {0,0};
								curl_get_buffer(&pic_page_html,pic_page_url);

								if(html_get_pos_end(&pic_page_html,"imdb-photo")==-1)
									pic_page_retry = 1;
								else{
									pic_page_retry = 0;

									//SCRAPE MOVIE PICTURE FILE URL//////////////////////
									int n_pics = 0;
									int rc_pics = 0;
									int **img_link_positions = html_get_pos_between_str(&pic_page_html,&n_pics,&rc_pics,"<img class=\'imdb-photo\' src=\'","\'",0,pic_page_html.size);
									if(n_pics==1){
										
										char *pic_file_url = html_get_string_between_pos(&pic_page_html,img_link_positions[0][PRE_END],img_link_positions[0][POST_BEGIN]);
										char pic_file_ext[] = ".jpeg";								
										char pic_file[strlen(mv_id->string)+strlen(pic_file_ext)];
										snprintf(pic_file,strlen(pics_dir)+1+strlen(mv_id->string)+1+strlen(pic_file_ext),"%s\\%s.jpeg",pics_dir,mv_id->string);

										//SCRAPE MOVIE PICTURE FILE//////////////////////////

										FILE *pic_file_descr = fopen(pic_file,"wb");
										curl_get_file(pic_file_descr,pic_file_url);
										fclose(pic_file_descr);
										////////////////////////////////////////////////////

										char *insert_movie_zSQL = sqlite3_mprintf("INSERT INTO movies ( title, type, link, size, uid,status) VALUES ('%q','%q','%q','%q','%q','none');"
											,movie.title,movie.type,movie.tr_link,movie.mv_size,movie.mv_id,movie.mv_id);				

										db_exec(m_page_thread_data->db,insert_movie_zSQL);

										//printf("%s%s | %s | %s | %s%s\n\n",LINE_BREAK,movie.title,movie.mv_size,movie.tr_link,movie.type,LINE_BREAK_THIN);			
										movies_scraped++;									
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

						free(movie.mv_size);

						string_container_cleanup(mv_id);
					}
				}
			}
			html_pos_cleanup(row_positions,rc_rows);
		}
		free(main_page_html.buffer);
	}while(main_page_retry);

	free(m_page_thread_data);
	running_threads--;
	_endthreadex(0);
}

int scrape(int num_pages,sqlite3 *db){

	curl_global_init(CURL_GLOBAL_DEFAULT);

	char main_page_url_base[] = "https://iptorrents.com/t?o=seeders;p=";
	char main_page_url_end[] = "#torrents";
	int running = 1;
	clock_t start_time = clock();
	for(int main_page_index = 1; main_page_index <= num_pages;main_page_index++){
		
		char main_page_index_str[50];
		itoa(main_page_index,main_page_index_str,10);

		int main_page_url_length = strlen(main_page_url_base)+strlen(main_page_url_end)+strlen(main_page_index_str)+1;
		char *main_page_url = malloc(sizeof(char)*main_page_url_length);
		snprintf(main_page_url,main_page_url_length,"%s%s%s",main_page_url_base,main_page_index_str,main_page_url_end);
		
		MainPageThreadData *m_page_thread_data = malloc(sizeof(MainPageThreadData));
		m_page_thread_data->main_page_url = main_page_url;
		m_page_thread_data->main_page_index = main_page_index;
		m_page_thread_data->db = db;

		running_threads++;

		unsigned threadID;
		HANDLE hThread = (HANDLE)_beginthreadex(NULL, 0,scrape_index_page ,m_page_thread_data , 0, &threadID);

	}

	while(running_threads){
		printf("               ");
		char *curr_time = get_time_string((float)(clock()-start_time)/CLOCKS_PER_SEC);
		printf("\rPAGES REMAINING %d | TIME ELAPSED %s | MOVIES SCRAPED %d", running_threads,curr_time,movies_scraped);
		free(curr_time);
		Sleep(100);
	}
	curl_global_cleanup();
	return 1;
}