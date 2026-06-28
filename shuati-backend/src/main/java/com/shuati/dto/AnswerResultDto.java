package com.shuati.dto;

import com.shuati.enums.CorrectStatus;
import lombok.Data;

@Data
public class AnswerResultDto {
    private CorrectStatus correctStatus;
    private String correctAnswer;
    private String analysis;
    private Integer score;
}
