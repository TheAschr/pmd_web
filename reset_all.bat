set home=%CD%

set reset_dirs=config data scraper

set delete_dirs=media_files torrent_files data\pics .forever temp

for %%i in (%reset_dirs%) do (
	cd %%i
	CALL "reset.bat"
	cd %home%
)

for %%i in (%delete_dirs%) do (
	del /S/Q %%i\*
	type nul > %%i\.gitignore
)
