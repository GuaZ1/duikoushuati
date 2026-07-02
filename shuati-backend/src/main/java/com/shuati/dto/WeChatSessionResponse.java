package com.shuati.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class WeChatSessionResponse {

    private String openid;
    @JsonProperty("session_key")
    private String sessionKey;
    private String unionid;

    @JsonProperty("errcode")
    private Integer errCode;

    @JsonProperty("errmsg")
    private String errMsg;
}
