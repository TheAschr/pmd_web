#include "main.h"
#include "args.h"
#include "config.h"
#include "db.h"
#include "scraper.h"
#include "fio.h"

struct Config _CONFIG;
struct Config *CONFIG = &_CONFIG;

int main(int argc,char *argv[]){
	
	CONFIG->cookie=find_config("COOKIE");

	CONFIG->db_file = find_config("DB_FILE");
	if(!file_exists(CONFIG->db_file))
		return 1;
	
	CONFIG->pics_dir = find_config("PICTURES_DIR");
	if(!dir_exists(CONFIG->pics_dir))
		if(!make_dir(CONFIG->pics_dir))
			return 1;

	int num_pages;
	sqlite3 *db;

	if(argparse(argc,argv,&num_pages) && conn_db(&db,CONFIG->db_file))
		scrape(num_pages,db);

	close_db(db);
	return 0;
}