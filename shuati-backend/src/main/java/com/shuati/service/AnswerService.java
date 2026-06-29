package com.shuati.service;

import com.shuati.dto.AnswerRequest;
import com.shuati.dto.AnswerResultDto;

public interface AnswerService {

    AnswerResultDto submitAnswer(AnswerRequest request);
}
