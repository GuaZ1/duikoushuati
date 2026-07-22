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
    // 错题本专项练习时返回：该题当前的掌握权重（0~5），普通练习为 null
    private Integer weight;
    private List<PracticeQuestionOptionDto> options = new ArrayList<>();
}
