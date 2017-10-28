TARGET = scraper

SRC_DIR = src
BIN_DIR = bin
OBJ_DIR = obj

WIN_CC=x86_64-w64-mingw32-gcc-4.5.4-release-win64_rubenvb/mingw64/bin/gcc
LIN_CC=gcc

LIN_CFLAGS= $(SRC_DIR)/sqlite3/sqlite3.c
WIN_CFLAGS=-I. -L$(BIN_DIR) -std=c99

LIN_LIBS = -lcurl -lpthread -ldl
WIN_LIBS = -l:libcurl.dll -l:sqlite3.dll -l:libcrypto-1_1-x64.dll

linux:
	$(LIN_CC) $(SRC_DIR)/*.c $(LIN_CFLAGS) $(LIN_LIBS) -o $(BIN_DIR)/$(TARGET)

clean_linux:
	rm $(BIN_DIR)/$(TARGET)
	rm $(SRC_DIR)/*.gch

windows:
	$(WIN_CC) $(SRC_DIR)/*.c $(WIN_CFLAGS) $(WIN_LIBS) -o $(BIN_DIR)/$(TARGET).exe

clean_windows:
	del $(BIN_DIR)\$(TARGET).exe