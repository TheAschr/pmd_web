#ifndef MAIN_H
#define MAIN_H

#include <stdlib.h>
#include <stdio.h>
#include <strings.h>

#ifdef _WIN32
#define CLEAR "cls"
#endif

#ifdef linux
#define CLEAR "clear"
#endif

#define DEF_NUM_PAGES 0

#define LINE_BREAK "\n======================================================\n"
#define LINE_BREAK_THIN "\n------------------------------------------------------\n"

#include "json_tree.h"

extern JSON_Tree *CONFIG;

#endif