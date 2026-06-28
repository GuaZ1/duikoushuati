package com.shuati.dto;

import com.shuati.enums.QuestionType;
import lombok.Data;

import java.util.List;

@Data
public class QuestionDto {
    private Long id;
    private Long subjectId;
    private String subjectName;
    private String knowledgePointIds;
    private QuestionType type;
    private Integer difficulty;
    private String content;
    private String answer;
    private String analysis;
    private Integer score;
    private String source;
    private List<QuestionOptionDto> options;
}
