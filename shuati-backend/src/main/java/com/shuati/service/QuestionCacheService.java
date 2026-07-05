package com.shuati.service;

import com.shuati.entity.Question;
import com.shuati.entity.QuestionOption;
import com.shuati.mapper.QuestionMapper;
import com.shuati.mapper.QuestionOptionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionCacheService {

    private final QuestionMapper questionMapper;
    private final QuestionOptionMapper questionOptionMapper;

    @Cacheable(value = "question", key = "#id")
    public Question getQuestionById(Long id) {
        return questionMapper.findById(id);
    }

    @Cacheable(value = "questionOptions", key = "#questionId", unless = "#result.isEmpty()")
    public List<QuestionOption> getOptionsByQuestionId(Long questionId) {
        return questionOptionMapper.findByQuestionId(questionId);
    }
}
