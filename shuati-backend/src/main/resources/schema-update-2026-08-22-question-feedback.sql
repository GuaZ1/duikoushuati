-- 题目问题反馈表：学生做题时点击「题目有问题？点击反馈」提交的文字反馈。
-- 教师端后续可基于 status 字段做处理后台（PENDING/RESOLVED/IGNORED）。
-- 当前阶段只做学生提交能力，不提前实现管理后台（不过早设计）。
CREATE TABLE IF NOT EXISTS question_feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_id BIGINT NOT NULL COMMENT '反馈所属题目',
    user_id BIGINT NOT NULL COMMENT '提交反馈的用户',
    content TEXT NOT NULL COMMENT '反馈文字内容',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING待处理/RESOLVED已处理/IGNORED已忽略',
    created_at DATETIME NOT NULL COMMENT '提交时间',
    KEY idx_question (question_id),
    KEY idx_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目问题反馈';
