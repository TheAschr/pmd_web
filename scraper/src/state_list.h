#ifndef STATE_LIST_H
#define STATE_LIST

struct State;

struct State{
	int state;
	struct State *next;
	struct State *prev;	
};

typedef struct{
	struct State *head;
	struct State *tail;
	int length;
}State_List;

State_List *init_state_stack();

void print_state_children(struct State *parent);

void print_state_list(State_List *state_list);

struct State *get_state_top(State_List *state_list);

int top_state_is(State_List *state_list,int state_check);

void push_state(State_List *state_list,int p_state);

void del_top_state(State_List *state_list);

void cleanup_state_list(State_List *state_list);

#endif