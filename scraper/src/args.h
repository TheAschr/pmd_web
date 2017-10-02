#ifndef ARGS_H
#define ARGS_H

#include "main.h"

void usage(char *argv[]){
	printf("Usage: %s [number of pages] [--help]\n", argv[0]);
}


int argparse(int argc,char *argv[], int *num_pages){
	for(int i = 0; i < argc; i++){
		if(!strcmp(argv[i],"--help")||!strcmp(argv[i],"-help")){
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
