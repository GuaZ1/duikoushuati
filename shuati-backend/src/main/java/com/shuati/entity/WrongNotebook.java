package com.shuati.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class WrongNotebook {

    private Long id;
    private Long studentId;
    private Long questionId;
    private Integer wrongCount;
    private Integer weight;
    private LocalDateTime lastWrongAt;
    private Boolean mastered;
}
