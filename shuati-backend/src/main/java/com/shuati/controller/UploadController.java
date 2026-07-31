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
import java.util.Base64;
import java.util.Map;
import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@PublicApi
@RequiredArgsConstructor
public class UploadController {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    // 扩展名 → MIME 类型映射，用于 base64 接口拼 data URL
    private static final Map<String, String> EXT_TO_MIME = Map.of(
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png",
            "gif", "image/gif",
            "webp", "image/webp"
    );

    private final FileStorageProperties fileStorageProperties;

    /**
     * H5 multipart 上传：直接读字节转 base64 返回 data URL，不再写盘
     */
    @PostMapping("/upload/avatar")
    public ApiResult<String> uploadAvatar(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ApiResult.fail("头像文件不能为空");
        }
        if (file.getSize() > fileStorageProperties.getMaxAvatarSize()) {
            return ApiResult.fail("头像文件大小不能超过 2MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            return ApiResult.fail("仅支持 JPG、PNG、GIF、WEBP 格式的图片");
        }

        try {
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());
            return ApiResult.ok("data:" + contentType + ";base64," + base64);
        } catch (IOException e) {
            log.error("头像处理失败", e);
            return ApiResult.fail("头像上传失败，请稍后重试");
        }
    }

    /**
     * 微信小程序 base64 上传：拼装 data URL 返回，不写盘
     */
    @PostMapping("/upload/avatar/base64")
    public ApiResult<String> uploadAvatarBase64(@RequestBody Map<String, String> body) {
        String base64 = body.get("base64");
        String ext = body.getOrDefault("ext", "jpg").toLowerCase();

        if (base64 == null || base64.isBlank()) {
            return ApiResult.fail("头像数据不能为空");
        }

        String mimeType = EXT_TO_MIME.get(ext);
        if (mimeType == null) {
            return ApiResult.fail("仅支持 JPG、PNG、GIF、WEBP 格式的图片");
        }

        try {
            byte[] bytes = Base64.getDecoder().decode(base64);
            if (bytes.length > fileStorageProperties.getMaxAvatarSize()) {
                return ApiResult.fail("头像文件大小不能超过 2MB");
            }
            return ApiResult.ok("data:" + mimeType + ";base64," + base64);
        } catch (IllegalArgumentException e) {
            log.warn("base64 解码失败", e);
            return ApiResult.fail("头像数据格式错误");
        }
    }
}
