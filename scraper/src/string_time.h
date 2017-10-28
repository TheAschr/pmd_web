#ifndef STRING_TIME_H
#define STRING_TIME_H

#define NUM_TIME_EXT 7

#define MICROSECONDS_SIZE 0.0000001
#define MILLISECONDS_SIZE 0.001
#define SECONDS_SIZE 1
#define MINUTES_SIZE 60*SECONDS_SIZE
#define HOURS_SIZE 60*MINUTES_SIZE
#define DAYS_SIZE 24*HOURS_SIZE
#define WEEKS_SIZE 7*DAYS_SIZE

typedef struct{
	char *label;
	float size;
}TIME_EXT;

const TIME_EXT TIME[NUM_TIME_EXT] = {
	{"MICROSECONDS",MICROSECONDS_SIZE},
	{"MILLISECONDS",MILLISECONDS_SIZE},
	{"SECONDS",SECONDS_SIZE},
	{"MINUTES",MINUTES_SIZE},
	{"HOURS",HOURS_SIZE},
	{"DAYS",DAYS_SIZE},
	{"WEEKS",WEEKS_SIZE}
};

static char *get_time_string(const float p_time){
	float t = p_time;
	if(t < TIME[0].size){
		return NULL;
	}
	int max_time_ext_len = 50+1;
	char *t_str = malloc(sizeof(char)*(max_time_ext_len));
	int t_ext = -1;
	for(t_ext = 0; t_ext< NUM_TIME_EXT && (t>TIME[t_ext].size);t_ext++){}
	snprintf(t_str,max_time_ext_len,"%.1f %s",t/TIME[t_ext-1].size,TIME[t_ext-1].label);
	return t_str;	
}

#endif