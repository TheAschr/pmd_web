#include "htmlparse.h"
#include <string.h>

ScrapeStringContainer *string_container_init(){
	ScrapeStringContainer *container = malloc(sizeof(ScrapeStringContainer));
	container->string = NULL;
	return container;
}

void string_container_cleanup(ScrapeStringContainer *container){
	if(container->string != NULL){
		free(container->string);
		container->string = NULL;
	}
	free(container);
}

void string_container_transform(ScrapeStringContainer *container, char *new_str){
	free(container->string);
	container->string = new_str;
}


int string_contains(char *string,const char *str){
	int p_index = 0;
	for(int d_index = 0; d_index < strlen(string);d_index++){
		if(string[d_index] == str[p_index]){
			p_index++;
			if(p_index == strlen(str)){
				return 1;
			}
		}
		else{
			d_index -= p_index;
			p_index = 0;
		}
	}

	return 0;
}

int html_get_pos_end(Vector *data,char *str){
	int p_index = 0;
	for(int d_index = 0; d_index < data->size;d_index++){
		if(data->buffer[d_index] == str[p_index]){
			p_index++;
			if(p_index == strlen(str)){
				return d_index;
			}
		}
		else{
			d_index -= p_index;
			p_index = 0;
		}
	}

	return -1;
}

char* html_get_string_between_pos(Vector *data,int begin,int end){
	char *str = malloc(sizeof(char) * (end-begin+1));
	for(int i = begin; i < end;i++){
		str[i-begin] = data->buffer[i+1];
	}
	str[end-begin] = '\0';
	return str;
}

char* string_remove_to(char *data,char *end){

	char *str = malloc(sizeof(char) * (strlen(data)+1));

	int p_index = 0;
	int found = 0;
	for(int d_index = 0; d_index < strlen(data) && !found;d_index++){
		if(data[d_index] == end[p_index]){
			p_index++;
			if(p_index == strlen(end)){
				found = 1;
				for(int s_index = d_index; s_index < strlen(data);s_index++){
					str[s_index-d_index] = data[s_index+1];
					str[s_index-d_index+2] = '\0';		
				}
			}
		}
		else{
			d_index -= p_index;
			p_index = 0;
		}
	}
	return str;
}

char* string_remove_after(char *data,char *end){

	char *str = malloc(sizeof(char) * (strlen(data)+1));

	int p_index = 0;
	int found = 0;
	for(int d_index = 0; d_index < strlen(data) && !found;d_index++){
		if(data[d_index] == end[p_index]){
			p_index++;
			if(p_index == strlen(end)){
				found = 1;
				for(int s_index = 0; s_index < d_index;s_index++){
					str[s_index] = data[s_index];
					str[s_index+1] = '\0';		
				}	
			}
		}
		else{
			d_index -= p_index;
			p_index = 0;
		}
	}
	return str;
}

void html_pos_cleanup(int **positions,int row_count){
	for(int i = 0; i < row_count;i++)
		free(positions[i]);
	free(positions);
}


int** html_get_pos_between_str(Vector *data,int *size,int *row_count,char *pre, char *post, int begin,int end){

	int num_positions=4;

	int col_count = 0;

	int p_index = 0;
	int r_tail = 0;
	
	int **rows = 0;

	for(int d_index = begin+1; d_index < data->size && data->buffer[d_index]!='\0';d_index++){
		if(data->buffer[d_index] == pre[p_index]){

			p_index++;
			if(p_index == strlen(pre)){
				rows = (int **)realloc(rows,++(*row_count)*sizeof(int*));
				rows[r_tail] = (int *)malloc(num_positions * sizeof(int));
				rows[r_tail][PRE_BEGIN] = d_index-strlen(pre);
				rows[r_tail][PRE_END] = d_index;
				int p_index_post = 0;
				int found = 0;
				for(int d_index_post = d_index+1; d_index_post < data->size && data->buffer[d_index_post]!='\0' && d_index_post < end && !found;d_index_post++){

					if(data->buffer[d_index_post] == post[p_index_post]){
						p_index_post++;
						if(p_index_post == strlen(post)){
							rows[r_tail][POST_BEGIN] = d_index_post-strlen(post);
							rows[r_tail][POST_END] = d_index_post;
							found = 1;
							*size=*size+1;
						}
					}else{
						d_index_post -= p_index_post;
						p_index_post = 0;
					}
				}
				r_tail = r_tail+1;
			}
		}
		else{
			d_index -= p_index;
			p_index = 0;
		}
	}
	return rows;
}
