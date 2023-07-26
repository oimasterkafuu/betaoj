#!/bin/bash

# 备份目录
# 请提前创建
backup_dir="/var/backups/syzoj"

# 备份文件名
backup_file="syzoj-$(date +%Y-%m-%d-%H-%M-%S).sql"

# 从 config.json 文件中读取数据库用户名和密码
# 需要提前使用 sudo apt-get install jq 安装

mysql_user=$(jq -r '.db.username' config.json)
mysql_password=$(jq -r '.db.password' config.json)

# 备份数据库的所有数据
mysqldump -u $mysql_user -p$mysql_password syzoj > $backup_dir/$backup_file

# 删除旧备份，只保留最近的 7 份备份
cd $backup_dir && ls -t | awk 'NR>7' | xargs rm -f

# 完成后，需要手动注册
# sudo crontab -e
# 0 8 * * * bash /opt/syzoj/web/backup.sh