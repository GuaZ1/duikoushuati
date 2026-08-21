package com.shuati.service;

import com.shuati.dto.FeedbackRequest;

public interface FeedbackService {

    /**
     * 学生提交一条题目反馈。
     * 返回新插入的反馈 id，供前端提示用户提交成功。
     */
    Long submitFeedback(FeedbackRequest request);
}
