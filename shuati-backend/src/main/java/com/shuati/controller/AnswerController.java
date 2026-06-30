package com.shuati.controller;

import com.shuati.dto.AnswerRequest;
import com.shuati.dto.AnswerResultDto;
import com.shuati.dto.ApiResult;
import com.shuati.service.AnswerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/answers")
@RequiredArgsConstructor
@Slf4j
public class AnswerController {

    private final AnswerService answerService;

    @PostMapping
    public ApiResult<AnswerResultDto> submit(@RequestBody @Valid AnswerRequest request) {
        long start = System.nanoTime();
        try {
            return ApiResult.ok(answerService.submitAnswer(request));
        } finally {
            log.info("[submit total http] {} ms", (System.nanoTime() - start) / 1_000_000);
        }

    }

}
