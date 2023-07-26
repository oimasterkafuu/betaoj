#!/bin/bash

sudo bash ./backup.sh
sudo git pull origin master
yarn
sudo systemctl restart syzoj-web