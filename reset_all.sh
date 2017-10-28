#!/bin/bash

SCRIPT=$(readlink -f "$0")
HOME=$(dirname "$SCRIPT")

reset_dirs=(config data scraper)
delete_dirs=(media_files torrent_files public/pics)

for i in "${reset_dirs[@]}"
do
	:
	cd $HOME/$i
	sh ./reset.sh
	cd $HOME
done
for i in "${delete_dirs[@]}"
do
	:
	rm -r $HOME/$i/*.*
done