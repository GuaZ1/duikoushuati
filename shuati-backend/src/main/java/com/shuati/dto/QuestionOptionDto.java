package com.shuati.dto;

import lombok.Data;

@Data
public class QuestionOptionDto {
    private Long id;
    private String optionKey;
    private String content;
    private Boolean isCorrect;
}
