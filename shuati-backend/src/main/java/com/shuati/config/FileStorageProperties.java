package com.shuati.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "file.storage")
public class FileStorageProperties {

    private String uploadDir = "uploads";
    private String avatarDir = "avatars";
    private long maxAvatarSize = 2 * 1024 * 1024;
}
