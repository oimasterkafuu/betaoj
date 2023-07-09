#!/bin/bash

WEB_PATH=${1:-"/opt/syzoj/web"}

cd $WEB_PATH
sudo git pull origin master
sudo systemctl restart syzoj-web