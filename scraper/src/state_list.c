#include "state_list.h"

#include <stdlib.h>
#include <stdio.h>
#include <string.h>

State_List *init_state_stack(){
	State_List *state_list = malloc(sizeof(State_List));
	state_list->head = malloc(sizeof(struct State));
	state_list->head->next = NULL;
	state_list->head->prev = NULL;
	state_list->head->state = -1;
	state_list->tail = state_list->head;
	state_list->length = 0; 
}

void print_state_children(struct State *parent){
	printf("\nSTATE: %d\n",parent->state);
	if(parent->next)
		print_state_children(parent->next);
}

void print_state_list(State_List *state_list){
	print_state_children(state_list->head);
}

struct State *get_state_top(State_List *state_list){
	return state_list->tail;
}

int top_state_is(State_List *state_list,int state_check){
	struct State *current_state = get_state_top(state_list);

	if(current_state->state == -1)
		return -1;
	if(current_state->state == state_check)
		return 1;
	return 0;
}

void push_state(State_List *state_list,int p_state){
	state_list->length++;
	struct State *new_state = malloc(sizeof(struct State));
	new_state->state = p_state;
	new_state->prev = state_list->tail;
	new_state->next = NULL;
	state_list->tail->next = new_state;
	state_list->tail = new_state;
}

void del_top_state(State_List *state_list)
{
	state_list->length--;
	struct State *old_tail = state_list->tail;
	state_list->tail = state_list->tail->prev;
	free(old_tail);
	state_list->tail->next = NULL;
}


void cleanup_state_list(State_List *state_list){
	while(state_list->head->next){
		del_top_state(state_list);
	}
	free(state_list->head);
	state_list->head = NULL;
	free(state_list);
	state_list = NULL;
}