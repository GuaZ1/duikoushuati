package com.shuati.controller;

import com.shuati.annotation.PublicApi;
import com.shuati.config.FileStorageProperties;
import com.shuati.dto.ApiResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@PublicApi
@RequiredArgsConstructor
public class UploadController {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    private final FileStorageProperties fileStorageProperties;

    @PostMapping("/upload/avatar")
    public ApiResult<String> uploadAvatar(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ApiResult.fail("头像文件不能为空");
        }
        if (file.getSize() > fileStorageProperties.getMaxAvatarSize()) {
            return ApiResult.fail("头像文件大小不能超过 2MB");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            return ApiResult.fail("仅支持 JPG、PNG、GIF、WEBP 格式的图片");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);
        String filename = UUID.randomUUID() + extension;

        try {
            Path targetDir = Paths.get(System.getProperty("user.dir"),
                    fileStorageProperties.getUploadDir(),
                    fileStorageProperties.getAvatarDir());
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }
            Path targetPath = targetDir.resolve(filename);
            file.transferTo(targetPath.toFile());

            String avatarUrl = "/" + fileStorageProperties.getUploadDir() + "/"
                    + fileStorageProperties.getAvatarDir() + "/" + filename;
            return ApiResult.ok(avatarUrl);
        } catch (IOException e) {
            log.error("头像上传失败", e);
            return ApiResult.fail("头像上传失败，请稍后重试");
        }
    }

    /**
     * 接收 base64 编码的头像（微信小程序云托管 callContainer 专用）
     */
    @PostMapping("/upload/avatar/base64")
    public ApiResult<String> uploadAvatarBase64(@RequestBody Map<String, String> body) {
        String base64 = body.get("base64");
        String ext = body.getOrDefault("ext", "jpg");

        if (base64 == null || base64.isBlank()) {
            return ApiResult.fail("头像数据不能为空");
        }

        // 校验扩展名白名单
        if (!Set.of("jpg", "jpeg", "png", "gif", "webp").contains(ext.toLowerCase())) {
            return ApiResult.fail("仅支持 JPG、PNG、GIF、WEBP 格式的图片");
        }

        try {
            byte[] bytes = Base64.getDecoder().decode(base64);

            if (bytes.length > fileStorageProperties.getMaxAvatarSize()) {
                return ApiResult.fail("头像文件大小不能超过 2MB");
            }

            String filename = UUID.randomUUID() + "." + ext;
            Path targetDir = Paths.get(System.getProperty("user.dir"),
                    fileStorageProperties.getUploadDir(),
                    fileStorageProperties.getAvatarDir());
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }
            Path targetPath = targetDir.resolve(filename);
            Files.write(targetPath, bytes);

            String avatarUrl = "/" + fileStorageProperties.getUploadDir() + "/"
                    + fileStorageProperties.getAvatarDir() + "/" + filename;
            return ApiResult.ok(avatarUrl);
        } catch (IllegalArgumentException e) {
            log.warn("base64 解码失败", e);
            return ApiResult.fail("头像数据格式错误");
        } catch (IOException e) {
            log.error("头像上传失败", e);
            return ApiResult.fail("头像上传失败，请稍后重试");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".png";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}
