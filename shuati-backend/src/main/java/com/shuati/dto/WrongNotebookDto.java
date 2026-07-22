package com.shuati.dto;

import com.shuati.enums.QuestionType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class WrongNotebookDto {
    private Long questionId;
    private String content;
    private QuestionType type;
    private Integer difficulty;
    private Integer wrongCount;
    private Integer weight;
    private LocalDateTime lastWrongAt;
    private Boolean mastered;
}
