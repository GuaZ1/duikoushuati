package com.shuati.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuati.config.WeChatProperties;
import com.shuati.dto.LoginResponse;
import com.shuati.dto.WeChatSessionResponse;
import com.shuati.entity.User;
import com.shuati.enums.UserRole;
import com.shuati.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final long TOKEN_EXPIRE_DAYS = 7;

    private final WeChatProperties weChatProperties;
    private final UserMapper userMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public LoginResponse loginByWeChat(String code, String nickname, String avatarUrl) {
        if (weChatProperties.getAppid() == null || weChatProperties.getAppid().isBlank()
                || weChatProperties.getSecret() == null || weChatProperties.getSecret().isBlank()) {
            throw new IllegalStateException("微信 AppID 或 Secret 未配置");
        }

        String url = UriComponentsBuilder
                .fromHttpUrl("https://api.weixin.qq.com/sns/jscode2session")
                .queryParam("appid", weChatProperties.getAppid())
                .queryParam("secret", weChatProperties.getSecret())
                .queryParam("js_code", code)
                .queryParam("grant_type", "authorization_code")
                .toUriString();

        String responseBody = restTemplate.getForObject(url, String.class);
        if (responseBody == null || responseBody.isBlank()) {
            throw new IllegalArgumentException("微信登录失败，返回为空");
        }

        WeChatSessionResponse session;
        try {
            session = new ObjectMapper().readValue(responseBody, WeChatSessionResponse.class);
        } catch (Exception e) {
            log.warn("微信登录返回无法解析: {}", responseBody);
            throw new IllegalArgumentException("微信登录失败");
        }

        if (session.getErrCode() != null && session.getErrCode() != 0) {
            throw new IllegalArgumentException(session.getErrMsg() != null ? session.getErrMsg() : "微信登录失败");
        }

        if (session.getOpenid() == null || session.getOpenid().isBlank()) {
            throw new IllegalArgumentException("微信登录失败，未获取到 openid");
        }

        User user = userMapper.findByOpenid(session.getOpenid());
        if (user == null) {
            user = new User();
            user.setRole(UserRole.STUDENT);
            user.setOpenid(session.getOpenid());
            user.setNickname(defaultIfBlank(nickname, "微信用户"));
            user.setAvatar(avatarUrl);
            user.setCreatedAt(LocalDateTime.now());
            userMapper.insert(user);
        } else {
            if (nickname != null && !nickname.isBlank()) {
                user.setNickname(nickname);
            }
            if (avatarUrl != null && !avatarUrl.isBlank()) {
                user.setAvatar(avatarUrl);
            }
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime expireAt = LocalDateTime.now().plusDays(TOKEN_EXPIRE_DAYS);
        user.setToken(token);
        user.setTokenExpireAt(expireAt);
        userMapper.update(user);

        long expiresInSeconds = TOKEN_EXPIRE_DAYS * 24 * 60 * 60;
        return new LoginResponse(token, expiresInSeconds, user);
    }

    private String defaultIfBlank(String value, String defaultValue) {
        return value != null && !value.isBlank() ? value : defaultValue;
    }

    @Transactional
    public LoginResponse loginByH5(String nickname, String avatarUrl) {
        String devOpenid = "h5-dev-user";
        User user = userMapper.findByOpenid(devOpenid);
        if (user == null) {
            user = new User();
            user.setRole(UserRole.STUDENT);
            user.setOpenid(devOpenid);
            user.setNickname(defaultIfBlank(nickname, "H5测试用户"));
            user.setAvatar(avatarUrl);
            user.setCreatedAt(LocalDateTime.now());
            userMapper.insert(user);
        } else {
            if (nickname != null && !nickname.isBlank()) {
                user.setNickname(nickname);
            }
            if (avatarUrl != null && !avatarUrl.isBlank()) {
                user.setAvatar(avatarUrl);
            }
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime expireAt = LocalDateTime.now().plusDays(TOKEN_EXPIRE_DAYS);
        user.setToken(token);
        user.setTokenExpireAt(expireAt);
        userMapper.update(user);

        long expiresInSeconds = TOKEN_EXPIRE_DAYS * 24 * 60 * 60;
        return new LoginResponse(token, expiresInSeconds, user);
    }
}
