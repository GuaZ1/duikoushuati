package com.shuati.entity;

import com.shuati.enums.CorrectStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AnswerRecord {

    private Long id;
    private Long studentId;
    private Long questionId;
    private String studentAnswer;
    private CorrectStatus correctStatus;
    private Integer score;
    private LocalDateTime createdAt;
}
