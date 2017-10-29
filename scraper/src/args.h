#ifndef ARGS_H
#define ARGS_H

#include "main.h"
#include <string.h>

void usage(char *argv[]){
	printf("Usage: %s number_of_pages [--help]\n", argv[0]);
}

int is_unsigned_number(char *num_str){
	for(int i = 0;i < strlen(num_str);i++){
		if(num_str[i]<(int)'0' || num_str[i]>(int)'9'){
			printf("%c\n",num_str[i]);
			return 0;
		}
	}
	return 1;
}

int argparse(int argc,char *argv[], int *num_pages){
	for(int i = 1; i < argc; i++){
		if(!strcmp(argv[i],"--help")||!strcmp(argv[i],"-help")){
			usage(argv);
			return 0;
		}else if(!is_unsigned_number(argv[i])){
			usage(argv);
			return 0;
		}
			
	}

	*num_pages = DEF_NUM_PAGES;

	switch (argc){
		case 1:
			printf("\n: NO PARAMTERS DETECTED. STARTING WITH DEFAULTS:%s\nNUMBER OF PAGES|| %d ||%s\n", LINE_BREAK , DEF_NUM_PAGES,LINE_BREAK);
		break;

		case 2:
			printf("\n: STARTING WITH DEFAULTS:%sNUMBER OF PAGES || %d ||%s\n", LINE_BREAK,atoi(argv[1]),LINE_BREAK);
			*num_pages = atoi(argv[1]);
		break;

		default:
			usage(argv);
			return 0;
		break;
	}

	return 1;
}

#endif
