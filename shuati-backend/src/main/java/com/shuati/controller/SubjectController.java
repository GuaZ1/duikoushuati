package com.shuati.controller;

import com.shuati.dto.ApiResult;
import com.shuati.entity.KnowledgePoint;
import com.shuati.entity.Subject;
import com.shuati.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    public ApiResult<List<Subject>> list() {
        return ApiResult.ok(subjectService.list());
    }

    @GetMapping("/{subjectId}/knowledge-points")
    public ApiResult<List<KnowledgePoint>> listKnowledgePoints(@PathVariable Long subjectId) {
        return ApiResult.ok(subjectService.listKnowledgePoints(subjectId));
    }
}
