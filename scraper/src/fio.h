#ifndef FIO_H
#define FIO_H

#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <dirent.h>
#include <unistd.h>

#ifdef _WIN32
#define make_dir_function CreateDirectory
#define make_dir_security NULL
#endif
#ifdef linux
#define make_dir_function mkdir
#define make_dir_security 0700
#endif

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
        make_dir_function(dir_name,make_dir_security);
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