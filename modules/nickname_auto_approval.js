/**
 * 实名认证自动审核模块
 * 处理15天内未被管理员审核的用户自动标记为外来学生
 */
let User = syzoj.model('user');

// 15天的秒数
const AUTO_APPROVAL_TIME = 15 * 24 * 60 * 60; 

/**
 * 检查日期是否超过指定天数
 * @param {number} timestamp - 起始时间戳（单位：秒）
 * @param {number} days - 天数
 * @returns {boolean} - 如果起始时间+天数超过当前时间，返回true
 */
function isExpired(timestamp, days) {
    // 将时间戳转换为Date对象，确保时区正确
    const startDate = new Date(timestamp * 1000);
    const currentDate = new Date();
    
    // 设置截止日期（startDate + days天）
    const deadlineDate = new Date(startDate);
    deadlineDate.setDate(startDate.getDate() + days);
    
    // 检查当前日期是否超过截止日期
    return currentDate >= deadlineDate;
}

/**
 * 计算剩余天数
 * @param {number} timestamp - 起始时间戳（单位：秒）
 * @param {number} days - 总天数
 * @returns {number} - 剩余天数（向上取整）
 */
function getRemainingDays(timestamp, days) {
    const startDate = new Date(timestamp * 1000);
    const currentDate = new Date();
    
    const deadlineDate = new Date(startDate);
    deadlineDate.setDate(startDate.getDate() + days);
    
    const remainingTime = deadlineDate - currentDate;
    return Math.max(0, Math.ceil(remainingTime / (24 * 60 * 60 * 1000)));
}

/**
 * 自动审核实名认证
 * 将超过15天未审核的用户标记为外来学生
 */
async function autoApproveNicknames() {
    try {
        // 查找所有已提交实名认证但未被审核的用户
        const users = await User.find({
            where: {
                permission: null
            }
        });
        
        // 筛选出符合条件的用户：有nickname且提交时间超过15天
        const usersToApprove = users.filter(
            user => user.nickname && 
                    user.nickname_time && 
                    isExpired(user.nickname_time, 15) &&
                    !user.username.startsWith('bannedUser')
        );
        
        // 自动审核为外来学生
        for (let user of usersToApprove) {
            user.permission = 0; // 设置为外来学生
            await user.save();
            
            syzoj.log(`用户 ${user.username} (ID: ${user.id}) 实名认证超过15天未审核，已自动设置为外来学生`);
        }
        
        if (usersToApprove.length > 0) {
            syzoj.log(`自动审核任务完成，共处理 ${usersToApprove.length} 个用户`);
        }
    } catch (e) {
        syzoj.log(`自动审核任务出错: ${e}`);
    }
}

// 启动定时任务，每24小时执行一次
setInterval(autoApproveNicknames, 24 * 60 * 60 * 1000);

// 服务启动时执行一次
setTimeout(autoApproveNicknames, 10000); 