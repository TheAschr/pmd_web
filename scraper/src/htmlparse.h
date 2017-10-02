#ifndef HTMLPARSE_H
#define HTMLPARSE_H

#include "vector.h"

#define PRE_BEGIN 0
#define PRE_END 1
#define POST_BEGIN 2
#define POST_END 3

typedef struct
{
	char *string;
}ScrapeStringContainer;

ScrapeStringContainer *string_container_init();

void string_container_cleanup(ScrapeStringContainer *container);

void string_container_transform(ScrapeStringContainer *container, char *new_str);

int string_contains(char *string,const char *str);

int html_get_pos_end(Vector *data,char *str);

char* html_get_string_between_pos(Vector *data,int begin,int end);

char* string_remove_to(char *data,char *end);
char* string_remove_after(char *data,char *end);

void html_pos_cleanup(int **positions,int row_count);

int** html_get_pos_between_str(Vector *data,int *size,int *row_count,char *pre, char *post, int begin, int end);

#endif