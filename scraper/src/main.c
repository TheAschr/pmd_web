#include "main.h"
#include "args.h"
#include "db.h"
#include "scraper.h"
#include "fio.h"

char *ROOT_DIR = "../../";

JSON_Tree *CONFIG = NULL;

int main(int argc,char *argv[]){

	char json_config_file[] = "config/config.json";

	char json_config[strlen(ROOT_DIR)+strlen(json_config_file)];
	sprintf(json_config,"%s%s",ROOT_DIR,json_config_file);

	CONFIG = init_json(json_config);

	JSON_Element *local_el = get_json_child(CONFIG->head,"Local");
	
	JSON_Element *db_file_el = get_json_child(local_el,"DB_File");

	char *db_file_rel = get_json_value(db_file_el);
	char db_file[strlen(ROOT_DIR)+strlen(db_file_rel)];
	sprintf(db_file,"%s%s",ROOT_DIR,db_file_rel);

	if(!file_exists(db_file)){
		return 1;
	}
	
	JSON_Element *pics_dir_el = get_json_child(local_el,"Pictures_dir");

	char *pics_file_rel = get_json_value(pics_dir_el);
	char pics_dir[strlen(ROOT_DIR)+strlen(pics_file_rel)];
	sprintf(pics_dir,"%s%s",ROOT_DIR,pics_file_rel);

	if(!dir_exists(pics_dir)){
		if(!make_dir(pics_dir))
			return 1;
	}

	int num_pages;
	sqlite3 *db;

	if(argparse(argc,argv,&num_pages) && conn_db(&db,db_file))
		scrape(num_pages,db);

	close_db(db);
	cleanup_json_tree(CONFIG);
	return 0;
}