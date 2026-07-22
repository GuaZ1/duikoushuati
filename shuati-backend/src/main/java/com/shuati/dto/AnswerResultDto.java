package com.shuati.dto;

import com.shuati.enums.CorrectStatus;
import lombok.Data;

@Data
public class AnswerResultDto {
    private CorrectStatus correctStatus;
    private String correctAnswer;
    private String analysis;
    private Integer score;
    // 错题本专项练习时返回：答题后该题的最新权重（0~5）与是否已掌握，普通练习为 null
    private Integer weight;
    private Boolean mastered;
}
