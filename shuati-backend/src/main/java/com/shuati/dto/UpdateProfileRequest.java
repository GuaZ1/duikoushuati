package com.shuati.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(max = 64, message = "昵称长度不能超过64个字符")
    private String nickname;

    // avatar 为 base64 data URI（data:image/xxx;base64,...），长度可达数百KB，不做长度限制
    private String avatar;
}
