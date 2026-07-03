package com.shuati.service.impl;

import com.shuati.dto.LastPracticePositionDto;
import com.shuati.entity.Question;
import com.shuati.entity.Subject;
import com.shuati.entity.UserLastPractice;
import com.shuati.mapper.SubjectMapper;
import com.shuati.mapper.UserLastPracticeMapper;
import com.shuati.service.PracticePositionService;
import com.shuati.service.QuestionCacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PracticePositionServiceImpl implements PracticePositionService {

    private final UserLastPracticeMapper userLastPracticeMapper;
    private final SubjectMapper subjectMapper;
    private final QuestionCacheService questionCacheService;

    @Override
    public LastPracticePositionDto getLastPosition(Long userId) {
        if (userId == null) {
            return null;
        }
        UserLastPractice position = userLastPracticeMapper.findLatestByUserId(userId);
        if (position == null) {
            return null;
        }

        LastPracticePositionDto dto = new LastPracticePositionDto();
        dto.setSubjectId(position.getSubjectId());
        dto.setQuestionId(position.getQuestionId());
        dto.setLastPracticeAt(position.getLastPracticeAt());

        Subject subject = subjectMapper.findById(position.getSubjectId());
        dto.setSubjectName(subject == null ? "" : subject.getName());

        Question question = questionCacheService.getQuestionById(position.getQuestionId());
        dto.setValid(question != null);

        return dto;
    }
}
