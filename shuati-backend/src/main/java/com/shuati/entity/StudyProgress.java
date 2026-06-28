package com.shuati.entity;

import lombok.Data;

@Data
public class StudyProgress {

    private Long id;
    private Long userId;
    private Long subjectId;
    private Long knowledgePointId;
    private Integer practicedCount;
    private Integer correctCount;
    private Integer masteryRate;
}
