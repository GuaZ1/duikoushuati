package com.shuati.entity;

import com.shuati.enums.UserRole;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class User {

    private Long id;
    private UserRole role;
    private String phone;
    private String nickname;
    private String avatar;
    private String grade;
    private String school;
    private LocalDateTime createdAt;
}
