package com.shuati.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class QuestionFeedback {

    private Long id;
    private Long questionId;
    private Long userId;
    private String content;
    // PENDING待处理 / RESOLVED已处理 / IGNORED已忽略；提交时默认 PENDING
    private String status;
    private LocalDateTime createdAt;
}
