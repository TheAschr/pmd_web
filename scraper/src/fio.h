#ifndef FIO_H
#define FIO_H

#include <stdio.h>
#include <sys/types.h>
#include <dirent.h>
#include <unistd.h>

int file_exists(char *file_name){
  if( access( file_name, F_OK ) != -1 ){
     return 1;
  }
  else {
      printf(":: ERROR COULD NOT FIND FILE AT %s\n", file_name);
      return 0;
  }
}

int make_dir(char *dir_name){
    DIR *temp_dir;

    if(!(temp_dir = opendir(dir_name))){
 		    CreateDirectory(dir_name,NULL);
    	return 1;
    }else{
    	printf(":: ERROR DIRECTORY %s ALREADY EXISTS\n", dir_name);
  		closedir(temp_dir);
  		return 0;
    }
}

int dir_exists(char *dir_name){
    DIR *temp_dir;

    if(!(temp_dir = opendir(dir_name))){
      printf(":: ERROR COULD NOT FIND DIRECTORY %s\n",dir_name); 
    	return 0;
    }else{
  		closedir(temp_dir);
  		return 1;
    }
}

#endif