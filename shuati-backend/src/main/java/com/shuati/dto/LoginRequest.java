package com.shuati.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "微信登录凭证不能为空")
    private String code;

    @Size(max = 64, message = "昵称长度不能超过64个字符")
    private String nickname;

    // 注册时 avatarUrl 传的是 base64 data URI（data:image/xxx;base64,...），长度可达数百KB，
    // 不能像早期外链 URL 那样限制 512 字符；大小已由上传接口按 2MB 兜底，这里不做长度限制。
    private String avatarUrl;
}
