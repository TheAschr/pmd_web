#include "db.h"

/*******************************************************************/

int conn_db(sqlite3 **conn,char *db_file){

	printf(": CONNECTING TO SQLITE DATABASE AT %s\n",db_file);
 	int err = sqlite3_open(db_file,conn);

 	if(err){
 		printf(":: ERROR || CONNECTION FAILED ||\n");
 		sqlite3_close(*conn);
 		return 0;
 	}
 	else{
 		printf(": DONE\n\n");
 		return 1;
 	}

}

/*******************************************************************/

int close_db(sqlite3 *conn){

	printf(": CLOSING CONNECTION TO SQLITE DATABASE\n");
 	int err = sqlite3_close(conn);

 	if(err){
 		printf(":: ERROR || CONNECTION CLOSE FAILED ||\n");
 		return 0;
 	}
 	else{
 		printf(": DONE\n\n");
 		return 1;
 	}

}

/*******************************************************************/

static int db_size_cb(void *size ,int argc, char **argv, char **azColName){ 
	*(int *)size = atoi(argv[0]);
	return 0;
}

int db_size(sqlite3 *conn){
	int size;
	char *err = 0;
	char *zSQL = sqlite3_mprintf("SELECT Count(*) FROM %q",TABLE_NAME);
	int cerr = sqlite3_exec(conn,zSQL,db_size_cb,(void*)&size,&err);
	sqlite3_free(zSQL);
	if(cerr){
		printf(":: SQL ERROR IN \"db_size\" || %s ||\n", err);
		sqlite3_free(err);
		return -1;
	}
	return size;
}

/*******************************************************************/

static int db_contains_cb(void *contains ,int argc, char **argv, char **azColName){
	*(int *)contains = 1;
	return 0;
}

int db_contains(sqlite3 *conn,unsigned char *field,unsigned char *specifier){
	int contains = 0;
	char *err = 0;
	char *zSQL = sqlite3_mprintf("SELECT * FROM %q WHERE %q = %q LIMIT 1",TABLE_NAME,field,specifier);
	int cerr = sqlite3_exec(conn,zSQL,db_contains_cb,(void*)&contains,&err);
	sqlite3_free(zSQL);
	if(cerr){
		printf(":: SQL ERROR IN \"db_contains\" || %s ||\n", err);
		sqlite3_free(err);
		return -1;
	}
	return contains;
}

/*******************************************************************/


int db_exec(sqlite3 *conn,unsigned char *zSQL){
	char *err = 0;
	int cerr = sqlite3_exec(conn,zSQL,NULL,NULL,&err);
	sqlite3_free(zSQL);
	if(cerr){
		printf(":: SQL ERROR IN \"db_exec\" || %s ||\n", err);
		sqlite3_free(err);
		return 0;
	}
	return 1;
}