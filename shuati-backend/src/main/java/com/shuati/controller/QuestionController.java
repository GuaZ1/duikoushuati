package com.shuati.controller;

import com.shuati.dto.ApiResult;
import com.shuati.dto.QuestionDto;
import com.shuati.enums.QuestionType;
import com.shuati.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping
    public ApiResult<List<QuestionDto>> list(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Integer difficulty,
            @RequestParam(required = false) QuestionType type) {
        return ApiResult.ok(questionService.list(subjectId, difficulty, type));
    }

    @GetMapping("/{id}")
    public ApiResult<QuestionDto> detail(@PathVariable Long id) {
        return ApiResult.ok(questionService.detail(id));
    }

    @PostMapping
    public ApiResult<Long> create(@RequestBody QuestionDto dto) {
        return ApiResult.ok(questionService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResult<Void> update(@PathVariable Long id, @RequestBody QuestionDto dto) {
        questionService.update(id, dto);
        return ApiResult.ok(null);
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id) {
        questionService.delete(id);
        return ApiResult.ok(null);
    }
}
