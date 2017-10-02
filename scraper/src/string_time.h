#ifndef STRING_TIME_H
#define STRING_TIME_H

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

const TIME_EXT TIME[6] = {
	{"MILLISECONDS",MILLISECONDS_SIZE},
	{"SECONDS",SECONDS_SIZE},
	{"MINUTES",MINUTES_SIZE},
	{"HOURS",HOURS_SIZE},
	{"DAYS",DAYS_SIZE},
	{"WEEKS",WEEKS_SIZE}
};

static char *get_time_string(const float p_time){
	float time = p_time;
	int max_time_ext_len = 50+1;
	char *t_str = malloc(sizeof(char)*(max_time_ext_len));
	int t_ext = -1;
	int max = 0;
	for(t_ext = 0; t_ext< sizeof(TIME)/sizeof(TIME[0]) && (time>TIME[t_ext].size);t_ext++){}
	snprintf(t_str,max_time_ext_len,"%.1f %s",time/TIME[t_ext-1].size,TIME[t_ext-1].label);
	return t_str;	
}

#endif