#ifndef WEB_H
#define WEB_H

#include "vector.h"
#include "curl/curl.h"

int curl_get_buffer(Vector *vector,char *url);
int curl_get_file(FILE *f,char *url);

#endif
