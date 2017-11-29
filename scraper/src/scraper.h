#ifndef SCRAPER_H
#define SCRAPER_H

#include "htmlparse.h"
#include "web.h"
#include "db.h"
#include <time.h>

#define MAX_URL_LENGTH 256

int scrape(int num_pages,sqlite3 *db);

typedef struct {
	char *type;
	char *title;
	char *seeders;
	char *tr_link;
	char *md_size;
	char *md_id;
}Media;

static const char *IGNORE_TYPES[] = {
	"Cam",
	"iPodTV"
};

static const char *IGNORE_TITLE_CONTAINS[] = {
	" HC "
};

#endif