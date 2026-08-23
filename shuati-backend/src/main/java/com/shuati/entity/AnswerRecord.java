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
    // 刷题模式：PRACTICE自由练习/EXAM考试/CHAPTER章节练习/WRONGBOOK错题本
    private String mode;
    private LocalDateTime createdAt;
}
