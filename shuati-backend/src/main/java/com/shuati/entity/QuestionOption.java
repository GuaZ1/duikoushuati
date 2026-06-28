package com.shuati.entity;

import lombok.Data;

@Data
public class QuestionOption {

    private Long id;
    private Long questionId;
    private String optionKey;
    private String content;
    private Boolean isCorrect;
}
