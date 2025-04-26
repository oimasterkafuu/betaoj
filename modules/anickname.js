let User = syzoj.model('user');
const Email = require('../libs/email');

app.post('/anickname', async (req, res) => {
    try {
        if (!res.locals.user) res.send(JSON.stringify({ error_code: 1002 }));
        if (res.locals.user.vip === 1){
            res.send(JSON.stringify({ error_code: 1003 }));
            return;
        }
        let nickname = req.body.nickname.toString().trim();
        let chineseRegex = /^(?:[\u4e00-\u9fa5·]{2,16})$/;
        if (!chineseRegex.test(nickname)) {
            res.send(JSON.stringify({ error_code: 1005 }));
            return;
        }
        let currUser = await User.findById(res.locals.user.id);
        if (!currUser) {
            res.send(JSON.stringify({ error_code: 1002 }));
            return;
        }
        currUser.nickname = nickname;
        currUser.nickname_time = Math.floor(Date.now() / 1000); // 记录实名认证提交时间（Unix时间戳，单位：秒）
        await currUser.save();
        
        // 只有当register_mail配置为true时才发送邮件
        if (syzoj.config.register_mail) {
            // send email to admins
            let admins = await User.find({
                is_admin: true
            });
            let emails = [];
            for (let admin of admins) {
                emails.push(admin.email);
            }

            Email.send(
                emails,
                `${currUser.username} 实名认证通知`,
                `用户 ${currUser.username} 在 ${syzoj.config.title} 实名认证 ${nickname}，请尽快审核。`
            );
        }

        res.send(JSON.stringify({ error_code: 1 }));
    } catch (e) {
        res.send(JSON.stringify({ error_code: 1004 }));
    }
});
app.get('/teach', async (req, res) => {
    try {
        if (!res.locals.user || !res.locals.user.is_admin)
            throw new ErrorMessage('您没有权限进行此操作。');
        
        syzoj.log('正在获取待审核用户列表...');
        
        let users = [];
        try {
            users = await User.find({
                where: [{ permission: null }]
            });
            syzoj.log(`共找到 ${users.length} 个permission为null的用户`);
            
            users = users.filter(user => user.nickname && !user.username.startsWith('bannedUser'));
            syzoj.log(`过滤后剩余 ${users.length} 个有nickname且非banned的用户`);
        } catch (error) {
            syzoj.log('查询用户数据时出错：' + error);
            users = [];
        }
        
        // 确保users是数组
        if (!Array.isArray(users)) {
            syzoj.log('警告：users不是数组，设置为空数组');
            users = [];
        }
        
        // 确保每个用户对象都有必要的字段
        users = users.map(user => {
            // 如果nickname_time不存在，设置一个默认值
            if (user.nickname_time === undefined || user.nickname_time === null) {
                user.nickname_time = Math.floor(Date.now() / 1000) - (10 * 24 * 60 * 60); // 默认10天前
                syzoj.log(`用户 ${user.username} 的nickname_time为空，设置为默认值`);
            }
            return user;
        });

        res.render('teach', {
            users: users
        });
    } catch (e) {
        syzoj.log(e);
        res.render('error', {
            err: e
        });
    }
});

app.get('*', async (req, res, next) => {
    try {
        // 允许访问登出路径，即使用户没有实名认证
        if (req.path.startsWith('/logout') || req.path.includes('logout')) {
            next();
            return;
        }
        
        if (res.locals.user && !res.locals.user.nickname) res.render('ticket');
        else next();
    } catch (e) {
        syzoj.log(e);
        res.render('error', {
            err: e
        });
    }
});
app.post('*', async (req, res, next) => {
    try {
        // 允许登出操作，即使用户没有实名认证
        if (req.path === '/logout' || req.path.includes('logout')) {
            next();
            return;
        }
        
        if (res.locals.user && !res.locals.user.nickname) res.render('ticket');
        else next();
    } catch (e) {
        syzoj.log(e);
        res.render('error', {
            err: e
        });
    }
});
app.get('*', async (req, res, next) => {
    try {
        if (!res.locals.user || !res.locals.user.is_admin) {
            next();
            return;
        }
        let users = (
            await User.find({
                where: [{ permission: null }]
            })
        ).filter(
            (user) => user.nickname && !user.username.startsWith('bannedUser')
        );

        res.locals.needPass = users.length;
        next();
    } catch (e) {
        syzoj.log(e);
        next();
    }
});
app.post('*', async (req, res, next) => {
    try {
        if (!res.locals.user || !res.locals.user.is_admin) {
            next();
            return;
        }
        let users = (
            await User.find({
                where: [{ permission: null }]
            })
        ).filter(
            (user) => user.nickname && !user.username.startsWith('bannedUser')
        );

        res.locals.needPass = users.length;
        next();
    } catch (e) {
        syzoj.log(e);
        next();
    }
});
