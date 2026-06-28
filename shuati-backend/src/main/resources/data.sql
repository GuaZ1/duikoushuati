SET NAMES utf8mb4;

-- 学科
INSERT INTO subject (id, name, code, grade_range) VALUES
(1, '数学', 'math', '初中,高中'),
(2, '物理', 'physics', '初中,高中'),
(3, '英语', 'english', '初中,高中')
ON DUPLICATE KEY UPDATE name = VALUES(name), code = VALUES(code), grade_range = VALUES(grade_range);

-- 知识点
INSERT INTO knowledge_point (id, subject_id, parent_id, name, level) VALUES
(1, 1, NULL, '函数', 1),
(2, 1, NULL, '几何', 1),
(3, 2, NULL, '力学', 1)
ON DUPLICATE KEY UPDATE subject_id = VALUES(subject_id), parent_id = VALUES(parent_id), name = VALUES(name), level = VALUES(level);

-- 示例学生
INSERT INTO app_user (id, role, phone, nickname, avatar, grade, school, created_at) VALUES
(1, 'STUDENT', '13800138000', '小明', '', '高一', '示例中学', NOW())
ON DUPLICATE KEY UPDATE role = VALUES(role), phone = VALUES(phone), nickname = VALUES(nickname), avatar = VALUES(avatar), grade = VALUES(grade), school = VALUES(school);

-- 示例题目
INSERT INTO question (id, subject_id, knowledge_point_ids, type, difficulty, content, answer, analysis, score, source) VALUES
(1, 1, '1', 'SINGLE_CHOICE', 2, '函数 f(x)=x² 的图像开口方向是？', 'A', '二次项系数为正，抛物线开口向上。', 5, '系统题库'),
(2, 1, '2', 'SINGLE_CHOICE', 3, '等边三角形的每个内角是多少度？', 'B', '等边三角形三个内角相等，和为180°，每个角60°。', 5, '系统题库'),
(3, 2, '3', 'SINGLE_CHOICE', 2, '牛顿第一定律又称为？', 'C', '牛顿第一定律揭示了物体保持原有运动状态的性质，又称惯性定律。', 5, '系统题库')
ON DUPLICATE KEY UPDATE subject_id = VALUES(subject_id), knowledge_point_ids = VALUES(knowledge_point_ids), type = VALUES(type), difficulty = VALUES(difficulty), content = VALUES(content), answer = VALUES(answer), analysis = VALUES(analysis), score = VALUES(score), source = VALUES(source);

-- 示例选项
INSERT INTO question_option (id, question_id, option_key, content, is_correct) VALUES
(1, 1, 'A', '向上', true),
(2, 1, 'B', '向下', false),
(3, 1, 'C', '向左', false),
(4, 1, 'D', '向右', false),
(5, 2, 'A', '45°', false),
(6, 2, 'B', '60°', true),
(7, 2, 'C', '90°', false),
(8, 2, 'D', '120°', false),
(9, 3, 'A', '作用力与反作用力定律', false),
(10, 3, 'B', '万有引力定律', false),
(11, 3, 'C', '惯性定律', true),
(12, 3, 'D', '能量守恒定律', false)
ON DUPLICATE KEY UPDATE question_id = VALUES(question_id), option_key = VALUES(option_key), content = VALUES(content), is_correct = VALUES(is_correct);
