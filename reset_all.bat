set home=%CD%

set reset_dirs=config data scraper ssl

set delete_dirs=media_files torrent_files public\pics

for %%i in (%reset_dirs%) do (
	cd %%i
	CALL "reset.bat"
	cd %home%
)

for %%i in (%delete_dirs%) do (
	rd /S/Q %%i
)