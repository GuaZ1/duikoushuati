package com.shuati.service.impl;

import com.shuati.context.UserContext;
import com.shuati.dto.FeedbackRequest;
import com.shuati.entity.QuestionFeedback;
import com.shuati.mapper.FeedbackMapper;
import com.shuati.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private static final String DEFAULT_STATUS = "PENDING";

    private final FeedbackMapper feedbackMapper;

    @Override
    @Transactional
    public Long submitFeedback(FeedbackRequest request) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            throw new IllegalStateException("请先登录");
        }
        QuestionFeedback feedback = new QuestionFeedback();
        feedback.setQuestionId(request.getQuestionId());
        feedback.setUserId(userId);
        feedback.setContent(request.getContent());
        feedback.setStatus(DEFAULT_STATUS);
        feedback.setCreatedAt(LocalDateTime.now());
        feedbackMapper.insert(feedback);
        log.info("[submitFeedback] questionId={} userId={} feedbackId={}",
                request.getQuestionId(), userId, feedback.getId());
        return feedback.getId();
    }
}
