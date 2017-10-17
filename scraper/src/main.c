#include "main.h"
#include "args.h"
#include "db.h"
#include "scraper.h"
#include "fio.h"


JSON_Tree *CONFIG = NULL;

int main(int argc,char *argv[]){
	CONFIG = init_json("../../config/scraper_config.json");

	char *db_file = get_json_value(get_json_child(get_json_child(CONFIG->head,"Local"),"DB_File"));
	if(!file_exists(db_file)){
		return 1;
	}
	
	char *pics_dir = get_json_value(get_json_child(get_json_child(CONFIG->head,"Local"),"Pictures_dir"));
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