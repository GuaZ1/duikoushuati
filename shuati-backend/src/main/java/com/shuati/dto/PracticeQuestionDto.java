package com.shuati.dto;

import com.shuati.enums.QuestionType;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class PracticeQuestionDto {
    private Long id;
    private Long subjectId;
    private String subjectName;
    private QuestionType type;
    private Integer difficulty;
    private String content;
    private Integer score;
    private List<PracticeQuestionOptionDto> options = new ArrayList<>();
}
