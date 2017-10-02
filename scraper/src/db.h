#ifndef DB_H
#define DB_H

#include "sqlite3/sqlite3.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define TABLE_NAME "movies"

int conn_db(sqlite3 **conn,char *db_file);

int close_db(sqlite3 *conn);

int db_size(sqlite3 *conn);

int db_contains(sqlite3 *conn,unsigned char *field,unsigned char *specifier);

int db_exec(sqlite3 *conn,unsigned char *zSQL);

#endif