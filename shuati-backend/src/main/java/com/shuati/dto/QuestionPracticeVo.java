package com.shuati.dto;

import com.shuati.enums.QuestionType;
import lombok.Data;

@Data
public class QuestionPracticeVo {
    private Long questionId;
    private Long subjectId;
    private String subjectName;
    private QuestionType type;
    private Integer difficulty;
    private String content;
    private Integer score;
    private Long optionId;
    private String optionKey;
    private String optionContent;
}
