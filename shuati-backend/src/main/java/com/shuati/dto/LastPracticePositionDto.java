package com.shuati.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LastPracticePositionDto {

    private Long subjectId;
    private String subjectName;
    private Long questionId;
    private LocalDateTime lastPracticeAt;
    private boolean valid;
}
