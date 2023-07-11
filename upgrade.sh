#!/bin/bash

sudo git pull origin master
npx tsc -p .
sudo systemctl restart syzoj-web