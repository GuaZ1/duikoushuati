-- 2026-07-01 微信登录与鉴权字段更新
USE shuati;

ALTER TABLE app_user
    ADD COLUMN openid VARCHAR(64) AFTER role,
    ADD COLUMN token VARCHAR(64) AFTER school,
    ADD COLUMN token_expire_at DATETIME AFTER token,
    ADD UNIQUE KEY uk_openid (openid),
    ADD KEY idx_token (token);