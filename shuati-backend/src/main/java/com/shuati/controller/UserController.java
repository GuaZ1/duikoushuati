package com.shuati.controller;

import com.shuati.context.UserContext;
import com.shuati.dto.ApiResult;
import com.shuati.dto.ProgressDto;
import com.shuati.dto.UpdateProfileRequest;
import com.shuati.dto.UserStatisticsDto;
import com.shuati.dto.WrongNotebookDto;
import com.shuati.entity.User;
import com.shuati.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResult<User> me() {
        return ApiResult.ok(UserContext.get());
    }

    @PutMapping("/me")
    public ApiResult<User> updateMe(@RequestBody @Valid UpdateProfileRequest request) {
        return ApiResult.ok(userService.updateProfile(UserContext.getUserId(), request.getNickname(), request.getAvatar()));
    }

    @GetMapping("/me/progress")
    public ApiResult<List<ProgressDto>> myProgress(@RequestParam(required = false) Long subjectId) {
        return ApiResult.ok(userService.progress(UserContext.getUserId(), subjectId));
    }

    @GetMapping("/me/wrongbook")
    public ApiResult<List<WrongNotebookDto>> myWrongBook() {
        return ApiResult.ok(userService.wrongBook(UserContext.getUserId()));
    }

    @GetMapping("/me/statistics")
    public ApiResult<UserStatisticsDto> myStatistics() {
        return ApiResult.ok(userService.statistics(UserContext.getUserId()));
    }

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
