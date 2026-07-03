package com.shuati.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserLastPractice {

    private Long id;
    private Long userId;
    private Long subjectId;
    private Long questionId;
    private LocalDateTime lastPracticeAt;
}
