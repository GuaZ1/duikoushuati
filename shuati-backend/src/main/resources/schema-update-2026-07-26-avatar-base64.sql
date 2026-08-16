-- 头像改为 base64 直存数据库，不再依赖容器本地文件系统
-- 旧数据（/uploads/avatars/xxx.jpg 形式的相对路径）会失效，可视为可丢弃的测试数据
ALTER TABLE app_user MODIFY COLUMN avatar MEDIUMTEXT COMMENT '头像base64，格式：data:image/xxx;base64,...';
