#ifndef CONFIG_H
#define CONFIG_H

#include <stdlib.h>

#define CONFIG_FILE "../config.txt"

#define MAX_CONFIG_NAME_LENGTH 300

#define MAX_CONFIG_VALUE_LENGTH 300

struct Config{
	char *cookie;
	char *db_file;
	char *pics_dir;
};

static char *find_config(char *name){
    FILE* f = fopen(CONFIG_FILE, "r");
	if(f < 0)
		printf("ERROR OPENING CONFIG FILE || %d ||\n", f);
	int c;
	while(c!=EOF){
		char c_name[MAX_CONFIG_NAME_LENGTH];
		int c_name_index = 0;
		while((c=getc(f))!=' ' && c!=EOF && c!='\n'){
			c_name[c_name_index++] = c;		
		}
		c_name[c_name_index] = '\0';

		int comment = 0;
		for(int i = 0; i< c_name_index && (c_name[i]!=' ' || c_name[i] !='\t');i++)
			if(c_name[i] == '#')
				comment = 1;
		
		if(!strcmp(name,c_name) && !comment){
			char c_value[MAX_CONFIG_VALUE_LENGTH];
			int c_value_index = 0;
			while((c=getc(f))!='\n' && c!=EOF && c!=' ' && c!='\t'){
				c_value[c_value_index++] = c;
			}
			c_value[c_value_index]  = '\0';
			char *ret_value = malloc(sizeof(char)*strlen(c_value)+1);
			strcpy(ret_value,c_value);
		    fclose(f);
			return(ret_value);
		}

	}
	printf(":: ERROR FAILED TO FIND CONFIG CALLED %s\n",name);
    fclose(f);
    return 0;
}


#endif