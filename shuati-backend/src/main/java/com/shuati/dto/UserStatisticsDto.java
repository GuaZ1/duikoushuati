package com.shuati.dto;

import lombok.Data;

@Data
public class UserStatisticsDto {
    private Integer todayCount;
    private Integer totalCount;
    private Integer correctRate;
}
