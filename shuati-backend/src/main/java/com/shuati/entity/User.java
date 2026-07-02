package com.shuati.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.shuati.enums.UserRole;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class User {

    private Long id;
    private UserRole role;

    @JsonIgnore
    private String openid;

    private String phone;
    private String nickname;
    private String avatar;
    private String grade;
    private String school;

    @JsonIgnore
    private String token;

    @JsonIgnore
    private LocalDateTime tokenExpireAt;

    private LocalDateTime createdAt;
}
