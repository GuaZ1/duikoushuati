package com.shuati.controller;

import com.shuati.dto.ApiResult;
import com.shuati.dto.FeedbackRequest;
import com.shuati.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
@Slf4j
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    public ApiResult<Long> submit(@RequestBody @Valid FeedbackRequest request) {
        return ApiResult.ok(feedbackService.submitFeedback(request));
    }
}
