#include "json_tree.h"
#include "state_list.h"

#include <stdlib.h>
#include <stdio.h>
#include <string.h>

 static int build_json(JSON_Tree **p_json_tree,FILE *f){
	JSON_Tree *json_tree = *p_json_tree;

	State_List *state_list = init_state_stack();

	char *dec = NULL;
	int dec_length = 0;

	char *val = NULL;
	int val_length = 0;

	JSON_Element *current_element = json_tree->head;

	int line = 0;
	int index = 0;

	int parse_err_cont = 0;

	int c = 0;
	while(c!=EOF){
		c = getc(f);
		index++;
		if(c == '\n'){
			line++;
			index = 0;
		}

		if(top_state_is(state_list,NONE) && c=='{'){
			push_state(state_list,SCOPE);
		}
		else if((top_state_is(state_list,SCOPE) || top_state_is(state_list,SCOPE_IS)) && c=='"'){
			push_state(state_list,DEFINITION);
			push_state(state_list,DECLARATION);
		}
		else if(top_state_is(state_list,DECLARATION) && c=='"'){
			del_top_state(state_list);

			dec[dec_length] = '\0';		
			current_element = insert_json_element(current_element,dec);
			dec_length = 0;
			free(dec);
			dec = NULL;
			if(!current_element)
				return 0;
		}
		else if(top_state_is(state_list,DEFINITION) && c==':'){
			push_state(state_list,IS);
		}
		else if(top_state_is(state_list,IS) && c=='"'){
			del_top_state(state_list);
			push_state(state_list,VALUE);
		}
		else if(top_state_is(state_list,VALUE) && c=='"'){
			del_top_state(state_list);
			if(val_length == 0){
				//printf("\nWARNING EMPTY VALUE FOR KEY %s\n", current_element->key);
				set_json_element_value(&current_element,"");
			}else{
				val[val_length] = '\0';
				val_length = 0;
				set_json_element_value(&current_element,val);
				free(val);
				val = NULL;	
			}

		}
		else if(top_state_is(state_list,DEFINITION) == 1 && (c==',' || c=='\n')){
			del_top_state(state_list);
			
			current_element = current_element->parent;
		}
		else if(top_state_is(state_list,IS) && c=='{'){
			del_top_state(state_list);
			push_state(state_list,SCOPE_IS);
		}
		else if(top_state_is(state_list,SCOPE_IS) && c=='}'){
			del_top_state(state_list);
			del_top_state(state_list);
			current_element = current_element->parent;
		}
		else if(top_state_is(state_list,SCOPE) && c=='}'){
			del_top_state(state_list);
			current_element = current_element->parent;
		}else if((c>=65&&c<=122)&&!(top_state_is(state_list,DECLARATION)||top_state_is(state_list,VALUE))){
			printf("PARSING ERROR ON LINE %d AT INDEX %d: PLEASE PUT QUOTE AROUND VALUES\n",line,index);
			parse_err_cont++;
		}


		if(top_state_is(state_list,DECLARATION) && c!='"'){
			dec_length++;
			dec = realloc(dec,sizeof(char)*(dec_length+1));
			dec[dec_length-1] = c;
		}
		if(top_state_is(state_list,VALUE) && c!='"'){
			val_length++;
			val = realloc(val,sizeof(char)*(val_length+1));
			val[val_length-1] = c;
		}

	}
	if(state_list->length!=0){
		printf("PARSING ERROR: CHECK SYNTAX\n");
	}
	cleanup_state_list(state_list);

	if(parse_err_cont)
		return 0;
	return 1;
}


JSON_Tree *init_json(char *file_name){

	FILE *f = fopen(file_name,"r");
	if(f==NULL){
		printf("ERROR WHEN OPENING CONFIG FILE AT \"%s\"",file_name);
		return 0;
	}

	JSON_Tree *json_tree = (JSON_Tree *)malloc(sizeof(JSON_Tree));
	json_tree->head = malloc(sizeof(JSON_Element));
	json_tree->head->level = 0;
	json_tree->head->key = NULL;
	json_tree->head->value = NULL;
	json_tree->head->parent = NULL;
	json_tree->head->children = NULL;
	json_tree->head->num_children = 0;
	if(!build_json(&json_tree,f)){
		printf("JSON BUILD FAILED\n");
		return 0;
	}
	return json_tree;
}

void print_json_element(JSON_Element *json_element){

	printf("\nLEVEL: %d PARENT: %s\nKEY: %s VALUE: %s\n",json_element->level,json_element->parent->key,json_element->key,json_element->value);

}

void print_json_children(JSON_Element *json_element){
	for(int i = 0; i < json_element->num_children;i++){
		print_json_element(json_element->children[i]);
		print_json_children(json_element->children[i]);
	}
}

void print_json_tree(JSON_Tree *json_tree){
	print_json_children(json_tree->head);
}

JSON_Element *get_json_child(JSON_Element *parent,char *key){		
	if(parent){
		for(int i = 0; i < parent->num_children;i++){
			if(parent->children[i]){
				if(!strcmp(parent->children[i]->key,key)){
					return parent->children[i];
				}
			}
			
		}

	}
	return 0;
}

char *get_json_value(JSON_Element *json_element){
	if(json_element){
		if(json_element->value){
			return json_element->value;
		}else{
			printf("\nCOULD NOT FIND VALUE FOR %s\n",json_element->key);\
		}
	}
	return NULL;
}

void set_json_element_value(JSON_Element **p_json_element,char *p_value){
	JSON_Element *json_element = *p_json_element;
	char *value = malloc(sizeof(char)*(strlen(p_value)+1));
	strcpy(value,p_value);
	json_element->value = value; 
}


JSON_Element *insert_json_element(JSON_Element *parent,char *p_key){
	if(parent){
		if(!get_json_child(parent,p_key)){
			parent->children = realloc(parent->children,sizeof(JSON_Element *)*(parent->num_children+1));

			JSON_Element *new_child = malloc(sizeof(JSON_Element));
			char *key = malloc(sizeof(char)*(strlen(p_key)+1));
			strcpy(key,p_key);
			new_child->key = key;
			new_child->level = parent->level+1;
			new_child->parent = parent;
			new_child->value = NULL;
			new_child->children = NULL;
			new_child->num_children = 0;
			parent->children[parent->num_children] = new_child;
			parent->num_children++;
			return new_child;
		}
		else{
			printf("PARSING ERROR: DUPLICATE CONFIG KEYS NAMED \"%s\"\n",p_key);
		}
	}
	return 0;
}

void cleanup_json_element(JSON_Element *json_element){
	for(int i = 0; i < json_element->num_children; i++){
		if(json_element->children[i])
			cleanup_json_element(json_element->children[i]);		
	}
	if(json_element->key){
		free(json_element->key);
		json_element->key = NULL;
	}
	if(json_element->value){
		free(json_element->value);
		json_element->value = NULL;
	}
	if(json_element->children){
		free(json_element->children);
		json_element->children = NULL;
	}
	free(json_element);
	json_element = NULL;
}

void cleanup_json_tree(JSON_Tree *json_tree){
	if(json_tree){
		cleanup_json_element(json_tree->head);
	}
}