package com.shuati.dto;

import lombok.Data;

@Data
public class ProgressDto {
    private Long subjectId;
    private String subjectName;
    private Long knowledgePointId;
    private String knowledgePointName;
    private Integer practicedCount;
    private Integer correctCount;
    private Integer masteryRate;
}
