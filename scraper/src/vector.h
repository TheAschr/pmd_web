#ifndef VECTOR_H
#define VECTOR_H

#define VEC_DATA_TYPE char

#include "main.h"

typedef struct {
	VEC_DATA_TYPE *buffer;
	int size;
} Vector;

static void push_back(Vector **vec,VEC_DATA_TYPE el){
	(*vec)->buffer = realloc((*vec)->buffer,(*vec)->size+1*sizeof(VEC_DATA_TYPE));
	(*vec)->buffer[(*vec)->size++] = el;
}

#endif
