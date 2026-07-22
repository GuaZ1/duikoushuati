package com.shuati.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(max = 64, message = "昵称长度不能超过64个字符")
    private String nickname;

    @Size(max = 512, message = "头像URL长度不能超过512个字符")
    private String avatar;
}
