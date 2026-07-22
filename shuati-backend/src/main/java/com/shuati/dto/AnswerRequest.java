package com.shuati.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AnswerRequest {

    @NotNull
    private Long questionId;

    private String answer;

    // 练习模式：传 "WRONGBOOK" 表示错题本专项练习，走 weight 累计逻辑；为空则为普通练习
    private String mode;
}
