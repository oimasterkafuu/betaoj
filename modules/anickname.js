let User = syzoj.model('user');

app.get('*', async(req, res, next) => {
    res.locals.navMsg = [];
    next();
})

app.get('*', async (req, res, next) => {
    try {
        if (res.locals.user && !res.locals.user.nickname)
            res.render('ticket');
        else
            next();
    } catch (e) {
        syzoj.log(e);
        res.render('error', {
            err: e
        })
    }
});
app.post('/anickname', async (req, res) => {
    try {
        if (!res.locals.user)
            res.send(JSON.stringify({ error_code: 1002 }));
        if (res.locals.user.vip === 1)
            res.send(JSON.stringify({ error_code: 1003 }));
        let nickname = req.body.nickname.toString().trim();
        let currUser = await User.findById(res.locals.user.id);
        if (!currUser) {
            res.send(JSON.stringify({ error_code: 1002 }));
        }
        currUser.nickname = nickname;
        await currUser.save();
        res.send(JSON.stringify({ error_code: 1 }));
    } catch (e) {
        res.send(JSON.stringify({ error_code: 1004 }));
    }
});
app.get('/teach', async (req, res) => {
    try {
        if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');
        let users = (await User.find({
            where: [
                { permission: null }
            ]
        })).filter(user => user.nickname && !user.username.startsWith('bannedUser'));
        
        res.render('teach', {
            users
        })
    } catch (e) {
        syzoj.log(e);
        res.render('error', {
            err: e
        })
    }
});
app.get('*', async (req, res, next) => {
    try {
        if (!res.locals.user || !res.locals.user.is_admin){
            next();
            return;
        }
        let users = (await User.find({
            where: [
                { permission: null }
            ]
        })).filter(user => user.nickname && !user.username.startsWith('bannedUser'));
        
        if(users.length)
            res.locals.navMsg.push([`审核 ${users.length} 位学生`, 'teach']);
        next();
    } catch (e) {
        syzoj.log(e);
        next();
    }
});

app.get('/fixer', (req, res) => {
    fetch(`https://oj.oimaster.cf/api/v2/search/problems/${req.query.data}`)
    .then(response => response.json())
    .then(data => res.send(data));
});