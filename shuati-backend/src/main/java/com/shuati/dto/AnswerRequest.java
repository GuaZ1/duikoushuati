package com.shuati.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AnswerRequest {

    @NotNull
    private Long studentId;

    @NotNull
    private Long questionId;

    private String answer;
}
