package com.shuati.controller;

import com.shuati.dto.ApiResult;
import com.shuati.dto.ProgressDto;
import com.shuati.dto.WrongNotebookDto;
import com.shuati.entity.User;
import com.shuati.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ApiResult<User> info(@PathVariable Long id) {
        return ApiResult.ok(userService.info(id));
    }

    @GetMapping("/{id}/progress")
    public ApiResult<List<ProgressDto>> progress(@PathVariable Long id,
                                                  @RequestParam(required = false) Long subjectId) {
        return ApiResult.ok(userService.progress(id, subjectId));
    }

    @GetMapping("/{id}/wrongbook")
    public ApiResult<List<WrongNotebookDto>> wrongBook(@PathVariable Long id) {
        return ApiResult.ok(userService.wrongBook(id));
    }
}
