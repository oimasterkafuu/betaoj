#!/bin/bash

sudo git pull origin master
yarn
sudo systemctl restart syzoj-web