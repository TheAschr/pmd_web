#ifndef JSON_TREE_H
#define JSON_TREE_H

enum STATES{
	NONE = -1,  //-1
	SCOPE,		//0
	SCOPE_IS,	//1
	DEFINITION,	//2
	DECLARATION,//3
	IS,			//4
	VALUE 		//5
};

struct JSON_Element;

struct JSON_Element{
	char *key;
	char *value;

	int level;

	struct JSON_Element *parent;
	struct JSON_Element **children;
	int num_children;
};

typedef struct JSON_Element JSON_Element;

typedef struct
{
	JSON_Element *head;
}JSON_Tree;

void print_json_element(JSON_Element *json_element);

void print_json_children(JSON_Element *json_element);

void print_json_tree(JSON_Tree *json_tree);

JSON_Element *get_json_child(JSON_Element *parent,char *key);

char *get_json_value(JSON_Element *json_element);

void set_json_element_value(JSON_Element **p_json_element,char *p_value);

JSON_Element *insert_json_element(JSON_Element *parent,char *p_key);

JSON_Tree *init_json(char *file_name);

void cleanup_json_tree(JSON_Tree *json_tree);

#endif