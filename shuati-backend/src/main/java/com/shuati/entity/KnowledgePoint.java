package com.shuati.entity;

import lombok.Data;

@Data
public class KnowledgePoint {

    private Long id;
    private Long subjectId;
    private Long parentId;
    private String name;
    private Integer level;
}
