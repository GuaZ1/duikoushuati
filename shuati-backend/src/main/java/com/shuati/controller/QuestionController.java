package com.shuati.controller;

import com.shuati.annotation.RequireRole;
import com.shuati.dto.ApiResult;
import com.shuati.dto.PracticeQuestionDto;
import com.shuati.dto.QuestionDto;
import com.shuati.enums.QuestionType;
import com.shuati.enums.UserRole;
import com.shuati.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;
    private final DataSource dataSource;

    @GetMapping("/debug-db")
    public ApiResult<Map<String, Object>> debugDb() {
        Map<String, Object> result = new LinkedHashMap<>();
        try (var conn = dataSource.getConnection();
             var stmt = conn.createStatement()) {

            result.put("url", conn.getMetaData().getURL());
            result.put("user", conn.getMetaData().getUserName());

            var rs = stmt.executeQuery("SELECT DATABASE()");
            rs.next();
            result.put("database", rs.getString(1));

            rs = stmt.executeQuery("SHOW TABLES");
            StringBuilder tables = new StringBuilder();
            while (rs.next()) tables.append(rs.getString(1)).append(", ");
            result.put("tables", tables.toString());

            rs = stmt.executeQuery("SELECT COUNT(*) FROM question");
            rs.next();
            result.put("question_count", rs.getInt(1));

            rs = stmt.executeQuery("SELECT COUNT(*) FROM subject");
            rs.next();
            result.put("subject_count", rs.getInt(1));

            rs = stmt.executeQuery("SELECT COUNT(*) FROM app_user");
            rs.next();
            result.put("app_user_count", rs.getInt(1));

            rs = stmt.executeQuery("SELECT id, name FROM subject ORDER BY id");
            StringBuilder subjects = new StringBuilder();
            while (rs.next()) subjects.append(rs.getLong(1)).append(":").append(rs.getString(2)).append(", ");
            result.put("subjects", subjects.toString());

        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        return ApiResult.ok(result);
    }

    @GetMapping
    public ApiResult<List<QuestionDto>> list(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Integer difficulty,
            @RequestParam(required = false) QuestionType type) {
        return ApiResult.ok(questionService.list(subjectId, difficulty, type));
    }

    @GetMapping("/practice")
    public ApiResult<List<PracticeQuestionDto>> listForPractice(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Integer difficulty,
            @RequestParam(required = false) QuestionType type) {
        return ApiResult.ok(questionService.listForPractice(subjectId, difficulty, type));
    }

    @GetMapping("/{id}")
    public ApiResult<QuestionDto> detail(@PathVariable Long id) {
        return ApiResult.ok(questionService.detail(id));
    }

    @PostMapping
    @RequireRole(UserRole.TEACHER)
    public ApiResult<Long> create(@RequestBody QuestionDto dto) {
        return ApiResult.ok(questionService.create(dto));
    }

    @PutMapping("/{id}")
    @RequireRole(UserRole.TEACHER)
    public ApiResult<Void> update(@PathVariable Long id, @RequestBody QuestionDto dto) {
        questionService.update(id, dto);
        return ApiResult.ok(null);
    }

    @DeleteMapping("/{id}")
    @RequireRole(UserRole.TEACHER)
    public ApiResult<Void> delete(@PathVariable Long id) {
        questionService.delete(id);
        return ApiResult.ok(null);
    }
}
