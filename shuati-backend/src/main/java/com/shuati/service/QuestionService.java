package com.shuati.service;

import com.shuati.dto.QuestionDto;
import com.shuati.enums.QuestionType;

import java.util.List;

public interface QuestionService {

    List<QuestionDto> list(Long subjectId, Integer difficulty, QuestionType type);

    QuestionDto detail(Long id);

    Long create(QuestionDto dto);

    void update(Long id, QuestionDto dto);

    void delete(Long id);
}
