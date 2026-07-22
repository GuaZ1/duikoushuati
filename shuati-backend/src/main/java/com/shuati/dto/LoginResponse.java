package com.shuati.dto;

import com.shuati.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private Long expiresIn;
    private User user;

    // 为 true 时表示该 openid 尚未注册，前端需引导用户填写昵称头像完成注册
    private boolean needRegister;

    public static LoginResponse of(String token, Long expiresIn, User user) {
        return new LoginResponse(token, expiresIn, user, false);
    }

    public static LoginResponse needRegister() {
        return new LoginResponse(null, null, null, true);
    }
}
