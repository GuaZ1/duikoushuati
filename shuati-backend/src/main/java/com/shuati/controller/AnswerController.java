package com.shuati.controller;

import com.shuati.dto.AnswerRequest;
import com.shuati.dto.AnswerResultDto;
import com.shuati.dto.ApiResult;
import com.shuati.service.AnswerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/answers")
@RequiredArgsConstructor
public class AnswerController {

    private final AnswerService answerService;

    @PostMapping
    public ApiResult<AnswerResultDto> submit(@RequestBody @Valid AnswerRequest request) {
        return ApiResult.ok(answerService.submitAnswer(request));
    }
}
