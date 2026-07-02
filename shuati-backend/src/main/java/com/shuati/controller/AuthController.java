package com.shuati.controller;

import com.shuati.annotation.PublicApi;
import com.shuati.dto.ApiResult;
import com.shuati.dto.LoginRequest;
import com.shuati.dto.LoginResponse;
import com.shuati.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@PublicApi
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResult<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        return ApiResult.ok(authService.loginByWeChat(request.getCode(), request.getNickname(), request.getAvatarUrl()));
    }
}
