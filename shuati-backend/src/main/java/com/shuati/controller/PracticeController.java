package com.shuati.controller;

import com.shuati.context.UserContext;
import com.shuati.dto.ApiResult;
import com.shuati.dto.LastPracticePositionDto;
import com.shuati.service.PracticePositionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
public class PracticeController {

    private final PracticePositionService practicePositionService;

    @GetMapping("/last-position")
    public ApiResult<LastPracticePositionDto> lastPosition() {
        return ApiResult.ok(practicePositionService.getLastPosition(UserContext.getUserId()));
    }
}
